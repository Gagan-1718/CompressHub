'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function FileSizeComparisonChart({ metrics }) {
  if (!metrics?.file_sizes) return null

  const { original_bytes, compressed_bytes, original_formatted, compressed_formatted } = metrics.file_sizes

  // Convert to MB for display
  const originalMB = (original_bytes / (1024 * 1024)).toFixed(2)
  const compressedMB = (compressed_bytes / (1024 * 1024)).toFixed(2)

  const data = {
    labels: ['File Size'],
    datasets: [
      {
        label: `Original (${original_formatted})`,
        data: [parseFloat(originalMB)],
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: `Compressed (${compressed_formatted})`,
        data: [parseFloat(compressedMB)],
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12, weight: 'bold' },
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Original vs Compressed Size (MB)',
        font: { size: 14, weight: 'bold' },
        padding: { bottom: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.x.toFixed(2)} MB`
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        ticks: {
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        ticks: {
          font: { size: 12, weight: 'bold' },
        },
      },
    },
  }

  return (
    <div className="card h-full flex flex-col">
      <Bar data={data} options={options} />
    </div>
  )
}
