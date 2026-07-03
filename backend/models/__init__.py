"""Initialize models package"""
from .compression import (
    CompressionRequest,
    CompressionResponse,
    CompressionMetrics,
    ImageInfo,
    CompressionJob,
    UploadResponse,
)

__all__ = [
    "CompressionRequest",
    "CompressionResponse",
    "CompressionMetrics",
    "ImageInfo",
    "CompressionJob",
    "UploadResponse",
]
