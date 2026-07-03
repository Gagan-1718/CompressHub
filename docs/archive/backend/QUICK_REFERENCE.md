"""
QUICK REFERENCE GUIDE - Image Compression Lab Backend

Copy-paste ready code snippets for common tasks.
"""

# ============================================================================
# QUICK START: COMPRESS AN IMAGE
# ============================================================================

# Simplest - ONE function call
from services.compression_workflow import compress_image_file

result = compress_image_file("photo.jpg", "output/photo")
if result['status'] == 'success':
    print(f"Ratio: {result['compression_ratio']:.2f}x")
    print(f"Saved: {result['compression_percentage']:.1f}%")

# Result includes:
# - original_file_size, compressed_size, compression_ratio
# - compression_percentage, compression_time_ms
# - image_metadata (width, height, channels, color_space)
# - compressed_file (path to .huff file)
# - metadata_file (path to .meta JSON file)

# ============================================================================
# QUICK START: DECOMPRESS AND REBUILD IMAGE
# ============================================================================

from services.compression_workflow import decompress_image_file, get_compression_report

# Decompress
decomp_result = decompress_image_file(
    result['compressed_file'],
    result['metadata_file'],
    "output/reconstructed.jpg",
    quality=95
)

if decomp_result['status'] == 'success':
    print(f"Rebuilt: {decomp_result['rebuilt_file']}")
    print(f"Time: {decomp_result['decompression_time_ms']:.1f}ms")
    
    # Get detailed report
    report = get_compression_report(result, decomp_result)

# ============================================================================
# QUICK START: WORK WITH METRICS
# ============================================================================

# Metrics are automatically included in compression results
from services.compression_workflow import compress_image_file

result = compress_image_file("photo.jpg", "output/photo")

if result['status'] == 'success':
    # Access metrics directly
    metrics = result['metrics']  # CompressionMetrics object
    print(f"Ratio: {metrics.compression_ratio}x")
    print(f"Saved: {metrics.compression_percentage:.1f}%")
    print(f"Time: {metrics.compression_time_ms:.2f}ms")
    
    # Get API-formatted response (for frontend)
    api_metrics = result['api_metrics']
    import json
    print(json.dumps(api_metrics, indent=2))
    
    # Get human-readable summary
    from utils.metrics import MetricsFormatter
    summary = MetricsFormatter.format_summary(metrics)
    print(summary)

# ============================================================================
# METRICS: FORMAT FOR API RESPONSE
# ============================================================================

from utils.metrics import MetricsFormatter, MetricsCalculator

# Create metrics from raw data
metrics = MetricsCalculator.create_metrics(
    original_file_size=5_242_880,
    compressed_file_size=1_789_272,
    compression_time_ms=145.5,
    image_format="JPEG",
    image_width=1920,
    image_height=1080,
    image_channels=3,
)

# Format for API response (what frontend receives)
api_response = MetricsFormatter.format_api_response(metrics)
# Returns: {
#   "file_sizes": {"original_bytes": 5242880, ...},
#   "compression": {"ratio": 2.93, "percentage": 65.87, ...},
#   "image_info": {"format": "JPEG", "width": 1920, ...},
#   "timestamp": "2026-03-15T10:30:45..."
# }

# ============================================================================
# METRICS: TIME OPERATIONS
# ============================================================================

from utils.metrics import CompressionTimer

# Measure operation timing
with CompressionTimer("Compression") as timer:
    # Do compression work
    pass

elapsed_ms = timer.get_elapsed_ms()
print(f"Operation took {elapsed_ms:.2f}ms")

# ============================================================================
# METRICS: FORMAT FILE SIZES
# ============================================================================

from utils.metrics import MetricsCalculator

# Convert bytes to human-readable
print(MetricsCalculator.format_file_size(1024))           # "1.00 KB"
print(MetricsCalculator.format_file_size(1_048_576))      # "1.00 MB"
print(MetricsCalculator.format_file_size(5_242_880))      # "5.00 MB"

# ============================================================================
# STEP-BY-STEP: COMPRESS WITH CUSTOM HANDLING
# ============================================================================

from services.image_processing import ImageProcessor
from services.compression.demo import compress_data
import numpy as np

# 1. Load image
image = ImageProcessor.load_image("photo.jpg")

# 2. Get metadata for reconstruction
metadata = ImageProcessor.get_image_metadata(image)
print(f"Dimensions: {metadata.width}x{metadata.height}")
print(f"Channels: {metadata.channels}")

# 3. Extract pixel data (flattened 1D for compression)
pixels = ImageProcessor.extract_pixel_array(image, flatten=True)
pixels_bytes = pixels.astype(np.uint8).tobytes()

