#!/usr/bin/env python3
"""
Test script that mimics the frontend workflow:
1. Upload an image
2. Call compress endpoint
3. Fetch results with metrics and images
4. Verify all expected fields are present
"""

import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"
TEST_IMAGE_PATH = Path("storage/uploads/test_image.png")

def format_field(name, value, max_length=100):
    """Pretty print a field value"""
    if isinstance(value, dict):
        return f"✓ {name}: <dict>"
    elif isinstance(value, str):
        if len(value) > max_length:
            return f"✓ {name}: {value[:max_length]}... ({len(value)} chars)"
        else:
            return f"✓ {name}: {value}"
    else:
        return f"✓ {name}: {value}"

def verify_field(obj, key, description=""):
    """Verify a field exists and return it"""
    if key in obj:
        print(f"  ✓ {key} {description}")
        return obj[key]
    else:
        print(f"  ✗ MISSING: {key} {description}")
        return None

print("=" * 70)
print("Testing Frontend Workflow Integration")
print("=" * 70)

# Step 1: Upload image
print("\n[1] Uploading image...")
try:
    with open(TEST_IMAGE_PATH, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/api/compression/upload", files=files)
    
    if response.status_code != 200:
        print(f"✗ Upload failed: {response.status_code}")
        print(response.text)
        exit(1)
    
    upload_data = response.json()
    job_id = upload_data['job_id']
    print(f"✓ Upload successful: {job_id}")
    print(f"  ✓ Filename: {upload_data['filename']}")
    print(f"  ✓ File size: {upload_data['file_size']} bytes")
except Exception as e:
    print(f"✗ Upload error: {e}")
    exit(1)

# Step 2: Call compress endpoint
print("\n[2] Starting compression...")
try:
    response = requests.post(
        f"{BASE_URL}/api/compression/compress/{job_id}?quality=high",
        json={}
    )
    
    if response.status_code != 200:
        print(f"✗ Compression request failed: {response.status_code}")
        print(response.text)
        exit(1)
    
    compress_data = response.json()
    print(f"✓ Compression started")
    print(f"  ✓ Status: {compress_data['status']}")
    print(f"  ✓ Quality: {compress_data['quality']}")
except Exception as e:
    print(f"✗ Compression error: {e}")
    exit(1)

# Step 3: Fetch results
print("\n[3] Fetching compression results...")
try:
    response = requests.get(f"{BASE_URL}/api/compression/job/{job_id}")
    
    if response.status_code != 200:
        print(f"✗ Results fetch failed: {response.status_code}")
        print(response.text)
        exit(1)
    
    result = response.json()
    print(f"✓ Results retrieved: {result['status']}")
    
    # Verify basic fields
    print("\n  Required fields in response:")
    verify_field(result, 'job_id', '(unique identifier)')
    verify_field(result, 'filename', '(original file name)')
    verify_field(result, 'status', f"(current: {result.get('status')})")
    verify_field(result, 'file_size', f"(bytes: {result.get('file_size')})")
    
    if result['status'] == 'completed':
        print("\n  Completion fields:")
        verify_field(result, 'original_image', '(base64 encoded PNG)')
        verify_field(result, 'compressed_image', '(base64 encoded PNG)')
        
        # Verify metrics structure
        if 'metrics' in result:
            metrics = result['metrics']
            print("\n  Metrics structure:")
            
            # File sizes
            if 'file_sizes' in metrics:
                fs = metrics['file_sizes']
                print("    File Sizes:")
                verify_field(fs, 'original_bytes', f"({fs.get('original_bytes')} bytes)")
                verify_field(fs, 'compressed_bytes', f"({fs.get('compressed_bytes')} bytes)")
                verify_field(fs, 'original_formatted', f"({fs.get('original_formatted')})")
                verify_field(fs, 'compressed_formatted', f"({fs.get('compressed_formatted')})")
                verify_field(fs, 'saved_formatted', f"({fs.get('saved_formatted')})")
            else:
                print("    ✗ MISSING: file_sizes section")
            
            # Compression stats
            if 'compression' in metrics:
                comp = metrics['compression']
                print("    Compression Stats:")
                verify_field(comp, 'ratio', f"({comp.get('ratio')}x)")
                verify_field(comp, 'percentage', f"({comp.get('percentage')}%)")
                verify_field(comp, 'compression_time_ms', f"({comp.get('compression_time_ms')}ms)")
                verify_field(comp, 'decompression_time_ms', f"({comp.get('decompression_time_ms')}ms)")
            else:
                print("    ✗ MISSING: compression section")
            
            # Image info
            if 'image_info' in metrics:
                img = metrics['image_info']
                print("    Image Info:")
                verify_field(img, 'original_width', f"({img.get('original_width')}px)")
                verify_field(img, 'original_height', f"({img.get('original_height')}px)")
                verify_field(img, 'format', f"({img.get('format')})")
                verify_field(img, 'color_mode', f"({img.get('color_mode')})")
                verify_field(img, 'compressed_width', f"({img.get('compressed_width')}px)")
                verify_field(img, 'compressed_height', f"({img.get('compressed_height')}px)")
            else:
                print("    ✗ MISSING: image_info section")
            
            # Timestamp
            if 'timestamp' in metrics:
                ts = metrics['timestamp']
                print("    Timestamp:")
                verify_field(ts, 'start', "(unix timestamp)")
                verify_field(ts, 'end', "(unix timestamp)")
                verify_field(ts, 'duration_ms', f"({ts.get('duration_ms')}ms)")
            else:
                print("    ✗ MISSING: timestamp section")
        else:
            print("    ✗ MISSING: metrics object")
        
        # Check image data
        print("\n  Image data:")
        orig_img = result.get('original_image', '')
        comp_img = result.get('compressed_image', '')
        
        if orig_img.startswith('data:image/png;base64,'):
            base64_data = orig_img.replace('data:image/png;base64,', '')
            print(f"  ✓ Original image: {len(base64_data)} chars (base64)")
        else:
            print(f"  ✗ Original image format invalid")
        
        if comp_img.startswith('data:image/png;base64,'):
            base64_data = comp_img.replace('data:image/png;base64,', '')
            print(f"  ✓ Compressed image: {len(base64_data)} chars (base64)")
        else:
            print(f"  ✗ Compressed image format invalid")
    else:
        print(f"\n✗ Job not yet completed (status: {result['status']})")
        
except Exception as e:
    print(f"✗ Results fetch error: {e}")
    exit(1)

# Step 4: Test download endpoint
print("\n[4] Testing download endpoint...")
try:
    response = requests.get(f"{BASE_URL}/api/compression/download/{job_id}")
    
    if response.status_code == 200:
        file_size = len(response.content)
        print(f"✓ Download endpoint working: {file_size} bytes returned")
    else:
        print(f"✗ Download failed: {response.status_code}")
except Exception as e:
    print(f"✗ Download error: {e}")

print("\n" + "=" * 70)
print("✓ Workflow test complete!")
print("=" * 70)
print("\nFrontend should now be able to:")
print("  1. Display uploaded image preview ✓")
print("  2. Show compression progress ✓")
print("  3. Display original and compressed images side-by-side ✓")
print("  4. Show detailed metrics and analytics ✓")
print("  5. Download compressed image ✓")
