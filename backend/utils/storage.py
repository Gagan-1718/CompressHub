"""
File storage and management utilities
"""
import os
import shutil
from pathlib import Path
from typing import Optional
from ..config import settings
import uuid


def generate_job_id() -> str:
    """Generate unique job ID"""
    return str(uuid.uuid4())


def get_upload_path(filename: str) -> Path:
    """Get path for uploaded file"""
    return settings.upload_dir / filename


def get_compressed_path(filename: str) -> Path:
    """Get path for compressed file"""
    return settings.compressed_dir / filename


def save_uploaded_file(file_data: bytes, filename: str) -> str:
    """
    Save uploaded file to storage
    
    Args:
        file_data: Binary file content
        filename: Name of the file
        
    Returns:
        str: Path to saved file
    """
    filepath = get_upload_path(filename)
    
    # Ensure directory exists
    filepath.parent.mkdir(parents=True, exist_ok=True)
    
    # Write file to disk
    with open(filepath, 'wb') as f:
        f.write(file_data)
    
    return str(filepath)


def save_compressed_file(file_data: bytes, filename: str) -> str:
    """
    Save compressed file to storage
    
    Args:
        file_data: Binary compressed content
        filename: Name of the file
        
    Returns:
        str: Path to saved file
    """
    filepath = get_compressed_path(filename)
    
    # Ensure directory exists
    filepath.parent.mkdir(parents=True, exist_ok=True)
    
    # Write file to disk
    with open(filepath, 'wb') as f:
        f.write(file_data)
    
    return str(filepath)


def load_file(filepath: Path) -> bytes:
    """
    Load file from disk
    
    Args:
        filepath: Path to file
        
    Returns:
        bytes: File content
    """
    with open(filepath, 'rb') as f:
        return f.read()


def delete_file(filepath: Path) -> bool:
    """
    Delete file from disk
    
    Args:
        filepath: Path to file
        
    Returns:
        bool: True if deleted, False otherwise
    """
    try:
        if filepath.exists():
            filepath.unlink()
            return True
        return False
    except Exception as e:
        print(f"Error deleting file {filepath}: {e}")
        return False


def cleanup_job_files(job_id: str) -> None:
    """
    Clean up all files associated with a job
    
    Args:
        job_id: Job ID
    """
    # Could implement logic to track and clean up job-specific files
    pass


def get_file_size(filepath: Path) -> int:
    """
    Get file size in bytes
    
    Args:
        filepath: Path to file
        
    Returns:
        int: File size in bytes
    """
    try:
        return filepath.stat().st_size
    except Exception as e:
        print(f"Error getting file size for {filepath}: {e}")
        return 0
