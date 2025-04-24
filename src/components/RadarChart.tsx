'use client';

import { useState } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import cities from '../data/processedNomadData';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const RadarChart = () => {
  // Filter cities that have all required metrics
  const validCities = cities.filter(city => 
    city.place && 
    city.nomad_score !== undefined && 
    city.internet_speed !== undefined && 
    city.safety !== undefined &&
    city.life_score !== undefined && 
    city.friendly_to_foreigners !== undefined
  );
  
  // Get top cities for selection
  const topCities = [...validCities]
    .sort((a, b) => (b.nomad_score || 0) - (a.nomad_score || 0))
    .slice(0, 15)
    .map(city => city.place);
  
  // Start with the top 3 cities selected
  const [selectedCities, setSelectedCities] = useState<string[]>(topCities.slice(0, 3));

  const metrics = ['nomad_score', 'internet_speed', 'safety', 'life_score', 'friendly_to_foreigners'];
  const metricLabels = ['Nomad Score', 'Internet Speed', 'Safety', 'Life Score', 'Friendly to Foreigners'];

  const colors = [
    { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.2)' },
    { border: 'rgb(54, 162, 235)', background: 'rgba(54, 162, 235, 0.2)' },
    { border: 'rgb(255, 206, 86)', background: 'rgba(255, 206, 86, 0.2)' },
    { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.2)' },
    { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.2)' }
  ];

  // Get datasets with unique identifiers for each city
  const getDatasets = () => {
    const datasets = selectedCities
      .map((cityName, index) => {
        const cityData = validCities.find(c => c.place === cityName);
        if (!cityData) return null;

        return {
          label: cityName,
          data: metrics.map(metric => {
            const value = cityData[metric as keyof typeof cityData];
            return typeof value === 'number' ? value : 0;
          }),
          borderColor: colors[index % colors.length].border,
          backgroundColor: colors[index % colors.length].background,
          borderWidth: 2,
        };
      })
      .filter((dataset): dataset is NonNullable<typeof dataset> => dataset !== null);
    
    return datasets;
  };

  const handleCityToggle = (cityName: string) => {
    setSelectedCities(prev => 
      prev.includes(cityName) 
        ? prev.filter(c => c !== cityName)
        : [...prev, cityName]
    );
  };

  const data: ChartData<'radar'> = {
    labels: metricLabels,
    datasets: getDatasets(),
  };

  const options: ChartOptions<'radar'> = {
    scales: {
      r: {
        min: 0,
        max: 1,
        ticks: {
          stepSize: 0.2,
          showLabelBackdrop: false,
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          font: {
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-lg font-semibold mb-4">City Comparison</h3>
      <div className="mb-4 flex flex-wrap gap-2">
        {topCities.map((cityName, index) => (
          <button
            key={`city-button-${index}-${cityName}`}
            className={`px-3 py-1 text-sm rounded-full ${
              selectedCities.includes(cityName)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
            onClick={() => handleCityToggle(cityName)}
          >
            {cityName}
          </button>
        ))}
      </div>
      <div className="w-full h-[400px]">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
};

export default RadarChart;