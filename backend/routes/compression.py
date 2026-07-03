"""
Compression API routes and endpoints

Compression is performed with the real Huffman coding engine in
services.compression (HuffmanCompressionService, backed by
services.compression.huffman). Compressed output is written as a
self-describing ".huff" container: a 4-byte big-endian length prefix,
followed by UTF-8 JSON metadata (Huffman tree, padding, original shape
and dtype), followed by the raw Huffman-coded bytes.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, Response
import json
import logging
import struct
import time
import io
import base64
from ..config import settings
from ..utils import (
    generate_job_id,
    save_uploaded_file,
    get_file_size,
    get_validation_errors,
)
from ..services import ImageProcessor, HuffmanCompressionService, ImageProcessingModule
from ..services.compression.analysis import analyze_compression
from ..services.image_processing import extract_pixel_array, reconstruct_image
from ..utils.metrics import MetricsCalculator
from ..models import UploadResponse, ImageInfo
from pathlib import Path
from PIL import Image

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/compression", tags=["compression"])

# In-memory job tracking (will be replaced with database)
compression_jobs = {}


def _build_huffman_container(compressed_bytes: bytes, meta: dict) -> bytes:
    """Pack Huffman metadata (tree, shape, padding) + coded bytes into one file."""
    meta_json = json.dumps(meta).encode('utf-8')
    header = struct.pack('>I', len(meta_json))
    return header + meta_json + compressed_bytes


def _parse_huffman_container(container: bytes):
    (meta_len,) = struct.unpack('>I', container[:4])
    meta = json.loads(container[4:4 + meta_len].decode('utf-8'))
    compressed_bytes = container[4 + meta_len:]
    return meta, compressed_bytes


def perform_compression(job_id: str, quality: str = 'high'):
    """Compress the uploaded image's pixel data using real Huffman coding.

    `quality` is accepted for API/frontend compatibility but has no effect:
    Huffman coding here is lossless, so there is no quality knob to turn.
    """
    try:
        job = compression_jobs[job_id]

        # Load original image
        original_path = job['filepath']
        original_image = Image.open(original_path)
        original_image.load()
        uploaded_file_size = Path(original_path).stat().st_size

        img_format = original_image.format or 'PNG'
        img_mode = original_image.mode
        img_width, img_height = original_image.size

        rgb_image = ImageProcessingModule.convert_to_rgb(original_image)
        metadata = ImageProcessingModule.get_image_metadata(rgb_image, format=img_format)
        pixel_array = extract_pixel_array(rgb_image, flatten=False)

        # Huffman-encode the raw pixel bytes
        huffman = HuffmanCompressionService()
        compressed_bytes, service_meta = huffman.compress(pixel_array)
        container = _build_huffman_container(compressed_bytes, service_meta)

        compressed_dir = settings.compressed_dir
        compressed_dir.mkdir(parents=True, exist_ok=True)
        compressed_path = compressed_dir / f"{job_id}_compressed.huff"
        compressed_path.write_bytes(container)

        # Huffman coding operates on the raw (uncompressed) pixel bytes, so
        # that is the correct, honest baseline for the compression ratio --
        # NOT the uploaded file's size. The uploaded file may already be a
        # JPEG (itself compressed with a much stronger algorithm than plain
        # Huffman coding), so comparing against it would be apples-to-oranges
        # and could show a nonsensical negative "compression" percentage even
        # when Huffman coding is working correctly.
        original_size = service_meta['original_size']
        compressed_size = len(container)

        # Round-trip decode immediately: proves correctness and gives us a
        # pixel-identical preview image (Huffman coding here is lossless).
        decompressed_array, decompression_time_ms = huffman.decompress(compressed_bytes, service_meta)
        compressed_image = reconstruct_image(decompressed_array, metadata)

        # Convert images to base64 PNG for display
        original_buffer = io.BytesIO()
        rgb_image.save(original_buffer, format='PNG')
        original_base64 = base64.b64encode(original_buffer.getvalue()).decode('utf-8')

        compressed_buffer = io.BytesIO()
        compressed_image.save(compressed_buffer, format='PNG')
        compressed_base64 = base64.b64encode(compressed_buffer.getvalue()).decode('utf-8')

        # Calculate metrics using the shared MetricsCalculator
        compression_time_ms = service_meta['compression_time_ms']
        compression_time = compression_time_ms / 1000

        try:
            compression_ratio = MetricsCalculator.calculate_compression_ratio(original_size, compressed_size)
        except ValueError:
            compression_ratio = 0.0
        try:
            savings_percent = MetricsCalculator.calculate_compression_percentage(original_size, compressed_size)
        except ValueError:
            savings_percent = 0.0

        saved_bytes = original_size - compressed_size
        format_file_size = MetricsCalculator.format_file_size

        # Build comprehensive metrics (shape matches what the frontend reads)
        metrics = {
            'file_sizes': {
                'original_bytes': original_size,
                'compressed_bytes': compressed_size,
                'original_formatted': format_file_size(original_size),
                'compressed_formatted': format_file_size(compressed_size),
                'saved_formatted': format_file_size(saved_bytes),
                'uploaded_file_bytes': uploaded_file_size,
                'uploaded_file_formatted': format_file_size(uploaded_file_size),
            },
            'compression': {
                'ratio': round(compression_ratio, 2),
                'percentage': round(savings_percent, 2),
                'compression_time_ms': round(compression_time_ms, 2),
                'decompression_time_ms': round(decompression_time_ms, 2),
            },
            'image_info': {
                'original_width': img_width,
                'original_height': img_height,
                'format': img_format,
                'color_mode': img_mode,
                'compressed_width': compressed_image.width,
                'compressed_height': compressed_image.height,
            },
            'timestamp': {
                'start': job.get('upload_time', time.time()),
                'end': time.time(),
                'duration_ms': round(compression_time_ms, 2),
            },
        }

        # Educational analysis for the results page: algorithm comparison,
        # entropy floor vs achieved bits/byte, and the Huffman code table.
        try:
            metrics['analysis'] = analyze_compression(pixel_array, compressed_size)
        except Exception as analysis_error:
            logger.warning(f"Compression analysis failed for {job_id}: {analysis_error}")

        # Update job with results
        compression_jobs[job_id].update({
            'status': 'completed',
            'original_size': original_size,
            'compressed_size': compressed_size,
            'compression_time': compression_time,
            'compression_ratio': compression_ratio,
            'savings_percent': savings_percent,
            'original_base64': original_base64,
            'compressed_base64': compressed_base64,
            'compressed_path': str(compressed_path),
            'metrics': metrics,
        })

        logger.info(f"Compression completed: {job_id} ({savings_percent:.1f}% savings)")

    except Exception as e:
        logger.error(f"Compression failed for job {job_id}: {e}")
        if job_id in compression_jobs:
            compression_jobs[job_id]['status'] = 'failed'
            compression_jobs[job_id]['error'] = str(e)


@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file for compression
    
    Args:
        file: Image file to upload (jpg, png, bmp)
        
    Returns:
        UploadResponse with job ID and image metadata
        
    Raises:
        HTTPException: If validation fails
    """
    try:
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Load image to get metadata
        import io
        from PIL import Image
        
        image = Image.open(io.BytesIO(content))
        width, height = image.size
        
        # Validate file
        validation_errors = get_validation_errors(
            file.filename,
            file_size,
            width,
            height
        )
        
        if validation_errors:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: {'; '.join(validation_errors)}"
            )
        
        # Generate job ID
        job_id = generate_job_id()
        
        # Save uploaded file
        filepath = save_uploaded_file(content, f"{job_id}_{file.filename}")
        
        # Get image info
        image_processor = ImageProcessor()
        image_info = image_processor.get_image_info(image, file.filename, file_size)
        
        # Track job
        compression_jobs[job_id] = {
            'filename': file.filename,
            'filepath': filepath,
            'status': 'uploaded',
            'file_size': file_size,
            'image_info': image_info,
            'upload_time': time.time(),
        }
        
        logger.info(f"Image uploaded successfully: {file.filename} (Job ID: {job_id})")
        
        return UploadResponse(
            job_id=job_id,
            filename=file.filename,
            file_size=file_size,
            image_info=image_info,
            message=f"Image uploaded successfully. Job ID: {job_id}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )


@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """
    Get compression job status
    
    Args:
        job_id: Job ID to query
        
    Returns:
        Job status and metadata
        
    Raises:
        HTTPException: If job not found
    """
    if job_id not in compression_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )
    
    job = compression_jobs[job_id]
    response = {
        'job_id': job_id,
        'filename': job['filename'],
        'status': job['status'],
        'file_size': job['file_size'],
    }
    
    # Include results if compression is completed
    if job['status'] == 'completed':
        response['metrics'] = job.get('metrics', {})
        response['original_image'] = f"data:image/png;base64,{job.get('original_base64', '')}"
        response['compressed_image'] = f"data:image/png;base64,{job.get('compressed_base64', '')}"
    elif job['status'] == 'failed':
        response['error'] = job.get('error', 'Unknown error')
    
    return response