# 4. Compress
compressed, tree_metadata, padding, stats = compress_data(pixels_bytes)
print(f"Ratio: {stats.calculate_ratio():.2f}x")
print(f"Unique symbols: {stats.unique_symbols}")

# 5. Save manually if needed
import json
from pathlib import Path

compressed_file = Path("output/compressed.huff")
compressed_file.parent.mkdir(parents=True, exist_ok=True)
with open(compressed_file, 'wb') as f:
    f.write(compressed)

metadata_file = Path("output/metadata.meta")
meta_data = {
    'image': {
        'width': metadata.width,
        'height': metadata.height,
        'channels': metadata.channels,
        'color_space': metadata.color_space,
    },
    'compression': {
        'original_size': len(pixels_bytes),
        'compressed_size': len(compressed),
        'padding': padding,
    },
    'huffman_tree': tree_metadata,
}
with open(metadata_file, 'w') as f:
    json.dump(meta_data, f)

# ============================================================================
# STEP-BY-STEP: DECOMPRESS WITH CUSTOM HANDLING
# ============================================================================

from services.compression.demo import decompress_data

# 1. Load metadata and compressed data
import json
with open("output/metadata.meta", 'r') as f:
    metadata_dict = json.load(f)

with open("output/compressed.huff", 'rb') as f:
    compressed_bytes = f.read()

# 2. Decompress
decompressed_pixels = decompress_data(
    compressed_bytes,
    metadata_dict['huffman_tree'],
    metadata_dict['compression']['padding']
)

# 3. Reshape to image dimensions
pixels_array = np.frombuffer(decompressed_pixels, dtype=np.uint8)
pixels_array = pixels_array.reshape(
    metadata_dict['image']['height'],
    metadata_dict['image']['width'],
    metadata_dict['image']['channels']
)

# 4. Reconstruct image
from services.image_processing import ImageMetadata
img_metadata = ImageMetadata(
    width=metadata_dict['image']['width'],
    height=metadata_dict['image']['height'],
    channels=metadata_dict['image']['channels'],
    color_space=metadata_dict['image']['color_space'],
    format='JPEG',
    total_pixels=metadata_dict['image']['width'] * metadata_dict['image']['height'],
)
image = ImageProcessor.reconstruct_image(pixels_array, img_metadata)

# 5. Save
ImageProcessor.save_image(image, "output/reconstructed.jpg", quality=95)

# ============================================================================
# WORKING WITH DIFFERENT FORMATS
# ============================================================================

# Load any format
image = ImageProcessor.load_image("photo.jpg")    # JPG
image = ImageProcessor.load_image("image.png")    # PNG
image = ImageProcessor.load_image("pic.bmp")      # BMP

# Convert color spaces if needed
rgb_image = ImageProcessor.convert_to_rgb(image)

# Save in any format
ImageProcessor.save_image(image, "output.jpg", quality=95)  # JPEG with quality
ImageProcessor.save_image(image, "output.png")              # PNG (lossless)
ImageProcessor.save_image(image, "output.bmp")              # BMP

# ============================================================================
# VALIDATION AND CHECK
# ============================================================================

from pathlib import Path

# Check file exists before loading
filepath = Path("photo.jpg")
if not filepath.exists():
    raise FileNotFoundError(f"File not found: {filepath}")

# Validate image after loading
image = ImageProcessor.load_image(str(filepath))
if not ImageProcessor.validate_image(image):
    raise ValueError("Invalid image")

# Get file size
file_size = ImageProcessor.get_file_size(str(filepath))
print(f"File size: {file_size:,} bytes")

# Check file format
supported = {'.jpg', '.jpeg', '.png', '.bmp'}
if filepath.suffix.lower() not in supported:
    raise ValueError(f"Unsupported format: {filepath.suffix}")

# ============================================================================
# WORKING WITH API (FastAPI)
# ============================================================================

# In your route handler
from fastapi import UploadFile, File, BackgroundTasks
from services.compression_workflow import compress_image_file

@router.post("/compress")
async def compress_endpoint(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks
):
    # Save uploaded file
    from utils import save_uploaded_file
    import uuid
    
    job_id = str(uuid.uuid4())
    content = await file.read()
    filepath = save_uploaded_file(content, f"{job_id}_{file.filename}")
    
    # Queue background compression
    background_tasks.add_task(
        compress_image_file,
        filepath,
        f"output/{job_id}",
        True  # enable_preprocessing
    )
    
    return {"job_id": job_id, "message": "Compression queued"}

# Get results
@router.get("/metrics/{job_id}")
async def get_metrics(job_id: str):
    # Load and return saved metrics
    import json
    with open(f"output/{job_id}.meta", 'r') as f:
        metadata = json.load(f)
    
    return {
        "compression_ratio": metadata['compression']['compression_ratio'],
        "saved_percentage": metadata['compression']['compression_percentage'],
        "time_ms": metadata['compression']['compression_time_ms'],
    }

