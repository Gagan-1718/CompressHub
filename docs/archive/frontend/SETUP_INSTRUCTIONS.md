# Frontend Setup Instructions

## Quick Start (5 minutes)

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

This installs:
- Next.js 14
- React 18
- Tailwind CSS
- Lucide icons
- Axios for API calls

### 3. Configure Backend URL
Create or verify `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 4. Start Development Server
```bash
npm run dev
```

Output:
```
> frontend@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  
✓ Ready in 2.3s
  ▲ Local:        http://localhost:3000
```

### 5. Open in Browser
Visit: **http://localhost:3000**

You should see the home page with:
- Hero section
- Features overview
- "Start Compressing" button

---

## Complete Setup Walkthrough

### Prerequisites Check
```bash
node --version     # Should be v18.0.0 or higher
npm --version      # Should be v9.0.0 or higher
```

### Project Structure
```
frontend/
├── app/                    # Next.js app directory (pages)
├── components/            # Reusable React components
├── styles/               # CSS and Tailwind styles
├── lib/                  # Utility functions (API client)
├── public/               # Static files
└── Configuration files
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── jsconfig.json
    └── ...
```

### Installation Steps

#### Step 1: Install Node Packages
```bash
npm install
```

Installs all dependencies from `package.json`:
- **next**: Framework
- **react & react-dom**: UI library
- **tailwindcss**: CSS framework
- **lucide-react**: Icons
- **axios**: HTTP client (optional, can also use fetch)

#### Step 2: Create Environment File
```bash
# Copy from template (if exists)
cp .env.example .env.local
```

Or create `.env.local` manually:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_DEBUG=false
```

#### Step 3: Verify Backend is Running
Backend should be accessible at `http://localhost:8000`:
```bash
# From backend directory
npm run dev
# or
python -m uvicorn main:app --reload
```

#### Step 4: Start Frontend Development Server
```bash
npm run dev
```

---

## Available Scripts

### `npm run dev`
Starts development server with hot-reload
```bash
npm run dev
# Visit http://localhost:3000
```

### `npm run build`
Creates production build
```bash
npm run build
```

Output:
```
✓ Compiled successfully
✓ Linted successfully
Route (app)                              Size
┌ ○ /                                   XX kB
├ ○ /upload                             XX kB
└ ○ /results                            XX kB
```

### `npm run start`
Runs production build (requires `npm run build` first)
```bash
npm run build
npm run start
# Visit http://localhost:3000 (production mode)
```

### `npm run lint`
Runs ESLint for code quality
```bash
npm run lint
```

---

## Pages Overview

### Home Page (`/`)
**URL**: http://localhost:3000

**Features**:
- Hero section with call-to-action
- Feature highlights (3 cards)
- How it works (4-step process)
- Final CTA section

**Components Used**:
- Header (navigation)
- Footer (site links)
- Hero content
- Feature cards
- CTA section

### Upload Page (`/upload`)
**URL**: http://localhost:3000/upload

**Features**:
- Drag-and-drop file upload
- File preview with info
- Compression settings
- Quality selector

**Components Used**:
- UploadDropZone (drag/drop area)
- ImagePreview (shows selected image)
- CompressionForm (settings and button)

**Supported Formats**:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- Max size: 50MB

### Results Page (`/results`)
**URL**: http://localhost:3000/results?jobId=XXXXX

**Features**:
- Interactive image comparison slider
- Before/after side-by-side view
- Comprehensive metrics display
- Download buttons

**Components Used**:
- ImageComparison (slider and images)
- MetricsDisplay (statistics cards)

---

## Component Details

### Header Component
Located: `components/Header.jsx`
- Logo and brand name
- Navigation links (Home, Upload)
- Get Started CTA button
- Sticky navigation

### UploadDropZone Component
Located: `components/UploadDropZone.jsx`

**Features**:
- Drag and drop area
- Click to select file
- File validation (format, size)
- Error messages
- Loading state

**Props**:
- `onImageSelect`: Callback when image is selected

**Returns**:
```javascript
{
  file: File,                 // Original File object
  preview: string,            // Data URL for preview
  name: string,               // File name
  size: number,               // File size in bytes
  type: string                // MIME type
}
```

### CompressionForm Component
Located: `components/CompressionForm.jsx`

**Features**:
- Quality selector (High/Medium/Fast)
- Optional features toggle
- Loading state during compression
- Error handling

