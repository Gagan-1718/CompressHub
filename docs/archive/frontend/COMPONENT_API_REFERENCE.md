# 📚 Component API Reference

## Complete API Documentation for Production UI Components

---

## 🎨 ThemeToggle Component

### Purpose
Provides a button to toggle between light and dark themes with a moon/sun icon.

### Import
```javascript
import ThemeToggle from '@/components/ThemeToggle'
```

### Usage
```jsx
<ThemeToggle />
```

### Props
None - This component manages its own state.

### Features
- Detects system dark mode preference
- Saves preference to localStorage
- Smooth icon rotation animation
- Keyboard accessible
- Mobile friendly

### Dark Mode Storage
```javascript
// Stored as
localStorage.setItem('theme', 'dark' | 'light')

// Retrieved on mount
const savedTheme = localStorage.getItem('theme')
```

### Behavior
1. On first visit: Uses system preference
2. User clicks: Toggles theme and saves
3. On refresh: Uses saved preference
4. No preference saved: Uses system preference

### Styling
- Light mode: Sun icon, light background
- Dark mode: Moon icon, dark background
- Smooth 300ms transition between states

---

## ⏳ LoadingOverlay Component

### Purpose
Full-screen modal overlay that shows during long-running operations with progress tracking.

### Import
```javascript
import LoadingOverlay from '@/components/LoadingOverlay'
```

### Usage
```jsx
<LoadingOverlay 
  isVisible={isLoading}
  message="Compressing your image..."
  progress={progress}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isVisible` | boolean | false | Show/hide overlay |
| `message` | string | "Loading..." | Overlay message text |
| `progress` | number | 0 | Progress 0-100 |
| `onClose` | function | undefined | Callback on close |

### Examples

#### Basic Loading
```jsx
<LoadingOverlay 
  isVisible={isLoading}
  message="Processing..."
/>
```

#### With Progress
```jsx
const [progress, setProgress] = useState(0)

<LoadingOverlay 
  isVisible={isLoading}
  message={`Uploading... ${progress}%`}
  progress={progress}
/>
```

#### With Close Handler
```jsx
<LoadingOverlay 
  isVisible={isLoading}
  message="Processing..."
  onClose={() => setIsLoading(false)}
/>
```

### Styling
- Semi-transparent dark background
- Centered white card (light) / dark card (dark mode)
- Blur effect on background
- Prevents scrolling when visible

---

## 🔄 LoadingSpinner Component

### Purpose
Animated spinning loader icon with optional text.

### Import
```javascript
import LoadingSpinner from '@/components/LoadingSpinner'
```

### Usage
```jsx
<LoadingSpinner />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | 'sm' \| 'md' \| 'lg' | 'md' | Spinner size |
| `text` | string | undefined | Optional text |
| `color` | string | 'blue' | Spinner color |

### Examples

#### Small Spinner
```jsx
<LoadingSpinner size="sm" />
```

#### With Text
```jsx
<LoadingSpinner size="md" text="Loading..." />
```

#### Large Colored
```jsx
<LoadingSpinner size="lg" color="green" />
```

#### In Button
```jsx
<button disabled>
  <LoadingSpinner size="sm" />
  Processing...
</button>
```

### CSS Animation
```css
animation: spin 1s linear infinite;
```

---

## 👻 SkeletonLoader Component

### Purpose
Shimmer animation for loading states before content appears.

### Import
```javascript
import SkeletonLoader from '@/components/SkeletonLoader'
```

### Usage
```jsx
<SkeletonLoader count={3} height="h-20" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | number | 1 | Number of skeleton items |
| `height` | string | 'h-12' | Tailwind height class |
| `width` | string | 'w-full' | Tailwind width class |

### Examples

#### Three Skeleton Cards
```jsx
<SkeletonLoader count={3} height="h-24" />
```

#### Small Skeleton List
```jsx
<SkeletonLoader count={5} height="h-8" width="w-32" />
```

#### Image Loading
```jsx
<SkeletonLoader count={1} height="h-48" width="w-full" />
```

### Animation
- Wave shimmer effect left to right
- 2 second loop
- Light gray base color
- Darker gray shimmer highlight

