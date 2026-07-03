"""
Image Processing Module

This module provides comprehensive image I/O and processing capabilities for the
Interactive Image Compression Lab. It handles loading, processing, and saving
images while maintaining compatibility with the Huffman compression engine.

Supported Formats: JPG, JPEG, PNG, BMP
Color Spaces: RGB, RGBA, Grayscale
Data Type: uint8 (0-255)

Functions:
    load_image: Load image from file
    extract_pixel_array: Convert image to numpy array
    reconstruct_image: Build image from pixel array
    save_image: Save image to file
    get_image_metadata: Extract image properties
    convert_color_space: Change image color mode
    validate_image: Check image integrity
    
Classes:
    ImageMetadata: Store image properties
    ImageProcessor: Main processing interface
"""

import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ImageMetadata:
    """
    Image metadata container.
    
    Attributes:
        width: Image width in pixels
        height: Image height in pixels
        channels: Number of color channels (1, 3, or 4)
        color_space: Color space mode (RGB, RGBA, L, etc.)
        format: File format (JPEG, PNG, BMP)
        total_pixels: Total pixel count (width × height)
        data_type: NumPy data type (numpy.uint8)
        bits_per_channel: Bits per color channel (8)
    """
    width: int
    height: int
    channels: int
    color_space: str
    format: str
    total_pixels: int
    data_type: str = "uint8"
    bits_per_channel: int = 8
    
    @property
    def total_bytes(self) -> int:
        """Calculate total bytes for uncompressed image data"""
        return self.total_pixels * self.channels
    
    def __repr__(self) -> str:
        return (
            f"ImageMetadata("
            f"size={self.width}x{self.height}, "
            f"channels={self.channels}, "
            f"color_space={self.color_space}, "
            f"format={self.format})"
        )