**Props**:
- `image`: Image object from UploadDropZone

### MetricsDisplay Component
Located: `components/MetricsDisplay.jsx`

**Shows**:
- Compression ratio (e.g., "2.93x")
- File size comparison
- Processing time
- Image information

**Props**:
- `metrics`: Metrics object from backend

### ImageComparison Component
Located: `components/ImageComparison.jsx`

**Features**:
- Interactive slider comparison
- Side-by-side view
- Download buttons
- Eye icons on slider

**Props**:
- `compressionResult`: Result object with images and metrics

---

## API Integration

### API Client Location
`lib/api.js`

### Using API Client
```javascript
import { apiClient } from '@/lib/api'

// Compress image
const result = await apiClient.compressImage(file)

// Get result
const compression = await apiClient.getCompressionResult(jobId)

// Get metrics
const metrics = await apiClient.getMetrics(jobId)

// Get history
const history = await apiClient.getHistory(10)

// Download
apiClient.downloadCompressed(jobId)
```

### Backend API Endpoints (Required)

The frontend expects these endpoints on backend:

#### Compress Image
```
POST /api/compression/compress
Body: FormData with 'file' field
Returns: { job_id, status, ... }
```

#### Get Compression Result
```
GET /api/compression/result/:jobId
Returns: { original_image, compressed_image, metrics }
```

#### Get Metrics
```
GET /api/compression/metrics/:jobId
Returns: { compression, file_sizes, image_info }
```

#### Download Image
```
GET /api/compression/download/:jobId
GET /api/compression/download/:jobId?type=original
Returns: Image file
```

---

## Environment Configuration

### .env.local
```env
# Required
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Optional
NEXT_PUBLIC_DEBUG=false
```

**Notes**:
- `NEXT_PUBLIC_*` variables are exposed to browser
- Keep sensitive data out of `NEXT_PUBLIC_*` variables
- Local dev: `http://localhost:8000`
- Production: Update to your server URL

---

## Tailwind CSS Customization

### Custom Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: '#3B82F6',      // Blue
  secondary: '#10B981',    // Green
  accent: '#F59E0B',       // Amber
}
```

### Custom Components
Edit `styles/globals.css`:
```css
@layer components {
  .btn { /* ... */ }
  .card { /* ... */ }
  .badge { /* ... */ }
}
```

### Adding Fonts
Update `tailwind.config.js` or `globals.css`

---

## Debugging

### Browser DevTools
1. Open Developer Tools (F12)
2. Console tab: Check for JavaScript errors
3. Network tab: Monitor API calls
4. Application tab: Check stored data

### Next.js Debug Mode
Enable in `.env.local`:
```env
NEXT_PUBLIC_DEBUG=true
```

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### API Connection Error
- Verify backend running on `http://localhost:8000`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

#### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Production Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# With environment variables
vercel --env NEXT_PUBLIC_API_URL=https://api.example.com
```

### Deploy to Other Platforms
- Docker container (create Dockerfile)
- Traditional hosting (Node.js server)
- Static export (if no dynamic routes)

---

## Performance Optimization

### Image Optimization
- Use Next.js Image component (already compatible)
- Compress images on backend
- Use appropriate formats

### Code Splitting
- Next.js automatically splits code per page
- Dynamic imports available if needed

### Caching
- Set appropriate cache headers
- Use SWR for data fetching (optional)

---

## Browser Support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: Latest versions

---

## Troubleshooting Checklist

- [ ] Node.js 18+ installed: `node --version`
- [ ] Dependencies installed: `npm install`
- [ ] `.env.local` configured correctly
- [ ] Backend running on correct port
- [ ] `NEXT_PUBLIC_API_URL` is correct
- [ ] No port conflicts (port 3000 free)
- [ ] Check browser console for errors
- [ ] Clear browser cache if needed
- [ ] Restart development server if code changes aren't reflected

---

## Next Steps

1. ✅ Frontend running at `http://localhost:3000`
2. Verify backend API integration works
3. Test uploading images
4. Test compression functionality
5. View results and metrics
6. Customize styling/colors as needed
7. Deploy to production

---

## Getting Help

1. Check browser console (F12) for errors
2. Check `/backend/logs` for API errors
3. Review `README.md` for more details
4. Check component source code for implementation details
5. Verify API response format matches expectations

---

**Happy coding! 🚀**
