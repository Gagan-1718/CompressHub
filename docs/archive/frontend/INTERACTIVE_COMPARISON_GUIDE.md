# 🔍 Interactive Image Comparison Tool Guide

## Overview

The interactive image comparison tool provides multiple ways to compare original and compressed images side by side with advanced features like zooming, panning, and smooth slider interactions.

## 📁 Component Location

**File:** `components/ImageComparison.jsx`  
**Used In:** `app/results/page.jsx`

## ✨ Features

### 1. **Slider Comparison** (Default View)

#### What It Does:
- Drag a vertical slider left and right to reveal original and compressed images
- Perfect for seeing differences in details and artifacts
- Real-time slider position indicator (shows percentage)

#### How to Use:
1. Click and drag the white slider handle left and right
2. Move left to reveal the original image
3. Move right to reveal the compressed image
4. Mobile users can touch and drag to control the slider
5. Position indicator shows the current slider position (0-100%)

#### Visual Elements:
- White slider line with eye icons (Eye icon = original, Eye-off icon = compressed)
- Blue eye icons in the handle button
- Smooth hover effects (handle scales up on hover for better affordance)
- Labels in top corners: "Original" (left) and "Compressed" (right)
- Bottom indicator shows exact slider position

---

### 2. **Zoom View** (Advanced)

#### What It Does:
- Zoom in up to 4x magnification for pixel-level inspection
- Pan around when zoomed to examine different parts of the image
- Combined with slider comparison for detailed analysis

#### How to Use:

**Zoom Controls:**
- **Zoom In Button:** Click `[+]` button or scroll wheel up to zoom in (max 4x)
- **Zoom Out Button:** Click `[-]` button or scroll wheel down to zoom out (min 1x)
- **Zoom Level Display:** Shows current zoom percentage (100%, 150%, 200%, etc.)
- **Reset Button:** Click to return to 100% zoom and clear pan position

**Panning (When Zoomed):**
1. Zoom in to at least 150%
2. Click and drag anywhere on the image to pan around
3. Cursor changes to grab cursor to indicate draggability
4. Active panning shows grab cursor with visual feedback
5. Pan bounds automatically constrained to prevent excessive movement

**Combined Slider + Zoom:**
- Use the slider while zoomed to compare specific details
- Pan to center on areas of interest
- Examine compression artifacts at pixel level

#### Visual Elements:
- **Zoom Controls Bar:** Shows zoom buttons, percentage, and reset button
- **Zoom Indicator:** Top-left corner shows current zoom level
- **Grab Cursor:** Changes when hoverable/draggable
- **Pan Hint:** Shows "Drag to pan" indicator when zoomed
- **Corner Label:** Displays current zoom percentage

#### Zoom Levels:
- **100% (MIN_ZOOM):** Original size, no zooming
- **150%:** 1.5x magnification
- **200%:** 2x magnification
- **250%:** 2.5x magnification
- **300%:** 3x magnification
- **350%:** 3.5x magnification
- **400% (MAX_ZOOM):** Maximum 4x magnification

**When zoomed beyond 100%:**
- Dragging/panning becomes available
- Pan bounds automatically calculated to prevent excessive scrolling
- Reset button becomes active and visible
- "Drag to pan" hint displays near zoom controls

---

## 🎯 View Switching

### Toggle Between Views:
- **Slider Button:** Switches to slider comparison view
  - Click automatically resets zoom to 1x (100%)
  - Pan position clears
  - Perfect for initial comparison

- **Zoom Button:** Switches to zoom + slider comparison view
  - Allows detailed pixel-level inspection
  - Zoom level maintains when switching if already zoomed
  - Reset button visible when needed

### Active View Indicator:
- Selected button: Blue background with white text
- Unselected button: Gray background
- Hover states for better interactivity

---

## 🎨 Design & Styling

