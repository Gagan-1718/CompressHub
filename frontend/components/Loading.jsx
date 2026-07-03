'use client'

import { Loader, CheckCircle } from 'lucide-react'

export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <Loader className={`${sizes[size]} text-primary animate-spin`} />
      {text && (
        <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  )
}

export function SkeletonLoader({ count = 3, height = 'h-20' }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse`}
        ></div>
      ))}
    </div>
  )
}

export function ProgressBar({ progress = 0, label, animated = true }) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </p>
          <span className="text-sm font-semibold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="progress-bar relative overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-full">
        <div
          className={`progress-fill ${animated ? 'transition-all duration-500' : ''}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
    </div>
  )
}

export function LoadingOverlay({ isVisible, message = 'Processing...', progress }) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-10 h-10 text-primary animate-spin" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white text-center">
            {message}
          </p>
          {progress !== undefined && (
            <div className="w-full pt-4">
              <ProgressBar progress={progress} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CompletionState({ isSuccess = true, title, message, onDismiss }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
        <div className="flex flex-col items-center gap-4">
          {isSuccess ? (
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg"></div>
              <CheckCircle className="w-12 h-12 text-green-500 relative" />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg"></div>
              <AlertCircle className="w-12 h-12 text-red-500 relative" />
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
            {message}
          </p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-6 w-full btn btn-primary"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import { AlertCircle } from 'lucide-react'
