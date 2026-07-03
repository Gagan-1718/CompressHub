#!/bin/bash
set -e

echo "Installing system dependencies for Python packages..."
apt-get update
apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libssl-dev \
    python3-dev \
    libjpeg-dev \
    libpng-dev \
    zlib1g-dev

echo "System dependencies installed successfully"
