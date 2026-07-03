"""
Huffman Compression Engine

This module implements the Huffman coding algorithm for lossless data compression.
It provides efficient encoding and decoding of pixel data using a binary tree structure
and variable-length bit codes.

Classes:
    Node: Tree node for Huffman tree
    HuffmanTree: Huffman tree data structure and operations

Functions:
    build_frequency_table: Count frequencies of each byte value
    build_huffman_tree: Construct Huffman tree from frequencies
    generate_codes: Generate Huffman codes from tree
    encode_pixels: Compress pixel data using Huffman codes
    decode_pixels: Decompress bitstream back to pixel data
    serialize_tree: Convert tree to JSON for storage
    deserialize_tree: Reconstruct tree from JSON
"""

import heapq
import json
from typing import Dict, Tuple, Optional, Any, List
from collections import Counter
import struct

import numpy as np


class Node:
    """
    Node in the Huffman tree.
    
    Attributes:
        value (int): Byte value (0-255) or None for internal nodes
        freq (int): Frequency of the value
        left (Node): Left child node
        right (Node): Right child node
    """
    
    def __init__(self, value: Optional[int] = None, freq: int = 0, 
                 left: Optional['Node'] = None, right: Optional['Node'] = None):
        """
        Initialize a tree node.
        
        Args:
            value: Byte value (0-255) for leaf nodes, None for internal nodes
            freq: Frequency of the value
            left: Left child node
            right: Right child node
        """
        self.value = value
        self.freq = freq
        self.left = left
        self.right = right
    
    def __lt__(self, other: 'Node') -> bool:
        """
        Compare nodes by frequency for priority queue ordering.
        
        Args:
            other: Other node to compare with
            
        Returns:
            bool: True if this node's frequency is less than other's
        """
        return self.freq < other.freq
    
    def __repr__(self) -> str:
        """String representation of node"""
        if self.value is not None:
            return f"Node(value={self.value}, freq={self.freq})"
        return f"Node(internal, freq={self.freq})"


class HuffmanTree:
    """
    Huffman encoding tree.
    
    Manages tree construction, code generation, and code lookups.
    
    Attributes:
        root (Node): Root node of the Huffman tree
        codes (Dict): Mapping from byte value to Huffman code (bit string)
        reverse_codes (Dict): Mapping from Huffman code to byte value
        frequency_table (Dict): Original frequency table used to build tree
    """
    
    def __init__(self):
        """Initialize empty Huffman tree."""
        self.root: Optional[Node] = None
        self.codes: Dict[int, str] = {}
        self.reverse_codes: Dict[str, int] = {}
        self.frequency_table: Dict[int, int] = {}
    
    def build(self, frequency_table: Dict[int, int]) -> None:
        """
        Build Huffman tree from frequency table.
        
        Uses a min-heap (priority queue) to efficiently construct the tree
        by always combining the two smallest-frequency nodes.
        
        Args:
            frequency_table: Dict mapping byte values to frequencies
            
        Raises:
            ValueError: If frequency_table is empty
        """
        if not frequency_table:
            raise ValueError("Frequency table cannot be empty")
        
        self.frequency_table = frequency_table.copy()
        
        # Edge case: single unique value
        if len(frequency_table) == 1:
            value = list(frequency_table.keys())[0]
            self.root = Node(value=value, freq=frequency_table[value])
            self.codes[value] = "0"  # Assign arbitrary code for single value
            self.reverse_codes["0"] = value
            return
        
        # Create leaf nodes for each byte value
        heap: List[Node] = []
        for value, freq in frequency_table.items():
            node = Node(value=value, freq=freq)
            heapq.heappush(heap, node)
        
        # Build tree by combining nodes bottom-up
        while len(heap) > 1:
            # Extract two nodes with minimum frequency
            left = heapq.heappop(heap)
            right = heapq.heappop(heap)
            
            # Create parent node with combined frequency
            parent = Node(freq=left.freq + right.freq, left=left, right=right)
            heapq.heappush(heap, parent)
        
        # Root is the last remaining node
        self.root = heap[0]
        
        # Generate codes from tree
        self._generate_codes()
    
    def _generate_codes(self) -> None:
        """
        Generate Huffman codes by traversing the tree.
        
        Uses depth-first traversal to assign binary codes:
        - Left branch appends '0'
        - Right branch appends '1'
        """
        self.codes.clear()
        self.reverse_codes.clear()
        
        def traverse(node: Node, code: str = "") -> None:
            """Recursively traverse tree and build codes"""
            if node is None:
                return
            
            # Leaf node - store the code
            if node.value is not None:
                self.codes[node.value] = code if code else "0"
                self.reverse_codes[code if code else "0"] = node.value
            else:
                # Internal node - traverse children
                traverse(node.left, code + "0")
                traverse(node.right, code + "1")
        
        traverse(self.root)
    
    def get_code(self, value: int) -> str:
        """
        Get Huffman code for a byte value.
        
        Args:
            value: Byte value (0-255)
            
        Returns:
            str: Binary code string (e.g., "101")
            
        Raises:
            KeyError: If value not in tree
        """
        if value not in self.codes:
            raise KeyError(f"Value {value} not found in Huffman tree")
        return self.codes[value]
    
    def get_value(self, code: str) -> int:
        """
        Get byte value for a Huffman code.
        
        Args:
            code: Binary code string (e.g., "101")
            
        Returns:
            int: Byte value (0-255)
            
        Raises:
            KeyError: If code not in tree
        """
        if code not in self.reverse_codes:
            raise KeyError(f"Code '{code}' not found in Huffman tree")
        return self.reverse_codes[code]


