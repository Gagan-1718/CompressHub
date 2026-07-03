# Compression Metrics Module

**File:** `utils/metrics.py`

Comprehensive metrics calculation and formatting module for compression operations. Integrates with the compression pipeline to provide consistent, production-ready metrics reporting.

---

## Overview

The metrics module provides:

- 📊 **Metrics Calculation** - Compression ratio, percentage, timing
- 📄 **Metrics Formatting** - JSON for APIs, human-readable summaries, comparisons
- ⏱️ **Timing Utilities** - Context manager for precise operation timing
- 📤 **API Integration** - Formatted responses ready for frontend consumption

---

## Core Components

### 1. `CompressionMetrics` (Data Class)

Stores all compression-related metrics in a structured format.

**Attributes:**
```python
original_file_size: int           # Original file size in bytes
compressed_file_size: int         # Compressed file size in bytes
compression_ratio: float          # original / compressed (e.g., 2.5)
compression_percentage: float     # % space saved (0-100)
compression_time_ms: float        # Compression time in milliseconds
decompression_time_ms: Optional[float]  # Decompression time (optional)
original_file_path: Optional[str]  # Path to original file
compressed_file_path: Optional[str]  # Path to compressed file
image_format: Optional[str]       # Image format (JPEG, PNG, BMP)
image_width: Optional[int]        # Image width in pixels
image_height: Optional[int]       # Image height in pixels
image_channels: Optional[int]     # Number of color channels
total_pixels: Optional[int]       # Width × Height
timestamp: Optional[str]          # ISO 8601 timestamp
```

**Methods:**
```python
metrics.to_dict()      # Convert to dictionary
metrics.to_json()      # Convert to JSON string
```

**Example:**
```python
metrics = CompressionMetrics(
    original_file_size=5_242_880,
    compressed_file_size=1_789_272,
    compression_ratio=2.93,
    compression_percentage=65.87,
    compression_time_ms=145.5,
    decompression_time_ms=125.3,
    image_format="JPEG",
    image_width=1920,
    image_height=1080,
    image_channels=3,
)

print(metrics.to_dict())
print(metrics.to_json())
```

---

### 2. `MetricsCalculator`

Static utility class for calculating compression metrics from raw data.

**Methods:**

#### `get_file_size(file_path: str) -> int`
Get file size in bytes.

```python
from utils.metrics import MetricsCalculator

size = MetricsCalculator.get_file_size("image.jpg")
# Returns: 5242880
```

#### `calculate_compression_ratio(original_size: int, compressed_size: int) -> float`
Calculate compression ratio (original / compressed).

```python
ratio = MetricsCalculator.calculate_compression_ratio(5_242_880, 1_789_272)
# Returns: 2.93
```

#### `calculate_compression_percentage(original_size: int, compressed_size: int) -> float`
Calculate percentage of space saved.

```python
percentage = MetricsCalculator.calculate_compression_percentage(5_242_880, 1_789_272)
# Returns: 65.87
```

#### `format_file_size(size_bytes: int) -> str`
Convert bytes to human-readable format.

```python
# Examples
MetricsCalculator.format_file_size(1024)           # Returns: "1.00 KB"
MetricsCalculator.format_file_size(1_048_576)      # Returns: "1.00 MB"
MetricsCalculator.format_file_size(5_242_880)      # Returns: "5.00 MB"
MetricsCalculator.format_file_size(1_073_741_824)  # Returns: "1.00 GB"
```

#### `create_metrics(...) -> CompressionMetrics`
Create a CompressionMetrics object with all calculations.

```python
metrics = MetricsCalculator.create_metrics(
    original_file_size=5_242_880,
    compressed_file_size=1_789_272,
    compression_time_ms=145.5,
    decompression_time_ms=125.3,
    original_file_path="image.jpg",
    compressed_file_path="image.huff",
    image_format="JPEG",
    image_width=1920,
    image_height=1080,
    image_channels=3,
)
```

---

### 3. `CompressionTimer`

Context manager for precise timing of operations.

**Usage:**
```python
from utils.metrics import CompressionTimer

with CompressionTimer("Compression") as timer:
    # Do compression work here
    pass

elapsed_ms = timer.get_elapsed_ms()
print(f"Compression took {elapsed_ms:.2f}ms")
```

**Features:**
- Automatic start/stop timing
- Millisecond precision
- Thread-safe
- Error-safe (works even if exception occurs)

---

### 4. `MetricsFormatter`

Formats metrics for different contexts (API, human-readable, comparisons).

**Methods:**

#### `format_api_response(metrics: CompressionMetrics) -> Dict[str, Any]`
Format metrics for REST API JSON response.

