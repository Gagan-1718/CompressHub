"""
README - Backend Setup Instructions
"""

# Interactive Image Compression Lab - Backend

**Status:** ✅ **Phase 1 Complete** - Backend fully implemented and tested

This is the FastAPI backend for the Image Compression Lab application. The backend includes a complete Huffman compression engine, multi-format image processing, and REST API endpoints.

### 📚 Documentation Guides
- **[PROJECT_STATUS.md](../PROJECT_STATUS.md)** - Overall project status, what's built, what's next
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Copy-paste code snippets and common tasks
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete system design and data flow
- **[HUFFMAN_IMPLEMENTATION.md](HUFFMAN_IMPLEMENTATION.md)** - Compression algorithm details
- **[IMAGE_PROCESSING.md](IMAGE_PROCESSING.md)** - Image processing module documentation

### What's Implemented ✅
- **Huffman Compression Engine** (450+ lines) - Optimal variable-length encoding
- **Image Processing Module** (600+ lines) - JPG/PNG/BMP support
- **Compression Workflow** (450+ lines) - End-to-end pipeline
- **Metrics Module** (500+ lines) - Comprehensive metrics calculation and formatting
- **FastAPI REST API** (7 endpoints) - Image upload, compression, metrics
- **File Storage System** - Upload and compressed file management
- **Input Validation** - File size, extension, dimensions
- **Comprehensive Tests** - Unit and integration test suite

### What's Next 🔄
- **Database Integration** - PostgreSQL with SQLAlchemy (2-3 hours)
- **Background Task Processing** - For 500MB+ files (2-3 hours)
- **Frontend Development** - Next.js + Tailwind CSS (10-15 hours)
- **Production Deployment** - Docker + cloud setup (3-5 hours)

## Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── config.py                  # Configuration and settings
├── requirements.txt           # Python dependencies
├── .env.example               # Example environment variables
├── routes/
│   ├── __init__.py
│   └── compression.py         # Compression API endpoints
├── services/
│   ├── __init__.py
│   ├── compression.py         # Huffman compression service (stub)
│   └── image_processor.py     # Image processing utilities
├── models/
│   ├── __init__.py
│   └── compression.py         # Pydantic data models
├── utils/
│   ├── __init__.py
│   ├── storage.py             # File storage utilities
│   └── validators.py          # Input validation
└── storage/
    ├── uploads/               # Uploaded images directory
    └── compressed/            # Compressed files directory
```

## Setup Instructions

### 1. Create Python Virtual Environment

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env with your settings (optional for development)
```

### 4. Run Development Server

```bash
python main.py
```

Or using Uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
- `GET /health` - Application health status

### API Root
- `GET /api` - List available endpoints

### Compression Endpoints
- `POST /api/compression/upload` - Upload an image
- `POST /api/compression/compress/{job_id}` - Start compression (stub)
- `GET /api/compression/job/{job_id}` - Get job status
- `GET /api/compression/metrics/{job_id}` - Get compression metrics (stub)
- `GET /api/compression/compare/{job_id}` - Get comparison images (stub)
- `DELETE /api/compression/job/{job_id}` - Delete job

## Documentation

Once the server is running:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## Current Status

✅ **Completed:**
- FastAPI application structure
- CORS configuration
- File upload endpoint (validation + storage)
- Job tracking system (in-memory)
- Image processing utilities (ImageProcessor class)
- Data models (Pydantic)
- File storage utilities
- Input validators
- **Huffman compression engine** (core algorithm)
- **Huffman tree construction** (priority queue based)
- **Huffman encoding/decoding** (variable-length codes)
- **Tree serialization** (JSON metadata storage)
- **Compression statistics** (ratio, percentage, timing)
- **Image Processing Module** (load, extract, reconstruct, save)
- **Compression Workflow** (end-to-end compression/decompression)

⏳ **To Be Implemented:**
- Database integration (PostgreSQL)
- Background task processing (Celery/AsyncIO)
- API endpoint integration with workflows
- Frontend (Next.js) integration

## Image Processing Module

Complete image I/O and processing for compression workflows:

