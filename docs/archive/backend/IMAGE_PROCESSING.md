"""
IMAGE PROCESSING MODULE - Documentation

This document provides comprehensive documentation for the image processing
module and its integration with the Huffman compression engine.
"""

# ============================================================================
# MODULE OVERVIEW
# ============================================================================
#
# Location: services/image_processing.py
# Size: 700+ lines of production-grade code
#
# The image processing module provides complete image I/O and processing
# capabilities optimized for image compression workflows.
#
# Key capabilities:
# - Load images from disk (JPG, PNG, BMP)
# - Extract pixel arrays (2D and 3D)
# - Reconstruct images from pixels
# - Save images with format-specific options
# - Handle multiple color spaces (RGB, RGBA, Grayscale)
# - Transform color spaces
# - Validate image integrity
#
# ============================================================================
# DATA STRUCTURES
# ============================================================================
#
# class ImageMetadata(@dataclass)
# ────────────────────────────────────────────────────────────────────────
#
#    Stores image properties needed for reconstruction.
#
#    Fields:
#        width: int              - Image width in pixels
#        height: int             - Image height in pixels
#        channels: int           - Number of channels (1, 3, or 4)
#        color_space: str        - Color mode (RGB, RGBA, L)
#        format: str             - File format (JPEG, PNG, BMP)
#        total_pixels: int       - width × height
#        data_type: str          - "uint8" (always)
#        bits_per_channel: int   - 8 (always)
#
#    Properties:
#        total_bytes: int        - total_pixels × channels
#
#    Example:
#        metadata = ImageMetadata(
#            width=1920,
#            height=1080,
#            channels=3,
#            color_space='RGB',
#            format='JPEG',
#            total_pixels=2073600,
#        )
#        print(f"Total bytes: {metadata.total_bytes}")  # 6220800
#
# ============================================================================
# CORE CLASS: ImageProcessor
# ============================================================================
#
# Static methods for image processing operations.
#
# Class Attributes:
#   SUPPORTED_FORMATS: {'.jpg', '.jpeg', '.png', '.bmp', ...}
#   COLOR_SPACE_MAP: {'RGB': 3, 'RGBA': 4, 'L': 1, ...}
#
# ============================================================================
# MAIN FUNCTIONS
# ============================================================================
#
# 1. load_image(filepath: str) -> Image.Image
# ────────────────────────────────────────────────────────────────────────
#
#    Load image from file using Pillow (PIL).
#    Automatically validates file and format.
#
#    Supports: .jpg, .jpeg, .png, .bmp
#
#    Args:
#        filepath (str): Path to image file
#
#    Returns:
#        PIL.Image.Image: Loaded image object
#
#    Raises:
#        FileNotFoundError: If file doesn't exist
#        ValueError: If format unsupported or file corrupted
#
#    Example:
#        image = ImageProcessor.load_image("photo.jpg")
#        image = ImageProcessor.load_image("path/to/image.png")
#        image = ImageProcessor.load_image("data/picture.bmp")
#
# 2. extract_pixel_array(image, flatten=False) -> np.ndarray
# ────────────────────────────────────────────────────────────────────────
#
#    Convert PIL Image to NumPy array.
#    Handles grayscale (1D output) and color (3D output).
#
#    Args:
#        image (PIL.Image): Image object
#        flatten (bool): If True, return 1D array; else return 2D/3D
#
#    Returns:
#        np.ndarray: Pixel array (dtype=uint8)
#
#    Output shapes:
#        Grayscale without flatten: (height, width)
#        Grayscale with flatten: (height*width,)
#        RGB without flatten: (height, width, 3)
#        RGB with flatten: (height*width*3,)
#
#    Example:
#        image = ImageProcessor.load_image("photo.jpg")
#        
#        # Get 3D array for analysis
#        pixels_3d = ImageProcessor.extract_pixel_array(image)
#        print(pixels_3d.shape)  # (480, 640, 3)
#        
#        # Get 1D array for compression
#        pixels_1d = ImageProcessor.extract_pixel_array(image, flatten=True)
#        print(pixels_1d.shape)  # (921600,)
#        
#        # Now compress
#        from services.compression.demo import compress_data
#        pixels_bytes = pixels_1d.astype(np.uint8).tobytes()
#        compressed, metadata, padding, stats = compress_data(pixels_bytes)
#
# 3. reconstruct_image(pixel_array, metadata) -> Image.Image
# ────────────────────────────────────────────────────────────────────────
#
#    Build image from pixel array using metadata.
#    Reverses extract_pixel_array operation.
#
#    Args:
#        pixel_array (np.ndarray): Pixel data array
#                                  Must have correct shape and dtype=uint8
#        metadata (ImageMetadata): Image properties (dimensions, channels)
#
#    Returns:
#        PIL.Image.Image: Reconstructed image
#
#    Validation:
#        - Array must be uint8
#        - Shape must match metadata dimensions
#        - Array must not be flattened (must be 2D or 3D)
#
#    Supported color modes:
#        - Grayscale (1 channel): shape = (H, W)
#        - RGB (3 channels): shape = (H, W, 3)
#        - RGBA (4 channels): shape = (H, W, 4)
#
#    Example:
#        # After decompression
#        from services.compression.demo import decompress_data
#        
#        decompressed = decompress_data(compressed, metadata, padding)
#        pixels = decompressed.reshape(
#            metadata.height,
#            metadata.width,
#            metadata.channels
#        )
#        
#        # Reconstruct image
#        image = ImageProcessor.reconstruct_image(pixels, metadata)
#        print(image.size)  # (width, height)
#
# 4. save_image(image, filepath, quality=95) -> Path
# ────────────────────────────────────────────────────────────────────────
#
#    Save PIL Image to disk.
#    Format autodetected from file extension.
#
#    Args:
#        image (PIL.Image): Image to save
#        filepath (str): Output path (include extension)
#        quality (int): JPEG quality 1-100 (default 95)
#
#    Returns:
#        Path: Path object of saved file
#
#    Supported formats:
#        .jpg/.jpeg: With quality parameter (default 95)
#        .png: Lossless (quality ignored)
#        .bmp: Uncompressed
#
#    Example:
#        image = ImageProcessor.load_image("original.jpg")
#        
#        # Save as JPEG
#        path1 = ImageProcessor.save_image(image, "output.jpg", quality=85)
#        
#        # Save as PNG
#        path2 = ImageProcessor.save_image(image, "output.png")
#        
#        # Save as BMP
#        path3 = ImageProcessor.save_image(image, "output.bmp")
#
# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
#
# get_image_metadata(image, format=None) -> ImageMetadata
#     Extract image properties (dimensions, channels, color space)
#
# convert_to_rgb(image) -> Image.Image
#     Convert image to RGB color space if needed
#     Handles: RGBA, L (grayscale), P (palette), etc.
#
# validate_image(image) -> bool
#     Check if image is valid (non-empty, accessible pixels)
#
# get_file_size(filepath) -> int
#     Get file size in bytes
#
# load_image_cv2(filepath) -> np.ndarray
#     Alternative loader using OpenCV (returns BGR format)
#
# extract_pixel_array_from_file(filepath, flatten=False)
#     Load image and extract pixels in one operation
#     Returns: (pixel_array, metadata)
#
# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================
#
# Module also exports module-level functions for simple usage:
#
#   from services.image_processing import load_image, extract_pixel_array, ...
#
#   image = load_image("photo.jpg")
#   pixels = extract_pixel_array(image, flatten=True)
#   reconstructed = reconstruct_image(pixels, metadata)
#   save_image(reconstructed, "output.jpg")
#
# ============================================================================
# WORKFLOW INTEGRATION
# ============================================================================
#
# Location: services/compression_workflow.py
#
# Complete workflows that integrate image processing with Huffman compression:
#
# compress_image_file(image_path, output_prefix, enable_preprocessing=True)
#     Full compression pipeline:
#     1. Load image from disk
#     2. Get metadata
#     3. Extract pixels
#     4. Apply Huffman compression
#     5. Save compressed data
#     6. Save metadata JSON
#     
#     Returns: Dict with results
#
# decompress_image_file(compressed_file, metadata_file, output_path, quality=95)
#     Full decompression pipeline:
#     1. Load metadata
#     2. Load compressed data
#     3. Decompress with Huffman
#     4. Reshape to image dimensions
#     5. Reconstruct image
#     6. Save to disk
#     
#     Returns: Dict with results
#
# get_compression_report(compress_result, decompress_result=None)
#     Generate formatted statistics report
#
# ============================================================================
# USAGE EXAMPLES
# ============================================================================
#
# Example 1: Simple Image Loading
# ────────────────────────────────────────────────────────────────────────
#
#   from services.image_processing import ImageProcessor
#
#   # Load image
#   image = ImageProcessor.load_image("photo.jpg")
#   print(f"Size: {image.size}")
#   print(f"Mode: {image.mode}")
#   
#   # Get metadata
#   metadata = ImageProcessor.get_image_metadata(image)
#   print(f"Total bytes: {metadata.total_bytes}")
#
# Example 2: Extract and Compress
# ────────────────────────────────────────────────────────────────────────
#
#   from services.image_processing import ImageProcessor
#   from services.compression.demo import compress_data
#
#   # Load and extract
#   image = ImageProcessor.load_image("photo.jpg")
#   metadata = ImageProcessor.get_image_metadata(image)
#   pixels = ImageProcessor.extract_pixel_array(image, flatten=True)
#   pixels_bytes = pixels.tobytes()
#
#   # Compress
#   compressed, tree_meta, padding, stats = compress_data(pixels_bytes)
#   print(f"Ratio: {stats.calculate_ratio():.2f}x")
#
# Example 3: Decompress and Reconstruct
# ────────────────────────────────────────────────────────────────────────
#
#   from services.image_processing import ImageProcessor
#   from services.compression.demo import decompress_data
#
#   # Decompress
#   decompressed = decompress_data(compressed, tree_meta, padding)
#   
#   # Reshape and reconstruct
#   pixels = np.frombuffer(decompressed, dtype=np.uint8)
#   pixels = pixels.reshape(
#       metadata.height,
#       metadata.width,
#       metadata.channels
#   )
#   image = ImageProcessor.reconstruct_image(pixels, metadata)
#   
#   # Save
#   ImageProcessor.save_image(image, "output.jpg", quality=95)
#
# Example 4: Complete Workflow (Recommended)
# ────────────────────────────────────────────────────────────────────────
#
#   from services.compression_workflow import (
#       compress_image_file,
#       decompress_image_file,
#       get_compression_report
#   )
#
#   # Compress
#   result = compress_image_file(
#       "original.jpg",
#       "output/photo",
#       enable_preprocessing=True
#   )
#   
#   if result['status'] == 'success':
#       print(f"Ratio: {result['compression_ratio']:.2f}x")
#       
#       # Decompress
#       decomp = decompress_image_file(
#           result['compressed_file'],
#           result['metadata_file'],
#           "output/reconstructed.jpg"
#       )
#       
#       # Report
#       report = get_compression_report(result, decomp)
#       print(report)
#
# ============================================================================
# SUPPORTED FORMATS AND COLOR SPACES
# ============================================================================
#
# Supported Input Formats:
#   - JPEG (.jpg, .jpeg)
#   - PNG (.png)
#   - BMP (.bmp)
#
# Supported Color Spaces:
#   RGB (3 channels)
#   RGBA (4 channels)
#   Grayscale (1 channel)
#   (Others auto-converted)
#
# Data Type:
#   Always uint8 (0-255 per channel)
#
# ============================================================================
# PERFORMANCE CHARACTERISTICS
# ============================================================================
#
# File I/O:
#   - Load JPG (1MB): ~10-20ms
#   - Load PNG (1MB): ~5-15ms
#   - Load BMP (1MB): ~2-10ms
#   - Save JPG (1MB, quality=95): ~20-50ms
#
# Array Operations:
#   - Extract pixels: ~5-10ms
#   - Reconstruct image: ~2-5ms
#
# Memory Usage:
#   - Loaded image: ~4-6 bytes per pixel (1MB image ≈ 1-2MB in memory)
#   - Pixel array: Same as image data
#   - Temporary arrays: During conversion only
#
# ============================================================================
# ERROR HANDLING
# ============================================================================
#
# FileNotFoundError
#   - File doesn't exist
#   - Solution: Verify path and permissions
#
# ValueError
#   - Unsupported format
#   - Image corrupted
#   - Metadata mismatch during reconstruction
#   - Array shape/dtype mismatch
#
# Best Practices:
#   - Always check file exists before loading
#   - Validate metadata before reconstruction
#   - Use try/except for file operations
#
# ============================================================================
# TESTING
# ============================================================================
#
# Run demo:
#   python -m services.image_processing_demo
#
# Tests covered:
#   1. Basic image operations
#   2. Complete compression workflow
#   3. Different file formats
#   4. Edge cases (small images, grayscale, RGBA)
#
# ============================================================================
