"""
Round-trip and edge-case tests for the Huffman compression pipeline.

Every test asserts the core guarantee: decompress(compress(x)) == x exactly.
Run from the repo root:  python -m pytest backend/tests -v
"""
import numpy as np
import pytest

from backend.services.compression import (
    HuffmanCompressionService,
    build_frequency_table,
    build_huffman_tree,
    encode_pixels,
    decode_pixels,
    serialize_tree,
    deserialize_tree,
    delta_filter,
    delta_unfilter,
)


rng = np.random.default_rng(42)


def roundtrip(array: np.ndarray) -> np.ndarray:
    service = HuffmanCompressionService()
    compressed, metadata = service.compress(array)
    decompressed, _ms = service.decompress(compressed, metadata)
    return decompressed


class TestRoundTrip:
    def test_rgb_image(self):
        img = rng.integers(0, 256, size=(64, 48, 3)).astype(np.uint8)
        assert (roundtrip(img) == img).all()

    def test_grayscale_image(self):
        img = rng.integers(0, 256, size=(64, 48)).astype(np.uint8)
        assert (roundtrip(img) == img).all()

    def test_rgba_image(self):
        img = rng.integers(0, 256, size=(32, 32, 4)).astype(np.uint8)
        assert (roundtrip(img) == img).all()

    def test_smooth_gradient_compresses_well(self):
        row = np.arange(256, dtype=np.uint8)
        img = np.tile(row, (100, 3, 1)).transpose(0, 2, 1)  # (100, 256, 3)
        service = HuffmanCompressionService()
        compressed, meta = service.compress(img)
        decompressed, _ = service.decompress(compressed, meta)
        assert (decompressed == img).all()
        # A perfectly smooth gradient should compress dramatically
        assert meta['compressed_size'] < img.nbytes / 4

    def test_random_noise_still_lossless(self):
        img = rng.integers(0, 256, size=(100, 100, 3)).astype(np.uint8)
        assert (roundtrip(img) == img).all()


class TestEdgeCases:
    def test_single_pixel(self):
        img = np.array([[[7, 200, 33]]], dtype=np.uint8)
        assert (roundtrip(img) == img).all()

    def test_single_color_image(self):
        img = np.full((50, 50, 3), 128, dtype=np.uint8)
        assert (roundtrip(img) == img).all()

    def test_two_value_image(self):
        img = np.zeros((10, 10), dtype=np.uint8)
        img[::2] = 255
        assert (roundtrip(img) == img).all()

    def test_all_256_values_present(self):
        img = np.arange(256, dtype=np.uint8).reshape(16, 16)
        assert (roundtrip(img) == img).all()

    def test_one_row_image(self):
        img = rng.integers(0, 256, size=(1, 500, 3)).astype(np.uint8)
        assert (roundtrip(img) == img).all()

    def test_empty_data_raises(self):
        with pytest.raises(ValueError):
            build_frequency_table(b"")


class TestDeltaFilter:
    def test_inverse_on_random_bytes(self):
        data = rng.integers(0, 256, size=999_999).astype(np.uint8)
        for lag in (1, 3, 4):
            # length must be divisible by lag
            trimmed = data[: len(data) - len(data) % lag]
            assert (delta_unfilter(delta_filter(trimmed, lag=lag), lag=lag) == trimmed).all()

    def test_wraparound(self):
        # 0 -> 255 wraps to delta 255 (-1); must invert exactly
        data = np.array([0, 255, 0, 255], dtype=np.uint8)
        assert (delta_unfilter(delta_filter(data), lag=1) == data).all()

    def test_filter_preserves_size(self):
        data = rng.integers(0, 256, size=3000).astype(np.uint8)
        assert delta_filter(data, lag=3).size == data.size

    def test_smooth_data_becomes_skewed(self):
        smooth = np.arange(10_000, dtype=np.uint8)  # wraps repeatedly, deltas all 1
        deltas = delta_filter(smooth)
        # nearly everything should be delta=1
        assert (deltas == 1).sum() > 9_990


class TestTreeSerialization:
    def test_serialize_deserialize_preserves_codes(self):
        data = bytes(rng.integers(0, 256, size=10_000).astype(np.uint8))
        tree = build_huffman_tree(build_frequency_table(data))
        restored = deserialize_tree(serialize_tree(tree))
        assert restored.codes == tree.codes
        # frequency table keys must come back as ints (JSON stores them as strings)
        assert all(isinstance(k, int) for k in restored.frequency_table)

    def test_decode_with_deserialized_tree(self):
        data = bytes(rng.integers(0, 256, size=5_000).astype(np.uint8))
        tree = build_huffman_tree(build_frequency_table(data))
        encoded, padding = encode_pixels(data, tree.codes)
        restored = deserialize_tree(serialize_tree(tree))
        assert decode_pixels(encoded, restored, padding) == data


class TestCompressionMetadata:
    def test_metadata_fields(self):
        img = rng.integers(0, 256, size=(20, 20, 3)).astype(np.uint8)
        service = HuffmanCompressionService()
        _compressed, meta = service.compress(img)
        assert meta['original_size'] == img.nbytes
        assert meta['original_shape'] == (20, 20, 3)
        assert meta['delta_filtered'] is True
        assert meta['delta_lag'] == 3
        assert 0 <= meta['padding'] <= 7
