from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app import models, auth, database
from .database import get_db_connection
from .auth import verify_password, get_password_hash, create_access_token, verify_token
from datetime import timedelta
from .config import settings
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
app = FastAPI(title="Books & Quotes API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://frontend:80", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
database.init_db()

# Dependency to get current user from token - FIXED
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    token_data = verify_token(token)
    with get_db_connection() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE username = ?", (token_data.username,)
        ).fetchone()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Root endpoint for testing
@app.get("/")
def read_root():
    return {"message": "Books & Quotes API is running!"}

# Auth endpoints
@app.post("/register", response_model=models.User)
def register(user: models.UserCreate):
    with get_db_connection() as conn:
        # Check if user exists
        existing_user = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?", 
            (user.username, user.email)
        ).fetchone()
        
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username or email already registered"
            )
        
        hashed_password = get_password_hash(user.password)
        cursor = conn.execute(
            "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)",
            (user.username, user.email, hashed_password)
        )
        conn.commit()
        
        new_user = conn.execute(
            "SELECT id, username, email, created_at FROM users WHERE id = ?", 
            (cursor.lastrowid,)
        ).fetchone()
    
    return dict(new_user)

# FIXED LOGIN ENDPOINT - Now accepts JSON
@app.post("/login")
def login(user_data: models.UserLogin):  # Changed to accept JSON model
    print(f"Login attempt received: {user_data.username}")
    
    with get_db_connection() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE username = ?", (user_data.username,)
        ).fetchone()
    
    if not user:
        print("User not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    print(f"User found: {user['username']}")
    
    # Verify password
    if not verify_password(user_data.password, user["hashed_password"]):
        print("Password verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    print("Login successful")
    return {"access_token": access_token, "token_type": "bearer"}

# Books endpoints
@app.get("/books")
def get_books(current_user: dict = Depends(get_current_user)):
    """Get all books for the current user"""
    print(f"🔍 Getting books for user: {current_user['username']}")
    
    with get_db_connection() as conn:
        books = conn.execute(
            "SELECT * FROM books WHERE user_id = ?", (current_user["id"],)
        ).fetchall()
    
    print(f"✅ Found {len(books)} books for user")
    return [dict(book) for book in books]

@app.get("/books/{book_id}")
def get_book(book_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific book by ID"""
    print(f"🔍 Getting book {book_id} for user: {current_user['username']}")
    
    with get_db_connection() as conn:
        book = conn.execute(
            "SELECT * FROM books WHERE id = ? AND user_id = ?", 
            (book_id, current_user["id"])
        ).fetchone()
        
        if not book:
            print(f"❌ Book {book_id} not found for user")
            raise HTTPException(status_code=404, detail="Book not found")
    
    print(f"✅ Book found: {book['title']}")
    return dict(book)


@app.post("/books", response_model=models.Book)
def create_book(book: models.BookCreate, current_user: dict = Depends(get_current_user)):
    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO books (title, author, publication_date, user_id) VALUES (?, ?, ?, ?)",
            (book.title, book.author, book.publication_date, current_user["id"])
        )
        conn.commit()
        
        new_book = conn.execute(
            "SELECT * FROM books WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    
    return dict(new_book)

@app.put("/books/{book_id}")
def update_book(book_id: int, book: models.BookCreate, current_user: dict = Depends(get_current_user)):
    print(f"🔍 Backend: Updating book {book_id} for user {current_user['username']}")
    
    with get_db_connection() as conn:
        # Check if book exists and belongs to user
        existing_book = conn.execute(
            "SELECT * FROM books WHERE id = ? AND user_id = ?", 
            (book_id, current_user["id"])
        ).fetchone()
        
        if not existing_book:
            print(f"❌ Backend: Book {book_id} not found for user")
            raise HTTPException(status_code=404, detail="Book not found")
        
        print(f"🔍 Backend: Updating book with data: {book}")
        
        conn.execute(
            "UPDATE books SET title = ?, author = ?, publication_date = ? WHERE id = ?",
            (book.title, book.author, book.publication_date, book_id)
        )
        conn.commit()
        
        updated_book = conn.execute(
            "SELECT * FROM books WHERE id = ?", (book_id,)
        ).fetchone()
    
    print(f"✅ Backend: Book updated successfully: {updated_book['title']}")
    return dict(updated_book)

@app.delete("/books/{book_id}")
def delete_book(book_id: int, current_user: dict = Depends(get_current_user)):
    with get_db_connection() as conn:
        # Check if book exists and belongs to user
        existing_book = conn.execute(
            "SELECT * FROM books WHERE id = ? AND user_id = ?", 
            (book_id, current_user["id"])
        ).fetchone()
        
        if not existing_book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        conn.execute("DELETE FROM books WHERE id = ?", (book_id,))
        conn.commit()
    
    return {"message": "Book deleted successfully"}

# Quotes endpoints
@app.get("/quotes")
def get_quotes(current_user: dict = Depends(get_current_user)):
    """Get all quotes for the current user"""
    print(f"🔍 Getting quotes for user: {current_user['username']}")
    
    with get_db_connection() as conn:
        quotes = conn.execute(
            "SELECT * FROM quotes WHERE user_id = ?", (current_user["id"],)
        ).fetchall()
    
    print(f"✅ Found {len(quotes)} quotes for user")
    return [dict(quote) for quote in quotes]

@app.get("/quotes/{quote_id}")
def get_quote(quote_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific quote by ID"""
    print(f"🔍 Backend: Getting quote {quote_id} for user: {current_user['username']}")
    print(f"🔍 Backend: User ID: {current_user['id']}")
    
    with get_db_connection() as conn:
        quote = conn.execute(
            "SELECT * FROM quotes WHERE id = ? AND user_id = ?", 
            (quote_id, current_user["id"])
        ).fetchone()
        
        if not quote:
            print(f"❌ Backend: Quote {quote_id} not found for user")
            raise HTTPException(status_code=404, detail="Quote not found")
    
    print(f"✅ Backend: Quote found: {quote}")
    return dict(quote)


@app.post("/quotes", response_model=models.Quote)
def create_quote(quote: models.QuoteCreate, current_user: dict = Depends(get_current_user)):
    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO quotes (quote_text, author, user_id) VALUES (?, ?, ?)",
            (quote.quote_text, quote.author, current_user["id"])
        )
        conn.commit()
        
        new_quote = conn.execute(
            "SELECT * FROM quotes WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    
    return dict(new_quote)

@app.put("/quotes/{quote_id}")
def update_quote(quote_id: int, quote: models.QuoteCreate, current_user: dict = Depends(get_current_user)):
    print(f"🔍 Backend: UPDATE quote {quote_id} for user {current_user['username']}")
    print(f"🔍 Backend: Update data: {quote}")
    
    with get_db_connection() as conn:
        # Check if quote exists and belongs to user
        existing_quote = conn.execute(
            "SELECT * FROM quotes WHERE id = ? AND user_id = ?", 
            (quote_id, current_user["id"])
        ).fetchone()
        
        if not existing_quote:
            print(f"❌ Backend: Quote {quote_id} not found for update")
            raise HTTPException(status_code=404, detail="Quote not found")
        
        print(f"🔍 Backend: Updating quote with: text='{quote.quote_text}', author='{quote.author}'")
        
        conn.execute(
            "UPDATE quotes SET quote_text = ?, author = ? WHERE id = ?",
            (quote.quote_text, quote.author, quote_id)
        )
        conn.commit()
        
        updated_quote = conn.execute(
            "SELECT * FROM quotes WHERE id = ?", (quote_id,)
        ).fetchone()
    
    print(f"✅ Backend: Quote updated successfully: {updated_quote}")
    return dict(updated_quote)

@app.delete("/quotes/{quote_id}")
def delete_quote(quote_id: int, current_user: dict = Depends(get_current_user)):
    with get_db_connection() as conn:
        # Check if quote exists and belongs to user
        existing_quote = conn.execute(
            "SELECT * FROM quotes WHERE id = ? AND user_id = ?", 
            (quote_id, current_user["id"])
        ).fetchone()
        
        if not existing_quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        conn.execute("DELETE FROM quotes WHERE id = ?", (quote_id,))
        conn.commit()
    
    return {"message": "Quote deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)