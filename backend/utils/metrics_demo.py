"""
Compression Metrics Demo

Demonstrates the integration of the metrics module with the compression workflow.
Shows how to calculate, format, and use compression metrics.
"""

import json
import time
from pathlib import Path
import numpy as np
from PIL import Image

from services.compression_workflow import (
    compress_image_file,
    decompress_image_file,
    get_compression_report,
)
from utils.metrics import (
    MetricsCalculator,
    MetricsFormatter,
    CompressionTimer,
    calculate_metrics_from_files,
)
from services.image_processing import ImageProcessor


def demo_1_simple_metrics_calculation():
    """Demo 1: Calculate metrics from known values"""
    print("\n" + "="*70)
    print("DEMO 1: Simple Metrics Calculation")
    print("="*70)
    
    # Create metrics from file sizes
    metrics = MetricsCalculator.create_metrics(
        original_file_size=5_242_880,    # 5 MB
        compressed_file_size=1_789_272,  # ~1.7 MB
        compression_time_ms=145.5,
        decompression_time_ms=125.3,
        image_format="JPEG",
        image_width=1920,
        image_height=1080,
        image_channels=3,
    )
    
    print("\n📊 Metrics Object Created:")
    print(f"  - Compression ratio: {metrics.compression_ratio}x")
    print(f"  - Space saved: {metrics.compression_percentage:.1f}%")
    print(f"  - Compression time: {metrics.compression_time_ms:.2f}ms")
    print(f"  - Decompression time: {metrics.decompression_time_ms:.2f}ms")
    
    # Convert to JSON
    print("\n📄 As JSON:")
    print(json.dumps(metrics.to_dict(), indent=2)[:300] + "...\n")


def demo_2_file_size_formatting():
    """Demo 2: Format file sizes in human-readable format"""
    print("\n" + "="*70)
    print("DEMO 2: File Size Formatting")
    print("="*70)
    
    sizes = [
        1024,                      # 1 KB
        1_048_576,                  # 1 MB
        5_242_880,                  # 5 MB
        1_073_741_824,              # 1 GB
    ]
    
    print("\nFormatting various file sizes:")
    for size in sizes:
        formatted = MetricsCalculator.format_file_size(size)
        print(f"  {size:>15,} bytes = {formatted}")


def demo_3_timer_context_manager():
    """Demo 3: Use CompressionTimer to measure operations"""
    print("\n" + "="*70)
    print("DEMO 3: CompressionTimer Context Manager")
    print("="*70)
    
    print("\nTiming a simulated operation...")
    
    with CompressionTimer("Simulated Compression") as timer:
        # Simulate work
        total = 0
        for i in range(10_000_000):
            total += i
        time.sleep(0.05)
    
    elapsed = timer.get_elapsed_ms()
    print(f"  Operation completed in {elapsed:.2f}ms")


def demo_4_api_response_formatting():
    """Demo 4: Format metrics for API response"""
    print("\n" + "="*70)
    print("DEMO 4: API Response Formatting")
    print("="*70)
    
    metrics = MetricsCalculator.create_metrics(
        original_file_size=10_485_760,   # 10 MB
        compressed_file_size=3_500_000,   # 3.5 MB
        compression_time_ms=250.5,
        decompression_time_ms=200.3,
        image_format="PNG",
        image_width=2560,
        image_height=1440,
        image_channels=4,
    )
    
    # Format for API
    api_response = MetricsFormatter.format_api_response(metrics)
    
    print("\n📤 API Response Format:")
    print(json.dumps(api_response, indent=2))


def demo_5_human_readable_summary():
    """Demo 5: Generate human-readable summary"""
    print("\n" + "="*70)
    print("DEMO 5: Human-Readable Summary")
    print("="*70)
    
    metrics = MetricsCalculator.create_metrics(
        original_file_size=8_388_608,   # 8 MB
        compressed_file_size=2_097_152,  # 2 MB
        compression_time_ms=320.0,
        decompression_time_ms=280.0,
        image_format="BMP",
        image_width=3840,
        image_height=2160,
        image_channels=3,
    )
    
    summary = MetricsFormatter.format_summary(metrics)
    print(summary)


