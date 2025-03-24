from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import sqlite3
import os
import uvicorn
from contextlib import contextmanager

# Initialize FastAPI
app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_NAME = "meterease.db"

def init_db():
    print("Initializing database...")  # Debug print
    with sqlite3.connect(DATABASE_NAME) as conn:
        cursor = conn.cursor()
        
        # Drop tables if they exist (for clean initialization)
        cursor.execute("DROP TABLE IF EXISTS refresh_tokens")
        cursor.execute("DROP TABLE IF EXISTS users")
        
        # Create users table
        cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            mobile_number TEXT UNIQUE NOT NULL,
            service_number TEXT UNIQUE,
            hashed_password TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create refresh tokens table
        cursor.execute('''
        CREATE TABLE refresh_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        conn.commit()
        print("Database initialized successfully")

# Initialize database on startup
init_db()

# Security configurations
SECRET_KEY = "your-secret-key-here"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Using SHA256 for password hashing
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic models
class UserBase(BaseModel):
    name: str
    mobile_number: str
    service_number: Optional[str] = None

class UserCreate(UserBase):
    password: str
    confirm_password: str

class UserInDB(UserBase):
    id: int
    hashed_password: str
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str

class TokenData(BaseModel):
    mobile_number: Optional[str] = None

# Database connection helper
@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def get_user_by_mobile(conn, mobile_number: str):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE mobile_number = ?", (mobile_number,))
    user = cursor.fetchone()
    if user:
        return UserInDB(
            id=user["id"],
            name=user["name"],
            mobile_number=user["mobile_number"],
            service_number=user["service_number"],
            hashed_password=user["hashed_password"],
            is_active=user["is_active"]
        )
    return None

def create_user(conn, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (name, mobile_number, service_number, hashed_password)
            VALUES (?, ?, ?, ?)
            """,
            (user.name, user.mobile_number, user.service_number, hashed_password)
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError as e:
        if "mobile_number" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Mobile number already registered"
            )
        elif "service_number" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Service number already registered"
            )
        raise HTTPException(
            status_code=400,
            detail="Registration failed"
        )

# Authentication functions
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def store_refresh_token(conn, user_id: int, token: str, expires_at: datetime):
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
        """,
        (user_id, token, expires_at)
    )
    conn.commit()

def authenticate_user(conn, mobile_number: str, password: str):
    user = get_user_by_mobile(conn, mobile_number)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        mobile_number: str = payload.get("sub")
        if mobile_number is None:
            raise credentials_exception
        token_data = TokenData(mobile_number=mobile_number)
    except JWTError:
        raise credentials_exception
    
    with get_db() as conn:
        user = get_user_by_mobile(conn, mobile_number=token_data.mobile_number)
        if user is None:
            raise credentials_exception
        return user

# OPTIONS handlers
@app.options("/signup")
async def options_signup():
    return {"message": "OK"}

@app.options("/token")
async def options_token():
    return {"message": "OK"}

@app.options("/users/me")
async def options_users_me():
    return {"message": "OK"}

# API endpoints
@app.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    # Validate passwords match
    if user.password != user.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match"
        )
    
    # Validate mobile number format
    if not user.mobile_number.isdigit() or len(user.mobile_number) != 10:
        raise HTTPException(
            status_code=400,
            detail="Mobile number must be 10 digits"
        )
    
    # Validate service number if provided
    if user.service_number and (not user.service_number.isdigit() or len(user.service_number) != 12):
        raise HTTPException(
            status_code=400,
            detail="Service number must be 12 digits"
        )
    
    with get_db() as conn:
        # Create user
        user_id = create_user(conn, user)
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="Registration failed"
            )
        
        # Generate tokens
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.mobile_number}, expires_delta=access_token_expires
        )
        
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data={"sub": user.mobile_number}, expires_delta=refresh_token_expires
        )
        
        # Store refresh token
        store_refresh_token(
            conn, 
            user_id, 
            refresh_token, 
            datetime.utcnow() + refresh_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token
        }

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    with get_db() as conn:
        user = authenticate_user(conn, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect mobile number or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.mobile_number}, expires_delta=access_token_expires
        )
        
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data={"sub": user.mobile_number}, expires_delta=refresh_token_expires
        )
        
        # Store refresh token
        store_refresh_token(
            conn, 
            user.id, 
            refresh_token, 
            datetime.utcnow() + refresh_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token
        }

@app.get("/users/me")
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return {
        "name": current_user.name,
        "mobile_number": current_user.mobile_number,
        "service_number": current_user.service_number
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)