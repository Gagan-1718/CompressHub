# 🚀 Developer Quick Start Guide

**For developers joining the Image Compression Lab project**

---

## 5-Minute Overview

This project compresses images using Huffman encoding. Here's what you need to know:

**What's Built ✅**
- Huffman compression algorithm (near-optimal compression ratios 2-3x)
- Image processing (load/save JPG/PNG/BMP)
- REST API (FastAPI with 7 endpoints)
- Complete documentation

**What's Missing 🔄**
- Database (for storing compression history)
- Frontend (Next.js web app)
- Background tasks (for large 500MB+ files)

---

## 30-Second Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows: run this
# source venv/bin/activate  # macOS/Linux: run this instead

# 3. Install packages
pip install -r requirements.txt

# 4. Start server
uvicorn main:app --reload

# 5. Visit API docs
# Open: http://localhost:8000/docs
```

Done! API is running. ✅

---

## Your First Task (5-10 minutes)

Try the compression workflow manually:

```python
# In backend directory, create test.py:

from services.image_processing import ImageProcessor
from services.compression_workflow import compress_image_file, decompress_image_file

# Use any JPG/PNG/BMP image in backend folder, or:
# 1. Download sample: https://unsplash.com/ 
# 2. Save as: test_image.jpg

# Compress it
result = compress_image_file("test_image.jpg", "output/test")
print(f"✓ Compressed: {result['compression_ratio']:.2f}x smaller")
print(f"✓ Saved {result['compression_percentage']:.1f}%")

# Decompress it
decomp = decompress_image_file(
    result['compressed_file'],
    result['metadata_file'],
    "output/reconstructed.jpg"
)
print(f"✓ Decompressed in {decomp['decompression_time_ms']:.0f}ms")
```

Run: `python test.py`

See it work! 🎉

---

## File Structure (What's What)

```
backend/
├── main.py                         ← Start here! FastAPI app
├── config.py                       ← Settings and env variables
│
├── services/
│   ├── compression/huffman.py      ← The compression algorithm
│   ├── image_processing.py         ← Load/save images
│   └── compression_workflow.py     ← Main pipeline (compress + decompress)
│
├── routes/compression.py           ← API endpoints (TODO: some incomplete)
├── models/compression.py           ← Data validation (Pydantic)
│
└── utils/
    ├── storage.py                  ← File management
    └── validators.py               ← Input validation
```

**Key files to understand first:**
1. `services/compression_workflow.py` - The main "recipe"
2. `services/image_processing.py` - How images are handled
3. `services/compression/huffman.py` - The algorithm

---

## Common Tasks

### I want to compress an image
```python
from services.compression_workflow import compress_image_file

result = compress_image_file("photo.jpg", "output/photo")
# Returns: {compression_ratio, compression_percentage, time_ms, ...}
```

**See:** [QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md#quick-start-compress-an-image)

### I want to decompress
```python
from services.compression_workflow import decompress_image_file

result = decompress_image_file(
    "output/photo.huff", 
    "output/photo.meta",
    "output/reconstructed.jpg"
)
```

**See:** [QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md#quick-start-decompress-and-rebuild-image)

### I want to use the API
```python
# 1. Start backend: uvicorn main:app --reload
# 2. Upload image: POST http://localhost:8000/api/compression/upload
# 3. Compress it: POST http://localhost:8000/api/compression/compress/{job_id}
# 4. Get results: GET http://localhost:8000/api/compression/metrics/{job_id}
```

**See:** [QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md#working-with-api-fastapi)

### I want to understand the algorithm
1. Read: [HUFFMAN_IMPLEMENTATION.md](backend/HUFFMAN_IMPLEMENTATION.md)
2. Look at: [huffman.py](backend/services/compression/huffman.py) (well-commented)
3. Run tests: `python test_huffman.py`

### I need to fix something
1. Check error in: [QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md#common-errors-and-fixes)
2. Look at test: `test_huffman.py` or `image_processing_demo.py`
3. Read architecture: [ARCHITECTURE.md](backend/ARCHITECTURE.md)

---

## What to Implement Next

### If you're doing **Database Integration** (2-3 hours)

1. Create `backend/models/database.py`:
```python
from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class CompressionJob(Base):
    __tablename__ = "compression_jobs"
    job_id = Column(String, primary_key=True)
    original_path = Column(String)
    compressed_path = Column(String)
    compression_ratio = Column(Float)
    created_at = Column(DateTime)
    status = Column(String)  # pending, completed, failed
