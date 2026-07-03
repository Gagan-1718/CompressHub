# Quick Reference - UI Components & Utilities

## 🎯 At a Glance

### 1. Dark Mode Toggle
```jsx
import ThemeToggle from '@/components/ThemeToggle'

// In Header component
<ThemeToggle />
```
- Saves preference to localStorage
- 300ms smooth transition
- Works with system preference

---

### 2. Show Loading Overlay
```jsx
import LoadingOverlay from '@/components/LoadingOverlay'
import { useState } from 'react'

export function MyComponent() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  return (
    <>
      <LoadingOverlay 
        isVisible={isLoading}
        message="Processing..."
        progress={progress}
      />
      <button onClick={() => setIsLoading(true)}>
        Start
      </button>
    </>
  )
}
```

---

### 3. Toast Notifications
```jsx
import { useToast } from '@/components/Toast'

export function MyComponent() {
  const { addToast } = useToast()

  const handleSuccess = () => {
    addToast('Done! Saved 45%', 'success')
  }

  const handleError = () => {
    addToast('Error: File too large', 'error')
  }

  return (
    <>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
    </>
  )
}
```

**Toast Types:** `success` | `error` | `warning` | `info`

---

### 4. Loading Indicators
```jsx
import LoadingSpinner from '@/components/LoadingSpinner'
import SkeletonLoader from '@/components/SkeletonLoader'
import ProgressBar from '@/components/ProgressBar'

// Spinner
<LoadingSpinner size="md" text="Loading..." />

// Skeleton (shimmer)
<SkeletonLoader count={3} height="h-20" />

// Progress bar
<ProgressBar progress={65} label="Uploading..." />
```

---

### 5. Error Display
```jsx
{error && (
  <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200">
    <p className="font-semibold">Error</p>
    <p>{error}</p>
  </div>
)}
```

---

### 6. Dark Mode Class Names
```jsx
// Apply to any element
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-white">
    Content
  </p>
</div>

// With transitions
<div className="bg-white dark:bg-gray-900 transition-colors duration-300">
  Smooth theme switch
</div>
```

---

### 7. Smooth Animations
```jsx
// Fade in
<div className="animate-fade-in">Fading in...</div>

// Scale in
<div className="animate-scale-in">Scaling...</div>

// Slide in
<div className="animate-slide-in">Sliding...</div>

// Slow spin
<div className="animate-spin-slow">Loading...</div>
```

---

### 8. Hover Effects
```jsx
// Button hover
<button className="hover:scale-105 hover:shadow-lg transition-transform">
  Hover me
</button>

// Card hover
<div className="hover:shadow-xl hover:scale-105 transition-all">
  Card
</div>

// Color transition
<div className="hover:bg-blue-500 transition-colors">
  Hover color
</div>
```

---

### 9. Responsive Spacing
```jsx
// Responsive padding
<div className="p-4 md:p-6 lg:p-8">
  Content
</div>

// Responsive font
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Heading
</h1>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => <Card key={item.id} />)}
</div>
```

---

## 🎨 Tailwind Classes Reference

### Background Colors
```
bg-white          (light)
bg-gray-50        (light gray)
bg-blue-500       (primary)
bg-red-50         (error light)
bg-green-50       (success light)

dark:bg-gray-900  (dark background)
dark:bg-gray-800  (dark surface)
```

### Text Colors
```
text-gray-900     (light mode dark)
text-gray-500     (light mode gray)
text-blue-600     (primary)
text-red-700      (error)
text-green-600    (success)

dark:text-white   (dark mode light)
dark:text-gray-100 (dark mode text)
```

### Shadows
```
shadow-sm
shadow-md
shadow-lg
shadow-xl
shadow-2xl
```

### Border Colors
```
border-gray-200
border-red-200
border-green-200
border-blue-200

dark:border-gray-700
dark:border-red-700
```

---

## 🔄 Common Patterns

### Alert Box
```jsx
<div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg flex gap-3">
  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-200 flex-shrink-0" />
  <p className="text-yellow-800 dark:text-yellow-200">Warning message</p>
</div>
```

### Success Card
```jsx
<div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
  <h3 className="font-semibold text-green-700 dark:text-green-200">Success!</h3>
  <p className="text-green-600 dark:text-green-300">Operation completed</p>
</div>
```

### Loading State
```jsx
<div className="flex items-center gap-2">
  <LoadingSpinner size="sm" />
  <p>Processing...</p>
</div>
```

### Badge
```jsx
<span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-full text-sm font-semibold">
  Processing
</span>
```

---

## 🎬 Animation Timings

| Effect | Duration | CSS |
|--------|----------|-----|
| Quick | 200ms | `duration-200` |
| Normal | 300ms | `duration-300` |
| Slow | 500ms | `duration-500` |

---

## 🚀 Performance Tips

1. **Use CSS animations** (not JS) for smoothness
2. **Lazy load images** in cards
3. **Debounce form inputs** (300ms)
4. **Use React.memo** for static components
5. **Split large bundles** with code-splitting

---

## 📱 Responsive Breakpoints

```
sm: 640px   (phones)
md: 768px   (tablets)
lg: 1024px  (desktops)
xl: 1280px  (large screens)
2xl: 1536px (extra large)
```

**Usage:**
```jsx
<p className="text-base md:text-lg lg:text-xl">
  Responsive text
</p>
```

---

## 🎯 Common Imports

```javascript
// Components
import ThemeToggle from '@/components/ThemeToggle'
import LoadingOverlay from '@/components/LoadingOverlay'
import LoadingSpinner from '@/components/LoadingSpinner'
import SkeletonLoader from '@/components/SkeletonLoader'
import ProgressBar from '@/components/ProgressBar'
import ErrorBoundary from '@/components/ErrorBoundary'

// Hooks
import { useToast } from '@/components/Toast'

// Icons
import { AlertCircle, CheckCircle, XCircle, Moon, Sun } from 'lucide-react'
```

---

## 🔗 Default Layout Setup

```jsx
// app/layout.jsx
'use client'

import { ToastProvider } from '@/components/Toast'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

**Print this for quick reference!** 📋
