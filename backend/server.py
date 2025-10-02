from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from datetime import datetime
import json

# Create FastAPI app
app = FastAPI(title="NexaKey API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "NexaKey"}

# Auth status endpoint
@app.get("/api/auth/status")
async def auth_status():
    return {"authenticated": False, "isFirstTime": True}

# Login endpoint
@app.post("/api/auth/login")
async def login(request_data: dict):
    email = request_data.get('email')
    password = request_data.get('password')
    
    if email and password:
        return {
            "success": True,
            "token": f"demo-token-{int(datetime.now().timestamp())}",
            "user": {
                "email": email,
                "name": email.split('@')[0]
            }
        }
    
    return {"success": False}, 401

# Get keys endpoint
@app.get("/api/keys")
async def get_keys():
    return {
        "keys": [
            {
                "id": "1",
                "name": "Production API Key",
                "type": "api_key",
                "status": "active",
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "2", 
                "name": "Development Key",
                "type": "dev_key",
                "status": "active",
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "3",
                "name": "Test Environment",
                "type": "test_key", 
                "status": "inactive",
                "created_at": datetime.now().isoformat()
            }
        ]
    }

# Create new key endpoint
@app.post("/api/keys")
async def create_key(request_data: dict):
    name = request_data.get('name', 'Nova Chave')
    key_type = request_data.get('type', 'api_key')
    
    new_key = {
        "id": str(int(datetime.now().timestamp())),
        "name": name,
        "type": key_type,
        "status": "active",
        "created_at": datetime.now().isoformat(),
        "key_value": f"nk_{int(datetime.now().timestamp())}"
    }
    
    return {"success": True, "key": new_key}

# Mount static files
app.mount("/", StaticFiles(directory="/app/frontend", html=True), name="static")