"""
Authentication Routes - JWT-based authentication for 4-tier access
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

router = APIRouter(prefix="/auth", tags=["authentication"])

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "railway_secret_key_super_secure_change_in_production_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours for demo

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Pydantic Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    username: Optional[str] = None
    tier_role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    email: str
    full_name: str
    tier_role: str
    department: str
    jurisdiction_id: str

# Demo users database (in-memory for speed)
DEMO_USERS = {
    "board_exec": {
        "username": "board_exec",
        "email": "board@railway.gov.in",
        "password_hash": pwd_context.hash("demo123"),
        "full_name": "Railway Board Executive",
        "tier_role": "BOARD_EXEC",
        "department": "ALL",
        "jurisdiction_id": "BOARD_IR",
        "phone": "+91-11-23389999"
    },
    "zonal_gm": {
        "username": "zonal_gm",
        "email": "gm.nr@railway.gov.in",
        "password_hash": pwd_context.hash("demo123"),
        "full_name": "General Manager - Northern Railway",
        "tier_role": "ZONAL_HEAD",
        "department": "ALL",
        "jurisdiction_id": "ZONE_NR",
        "phone": "+91-11-23344000"
    },
    "div_controller": {
        "username": "div_controller",
        "email": "srdom.dli@railway.gov.in",
        "password_hash": pwd_context.hash("demo123"),
        "full_name": "Sr. DOM - Delhi Division",
        "tier_role": "DIV_CONTROLLER",
        "department": "OPERATING",
        "jurisdiction_id": "DIV_DLI",
        "phone": "+91-11-23401234"
    },
    "field_sse": {
        "username": "field_sse",
        "email": "sse.pway.gzb@railway.gov.in",
        "password_hash": pwd_context.hash("demo123"),
        "full_name": "SSE P-Way - Ghaziabad",
        "tier_role": "FIELD_SSE",
        "department": "ENGINEERING",
        "jurisdiction_id": "DIV_DLI",
        "phone": "+91-120-2782345"
    },
    "station_master": {
        "username": "station_master",
        "email": "sm.gzb@railway.gov.in",
        "password_hash": pwd_context.hash("demo123"),
        "full_name": "Station Master - Ghaziabad",
        "tier_role": "STATION_MASTER",
        "department": "OPERATING",
        "jurisdiction_id": "DIV_DLI",
        "phone": "+91-120-2785000"
    }
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_user(username: str):
    """Get user from demo database"""
    if username in DEMO_USERS:
        return DEMO_USERS[username]
    return None

def authenticate_user(username: str, password: str):
    """Authenticate user with username and password"""
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user["password_hash"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to get current user from token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, tier_role=payload.get("tier_role"))
    except JWTError:
        raise credentials_exception
    
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint - returns JWT token
    
    Demo credentials:
    - board_exec / demo123
    - zonal_gm / demo123
    - div_controller / demo123
    - field_sse / demo123
    - station_master / demo123
    """
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user["username"],
            "tier_role": user["tier_role"],
            "department": user["department"],
            "jurisdiction_id": user["jurisdiction_id"]
        },
        expires_delta=access_token_expires
    )
    
    # Return token and user info
    user_response = {
        "username": user["username"],
        "email": user["email"],
        "full_name": user["full_name"],
        "tier_role": user["tier_role"],
        "department": user["department"],
        "jurisdiction_id": user["jurisdiction_id"]
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(
        username=current_user["username"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        tier_role=current_user["tier_role"],
        department=current_user["department"],
        jurisdiction_id=current_user["jurisdiction_id"]
    )

@router.get("/users")
async def list_demo_users():
    """List all demo users (for demo purposes only)"""
    users = []
    for username, user_data in DEMO_USERS.items():
        users.append({
            "username": username,
            "full_name": user_data["full_name"],
            "tier_role": user_data["tier_role"],
            "department": user_data["department"],
            "hint": "Password: demo123"
        })
    return {"users": users}

# Dependency for protected routes
async def require_tier_role(required_roles: list[str], current_user: dict = Depends(get_current_user)):
    """Dependency to check if user has required role"""
    if current_user["tier_role"] not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required roles: {', '.join(required_roles)}"
        )
    return current_user

# Role-specific dependencies
async def require_field_access(current_user: dict = Depends(get_current_user)):
    """Require Field SSE or Station Master access"""
    allowed_roles = ["FIELD_SSE", "STATION_MASTER", "DIV_CONTROLLER", "ZONAL_HEAD", "BOARD_EXEC"]
    if current_user["tier_role"] not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Field access required")
    return current_user

async def require_division_access(current_user: dict = Depends(get_current_user)):
    """Require Divisional Controller or above"""
    allowed_roles = ["DIV_CONTROLLER", "ZONAL_HEAD", "BOARD_EXEC"]
    if current_user["tier_role"] not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Division access required")
    return current_user

async def require_zonal_access(current_user: dict = Depends(get_current_user)):
    """Require Zonal Head or above"""
    allowed_roles = ["ZONAL_HEAD", "BOARD_EXEC"]
    if current_user["tier_role"] not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Zonal access required")
    return current_user

async def require_board_access(current_user: dict = Depends(get_current_user)):
    """Require Board Executive access"""
    if current_user["tier_role"] != "BOARD_EXEC":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Board access required")
    return current_user
