# Image Compression Lab - Complete Setup

## 🚀 Quick Start (10 minutes)

This guide walks you through setting up both backend and frontend for the Image Compression Lab.

---

## Prerequisites

- **Node.js 18+** and **npm** (for frontend)
- **Python 3.11+** (for backend)
- **Git** (optional, for version control)

---

## Step 1: Backend Setup

### 1.1 Navigate to Backend
```bash
cd backend
```

### 1.2 Install Python Dependencies
```bash
pip install -r requirements.txt
# or
python -m pip install -r requirements.txt
```

### 1.3 Start Backend Server
```bash
python -m uvicorn main:app --reload --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

✅ **Backend running at**: `http://localhost:8000`

### 1.4 Verify API
Open in browser: `http://localhost:8000/docs`
- You should see the API documentation (Swagger UI)

---

## Step 2: Frontend Setup

### 2.1 Open New Terminal
Keep the backend terminal open, open a NEW terminal window.

### 2.2 Navigate to Frontend
```bash
cd frontend
```

### 2.3 Install Node Dependencies
```bash
npm install
```

This installs:
- Next.js 14
- React 18
- Tailwind CSS
- Lucide icons
- And other utilities

**Takes about 2-3 minutes**

### 2.4 Start Frontend Server
```bash
npm run dev
```

**Expected Output**:
```
▲ Next.js 14.0.0

✓ Ready in 2.3s
▲ Local:        http://localhost:3000
```

✅ **Frontend running at**: `http://localhost:3000`

---

## Step 3: Verify Everything Works

### 3.1 Open Frontend in Browser
Visit: **http://localhost:3000**

You should see:
- ✅ "Image Compression Lab" header
- ✅ Hero section with features
- ✅ "Start Compressing" button

### 3.2 Test Upload Flow
1. Click "Start Compressing" button
2. You should be redirected to `/upload` page
3. See drag-and-drop upload zone
4. Select a test image (JPG, PNG, or BMP)
5. Image preview should appear
6. Compression form should show

### 3.3 Test Compression
1. Select image quality (High/Medium/Fast)
2. Click "Compress Image" button
3. Wait for compression...
4. Should be redirected to `/results` page
5. See image comparison slider
6. View compression metrics

✅ **All systems operational!**

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                         │
│         (Image Compression Lab Frontend)                │
│           - Home page                                   │
│           - Upload interface                            │
│           - Results dashboard                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ HTTP/REST API
                   │ http://localhost:8000/api
                   │
┌──────────────────▼──────────────────────────────────────┐
│                 FastAPI Backend                         │
│      (Image Compression & Processing)                   │
│           - Image compression service                   │
│           - Metrics calculation                         │
│           - File handling                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow

### Complete Compression Workflow

1. **User opens frontend** at `http://localhost:3000`
2. **User uploads image** via drag-and-drop (max 50MB)
3. **Frontend validates** file (format, size)
4. **Frontend displays preview** with file info
5. **User configures** compression settings
6. **User clicks** "Compress Image"
7. **Frontend POST** to `http://localhost:8000/api/compression/compress`
8. **Backend processes** image with Huffman compression
9. **Backend calculates** metrics (ratio, size, time)
10. **Backend returns** result with images and metrics
11. **Frontend displays** results page with:
    - Image comparison slider
    - Compression metrics cards
    - Download options
12. **User can** download compressed image or compress another

---

## 📁 Project Structure

```
IMAGE_COMPRESSION_new/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── services/                  # Compression services
│   │   └── compression_workflow.py
│   ├── utils/
│   │   ├── huffman.py            # Huffman algorithm
│   │   ├── image_processor.py    # Image processing
│   │   └── metrics.py            # Metrics calculation
│   ├── requirements.txt           # Python dependencies
│   └── README.md                  # Backend documentation
│
├── frontend/
│   ├── app/                       # Next.js pages
│   │   ├── layout.jsx
│   │   ├── page.jsx
│   │   ├── upload/page.jsx
│   │   └── results/page.jsx
│   ├── components/                # React components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── UploadDropZone.jsx
│   │   ├── ImagePreview.jsx
│   │   ├── CompressionForm.jsx
│   │   ├── MetricsDisplay.jsx
│   │   └── ImageComparison.jsx
│   ├── lib/
│   │   └── api.js                # API client
│   ├── styles/
│   │   └── globals.css           # Global styles
│   ├── package.json              # Node dependencies
│   ├── tailwind.config.js        # Tailwind config
│   └── README.md                 # Frontend docs
│
├── FRONTEND_IMPLEMENTATION.md    # Frontend details
└── README.md                      # Project overview
```

---

## 🛠️ Common Commands

### Backend Commands

```bash
# Start development server
cd backend
python -m uvicorn main:app --reload

# Run with specific port
python -m uvicorn main:app --port 5000 --reload

# Check dependencies
pip list

# Install specific package
pip install package-name
```

### Frontend Commands

```bash
# Start development server
cd frontend
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Check code quality
npm run lint

# Install dependencies
npm install
```

---

## 🌐 API Endpoints