```python
api_response = MetricsFormatter.format_api_response(metrics)
# Returns:
# {
#   "file_sizes": {
#     "original_bytes": 5242880,
#     "original_formatted": "5.00 MB",
#     "compressed_bytes": 1789272,
#     "compressed_formatted": "1.71 MB"
#   },
#   "compression": {
#     "ratio": 2.93,
#     "percentage": 65.87,
#     "compression_time_ms": 145.5,
#     "decompression_time_ms": 125.3
#   },
#   "image_info": {
#     "format": "JPEG",
#     "width": 1920,
#     "height": 1080,
#     "channels": 3,
#     "total_pixels": 2073600
#   },
#   "timestamp": "2026-03-15T10:30:45.123456"
# }
```

#### `format_summary(metrics: CompressionMetrics) -> str`
Generate human-readable summary with box formatting.

```python
summary = MetricsFormatter.format_summary(metrics)
print(summary)
# Output:
# ═══════════════════════════════════════════════════════════════
#                   COMPRESSION SUMMARY
# ═══════════════════════════════════════════════════════════════
#
# 📁 FILE SIZES:
#   Original:      5.00 MB (5242880 bytes)
#   Compressed:    1.71 MB (1789272 bytes)
#
# 📊 COMPRESSION STATS:
#   Ratio:         2.93x smaller
#   Saved:         65.87% of original size
#
# ⏱️  TIMING:
#   Compression:   145.50ms
#   Decompression: 125.30ms
#
# 🖼️  IMAGE INFO:
#   Format:        JPEG
#   Dimensions:    1920x1080 pixels
#   Channels:      3
#   Total Pixels:  2073600
#
# ═══════════════════════════════════════════════════════════════
```

#### `format_comparison(original_metrics, decompressed_metrics) -> str`
Format comparison between compression and decompression.

```python
comparison = MetricsFormatter.format_comparison(
    compress_metrics,
    decompress_metrics
)
print(comparison)
# Shows before/after sizes, timing, efficiency, and losslessness
```

---

### 5. Module-Level Function

#### `calculate_metrics_from_files(...) -> CompressionMetrics`

Main function for calculating metrics from file paths and timing.

```python
from utils.metrics import calculate_metrics_from_files

metrics = calculate_metrics_from_files(
    original_path="original.jpg",
    compressed_path="original.huff",
    compression_time_ms=145.5,
    decompression_time_ms=125.3,
    image_format="JPEG",
    image_width=1920,
    image_height=1080,
    image_channels=3,
)
```

**Parameters:**
- `original_path` (str): Path to original file
- `compressed_path` (str): Path to compressed file
- `compression_time_ms` (float): Time taken to compress
- `decompression_time_ms` (Optional[float]): Time taken to decompress
- `image_format` (Optional[str]): Image format (JPEG, PNG, BMP)
- `image_width` (Optional[int]): Image width in pixels
- `image_height` (Optional[int]): Image height in pixels
- `image_channels` (Optional[int]): Number of color channels

**Returns:** `CompressionMetrics` object

---

## Integration with Compression Pipeline

The metrics module is automatically integrated with the compression workflow:

### Compress with Metrics
```python
from services.compression_workflow import compress_image_file

result = compress_image_file("photo.jpg", "output/photo")

# Metrics included in result
if result['status'] == 'success':
    metrics = result['metrics']  # CompressionMetrics object
    api_metrics = result['api_metrics']  # Formatted for API
    
    print(f"Ratio: {metrics.compression_ratio}x")
    print(f"Saved: {metrics.compression_percentage:.1f}%")
```

### Decompress with Metrics
```python
from services.compression_workflow import decompress_image_file

result = decompress_image_file(
    "output/photo.huff",
    "output/photo.meta",
    "output/reconstructed.jpg"
)

if result['status'] == 'success':
    decomp_metrics = result['metrics']
    print(f"Decompression time: {decomp_metrics.decompression_time_ms:.2f}ms")
```

### Get Comprehensive Report
```python
from services.compression_workflow import get_compression_report

compress_result = compress_image_file("photo.jpg", "output/photo")
decompress_result = decompress_image_file(...)

report = get_compression_report(compress_result, decompress_result)

# Access different report sections
print(report['summary'])  # Human-readable
print(report['api_format'])  # For API response
print(report['metrics'])  # Metrics object
print(report['comparison_summary'])  # Compression vs decompression
```

---

## API Response Example

When using metrics with REST API:

```python
# In your FastAPI endpoint
from services.compression_workflow import compress_image_file
from fastapi.responses import JSONResponse

@router.post("/compress/{job_id}")
async def compress(job_id: str):
    result = compress_image_file(f"uploads/{job_id}.jpg", f"output/{job_id}")
    
    if result['status'] == 'success':
        return JSONResponse({
            "status": "success",
            "job_id": job_id,
            "metrics": result['api_metrics'],  # Formatted for frontend
            "files": {
                "compressed": result['compressed_file'],
                "metadata": result['metadata_file'],
            }
        })
```

