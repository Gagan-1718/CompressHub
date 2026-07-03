"""Initialize compression package"""
import time
from typing import Tuple
import numpy as np
from .huffman import (
    Node,
    HuffmanTree,
    CompressionStats,
    build_frequency_table,
    build_huffman_tree,
    generate_codes,
    encode_pixels,
    decode_pixels,
    serialize_tree,
    deserialize_tree,
)


def delta_filter(data: np.ndarray, lag: int = 1) -> np.ndarray:
    """
    Delta (prediction) filter: replace each byte with its difference from
    the same color channel of the previous pixel, mod 256.

    This performs NO compression itself -- output is the same size as the
    input. Its purpose is to skew the byte distribution: neighboring pixels
    in real images are usually close in value, so the differences cluster
    tightly around 0. Huffman coding then assigns short codes to those
    frequent small values, which is where all the actual compression happens.
    (This is PNG's "Sub" filter, applied before its entropy coding.)

    Args:
        data: uint8 pixel data (any shape)
        lag: bytes per pixel (3 for RGB, 1 for grayscale), so each byte is
             compared against the same channel of the neighboring pixel
             rather than a different channel of the same pixel
    """
    flat = data.astype(np.uint8).ravel()
    # Group the interleaved stream into (pixel, channel) rows; a virtual
    # zero row before the first pixel makes the transform exactly
    # invertible by cumulative sum.
    pixels = flat.reshape(-1, lag)
    deltas = np.diff(pixels, axis=0, prepend=np.zeros((1, lag), dtype=np.uint8))
    return deltas.astype(np.uint8).ravel()


def delta_unfilter(deltas: np.ndarray, lag: int = 1) -> np.ndarray:
    """Inverse of delta_filter: per-channel cumulative sum mod 256."""
    pixels = deltas.astype(np.uint64).reshape(-1, lag)
    return np.cumsum(pixels, axis=0).astype(np.uint8).ravel()


class HuffmanCompressionService:
    """Service for Huffman encoding and decoding of image data"""

    def __init__(self):
        """Initialize compression service"""
        self.compression_tree = None
        self.frequency_table = None

    def compress(self, pixel_data: np.ndarray) -> Tuple[bytes, dict]:
        """
        Compress pixel data using delta prediction + Huffman encoding

        Args:
            pixel_data: Flattened pixel data array (numpy array)

        Returns:
            Tuple of (compressed_bytes, metadata)
        """
        start_time = time.time()

        # Convert numpy array to delta-filtered bytes. For (H, W, channels)
        # arrays, delta against the same channel of the neighboring pixel.
        if isinstance(pixel_data, np.ndarray):
            original_dtype = str(pixel_data.dtype)
            original_shape = pixel_data.shape
            lag = pixel_data.shape[-1] if pixel_data.ndim >= 3 else 1
            pixel_bytes = delta_filter(pixel_data, lag=lag).tobytes()
        else:
            original_dtype = 'uint8'
            original_shape = (len(pixel_data),)
            lag = 1
            pixel_bytes = delta_filter(np.frombuffer(pixel_data, dtype=np.uint8), lag=lag).tobytes()

        # Build frequency table
        self.frequency_table = build_frequency_table(pixel_bytes)
        
        # Build Huffman tree
        self.compression_tree = build_huffman_tree(self.frequency_table)
        
        # Encode data
        compressed_bytes, padding = encode_pixels(pixel_bytes, self.compression_tree.codes)
        
        # Serialize tree metadata
        tree_metadata = serialize_tree(self.compression_tree)
        
        compression_time = (time.time() - start_time) * 1000  # Convert to ms
        
        metadata = {
            'original_size': len(pixel_bytes),
            'compressed_size': len(compressed_bytes),
            'compression_time_ms': compression_time,
            'tree_metadata': tree_metadata,
            'padding': padding,
            'original_dtype': original_dtype,
            'original_shape': original_shape,
            'unique_symbols': len(self.frequency_table),
            'delta_filtered': True,
            'delta_lag': lag,
        }
        
        return compressed_bytes, metadata
    
    def decompress(self, compressed_bytes: bytes, metadata: dict) -> Tuple[np.ndarray, float]:
        """
        Decompress Huffman encoded data
        
        Args:
            compressed_bytes: Compressed data bytes
            metadata: Compression metadata
            
        Returns:
            Tuple of (decompressed_array, decompression_time_ms)
        """
        start_time = time.time()
        
        # Deserialize tree
        tree_metadata = metadata.get('tree_metadata')
        compression_tree = deserialize_tree(tree_metadata)
        
        # Decode pixels
        original_size = metadata['original_size']
        padding = metadata['padding']
        decompressed_bytes = decode_pixels(compressed_bytes, compression_tree, padding)
        
        # Convert back to numpy array with original dtype and shape
        dtype = np.dtype(metadata.get('original_dtype', 'uint8'))
        shape = metadata.get('original_shape', (len(decompressed_bytes),))
        decoded = np.frombuffer(decompressed_bytes[:original_size], dtype=np.uint8)
        if metadata.get('delta_filtered'):
            decoded = delta_unfilter(decoded, lag=metadata.get('delta_lag', 1))
        decompressed_array = decoded.astype(dtype).reshape(shape)
        
        decompression_time = (time.time() - start_time) * 1000  # Convert to ms
        
        return decompressed_array, decompression_time


__all__ = [
    "Node",
    "HuffmanTree",
    "CompressionStats",
    "build_frequency_table",
    "build_huffman_tree",
    "generate_codes",
    "encode_pixels",
    "decode_pixels",
    "serialize_tree",
    "deserialize_tree",
    "delta_filter",
    "delta_unfilter",
    "HuffmanCompressionService",
]
