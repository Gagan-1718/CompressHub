#!/usr/bin/env python
"""Test compression API workflow"""
import requests
import json
from pathlib import Path
import time

# Test image path
test_image_path = Path("storage/uploads/test_image.png")

if not test_image_path.exists():
    print(f"✗ Test image not found: {test_image_path}")
    exit(1)

# Backend API URL
BASE_URL = "http://127.0.0.1:8000"
API_UPLOAD_URL = f"{BASE_URL}/api/compression/upload"

print("=" * 60)
print("Testing Image Compression Workflow")
print("=" * 60)

# Test 1: Health check
print("\n[1] Testing backend health...")
try:
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    if response.status_code == 200:
        health_data = response.json()
        print(f"✓ Backend healthy: {health_data}")
    else:
        print(f"✗ Health check failed: {response.status_code}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 2: Upload image
print("\n[2] Testing image upload...")
try:
    with open(test_image_path, 'rb') as f:
        files = {'file': ('test_image.png', f, 'image/png')}
        response = requests.post(API_UPLOAD_URL, files=files, timeout=10)
    
    if response.status_code == 200:
        upload_data = response.json()
        print(f"✓ Upload successful!")
        print(f"  Job ID: {upload_data.get('job_id')}")
        print(f"  Image info: {upload_data.get('image_info')}")
    else:
        print(f"✗ Upload failed: {response.status_code}")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"✗ Error uploading: {e}")

# Test 3: List available endpoints
print("\n[3] Available API endpoints:")
try:
    response = requests.get(f"{BASE_URL}/api/docs", timeout=5)
    if response.status_code == 200:
        print("✓ API documentation available at: http://127.0.0.1:8000/api/docs")
    else:
        print("✗ API documentation not available")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("Workflow test complete!")
print("=" * 60)
