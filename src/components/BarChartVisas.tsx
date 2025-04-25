'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import Papa from 'papaparse';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface CountryData {
  Country: string;
  Continent: string;
  'Visa Type': string;
  [key: string]: string | number | undefined;
}

interface ContinentInfo {
  name: string;
  totalCountries: number;
  isGlobalNorth: boolean;
  icon: string;
}

const continentData: Record<string, ContinentInfo> = {
  'Europe': { 
    name: 'Europe', 
    totalCountries: 44, 
    isGlobalNorth: true,
    icon: '🇪🇺'
  },
  'North America': { 
    name: 'North America', 
    totalCountries: 23, 
    isGlobalNorth: true,
    icon: '🌎'
  },
  'Asia': { 
    name: 'Asia', 
    totalCountries: 48, 
    isGlobalNorth: false,
    icon: '🌏'
  },
  'South America': { 
    name: 'South America', 
    totalCountries: 12, 
    isGlobalNorth: false,
    icon: '🌎'
  },
  'Oceania': { 
    name: 'Oceania', 
    totalCountries: 14, 
    isGlobalNorth: true,
    icon: '🌏'
  },
  'Africa': { 
    name: 'Africa', 
    totalCountries: 54, 
    isGlobalNorth: false,
    icon: '🌍'
  },
  'Arctic': { 
    name: 'Arctic', 
    totalCountries: 1, 
    isGlobalNorth: true,
    icon: '❄️'
  }
};

// Define visa types for filtering
const visaTypes = {
  all: 'All Nomad Visas',
  premium: 'Premium (Long-Term) Visas',
  freelancer: 'Freelancer Visas'
};

// Sort types for the dropdown
const sortTypes = {
  highestToLowest: 'Highest → Lowest',
  alphabetical: 'Alphabetical',
  globalNorthSouth: 'Global North vs. South'
};

