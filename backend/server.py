from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, HashingError
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="NexaKey Password Manager API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()
ph = PasswordHasher()

# Models
class UserCreate(BaseModel):
    email: str
    master_password_hash: str  # Already hashed on client side with Argon2
    biometric_enabled: bool = False

class UserResponse(BaseModel):
    id: str
    email: str
    biometric_enabled: bool
    vault_items_count: int
    is_premium: bool
    created_at: datetime

class LoginRequest(BaseModel):
    email: str
    master_password_hash: str

class LoginResponse(BaseModel):
    access_token: str
    user: UserResponse

class VaultItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    item_type: str  # 'password', 'credit_card', 'secure_note'
    encrypted_data: str  # Client-side encrypted JSON
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class VaultItemCreate(BaseModel):
    item_type: str
    encrypted_data: str

class VaultItemUpdate(BaseModel):
    encrypted_data: str

class BiometricRecoveryRequest(BaseModel):
    email: str
    new_master_password_hash: str

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"_id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Authentication Routes
@api_router.post("/auth/register", response_model=LoginResponse)
async def register_user(user_data: UserCreate):
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            # For demo purposes, we'll allow re-registration by updating the existing user
            # In production, this should return an error
            user_id = existing_user["_id"]
            
            # Update existing user
            await db.users.update_one(
                {"_id": user_id},
                {"$set": {
                    "master_password_hash": user_data.master_password_hash,
                    "biometric_enabled": user_data.biometric_enabled,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            print(f"Updated existing user: {user_data.email}")
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            user_doc = {
                "_id": user_id,
                "email": user_data.email,
                "master_password_hash": user_data.master_password_hash,
                "biometric_enabled": user_data.biometric_enabled,
                "is_premium": False,
                "created_at": datetime.utcnow()
            }
            
            await db.users.insert_one(user_doc)
            print(f"Created new user: {user_data.email}")
        
        # Create access token
        access_token = create_access_token({"sub": user_id})
        
        # Get updated user data
        user = await db.users.find_one({"_id": user_id})
        
        # Return response
        user_response = UserResponse(
            id=user_id,
            email=user_data.email,
            biometric_enabled=user_data.biometric_enabled,
            vault_items_count=0,
            is_premium=False,
            created_at=user["created_at"]
        )
        
        return LoginResponse(access_token=access_token, user=user_response)
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@api_router.post("/auth/login", response_model=LoginResponse)
async def login_user(login_data: LoginRequest):
    try:
        # Find user
        user = await db.users.find_one({"email": login_data.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password hash (client sends already hashed password)
        if user["master_password_hash"] != login_data.master_password_hash:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Get vault items count
        vault_count = await db.vault_items.count_documents({"user_id": user["_id"]})
        
        # Create access token
        access_token = create_access_token({"sub": user["_id"]})
        
        # Return response
        user_response = UserResponse(
            id=user["_id"],
            email=user["email"],
            biometric_enabled=user.get("biometric_enabled", False),
            vault_items_count=vault_count,
            is_premium=user.get("is_premium", False),
            created_at=user["created_at"]
        )
        
        return LoginResponse(access_token=access_token, user=user_response)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@api_router.post("/auth/biometric-recovery")
async def biometric_recovery(recovery_data: BiometricRecoveryRequest):
    # Find user
    user = await db.users.find_one({"email": recovery_data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("biometric_enabled", False):
        raise HTTPException(status_code=400, detail="Biometric authentication not enabled")
    
    # Update master password hash
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"master_password_hash": recovery_data.new_master_password_hash}}
    )
    
    return {"message": "Master password updated successfully"}

# Vault Routes
@api_router.get("/vault/items", response_model=List[VaultItem])
async def get_vault_items(current_user: dict = Depends(get_current_user)):
    items = await db.vault_items.find({"user_id": current_user["_id"]}).to_list(1000)
    return [VaultItem(**item) for item in items]

@api_router.post("/vault/items", response_model=VaultItem)
async def create_vault_item(item_data: VaultItemCreate, current_user: dict = Depends(get_current_user)):
    # Check freemium limits
    if not current_user.get("is_premium", False):
        item_count = await db.vault_items.count_documents({"user_id": current_user["_id"]})
        if item_count >= 20:
            raise HTTPException(
                status_code=403, 
                detail="Free plan limit reached. Upgrade to NexaKey Plus for unlimited items."
            )
    
    # Create vault item
    item_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": current_user["_id"],
        "item_type": item_data.item_type,
        "encrypted_data": item_data.encrypted_data,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.vault_items.insert_one(item_doc)
    return VaultItem(**item_doc)

@api_router.put("/vault/items/{item_id}", response_model=VaultItem)
async def update_vault_item(
    item_id: str, 
    item_data: VaultItemUpdate, 
    current_user: dict = Depends(get_current_user)
):
    # Find and update item
    result = await db.vault_items.find_one_and_update(
        {"_id": item_id, "user_id": current_user["_id"]},
        {"$set": {
            "encrypted_data": item_data.encrypted_data,
            "updated_at": datetime.utcnow()
        }},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Vault item not found")
    
    return VaultItem(**result)

@api_router.delete("/vault/items/{item_id}")
async def delete_vault_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.vault_items.delete_one({"_id": item_id, "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vault item not found")
    return {"message": "Item deleted successfully"}

# User Routes
@api_router.get("/user/profile", response_model=UserResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    vault_count = await db.vault_items.count_documents({"user_id": current_user["_id"]})
    
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        biometric_enabled=current_user.get("biometric_enabled", False),
        vault_items_count=vault_count,
        is_premium=current_user.get("is_premium", False),
        created_at=current_user["created_at"]
    )

@api_router.post("/user/upgrade-premium")
async def upgrade_to_premium(current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"is_premium": True}}
    )
    return {"message": "Successfully upgraded to NexaKey Plus"}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "NexaKey API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()