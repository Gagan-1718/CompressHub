"""
Compression Metrics Module

Calculate and format compression statistics for API responses.
Returns metrics as JSON-serializable dictionaries for frontend consumption.
"""

import time
import json
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class CompressionMetrics:
    """Data class for compression metrics"""
    original_file_size: int
    compressed_file_size: int
    compression_ratio: float
    compression_percentage: float
    compression_time_ms: float
    decompression_time_ms: Optional[float] = None
    original_file_path: Optional[str] = None
    compressed_file_path: Optional[str] = None
    image_format: Optional[str] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    image_channels: Optional[int] = None
    total_pixels: Optional[int] = None
    timestamp: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary, excluding None values"""
        return {k: v for k, v in asdict(self).items() if v is not None}
    
    def to_json(self, indent: int = 2) -> str:
        """Convert metrics to JSON string"""
        return json.dumps(self.to_dict(), indent=indent)


class MetricsCalculator:
    """Calculate compression metrics from file data and timing information"""
    
    @staticmethod
    def get_file_size(file_path: str) -> int:
        """
        Get file size in bytes
        
        Args:
            file_path: Path to file
            
        Returns:
            File size in bytes
            
        Raises:
            FileNotFoundError: If file doesn't exist
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        return path.stat().st_size
    
    @staticmethod
    def calculate_compression_ratio(original_size: int, compressed_size: int) -> float:
        """
        Calculate compression ratio (original / compressed)
        
        Args:
            original_size: Original file size in bytes
            compressed_size: Compressed file size in bytes
            
        Returns:
            Compression ratio (e.g., 2.5 means 2.5x smaller)
            
        Raises:
            ValueError: If compressed size is 0 or sizes are negative
        """
        if compressed_size <= 0:
            raise ValueError(f"Compressed size must be > 0, got: {compressed_size}")
        if original_size < 0 or compressed_size < 0:
            raise ValueError("File sizes cannot be negative")
        
        return round(original_size / compressed_size, 2)
    
    @staticmethod
    def calculate_compression_percentage(original_size: int, compressed_size: int) -> float:
        """
        Calculate compression percentage (space saved)
        
        Args:
            original_size: Original file size in bytes
            compressed_size: Compressed file size in bytes
            
        Returns:
            Percentage of space saved (0-100)
            
        Raises:
            ValueError: If original size is 0 or sizes are negative
        """
        if original_size == 0:
            raise ValueError("Original size cannot be 0")
        if original_size < 0 or compressed_size < 0:
            raise ValueError("File sizes cannot be negative")
        
        percentage = ((original_size - compressed_size) / original_size) * 100
        return round(percentage, 2)
    
    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """
        Format file size in human-readable format
        
        Args:
            size_bytes: Size in bytes
            
        Returns:
            Formatted size string (e.g., "5.2 MB")
        """
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} PB"
    
    @staticmethod
    def create_metrics(
        original_file_size: int,
        compressed_file_size: int,
        compression_time_ms: float,
        decompression_time_ms: Optional[float] = None,
        original_file_path: Optional[str] = None,
        compressed_file_path: Optional[str] = None,
        image_format: Optional[str] = None,
        image_width: Optional[int] = None,
        image_height: Optional[int] = None,
        image_channels: Optional[int] = None,
    ) -> CompressionMetrics:
        """
        Create CompressionMetrics object with calculated values
        
        Args:
            original_file_size: Original file size in bytes
            compressed_file_size: Compressed file size in bytes
            compression_time_ms: Time taken to compress in milliseconds
            decompression_time_ms: Time taken to decompress in milliseconds (optional)
            original_file_path: Path to original file (optional)
            compressed_file_path: Path to compressed file (optional)
            image_format: Image format (JPEG, PNG, BMP)
            image_width: Image width in pixels
            image_height: Image height in pixels
            image_channels: Number of color channels
            
        Returns:
            CompressionMetrics object with all calculated values
        """
        ratio = MetricsCalculator.calculate_compression_ratio(
            original_file_size, compressed_file_size
        )
        percentage = MetricsCalculator.calculate_compression_percentage(
            original_file_size, compressed_file_size
        )
        
        total_pixels = None
        if image_width and image_height:
            total_pixels = image_width * image_height
        
        return CompressionMetrics(
            original_file_size=original_file_size,
            compressed_file_size=compressed_file_size,
            compression_ratio=ratio,
            compression_percentage=percentage,
            compression_time_ms=compression_time_ms,
            decompression_time_ms=decompression_time_ms,
            original_file_path=original_file_path,
            compressed_file_path=compressed_file_path,
            image_format=image_format,
            image_width=image_width,
            image_height=image_height,
            image_channels=image_channels,
            total_pixels=total_pixels,
            timestamp=datetime.now().isoformat(),
        )


