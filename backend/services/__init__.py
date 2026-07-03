"""Initialize services package"""
from .compression import HuffmanCompressionService
from .image_processor import ImageProcessor
from .image_processing import (
    ImageProcessor as ImageProcessingModule,
    ImageMetadata,
    load_image,
    extract_pixel_array,
    reconstruct_image,
    save_image,
)
from .compression_workflow import (
    compress_image_file,
    decompress_image_file,
    get_compression_report,
)

__all__ = [
    # Compression service
    "HuffmanCompressionService",
    
    # Original image processor (for backward compatibility)
    "ImageProcessor",
    
    # New image processing module
    "ImageProcessingModule",
    "ImageMetadata",
    "load_image",
    "extract_pixel_array",
    "reconstruct_image",
    "save_image",
    
    # Compression workflow
    "compress_image_file",
    "decompress_image_file",
    "get_compression_report",
]
