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
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function ProcessingTimeChart({ metrics }) {
  if (!metrics?.compression) return null

  const { compression_time_ms, decompression_time_ms } = metrics.compression

  const hasDecompressionTime = decompression_time_ms && decompression_time_ms > 0

  const labels = hasDecompressionTime
    ? ['Compression', 'Decompression']
    : ['Compression']

  const timeData = hasDecompressionTime
    ? [parseFloat(compression_time_ms.toFixed(2)), parseFloat(decompression_time_ms.toFixed(2))]
    : [parseFloat(compression_time_ms.toFixed(2))]

  const data = {
    labels,
    datasets: [
      {
        label: 'Time (milliseconds)',
        data: timeData,
        backgroundColor: [
          '#3B82F6',
          '#8B5CF6',
        ],
        borderColor: [
          '#1E40AF',
          '#6D28D9',
        ],
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
        text: 'Processing Time (ms)',
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
            return `${context.parsed.x.toFixed(2)}ms`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: { size: 11 },
          callback: (value) => `${value.toFixed(0)}ms`,
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
