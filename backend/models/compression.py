"""
Pydantic models for compression and image data
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CompressionRequest(BaseModel):
    """Request payload for compression job"""
    filename: str = Field(..., min_length=1, max_length=255)
    enable_preprocessing: bool = True


class CompressionResponse(BaseModel):
    """Response payload for completed compression"""
    job_id: str
    filename: str
    original_size: int
    compressed_size: int
    compression_ratio: float
    compression_percentage: float
    compression_time_ms: float
    original_image_path: str
    compressed_image_path: str
    status: str = "success"
    timestamp: datetime


class CompressionMetrics(BaseModel):
    """Compression statistics and metrics"""
    job_id: str
    original_file_size: int
    compressed_file_size: int
    compression_ratio: float
    compression_percentage: float
    compression_duration_ms: float
    decompression_duration_ms: float
    image_width: int
    image_height: int
    image_channels: int
    color_space: str
    preprocessing_applied: bool


class ImageInfo(BaseModel):
    """Basic image information"""
    filename: str
    width: int
    height: int
    channels: int
    file_size: int
    format: str
    color_space: str


class CompressionJob(BaseModel):
    """Compression job record"""
    job_id: str
    filename: str
    status: str  # pending, processing, completed, failed
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metrics: Optional[CompressionMetrics] = None


class UploadResponse(BaseModel):
    """Response from file upload"""
    job_id: str
    filename: str
    file_size: int
    image_info: ImageInfo
    message: str
