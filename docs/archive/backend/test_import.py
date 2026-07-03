#!/usr/bin/env python
"""Test import of HuffmanCompressionService"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

if __name__ == "__main__":
    try:
        from backend.services.compression import HuffmanCompressionService
        print("✓ Import successful!")
        print(f"✓ HuffmanCompressionService: {HuffmanCompressionService}")
        
        # Try instantiating
        service = HuffmanCompressionService()
        print(f"✓ Service instantiated: {service}")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