---

## 📊 ProgressBar Component

### Purpose
Visual progress indicator with optional label.

### Import
```javascript
import ProgressBar from '@/components/ProgressBar'
```

### Usage
```jsx
<ProgressBar progress={65} label="Uploading..." />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | number | 0-100 | Progress percentage |
| `label` | string | undefined | Optional label text |
| `color` | string | 'blue' | Bar color |
| `height` | string | 'h-2' | Tailwind height |

### Examples

#### Simple Progress
```jsx
<ProgressBar progress={50} />
```

#### With Label
```jsx
<ProgressBar progress={75} label="75% complete" />
```

#### Different Colors
```jsx
<ProgressBar progress={100} color="green" label="Complete!" />
<ProgressBar progress={50} color="yellow" label="In progress" />
```

#### Large Progress Bar
```jsx
<ProgressBar 
  progress={progress}
  label={`${progress}%`}
  height="h-4"
/>
```

### Animation
- Smooth fill animation (500ms)
- Width increases smoothly
- Combines with label update
- Responsive to value changes

---

## 🔔 Toast Component

### Purpose
Global notification system for user feedback.

### Import
```javascript
import { useToast } from '@/components/Toast'
import ToastProvider from '@/components/Toast'
```

### Setup
```jsx
// In app/layout.jsx
import ToastProvider from '@/components/Toast'

export default function RootLayout({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}
```

### Usage
```jsx
const { addToast } = useToast()

// Add notification
addToast('Message', 'type', duration)
```

### Hook: useToast()

#### Methods

```javascript
addToast(
  message: string,
  type: 'success' | 'error' | 'warning' | 'info',
  duration?: number (default: 4000)
)
```

### Toast Types

#### Success
```jsx
addToast('Image compressed successfully!', 'success')
// Green background, checkmark icon
```

#### Error
```jsx
addToast('Error: File size too large', 'error')
// Red background, X icon
```

#### Warning
```jsx
addToast('This action cannot be undone', 'warning')
// Yellow background, alert icon
```

#### Info
```jsx
addToast('Processing in background...', 'info')
// Blue background, info icon
```

### Examples

#### File Upload Success
```jsx
const handleUpload = async (file) => {
  try {
    await uploadFile(file)
    addToast('File uploaded: ' + file.name, 'success')
  } catch (err) {
    addToast(err.message, 'error')
  }
}
```

#### No Auto-Dismiss
```jsx
addToast('Important: Check email', 'info', 0)
// Toast stays until user closes
```

#### Long Duration
```jsx
addToast('Processing may take a few minutes...', 'info', 10000)
// 10 seconds before auto-dismiss
```

#### Multiple Toasts
```jsx
addToast('Step 1 complete', 'success')
addToast('Starting step 2...', 'info')
addToast('Step 3 queued', 'info')
// All three appear stacked
```

### Styling
- Position: bottom-right
- Stack spacing: 12px
- Auto-dismiss: 4000ms (default)
- Manual close button
- Dark mode support
- Smooth slide-in animation

---

## 🛡️ ErrorBoundary Component

### Purpose
Catches React component errors and displays fallback UI.

### Import
```javascript
import ErrorBoundary from '@/components/ErrorBoundary'
```

### Usage
```jsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | React.ReactNode | required | Components to wrap |
| `onError` | function | undefined | Error callback |

### Examples

#### Basic Wrapping
```jsx
<ErrorBoundary>
  <CompressionForm />
</ErrorBoundary>
```

#### With Error Handler
```jsx
<ErrorBoundary 
  onError={(error, errorInfo) => {
    console.log('Error caught:', error)
    logToSentry(error)
  }}
>
  <App />
</ErrorBoundary>
```

#### Multiple Boundaries
```jsx
<ErrorBoundary>
  <Header />
</ErrorBoundary>

<ErrorBoundary>
  <Main />
</ErrorBoundary>

<ErrorBoundary>
  <Footer />
</ErrorBoundary>
```

### Fallback UI
- Error title
- Error message
- Stack trace (dev only)
- Reset button to retry

### Limitations
- Catches only component errors
- Does NOT catch:
  - Event handlers (use try/catch)
  - Async code (use promises)
  - Server-side rendering

---

## 🌓 ThemeProvider Component

### Purpose
Manages theme state and applies dark mode CSS class to HTML element.

### Import
```javascript
import ThemeProvider from '@/components/ThemeProvider'
```

### Setup
```jsx
// In app/layout.jsx
import ThemeProvider from '@/components/ThemeProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### How It Works
1. Reads theme from localStorage
2. Sets `dark` class on `<html>` element
3. Tailwind applies `dark:` styles
4. Provides context to children

### No Props
This component manages everything automatically.

### CSS Classes Applied
```html
<!-- Light mode (default) -->
<html>

<!-- Dark mode -->
<html class="dark">
```

---

## 🎨 Styling & Theming

### Dark Mode Classes

Use Tailwind's `dark:` prefix:
```jsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-white">
    Content
  </p>
</div>
```

### Color Palette

**Light Mode:**
```
Primary:   #3B82F6 (Blue-500)
Secondary: #10B981 (Green-500)
Warning:   #F59E0B (Amber-500)
Danger:    #EF4444 (Red-500)
```

**Dark Mode:**
```
Background: #0F172A (Slate-900)
Surface:    #1E293B (Slate-800)
Text:       #F1F5F9 (Slate-100)
Muted:      #94A3B8 (Slate-400)
```

### Custom Animations

Available animations:
```
animate-fade-in      // 300ms fade
animate-scale-in     // 200ms scale
animate-slide-in     // 300ms slide
animate-spin-slow    // 3s spin
animate-pulse-soft   // 2s pulse
```

---

## 🔧 Configuration

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_IMAGE_MAX_SIZE=5242880  # 5MB
```

### Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        // ... more animations
      }
    }
  }
}
```

---

## 🧪 Testing Components

### Unit Testing Example
```jsx
import { render, screen } from '@testing-library/react'
import ProgressBar from '@/components/ProgressBar'

