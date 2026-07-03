# Metrics Module - Practical Implementation Guide

Quick guide for developers implementing metrics in their code.

---

## Scenario 1: Display Metrics in FastAPI Endpoint

```python
from fastapi import File, UploadFile
from fastapi.responses import JSONResponse
from services.compression_workflow import compress_image_file
from pathlib import Path

@router.post("/compress/{job_id}")
async def compress_endpoint(job_id: str, file: UploadFile = File(...)):
    """Compress image and return metrics"""
    
    # Save uploaded file
    filepath = f"uploads/{job_id}_{file.filename}"
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'wb') as f:
        f.write(await file.read())
    
    # Compress with full metrics
    result = compress_image_file(filepath, f"output/{job_id}")
    
    if result['status'] == 'success':
        return JSONResponse({
            "status": "success",
            "job_id": job_id,
            "compression_ratio": result['compression_ratio'],
            "compression_percentage": result['compression_percentage'],
            "compression_time_ms": result['compression_time_ms'],
            "metrics": result['api_metrics'],  # Full formatted metrics
            "files": {
                "compressed": result['compressed_file'],
                "metadata": result['metadata_file'],
            }
        })
    else:
        return JSONResponse(
            {"status": "error", "message": result['message']},
            status_code=400
        )
```

**Frontend receives:**
```javascript
{
  status: "success",
  job_id: "abc-123",
  compression_ratio: 2.93,
  compression_percentage: 65.87,
  compression_time_ms: 145.5,
  metrics: {
    file_sizes: { ... },
    compression: { ... },
    image_info: { ... },
  }
}
```

---

## Scenario 2: Create Dashboard Component

```python
# Backend: Expose metrics history endpoint

from datetime import datetime, timedelta
from utils.metrics import MetricsFormatter

# Store all compression metrics in memory (or database)
compression_history = []

def add_compression_metrics(result):
    """Add metrics to history after compression"""
    if result['status'] == 'success':
        metrics = result['metrics']
        compression_history.append({
            'timestamp': metrics.timestamp,
            'ratio': metrics.compression_ratio,
            'percentage': metrics.compression_percentage,
            'time_ms': metrics.compression_time_ms,
            'file_size_mb': metrics.original_file_size / 1_048_576,
        })
        # Keep last 100 compressions
        compression_history = compression_history[-100:]

@router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get statistics for dashboard display"""
    if not compression_history:
        return {"error": "No compressions yet"}
    
    return {
        "total_compressions": len(compression_history),
        "average_ratio": sum(m['ratio'] for m in compression_history) / len(compression_history),
        "average_percentage": sum(m['percentage'] for m in compression_history) / len(compression_history),
        "average_time_ms": sum(m['time_ms'] for m in compression_history) / len(compression_history),
        "total_processed_mb": sum(m['file_size_mb'] for m in compression_history),
        "last_24h_count": sum(1 for m in compression_history 
                             if datetime.fromisoformat(m['timestamp']) > datetime.now() - timedelta(hours=24)),
    }
```

**Frontend:**
```javascript
async function loadDashboard() {
  const response = await fetch('/dashboard/stats');
  const data = await response.json();
  
  // Update dashboard
  document.getElementById('total').textContent = data.total_compressions;
  document.getElementById('avg-ratio').textContent = data.average_ratio.toFixed(2) + 'x';
  document.getElementById('avg-saved').textContent = data.average_percentage.toFixed(1) + '%';
  document.getElementById('avg-time').textContent = data.average_time_ms.toFixed(0) + 'ms';
}
```

---

## Scenario 3: Export Metrics to CSV for Analysis

```python
import csv
from datetime import datetime
from services.compression_workflow import compress_image_file

def export_metrics_to_csv(job_ids, output_file):
    """Export compression metrics for a list of jobs to CSV"""
    
    with open(output_file, 'w', newline='') as csvfile:
        fieldnames = [
            'job_id',
            'timestamp',
            'original_size_bytes',
            'original_size_mb',
            'compressed_size_bytes',
            'compressed_size_mb',
            'compression_ratio',
            'compression_percentage',
            'compression_time_ms',
            'image_format',
            'image_width',
            'image_height',
            'total_pixels',
        ]
        
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for job_id in job_ids:
            # Get metrics from database or file
            metrics = load_metrics(job_id)
            
            writer.writerow({
                'job_id': job_id,
                'timestamp': metrics.timestamp,
                'original_size_bytes': metrics.original_file_size,
                'original_size_mb': metrics.original_file_size / 1_048_576,
                'compressed_size_bytes': metrics.compressed_file_size,
                'compressed_size_mb': metrics.compressed_file_size / 1_048_576,
                'compression_ratio': metrics.compression_ratio,
                'compression_percentage': metrics.compression_percentage,
                'compression_time_ms': metrics.compression_time_ms,
                'image_format': metrics.image_format,
                'image_width': metrics.image_width,
                'image_height': metrics.image_height,
                'total_pixels': metrics.total_pixels,
            })
```

---

