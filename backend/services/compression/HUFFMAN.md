"""
Huffman Compression Engine - Documentation

This document explains the Huffman compression algorithm implementation,
its components, and how to use it.
"""

# ============================================================================
# HUFFMAN COMPRESSION ALGORITHM
# ============================================================================
#
# Huffman coding is a lossless data compression algorithm that assigns
# variable-length codes to input bytes based on their frequencies.
# More frequent bytes get shorter codes, less frequent bytes get longer codes.
#
# Time Complexity: O(n log k) where n=data length, k=unique symbols
# Space Complexity: O(k) for the Huffman tree
#
# ============================================================================
# HOW IT WORKS
# ============================================================================
#
# 1. BUILD FREQUENCY TABLE
#    Count how many times each byte value (0-255) appears in the data
#    Example: "AAB" -> {65: 2, 66: 1}
#
# 2. BUILD HUFFMAN TREE
#    Create a binary tree where:
#    - Leaf nodes contain byte values and their frequencies
#    - Internal nodes contain sum of child frequencies
#    - Tree is built bottom-up using a min-heap
#    - Always combine the two nodes with smallest frequencies
#
# 3. GENERATE CODES
#    Traverse tree from root to each leaf:
#    - Left branch = append '0' to code
#    - Right branch = append '1' to code
#    - Each leaf gets a unique binary code
#
# 4. ENCODE DATA
#    Replace each byte with its Huffman code
#    Pack the resulting bit string into bytes
#    - More frequent bytes = shorter codes = better compression
#
# 5. DECODE DATA
#    Traverse tree using the bit stream:
#    - Read bit: 0 = go left, 1 = go right
#    - Reach leaf node = found original byte
#    - Reset to root and continue
#
# ============================================================================
# EXAMPLE
# ============================================================================
#
# Input: "aaab"
# Frequencies: {97: 3, 98: 1} (97='a', 98='b')
#
# Tree:           [4]
#                /   \
#              [3]   [1]
#              'a'   'b'
#
# Codes: {97: "0", 98: "1"}  (note: optimal is when 'a' gets shorter code)
#
# Compressed: "0" + "0" + "0" + "1" = "0001" (4 bits)
# Original:   "a" + "a" + "a" + "b" = 32 bits (4 bytes)
# Compression: 4/32 = 12.5% of original size
#
# ============================================================================
# MODULE STRUCTURE
# ============================================================================
#
# huffman.py:
#   - Node: Individual tree node (leaf or internal)
#   - HuffmanTree: Main tree data structure and operations
#   - Functions: build_frequency_table, build_huffman_tree, generate_codes,
#                encode_pixels, decode_pixels, serialize_tree, deserialize_tree
#   - CompressionStats: Track compression metrics
#
# demo.py:
#   - compress_data(): Full compression pipeline
#   - decompress_data(): Full decompression pipeline
#   - demo_compression(): Examples with different data types
#
# ============================================================================
# USAGE EXAMPLES
# ============================================================================
#
# Example 1: Quick Compression (Recommended)
# ====================================
#
# from services.compression.demo import compress_data, decompress_data
#
# # Compress
# original_data = b"Hello World! " * 100
# compressed, tree_meta, padding, stats = compress_data(original_data)
# print(f"Ratio: {stats.calculate_ratio():.2f}x")
# print(f"Saved: {stats.calculate_percentage():.1f}%")
#
# # Decompress
# decompressed = decompress_data(compressed, tree_meta, padding)
# assert original_data == decompressed
#
# ====================================
#
# Example 2: Step-by-Step (For Understanding)
# ====================================
#
# from services.compression.huffman import (
#     build_frequency_table,
#     build_huffman_tree,
#     encode_pixels,
#     decode_pixels,
#     serialize_tree,
# )
#
# data = b"HUFFMAN"
#
# # Step 1: Frequency table
# freq_table = build_frequency_table(data)
# # {72: 1, 85: 1, 70: 1, 77: 1, 65: 1, 78: 1}
#
# # Step 2: Build tree
# tree = build_huffman_tree(freq_table)
#
# # Step 3: Encode
# compressed, padding = encode_pixels(data, tree.codes)
#
# # Step 4: Decode
# decompressed = decode_pixels(compressed, tree, padding)
#
# ====================================
#
# Example 3: Using with Images
# ====================================
#
# import numpy as np
# from PIL import Image
# from services.compression.demo import compress_data, decompress_data
#
# # Load image
# image = Image.open("photo.jpg")
# image_array = np.array(image)
#
# # Convert to bytes and compress
# pixel_bytes = image_array.tobytes()
# compressed, tree_meta, padding, stats = compress_data(pixel_bytes)
#
# # Decompress
# decompressed_bytes = decompress_data(compressed, tree_meta, padding)
# decompressed_array = np.frombuffer(decompressed_bytes, dtype=np.uint8)
# decompressed_array = decompressed_array.reshape(image_array.shape)
#
# ====================================
#
# Example 4: Using HuffmanCompressionService
# ====================================
#
# import numpy as np
# from services import HuffmanCompressionService
#
# # Create service instance
# compressor = HuffmanCompressionService()
#
# # Prepare data
# pixel_data = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
#
# # Compress
# compressed, metadata = compressor.compress(pixel_data.flatten())
#
# # Decompress
# decompressed, time_ms = compressor.decompress(compressed, metadata)
#
# ============================================================================
# COMPRESSION CHARACTERISTICS
# ============================================================================
#
# Best Case (Maximum Compression):
#   - Skewed frequency distribution
#   - Few unique symbols
#   - Example: Image of mostly one color
#   - Ratio: Can achieve 2x-10x compression
#
# Average Case:
#   - Mixed frequency distribution
#   - 50-100 unique symbols
#   - Example: Text data, natural images
#   - Ratio: Typically 1.5x-3x compression
#
# Worst Case (No Compression):
#   - Uniform frequency distribution
#   - All 256 byte values equally likely
#   - Example: Encrypted data, random data
#   - Ratio: ~1.0x (no compression, slight expansion)
#
# ============================================================================
# OPTIMIZATION DETAILS
# ============================================================================
#
# 1. Min-Heap for Tree Building
#    - Uses heapq for O(log k) insertions
#    - Builds tree in O(n log k) time
#    - k = number of unique symbols
#
# 2. Bit Packing
#    - Converts bit string to bytes (8 bits per byte)
#    - Tracks padding bits for exact reconstruction
#    - Padding: 0-7 bits added to reach byte boundary
#
# 3. Tree Serialization
#    - Encodes frequency table and codes as JSON
#    - Allows decompression without rebuilding tree
#    - Metadata size: typically 0.1-1% of compressed size
#
# 4. Edge Cases Handled
#    - Single unique byte value
#    - Very small data (< 8 bits)
#    - Empty input (raises ValueError)
#
# ============================================================================
# COMPRESSION METADATA STRUCTURE
# ============================================================================
#
# When compressing, metadata includes:
#   - original_size: Length of input in bytes
#   - compressed_size: Length of compressed output
#   - tree_metadata: Serialized Huffman tree (JSON string)
#   - padding: Number of padding bits (0-7)
#   - original_dtype: NumPy data type (if array input)
#   - original_shape: NumPy array shape (if array input)
#   - unique_symbols: Number of different byte values
#   - compression_time_ms: Time taken to compress
#
# This metadata is REQUIRED for decompression.
#
# ============================================================================
# PERFORMANCE CHARACTERISTICS
# ============================================================================
#
# Time Complexity:
#   - Building frequency table: O(n)
#   - Building tree: O(k log k) where k = unique symbols
#   - Generating codes: O(k)
#   - Encoding: O(n)
#   - Decoding: O(n)
#   - TOTAL: O(n + k log k) ≈ O(n) for typical cases
#
# Space Complexity:
#   - Frequency table: O(k)
#   - Huffman tree: O(k)
#   - Codes dictionary: O(k)
#   - TOTAL: O(k) where k ≤ 256 for byte data
#
# Practical Performance (on 1MB of data):
#   - Compression: ~10-50ms
#   - Decompression: ~5-20ms
#   - Memory: ~1-10MB total including overhead
#
# ============================================================================
# LIMITATIONS AND CONSIDERATIONS
# ============================================================================
#
# 1. Overhead
#    - Tree metadata adds 0.1-1% overhead
#    - Not ideal for very small files (< 100 bytes)
#
# 2. Not Applicable To
#    - Encrypted data (high entropy)
#    - Already compressed data (JPEG, PNG, etc.)
#    - Uniformly distributed data
#
# 3. Better Performance With
#    - Text data (skewed letter frequencies)
#    - Medical/scientific images
#    - Repetitive patterns
#    - Binary data with common values
#
# ============================================================================
# TESTING AND VALIDATION
# ============================================================================
#
# Run the demo to see examples:
#   python -m services.compression.demo
#
# Or programmatically:
#   from services.compression.demo import demo_compression
#   demo_compression()
#
# Tests cover:
#   - Simple text compression
#   - Uniform random data
#   - Skewed frequency distribution
#   - Simulated image data
#   - Edge case: single unique value
#
# All decompression validated against original data.
#
# ============================================================================