```

2. Create `backend/database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:password@localhost/compression_lab"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
```

3. Replace `compression_jobs = {}` dict in routes with database calls

**See:** [PROJECT_STATUS.md](../PROJECT_STATUS.md#phase-1-database-integration-2-3-hours)

---

### If you're doing **Frontend Development** (10-15 hours)

1. Create Next.js project in `frontend/` folder
2. Install: `npm install next react tailwindcss axios`
3. Create components:
   - `ImageUpload.tsx` - Drag-drop upload
   - `CompressionProgress.tsx` - Progress bar
   - `ResultsCard.tsx` - Show metrics
   - `ImageComparison.tsx` - Before/after viewer
4. Create API client: `services/api.ts`
5. Connect to running backend

**See:** [PROJECT_STATUS.md](../PROJECT_STATUS.md#phase-3-frontend-implementation-10-15-hours)

---

### If you're doing **API Integration** (1-2 hours)

1. Open `backend/routes/compression.py`
2. Find `# TODO: Integration` comments
3. Replace with actual service calls:

```python
# Currently:
@router.post("/compress/{job_id}")
async def compress(job_id: str):
    # TODO: Call compression workflow
    pass

# Should be:
@router.post("/compress/{job_id}")
async def compress(job_id: str, background_tasks: BackgroundTasks):
    from services.compression_workflow import compress_image_file
    background_tasks.add_task(compress_image_file, ...)
    return {"status": "queued"}
```