## Scenario 4: Logging with Metrics Summary

```python
import logging
from utils.metrics import MetricsFormatter

logger = logging.getLogger(__name__)

def compress_with_logging(image_path, output_path):
    """Compress image and log detailed metrics"""
    
    logger.info(f"Starting compression: {image_path}")
    
    result = compress_image_file(image_path, output_path)
    
    if result['status'] == 'success':
        # Log human-readable summary
        metrics = result['metrics']
        summary = MetricsFormatter.format_summary(metrics)
        logger.info(f"Compression successful:\n{summary}")
        
        # Log to structured logging
        logger.info(
            "compression_complete",
            extra={
                "job_id": output_path,
                "compression_ratio": metrics.compression_ratio,
                "compression_percentage": metrics.compression_percentage,
                "time_ms": metrics.compression_time_ms,
                "original_bytes": metrics.original_file_size,
                "compressed_bytes": metrics.compressed_file_size,
            }
        )
    else:
        logger.error(f"Compression failed: {result['message']}")
    
    return result
```

---

## Scenario 5: Performance Monitoring

```python
from utils.metrics import MetricsCalculator
from datetime import datetime, timedelta
import json

class PerformanceMonitor:
    """Track compression performance metrics over time"""
    
    def __init__(self):
        self.metrics_history = []
    
    def record_compression(self, result):
        """Record compression metrics"""
        if result['status'] == 'success':
            metrics = result['metrics']
            self.metrics_history.append({
                'timestamp': datetime.fromisoformat(metrics.timestamp),
                'ratio': metrics.compression_ratio,
                'percentage': metrics.compression_percentage,
                'time_ms': metrics.compression_time_ms,
            })
    
    def get_performance_report(self, hours=24):
        """Get performance report for last N hours"""
        
        cutoff = datetime.now() - timedelta(hours=hours)
        recent = [m for m in self.metrics_history if m['timestamp'] > cutoff]
        
        if not recent:
            return None
        
        return {
            "period_hours": hours,
            "compressions_count": len(recent),
            "average_ratio": sum(m['ratio'] for m in recent) / len(recent),
            "average_percentage": sum(m['percentage'] for m in recent) / len(recent),
            "average_time_ms": sum(m['time_ms'] for m in recent) / len(recent),
            "min_time_ms": min(m['time_ms'] for m in recent),
            "max_time_ms": max(m['time_ms'] for m in recent),
            "best_ratio": max(m['ratio'] for m in recent),
            "worst_ratio": min(m['ratio'] for m in recent),
        }
    
    def save_report(self, filename):
        """Save performance report to JSON file"""
        report = self.get_performance_report()
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)

# Usage
monitor = PerformanceMonitor()

# After each compression
result = compress_image_file("photo.jpg", "output/photo")
monitor.record_compression(result)

# Get report
report = monitor.get_performance_report(hours=24)
print(f"Last 24h: {report['compressions_count']} compressions, "
      f"avg {report['average_ratio']:.2f}x ratio")
```

---

## Scenario 6: Frontend Metrics Display Component

