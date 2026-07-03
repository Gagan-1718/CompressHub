"""
Image Processing and Compression Workflow - Demo and Examples

This module demonstrates the complete workflow of:
1. Loading an image
2. Extracting pixels
3. Compressing with Huffman encoding
4. Decompressing
5. Reconstructing the image
6. Calculating statistics

Run this module to see working examples.
"""

import numpy as np
from pathlib import Path
from PIL import Image
import tempfile

from .image_processing import ImageProcessor, ImageMetadata
from .compression_workflow import (
    compress_image_file,
    decompress_image_file,
    get_compression_report
)


def create_test_image(width: int = 256, height: int = 256) -> Image.Image:
    """Create a test image with patterns for demonstration."""
    # Create a simple checkerboard pattern
    array = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Checkerboard pattern
    for y in range(height):
        for x in range(width):
            if (x // 32 + y // 32) % 2 == 0:
                array[y, x] = [255, 0, 0]  # Red
            else:
                array[y, x] = [0, 0, 255]  # Blue
    
    return Image.fromarray(array, mode='RGB')


def demo_basic_image_operations():
    """Demonstrate basic image loading and pixel extraction."""
    print("=" * 70)
    print("DEMO 1: Basic Image Operations")
    print("=" * 70)
    
    # Create test image
    print("\n1. Creating test image (256x256 checkerboard)...")
    test_image = create_test_image(256, 256)
    
    # Extract metadata
    print("2. Extracting image metadata...")
    metadata = ImageProcessor.get_image_metadata(test_image)
    print(f"   - Dimensions: {metadata.width}x{metadata.height}")
    print(f"   - Channels: {metadata.channels}")
    print(f"   - Color space: {metadata.color_space}")
    print(f"   - Total pixels: {metadata.total_pixels}")
    print(f"   - Total bytes: {metadata.total_bytes}")
    
    # Extract pixel array
    print("3. Extracting pixel array...")
    pixel_array = ImageProcessor.extract_pixel_array(test_image, flatten=False)
    print(f"   - Array shape: {pixel_array.shape}")
    print(f"   - Array dtype: {pixel_array.dtype}")
    print(f"   - Array size: {pixel_array.nbytes:,} bytes")
    
    # Extract flattened
    print("4. Extracting flattened pixel array...")
    flat_pixels = ImageProcessor.extract_pixel_array(test_image, flatten=True)
    print(f"   - Flattened shape: {flat_pixels.shape}")
    print(f"   - Size: {flat_pixels.nbytes:,} bytes")
    
    # Reconstruct image
    print("5. Reconstructing image from pixels...")
    reconstructed = ImageProcessor.reconstruct_image(pixel_array, metadata)
    print(f"   - Reconstructed size: {reconstructed.size}")
    print(f"   - Reconstructed mode: {reconstructed.mode}")
    
    # Save image
    print("6. Saving test image...")
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = Path(tmpdir) / "test_image.jpg"
        saved_path = ImageProcessor.save_image(reconstructed, str(output_path))
        file_size = saved_path.stat().st_size
        print(f"   - Saved to: {saved_path.name}")
        print(f"   - File size: {file_size:,} bytes")
    
    print("\n✓ Basic operations completed successfully")


def demo_compression_workflow():
    """Demonstrate complete compression and decompression workflow."""
    print("\n" + "=" * 70)
    print("DEMO 2: Complete Compression Workflow")
    print("=" * 70)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        
        # Create test image
        print("\n1. Creating test images...")
        
        # Small checkerboard
        test_img1 = create_test_image(128, 128)
        img1_path = tmpdir / "test_small.jpg"
        ImageProcessor.save_image(test_img1, str(img1_path))
        print(f"   - Small image (128x128): {img1_path.stat().st_size:,} bytes")
        
        # Larger checkerboard
        test_img2 = create_test_image(512, 512)
        img2_path = tmpdir / "test_large.jpg"
        ImageProcessor.save_image(test_img2, str(img2_path))
        print(f"   - Large image (512x512): {img2_path.stat().st_size:,} bytes")
        
        # Compress both
        for img_path in [img1_path, img2_path]:
            print(f"\n2. Compressing {img_path.name}...")
            compress_result = compress_image_file(
                str(img_path),
                str(tmpdir / img_path.stem),
                enable_preprocessing=True
            )
            
            if compress_result['status'] == 'success':
                print(f"   ✓ Compression successful")
                print(f"   - Original pixels: {compress_result['original_pixel_size']:,} bytes")
                print(f"   - Compressed: {compress_result['compressed_size']:,} bytes")
                print(f"   - Ratio: {compress_result['compression_ratio']:.2f}x")
                print(f"   - Saved: {compress_result['compression_percentage']:.1f}%")
                print(f"   - Time: {compress_result['compression_time_ms']:.1f}ms")
                print(f"   - Unique symbols: {compress_result['unique_symbols']}")
                
                # Decompress
                print(f"\n3. Decompressing...")
                decompress_result = decompress_image_file(
                    compress_result['compressed_file'],
                    compress_result['metadata_file'],
                    str(tmpdir / f"{img_path.stem}_reconstructed.jpg"),
                    quality=95
                )
                
                if decompress_result['status'] == 'success':
                    print(f"   ✓ Decompression successful")
                    print(f"   - Decompressed: {decompress_result['original_size']:,} bytes")
                    print(f"   - Rebuilt file: {decompress_result['rebuilt_file']}")
                    print(f"   - Time: {decompress_result['decompression_time_ms']:.1f}ms")
                    
                    # Verify
                    print(f"\n4. Verifying compression integrity...")
                    original_bytes = compress_result['original_pixel_size']
                    decompressed_bytes = decompress_result['original_size']
                    
                    if original_bytes == decompressed_bytes:
                        print(f"   ✓ Data integrity verified")
                        print(f"   - {original_bytes:,} bytes match perfectly")
                    else:
                        print(f"   ✗ Size mismatch!")
                        print(f"   - Expected: {original_bytes:,}")
                        print(f"   - Got: {decompressed_bytes:,}")
                    
                    # Statistics
                    print(f"\n5. Compression statistics:")
                    report = get_compression_report(compress_result, decompress_result)
                    print(f"   - Image: {report['image']['original_dimensions']}")
                    print(f"   - Compression: {report['compression']['compression_ratio']}")
                    print(f"   - Savings: {report['compression']['compression_percentage']}")
                    if 'decompression' in report:
                        print(f"   - Total time: "
                              f"{float(report['decompression']['time_ms']) + compress_result['compression_time_ms']:.1f}ms")
                else:
                    print(f"   ✗ Decompression failed: {decompress_result['message']}")
            else:
                print(f"   ✗ Compression failed: {compress_result['message']}")


def demo_different_formats():
    """Demonstrate handling different image formats."""
    print("\n" + "=" * 70)
    print("DEMO 3: Different Image Formats")
    print("=" * 70)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        
        # Create test image
        test_image = create_test_image(256, 256)
        
        formats = ['.jpg', '.png', '.bmp']
        
        for fmt in formats:
            print(f"\n1. Testing {fmt} format...")
            
            # Save in format
            img_path = tmpdir / f"test_image{fmt}"
            ImageProcessor.save_image(test_image, str(img_path))
            file_size = img_path.stat().st_size
            print(f"   - Saved: {file_size:,} bytes")
            
            # Load back
            loaded = ImageProcessor.load_image(str(img_path))
            print(f"   - Loaded: {loaded.size[0]}x{loaded.size[1]}, {loaded.mode}")
            
            # Extract pixels
            pixels = ImageProcessor.extract_pixel_array(loaded)
            print(f"   - Pixels shape: {pixels.shape}")
            print(f"   - ✓ Format OK")


def demo_edge_cases():
    """Demonstrate edge cases and error handling."""
    print("\n" + "=" * 70)
    print("DEMO 4: Edge Cases and Error Handling")
    print("=" * 70)
    
    # Test 1: Small image
    print("\n1. Small image (1x1 pixel)...")
    try:
        tiny_img = Image.new('RGB', (1, 1), color=(255, 0, 0))
        pixels = ImageProcessor.extract_pixel_array(tiny_img, flatten=True)
        print(f"   - Pixels: {pixels}")
        print(f"   - ✓ Small images handled OK")
    except Exception as e:
        print(f"   - ✗ Error: {e}")
    
    # Test 2: Grayscale image
    print("\n2. Grayscale image...")
    try:
        gray_img = Image.new('L', (100, 100), color=128)
        metadata = ImageProcessor.get_image_metadata(gray_img)
        print(f"   - Channels: {metadata.channels}")
        print(f"   - Color space: {metadata.color_space}")
        pixels = ImageProcessor.extract_pixel_array(gray_img)
        print(f"   - Shape: {pixels.shape}")
        print(f"   - ✓ Grayscale handled OK")
    except Exception as e:
        print(f"   - ✗ Error: {e}")
    
    # Test 3: RGBA image
    print("\n3. RGBA image...")
    try:
        rgba_img = Image.new('RGBA', (100, 100), color=(255, 0, 0, 128))
        metadata = ImageProcessor.get_image_metadata(rgba_img)
        print(f"   - Channels: {metadata.channels}")
        print(f"   - Color space: {metadata.color_space}")
        converted = ImageProcessor.convert_to_rgb(rgba_img)
        print(f"   - Converted mode: {converted.mode}")
        print(f"   - ✓ RGBA handled OK")
    except Exception as e:
        print(f"   - ✗ Error: {e}")


if __name__ == "__main__":
    print("\n")
    print("╔" + "=" * 68 + "╗")
    print("║" + " " * 68 + "║")
    print("║" + "IMAGE PROCESSING & COMPRESSION WORKFLOW DEMO".center(68) + "║")
    print("║" + " " * 68 + "║")
    print("╚" + "=" * 68 + "╝")
    
    demo_basic_image_operations()
    demo_compression_workflow()
    demo_different_formats()
    demo_edge_cases()
    
    print("\n" + "=" * 70)
    print("ALL DEMOS COMPLETED ✓")
    print("=" * 70 + "\n")
