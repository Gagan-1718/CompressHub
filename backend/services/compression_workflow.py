"""
Image Compression Workflow

Complete end-to-end workflow for compressing and decompressing images.
Integrates image processing with Huffman compression engine.

Functions:
    compress_image_file: Load image, compress pixels, save metadata
    decompress_image_file: Load compressed data, decompress, rebuild image
    get_compression_report: Calculate and format compression statistics
"""

import time
import json
from pathlib import Path
from typing import Tuple, Dict, Any
import numpy as np

from .image_processing import ImageProcessor, ImageMetadata
from .compression.demo import compress_data, decompress_data
from ..utils.metrics import (
    CompressionTimer,
    MetricsCalculator,
    MetricsFormatter,
    calculate_metrics_from_files,
)
import logging

logger = logging.getLogger(__name__)


def compress_image_file(
    image_path: str,
    output_prefix: str,
    enable_preprocessing: bool = True
) -> Dict[str, Any]:
    """
    Complete image compression workflow.
    
    Loads image file, extracts pixels, applies Huffman compression,
    saves compressed data and metadata.
    
    Args:
        image_path: Path to input image file (jpg, png, bmp)
        output_prefix: Prefix for output files (without extension)
        enable_preprocessing: Whether to apply color space conversion
        
    Returns:
        Dict with compression results:
            'status': 'success' or 'error'
            'message': Result description
            'original_size': Original file size in bytes
            'compressed_size': Compressed data size
            'compression_ratio': original_size / compressed_size
            'compression_percentage': % space saved
            'compression_time_ms': Time taken for compression
            'image_metadata': ImageMetadata object
            'metadata_json': Serialized metadata
            'tree_metadata': Serialized Huffman tree
            'padding': Padding bits (0-7)
            'unique_symbols': Number of unique byte values
            'compressed_file': Path to compressed file
            'metadata_file': Path to metadata file
            
    Raises:
        FileNotFoundError: If input file doesn't exist
        ValueError: If image cannot be processed
        
    Example:
        result = compress_image_file(
            "original.jpg",
            "output/compressed",
            enable_preprocessing=True
        )
        
        if result['status'] == 'success':
            print(f"Ratio: {result['compression_ratio']:.2f}x")
            print(f"Saved: {result['compression_percentage']:.1f}%")
            
            # Files saved at:
            # - output/compressed.huff (compressed data)
            # - output/compressed.meta (metadata)
    """
    try:
        logger.info(f"Starting image compression: {image_path}")
        start_time = time.time()
        
        # 1. Load image and get metadata
        logger.debug("Loading image...")
        image = ImageProcessor.load_image(image_path)
        image_metadata = ImageProcessor.get_image_metadata(
            image,
            Path(image_path).suffix
        )
        
        # Get original file size
        original_file_size = ImageProcessor.get_file_size(image_path)
        
        # 2. Apply preprocessing if requested
        if enable_preprocessing:
            logger.debug("Applying preprocessing...")
            image = ImageProcessor.convert_to_rgb(image)
        
        # 3. Extract pixel data
        logger.debug("Extracting pixel array...")
        pixel_array = ImageProcessor.extract_pixel_array(image, flatten=False)
        pixel_bytes = pixel_array.astype(np.uint8).tobytes()
        
        # 4. Compress using Huffman encoding
        logger.debug(f"Compressing {len(pixel_bytes):,} bytes...")
        with CompressionTimer("Compression") as timer:
            compressed_data, tree_metadata, padding, stats = compress_data(pixel_bytes)
        compression_time = timer.get_elapsed_ms()
        
        # 5. Save compressed data
        logger.debug("Saving compressed data...")
        output_prefix = Path(output_prefix)
        output_prefix.parent.mkdir(parents=True, exist_ok=True)
        
        compressed_file = output_prefix.with_suffix('.huff')
        with open(compressed_file, 'wb') as f:
            f.write(compressed_data)
        
        # 6. Create metrics object
        metrics = MetricsCalculator.create_metrics(
            original_file_size=original_file_size,
            compressed_file_size=len(compressed_data),
            compression_time_ms=compression_time,
            original_file_path=image_path,
            compressed_file_path=str(compressed_file),
            image_format=image_metadata.format,
            image_width=image_metadata.width,
            image_height=image_metadata.height,
            image_channels=image_metadata.channels,
        )
        
        # 7. Build metadata structure
        metadata = {
            'image_metadata': {
                'width': image_metadata.width,
                'height': image_metadata.height,
                'channels': image_metadata.channels,
                'color_space': image_metadata.color_space,
                'format': image_metadata.format,
                'total_pixels': image_metadata.total_pixels,
                'total_bytes': image_metadata.total_bytes,
            },
            'compression': {
                'original_size': len(pixel_bytes),
                'compressed_size': len(compressed_data),
                'compression_ratio': stats.calculate_ratio(),
                'compression_percentage': stats.calculate_percentage(),
                'compression_time_ms': compression_time,
                'unique_symbols': stats.unique_symbols,
                'padding': padding,
            },
            'huffman_tree': tree_metadata,  # JSON string
            'metrics': metrics.to_dict(),  # Include metrics in metadata
        }
        
        # 8. Save metadata
        logger.debug("Saving metadata...")
        metadata_file = output_prefix.with_suffix('.meta')
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        total_time = (time.time() - start_time) * 1000
        
        # Format metrics for API response
        api_metrics = MetricsFormatter.format_api_response(metrics)
        
        result = {
            'status': 'success',
            'message': f"Image compressed successfully",
            'original_file_size': original_file_size,
            'original_pixel_size': len(pixel_bytes),
            'compressed_size': len(compressed_data),
            'compression_ratio': stats.calculate_ratio(),
            'compression_percentage': stats.calculate_percentage(),
            'compression_time_ms': compression_time,
            'total_time_ms': total_time,
            'image_metadata': image_metadata,
            'metadata_json': metadata,
            'tree_metadata': tree_metadata,
            'padding': padding,
            'unique_symbols': stats.unique_symbols,
            'compressed_file': str(compressed_file),
            'metadata_file': str(metadata_file),
            'metrics': metrics.to_dict(),  # Metrics object
            'api_metrics': api_metrics,  # Formatted for API response
        }
        
        # Log summary
        logger.info(MetricsFormatter.format_summary(metrics))
        
        return result
    
    except Exception as e:
        logger.error(f"Compression failed: {str(e)}")
        return {
            'status': 'error',
            'message': str(e),
            'original_file_size': 0,
            'compressed_size': 0,
        }