def build_frequency_table(data: bytes) -> Dict[int, int]:
    """
    Build frequency table from byte data.
    
    Counts occurrences of each byte value in the data.
    
    Args:
        data: Input byte data
        
    Returns:
        Dict mapping byte values (0-255) to their frequencies
        
    Raises:
        ValueError: If data is empty
    """
    if not data:
        raise ValueError("Data cannot be empty")
    
    return dict(Counter(data))


def build_huffman_tree(frequency_table: Dict[int, int]) -> HuffmanTree:
    """
    Construct a Huffman tree from frequency table.
    
    Args:
        frequency_table: Dict mapping byte values to frequencies
        
    Returns:
        HuffmanTree object with built tree and generated codes
        
    Raises:
        ValueError: If frequency_table is empty
    """
    tree = HuffmanTree()
    tree.build(frequency_table)
    return tree


def generate_codes(tree: HuffmanTree) -> Dict[int, str]:
    """
    Get the Huffman codes from a tree.
    
    Args:
        tree: HuffmanTree object with built tree
        
    Returns:
        Dict mapping byte values to Huffman code strings
    """
    return tree.codes.copy()


def encode_pixels(data: bytes, codes: Dict[int, str]) -> Tuple[bytes, int]:
    """
    Encode pixel data using Huffman codes.
    
    Converts byte stream to variable-length bit codes and packs into bytes.
    Padding information is required for decompression.
    
    Args:
        data: Input pixel data as bytes
        codes: Dict mapping byte values to Huffman code strings
        
    Returns:
        Tuple of (compressed_bytes, padding_bits)
        - compressed_bytes: Packed binary data
        - padding_bits: Number of padding bits added (0-7)
        
    Raises:
        ValueError: If data is empty
        KeyError: If byte value not found in codes
    """
    if not data:
        raise ValueError("Data cannot be empty")

    # Build the full bit string (as '0'/'1' characters) in one vectorized pass.
    # str.join is a single C-level pass, unlike repeated += which is much
    # slower for large images (millions of pixel bytes).
    try:
        bit_string = "".join(codes[byte_val] for byte_val in data)
    except KeyError as e:
        raise KeyError(f"Byte value {e.args[0]} not found in codes")

    padding = (8 - (len(bit_string) % 8)) % 8
    if padding:
        bit_string += "0" * padding

    # Pack bits into bytes using numpy instead of a Python loop over every
    # byte boundary -- this is the dominant cost for large images.
    bit_array = np.frombuffer(bit_string.encode("ascii"), dtype=np.uint8) - ord("0")
    compressed_bytes = np.packbits(bit_array).tobytes()

    return compressed_bytes, padding


