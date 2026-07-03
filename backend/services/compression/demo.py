"""
Huffman Compression Demo and Testing Module

This module demonstrates the Huffman compression engine with examples
and provides utilities for testing the implementation.
"""

from .huffman import (
    build_frequency_table,
    build_huffman_tree,
    encode_pixels,
    decode_pixels,
    serialize_tree,
    deserialize_tree,
    CompressionStats,
)
from typing import Tuple
import numpy as np


def compress_data(data: bytes) -> Tuple[bytes, str, int, CompressionStats]:
    """
    Complete compression pipeline.
    
    Args:
        data: Input byte data to compress
        
    Returns:
        Tuple of:
        - compressed_bytes: Compressed data
        - tree_metadata: Serialized Huffman tree
        - padding: Number of padding bits
        - stats: Compression statistics
    """
    # Build frequency table
    freq_table = build_frequency_table(data)
    
    # Build Huffman tree
    tree = build_huffman_tree(freq_table)
    
    # Encode data
    compressed_bytes, padding = encode_pixels(data, tree.codes)
    
    # Serialize tree for decompression
    tree_metadata = serialize_tree(tree)
    
    # Calculate statistics
    stats = CompressionStats()
    stats.original_size = len(data)
    stats.compressed_size = len(compressed_bytes)
    stats.tree_metadata_size = len(tree_metadata.encode('utf-8'))
    stats.unique_symbols = len(freq_table)
    
    return compressed_bytes, tree_metadata, padding, stats


def decompress_data(
    compressed_bytes: bytes,
    tree_metadata: str,
    padding: int,
    original_size: int = None
) -> bytes:
    """
    Complete decompression pipeline.
    
    Args:
        compressed_bytes: Compressed byte data
        tree_metadata: Serialized Huffman tree
        padding: Number of padding bits that were added
        original_size: Optional original data size for validation
        
    Returns:
        Decompressed original data
    """
    # Deserialize tree
    tree = deserialize_tree(tree_metadata)
    
    # Decode data
    decompressed = decode_pixels(compressed_bytes, tree, padding)
    
    return decompressed


def demo_compression():
    """Demonstrate Huffman compression with example data"""
    print("=" * 70)
    print("HUFFMAN COMPRESSION ENGINE - DEMONSTRATION")
    print("=" * 70)
    
    # Example 1: Simple text data
    print("\n[Example 1] Compressing simple text")
    print("-" * 70)
    text = "HUFFMAN HUFFMAN HUFFMAN CODE CODE CODE"
    data = text.encode('utf-8')
    
    print(f"Original data: {text}")
    print(f"Original size: {len(data)} bytes")
    
    compressed, tree_meta, padding, stats = compress_data(data)
    print(f"Compressed size: {len(compressed)} bytes")
    print(f"Tree metadata size: {stats.tree_metadata_size} bytes")
    print(f"Compression ratio: {stats.calculate_ratio():.2f}x")
    print(f"Space saved: {stats.calculate_percentage():.1f}%")
    print(f"Unique symbols: {stats.unique_symbols}")
    
    # Verify decompression
    decompressed = decompress_data(compressed, tree_meta, padding)
    print(f"Decompressed: {decompressed.decode('utf-8')}")
    print(f"✓ Decompression successful: {data == decompressed}")
    
    # Example 2: Random uniform data (worst case)
    print("\n[Example 2] Uniform random data (worst case)")
    print("-" * 70)
    uniform_data = bytes(range(256)) * 10  # All byte values equally frequent
    compressed, tree_meta, padding, stats = compress_data(uniform_data)
    
    print(f"Original size: {len(uniform_data)} bytes")
    print(f"Compressed size: {len(compressed)} bytes")
    print(f"Tree metadata size: {stats.tree_metadata_size} bytes")
    print(f"Compression ratio: {stats.calculate_ratio():.2f}x")
    print(f"Space saved: {stats.calculate_percentage():.1f}%")
    print(f"Unique symbols: {stats.unique_symbols}")
    
    decompressed = decompress_data(compressed, tree_meta, padding)
    print(f"✓ Decompression successful: {uniform_data == decompressed}")
    
    # Example 3: Skewed data (best case)
    print("\n[Example 3] Skewed frequency distribution (best case)")
    print("-" * 70)
    # Create data where one value appears much more frequently
    skewed_data = bytes([65] * 850 + [66] * 100 + [67] * 50)
    compressed, tree_meta, padding, stats = compress_data(skewed_data)
    
    print(f"Original size: {len(skewed_data)} bytes")
    print(f"Compressed size: {len(compressed)} bytes")
    print(f"Tree metadata size: {stats.tree_metadata_size} bytes")
    print(f"Compression ratio: {stats.calculate_ratio():.2f}x")
    print(f"Space saved: {stats.calculate_percentage():.1f}%")
    print(f"Unique symbols: {stats.unique_symbols}")
    
    decompressed = decompress_data(compressed, tree_meta, padding)
    print(f"✓ Decompression successful: {skewed_data == decompressed}")
    
    # Example 4: Simulated image pixel data
    print("\n[Example 4] Simulated 8x8 image pixel data")
    print("-" * 70)
    # Create a simple pattern
    pattern = np.array([
        [255, 255, 255, 255, 0, 0, 0, 0],
        [255, 255, 255, 255, 0, 0, 0, 0],
        [255, 255, 255, 255, 0, 0, 0, 0],
        [255, 255, 255, 255, 0, 0, 0, 0],
        [0, 0, 0, 0, 255, 255, 255, 255],
        [0, 0, 0, 0, 255, 255, 255, 255],
        [0, 0, 0, 0, 255, 255, 255, 255],
        [0, 0, 0, 0, 255, 255, 255, 255],
    ], dtype=np.uint8)
    image_data = pattern.flatten().astype(np.uint8).tobytes()
    
    compressed, tree_meta, padding, stats = compress_data(image_data)
    
    print(f"Image size: 8x8 pixels")
    print(f"Original size: {len(image_data)} bytes")
    print(f"Compressed size: {len(compressed)} bytes")
    print(f"Tree metadata size: {stats.tree_metadata_size} bytes")
    print(f"Compression ratio: {stats.calculate_ratio():.2f}x")
    print(f"Space saved: {stats.calculate_percentage():.1f}%")
    print(f"Unique symbols: {stats.unique_symbols}")
    
    decompressed = decompress_data(compressed, tree_meta, padding)
    print(f"✓ Decompression successful: {image_data == decompressed}")
    
    # Example 5: Edge case - Single unique value
    print("\n[Example 5] Edge case - Single unique byte value")
    print("-" * 70)
    single_value_data = bytes([42] * 100)
    compressed, tree_meta, padding, stats = compress_data(single_value_data)
    
    print(f"Original size: {len(single_value_data)} bytes")
    print(f"Compressed size: {len(compressed)} bytes")
    print(f"Tree metadata size: {stats.tree_metadata_size} bytes")
    print(f"Compression ratio: {stats.calculate_ratio():.2f}x")
    print(f"Space saved: {stats.calculate_percentage():.1f}%")
    print(f"Unique symbols: {stats.unique_symbols}")
    
    decompressed = decompress_data(compressed, tree_meta, padding)
    print(f"✓ Decompression successful: {single_value_data == decompressed}")
    
    print("\n" + "=" * 70)
    print("DEMONSTRATION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    demo_compression()
