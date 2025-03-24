import { useState, useRef } from "react";
import { Camera, Upload, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface MeterReadingUploadProps {
  onReadingSuccess?: (reading: string) => void;
}

const MeterReadingUpload = ({ onReadingSuccess }: MeterReadingUploadProps) => {
  const { toast } = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [previousReading, setPreviousReading] = useState<string>("");
  const [processingState, setProcessingState] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      processImage(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      processImage(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access your camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL
    const imageData = canvas.toDataURL("image/png");
    setImage(imageData);
    
    // Stop the camera
    stopCamera();
    
    // Process the captured image
    processImage(imageData);
  };

  const processImage = async (imageFileOrData: File | string) => {
    setProcessingState("uploading");
    
    try {
      const formData = new FormData();
      if (typeof imageFileOrData === "string") {
        // Convert data URL to Blob
        const blob = await fetch(imageFileOrData).then((res) => res.blob());
        formData.append("current_image", blob, "meter.png");
      } else {
        formData.append("current_image", imageFileOrData);
      }

      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const data = await response.json();
      setReading(data.current.meter_reading);
      setProcessingState("success");

      toast({
        title: "Reading Detected",
        description: `Meter reading: ${data.current.meter_reading} kWh`,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      setProcessingState("error");
      toast({
        title: "Error Processing Image",
        description: "We couldn't detect a meter reading. Please try again with a clearer image.",
        variant: "destructive",
      });
    }
  };

  const resetUpload = () => {
    setImage(null);
    setReading(null);
    setPreviousReading("");
    setProcessingState("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitReading = () => {
    // Validate previous reading if entered manually
    if (previousReading && isNaN(Number(previousReading))) {
      toast({
        title: "Invalid Reading",
        description: "Please enter a valid number for the previous reading.",
        variant: "destructive",
      });
      return;
    }

    if (reading) {
      // Get initial reading from localStorage
      const storedReading = localStorage.getItem("initialReading");
      
      // If user has entered a previous reading manually, save it
      if (previousReading) {
        localStorage.setItem("initialReading", previousReading);
      } else if (!storedReading) {
        // If no previous reading provided and none stored, show error
        toast({
          title: "Previous Reading Required",
          description: "Please enter your previous meter reading for consumption calculation.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Reading Submitted",
        description: "Your meter reading has been successfully recorded.",
      });
      
      if (onReadingSuccess) {
        onReadingSuccess(reading);
      }
      
      resetUpload();
    }
  };

  return (
    <Card className="glass-card animate-slide-up mt-6">
      <CardHeader>
        <CardTitle>Upload Meter Reading</CardTitle>
        <CardDescription>
          Take a photo of your meter or upload an existing image
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        {cameraActive ? (
          <div className="relative rounded-lg overflow-hidden border shadow-sm">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-full object-contain max-h-[300px]"
            ></video>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
              <Button onClick={captureImage} variant="success">
                <Camera className="mr-2 h-4 w-4" />
                Capture Photo
              </Button>
              <Button onClick={stopCamera} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>
        ) : !image ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={triggerFileInput}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-primary/10 rounded-full p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">Drag & drop or click to upload</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports JPG, PNG, HEIC formats (max 2MB)
                </p>
              </div>
              <div className="flex gap-4 mt-4">
                <Button type="button" onClick={triggerFileInput}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <Button type="button" variant="outline" onClick={startCamera}>
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border shadow-sm">
              <img
                src={image}
                alt="Meter"
                className="w-full object-contain max-h-[300px]"
              />
              <button
                onClick={resetUpload}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="bg-accent/50 p-4 rounded-lg">
              <div className="flex items-center">
                {processingState === "uploading" && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    <span>Uploading image...</span>
                  </>
                )}
                
                {processingState === "processing" && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    <span>Processing meter reading...</span>
                  </>
                )}
                
                {processingState === "success" && (
                  <>
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>Reading detected: <strong>{reading} kWh</strong></span>
                  </>
                )}
                
                {processingState === "error" && (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                    <span>Could not detect reading. Try another image or enter manually.</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Previous Reading Input */}
            <div className="space-y-2">
              <Label htmlFor="previousReading">Previous Meter Reading (kWh)</Label>
              <Input
                id="previousReading"
                type="text"
                value={previousReading}
                onChange={(e) => setPreviousReading(e.target.value)}
                placeholder="Enter your previous meter reading (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use your last submitted reading
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      {image && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetUpload}>
            Cancel
          </Button>
          <Button
            onClick={submitReading}
            disabled={processingState !== "success"}
          >
            Submit Reading
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default MeterReadingUpload;