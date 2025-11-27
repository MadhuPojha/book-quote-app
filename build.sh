#!/bin/bash

# Build backend image
echo "Building backend Docker image..."
docker build -t books-quotes-backend:latest ./backend

# Build frontend image
echo "Building frontend Docker image..."
docker build -t books-quotes-frontend:latest ./frontend

echo "Build completed!"