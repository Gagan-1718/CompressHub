"""
Image processing service for handling image data extraction and manipulation
"""
from PIL import Image
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
from ..models import ImageInfo


class ImageProcessor:
    """Service for processing and analyzing images"""
    
    @staticmethod
    def load_image(filepath: Path) -> Image.Image:
        """
        Load image from file
        
        Args:
            filepath: Path to image file
            
        Returns:
            PIL Image object
        """
        return Image.open(filepath)
    
    @staticmethod
    def get_image_info(image: Image.Image, filename: str, file_size: int) -> ImageInfo:
        """
        Extract image metadata
        
        Args:
            image: PIL Image object
            filename: Original filename
            file_size: File size in bytes
            
        Returns:
            ImageInfo object with metadata
        """
        width, height = image.size
        
        # Get number of channels
        if image.mode == 'RGB':
            channels = 3
        elif image.mode == 'RGBA':
            channels = 4
        elif image.mode == 'L':
            channels = 1
        else:
            channels = len(image.getbands())
        
        return ImageInfo(
            filename=filename,
            width=width,
            height=height,
            channels=channels,
            file_size=file_size,
            format=image.format or "UNKNOWN",
            color_space=image.mode,
        )
    
    @staticmethod
    def convert_to_array(image: Image.Image) -> np.ndarray:
        """
        Convert image to numpy array
        
        Args:
            image: PIL Image object
            
        Returns:
            numpy array of image data
        """
        return np.array(image)
    
    @staticmethod
    def convert_to_rgb(image: Image.Image) -> Image.Image:
        """
        Convert image to RGB if needed
        
        Args:
            image: PIL Image object
            
        Returns:
            RGB image
        """
        if image.mode != 'RGB':
            return image.convert('RGB')
        return image
    
    @staticmethod
    def apply_color_quantization(image: Image.Image, colors: int = 256) -> Image.Image:
        """
        Apply color quantization to reduce color palette
        
        Args:
            image: PIL Image object
            colors: Number of colors to quantize to (default 256)
            
        Returns:
            Quantized image
        """
        if image.mode != 'P':
            image = image.quantize(colors=colors)
        return image
    
    @staticmethod
    def get_pixel_data(image: Image.Image, flatten: bool = True) -> np.ndarray:
        """
        Extract flattened pixel data from image
        
        Args:
            image: PIL Image object
            flatten: Whether to flatten to 1D array
            
        Returns:
            Pixel data as numpy array
        """
        arr = np.array(image)
        
        if flatten:
            arr = arr.flatten()
        
        return arr
    
    @staticmethod
    def recreate_image_from_array(
        pixel_data: np.ndarray,
        width: int,
        height: int,
        channels: int,
        color_space: str = 'RGB'
    ) -> Image.Image:
        """
        Recreate image from pixel data array
        
        Args:
            pixel_data: Pixel data array
            width: Image width
            height: Image height
            channels: Number of channels
            color_space: Color space mode (RGB, RGBA, L, etc.)
            
        Returns:
            Reconstructed PIL Image
        """
        # Reshape to original dimensions
        if channels == 1:
            shape = (height, width)
        else:
            shape = (height, width, channels)
        
        arr = pixel_data.reshape(shape)
        
        # Clip values to valid range
        if arr.dtype in [np.float32, np.float64]:
            arr = np.clip(arr, 0, 255).astype(np.uint8)
        
        image = Image.fromarray(arr, mode=color_space)
        return image
    
    @staticmethod
    def resize_image(image: Image.Image, max_width: int = 1920, max_height: int = 1080) -> Image.Image:
        """
        Resize image if it exceeds max dimensions
        
        Args:
            image: PIL Image object
            max_width: Maximum width
            max_height: Maximum height
            
        Returns:
            Resized image (or original if smaller)
        """
        width, height = image.size
        
        if width <= max_width and height <= max_height:
            return image
        
        # Calculate aspect ratio
        aspect_ratio = width / height
        
        if width > max_width:
            new_width = max_width
            new_height = int(new_width / aspect_ratio)
        else:
            new_height = max_height
            new_width = int(new_height * aspect_ratio)
        
        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    @staticmethod
    def apply_preprocessing(image: Image.Image, quantize: bool = True) -> Tuple[Image.Image, dict]:
        """
        Apply preprocessing transformations (color space conversion, quantization)
        
        Args:
            image: PIL Image object
            quantize: Whether to apply color quantization
            
        Returns:
            Tuple of (processed image, preprocessing info dict)
        """
        preprocessing_info = {
            'original_mode': image.mode,
            'quantized': False,
            'original_colors': None,
        }
        
        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
            preprocessing_info['converted_to_rgb'] = True
        
        # Apply color quantization if requested
        if quantize and image.mode == 'RGB':
            preprocessing_info['original_colors'] = 3  # RGB
            image = image.quantize(colors=256)
            preprocessing_info['quantized'] = True
            preprocessing_info['quantized_colors'] = 256
        
        return image, preprocessing_info
