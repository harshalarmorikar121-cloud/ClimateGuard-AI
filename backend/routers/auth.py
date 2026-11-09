from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from models import User
from schemas import LoginRequest, Token, UserResponse, UserCreate
from services.auth_service import verify_password, create_access_token, get_current_user, get_password_hash
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Health Officer Authentication"])

@router.post("/login", response_model=Token)
def login_officer(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticates a Health Officer / Epidemiologist and returns a JWT session token.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect officer email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Officer account is inactive")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization": user.organization,
            "assigned_region": user.assigned_region
        }
    }

@router.get("/me", response_model=UserResponse)
def get_current_officer_profile(current_user: User = Depends(get_current_user)):
    """
    Returns authenticated health officer profile details.
    """
    return current_user
