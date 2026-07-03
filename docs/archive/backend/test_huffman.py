"""
Quick validation test for Huffman compression engine
Run this to verify the implementation works correctly
"""

if __name__ == "__main__":
    import sys
    from pathlib import Path
    
    # Add backend to path
    backend_path = Path(__file__).parent
    sys.path.insert(0, str(backend_path))
    
    from services.compression.demo import compress_data, decompress_data
    
    print("=" * 70)
    print("HUFFMAN COMPRESSION ENGINE - VALIDATION TEST")
    print("=" * 70)
    
    test_cases = [
        ("Simple text", b"Hello World! " * 10),
        ("Repeated byte", bytes([65] * 100)),
        ("All bytes (0-255)", bytes(range(256))),
        ("Mixed pattern", b"AAA" + b"B" * 10 + b"CCCCCCC"),
    ]
    
    all_passed = True
    
    for test_name, test_data in test_cases:
        try:
            print(f"\n[TEST] {test_name}")
            print("-" * 70)
            print(f"  Original size: {len(test_data)} bytes")
            
            # Compress
            compressed, tree_meta, padding, stats = compress_data(test_data)
            print(f"  Compressed size: {len(compressed)} bytes")
            print(f"  Compression ratio: {stats.calculate_ratio():.2f}x")
            print(f"  Space saved: {stats.calculate_percentage():.1f}%")
            
            # Decompress
            decompressed = decompress_data(compressed, tree_meta, padding)
            
            # Validate
            if test_data == decompressed:
                print(f"  ✓ PASSED - Data integrity verified")
            else:
                print(f"  ✗ FAILED - Decompressed data mismatch!")
                print(f"    Expected length: {len(test_data)}")
                print(f"    Got length: {len(decompressed)}")
                all_passed = False
        
        except Exception as e:
            print(f"  ✗ FAILED - Exception: {str(e)}")
            all_passed = False
    
    print("\n" + "=" * 70)
    if all_passed:
        print("✓ ALL TESTS PASSED")
    else:
        print("✗ SOME TESTS FAILED")
    print("=" * 70)
    
    sys.exit(0 if all_passed else 1)