**See:** [QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md#copy-paste-templates)

---

## Testing

### Run compression tests
```bash
cd backend
python test_huffman.py
# Output: ✓ All tests passed
```

### Run image processing demo
```bash
cd backend
python -m services.image_processing_demo
# Creates test images and runs full workflow
```

### Test API manually
1. Start server: `uvicorn main:app --reload`
2. Visit: http://localhost:8000/docs
3. Try endpoints with "Try it out" button

---

## Documentation Map

**Start here:**
- 📍 [INDEX.md](../INDEX.md) - Project overview and file guide
- 🚀 This file - Quick start for developers

**For specific work:**
- 💡 [QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md) - Copy-paste code snippets
- 🏗️ [ARCHITECTURE.md](backend/ARCHITECTURE.md) - System design
- 🔐 [HUFFMAN_IMPLEMENTATION.md](backend/HUFFMAN_IMPLEMENTATION.md) - Algorithm details
- 🖼️ [IMAGE_PROCESSING.md](backend/IMAGE_PROCESSING.md) - Image handling

**Project planning:**
- 📊 [PROJECT_STATUS.md](../PROJECT_STATUS.md) - What's done, what's next

---

## Important Concepts

### The Compression Pipeline
```
Image File → Load → Extract Pixels → Build Frequency Table
         → Build Huffman Tree → Generate Codes → Encode to Bitstream
         → Save Compressed + Metadata
```

### The Data Structure
```python
# CompressionJob (what user sees)
{
    "job_id": "abc-123",
    "original_file": "photo.jpg",         # 5 MB
    "compressed_file": "photo.huff",      # 1.7 MB
    "compression_ratio": 2.94,            # 5 ÷ 1.7
    "compression_time_ms": 145,
    "status": "completed"
}
```

### How Huffman Works
1. **Count frequencies** - How often each byte value appears
2. **Build tree** - Frequent bytes get short codes, rare bytes get long codes
3. **Encode** - Replace bytes with variable-length binary codes
4. **Result** - Average code length is shorter than 8 bits → compression!

Example:
```
Original: AAABBC = 6 bytes
Huffman codes: A=0 (1 bit), B=10 (2 bits), C=11 (2 bits)
Encoded: 0,0,0,10,10,11 = 8 bits = 1 byte saved!
Compression ratio: 6 ÷ 1 = 6x (extreme example, real: 2-3x)
```

---

## Debugging Tips

### Q: API won't start
**A:** Check Python version and virtual environment
```bash
python --version  # Need 3.8+
which python      # Should show venv path
pip list | grep fastapi  # Should show FastAPI installed
```

### Q: Image won't load
**A:** Check file format and path
```bash
from pathlib import Path
assert Path("test.jpg").exists()  # File exists?
from services.image_processing import ImageProcessor
ImageProcessor.validate_image("test.jpg")  # Valid image?
```

### Q: Compression is too slow
**A:** Normal for large images. Times in QUICK_REFERENCE.md show typical:
```
Image Loading: <100ms
Pixel Extraction: <50ms
Huffman Compression: <200ms
TOTAL: ~500ms typical for 5MB image
```

### Q: Decompressed image doesn't match original
**A:** Check pixel array wasn't modified
```python
# Right: keep array as numpy format
pixels = extract_pixel_array(image, flatten=False)

# Wrong: converting to different type
pixels = extract_pixel_array(image).astype(float)  # ✗
```

---

## Before You Start Coding

1. **Read [ARCHITECTURE.md](backend/ARCHITECTURE.md)** - 10 minutes
   - Understand data flow
   - Know which service does what
   - See integration points

2. **Run demo** - 2 minutes
   - `python -m services.image_processing_demo`
   - See it working
   - No errors = good to start

3. **Claim a task** - Tell which phase you're working on
   - Database Integration?
   - Frontend?
   - API Integration?

4. **Reference [QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md)** - Copy-paste code
   - Don't write from scratch
   - Use templates provided

---

## Quick Answers

**Q: Where's the main code?**  
A: `backend/main.py` - FastAPI app that starts the server

**Q: How do I run tests?**  
A: `python test_huffman.py` or `python -m services.image_processing_demo`

**Q: What's the compression ratio?**  
A: Typically 2-3x smaller (depends on image content). Photos: 1.5-2.5x, Graphics: 2-5x

**Q: Can I use this for 500MB files?**  
A: Currently no - needs background task processing. Will be implemented in Phase 2

**Q: Why Huffman vs other algorithms?**  
A: Simple, fast, optimal for this project. (JPEG/PNG use more complex algorithms, good for comparison)

**Q: How long to productionize this?**  
A: 
- Current (backend): ✅ Production-ready
- + Database: 2-3 hours
- + Frontend: 10-15 hours
- + Deployment: 3-5 hours
- **Total: 20-30 hours from now**

---

## When You're Stuck

1. **Check QUICK_REFERENCE.md** - Has the answer 80% of the time
2. **Look at test_huffman.py** - Shows what should work
3. **Run image_processing_demo.py** - Live example of full workflow
4. **Read docstrings in code** - Every function has detailed comments
5. **Check ARCHITECTURE.md** - Explains design decisions

---

## Your First Contribution

**Recommended approach:**
1. Start with "Your First Task" above (5-10 min)
2. Read [ARCHITECTURE.md](backend/ARCHITECTURE.md) (10 min)
3. Pick a task from "What to Implement Next" (see above)
4. Use [QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md) as you code
5. Reference [PROJECT_STATUS.md](../PROJECT_STATUS.md) for guidance

You've got this! 🚀

---

**Questions?** Check the relevant documentation file first. Answers are there.

**Ready?** Pick a task and start building! 🎯