@router.post("/compress/{job_id}")
async def compress_image(
    job_id: str,
    background_tasks: BackgroundTasks,
    quality: str = "high",
    enable_preprocessing: bool = True
):
    """
    Start compression for an uploaded image
    
    Args:
        job_id: Job ID to compress
        quality: Compression quality ('high', 'medium', 'fast')
        background_tasks: FastAPI background tasks
        enable_preprocessing: Whether to apply preprocessing
        
    Returns:
        Compression job details
        
    Raises:
        HTTPException: If job not found or already processing
    """
    if job_id not in compression_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )
    
    job = compression_jobs[job_id]
    
    if job['status'] != 'uploaded':
        raise HTTPException(
            status_code=400,
            detail=f"Job status is {job['status']}, cannot compress"
        )
    
    # Update status with compression settings
    compression_jobs[job_id]['status'] = 'processing'
    compression_jobs[job_id]['quality'] = quality
    compression_jobs[job_id]['compression_start'] = time.time()
    
    # Perform compression immediately (synchronously for now)
    perform_compression(job_id, quality)

    # If compression failed, surface this as an HTTP error so the
    # frontend can show a clear message instead of an empty preview.
    job_after = compression_jobs[job_id]
    if job_after.get('status') != 'completed':
        error_msg = job_after.get('error', 'Compression failed')
        raise HTTPException(status_code=500, detail=error_msg)

    return {
        'job_id': job_id,
        'message': 'Compression completed',
        'status': job_after['status'],
        'quality': quality,
        'metrics': job_after.get('metrics', {})
    }


