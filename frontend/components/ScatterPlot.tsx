"use client";

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Scatter } from "react-chartjs-2";

import type { ScatterPoint } from "@/lib/types";

ChartJS.register(
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

interface ScatterPlotProps {
  data: ScatterPoint[];
}

export default function ScatterPlot({
  data,
}: ScatterPlotProps) {
  const chartData = {
    datasets: [
      {
        label: "Predictions",
        data: data.map((point) => ({
          x: point.actual,
          y: point.predicted,
        })),
        pointRadius: 5,
        pointHoverRadius: 7,
        backgroundColor: "#2E7D32",
      },
    ],
  };

  const options: ChartOptions<"scatter"> = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label(context) {
            const point = data[context.dataIndex];

            return [
              `Actual: ${point.actual.toFixed(2)}`,
              `Predicted: ${point.predicted.toFixed(2)}`,
              `Absolute Error: ${point.absolute_error.toFixed(2)}`,
            ];
          },
        },
      },
    },

    scales: {
      x: {
        title: {
          display: true,
          text: "Actual",
        },

        grid: {
          color: "#E5E7EB",
        },
      },

      y: {
        title: {
          display: true,
          text: "Predicted",
        },

        grid: {
          color: "#E5E7EB",
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Scatter
        data={chartData}
        options={options}
      />
    </div>
  );
}