class ImageProcessor:
    """
    Main image processing interface.
    
    Handles image loading, extraction, reconstruction, and saving
    with support for multiple formats.
    """
    
    # Supported formats
    SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.bmp', '.JPG', '.JPEG', '.PNG', '.BMP'}
    
    # Color space mappings
    COLOR_SPACE_MAP = {
        'RGB': 3,
        'RGBA': 4,
        'BGR': 3,
        'BGRA': 4,
        'L': 1,
        'Grayscale': 1,
    }
    
    @staticmethod
    def load_image(filepath: str) -> Image.Image:
        """
        Load image from file using Pillow (PIL).
        
        Pillow is used as the primary loader for consistency across platforms
        and formats. Automatically converts to RGB for processing.
        
        Args:
            filepath: Path to image file (jpg, png, bmp)
            
        Returns:
            PIL Image object
            
        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If file is not a valid image
            
        Example:
            image = ImageProcessor.load_image("photo.jpg")
            assert image.size == (1920, 1080)
        """
        filepath = Path(filepath)
        
        # Validate file exists
        if not filepath.exists():
            raise FileNotFoundError(f"Image file not found: {filepath}")
        
        # Validate extension
        if filepath.suffix not in ImageProcessor.SUPPORTED_FORMATS:
            supported = ', '.join(ImageProcessor.SUPPORTED_FORMATS)
            raise ValueError(
                f"Unsupported format '{filepath.suffix}'. "
                f"Supported: {supported}"
            )
        
        try:
            # Load image with Pillow
            image = Image.open(filepath)
            
            # Validate image
            if not image or image.size == (0, 0):
                raise ValueError("Invalid image: empty or corrupted")
            
            logger.info(
                f"Loaded image: {filepath.name} "
                f"({image.size[0]}x{image.size[1]}, {image.mode})"
            )
            
            return image
        
        except Exception as e:
            raise ValueError(f"Failed to load image: {str(e)}")
    
    @staticmethod
    def load_image_cv2(filepath: str) -> np.ndarray:
        """
        Load image from file using OpenCV.
        
        Alternative loader using OpenCV (cv2). Returns BGR format.
        Useful for advanced image processing operations.
        
        Args:
            filepath: Path to image file
            
        Returns:
            NumPy array in BGR format (OpenCV standard)
            
        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If file cannot be read
            
        Note:
            OpenCV loads images in BGR format, not RGB.
            Use cv2.cvtColor(image, cv2.COLOR_BGR2RGB) to convert.
        """
        filepath = Path(filepath)
        
        if not filepath.exists():
            raise FileNotFoundError(f"Image file not found: {filepath}")
        
        # Read with OpenCV (BGR format)
        image = cv2.imread(str(filepath), cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError(f"Failed to load image: {filepath}")
        
        logger.info(
            f"Loaded image (OpenCV): {filepath.name} "
            f"({image.shape[1]}x{image.shape[0]}, BGR)"
        )
        
        return image
    
    @staticmethod
    def extract_pixel_array(image: Image.Image, flatten: bool = False) -> np.ndarray:
        """
        Convert PIL Image to NumPy array.
        
        Extracts pixel data as uint8 numpy array. Can return 2D (H×W) for
        grayscale or 3D (H×W×C) for color, optionally flattened to 1D.
        
        Args:
            image: PIL Image object
            flatten: Whether to flatten to 1D array
            
        Returns:
            NumPy array of type uint8
            Shape: (height, width) for grayscale
                   (height, width, 3) for RGB
                   (height, width, 4) for RGBA
                   (height*width*channels,) if flatten=True
            
        Raises:
            ValueError: If image format not supported
            
        Example:
            image = ImageProcessor.load_image("photo.jpg")
            
            # Get 3D array
            pixels = ImageProcessor.extract_pixel_array(image)
            assert pixels.shape == (height, width, 3)
            assert pixels.dtype == np.uint8
            
            # Get flattened 1D array for compression
            flat_pixels = ImageProcessor.extract_pixel_array(image, flatten=True)
            assert flat_pixels.shape == (height*width*3,)
        """
        try:
            # Convert to numpy array
            pixel_array = np.array(image, dtype=np.uint8)
            
            # Validate array
            if pixel_array.size == 0:
                raise ValueError("Image array is empty")
            
            if pixel_array.dtype != np.uint8:
                raise ValueError(
                    f"Unexpected dtype: {pixel_array.dtype}. "
                    f"Expected uint8."
                )
            
            # Ensure minimum 2D
            if pixel_array.ndim < 2:
                raise ValueError("Image must be at least 2D")
            
            # Flatten if requested
            if flatten:
                pixel_array = pixel_array.flatten()
            
            logger.debug(
                f"Extracted pixel array: shape={pixel_array.shape}, "
                f"dtype={pixel_array.dtype}"
            )
            
            return pixel_array
        
        except Exception as e:
            raise ValueError(f"Failed to extract pixel array: {str(e)}")
    
    @staticmethod
    def extract_pixel_array_from_file(
        filepath: str,
        flatten: bool = False
    ) -> Tuple[np.ndarray, ImageMetadata]:
        """
        Load image and extract pixel array in one operation.
        
        Convenience function that loads image and extracts pixels.
        Also returns metadata for reconstruction.
        
        Args:
            filepath: Path to image file
            flatten: Whether to flatten to 1D array
            
        Returns:
            Tuple of (pixel_array, metadata)
            
        Example:
            pixels, metadata = ImageProcessor.extract_pixel_array_from_file(
                "photo.jpg",
                flatten=True
            )
            # Now pixels can be sent to Huffman compressor
            from services.compression.demo import compress_data
            compressed, tree_meta, padding, stats = compress_data(pixels)
        """
        # Load image
        image = ImageProcessor.load_image(filepath)
        
        # Get metadata
        metadata = ImageProcessor.get_image_metadata(image, Path(filepath).suffix)
        
        # Extract pixels
        pixel_array = ImageProcessor.extract_pixel_array(image, flatten=flatten)
        
        logger.info(
            f"Extracted from {Path(filepath).name}: "
            f"{metadata.total_pixels} pixels, {len(pixel_array)} bytes"
        )
        
        return pixel_array, metadata
    
    @staticmethod
    def get_image_metadata(image: Image.Image, format: str = None) -> ImageMetadata:
        """
        Extract image metadata and properties.
        
        Analyzes image to determine dimensions, color space, and format.
        
        Args:
            image: PIL Image object
            format: File format/extension (e.g., '.jpg', '.png')
            
        Returns:
            ImageMetadata object with image properties
            
        Raises:
            ValueError: If metadata cannot be determined
            
        Example:
            image = ImageProcessor.load_image("photo.jpg")
            metadata = ImageProcessor.get_image_metadata(image)
            
            assert metadata.width == 1920
            assert metadata.height == 1080
            assert metadata.channels == 3  # RGB
            assert metadata.total_bytes == 1920 * 1080 * 3
        """
        try:
            width, height = image.size
            
            # Determine number of channels and color space
            if image.mode == 'RGB':
                channels = 3
                color_space = 'RGB'
            elif image.mode == 'RGBA':
                channels = 4
                color_space = 'RGBA'
            elif image.mode == 'L':
                channels = 1
                color_space = 'L'
            elif image.mode == 'P':  # Palette mode
                # Convert palette to RGB
                channels = 3
                color_space = 'RGB'
            else:
                # Convert to RGB for compatibility
                channels = 3
                color_space = 'RGB'
            
            # Determine format
            if format:
                img_format = format.strip('.').upper()
            else:
                img_format = image.format or "UNKNOWN"
            
            metadata = ImageMetadata(
                width=width,
                height=height,
                channels=channels,
                color_space=color_space,
                format=img_format,
                total_pixels=width * height,
            )
            
            logger.debug(f"Image metadata: {metadata}")
            
            return metadata
        
        except Exception as e:
            raise ValueError(f"Failed to extract metadata: {str(e)}")
    
    @staticmethod
    def reconstruct_image(
        pixel_array: np.ndarray,
        metadata: ImageMetadata
    ) -> Image.Image:
        """
        Reconstruct PIL Image from pixel array.
        
        Rebuilds image from raw pixel data using stored metadata.
        The pixel array should be the exact output from decompress_pixels.
        
        Args:
            pixel_array: NumPy array of uint8 pixel values
                        Shape: (height, width) for grayscale
                               (height, width, 3) for RGB
                               (height, width, 4) for RGBA
            metadata: ImageMetadata with dimensions and color space
            
        Returns:
            Reconstructed PIL Image object
            
        Raises:
            ValueError: If shapes don't match or reconstruction fails
            
        Example:
            # After decompression
            from services.compression.demo import decompress_data
            
            decompressed_pixels = decompress_data(
                compressed_bytes,
                tree_metadata,
                padding
            )
            
            # Reshape if needed (from flattened)
            pixels_2d = decompressed_pixels.reshape(
                metadata.height,
                metadata.width,
                metadata.channels
            )
            
            # Reconstruct image
            image = ImageProcessor.reconstruct_image(pixels_2d, metadata)
            assert image.size == (metadata.width, metadata.height)
        """
        try:
            # Validate array type and shape
            if not isinstance(pixel_array, np.ndarray):
                raise ValueError("pixel_array must be numpy array")
            
            if pixel_array.dtype != np.uint8:
                raise ValueError(
                    f"Expected uint8 array, got {pixel_array.dtype}. "
                    f"Convert with: array.astype(np.uint8)"
                )
            
            # Ensure array is not flattened
            if pixel_array.ndim == 1:
                raise ValueError(
                    "Pixel array must be 2D or 3D. "
                    "Reshape with: array.reshape(height, width, channels)"
                )
            
            # Validate shape matches metadata
            expected_height = metadata.height
            expected_width = metadata.width
            
            if pixel_array.shape[0] != expected_height:
                raise ValueError(
                    f"Height mismatch: array has {pixel_array.shape[0]}, "
                    f"metadata expects {expected_height}"
                )
            
            if pixel_array.shape[1] != expected_width:
                raise ValueError(
                    f"Width mismatch: array has {pixel_array.shape[1]}, "
                    f"metadata expects {expected_width}"
                )
            
            # For grayscale (1 channel), PIL expects 2D array
            if metadata.channels == 1:
                if pixel_array.ndim != 2:
                    raise ValueError(
                        f"Grayscale expects 2D array, got {pixel_array.ndim}D"
                    )
                image = Image.fromarray(pixel_array, mode='L')
            
            # For RGB (3 channels)
            elif metadata.channels == 3:
                if pixel_array.ndim != 3 or pixel_array.shape[2] != 3:
                    raise ValueError(
                        f"RGB expects 3D array with shape (H,W,3), "
                        f"got {pixel_array.shape}"
                    )
                image = Image.fromarray(pixel_array, mode='RGB')
            
            # For RGBA (4 channels)
            elif metadata.channels == 4:
                if pixel_array.ndim != 3 or pixel_array.shape[2] != 4:
                    raise ValueError(
                        f"RGBA expects 3D array with shape (H,W,4), "
                        f"got {pixel_array.shape}"
                    )
                image = Image.fromarray(pixel_array, mode='RGBA')
            
            else:
                raise ValueError(
                    f"Unsupported channel count: {metadata.channels}"
                )
            
            # Verify reconstruction
            assert image.size == (metadata.width, metadata.height), \
                f"Size mismatch after reconstruction"
            
            logger.info(
                f"Reconstructed image: {metadata.width}x{metadata.height}, "
                f"{metadata.color_space}"
            )
            
            return image
        
        except Exception as e:
            raise ValueError(f"Failed to reconstruct image: {str(e)}")
    
    @staticmethod
    def save_image(image: Image.Image, filepath: str, quality: int = 95) -> Path:
        """
        Save PIL Image to file.
        
        Saves image to disk with format autodetection based on file extension.
        Supports JPG, PNG, and BMP formats. JPG quality can be adjusted.
        
        Args:
            image: PIL Image object to save
            filepath: Output file path (should include extension)
            quality: JPEG quality (1-100, default 95)
                    Ignored for PNG and BMP
            
        Returns:
            Path object of saved file
            
        Raises:
            ValueError: If format not supported or save fails
            
        Example:
            # Reconstruct and save
            image = ImageProcessor.reconstruct_image(pixels, metadata)
            output_path = ImageProcessor.save_image(
                image,
                "reconstructed.jpg",
                quality=95
            )
            assert output_path.exists()
            assert output_path.stat().st_size > 0
        """
        try:
            filepath = Path(filepath)
            
            # Validate format
            suffix = filepath.suffix.lower()
            if suffix not in ImageProcessor.SUPPORTED_FORMATS:
                supported = ', '.join(ImageProcessor.SUPPORTED_FORMATS)
                raise ValueError(
                    f"Unsupported save format '{suffix}'. "
                    f"Supported: {supported}"
                )
            
            # Create parent directory if needed
            filepath.parent.mkdir(parents=True, exist_ok=True)
            
            # Save with format-specific options
            if suffix in {'.jpg', '.jpeg'}:
                image.save(
                    filepath,
                    format='JPEG',
                    quality=quality,
                    optimize=True
                )
            elif suffix == '.png':
                image.save(
                    filepath,
                    format='PNG',
                    optimize=True
                )
            elif suffix == '.bmp':
                image.save(
                    filepath,
                    format='BMP'
                )
            else:
                image.save(filepath)
            
            # Verify save
            if not filepath.exists():
                raise ValueError("File was not saved")
            
            file_size = filepath.stat().st_size
            logger.info(
                f"Saved image: {filepath.name} "
                f"({file_size:,} bytes)"
            )
            
            return filepath
        
        except Exception as e:
            raise ValueError(f"Failed to save image: {str(e)}")
    
    @staticmethod
    def convert_to_rgb(image: Image.Image) -> Image.Image:
        """
        Convert image to RGB color space if needed.
        
        Handles conversion from various formats (RGBA, Grayscale, Palette)
        to standard RGB format.
        
        Args:
            image: PIL Image object
            
        Returns:
            Image in RGB mode (or unchanged if already RGB)
            
        Example:
            image = ImageProcessor.load_image("photo.png")  # RGBA
            rgb_image = ImageProcessor.convert_to_rgb(image)
            assert rgb_image.mode == 'RGB'
        """
        if image.mode == 'RGB':
            return image
        
        if image.mode == 'RGBA':
            # Create white background
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            return background
        
        elif image.mode == 'L':
            # Grayscale to RGB
            return image.convert('RGB')
        
        elif image.mode == 'P':
            # Palette to RGB
            return image.convert('RGB')
        
        else:
            # Generic conversion
            return image.convert('RGB')
    
    @staticmethod
    def validate_image(image: Image.Image) -> bool:
        """
        Validate image integrity and format.
        
        Args:
            image: PIL Image object
            
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Check size
            if image.size[0] <= 0 or image.size[1] <= 0:
                return False
            
            # Check mode
            if image.mode not in {'RGB', 'RGBA', 'L', 'P', '1'}:
                return False
            
            # Try to access pixels
            _ = image.tobytes()
            
            return True
        
        except Exception:
            return False
    
    @staticmethod
    def get_file_size(filepath: str) -> int:
        """
        Get file size in bytes.
        
        Args:
            filepath: Path to image file
            
        Returns:
            File size in bytes
        """
        return Path(filepath).stat().st_size


# Convenience functions for simple usage
def load_image(filepath: str) -> Image.Image:
    """Load image from file. Convenience wrapper."""
    return ImageProcessor.load_image(filepath)


def extract_pixel_array(
    image: Image.Image,
    flatten: bool = False
) -> np.ndarray:
    """Extract pixel array from image. Convenience wrapper."""
    return ImageProcessor.extract_pixel_array(image, flatten=flatten)


def reconstruct_image(
    pixel_array: np.ndarray,
    metadata: ImageMetadata
) -> Image.Image:
    """Reconstruct image from pixels. Convenience wrapper."""
    return ImageProcessor.reconstruct_image(pixel_array, metadata)


def save_image(
    image: Image.Image,
    filepath: str,
    quality: int = 95
) -> Path:
    """Save image to file. Convenience wrapper."""
    return ImageProcessor.save_image(image, filepath, quality=quality)
