"""
Compression service - Huffman encoding implementation

Wraps the Huffman compression engine with numpy integration.
"""
import time
from typing import Tuple
import numpy as np
from .compression.huffman import (
    build_frequency_table as _build_freq,
    build_huffman_tree,
    encode_pixels,
    decode_pixels,
    serialize_tree,
    deserialize_tree,
)


class HuffmanCompressionService:
    """Service for Huffman encoding and decoding of image data"""
    
    def __init__(self):
        """Initialize compression service"""
        self.compression_tree = None
        self.frequency_table = None
    
    def compress(self, pixel_data: np.ndarray) -> Tuple[bytes, dict]:
        """
        Compress pixel data using Huffman encoding
        
        Args:
            pixel_data: Flattened pixel data array (numpy array)
            
        Returns:
            Tuple of (compressed_bytes, metadata)
            
        Raises:
            ValueError: If pixel_data is empty
        """
        start_time = time.time()
        
        # Convert numpy array to bytes
        if isinstance(pixel_data, np.ndarray):
            pixel_bytes = pixel_data.astype(np.uint8).tobytes()
            original_dtype = str(pixel_data.dtype)
            original_shape = pixel_data.shape
        else:
            pixel_bytes = pixel_data
            original_dtype = 'uint8'
            original_shape = (len(pixel_data),)
        
        # Build frequency table
        self.frequency_table = _build_freq(pixel_bytes)
        
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
        }
        
        return compressed_bytes, metadata
    
    def decompress(self, compressed_bytes: bytes, metadata: dict) -> Tuple[np.ndarray, float]:
        """
        Decompress Huffman-encoded data
        
        Args:
            compressed_bytes: Compressed data bytes
            metadata: Compression metadata including tree and shape info
            
        Returns:
            Tuple of (decompressed_array, decompression_time_ms)
            
        Raises:
            ValueError: If metadata is invalid or tree cannot be deserialized
        """
        start_time = time.time()
        
        # Deserialize tree
        tree = deserialize_tree(metadata['tree_metadata'])
        
        # Decode data
        pixel_bytes = decode_pixels(compressed_bytes, tree, metadata['padding'])
        
        # Convert back to numpy array
        original_dtype = np.dtype(metadata.get('original_dtype', np.uint8))
        original_shape = tuple(metadata.get('original_shape', (len(pixel_bytes),)))
        
        pixel_data = np.frombuffer(pixel_bytes, dtype=np.uint8).reshape(original_shape)
        
        decompression_time = (time.time() - start_time) * 1000  # Convert to ms
        
        return pixel_data, decompression_time
    
    def build_frequency_table(self, data: np.ndarray) -> dict:
        """
        Build frequency table for data
        
        Args:
            data: Input data array
            
        Returns:
            Dictionary of frequencies
        """
        if isinstance(data, np.ndarray):
            data_bytes = data.astype(np.uint8).tobytes()
        else:
            data_bytes = data
        
        self.frequency_table = _build_freq(data_bytes)
        return self.frequency_table
    
    def build_huffman_tree(self, frequency_table: dict) -> object:
        """
        Build Huffman tree from frequency table
        
        Args:
            frequency_table: Dictionary of frequencies
            
        Returns:
            Huffman tree object
        """
        self.compression_tree = build_huffman_tree(frequency_table)
        return self.compression_tree
    
    def generate_codes(self, huffman_tree: object = None) -> dict:
        """
        Generate Huffman codes from tree
        
        Args:
            huffman_tree: Huffman tree object (uses self.compression_tree if not provided)
            
        Returns:
            Dictionary mapping values to bit codes
        """
        if huffman_tree is None:
            huffman_tree = self.compression_tree
        
        if huffman_tree is None:
            raise ValueError("No Huffman tree available")
        
        return huffman_tree.codes.copy()
