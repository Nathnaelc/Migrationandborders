'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import cities from '../data/processedNomadData';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = () => {
  // Filter for cities with valid cost data
  const validCities = cities.filter(city => 
    city.place && 
    city.cost_nomad !== undefined && 
    city.cost_nomad > 0 &&
    city.nomad_score !== undefined
  );
  
  // Filter to top 10 cities by nomad score
  const topCities = [...validCities]
    .sort((a, b) => (b.nomad_score || 0) - (a.nomad_score || 0))
    .slice(0, 10);
    
  // Extract data for the chart
  const cityNames = topCities.map(city => city.place || `City ${Math.random().toString(36).substr(2, 5)}`);
  const monthlyCosts = topCities.map(city => city.cost_nomad || 0);

  const data = {
    labels: cityNames,
    datasets: [
      {
        label: 'Monthly Cost ($)',
        data: monthlyCosts,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 255, 0.6)',
          'rgba(54, 162, 86, 0.6)',
          'rgba(255, 206, 235, 0.6)',
          'rgba(75, 192, 255, 0.6)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)',
          'rgb(255, 99, 255)',
          'rgb(54, 162, 86)',
          'rgb(255, 206, 235)',
          'rgb(75, 192, 255)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          // Ensure we don't get "DotMap()" in the legend
          generateLabels: function(chart: any) {
            const originalLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            return originalLabels;
          }
        }
      },
      title: {
        display: true,
        text: 'Monthly Living Costs for Top Digital Nomad Cities',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monthly Cost ($)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Cities'
        }
      }
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <Bar data={data} options={options} />
    </div>
  );
};

export default BarChart;