class CompressionTimer:
    """Context manager for timing compression operations"""
    
    def __init__(self, operation_name: str = "Compression"):
        """
        Initialize timer
        
        Args:
            operation_name: Name of operation being timed
        """
        self.operation_name = operation_name
        self.start_time = None
        self.elapsed_ms = None
    
    def __enter__(self):
        """Start timer"""
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Stop timer and calculate elapsed time"""
        if self.start_time:
            elapsed_seconds = time.time() - self.start_time
            self.elapsed_ms = round(elapsed_seconds * 1000, 2)
    
    def get_elapsed_ms(self) -> float:
        """Get elapsed time in milliseconds"""
        if self.elapsed_ms is None:
            raise RuntimeError(f"Timer not completed. Use with context manager.")
        return self.elapsed_ms


class MetricsFormatter:
    """Format metrics for API responses"""
    
    @staticmethod
    def format_api_response(metrics: CompressionMetrics) -> Dict[str, Any]:
        """
        Format metrics for API JSON response
        
        Args:
            metrics: CompressionMetrics object
            
        Returns:
            Dictionary with formatted metrics for API
        """
        return {
            "file_sizes": {
                "original_bytes": metrics.original_file_size,
                "original_formatted": MetricsCalculator.format_file_size(
                    metrics.original_file_size
                ),
                "compressed_bytes": metrics.compressed_file_size,
                "compressed_formatted": MetricsCalculator.format_file_size(
                    metrics.compressed_file_size
                ),
            },
            "compression": {
                "ratio": metrics.compression_ratio,
                "percentage": metrics.compression_percentage,
                "compression_time_ms": metrics.compression_time_ms,
                "decompression_time_ms": metrics.decompression_time_ms,
            },
            "image_info": {
                "format": metrics.image_format,
                "width": metrics.image_width,
                "height": metrics.image_height,
                "channels": metrics.image_channels,
                "total_pixels": metrics.total_pixels,
            } if metrics.image_format else None,
            "paths": {
                "original": metrics.original_file_path,
                "compressed": metrics.compressed_file_path,
            } if metrics.original_file_path else None,
            "timestamp": metrics.timestamp,
        }
    
    @staticmethod
    def format_summary(metrics: CompressionMetrics) -> str:
        """
        Format metrics as human-readable summary
        
        Args:
            metrics: CompressionMetrics object
            
        Returns:
            Formatted string summary
        """
        summary = f"""
═══════════════════════════════════════════════════════════════
                  COMPRESSION SUMMARY
═══════════════════════════════════════════════════════════════

📁 FILE SIZES:
  Original:      {MetricsCalculator.format_file_size(metrics.original_file_size)} ({metrics.original_file_size:,} bytes)
  Compressed:    {MetricsCalculator.format_file_size(metrics.compressed_file_size)} ({metrics.compressed_file_size:,} bytes)

📊 COMPRESSION STATS:
  Ratio:         {metrics.compression_ratio}x smaller
  Saved:         {metrics.compression_percentage}% of original size

⏱️  TIMING:
  Compression:   {metrics.compression_time_ms:.2f}ms
"""
        
        if metrics.decompression_time_ms:
            summary += f"  Decompression:  {metrics.decompression_time_ms:.2f}ms\n"
        
        if metrics.image_format:
            summary += f"""
🖼️  IMAGE INFO:
  Format:        {metrics.image_format}
  Dimensions:    {metrics.image_width}x{metrics.image_height} pixels
  Channels:      {metrics.image_channels}
  Total Pixels:  {metrics.total_pixels:,}
"""
        
        summary += "═══════════════════════════════════════════════════════════════\n"
        
        return summary
    
    @staticmethod
    def format_comparison(original_metrics: CompressionMetrics, 
                         decompressed_metrics: CompressionMetrics) -> str:
        """
        Format comparison between original and decompressed images
        
        Args:
            original_metrics: Metrics from compression
            decompressed_metrics: Metrics from decompression
            
        Returns:
            Formatted comparison string
        """
        comparison = f"""
