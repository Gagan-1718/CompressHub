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
from ..utils import jobstore
from ..models import UploadResponse, ImageInfo
from pathlib import Path
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/compression", tags=["compression"])

# In-memory cache for the live request flow; completed jobs are also
# persisted to SQLite (utils.jobstore) so the Library survives restarts.
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


def _decode_container_file(path: str) -> Image.Image:
    """Decode a .huff container from disk back to a PIL image (lossless)."""
    meta, compressed_bytes = _parse_huffman_container(Path(path).read_bytes())
    array, _ms = HuffmanCompressionService().decompress(compressed_bytes, meta)
    return Image.fromarray(np.ascontiguousarray(array))


def _image_to_data_url(image: Image.Image, fmt: str = 'PNG') -> str:
    buffer = io.BytesIO()
    image.save(buffer, format=fmt)
    mime = 'image/png' if fmt == 'PNG' else 'image/jpeg'
    return f"data:{mime};base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"


def _make_thumbnail(image: Image.Image, max_px: int = 320) -> str:
    """Small JPEG data URL for Library cards (kept small for the DB)."""
    thumb = image.copy()
    thumb.thumbnail((max_px, max_px))
    buffer = io.BytesIO()
    thumb.convert('RGB').save(buffer, format='JPEG', quality=80)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"


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

        megapixels = (img_width * img_height) / 1_000_000

        # Round-trip decode to prove correctness only for reasonably small
        # images — decoding a huge image is memory-heavy and can OOM a small
        # server. Compression is lossless, so for large images the original is
        # (pixel-identical to) the decompressed result; we skip the full decode.
        if megapixels <= 2.5:
            decompressed_array, decompression_time_ms = huffman.decompress(compressed_bytes, service_meta)
            reconstruct_image(decompressed_array, metadata)  # verifies shape/round-trip
        else:
            decompression_time_ms = 0.0

        # Lean base64 previews: downscale for on-screen display so we never hold
        # full-resolution PNGs of multi-megapixel photos in memory. The
        # "compressed" preview is identical to the original (lossless).
        def _preview_b64(im, max_px=1400):
            p = im.copy()
            p.thumbnail((max_px, max_px))
            buf = io.BytesIO()
            p.save(buf, format='PNG')
            return base64.b64encode(buf.getvalue()).decode('utf-8')

        original_base64 = _preview_b64(rgb_image)
        compressed_base64 = original_base64

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
                'compressed_width': rgb_image.width,
                'compressed_height': rgb_image.height,
            },
            'timestamp': {
                'start': job.get('upload_time', time.time()),
                'end': time.time(),
                'duration_ms': round(compression_time_ms, 2),
            },
        }

        # Educational analysis for the results page (algorithm comparison,
        # entropy, Huffman code table). It re-encodes the pixels, so skip it for
        # large images to keep memory and time in check on small servers.
        if megapixels <= 6:
            try:
                metrics['analysis'] = analyze_compression(pixel_array, compressed_size)
            except Exception as analysis_error:
                logger.warning(f"Compression analysis failed for {job_id}: {analysis_error}")

        # Update job with results. `saved` stays False until the user opts to
        # save it to the Library (via POST /save/{job_id}); a thumbnail is
        # pre-built so that save is cheap.
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
            'saved': False,
            'thumbnail': _make_thumbnail(rgb_image),
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


@router.get("/jobs")
async def list_jobs(kind: str = None, limit: int = 200):
    """
    List saved Library items. Optional `kind` filter: 'compressed' or 'enhanced'.

    Served from the persistent store, so the Library survives backend restarts.
    """
    kind = kind if kind in ('compressed', 'enhanced') else None
    jobs = jobstore.list_completed(kind=kind, limit=min(max(limit, 1), 500))
    return {'jobs': jobs, 'count': len(jobs)}


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
    job = compression_jobs.get(job_id)

    if job is None:
        # Fall back to the persistent store (e.g. after a backend restart):
        # metrics come from the DB; images are regenerated from disk.
        db_job = jobstore.get_job(job_id)
        if db_job is None:
            raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

        response = {
            'job_id': job_id,
            'filename': db_job['filename'],
            'status': db_job['status'],
            'file_size': db_job.get('original_size'),
        }
        # A job found in the DB is, by definition, already in the library.
        response['saved'] = True
        if db_job['status'] == 'completed':
            response['metrics'] = db_job.get('metrics', {})
            filepath = db_job.get('filepath')
            if filepath and Path(filepath).exists():
                original = Image.open(filepath)
                original = ImageProcessingModule.convert_to_rgb(original)
                response['original_image'] = _image_to_data_url(original)
            compressed_path = db_job.get('compressed_path')
            if compressed_path and Path(compressed_path).exists():
                response['compressed_image'] = _image_to_data_url(
                    _decode_container_file(compressed_path)
                )
        return response

    response = {
        'job_id': job_id,
        'filename': job['filename'],
        'status': job['status'],
        'file_size': job['file_size'],
        'saved': job.get('saved', False),
    }

    # Include results if compression is completed
    if job['status'] == 'completed':
        response['metrics'] = job.get('metrics', {})
        response['original_image'] = f"data:image/png;base64,{job.get('original_base64', '')}"
        response['compressed_image'] = f"data:image/png;base64,{job.get('compressed_base64', '')}"
    elif job['status'] == 'failed':
        response['error'] = job.get('error', 'Unknown error')

    return response


