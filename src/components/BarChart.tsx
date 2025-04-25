'use client';

import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  ChartOptions
} from 'chart.js';
import cities from '../data/processedNomadData';


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

const BarChart = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const validCities = cities.filter(city => 
    city.place && 
    city.cost_nomad !== undefined && 
    city.cost_nomad > 0 &&
    city.nomad_score !== undefined
  );
  
  const topCities = [...validCities]
    .sort((a, b) => (b.nomad_score || 0) - (a.nomad_score || 0))
    .slice(0, 10);
    
  const cityNames = topCities.map((city, index) => city.place || `City ${index}`);
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
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        padding: 10,
        cornerRadius: 4,
        displayColors: true,
        usePointStyle: true
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


  if (!isClient) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-8 h-[400px] flex items-center justify-center">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <Bar data={data} options={options} />
    </div>
  );
};

export default BarChart;