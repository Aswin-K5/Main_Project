from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import supervision as sv
from roboflow import Roboflow
from io import BytesIO
import os
import uvicorn
import base64
import uuid
from typing import Optional
import sqlite3
from datetime import datetime, timedelta 

def init_db():
    """Initialize the SQLite database and create tables if they don't exist"""
    conn = sqlite3.connect('meter_readings.db')
    cursor = conn.cursor()
    
    # Create meter readings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS meter_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_id TEXT NOT NULL,
        reading_value TEXT NOT NULL,
        reading_type TEXT NOT NULL,
        reading_date TIMESTAMP NOT NULL,
        original_image_path TEXT NOT NULL,
        processed_image_path TEXT NOT NULL
    )
    ''')
    
    # Create consumption records table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS consumption_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        current_reading_id INTEGER NOT NULL,
        previous_reading_id INTEGER NOT NULL,
        consumption_value REAL NOT NULL,
        calculation_date TIMESTAMP NOT NULL,
        FOREIGN KEY (current_reading_id) REFERENCES meter_readings (id),
        FOREIGN KEY (previous_reading_id) REFERENCES meter_readings (id)
    )
    ''')
    
    conn.commit()
    conn.close()

def save_meter_reading(image_id, reading_value, reading_type, original_path, processed_path):
    """Save a meter reading to the database"""
    conn = sqlite3.connect('meter_readings.db')
    cursor = conn.cursor()
    
    cursor.execute('''
    INSERT INTO meter_readings 
    (image_id, reading_value, reading_type, reading_date, original_image_path, processed_image_path)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', (image_id, reading_value, reading_type, datetime.now(), original_path, processed_path))
    
    # Get the ID of the inserted reading
    reading_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    return reading_id

def save_consumption_record(current_reading_id, previous_reading_id, consumption_value):
    """Save a consumption record to the database"""
    conn = sqlite3.connect('meter_readings.db')
    cursor = conn.cursor()
    
    cursor.execute('''
    INSERT INTO consumption_records 
    (current_reading_id, previous_reading_id, consumption_value, calculation_date)
    VALUES (?, ?, ?, ?)
    ''', (current_reading_id, previous_reading_id, consumption_value, datetime.now()))
    
    consumption_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    return consumption_id

app = FastAPI()

# Add CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a directory to store temporary images
os.makedirs("temp_images", exist_ok=True)

# Serve static files
app.mount("/images", StaticFiles(directory="temp_images"), name="images")
# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Roboflow with API key
rf = Roboflow(api_key="q9HVBUN26Y1xU5uFjRWl")
project = rf.workspace().project("electricity-meter-reading")
model = project.version(2).model

@app.get("/")
async def health_check():
    return {"status": "healthy"}

async def process_meter_image(image_content, image_id, image_type):
    """
    Process a meter image with Roboflow model and return the reading
    """
    # Read image
    np_img = np.frombuffer(image_content, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail=f"Invalid {image_type} image format")

    # Define file paths
    temp_path = f"temp_images/{image_id}_{image_type}.jpg"
    result_path = f"temp_images/{image_id}_{image_type}_result.jpg"
    
    # Save temp image
    cv2.imwrite(temp_path, img)

    try:
        # Run prediction using Roboflow model
        result = model.predict(temp_path, confidence=40, overlap=30).json()["predictions"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed for {image_type} image: {str(e)}")

    # Extract bounding box info
    detections_data = []
    for i, pred in enumerate(result):
        x = pred['x']
        y = pred['y']
        w = pred['width']
        h = pred['height']
        confidence = pred['confidence']
        class_label = pred['class']

        x1 = x - w / 2
        y1 = y - h / 2
        x2 = x + w / 2
        y2 = y + h / 2

        detections_data.append((x1, class_label, [x1, y1, x2, y2], confidence, i))

    # Sort detections by x1 coordinate (left to right)
    detections_data.sort(key=lambda x: x[0])

    # Extract sorted values
    labels = [d[1] for d in detections_data]
    boxes = np.array([d[2] for d in detections_data]) if detections_data else np.empty((0, 4))
    confidence_scores = np.array([d[3] for d in detections_data]) if detections_data else np.empty(0)
    class_ids = np.array([d[4] for d in detections_data]) if detections_data else np.empty(0)

    # Create Supervision Detections object
    detections = sv.Detections(
        xyxy=boxes,
        confidence=confidence_scores,
        class_id=class_ids
    )

    # Convert sorted labels to a single integer meter reading
    meter_reading = "".join(labels)

    # Annotate image
    label_annotator = sv.LabelAnnotator()
    bounding_box_annotator = sv.BoxAnnotator()
    annotated_image = bounding_box_annotator.annotate(scene=img.copy(), detections=detections)
    annotated_image = label_annotator.annotate(scene=annotated_image, detections=detections, labels=labels)

    # Resize final image
    new_width = 600
    new_height = 300
    resized_image = cv2.resize(annotated_image, (new_width, new_height))

    # Save the processed image
    cv2.imwrite(result_path, resized_image)

    # Convert image to base64 for direct embedding
    _, img_encoded = cv2.imencode('.jpg', resized_image)
    img_base64 = base64.b64encode(img_encoded).decode("utf-8")

    # Generate URLs
    image_url = f"/images/{image_id}_{image_type}.jpg"
    result_url = f"/images/{image_id}_{image_type}_result.jpg"

    return {
        "meter_reading": meter_reading,
        "processed_image_base64": img_base64,
        "original_image_url": image_url,
        "processed_image_url": result_url,
    }

@app.post("/predict")
async def predict(
    current_image: UploadFile = File(...),
    previous_meter_reading: Optional[float] = Form(None)
):
    """
    Process meter image and return detected reading
    """
    # Generate a unique ID for this image set
    image_id = str(uuid.uuid4())
    
    # Create temp directory if it doesn't exist
    os.makedirs("temp_images", exist_ok=True)
    
    # Process current meter image
    current_contents = await current_image.read()
    current_result = await process_meter_image(current_contents, image_id, "current")
    
    # Save current reading to database
    current_reading_id = save_meter_reading(
        image_id, 
        current_result["meter_reading"], 
        "current",
        f"temp_images/{image_id}_current.jpg",
        f"temp_images/{image_id}_current_result.jpg"
    )
    
    # Process previous meter reading if provided as a direct value
    previous_result = None
    previous_reading_id = None

    if previous_meter_reading is not None:
        # Create result dictionary with the manually entered reading
        previous_result = {
            "meter_reading": previous_meter_reading,
            "processed_image_base64": None,
            "original_image_url": None,
            "processed_image_url": None
        }
        
        # Save previous reading to database
        previous_reading_id = save_meter_reading(
            image_id, 
            previous_result["meter_reading"], 
            "previous",
            "None",  # No image file path - using string "None" instead of None
            "None"   # No result image path - using string "None" instead of None
        )
    
    # Calculate consumption if both readings are available
    consumption = None
    if previous_result:
        try:
            current_reading = float(current_result["meter_reading"])
            previous_reading = float(previous_result["meter_reading"])
            consumption = current_reading - previous_reading
            
            # Save consumption record to database
            if current_reading_id and previous_reading_id:
                save_consumption_record(current_reading_id, previous_reading_id, consumption)
                
        except (ValueError, TypeError):
            # Handle case where readings are not numeric
            consumption = "Could not calculate (non-numeric readings)"
    
    return JSONResponse(content={
        "current": {
            "meter_reading": current_result["meter_reading"],
            "processed_image_base64": current_result["processed_image_base64"],
            "original_image_url": current_result["original_image_url"],
            "processed_image_url": current_result["processed_image_url"],
        },
        "previous": previous_result if previous_result else None,
        "consumption": consumption,
        "image_id": image_id
    })

@app.get("/image/{image_id}/{image_type}")
async def get_image(image_id: str, image_type: str, processed: bool = True):
    """
    Get the processed or original image by its ID and type (current/previous)
    Set processed=false to get the original image
    """
    filename = f"{image_id}_{image_type}_result.jpg" if processed else f"{image_id}_{image_type}.jpg"
    file_path = f"temp_images/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
        
    with open(file_path, "rb") as f:
        image_data = f.read()
    
    return Response(content=image_data, media_type="image/jpeg")

@app.get("/view/{image_id}", response_class=HTMLResponse)
async def view_result(image_id: str):
    """
    Returns an HTML page displaying the original and processed images
    """
    # Check if current images exist
    current_original_path = f"temp_images/{image_id}_current.jpg"
    current_result_path = f"temp_images/{image_id}_current_result.jpg"
    
    if not (os.path.exists(current_original_path) and os.path.exists(current_result_path)):
        raise HTTPException(status_code=404, detail="Current meter images not found")
    
    # Check if previous images exist - modified for manual entry support
    has_previous = False
    previous_reading = None
    
    # Check database for previous reading info
    conn = sqlite3.connect('meter_readings.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Query for previous reading with the same image_id
    cursor.execute('''
    SELECT reading_value
    FROM meter_readings 
    WHERE image_id = ? AND reading_type = 'previous'
    LIMIT 1
    ''', (image_id,))
    
    previous_reading_row = cursor.fetchone()
    if previous_reading_row:
        has_previous = True
        previous_reading = previous_reading_row['reading_value']
    
    conn.close()
    
    # Create HTML content based on available reading
    previous_section = ""
    if has_previous:
        # Check if actual images exist
        has_previous_images = os.path.exists(f"temp_images/{image_id}_previous.jpg") and os.path.exists(f"temp_images/{image_id}_previous_result.jpg")
        
        if has_previous_images:
            previous_section = f"""
            <h2>Previous Meter Reading</h2>
            <div class="image-container">
                <div class="image-box">
                    <h3>Original Image</h3>
                    <img src="/image/{image_id}/previous?processed=false" alt="Previous Meter Original Image" />
                </div>
                <div class="image-box">
                    <h3>Processed Image with Detection</h3>
                    <img src="/image/{image_id}/previous?processed=true" alt="Previous Meter Processed Image" />
                </div>
            </div>
            """
        else:
            previous_section = f"""
            <h2>Previous Meter Reading</h2>
            <div class="reading-display">
                <h3>Manually Entered Reading: {previous_reading}</h3>
            </div>
            """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Meter Reading Result</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .container {{ display: flex; flex-direction: column; gap: 20px; }}
            .image-container {{ display: flex; gap: 20px; flex-wrap: wrap; }}
            .image-box {{ border: 1px solid #ddd; padding: 10px; }}
            .reading-display {{ border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9; border-radius: 4px; }}
            h2, h3 {{ color: #333; }}
            .section {{ margin-bottom: 30px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Meter Reading Result</h1>
            
            <div class="section">
                <h2>Current Meter Reading</h2>
                <div class="image-container">
                    <div class="image-box">
                        <h3>Original Image</h3>
                        <img src="/image/{image_id}/current?processed=false" alt="Current Meter Original Image" />
                    </div>
                    <div class="image-box">
                        <h3>Processed Image with Detection</h3>
                        <img src="/image/{image_id}/current?processed=true" alt="Current Meter Processed Image" />
                    </div>
                </div>
            </div>
            
            {previous_section}
            
            <p>Image ID: {image_id}</p>
            <p><a href="/upload">Upload another image</a></p>
        </div>
        <script src="/static/bill-calculator.js"></script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/generate-bill", response_class=HTMLResponse)
async def generate_bill(imageId: str, current: str, previous: Optional[str] = None, consumption: Optional[str] = None):
    """
    Generate an electricity bill based on meter readings
    """
    # Validate consumption for negative values (possible meter reset or error)
    consumption_error = False
    bill_comment = ""
    
    try:
        if consumption is not None:
            calculated_consumption = float(consumption)
            
            # Handle negative consumption (possible meter reset or error)
            if calculated_consumption < 0:
                consumption_error = True
                bill_comment = "Warning: Negative consumption detected. This could indicate a meter reset or error."
    except ValueError:
        consumption_error = True
        bill_comment = "Error: Could not calculate consumption due to invalid numeric values."
    
    # Get the current date for the bill
    current_date = datetime.now().strftime("%B %d, %Y")
    
    # Calculate due date using timedelta correctly
    due_date = (datetime.now() + timedelta(days=30)).strftime("%B %d, %Y")
    
    # Create HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Electricity Bill</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
            .container {{ max-width: 800px; margin: 20px auto; background-color: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 30px; }}
            .bill-header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #3498db; padding-bottom: 20px; margin-bottom: 20px; }}
            .company-info {{ flex: 2; }}
            .bill-info {{ flex: 1; text-align: right; }}
            .bill-title {{ color: #3498db; margin-top: 0; }}
            .customer-section {{ margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }}
            .reading-section {{ margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }}
            .reading-container {{ display: flex; justify-content: space-between; margin-bottom: 15px; }}
            .reading-box {{ flex: 1; padding: 15px; background-color: #f9f9f9; margin: 0 10px; border-radius: 5px; }}
            .reading-box:first-child {{ margin-left: 0; }}
            .reading-box:last-child {{ margin-right: 0; }}
            .charges-section {{ margin-bottom: 30px; }}
            .charge-row {{ display: flex; justify-content: space-between; margin-bottom: 10px; }}
            .total-row {{ display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; }}
            .error-message {{ background-color: #ffe0e0; border-left: 4px solid #e74c3c; padding: 10px; margin-bottom: 20px; color: #c0392b; }}
            .actions {{ margin-top: 30px; text-align: center; }}
            .btn {{ display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 0 10px; }}
            .btn:hover {{ background-color: #2980b9; }}
            .btn-print {{ background-color: #2ecc71; }}
            .btn-print:hover {{ background-color: #27ae60; }}
            @media print {{
                .actions {{ display: none; }}
                body {{ background-color: white; }}
                .container {{ box-shadow: none; padding: 0; }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="bill-header">
                <div class="company-info">
                    <h1 class="bill-title">Electricity Bill</h1>
                    <p>Energy Provider Company</p>
                    <p>123 Power Street</p>
                    <p>support@energyprovider.com | (555) 123-4567</p>
                </div>
                <div class="bill-info">
                    <p><strong>Bill Date:</strong> {current_date}</p>
                    <p><strong>Bill #:</strong> {imageId[:8]}</p>
                    <p><strong>Due Date:</strong> {due_date}</p>
                </div>
            </div>

            <div class="customer-section">
                <h2>Customer Information</h2>
                <p><strong>Account #:</strong> DEMO-ACCOUNT</p>
                <p><strong>Name:</strong> Demo Customer</p>
                <p><strong>Service Address:</strong> 456 Sample Avenue</p>
            </div>

            {f'<div class="error-message">{bill_comment}</div>' if consumption_error else ''}

            <div class="reading-section">
                <h2>Meter Readings</h2>
                <div class="reading-container">
                    <div class="reading-box">
                        <h3>Current Reading</h3>
                        <p><strong>Value:</strong> <span id="currentReading">{current}</span></p>
                        <p><strong>Date:</strong> {current_date}</p>
                    </div>
                    
                    {f"""
                    <div class="reading-box">
                        <h3>Previous Reading</h3>
                        <p><strong>Value:</strong> <span id="previousReading">{previous}</span></p>
                        <p><strong>Date:</strong> {'N/A'}</p>
                    </div>
                    """ if previous else ""}
                    
                    <div class="reading-box">
                        <h3>Consumption</h3>
                        <p><strong>Value:</strong> <span id="consumptionValue">{abs(float(consumption)) if consumption and not consumption_error else 'N/A'}</span> kWh</p>
                        <p><strong>Period:</strong> Current billing cycle</p>
                    </div>
                </div>
            </div>

            <div id="bill-container">
                <!-- Bill details will be dynamically inserted here by bill-calculator.js -->
            </div>
            
            <div class="actions">
                <a href="javascript:window.print()" class="btn btn-print">Print Bill</a>
                <a href="/upload" class="btn">Return to Upload</a>
                <a href="/view/{imageId}" class="btn">View Meter Images</a>
            </div>
        </div>
        
        <!-- Include the bill-calculator.js script -->
        <script src="/static/bill-calculator.js"></script>
        <script>
            // Call the integration function after the page loads
            window.addEventListener('load', function() {{
                console.log("Page loaded. Calling integrateBillCalculator...");
                integrateBillCalculator();
            }});
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)

@app.get("/upload", response_class=HTMLResponse)
async def upload_form():
    """
    HTML form for uploading current meter image and entering previous reading
    """
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Upload Meter Images</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; max-width: 800px; margin: 0 auto; }
            form { margin: 0 auto; }
            .form-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            .input-description { color: #666; font-size: 0.9em; margin-top: 3px; }
            button { padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 4px; }
            button:hover { background: #45a049; }
            .result { margin-top: 30px; display: none; }
            .result img { max-width: 100%; border: 1px solid #ddd; }
            .readings { background: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
            .reading-box { margin-bottom: 15px; }
            .consumption { font-weight: bold; color: #e67e22; font-size: 1.2em; }
            .image-section { margin-top: 20px; }
            h3 { border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .image-container { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 15px; }
            .image-box { flex: 1; min-width: 300px; }
            .heading { display: flex; justify-content: space-between; align-items: center; }
        </style>
    </head>
    <body>
    
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h1>Electricity Meter Reading Analyzer</h1>
            <a href="/history-page" style="padding: 8px 15px; background: #3498db; color: white; text-decoration: none; border-radius: 4px;">View Reading History</a>
        </div>
        
        <form id="uploadForm">
            <div class="form-group">
                <label for="currentImageFile">Current Meter Reading Image (Required):</label>
                <input type="file" id="currentImageFile" name="current_image" accept="image/*" required>
                <div class="input-description">Upload a clear photo of your current meter reading</div>
            </div>
            
            <div class="form-group">
                <label for="previousMeterReading">Previous Meter Reading (Optional):</label>
                <input type="number" id="previousMeterReading" name="previous_meter_reading" step="0.01" placeholder="Enter previous reading">
                <div class="input-description">Enter your previous meter reading to calculate consumption</div>
            </div>
            
            <button type="submit">Analyze Meter Readings</button>
        </form>
        
        <div id="result" class="result">
            <div class="readings">
                <div class="reading-box">
                    <h3>Current Reading: <span id="currentMeterValue"></span></h3>
                </div>
                
                <div id="previousReadingBox" class="reading-box" style="display:none;">
                    <h3>Previous Reading: <span id="previousMeterValue"></span></h3>
                </div>
                
                <div id="consumptionBox" style="display:none;">
                    <h3 class="consumption">Consumption: <span id="consumptionValue"></span> units</h3>
                </div>
            </div>
            
            <div class="image-section">
                <div class="heading">
                    <h2>Processed Images</h2>
                    <a id="viewAllLink" href="" target="_blank">View Full Page</a>
                </div>
                
                <div class="image-container">
                    <div class="image-box">
                        <h3>Current Meter Reading</h3>
                        <img id="currentResultImage" src="" alt="Processed current meter image">
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Modify the form submission handler in the upload form HTML
            document.getElementById('uploadForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const currentFileInput = document.getElementById('currentImageFile');
                const previousReadingInput = document.getElementById('previousMeterReading');
                
                const currentFile = currentFileInput.files[0];
                const previousReading = previousReadingInput.value.trim();
                
                if (!currentFile) {
                    alert('Please select a current meter image file');
                    return;
                }
                
                const formData = new FormData();
                formData.append('current_image', currentFile);
                
                if (previousReading) {
                    formData.append('previous_meter_reading', previousReading);
                }
                
                try {
                    const response = await fetch('/predict', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    // Redirect to the bill page with the readings data
                    window.location.href = `/generate-bill?imageId=${data.image_id}&current=${data.current.meter_reading}${data.previous ? '&previous=' + data.previous.meter_reading : ''}&consumption=${data.consumption}`;
                    
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred during processing');
                }
            });
        </script>
        <script src="/static/bill-calculator.js"></script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)