#!/bin/bash

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."

# Apply all manifests
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/nginx-configmap.yaml

# Wait for services to be ready
echo "Waiting for services to be ready..."
kubectl wait --for=condition=ready pod -l app=books-quotes-backend --timeout=60s
kubectl wait --for=condition=ready pod -l app=books-quotes-frontend --timeout=60s

echo "Deployment completed!"
echo "Frontend service:"
kubectl get service frontend-service