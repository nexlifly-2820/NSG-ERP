from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app import models, database
from app.core import security
from app.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

# Pydantic schemas for input validation & output serialization
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "employee"  # employee, tl, ceo, hr, admin
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    emp_id: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    department: Optional[str] = None
    designation: Optional[str] = None
    emp_id: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(database.get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Hash password and create User
    hashed_pwd = security.hash_password(user_in.password)
    db_user = models.User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pwd,
        role=user_in.role,
        department=user_in.department,
        designation=user_in.designation,
        phone=user_in.phone,
        emp_id=user_in.emp_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # OAuth2 specifies 'username' parameter in login form, mapping it to user's email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = security.create_access_token(data={"sub": user.email})
    
    # Set HttpOnly Cookie
    response.set_cookie(
        key="nsg_jwt_token",
        value=access_token,
        httponly=True,
        secure=False, # Set to True in production with HTTPS
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response, current_user: models.User = Depends(security.get_current_user)):
    response.delete_cookie("nsg_jwt_token", httponly=True, samesite="lax")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

class CompanyConfigResponse(BaseModel):
    company_name: Optional[str] = "HMNS Software"
    company_logo: Optional[str] = "/hmns-logo.png"
    emp_id_prefix: Optional[str] = "nsg"

@router.get("/company-config", response_model=CompanyConfigResponse)
def get_company_config(db: Session = Depends(database.get_db)):
    company_name = db.query(models.SystemSetting).filter(models.SystemSetting.key == "company_name").first()
    company_logo = db.query(models.SystemSetting).filter(models.SystemSetting.key == "company_logo").first()
    emp_id_prefix = db.query(models.SystemSetting).filter(models.SystemSetting.key == "emp_id_prefix").first()
    
    name_val = company_name.value if company_name else "HMNS Software"
    
    logo_val = company_logo.value if company_logo else "/hmns-logo.png"
    # The logo value saved in CEO portal is typically the file path like /api/files/...
    # But wait, looking at CompanySetup.jsx, if it's saved via configs it's just the URL path.
    # Let's ensure it has the correct prefix or use it as is.
    
    prefix_val = emp_id_prefix.value if emp_id_prefix else "nsg"
    
    return {
        "company_name": name_val,
        "company_logo": logo_val,
        "emp_id_prefix": prefix_val
    }