**Frontend receives:**
```json
{
  "status": "success",
  "job_id": "abc-123",
  "metrics": {
    "file_sizes": {
      "original_bytes": 5242880,
      "original_formatted": "5.00 MB",
      "compressed_bytes": 1789272,
      "compressed_formatted": "1.71 MB"
    },
    "compression": {
      "ratio": 2.93,
      "percentage": 65.87,
      "compression_time_ms": 145.5
    },
    "image_info": {
      "format": "JPEG",
      "width": 1920,
      "height": 1080,
      "channels": 3,
      "total_pixels": 2073600
    }
  }
}
```

---

## Dashboard Integration Example

Using metrics for frontend dashboard:

```python
# Collect metrics periodically
from datetime import datetime
from utils.metrics import CompressionMetrics

class Dashboard:
    def __init__(self):
        self.metrics_history = []
    
    def record_compression(self, result):
        """Record compression metrics"""
        if result['status'] == 'success':
            self.metrics_history.append(result['metrics'])
    
    def get_statistics(self):
        """Get dashboard statistics"""
        if not self.metrics_history:
            return {}
        
        metrics_list = self.metrics_history
        return {
            "total_compressions": len(metrics_list),
            "average_ratio": sum(m.compression_ratio for m in metrics_list) / len(metrics_list),
            "average_percentage": sum(m.compression_percentage for m in metrics_list) / len(metrics_list),
            "total_time_ms": sum(m.compression_time_ms for m in metrics_list),
            "total_original_size": sum(m.original_file_size for m in metrics_list),
            "total_compressed_size": sum(m.compressed_file_size for m in metrics_list),
        }
    
    def export_as_json(self):
        """Export all metrics as JSON"""
        return {
            "timestamp": datetime.now().isoformat(),
            "metrics": [m.to_dict() for m in self.metrics_history],
            "statistics": self.get_statistics(),
        }
```

---

## Performance Considerations

### Timing Overhead
The metrics calculation has negligible overhead:
- File size checking: <1ms per file
- Metrics calculation: <0.5ms
- JSON formatting: ~1-2ms
- **Total per compression:** <5ms added to operation

### Memory Overhead
- CompressionMetrics object: ~1KB
- Metrics history (1000 compressions): ~1MB
- No impact on compression algorithm efficiency

---

## Common Patterns

### Pattern 1: Timing with Metrics
```python
from utils.metrics import CompressionTimer, MetricsCalculator

with CompressionTimer() as timer:
    # Do work
    pass

metrics = MetricsCalculator.create_metrics(
    original_file_size=size1,
    compressed_file_size=size2,
    compression_time_ms=timer.get_elapsed_ms(),
)
```

### Pattern 2: Batch Processing
```python
from utils.metrics import MetricsCalculator

results = []
for file_path in file_list:
    result = compress_image_file(file_path, output_dir)
    if result['status'] == 'success':
        results.append(result['metrics'])

# Analyze batch
avg_ratio = sum(m.compression_ratio for m in results) / len(results)
total_saved = sum(m.original_file_size - m.compressed_file_size for m in results)
```

### Pattern 3: API Response
```python
from utils.metrics import MetricsFormatter

metrics = compress_result['metrics']
api_response = {
    "status": "success",
    "metrics": MetricsFormatter.format_api_response(metrics),
}
```

---

## Testing the Metrics Module

```bash
# Run metrics demonstrations
python -m utils.metrics_demo

# Or run specific demo
python -c "from utils.metrics_demo import demo_1_simple_metrics_calculation; demo_1_simple_metrics_calculation()"
```

---

## FAQ

**Q: How accurate is the timing?**  
A: Millisecond precision using `time.time()`. Accurate to within 1-2ms.

**Q: What if I don't have image metadata?**  
A: All image-related fields are optional. Provide only the data you have.

**Q: Can I use metrics without the compression workflow?**  
A: Yes! Use the module independently for any compression operation.

**Q: How do I export metrics for analytics?**  
A: Use `.to_json()` or `.to_dict()` to get JSON-serializable format.

**Q: What's the compression ratio formula?**  
A: `ratio = original_size / compressed_size`. Example: 10MB → 2MB = 5.0x

**Q: What's the compression percentage formula?**  
A: `percentage = ((original - compressed) / original) * 100`. Example: 80% saved

---

## See Also

- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) - Code examples
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design
- [compression_workflow.py](../services/compression_workflow.py) - Integration
- [metrics_demo.py](../metrics_demo.py) - Live examples
