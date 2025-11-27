from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# User models
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

# ADD THIS MODEL - Your login endpoint needs it!
class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

# Book models
class BookBase(BaseModel):
    title: str
    author: str
    publication_date: Optional[str] = None

class BookCreate(BookBase):
    pass

class Book(BookBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Quote models
class QuoteBase(BaseModel):
    quote_text: str
    author: str

class QuoteCreate(QuoteBase):
    pass

class Quote(QuoteBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None