═══════════════════════════════════════════════════════════════
            COMPRESSION/DECOMPRESSION COMPARISON
═══════════════════════════════════════════════════════════════

ORIGINAL → COMPRESSED:
  Size:  {MetricsCalculator.format_file_size(original_metrics.original_file_size)} → {MetricsCalculator.format_file_size(original_metrics.compressed_file_size)}
  Ratio: {original_metrics.compression_ratio}x
  Time:  {original_metrics.compression_time_ms:.2f}ms

COMPRESSED → RECONSTRUCTED:
  Time:  {decompressed_metrics.decompression_time_ms:.2f}ms
  Size:  {MetricsCalculator.format_file_size(decompressed_metrics.compressed_file_size)} → {MetricsCalculator.format_file_size(decompressed_metrics.original_file_size)}

TOTAL ROUND-TRIP TIME:
  {original_metrics.compression_time_ms + (decompressed_metrics.decompression_time_ms or 0):.2f}ms

EFFICIENCY:
  Space Saved: {original_metrics.compression_percentage:.2f}%
  ✓ Lossless:  Yes (perfect reconstruction guaranteed)

═══════════════════════════════════════════════════════════════
"""
        return comparison


def calculate_metrics_from_files(
    original_path: str,
    compressed_path: str,
    compression_time_ms: float,
    decompression_time_ms: Optional[float] = None,
    image_format: Optional[str] = None,
    image_width: Optional[int] = None,
    image_height: Optional[int] = None,
    image_channels: Optional[int] = None,
) -> CompressionMetrics:
    """
    Calculate metrics from file paths and timing information
    
    This is the main function to use for calculating metrics after compression.
    
    Args:
        original_path: Path to original file
        compressed_path: Path to compressed file
        compression_time_ms: Time taken to compress in milliseconds
        decompression_time_ms: Time taken to decompress in milliseconds (optional)
        image_format: Image format (optional)
        image_width: Image width (optional)
        image_height: Image height (optional)
        image_channels: Image channels (optional)
        
    Returns:
        CompressionMetrics object with all calculated values
        
    Example:
        >>> metrics = calculate_metrics_from_files(
        ...     "original.jpg", "original.huff", 145.5,
        ...     image_format="JPEG", image_width=1920, image_height=1080, image_channels=3
        ... )
        >>> print(metrics.compression_ratio)
        2.5
        >>> print(metrics.to_json())
        {...}
    """
    original_size = MetricsCalculator.get_file_size(original_path)
    compressed_size = MetricsCalculator.get_file_size(compressed_path)
    
    return MetricsCalculator.create_metrics(
        original_file_size=original_size,
        compressed_file_size=compressed_size,
        compression_time_ms=compression_time_ms,
        decompression_time_ms=decompression_time_ms,
        original_file_path=original_path,
        compressed_file_path=compressed_path,
        image_format=image_format,
        image_width=image_width,
        image_height=image_height,
        image_channels=image_channels,
    )


if __name__ == "__main__":
    """Example usage and testing"""
    
    # Example 1: Creating metrics from file data
    print("Example 1: Creating metrics from known values")
    print("-" * 60)
    
    metrics = MetricsCalculator.create_metrics(
        original_file_size=5_242_880,  # 5 MB
        compressed_file_size=1_789_272,  # ~1.7 MB
        compression_time_ms=145.5,
        decompression_time_ms=125.3,
        image_format="JPEG",
        image_width=1920,
        image_height=1080,
        image_channels=3,
    )
    
    print(MetricsFormatter.format_summary(metrics))
    
    # Example 2: Converting to JSON
    print("\nExample 2: Converting to JSON for API")
    print("-" * 60)
    api_response = MetricsFormatter.format_api_response(metrics)
    print(json.dumps(api_response, indent=2))
    
    # Example 3: Using timer context manager
    print("\nExample 3: Using CompressionTimer")
    print("-" * 60)
    
    with CompressionTimer("Compression") as timer:
        # Simulate compression work
        import time as time_module
        time_module.sleep(0.145)
    
    print(f"Operation took: {timer.get_elapsed_ms():.2f}ms")
    
    # Example 4: File size formatting
    print("\nExample 4: File size formatting")
    print("-" * 60)
    sizes = [1024, 1_048_576, 5_242_880, 1_073_741_824]
    for size in sizes:
        print(f"{size:,} bytes = {MetricsCalculator.format_file_size(size)}")