def decode_pixels(encoded_data: bytes, tree: HuffmanTree, padding: int) -> bytes:
    """
    Decode Huffman-compressed data back to original pixel values.
    
    Converts packed bytes back to bit string and traverses Huffman tree
    to reconstruct original data.
    
    Args:
        encoded_data: Compressed byte data
        tree: HuffmanTree object used for encoding
        padding: Number of padding bits that were added during encoding
        
    Returns:
        Original decompressed pixel data as bytes
        
    Raises:
        ValueError: If tree is not built
        ValueError: If bit sequence doesn't decode properly
    """
    if tree.root is None:
        raise ValueError("Huffman tree not built")

    if not encoded_data:
        raise ValueError("Encoded data cannot be empty")

    root = tree.root

    # Convert bytes to a bit sequence in one vectorized pass (np.unpackbits)
    # instead of formatting + concatenating a Python string bit-by-bit --
    # that per-byte string building is the dominant cost for large images.
    bits = np.unpackbits(np.frombuffer(encoded_data, dtype=np.uint8))
    if padding > 0:
        bits = bits[:-padding]

    # Single unique value case: root itself is a leaf, one decoded byte per bit
    if root.value is not None:
        return bytes([root.value]) * len(bits)

    # Tree traversal is inherently sequential (variable-length prefix codes),
    # but converting to a plain Python list up front avoids per-element numpy
    # scalar overhead in the hot loop below.
    decoded_data = bytearray()
    append = decoded_data.append
    node = root
    for bit in bits.tolist():
        node = node.left if bit == 0 else node.right
        if node is None:
            raise ValueError("Invalid bit sequence - tree traversal failed")
        if node.value is not None:
            append(node.value)
            node = root

    return bytes(decoded_data)


def serialize_tree(tree: HuffmanTree) -> str:
    """
    Serialize Huffman tree to JSON string for storage.
    
    Includes frequency table and codes for efficient reconstruction
    without rebuilding the tree.
    
    Args:
        tree: HuffmanTree object to serialize
        
    Returns:
        JSON string containing serialized tree data
    """
    serialized = {
        'frequency_table': tree.frequency_table,
        'codes': tree.codes,
        'reverse_codes': tree.reverse_codes,
    }
    return json.dumps(serialized)


def deserialize_tree(serialized_data: str) -> HuffmanTree:
    """
    Reconstruct Huffman tree from serialized JSON.
    
    Rebuilds tree from stored frequency table for decompression.
    
    Args:
        serialized_data: JSON string containing tree data
        
    Returns:
        HuffmanTree object restored from serialized data
    """
    data = json.loads(serialized_data)
    tree = HuffmanTree()
    tree.frequency_table = {int(k): v for k, v in data['frequency_table'].items()}
    tree.codes = {int(k): v for k, v in data['codes'].items()}
    tree.reverse_codes = data['reverse_codes']
    
    # Rebuild tree from frequency table
    tree.build(tree.frequency_table)
    
    return tree


# Compression statistics
class CompressionStats:
    """Track compression statistics"""
    
    def __init__(self):
        """Initialize statistics"""
        self.original_size = 0
        self.compressed_size = 0
        self.tree_metadata_size = 0
        self.unique_symbols = 0
    
    def calculate_ratio(self) -> float:
        """Calculate compression ratio (original / compressed)"""
        if self.compressed_size == 0:
            return 0.0
        return self.original_size / self.compressed_size
    
    def calculate_percentage(self) -> float:
        """Calculate compression percentage saved"""
        if self.original_size == 0:
            return 0.0
        return 100.0 * (1.0 - self.compressed_size / self.original_size)
    
    def __repr__(self) -> str:
        ratio = self.calculate_ratio()
        percentage = self.calculate_percentage()
        return (
            f"CompressionStats(original={self.original_size}, "
            f"compressed={self.compressed_size}, "
            f"ratio={ratio:.2f}, saved={percentage:.1f}%)"
        )