# ============================================================================
# COMMON ERRORS AND FIXES
# ============================================================================

# Error: FileNotFoundError
# Fix: Check path exists
# from pathlib import Path
# assert Path(filepath).exists(), f"File not found: {filepath}"

# Error: ValueError: Unsupported format
# Fix: Use .jpg, .png, or .bmp extension
# Correct: "image.jpg"  ✓
# Wrong:   "image.jpeg" ✗ (use .jpg)

# Error: Shape mismatch during reconstruction
# Fix: Make sure array is NOT flattened
# Wrong: pixels = ImageProcessor.extract_pixel_array(image, flatten=True)
#        image = reconstruct_image(pixels, metadata)  # ✗
# Right: pixels = ImageProcessor.extract_pixel_array(image, flatten=False)
#        image = reconstruct_image(pixels, metadata)  # ✓

# Error: Decompression produces different size
# Fix: Ensure metadata.padding is used correctly
# decompress_data(compressed, tree_meta, padding_bits)  # Include padding!

# ============================================================================
# PERFORMANCE TIPS
# ============================================================================

# 1. Use flatten=True only for compression
#    pixels_for_compression = extract_pixel_array(image, flatten=True)
#
# 2. Use flatten=False for analysis/processing
#    pixels_for_analysis = extract_pixel_array(image, flatten=False)
#
# 3. Color conversion can be expensive
#    # Only convert if needed
#    if image.mode != 'RGB':
#        image = ImageProcessor.convert_to_rgb(image)
#
# 4. Large images take longer
#    # Process in chunks or resize
#    if image.size[0] > 1920:
#        image.thumbnail((1920, 1080))
#
# 5. JPEG quality affects output size
#    # quality=95: Best quality, larger file
#    # quality=85: Good compromise
#    # quality=75: Smaller file, noticeable quality loss
#    ImageProcessor.save_image(image, "output.jpg", quality=85)

# ============================================================================
# TESTING YOUR IMPLEMENTATION
# ============================================================================

# 1. Run validation test
#    python test_huffman.py

# 2. Run image processing demo
#    python -m services.image_processing_demo

# 3. Test compression workflow manually
if __name__ == "__main__":
    from services.compression_workflow import compress_image_file, decompress_image_file
    
    # Test compress
    result = compress_image_file("test.jpg", "test_output")
    print(f"✓ Compression: {result['compression_ratio']:.2f}x")
    
    # Test decompress
    result2 = decompress_image_file(
        result['compressed_file'],
        result['metadata_file'],
        "test_reconstructed.jpg"
    )
    print(f"✓ Decompression: {result2['decompression_time_ms']:.1f}ms")

# ============================================================================
# USEFUL IMPORTS FOR YOUR CODE
# ============================================================================

# Image processing
from services.image_processing import (
    ImageProcessor,
    ImageMetadata,
    load_image,
    extract_pixel_array,
    reconstruct_image,
    save_image,
)

# Compression workflows
from services.compression_workflow import (
    compress_image_file,
    decompress_image_file,
    get_compression_report,
)

# Huffman compression (for low-level control)
from services.compression.demo import compress_data, decompress_data

# Huffman engine (for advanced use)
from services.compression.huffman import (
    HuffmanTree,
    build_frequency_table,
    build_huffman_tree,
    encode_pixels,
    decode_pixels,
)

# File utilities
from utils import (
    save_uploaded_file,
    save_compressed_file,
    load_file,
    delete_file,
    get_file_size,
)

# Validation
from utils import (
    validate_file_extension,
    validate_file_size,
    validate_image_dimensions,
)

# ============================================================================
# COPY-PASTE TEMPLATES
# ============================================================================

# Template 1: Simple compression route
"""
@router.post("/compress/{job_id}")
async def compress(job_id: str, background_tasks: BackgroundTasks):
    from services.compression_workflow import compress_image_file
    background_tasks.add_task(
        compress_image_file,
        f"storage/{job_id}.jpg",
        f"storage/{job_id}",
        True
    )
    return {"status": "queued"}
"""

# Template 2: Decompression route
"""
@router.get("/download/{job_id}")
async def download(job_id: str):
    from fastapi.responses import FileResponse
    filepath = f"storage/{job_id}_reconstructed.jpg"
    return FileResponse(filepath, media_type="image/jpeg")
"""

# Template 3: Background compression task
"""
async def compress_task(job_id: str):
    from services.compression_workflow import compress_image_file
    result = compress_image_file(f"uploads/{job_id}.jpg", f"output/{job_id}")
    jobs[job_id]['result'] = result
    jobs[job_id]['status'] = 'completed'
"""

# ============================================================================
