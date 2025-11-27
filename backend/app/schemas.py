from pydantic import BaseModel, EmailStr
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

# Book Schemas
class BookBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None

class BookCreate(BookBase):
    pass

class Book(BookBase):
    id: int
    owner_id: int
    
    class Config:
        from_attributes = True

# Quote Schemas
class QuoteBase(BaseModel):
    text: str
    page_number: Optional[int] = None
    book_id: int

class QuoteCreate(QuoteBase):
    pass

class Quote(QuoteBase):
    id: int
    owner_id: int
    
    class Config:
        from_attributes = True