### Color Scheme:
- **Handle Icon:** Blue (#3B82F6) - Matches app theme
- **Labels:** White text on semi-transparent black background
- **Interaction States:** Hover effects with scale transitions
- **Zoom Controls:** Border and neutral styling for clarity

### Responsive Design:
- **Mobile:** Full-width comparison, touch-friendly controls
- **Tablet:** Optimized for portrait and landscape
- **Desktop:** All features fully available

### Accessibility:
- High contrast labels and controls
- Hover states provide visual feedback
- Cursor changes to indicate interaction modes
  - `col-resize` - Slider is draggable
  - `grab` - Area is draggable when zoomed
  - `grabbing` - Currently dragging
- Disabled states for zoom buttons at limits
- Keyboard navigation support through standard button interactions

---

## 🖥️ Technical Implementation

### Component State:
```javascript
// Slider state
const [sliderPosition, setSliderPosition] = useState(50)    // 0-100%
const [isSliderActive, setIsSliderActive] = useState(false)  // Dragging

// Zoom state
const [zoom, setZoom] = useState(1)                         // 1-4x
const [panX, setPanX] = useState(0)                         // Horizontal pan
const [panY, setPanY] = useState(0)                         // Vertical pan
const [isPanning, setIsPanning] = useState(false)           // Dragging
const [activeView, setActiveView] = useState('slider')      // View mode
```

### Event Handlers:

**Slider Interaction:**
- `handleMouseMove()` / `handleTouchMove()` - Update slider position
- `handleMouseDown()` / `handleMouseUp()` - Track drag state
- Prevents accidental selections with `select-none` class

**Zoom Interaction:**
- `handleZoomIn()` / `handleZoomOut()` - Increment/decrement zoom
- `handleWheel()` - Scroll wheel support for zoom
- Constrained zoom: `MIN_ZOOM = 1`, `MAX_ZOOM = 4`

**Pan Interaction:**
- `handlePanStart()` - Begin pan operation
- `handlePanMove()` - Update pan position during drag
- `handlePanEnd()` - Finish pan operation
- `calculateMaxPan()` - Constrains pan to valid bounds

### Transform Applied:
```javascript
transform: `translate(${panX}px, ${panY}px) scale(${zoom})`
transformOrigin: 'center'
transition: isPanning ? 'none' : 'transform 0.1s ease-out'
```
- No transition during pan for responsive feel
- Smooth transitions after pan ends
- Center origin for consistent zoom behavior

### Image Rendering:
- Original image visible through compressed image overlay
- Overlay size controlled by slider position
- Images scale properly with zoom transform
- Object-fit: contain for proper aspect ratio

---

## 📱 Touch Support

### Mobile Gestures:
- **Touch Drag:** Slider responds to touch movements (same as mouse)
- **Touch Events Mapped:**
  - `onTouchStart` → `handleMouseDown()`
  - `onTouchMove` → `handleTouchMove()`
  - `onTouchEnd` → `handleMouseUp()`

### Mobile Zoom:
- Zoom buttons work on touch devices
- Manual zoom control without pinch gesture complication

---

## 🔧 Customization

### Adjust Zoom Limits:
```javascript
const MIN_ZOOM = 1      // Change to 0.5 for 0.5x zoom out
const MAX_ZOOM = 4      // Change to 8 for 8x magnification
```

### Adjust Pan Sensitivity:
```javascript
const maxPan = 50 * (zoom - 1)  // Change 50 to control pan range
```

### Adjust Animation Smoothness:
```javascript
transition: isPanning ? 'none' : 'transform 0.1s ease-out'
//                                                  ^^^^^^
// Change to 'transform 0.2s ease-in-out' for smoother transitions
```

### Change Colors:
- Eye icons: `text-blue-600` → change to any Tailwind color
- Labels: `bg-black/60` → adjust opacity (60 is 60%)
- Handle: `bg-white` → any background color
- Controls: Use Tailwind classes for styling

### Adjust Heights:
```javascript
className="relative w-full h-96 rounded-lg..."  // h-96 = 384px
// Change to: h-80 (320px), h-[500px], etc.
```

---

## 📊 Performance Optimizations

### Rendering:
- Uses CSS transforms (GPU-accelerated)
- No image re-rendering during pan/zoom
- Efficient state updates with conditional transitions
- Pan events don't trigger animation during drag

### Memory:
- Single image references (no duplication)
- Container ref used only for pan calculations
- State properly scoped to component

### Smoothness:
- 60fps pan/zoom interactions
- Touch events debounced at OS level
- Immediate visual feedback

---

## 🐛 Troubleshooting

### Issue: Slider not responding

**Solution:**
- Check that `onMouseDown/Up/Move` events are properly attached
- Verify `isSliderActive` state is updating
- Clear browser cache and hard refresh

### Issue: Zoom not working

**Solution:**
- Ensure wheel event handler has `e.preventDefault()`
- Check zoom limits: `MIN_ZOOM = 1`, `MAX_ZOOM = 4`
- Verify zoom buttons are not disabled

### Issue: Pan not working when zoomed

**Solution:**
- Confirm zoom > 1 before pan is enabled
- Check `isPanning` state updates correctly
- Verify `handlePanStart` is capturing mouse position correctly
- Pan bounds calculation: `maxPan = 50 * (zoom - 1)`

### Issue: Images not loading

**Solution:**
- Verify backend provides `original_image` and `compressed_image` URLs
- Check CORS headers if loading from different domain
- Ensure images are base64 encoded or valid URLs

### Issue: Touch not working on mobile

**Solution:**
- Verify touch events are bound to container div
- Check mobile browser supports touch events
- Test on actual device (touchpad may not work)
- Clear browser cache

### Issue: UI overlapping or misaligned

**Solution:**
- Check Tailwind CSS is imported globally
- Verify no conflicting CSS from other components
- Test in different browsers (Chrome, Firefox, Safari)
- Clear Next.js build cache: `rm -rf .next`

---

## 🚀 Advanced Features

### Keyboard Support:
Add this to container div for keyboard zoom:
```javascript
const handleKeyDown = (e) => {
  if (e.key === '+') handleZoomIn()
  if (e.key === '-') handleZoomOut()
  if (e.key === '0') resetZoom()
}
```

### Double-Click to Zoom:
```javascript
const handleDoubleClick = () => {
  if (zoom < 2) handleZoomIn()
  else resetZoom()
}
```

### Pinch-Zoom Support (Future):
Can add touch event handler:
```javascript
const handlePinch = (e) => {
  const scale = e.scale
  setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale * zoom)))
}
```

---

## 📚 Integration Points

### In Results Page:
```jsx
import ImageComparison from '@/components/ImageComparison'

export default function ResultsPage() {
  return (
    <ImageComparison compressionResult={compressionResult} />
  )
}
```

### Props Received:
```javascript
compressionResult = {
  original_image: "data:image/png;base64,..." or "url",
  compressed_image: "data:image/png;base64,..." or "url",
  metrics: { /* compression metrics */ }
}
```

### CSS Classes Used:
- `.card` - Card styling (defined in global CSS)
- `.fade-in` - Fade animation (defined in global CSS)
- `.subsection-title` - Title styling (defined in global CSS)
- Tailwind utility classes for layout and styling

---

## ✅ User Experience Checklist

- ✅ Slider responds smoothly to mouse/touch drag
- ✅ Position indicator updates in real-time
- ✅ Zoom buttons enable/disable at limits
- ✅ Pan is intuitive and bounds-constrained
- ✅ Reset button available when zoomed
- ✅ Visual feedback for all interactions
- ✅ Mobile-friendly touch support
- ✅ Responsive design across devices
- ✅ No lag or performance issues
- ✅ Cursor changes to indicate mode
- ✅ Labels clear and readable
- ✅ Animations smooth and professional

---

## 🎓 Learning Resources

### Related Components:
- `ImagePreview.jsx` - Single image preview
- `MetricsDisplay.jsx` - Shows compression metrics
- `AnalyticsDashboard.jsx` - Visual analytics

### Tailwind CSS References:
- Sizing: `h-96`, `w-full`, `px-3`, `py-1`
- Spacing: `gap-2`, `mb-4`, `mt-4`
- Effects: `shadow-lg`, `rounded-lg`, `overflow-hidden`

---

## 📞 Support

For issues or feature requests:
1. Check the troubleshooting section above
2. Review the technical implementation details
3. Test with console open (F12 / Cmd+Option+I) for errors
4. Compare with code examples in this guide

---

Last Updated: March 2026  
Component Version: 2.0 (Enhanced with Zoom & Pan)  
Status: ✅ Production Ready
