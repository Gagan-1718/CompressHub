#!/usr/bin/env python
"""Test backend startup"""
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    try:
        print("Attempting to import backend.main...")
        from backend.main import app
        print("✓ Backend app imported successfully!")
        print(f"✓ FastAPI app: {app}")
        print(f"✓ Title: {app.title}")
        print(f"✓ Version: {app.version}")
    except Exception as e:
        print(f"✗ Error importing backend: {e}")
        import traceback
        traceback.print_exc()
