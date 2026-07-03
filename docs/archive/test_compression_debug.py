#!/usr/bin/env python
"""Debug compression function"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from backend.routes.compression import perform_compression, compression_jobs
from backend.routes.compression import upload_image as upload_func
import asyncio
from PIL import Image
import io
import time

# Create comprehensive test
print("Testing compression function directly...")

# Simulate a job
test_job_id = "test-job-001"
test_image_path = Path("storage/uploads/test_image.png")

# Add a job to compression_jobs
compression_jobs[test_job_id] = {
    'filepath': str(test_image_path),
    'filename': 'test_image.png',
    'status': 'uploaded',
    'file_size': 690,
    'compression_start': time.time(),
}

print(f"✓ Created test job: {test_job_id}")
print(f"  File: {test_image_path}")
print(f"  Exists: {test_image_path.exists()}")

# Run compression
print("\nRunning compression...")
try:
    perform_compression(test_job_id, quality='high')
    print("✓ Compression completed")
except Exception as e:
    print(f"✗ Compression failed: {e}")
    import traceback
    traceback.print_exc()

# Check results
print("\nJob status after compression:")
job = compression_jobs[test_job_id]
print(f"  Status: {job['status']}")
print(f"  Metrics: {job.get('metrics', {})}")
print(f"  Has original_base64: {'original_base64' in job}")
print(f"  Has compressed_base64: {'compressed_base64' in job}")

if 'error' in job:
    print(f"  ERROR: {job['error']}")
