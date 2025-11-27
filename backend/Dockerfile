FROM python:3.9-slim

WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variable for database
ENV DATABASE_URL=/app/data/books_quotes.db

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]