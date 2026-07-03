"""
Compression analysis: algorithm comparison, entropy, and code statistics.

Everything here is computed on the side for educational display -- it never
affects the actual compressed artifact. Three views are produced:

1. Algorithm comparison: the same pixel data compressed three ways
   (plain Huffman, delta + Huffman, DEFLATE/zlib as a real-world reference)
   so the effect of the prediction filter is visible.
2. Entropy analysis: Shannon entropy of the byte distribution before and
   after delta filtering, next to the bits/byte the encoder actually
   achieved. Huffman coding can never beat the entropy floor, so
   "achieved vs floor" shows how close to optimal the encoder is.
3. Code table: the most frequent delta values with their assigned Huffman
   codes, demonstrating that frequent symbols receive shorter codes.
"""
import zlib
from typing import Dict, Any

import numpy as np

from .huffman import (
    build_frequency_table,
    build_huffman_tree,
    encode_pixels,
    serialize_tree,
)
from . import delta_filter


def shannon_entropy(data: bytes) -> float:
    """Shannon entropy of a byte stream in bits per byte (0-8)."""
    counts = np.bincount(np.frombuffer(data, dtype=np.uint8), minlength=256)
    probs = counts[counts > 0] / len(data)
    return float(-(probs * np.log2(probs)).sum())


def _huffman_compressed_size(data: bytes) -> int:
    """Full artifact size for Huffman-coding `data`: coded bytes + tree."""
    tree = build_huffman_tree(build_frequency_table(data))
    encoded, _padding = encode_pixels(data, tree.codes)
    return len(encoded) + len(serialize_tree(tree).encode('utf-8'))


def analyze_compression(pixel_array: np.ndarray, actual_compressed_size: int) -> Dict[str, Any]:
    """
    Build the analysis payload for the results page.

    Args:
        pixel_array: original (unfiltered) uint8 pixel array
        actual_compressed_size: size in bytes of the real .huff container
            produced by the live pipeline (delta + Huffman + tree metadata)

    Returns:
        Dict with 'algorithms', 'entropy', and 'code_table' sections.
    """
    raw_bytes = pixel_array.astype(np.uint8).ravel().tobytes()
    lag = pixel_array.shape[-1] if pixel_array.ndim >= 3 else 1
    filtered = delta_filter(pixel_array, lag=lag)
    filtered_bytes = filtered.tobytes()
    original_size = len(raw_bytes)

    # --- 1. Algorithm comparison -----------------------------------------
    plain_size = _huffman_compressed_size(raw_bytes)
    deflate_size = len(zlib.compress(raw_bytes, 6))

    def pct(compressed: int) -> float:
        return round((1 - compressed / original_size) * 100, 2)

    algorithms = [
        {
            'name': 'Plain Huffman',
            'description': 'Huffman coding directly on raw pixel bytes',
            'compressed_bytes': plain_size,
            'savings_percent': pct(plain_size),
        },
        {
            'name': 'Delta + Huffman',
            'description': 'This app: prediction filter, then Huffman coding',
            'compressed_bytes': actual_compressed_size,
            'savings_percent': pct(actual_compressed_size),
            'is_current': True,
        },
        {
            'name': 'DEFLATE (zlib)',
            'description': 'Industry standard (PNG/ZIP) for reference',
            'compressed_bytes': deflate_size,
            'savings_percent': pct(deflate_size),
        },
    ]

    # --- 2. Entropy analysis ---------------------------------------------
    raw_entropy = shannon_entropy(raw_bytes)
    filtered_entropy = shannon_entropy(filtered_bytes)

    # Bits per byte the encoder actually achieved (coded bits only; the
    # entropy floor doesn't account for the tree, so neither does this).
    tree = build_huffman_tree(build_frequency_table(filtered_bytes))
    code_lengths = {value: len(code) for value, code in tree.codes.items()}
    freq = tree.frequency_table
    total_bits = sum(freq[v] * code_lengths[v] for v in freq)
    achieved_bits_per_byte = total_bits / original_size

    # Huffman assigns whole-bit codes, so it can never emit fewer than
    # 1 bit per symbol even when the entropy floor is below that (e.g. a
    # smooth gradient where nearly every delta is identical). Judge the
    # encoder against the floor it could actually reach.
    huffman_floor = max(filtered_entropy, 1.0)
    efficiency = (huffman_floor / achieved_bits_per_byte * 100) if achieved_bits_per_byte > 0 else 0.0

    entropy = {
        'raw_bits_per_byte': round(raw_entropy, 3),
        'filtered_bits_per_byte': round(filtered_entropy, 3),
        'achieved_bits_per_byte': round(achieved_bits_per_byte, 3),
        'coding_efficiency_percent': round(min(100.0, efficiency), 2),
        'one_bit_floor_applies': filtered_entropy < 1.0,
    }

    # --- 3. Code table -----------------------------------------------------
    top = sorted(freq.items(), key=lambda kv: kv[1], reverse=True)[:10]
    code_table = [
        {
            # Byte values are pixel deltas; show them signed so 255 reads as -1
            'delta': value - 256 if value >= 128 else value,
            'frequency': count,
            'frequency_percent': round(count / original_size * 100, 2),
            'code': tree.codes[value],
            'code_bits': len(tree.codes[value]),
        }
        for value, count in top
    ]

    return {
        'algorithms': algorithms,
        'entropy': entropy,
        'code_table': code_table,
    }