def decompress_image_file(
    compressed_file: str,
    metadata_file: str,
    output_path: str,
    quality: int = 95
) -> Dict[str, Any]:
    """
    Complete image decompression workflow.
    
    Loads compressed data and metadata, decompresses using Huffman decoding,
    reconstructs image, and saves to disk.
    
    Args:
        compressed_file: Path to .huff compressed data file
        metadata_file: Path to .meta metadata JSON file
        output_path: Path to save reconstructed image
        quality: JPEG quality if saving as JPG (1-100)
        
    Returns:
        Dict with decompression results:
            'status': 'success' or 'error'
            'message': Result description
            'decompression_time_ms': Time taken for decompression
            'original_size': Original decompressed size in bytes
            'compressed_size': Compressed data size
            'rebuilt_file': Path to rebuilt image
            'image_metadata': ImageMetadata object
            
    Raises:
        FileNotFoundError: If compressed or metadata files don't exist
        ValueError: If metadata is invalid or decompression fails
        
    Example:
        result = decompress_image_file(
            "compressed.huff",
            "compressed.meta",
            "reconstructed.jpg",
            quality=95
        )
        
        if result['status'] == 'success':
            print(f"Image rebuilt: {result['rebuilt_file']}")
            print(f"Decompression time: {result['decompression_time_ms']:.1f}ms")
    """
    try:
        logger.info(f"Starting image decompression")
        start_time = time.time()
        
        # 1. Load metadata
        logger.debug("Loading metadata...")
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        img_meta = metadata['image_metadata']
        comp_meta = metadata['compression']
        tree_meta = metadata['huffman_tree']
        
        image_metadata = ImageMetadata(
            width=img_meta['width'],
            height=img_meta['height'],
            channels=img_meta['channels'],
            color_space=img_meta['color_space'],
            format=img_meta['format'],
            total_pixels=img_meta['total_pixels'],
        )
        
        # 2. Load compressed data
        logger.debug("Loading compressed data...")
        with open(compressed_file, 'rb') as f:
            compressed_data = f.read()
        
        # 3. Decompress using Huffman decoding
        logger.debug("Decompressing data...")
        with CompressionTimer("Decompression") as timer:
            decompressed_bytes = decompress_data(
                compressed_data,
                tree_meta,
                comp_meta['padding']
            )
        decompression_time = timer.get_elapsed_ms()
        
        # 4. Reshape to image dimensions
        logger.debug("Reshaping to image dimensions...")
        pixel_array = np.frombuffer(decompressed_bytes, dtype=np.uint8)
        pixel_array = pixel_array.reshape(
            image_metadata.height,
            image_metadata.width,
            image_metadata.channels
        )
        
        # 5. Reconstruct image
        logger.debug("Reconstructing image...")
        image = ImageProcessor.reconstruct_image(pixel_array, image_metadata)
        
        # 6. Save reconstructed image
        logger.debug(f"Saving reconstructed image: {output_path}")
        output_file = ImageProcessor.save_image(
            image,
            output_path,
            quality=quality
        )
        
        total_time = (time.time() - start_time) * 1000
        
        # Create metrics object for decompression
        metrics = MetricsCalculator.create_metrics(
            original_file_size=len(decompressed_bytes),
            compressed_file_size=len(compressed_data),
            compression_time_ms=0,  # Not applicable for decompression
            decompression_time_ms=decompression_time,
            image_format=image_metadata.format,
            image_width=image_metadata.width,
            image_height=image_metadata.height,
            image_channels=image_metadata.channels,
        )
        
        # Format metrics for API response
        api_metrics = MetricsFormatter.format_api_response(metrics)
        
        result = {
            'status': 'success',
            'message': 'Image decompressed successfully',
            'original_size': len(decompressed_bytes),
            'compressed_size': len(compressed_data),
            'decompression_time_ms': decompression_time,
            'total_time_ms': total_time,
            'image_metadata': image_metadata,
            'rebuilt_file': str(output_file),
            'metrics': metrics.to_dict(),  # Metrics object
            'api_metrics': api_metrics,  # Formatted for API response
        }
        
        logger.info(
            f"Decompression complete in {decompression_time:.1f}ms - "
            f"Size: {len(compressed_data):,} → {len(decompressed_bytes):,} bytes"
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Decompression failed: {str(e)}")
        return {
            'status': 'error',
            'message': str(e),
            'decompression_time_ms': 0,
        }


def get_compression_report(
    compress_result: Dict[str, Any],
    decompress_result: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Generate comprehensive compression statistics report.
    
    Uses the metrics module to provide formatted, consistent reporting.
    
    Args:
        compress_result: Result dict from compress_image_file
        decompress_result: Optional result dict from decompress_image_file
        
    Returns:
        Dict with formatted statistics including:
            'metrics': Compression metrics object
            'api_format': Formatted for API response
            'summary': Human-readable text summary
            'image': Image information
            'files': File paths
        
    Example:
        compress_result = compress_image_file("photo.jpg", "output/photo")
        decompress_result = decompress_image_file(
            "output/photo.huff",
            "output/photo.meta",
            "output/photo_reconstructed.jpg"
        )
        
        report = get_compression_report(compress_result, decompress_result)
        print(report['summary'])  # Human-readable summary
        print(json.dumps(report['api_format']))  # For frontend API
    """
    if compress_result['status'] != 'success':
        return {'error': 'Compression failed'}
    
    # Get metrics from result (already calculated and formatted)
    metrics = compress_result.get('metrics')
    api_metrics = compress_result.get('api_metrics', {})
    
    report = {
        'metrics': metrics,  # Full metrics object
        'api_format': api_metrics,  # Formatted for API response
        'summary': MetricsFormatter.format_summary(metrics) if metrics else 'Metrics unavailable',
        'image': {
            'original_dimensions': (
                f"{compress_result['image_metadata'].width}x"
                f"{compress_result['image_metadata'].height}"
            ),
            'channels': compress_result['image_metadata'].channels,
            'color_space': compress_result['image_metadata'].color_space,
            'total_pixels': compress_result['image_metadata'].total_pixels,
        },
        'compression': {
            'original_file_size': compress_result['original_file_size'],
            'original_pixel_size': compress_result['original_pixel_size'],
            'compressed_size': compress_result['compressed_size'],
            'compression_ratio': compress_result['compression_ratio'],
            'compression_percentage': compress_result['compression_percentage'],
            'unique_symbols': compress_result['unique_symbols'],
        },
        'timing': {
            'compression_time_ms': compress_result['compression_time_ms'],
            'total_time_ms': compress_result['total_time_ms'],
        },
        'files': {
            'original': compress_result.get('original_file_path', compress_result.get('compressed_file_path', '').replace('.huff', '')),
            'compressed': compress_result['compressed_file'],
            'metadata': compress_result['metadata_file'],
        }
    }
    
    if decompress_result and decompress_result['status'] == 'success':
        decomp_metrics = decompress_result.get('metrics')
        
        report['decompression'] = {
            'time_ms': decompress_result['decompression_time_ms'],
            'rebuilt_file': decompress_result['rebuilt_file'],
        }
        report['verification'] = {
            'decompressed_size': decompress_result['original_size'],
            'matches_original': (
                decompress_result['original_size'] ==
                compress_result['original_pixel_size']
            ),
            'lossless': True,  # Huffman is always lossless
        }
        
        # Add comparison summary if both metrics available
        if decomp_metrics:
            report['comparison_summary'] = MetricsFormatter.format_comparison(
                metrics, decomp_metrics
            )
    
    return report
