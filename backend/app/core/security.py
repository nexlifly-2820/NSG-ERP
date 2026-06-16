from datetime import datetime, timedelta, timezone
from typing import Union, Any
from jose import jwt, JWTError
import bcrypt
import json
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app import models

# OAuth2 scheme: tells FastAPI to look for a Bearer token in the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a stored hash."""
    try:
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    """Generate a signed JWT access token containing arbitrary payload data."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    """Dependency injection function to validate JWT tokens and return the current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = request.cookies.get("nsg_jwt_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user

def check_rbac_permission(db: Session, user: models.User, action: str):
    """Check dynamic RBAC matrix from SystemSettings."""
    role_map = {
        "ceo": "CEO",
        "admin": "CEO",
        "hr": "HR Manager",
        "finance": "Finance Manager",
        "manager": "Team Lead",
        "tl": "Team Lead",
        "employee": "Employee"
    }
    ui_role = role_map.get(user.role, "Employee")

    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "security_rbac_matrix").first()
    if setting and setting.value:
        try:
            matrix = json.loads(setting.value)
            if action in matrix:
                if not matrix[action].get(ui_role, False):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Operation forbidden. RBAC matrix denies '{ui_role}' access to '{action}'."
                    )
        except json.JSONDecodeError:
            pass