```javascript
// React component for displaying compression metrics

import React, { useState, useEffect } from 'react';

function MetricsDisplay({ jobId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, [jobId]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/compression/metrics/${jobId}`);
      const data = await response.json();
      setMetrics(data.metrics);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading metrics...</div>;
  if (!metrics) return <div>No metrics available</div>;

  return (
    <div className="metrics-container">
      <div className="metric-card">
        <span className="label">Compression Ratio</span>
        <span className="value">{metrics.compression.ratio.toFixed(2)}x</span>
        <span className="description">times smaller</span>
      </div>

      <div className="metric-card">
        <span className="label">Space Saved</span>
        <span className="value">{metrics.compression.percentage.toFixed(1)}%</span>
        <span className="description">of original</span>
      </div>

      <div className="metric-card">
        <span className="label">Original Size</span>
        <span className="value">{metrics.file_sizes.original_formatted}</span>
        <span className="description">{formatBytes(metrics.file_sizes.original_bytes)}</span>
      </div>

      <div className="metric-card">
        <span className="label">Compressed Size</span>
        <span className="value">{metrics.file_sizes.compressed_formatted}</span>
        <span className="description">{formatBytes(metrics.file_sizes.compressed_bytes)}</span>
      </div>

      <div className="metric-card">
        <span className="label">Compression Time</span>
        <span className="value">{metrics.compression.compression_time_ms.toFixed(0)}ms</span>
      </div>

      {metrics.image_info && (
        <div className="metric-card">
          <span className="label">Image Info</span>
          <span className="value">
            {metrics.image_info.width}x{metrics.image_info.height}
          </span>
          <span className="description">
            {metrics.image_info.channels} channels ({metrics.image_info.format})
          </span>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

export default MetricsDisplay;
```

---

## Scenario 7: Database Storage of Metrics

```python
# SQLAlchemy model for storing metrics

from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import json

Base = declarative_base()

class CompressionJobMetrics(Base):
    __tablename__ = "compression_job_metrics"
    
    job_id = Column(String, primary_key=True)
    timestamp = Column(DateTime, default=datetime.now)
    original_file_size = Column(Integer)
    compressed_file_size = Column(Integer)
    compression_ratio = Column(Float)
    compression_percentage = Column(Float)
    compression_time_ms = Column(Float)
    decompression_time_ms = Column(Float, nullable=True)
    image_format = Column(String)
    image_width = Column(Integer)
    image_height = Column(Integer)
    image_channels = Column(Integer)
    total_pixels = Column(Integer)
    metadata_json = Column(String)  # Store full metrics as JSON
    
    def from_metrics(job_id, metrics):
        """Create database record from metrics object"""
        return CompressionJobMetrics(
            job_id=job_id,
            original_file_size=metrics.original_file_size,
            compressed_file_size=metrics.compressed_file_size,
            compression_ratio=metrics.compression_ratio,
            compression_percentage=metrics.compression_percentage,
            compression_time_ms=metrics.compression_time_ms,
            decompression_time_ms=metrics.decompression_time_ms,
            image_format=metrics.image_format,
            image_width=metrics.image_width,
            image_height=metrics.image_height,
            image_channels=metrics.image_channels,
            total_pixels=metrics.total_pixels,
            metadata_json=metrics.to_json(),
        )
    
    def to_metrics(self):
        """Convert database record back to metrics object"""
        return json.loads(self.metadata_json)

# Usage
from sqlalchemy.orm import Session

def save_compression_metrics(db: Session, job_id: str, result: dict):
    """Save compression metrics to database"""
    if result['status'] == 'success':
        metrics = result['metrics']
        db_metrics = CompressionJobMetrics.from_metrics(job_id, metrics)
        db.add(db_metrics)
        db.commit()

def get_compression_metrics(db: Session, job_id: str):
    """Retrieve metrics from database"""
    record = db.query(CompressionJobMetrics).filter(
        CompressionJobMetrics.job_id == job_id
    ).first()
    
    if record:
        return record.to_metrics()
    return None
```

---

## Scenario 8: Batch Processing with Metrics Aggregation

```python
from pathlib import Path
from services.compression_workflow import compress_image_file
from utils.metrics import MetricsCalculator

def process_image_batch(image_directory, output_directory):
    """Process multiple images and aggregate metrics"""
    
    image_dir = Path(image_directory)
    output_dir = Path(output_directory)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    results = []
    total_original = 0
    total_compressed = 0
    total_time = 0
    
    for image_file in image_dir.glob("*.jpg"):
        result = compress_image_file(
            str(image_file),
            str(output_dir / image_file.stem)
        )
        
        if result['status'] == 'success':
            metrics = result['metrics']
            results.append(metrics)
            
            total_original += metrics.original_file_size
            total_compressed += metrics.compressed_file_size
            total_time += metrics.compression_time_ms
    
    # Calculate aggregate statistics
    if results:
        avg_ratio = MetricsCalculator.calculate_compression_ratio(
            total_original, total_compressed
        )
        avg_percentage = MetricsCalculator.calculate_compression_percentage(
            total_original, total_compressed
        )
        
        summary = {
            "total_files": len(results),
            "total_original_size": total_original,
            "total_compressed_size": total_compressed,
            "total_original_formatted": MetricsCalculator.format_file_size(total_original),
            "total_compressed_formatted": MetricsCalculator.format_file_size(total_compressed),
            "aggregate_ratio": avg_ratio,
            "aggregate_percentage": avg_percentage,
            "total_time_ms": total_time,
            "average_time_per_file": total_time / len(results),
            "individual_metrics": [m.to_dict() for m in results],
        }
        
        return summary
    
    return None

# Usage
summary = process_image_batch("./images", "./output")
print(f"Processed {summary['total_files']} files")
print(f"Total ratio: {summary['aggregate_ratio']:.2f}x")
print(f"Space saved: {summary['aggregate_percentage']:.1f}%")
print(f"Total: {summary['total_original_formatted']} → {summary['total_compressed_formatted']}")
```

---

## Quick Reference: Common Patterns

### Pattern 1: Get Metrics Easily
```python
result = compress_image_file("photo.jpg", "output/photo")
if result['status'] == 'success':
    m = result['metrics']
    print(f"{m.compression_ratio:.2f}x")
```

### Pattern 2: Format for Frontend
```python
api_metrics = result['api_metrics']
# Send directly to frontend
return {"metrics": api_metrics}
```

### Pattern 3: Human Readable Output  
```python
from utils.metrics import MetricsFormatter
print(MetricsFormatter.format_summary(metrics))
```

### Pattern 4: Database Storage
```python
# Save to DB
save_metrics_to_db(result['metrics'])
# Later retrieve and display
metrics = load_metrics_from_db(job_id)
```

### Pattern 5: Batch Statistics
```python
ratios = [m.compression_ratio for m in all_metrics]
avg_ratio = sum(ratios) / len(ratios)
```

---

End of Practical Implementation Guide