@router.post("/save/{job_id}")
async def save_to_library(job_id: str):
    """Persist a completed (in-memory) compression job to the Library."""
    job = compression_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    if job.get('status') != 'completed':
        raise HTTPException(status_code=400, detail="Job is not completed")

    try:
        jobstore.save_compressed(
            job_id=job_id,
            filename=job['filename'],
            original_size=job['original_size'],
            compressed_size=job['compressed_size'],
            savings_percent=job['savings_percent'],
            filepath=job.get('filepath'),
            compressed_path=job['compressed_path'],
            metrics=job['metrics'],
            thumbnail=job.get('thumbnail', ''),
        )
        job['saved'] = True
    except Exception as e:
        logger.error(f"Failed to save job {job_id} to library: {e}")
        raise HTTPException(status_code=500, detail="Could not save to library")

    return {'job_id': job_id, 'saved': True, 'message': 'Saved to library'}


@router.post("/save-enhanced")
async def save_enhanced_image(payload: dict):
    """Persist an edited image from the Enhance studio to the Library.

    Body: { "filename": str, "image": "data:image/png;base64,..." }
    """
    filename = (payload.get('filename') or 'enhanced').strip()
    image = payload.get('image') or ''
    if not image.startswith('data:image'):
        raise HTTPException(status_code=400, detail="Missing or invalid image data")

    try:
        b64 = image.split(',', 1)[1]
        png_bytes = base64.b64decode(b64)
        pil = Image.open(io.BytesIO(png_bytes))
        pil.load()

        job_id = generate_job_id()
        out_dir = settings.compressed_dir
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{job_id}_enhanced.png"
        out_path.write_bytes(png_bytes)

        jobstore.save_enhanced(
            job_id=job_id,
            filename=filename if filename.lower().endswith('.png') else f"{filename}.png",
            file_size=len(png_bytes),
            image_path=str(out_path),
            thumbnail=_make_thumbnail(pil),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save enhanced image: {e}")
        raise HTTPException(status_code=500, detail="Could not save enhanced image")

    return {'job_id': job_id, 'saved': True, 'message': 'Saved to library'}


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
    job = compression_jobs.get(job_id) or jobstore.get_job(job_id)
    if job is None:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )

    if job['status'] != 'completed':
        raise HTTPException(
            status_code=400,
            detail=f"Job status is {job['status']}, cannot download"
        )

    original_filename = job['filename']
    name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
    compressed_path = job.get('compressed_path')

    # Enhanced Library items are stored as ready-to-serve PNG files.
    if job.get('kind') == 'enhanced':
        if compressed_path and Path(compressed_path).exists():
            return FileResponse(
                path=compressed_path,
                filename=f"{name}.png",
                media_type='image/png',
            )
        raise HTTPException(status_code=404, detail="Enhanced image not found")

    if raw:
        # The actual Huffman-coded artifact (tree metadata + coded bytes).
        # Not a standard image format -- no image viewer can open this file;
        # it exists for anyone who wants the real compressed bytes.
        if not compressed_path or not Path(compressed_path).exists():
            raise HTTPException(status_code=404, detail="Compressed file not found")

        return FileResponse(
            path=compressed_path,
            filename=f"{name}_compressed.huff",
            media_type='application/octet-stream'
        )

    # Default: a real, openable image, full resolution. Huffman coding here is
    # lossless, so the viewable "compressed" image is pixel-identical to the
    # original -- re-encode the original file as PNG (cheap, and avoids decoding
    # the whole .huff, which is memory-heavy for large images).
    filepath = job.get('filepath')
    if filepath and Path(filepath).exists():
        img = ImageProcessingModule.convert_to_rgb(Image.open(filepath))
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        png_bytes = buffer.getvalue()
    elif compressed_path and Path(compressed_path).exists():
        # Fallback (e.g. original file gone): decode the .huff from disk
        buffer = io.BytesIO()
        _decode_container_file(compressed_path).save(buffer, format='PNG')
        png_bytes = buffer.getvalue()
    else:
        raise HTTPException(status_code=404, detail="Compressed image not found")

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
    in_memory = compression_jobs.pop(job_id, None)
    db_job = jobstore.delete_job(job_id)

    if in_memory is None and db_job is None:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )

    # Clean up files on disk
    job = db_job or in_memory
    for key in ('filepath', 'compressed_path'):
        path = job.get(key)
        if path:
            try:
                Path(path).unlink(missing_ok=True)
            except OSError as e:
                logger.warning(f"Could not delete {path}: {e}")

    return {
        'job_id': job_id,
        'message': 'Job deleted successfully'
    }
