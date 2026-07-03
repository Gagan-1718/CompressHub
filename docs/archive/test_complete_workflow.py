#!/usr/bin/env python
"""Test complete compression workflow"""
import requests
import json
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"

print("=" * 60)
print("Testing Complete Compression Workflow")
print("=" * 60)

# Step 1: Upload
print("\n[1] Uploading image...")
test_image = Path("storage/uploads/test_image.png")
with open(test_image, 'rb') as f:
    files = {'file': ('test.png', f, 'image/png')}
    response = requests.post(f"{BASE_URL}/api/compression/upload", files=files, timeout=5)

if response.status_code == 200:
    upload_data = response.json()
    job_id = upload_data['job_id']
    print(f"✓ Upload successful: {job_id}")
else:
    print(f"✗ Upload failed: {response.text}")
    exit(1)

# Step 2: Compress
print("\n[2] Compressing image...")
compress_response = requests.post(
    f"{BASE_URL}/api/compression/compress/{job_id}?quality=high",
    timeout=10
)

if compress_response.status_code == 200:
    compress_data = compress_response.json()
    print(f"✓ Compression status: {compress_data['status']}")
    if 'metrics' in compress_data:
        print(f"  Metrics: {compress_data['metrics']}")
else:
    print(f"✗ Compression failed: {compress_response.text}")
    exit(1)

# Step 3: Get results
print("\n[3] Fetching results...")
result_response = requests.get(
    f"{BASE_URL}/api/compression/job/{job_id}",
    timeout=5
)

if result_response.status_code == 200:
    result_data = result_response.json()
    print(f"✓ Results retrieved: {result_data['status']}")
    
    if 'metrics' in result_data:
        metrics = result_data['metrics']
        print(f"\n  Metrics:")
        print(f"    Original: {metrics.get('original_size_mb', 'N/A')} MB")
        print(f"    Compressed: {metrics.get('compressed_size_mb', 'N/A')} MB")
        print(f"    Ratio: {metrics.get('compression_ratio', 'N/A')}x")
        print(f"    Savings: {metrics.get('savings_percent', 'N/A')}%")
        print(f"    Time: {metrics.get('compression_time_ms', 'N/A')} ms")
    
    if 'original_image' in result_data and result_data['original_image']:
        print(f"  ✓ Original image: {len(result_data['original_image'])} chars (base64)")
    if 'compressed_image' in result_data and result_data['compressed_image']:
        print(f"  ✓ Compressed image: {len(result_data['compressed_image'])} chars (base64)")
else:
    print(f"✗ Failed to fetch results: {result_response.text}")
    exit(1)

print("\n" + "=" * 60)
print("✓ Workflow test complete!")
print("=" * 60)
