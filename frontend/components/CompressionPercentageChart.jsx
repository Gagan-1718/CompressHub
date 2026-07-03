'use client'

import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function CompressionPercentageChart({ metrics }) {
  if (!metrics?.compression) return null

  const { percentage } = metrics.compression
  const remaining = 100 - percentage

  const data = {
    labels: [`Space Saved (${percentage.toFixed(2)}%)`, `Original Size (${remaining.toFixed(2)}%)`],
    datasets: [
      {
        data: [parseFloat(percentage.toFixed(2)), parseFloat(remaining.toFixed(2))],
        backgroundColor: ['#10B981', '#E5E7EB'],
        borderColor: ['#059669', '#D1D5DB'],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const options = {
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
        text: 'Compression Efficiency',
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
            return `${context.label}: ${context.parsed}%`
          },
        },
      },
    },
  }

  return (
    <div className="card h-full flex flex-col">
      <Doughnut data={data} options={options} />
    </div>
  )
}