def demo_6_create_test_image_and_compress():
    """Demo 6: Create test image and compress with metrics"""
    print("\n" + "="*70)
    print("DEMO 6: Create Test Image & Compress with Metrics")
    print("="*70)
    
    # Create test directory
    test_dir = Path("demo_output")
    test_dir.mkdir(exist_ok=True)
    
    # Create test image
    test_path = test_dir / "test_image.jpg"
    if not test_path.exists():
        print("\n🖼️  Creating test image...")
        # Create colorful gradient image
        img_array = np.zeros((512, 512, 3), dtype=np.uint8)
        for i in range(512):
            for j in range(512):
                img_array[i, j] = [i % 256, j % 256, (i+j) % 256]
        
        img = Image.fromarray(img_array, 'RGB')
        img.save(test_path, quality=95)
        print(f"  ✓ Created: {test_path}")
    
    # Compress
    print(f"\n🔐 Compressing {test_path}...")
    compress_result = compress_image_file(
        str(test_path),
        str(test_dir / "test_image"),
        enable_preprocessing=True
    )
    
    if compress_result['status'] == 'success':
        metrics = compress_result['metrics']
        print(MetricsFormatter.format_summary(metrics))
        
        # Show API format
        print("\n📤 API Response (JSON):")
        api_metrics = compress_result['api_metrics']
        print(json.dumps(api_metrics, indent=2)[:500] + "...\n")
        
        # Decompress
        print(f"🔓 Decompressing...")
        decompress_result = decompress_image_file(
            compress_result['compressed_file'],
            compress_result['metadata_file'],
            str(test_dir / "test_image_reconstructed.jpg"),
            quality=95
        )
        
        if decompress_result['status'] == 'success':
            # Get full report
            print("\n📊 Compression Report:")
            report = get_compression_report(compress_result, decompress_result)
            
            print(f"\n✓ Verification:")
            print(f"  - Original reconstructed: {report['verification']['matches_original']}")
            print(f"  - Lossless compression: {report['verification']['lossless']}")
            print(f"  - Decompressed size: {report['verification']['decompressed_size']:,} bytes")
            
            # Show timing
            print(f"\n⏱️  Timing:")
            print(f"  - Compression: {report['timing']['compression_time_ms']:.2f}ms")
            print(f"  - Decompression: {report['decompression']['time_ms']:.2f}ms")
            print(f"  - Total round-trip: {report['timing']['compression_time_ms'] + report['decompression']['time_ms']:.2f}ms")
    else:
        print(f"❌ Compression failed: {compress_result['message']}")


def demo_7_comparison_formatting():
    """Demo 7: Format comparison between compression and decompression"""
    print("\n" + "="*70)
    print("DEMO 7: Compression/Decompression Comparison")
    print("="*70)
    
    # Create two metrics for comparison
    original_metrics = MetricsCalculator.create_metrics(
        original_file_size=15_728_640,   # 15 MB
        compressed_file_size=5_242_880,   # 5 MB
        compression_time_ms=450.0,
        image_format="JPEG",
        image_width=3840,
        image_height=2160,
        image_channels=3,
    )
    
    decompressed_metrics = MetricsCalculator.create_metrics(
        original_file_size=5_242_880,
        compressed_file_size=15_728_640,
        compression_time_ms=0,
        decompression_time_ms=380.0,
        image_format="JPEG",
        image_width=3840,
        image_height=2160,
        image_channels=3,
    )
    
    comparison = MetricsFormatter.format_comparison(
        original_metrics,
        decompressed_metrics
    )
    print(comparison)


def demo_8_batch_compression_metrics():
    """Demo 8: Collect metrics from batch compression"""
    print("\n" + "="*70)
    print("DEMO 8: Batch Compression Metrics Collection")
    print("="*70)
    
    # Simulate multiple compressions
    batch_results = []
    
    test_configs = [
        {"original": 1_048_576, "compressed": 524_288, "name": "Highly compressible"},
        {"original": 5_242_880, "compressed": 4_194_304, "name": "Moderately compressible"},
        {"original": 10_485_760, "compressed": 10_000_000, "name": "Low compression"},
    ]
    
    print("\nProcessing batch of 3 compressions:\n")
    
    for config in test_configs:
        metrics = MetricsCalculator.create_metrics(
            original_file_size=config['original'],
            compressed_file_size=config['compressed'],
            compression_time_ms=config['original'] / 50_000,  # Simulate time
            image_format="JPEG",
            image_width=1920,
            image_height=1080,
            image_channels=3,
        )
        batch_results.append({
            'name': config['name'],
            'metrics': metrics,
        })
    
    # Print summary
    for result in batch_results:
        metrics = result['metrics']
        print(f"  {result['name']}:")
        print(f"    - Ratio: {metrics.compression_ratio:.2f}x")
        print(f"    - Saved: {metrics.compression_percentage:.1f}%")
        print(f"    - Time: {metrics.compression_time_ms:.1f}ms")
    
    # Calculate averages
    avg_ratio = sum(r['metrics'].compression_ratio for r in batch_results) / len(batch_results)
    avg_percentage = sum(r['metrics'].compression_percentage for r in batch_results) / len(batch_results)
    
    print(f"\n📊 Batch Averages:")
    print(f"  - Average ratio: {avg_ratio:.2f}x")
    print(f"  - Average saved: {avg_percentage:.1f}%")


if __name__ == "__main__":
    print("\n" + "🎯 COMPRESSION METRICS MODULE DEMONSTRATION" + "\n")
    
    # Run all demos
    demo_1_simple_metrics_calculation()
    demo_2_file_size_formatting()
    demo_3_timer_context_manager()
    demo_4_api_response_formatting()
    demo_5_human_readable_summary()
    demo_6_create_test_image_and_compress()
    demo_7_comparison_formatting()
    demo_8_batch_compression_metrics()
    
    print("\n" + "="*70)
    print("✓ All Metrics Demos Completed Successfully!")
    print("="*70 + "\n")
    
    print("📚 Key Takeaways:")
    print("  1. MetricsCalculator - Calculate compression statistics")
    print("  2. MetricsFormatter - Format metrics for display and API")
    print("  3. CompressionTimer - Time operations with context manager")
    print("  4. CompressionMetrics - Data class for storing metrics")
    print("  5. Integration - Use with compression_workflow for full pipeline\n")