describe('ProgressBar', () => {
  it('displays progress percentage', () => {
    render(<ProgressBar progress={75} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })
})
```

### Integration Testing
```jsx
import { render, userEvent } from '@testing-library/react'
import { useToast, ToastProvider } from '@/components/Toast'

it('adds and removes toast', async () => {
  const { getByText } = render(
    <ToastProvider>
      <TestComponent />
    </ToastProvider>
  )
  
  await userEvent.click(getByText('Show Toast'))
  expect(getByText('Success!')).toBeInTheDocument()
})
```

---

## 🚀 Performance Tips

1. **Memoize components**
   ```jsx
   export default memo(ProgressBar)
   ```

2. **Use CSS animations** (not JS)
   - Better performance
   - 60fps smooth
   - GPU accelerated

3. **Lazy load heavy components**
   ```jsx
   const LoadingOverlay = lazy(() => import('./LoadingOverlay'))
   ```

4. **Debounce events**
   ```jsx
   const debouncedProgress = useMemo(
     () => debounce(setProgress, 300),
     []
   )
   ```

---

## 🆘 Common Issues & Solutions

### Issue: Toast not showing
```jsx
// ❌ Wrong - hook outside provider
const { addToast } = useToast()

function App() {
  return <ToastProvider>...</ToastProvider>
}

// ✅ Correct - hook inside provider
function App() {
  return (
    <ToastProvider>
      <MyComponent />
    </ToastProvider>
  )
}
```

### Issue: Dark mode not applying
```jsx
// ❌ Wrong - missing provider
<div className="dark:bg-gray-900">...</div>

// ✅ Correct - with provider
<ThemeProvider>
  <div className="dark:bg-gray-900">...</div>
</ThemeProvider>
```

### Issue: Loading animation stuttering
```css
/* ✅ Add GPU acceleration */
.spinner {
  will-change: transform;
  transform: translateZ(0);
}
```

---

## 📖 Additional Resources

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [React Hooks Documentation](https://react.dev/reference/react)
- [Testing Library](https://testing-library.com/)

---

**Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Production Ready ✅