### Compression Endpoints
```
POST   /api/compression/compress      # Compress image
GET    /api/compression/result/:id    # Get results
GET    /api/compression/metrics/:id   # Get metrics
GET    /api/compression/download/:id  # Download image
```

### Documentation
```
GET    /docs                          # Swagger UI
GET    /redoc                         # ReDoc documentation
```

### Health Check
```
GET    /health                        # API status
```

---

## 🔧 Troubleshooting

### Backend Issues

**Backend won't start**
```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Check port 8000 is not in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows
```

**API not responding**
- Ensure backend is running: `http://localhost:8000/docs`
- Check firewall settings
- Verify port 8000 is open

### Frontend Issues

**Frontend won't start**
```bash
# Check Node version
node --version  # Should be v18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Try different port
npm run dev -- -p 3001
```

**Cannot connect to API**
- Ensure backend running on port 8000
- Check `.env.local` has correct API URL
- Verify CORS enabled on backend
- Check browser console (F12) for errors

**Port 3000 already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux

# Or use different port
npm run dev -- -p 3001
```

---

## ✨ Features Overview

### Backend Features
- ✅ Huffman compression algorithm
- ✅ Image processing (JPG, PNG, BMP)
- ✅ Metrics calculation (ratio, size, time)
- ✅ FastAPI REST endpoints
- ✅ CORS support
- ✅ Error handling

### Frontend Features
- ✅ Modern Next.js app
- ✅ Responsive Tailwind CSS design
- ✅ Drag-and-drop image upload
- ✅ Image preview before compression
- ✅ Interactive image comparison slider
- ✅ Comprehensive metrics display
- ✅ Professional UI/UX

---

## 📊 Expected Metrics Display

After compression, you'll see:

```
Compression Ratio: 2.93x
Space Saved: 65.87%

File Sizes:
- Original: 5.00 MB
- Compressed: 1.71 MB
- Saved: 3.29 MB

Processing Time:
- Compression: 145.5ms
- Decompression: 125.3ms

Image Info:
- Format: JPEG
- Dimensions: 1920×1080
- Channels: 3
- Total Pixels: 2.07M
```

---

## 🚀 Production Deployment

### Backend Deployment
```bash
# Build production image
docker build -t image-compression-backend .

# Run container
docker run -p 8000:8000 image-compression-backend

# Or deploy to cloud (Heroku, AWS, Google Cloud, etc.)
```

### Frontend Deployment
```bash
# Build production
npm run build

# Deploy to Vercel (recommended)
npm run build
npx vercel

# Or deploy to other platforms (Netlify, GitHub Pages, etc.)
```

---

## 📚 Documentation Files

- **Backend README**: `/backend/README.md` - Backend overview
- **Frontend README**: `/frontend/README.md` - Frontend overview
- **Frontend Setup**: `/frontend/SETUP_INSTRUCTIONS.md` - Detailed setup
- **Metrics Guide**: `/backend/METRICS_MODULE.md` - API reference
- **This File**: Root level quick start guide

---

## ✅ Verification Checklist

- [ ] Backend running: `http://localhost:8000`
- [ ] Backend API docs accessible: `http://localhost:8000/docs`
- [ ] Frontend running: `http://localhost:3000`
- [ ] Frontend home page loading
- [ ] Upload page drag-drop zone visible
- [ ] Can select image file
- [ ] Image preview appears
- [ ] Compression form shown
- [ ] Compression completes
- [ ] Results page displays
- [ ] Metrics showing correctly
- [ ] Image comparison slider working
- [ ] Download buttons functional

---

## 🎯 Next Steps

1. ✅ Verify both backend and frontend are running
2. Test compression with different image sizes
3. Monitor metrics accuracy
4. Test file format support (JPG, PNG, BMP)
5. Verify API response times
6. Test error handling (oversized files, bad formats)
7. Customize styling/colors if needed
8. Deploy to production when ready

---

## 📞 Support

### If Something Goes Wrong

1. Check terminal output for errors
2. Look at browser console (F12) for JavaScript errors
3. Verify ports are not in use
4. Clear browser cache and refresh
5. Restart both backend and frontend
6. Check documentation files
7. Review source code comments

---

## 📖 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [Python Imaging Library](https://pillow.readthedocs.io)

---

## 🎉 Success!

When both backend and frontend are running correctly:

✅ **Backend**: `http://localhost:8000/docs`
✅ **Frontend**: `http://localhost:3000`
✅ **API Communication**: Working seamlessly
✅ **Image Compression**: Fully functional

**Your Image Compression Lab is ready!**

---

## 📝 Quick Reference

| Component | URL | Status Command |
|-----------|-----|-----------------|
| Backend | http://localhost:8000 | `python -m uvicorn main:app --reload` |
| API Docs | http://localhost:8000/docs | Available after backend starts |
| Frontend | http://localhost:3000 | `npm run dev` |
| Upload | http://localhost:3000/upload | Navigate from home |
| Results | http://localhost:3000/results | Automatic after compression |

---

**Happy image compression! 🎨✨**

For detailed documentation, see:
- `/backend/README.md` - Backend overview
- `/frontend/README.md` - Frontend overview
- `/FRONTEND_IMPLEMENTATION.md` - Frontend details