const BarChartVisas = () => {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: any[];
  }>({
    labels: [],
    datasets: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeVisaType, setActiveVisaType] = useState<string>('all');
  const [sortType, setSortType] = useState<string>('highestToLowest');
  const [showPercentages, setShowPercentages] = useState<boolean>(true);
  const [showRatio, setShowRatio] = useState<boolean>(false);
  const [animateChart, setAnimateChart] = useState<boolean>(false);
  
  // Store the processed data for different filtering options
  const [processedData, setProcessedData] = useState<{
    continentCounts: Record<string, number>;
    continentCountries: Record<string, string[]>;
    totalVisaCount: number;
  }>({
    continentCounts: {},
    continentCountries: {},
    totalVisaCount: 0
  });

  const [csvData, setCsvData] = useState<CountryData[]>([]);
  
  useEffect(() => {
    // Fetch the CSV file
    fetch('/GlobalMigrationGuide1.0.csv')
      .then(response => response.text())
      .then(text => {
        // Parse the CSV
        const result = Papa.parse<CountryData>(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });
        
        setCsvData(result.data);
        
        // Process data after CSV is loaded
        if (result.data.length > 0) {
          const processedResults = processVisaData(result.data, activeVisaType);
          setProcessedData(processedResults);
          updateChartData(processedResults, sortType);
        }
      })
      .catch(error => console.error('Error loading CSV:', error));
  }, []);

  const processVisaData = (data: CountryData[], visaType: string) => {
    let filteredCountries;
    
    // Filter based on visa type
    switch(visaType) {
      case 'premium':
        filteredCountries = data.filter(country => 
          country['Visa Type'] && 
          typeof country['Visa Type'] === 'string' && 
          country['Visa Type'].toLowerCase().includes('nomad') &&
          (country['Visa Type'].toLowerCase().includes('golden') || 
           country['Visa Type'].toLowerCase().includes('investor') ||
           country['Visa Type'].toLowerCase().includes('residence'))
        );
        break;
      case 'freelancer':
        filteredCountries = data.filter(country => 
          country['Visa Type'] && 
          typeof country['Visa Type'] === 'string' && 
          country['Visa Type'].toLowerCase().includes('nomad') &&
          (country['Visa Type'].toLowerCase().includes('free') || 
           country['Visa Type'].toLowerCase().includes('digital'))
        );
        break;
      default:
        filteredCountries = data.filter(country => 
          country['Visa Type'] && 
          typeof country['Visa Type'] === 'string' && 
          country['Visa Type'].toLowerCase().includes('nomad')
        );
    }

    // Count nomad visa programs by continent
    const continentCounts: Record<string, number> = {};
    const continentCountries: Record<string, string[]> = {};

    filteredCountries.forEach(country => {
      const continent = country.Continent;
      const countryName = country.Country;
      
      if (continent && countryName) {
        if (!continentCountries[continent]) {
          continentCountries[continent] = [];
        }
        
        // Only add the country if it's not already in the array
        if (!continentCountries[continent].includes(countryName)) {
          continentCountries[continent].push(countryName);
        }
      }
    });

    // Convert arrays to counts
    let totalVisaCount = 0;
    Object.keys(continentCountries).forEach(continent => {
      continentCounts[continent] = continentCountries[continent].length;
      totalVisaCount += continentCounts[continent];
    });

    return { continentCounts, continentCountries, totalVisaCount };
  };

  const updateChartData = (data: {
    continentCounts: Record<string, number>;
    continentCountries: Record<string, string[]>;
    totalVisaCount: number;
  }, sortingMethod: string) => {
    const { continentCounts, totalVisaCount } = data;
    
    const sortedContinents = Object.keys(continentCounts);
    
    // Apply sorting based on selected method
    switch(sortingMethod) {
      case 'highestToLowest':
        sortedContinents.sort((a, b) => continentCounts[b] - continentCounts[a]);
        break;
      case 'alphabetical':
        sortedContinents.sort();
        break;
      case 'globalNorthSouth':
        // First sort by Global North/South, then by count within each group
        sortedContinents.sort((a, b) => {
          const aIsNorth = continentData[a]?.isGlobalNorth || false;
          const bIsNorth = continentData[b]?.isGlobalNorth || false;
          
          if (aIsNorth && !bIsNorth) return -1;
          if (!aIsNorth && bIsNorth) return 1;
          return continentCounts[b] - continentCounts[a];
        });
        break;
    }
    
    // Calculate percentages for each continent
    const percentages = sortedContinents.map(continent => 
      ((continentCounts[continent] / totalVisaCount) * 100).toFixed(1)
    );
    
    // Calculate per-country ratios
    const ratios = sortedContinents.map(continent => {
      const totalCountriesInContinent = continentData[continent]?.totalCountries || 1; // Avoid division by zero
      return (continentCounts[continent] / totalCountriesInContinent).toFixed(2);
    });

    // Calculate the global average for annotation
    const avgVisasPerContinent = (totalVisaCount / sortedContinents.length).toFixed(1);
    
    // Prepare dataset with continent icons
    const labels = sortedContinents.map(continent => {
      const icon = continentData[continent]?.icon || '🌐';
      return `${icon} ${continent}`;
    });
    
    // Using a colorblind-friendly palette
    // Purple to yellow gradient (better for colorblindness)
    const colorScheme = sortedContinents.map(continent => {
      // If showing Global North vs South, use different colors
      if (sortingMethod === 'globalNorthSouth') {
        return continentData[continent]?.isGlobalNorth
          ? 'rgba(106, 81, 163, 0.7)' // Purple for Global North
          : 'rgba(230, 171, 2, 0.7)';  // Yellow for Global South
      }
      
      // Otherwise use a sequential purple scheme
      const index = sortedContinents.indexOf(continent);
      const normalizedIndex = index / Math.max(sortedContinents.length - 1, 1);
      
      // Interpolate between purple and yellow
      const r = Math.round(106 + (230 - 106) * normalizedIndex);
      const g = Math.round(81 + (171 - 81) * normalizedIndex);
      const b = Math.round(163 + (2 - 163) * normalizedIndex);
      
      return `rgba(${r}, ${g}, ${b}, 0.7)`;
    });
    
    // Create primary dataset
    const datasets = [
      {
        label: 'Number of Countries',
        data: sortedContinents.map(continent => continentCounts[continent]),
        backgroundColor: colorScheme,
        borderColor: colorScheme.map(color => color.replace('0.7', '1')),
        borderWidth: 1,
      }
    ];
    
    // Add line for global average if there's enough data
    if (sortedContinents.length > 1) {
      datasets.push({
        label: `Global Average (${avgVisasPerContinent})`,
        data: Array(sortedContinents.length).fill(parseFloat(avgVisasPerContinent)),
        type: 'line' as const,
        borderColor: ['rgba(255, 99, 132, 1)'],
        borderWidth: 2,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
        order: 0
      } as any);
    }
    
    // Set chart data
    setChartData({
      labels,
      datasets
    });
    
    setIsLoading(false);
  };

  // Handle visa type change
  const handleVisaTypeChange = (type: string) => {
    setActiveVisaType(type);
    
    // Filter data based on selected visa type
    const data = csvData as unknown as CountryData[];
    const filteredData = processVisaData(data, type);
    setProcessedData(filteredData);
    
    // Update chart
    updateChartData(filteredData, sortType);
  };
  
  // Handle sort type change
  const handleSortChange = (type: string) => {
    setSortType(type);
    updateChartData(processedData, type);
  };

  // Memorize tooltip data for better performance
  const countryTooltips = useMemo(() => {
    const result: Record<string, string> = {};
    
    Object.keys(processedData.continentCountries).forEach(continent => {
      result[continent] = processedData.continentCountries[continent].join(', ');
    });
    
    return result;
  }, [processedData.continentCountries]);
  
  // Create options for chart with enhanced tooltips
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: animateChart ? 1000 : 0
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribution of Nomad Visa Programs by Continent',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const continent = context.chart.data.labels[index].split(' ').slice(1).join(' ');
            const count = context.raw;
            
            const lines = [];
            
            // Add count
            lines.push(`Countries with nomad visas: ${count}`);
            
            // Add percentage if enabled
            if (showPercentages) {
              const percentage = ((count / processedData.totalVisaCount) * 100).toFixed(1);
              lines.push(`Percentage of global total: ${percentage}%`);
            }
            
            // Add ratio if enabled
            if (showRatio) {
              const totalCountriesInContinent = continentData[continent]?.totalCountries || 1;
              const ratio = (count / totalCountriesInContinent).toFixed(2);
              lines.push(`Ratio of countries with visas: ${ratio} (${count}/${totalCountriesInContinent})`);
            }
            
            // Add Global North/South status
            const isGlobalNorth = continentData[continent]?.isGlobalNorth;
            lines.push(isGlobalNorth ? 'Region: Global North' : 'Region: Global South');
            
            return lines;
          },
          afterLabel: function(context: any) {
            const index = context.dataIndex;
            const continent = context.chart.data.labels[index].split(' ').slice(1).join(' ');
            const countries = processedData.continentCountries[continent] || [];
            
            // If there are countries, show them in tooltip
            if (countries.length) {
              return `Countries: ${countries.join(', ')}`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Countries',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
        ticks: {
          precision: 0
        }
      },
      x: {
        title: {
          display: true,
          text: 'Continent',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        }
      }
    },
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Interactive Controls */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type</label>
          <select
            className="block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none text-black focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={activeVisaType}
            onChange={(e) => handleVisaTypeChange(e.target.value)}
          >
            {Object.entries(visaTypes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            className="block w-full p-2 border text-black border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={sortType}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            {Object.entries(sortTypes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Show Additional Metrics</label>
          <div className="flex gap-3">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600"
                checked={showPercentages}
                onChange={() => setShowPercentages(!showPercentages)}
              />
              <span className="ml-2 text-sm text-gray-700">% of Total</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600"
                checked={showRatio}
                onChange={() => setShowRatio(!showRatio)}
              />
              <span className="ml-2 text-sm text-gray-700">Per-Country Ratio</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Chart and Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-[500px] w-full relative">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading data...</p>
            </div>
          ) : (
            chartData.labels?.length > 0 ? (
              <Bar data={chartData} options={options} />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p>No nomad visa data available.</p>
              </div>
            )
          )}
          
          {/* Additional Information - Annotations */}
          {chartData.labels?.length > 0 && sortType === 'globalNorthSouth' && (
            <div className="absolute top-12 right-12 bg-white bg-opacity-90 p-2 rounded shadow text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full text-black bg-[rgba(106,81,163,0.7)]"></div>
                <span>Global North</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full text-black bg-[rgba(230,171,2,0.7)]"></div>
                <span>Global South</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Detailed stats under the chart */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {showPercentages && (
            <motion.div 
              className="bg-gray-50 p-3 rounded shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="font-medium text-s text-black mb-1">Global Distribution</h4>
              <div className="text-xs text-black space-y-1">
                {chartData.labels?.map((label, i) => {
                  const continent = label.split(' ').slice(1).join(' ');
                  const count = processedData.continentCounts[continent] || 0;
                  const percentage = ((count / processedData.totalVisaCount) * 100).toFixed(1);
                  return (
                    <div key={`pct-${i}`} className="flex justify-between">
                      <span>{continent}</span>
                      <span>{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
          
          {showRatio && (
            <motion.div 
              className="bg-gray-50 p-3 rounded shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-medium text-black text-md mb-1">Visa Program Density Ratio</h4>
              <p className="text-xs text-gray-500 mb-1">Number of countries with nomad visas divided by total countries in continent</p>
              <div className="text-xs space-y-1">
                {chartData.labels?.map((label, i) => {
                  const continent = label.split(' ').slice(1).join(' ');
                  const count = processedData.continentCounts[continent] || 0;
                  const totalCountriesInContinent = continentData[continent]?.totalCountries || 1;
                  const ratio = (count / totalCountriesInContinent).toFixed(2);
                  return (
                    <div key={`ratio-${i}`} className="flex justify-between text-black">
                      <span>{continent}</span>
                      <span>{ratio} ({count}/{totalCountriesInContinent})</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Countries with nomad visas */}
        <motion.div 
          className="mt-4 bg-gray-50 p-3 rounded shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h4 className="font-medium text-black text-md mb-2">Countries with Nomad Visa Programs</h4>
          <div className="grid grid-cols-1 text-black md:grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(processedData.continentCountries).map(([continent, countries]) => (
              <div key={continent} className="text-xs">
                <span className="font-medium text-black">{continent}:</span> {countries.join(', ')}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BarChartVisas;