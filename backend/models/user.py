"""
models/user.py — Admin user schema
"""

from pydantic import BaseModel, EmailStr, Field


class AdminCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminInDB(BaseModel):
    email: str
    hashed_password: str
    role: str = "admin"
