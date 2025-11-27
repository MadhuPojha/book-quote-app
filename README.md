# Books & Quotes App

A responsive CRUD web application for managing books and favorite quotes with JWT authentication.

## Features

- 📚 **Book Management** - Add, edit, delete books
- 💬 **Quote Management** - Save and manage favorite quotes
- 🔐 **JWT Authentication** - Secure user registration and login
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🌙 **Dark/Light Theme** - Toggle between themes
- 🎨 **Bootstrap UI** - Modern and clean interface
- ⚡ **FastAPI Backend** - High-performance Python API

## Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript
- Bootstrap 5
- Font Awesome Icons

**Backend:**
- Python FastAPI
- JWT Authentication
- SQLite Database

## Quick Start

### Prerequisites
- Python 3.7+
- Web browser

### How to run the application

1. **Start the Backend**
   ```
   # Open new terminal
   cd book-quote-app/backend
   python -m venv venv
   venv\Scripts\activate  # On Windows
   pip install -r app/requirements.txt
   python run.py
   ```
   Backend runs on: http://localhost:8000

2. **Start the Frontend**
   ```
   # Open new terminal
   cd book-quote-app/frontend
   python -m http.server 8080
   ```
   Frontend runs on: http://localhost:8080

3. **Access the Application**
```
   - Open browser: http://localhost:8080
   - Register a new account
   - Start adding books and quotes!
   ```

## API Documentation
```
Once backend is running, access interactive API docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
```

## Project Structure

```
book-quote-app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── auth.py          # JWT authentication
│   │   ├── models.py        # Pydantic models
│   │   └── database.py      # Database setup
│   └── run.py              # Application runner
└── frontend/
    ├── index.html          # Home page
    ├── books.html          # Books management
    ├── quotes.html         # Quotes management
    ├── login.html          # Login page
    ├── register.html       # Registration page
    ├── css/style.css       # Custom styles
    └── js/                 # JavaScript modules
```
## Testing the Application
```
1. Register a new user account
2. Login with your credentials
3. Add some books with titles and authors
4. Add your favorite quotes
5. Test editing and deleting functionality
6. Try the dark/light theme toggle
7. Test responsive design on different screen sizes
```
## 🐳 Docker & Kubernetes
```
# Build and start all services in detached mode
docker-compose up -d --build

# Build images
docker build -t books-quotes-backend:latest ./backend
docker build -t books-quotes-frontend:latest ./frontend

# Deploy to Kubernetes
kubectl apply -f k8s/
```

## Features
```
✅ Containerized with Docker

✅ Kubernetes-ready manifests

✅ Health checks & auto-scaling

✅ Production deployment ready
```