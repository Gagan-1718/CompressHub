# Image Compression Lab - Frontend

Modern, responsive frontend for the Interactive Image Compression Lab built with **Next.js 14** and **Tailwind CSS**.

## 🎨 Features

- **Drag & Drop Upload**: Intuitive file upload interface
- **Image Preview**: See your image before compression
- **Real-time Metrics**: Display compression ratio, file size savings, and processing time
- **Image Comparison**: Interactive slider to compare original and compressed images
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean, professional design using Tailwind CSS
- **Fast Performance**: Next.js for optimized loading and routing

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.jsx           # Root layout with Header and Footer
│   ├── page.jsx             # Home page
│   ├── upload/
│   │   └── page.jsx         # Upload interface page
│   └── results/
│       └── page.jsx         # Results/metrics dashboard
├── components/
│   ├── Header.jsx           # Navigation header
│   ├── Footer.jsx           # Footer component
│   ├── UploadDropZone.jsx   # Drag-and-drop upload
│   ├── ImagePreview.jsx     # Image preview card
│   ├── CompressionForm.jsx  # Compression settings form
│   ├── MetricsDisplay.jsx   # Metrics visualization
│   └── ImageComparison.jsx  # Before/after comparison
├── styles/
│   └── globals.css          # Tailwind directives and custom styles
├── lib/
│   └── api.js               # API client and utilities
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
└── jsconfig.json            # JavaScript path aliases

```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (or npm/yarn)
- Backend API running on `http://localhost:8000`

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create `.env.local` if not present (includes backend API URL):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Development

Start the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build for production:
```bash
npm run build
npm start
```

## 📄 Pages

### 1. **Home Page** (`/`)
- Hero section with call-to-action
- Feature highlights
- How it works explanation
- Beautiful gradient backgrounds

### 2. **Upload Page** (`/upload`)
- Drag-and-drop file upload zone
- Image preview with file information
- Compression settings and options
- Quality/performance selector

### 3. **Results Page** (`/results`)
- Interactive before/after image comparison with slider
- Comprehensive metrics display
  - Compression ratio
  - File size comparison
  - Processing time
  - Image information
- Download options for compressed image

## 🎯 Components

### UploadDropZone
- Drag and drop functionality
- File validation (format, size)
- Loading states
- Error handling

### ImagePreview
- Displays uploaded image
- Shows file information
- File name, format, and size

### CompressionForm
- Algorithm information
- Quality settings (High/Medium/Fast)
- Optional features toggle
- Submit button with loading state

### MetricsDisplay
- Compression ratio with visual emphasis
- File size comparison
- Processing time information
- Image metadata display

### ImageComparison
- Interactive slider comparison
- Side-by-side view
- Eye icon on slider handle
- Download buttons for both images

## 🎨 Styling

The frontend uses **Tailwind CSS** with custom configuration:

- **Color Scheme**: Blue primary (#3B82F6), Green secondary (#10B981)
- **Custom Components**: Reusable button, card, and badge styles
- **Responsive**: Mobile-first approach with breakpoints
- **Animations**: Fade-in effects and smooth transitions

Custom CSS classes available:
- `.btn` - Base button styles
- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons
- `.btn-outline` - Outline style buttons
- `.card` - Card container
- `.badge` - Badge labels

## 🔌 API Integration

The frontend communicates with the backend API through the `apiClient` utility in `lib/api.js`:

```javascript
import { apiClient } from '@/lib/api'

// Compress image
const result = await apiClient.compressImage(file)

// Get compression result
const result = await apiClient.getCompressionResult(jobId)

// Get metrics
const metrics = await apiClient.getMetrics(jobId)

// Get history
const history = await apiClient.getHistory(10)

// Get analytics
const analytics = await apiClient.getAnalytics()
```

## 📊 Expected API Response Format

The backend should return metrics in this format:

```json
{
  "job_id": "unique-job-id",
  "status": "completed",
  "original_image": "data:image/jpeg;base64,...",
  "compressed_image": "data:image/jpeg;base64,...",
  "metrics": {
    "file_sizes": {
      "original_bytes": 5242880,
      "original_formatted": "5.00 MB",
      "compressed_bytes": 1789272,
      "compressed_formatted": "1.71 MB"
    },
    "compression": {
      "ratio": 2.93,
      "percentage": 65.87,
      "compression_time_ms": 145.5,
      "decompression_time_ms": 125.3
    },
    "image_info": {
      "format": "JPEG",
      "width": 1920,
      "height": 1080,
      "channels": 3,
      "total_pixels": 2073600
    },
    "timestamp": "2026-03-15T10:30:45.123456"
  }
}
```

## 🌐 Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)

Maximum file size: **50 MB**

## 🛠️ Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# Backend API endpoint
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Debug mode (optional)
NEXT_PUBLIC_DEBUG=false
```

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

All components are fully responsive and tested across devices.

## 🔐 Security Considerations

- File validation on client-side
- Size and format restrictions
- XSS prevention through React's built-in escaping
- CORS headers should be configured on backend

## 🚨 Error Handling

The application handles:
- File upload errors
- Network failures
- Invalid file formats
- File size violations
- API errors with user-friendly messages

## 📦 Dependencies

- **Next.js 14**: React framework for production
- **React 18**: UI library
- **Tailwind CSS 3**: Utility-first CSS framework
- **axios**: HTTP client for API calls
- **lucide-react**: Icon library
- **react-dropzone**: File drop zone component

## 🔄 Workflow

1. User visits home page
2. Clicks "Start Compressing"
3. Uploads image via drag-and-drop
4. Selects compression quality
5. Clicks "Compress Image"
6. Frontend sends to backend API
7. Backend compresses and returns metrics
8. Frontend displays results with:
   - Interactive image comparison
   - Detailed metrics
   - Download options

## 🐛 Troubleshooting

### "Failed to compress" error
- Ensure backend is running on `http://localhost:8000`
- Check CORS configuration on backend
- Verify file format is supported

### Images not showing
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify backend is returning proper image data
- Check browser console for errors

### Slow upload
- Check file size (max 50MB)
- Verify network connection
- Try reducing image dimensions

## 📝 Development Notes

- Uses Next.js App Router (not Pages Router)
- All components are client-side enabled with `'use client'` directive
- Path aliases configured in `jsconfig.json` for clean imports
- Image comparison slider uses mouse events for drag interaction

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [Lucide Icons](https://lucide.dev)

## 📄 License

This project is part of the Interactive Image Compression Lab.

## ✨ Features Roadmap

- [ ] Image history/gallery view
- [ ] Batch compression
- [ ] Custom compression presets
- [ ] Analytics dashboard
- [ ] User authentication
- [ ] Cloud storage integration
- [ ] Dark mode support
- [ ] Advanced image filters

---

**Built with ❤️ using Next.js and Tailwind CSS**
