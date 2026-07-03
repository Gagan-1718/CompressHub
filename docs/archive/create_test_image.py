#!/usr/bin/env python
"""Create a test image for compression testing"""
from PIL import Image
import numpy as np
from pathlib import Path

# Create test image
width, height = 100, 100
img = Image.new('RGB', (width, height))
pixels = img.load()

# Create a pattern with gradients
for x in range(width):
    for y in range(height):
        r = int(255 * (x / width))
        g = int(255 * (y / height))
        b = int(255 * ((x + y) / (width + height)))
        pixels[x, y] = (r, g, b)

# Save test image
test_dir = Path(__file__).parent / "storage" / "uploads"
test_dir.mkdir(parents=True, exist_ok=True)
test_image_path = test_dir / "test_image.png"
img.save(str(test_image_path))

print(f"✓ Test image created: {test_image_path}")
print(f"✓ Size: {img.size}")
print(f"✓ Mode: {img.mode}")
print(f"✓ File size: {test_image_path.stat().st_size} bytes")
