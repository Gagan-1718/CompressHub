"""
Input validation utilities
"""
from ..config import settings
from pathlib import Path


def validate_file_extension(filename: str) -> bool:
    """
    Validate that file has allowed extension
    
    Args:
        filename: Name of file
        
    Returns:
        bool: True if valid, False otherwise
    """
    ext = Path(filename).suffix.lower().strip('.')
    return ext in settings.allowed_extensions


def validate_file_size(file_size: int) -> bool:
    """
    Validate that file size is within limits
    
    Args:
        file_size: Size in bytes
        
    Returns:
        bool: True if valid, False otherwise
    """
    return file_size <= settings.max_upload_size


def validate_image_dimensions(width: int, height: int) -> bool:
    """
    Validate image dimensions (prevent extremely large images)
    
    Args:
        width: Image width in pixels
        height: Image height in pixels
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Reasonable limits to prevent memory issues
    max_dimension = 65536  # 64K pixels per side
    max_megapixels = 100  # 100 megapixels total
    
    if width > max_dimension or height > max_dimension:
        return False
    
    megapixels = (width * height) / (1024 * 1024)
    return megapixels <= max_megapixels


def get_validation_errors(filename: str, file_size: int, width: int, height: int) -> list:
    """
    Get all validation errors for a file
    
    Args:
        filename: Name of file
        file_size: File size in bytes
        width: Image width
        height: Image height
        
    Returns:
        list: List of error messages (empty if valid)
    """
    errors = []
    
    if not validate_file_extension(filename):
        ext = Path(filename).suffix.lower()
        errors.append(f"File extension '{ext}' not allowed. Allowed: {settings.allowed_extensions}")
    
    if not validate_file_size(file_size):
        max_mb = settings.max_upload_size / (1024 * 1024)
        errors.append(f"File size exceeds {max_mb}MB limit")
    
    if not validate_image_dimensions(width, height):
        errors.append(f"Image dimensions ({width}x{height}) exceed limits (64K per side, 100MP total)")
    
    return errors