### Location
```
backend/services/
├── image_processing.py         # Core image operations (700+ lines)
├── compression_workflow.py      # Complete workflows
├── image_processing_demo.py     # Examples and tests
└── compression/                 # Huffman engine
```

### Key Components
- **ImageProcessor class**: Static methods for all operations
- **ImageMetadata dataclass**: Image properties and metadata
- **load_image()**: Load JPG, PNG, BMP formats
- **extract_pixel_array()**: Convert to NumPy arrays (2D/3D)
- **reconstruct_image()**: Build image from pixels
- **save_image()**: Save with format options
- **convert_to_rgb()**: Color space conversion
- **validate_image()**: Image integrity checking

### Supported Formats
```
Input:  JPG, PNG, BMP (autodetect)
Output: JPG (with quality), PNG, BMP
Color:  RGB (3ch), RGBA (4ch), Grayscale (1ch)
Data:   uint8 (0-255 per channel)
```

### Quick Usage
```python
from services.image_processing import ImageProcessor
import numpy as np

# Load image
image = ImageProcessor.load_image("photo.jpg")

# Get metadata
metadata = ImageProcessor.get_image_metadata(image)
print(f"Dimensions: {metadata.width}x{metadata.height}")

# Extract pixels (3D for analysis)
pixels_3d = ImageProcessor.extract_pixel_array(image, flatten=False)
print(f"Shape: {pixels_3d.shape}")  # (height, width, 3)

# Extract pixels (1D for compression)
pixels_1d = ImageProcessor.extract_pixel_array(image, flatten=True)
pixels_bytes = pixels_1d.tobytes()

# Compress
from services.compression.demo import compress_data
compressed, tree_meta, padding, stats = compress_data(pixels_bytes)
print(f"Ratio: {stats.calculate_ratio():.2f}x")

# Decompress and reconstruct
from services.compression.demo import decompress_data
decompressed = decompress_data(compressed, tree_meta, padding)
pixels = np.frombuffer(decompressed, dtype=np.uint8)
pixels = pixels.reshape(metadata.height, metadata.width, metadata.channels)
image = ImageProcessor.reconstruct_image(pixels, metadata)

# Save
ImageProcessor.save_image(image, "output.jpg", quality=95)
```

### Complete Workflows

**One-call compression:**
```python
from services.compression_workflow import compress_image_file

result = compress_image_file(
    "original.jpg",
    "output/photo",
    enable_preprocessing=True
)

if result['status'] == 'success':
    print(f"Ratio: {result['compression_ratio']:.2f}x")
    print(f"Saved: {result['compression_percentage']:.1f}%")
```

**One-call decompression:**
```python
from services.compression_workflow import decompress_image_file

result = decompress_image_file(
    "output/photo.huff",
    "output/photo.meta",
    "output/reconstructed.jpg",
    quality=95
)

if result['status'] == 'success':
    print(f"Rebuilt: {result['rebuilt_file']}")
```

## Compression Workflow

The `compression_workflow.py` module provides:

**compress_image_file(image_path, output_prefix, enable_preprocessing)**
- Loads image from disk
- Extracts pixel data
- Applies Huffman compression
- Saves compressed data (.huff) and metadata (.meta)
- Returns comprehensive results dictionary

**decompress_image_file(compressed_file, metadata_file, output_path, quality)**
- Loads compressed data and metadata
- Decompresses using Huffman decoding
- Reconstructs image from pixels
- Saves to disk
- Returns verification results

**get_compression_report(compress_result, decompress_result)**
- Generates formatted statistics
- Shows compression metrics
- Includes timing information
- Verifies data integrity

### Running Demo

```bash
# Complete image processing demo
python -m services.image_processing_demo

# Tests 4 scenarios:
# 1. Basic image operations
# 2. Complete compression workflow
# 3. Different file formats
# 4. Edge cases
```

## Notes

- Currently using in-memory job tracking (suitable for development)
- File storage uses local filesystem (suitable for development)
- CORS configured for localhost:3000 (Next.js frontend default)
- All endpoints are documented in Swagger UI
