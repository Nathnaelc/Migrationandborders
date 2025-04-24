'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import cities from '../data/processedNomadData';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChart = () => {
  // Filter to top 10 cities by nomad score to avoid overcrowding
  const topCities = [...cities]
    .filter(city => city.nomad_score && city.internet_speed && city.cost_nomad)
    .sort((a, b) => (b.nomad_score || 0) - (a.nomad_score || 0))
    .slice(0, 10);
    
  // Extract data for the chart
  const cityNames = topCities.map(city => city.place || `City ${Math.random().toString(36).substr(2, 5)}`);
  const nomadScores = topCities.map(city => city.nomad_score || 0);
  const internetSpeeds = topCities.map(city => city.internet_speed || 0);
  const costs = topCities.map(city => (city.cost_nomad || 0) / 1000); // Scale down for better visualization

  const data = {
    labels: cityNames,
    datasets: [
      {
        label: 'Nomad Score',
        data: nomadScores,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Internet Speed',
        data: internetSpeeds,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Monthly Cost (thousands $)',
        data: costs,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          // This ensures the legend displays the correct labels
          generateLabels: function(chart: any) {
            const originalLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            return originalLabels;
          }
        }
      },
      title: {
        display: true,
        text: 'Digital Nomad City Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <Line options={options} data={data} />
    </div>
  );
};

export default LineChart;