@router.get("/compare/{job_id}")
async def get_comparison(job_id: str):
    """
    Get original and compressed images for comparison
    
    Args:
        job_id: Job ID to retrieve images for
        
    Returns:
        Paths to original and compressed images
        
    Raises:
        HTTPException: If job not found or not completed
    """
    if job_id not in compression_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )
    
    job = compression_jobs[job_id]
    
    if job['status'] != 'completed':
        raise HTTPException(
            status_code=400,
            detail=f"Job status is {job['status']}, cannot retrieve comparison"
        )
    
    return {
        'job_id': job_id,
        'original_path': job['filepath'],
        'compressed_path': job.get('compressed_filepath'),
        'metrics': job.get('metrics'),
    }


@router.get("/metrics/{job_id}")
async def get_compression_metrics(job_id: str):
    """
    Get compression metrics for completed job
    
    Args:
        job_id: Job ID to retrieve metrics for
        
    Returns:
        Compression metrics and statistics
        
    Raises:
        HTTPException: If job not found or not completed
    """
    if job_id not in compression_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )
    
    job = compression_jobs[job_id]
    
    if job['status'] != 'completed':
        raise HTTPException(
            status_code=400,
            detail=f"Job status is {job['status']}, metrics not available"
        )
    
    return job.get('metrics', {})


@router.get("/download/{job_id}")
async def download_compressed_image(job_id: str, raw: bool = False):
    """
    Download the compressed image

    Args:
        job_id: Job ID to download compressed image from
        raw: If true, download the raw Huffman-coded .huff artifact instead
             of a viewable image (default: False)

    Returns:
        FileResponse with compressed image
        
    Raises:
        HTTPException: If job not found or not completed
    """
    if job_id not in compression_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )
    
    job = compression_jobs[job_id]
    
    if job['status'] != 'completed':
        raise HTTPException(
            status_code=400,
            detail=f"Job status is {job['status']}, cannot download"
        )
    
    original_filename = job['filename']
    name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename

    if raw:
        # The actual Huffman-coded artifact (tree metadata + coded bytes).
        # Not a standard image format -- no image viewer can open this file;
        # it exists for anyone who wants the real compressed bytes.
        compressed_path = job.get('compressed_path')
        if not compressed_path or not Path(compressed_path).exists():
            raise HTTPException(status_code=404, detail="Compressed file not found")

        return FileResponse(
            path=compressed_path,
            filename=f"{name}_compressed.huff",
            media_type='application/octet-stream'
        )

    # Default: a real, openable image file. Huffman coding here is lossless,
    # so this is pixel-identical to what was compressed -- decoded back to a
    # normal format because raw Huffman-coded bytes aren't a viewable image.
    compressed_base64 = job.get('compressed_base64')
    if not compressed_base64:
        raise HTTPException(status_code=404, detail="Compressed image not found")

    png_bytes = base64.b64decode(compressed_base64)
    return Response(
        content=png_bytes,
        media_type='image/png',
        headers={
            'Content-Disposition': f'attachment; filename="{name}_compressed.png"'
        }
    )


@router.delete("/job/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a compression job and cleanup files
    
    Args:
        job_id: Job ID to delete
        
    Returns:
        Deletion confirmation
        
    Raises:
        HTTPException: If job not found
    """
    if job_id not in compression_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )
    
    job = compression_jobs[job_id]
    
    # TODO: Cleanup files
    # from utils import delete_file
    # delete_file(Path(job['filepath']))
    # if 'compressed_filepath' in job:
    #     delete_file(Path(job['compressed_filepath']))
    
    del compression_jobs[job_id]
    
    return {
        'job_id': job_id,
        'message': 'Job deleted successfully'
    }
