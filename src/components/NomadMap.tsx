// src/components/NomadMap.tsx

"use client";
import React, { useEffect, useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

// Adjust path to your JSON data
import rawCitiesData from '../../csvjson.json';

// TopoJSON world map URL
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Median US nomad salary (monthly) - baseline for arbitrage calculation
const MEDIAN_US_NOMAD_SALARY = 3000; // $3,000/month

// Arbitrage thresholds
const EXPENSIVE_THRESHOLD = 0.8;
const ARBITRAGE_THRESHOLD = 1.5;

// Available colorblind modes
type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'monochromacy';

// Add a new type for visualization mode
type VisualizationMode = 'size' | 'color' | 'opacity';
type AttributeKey = 'nomad_score' | 'internet_speed' | 'cost_nomad' | 'safety' | 'life_score' | 'friendly_to_foreigners' | 'freedom_score' | 'arbitrage_index';

// Strongly typed city interface
interface NomadCity {
  id: string;
  place: string;
  country: string;
  latitude: number;
  longitude: number;
  nomad_score: number;
  internet_speed: number;
  cost_nomad?: number;
  safety?: number;
  life_score?: number;
  friendly_to_foreigners?: number;
  freedom_score?: number;
  arbitrage_index?: number;
}

// Fixed type definition for Geography objects
interface GeographyType {
  rsmKey: string;
  properties: {
    NAME: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any[];
  };
}

const NomadMap: React.FC = () => {
  const [cities, setCities] = useState<NomadCity[]>([]);
  const [tooltipHtml, setTooltipHtml] = useState<string>("");
  const [highlightCountry, setHighlightCountry] = useState<string | null>(null);
  
  // State for visualization controls
  const [sizeAttribute, setSizeAttribute] = useState<AttributeKey>('nomad_score');
  const [colorAttribute, setColorAttribute] = useState<AttributeKey>('arbitrage_index');
  const [opacityAttribute, setOpacityAttribute] = useState<AttributeKey>('internet_speed');
  
  // Colorblind mode state
  const [colorblindMode, setColorblindMode] = useState<ColorblindMode>('none');

  // Min/Max arbitrage values
  const [arbitrageRange, setArbitrageRange] = useState<{min: number, max: number}>({min: 0, max: 0});

  useEffect(() => {
    const validCities: NomadCity[] = (rawCitiesData as any[])
      .filter(item => {
        // Basic validation to make sure we have both place name and coordinates
        const place = item.places_to_work;
        if (typeof place !== 'string' || !place.trim() || place.includes('DotMap')) return false;
        const lat = parseFloat(item.leisure);
        const lon = parseFloat(item.nightlife);
        return Number.isFinite(lat) && Number.isFinite(lon);
      })
      .map((item, idx) => {
        const place = item.places_to_work.trim();
        const latitude = parseFloat(item.leisure);
        const longitude = parseFloat(item.nightlife);
        const nomad = parseFloat(item.nomad_score || item.nomadScore) || 0;
        const internet = parseFloat(item.internet_speed) || 0;
        
        // Parse additional attributes, ensuring they're valid numbers
        const cost = typeof item.cost_nomad === 'number' ? item.cost_nomad : 
                    !isNaN(parseFloat(String(item.cost_nomad))) ? parseFloat(String(item.cost_nomad)) : undefined;
        
        // Calculate arbitrage index if cost_nomad is valid
        const arbitrage = cost && cost > 0 ? MEDIAN_US_NOMAD_SALARY / cost : undefined;
        
        const safety = typeof item.safety === 'number' ? item.safety : 
                      !isNaN(parseFloat(String(item.safety))) ? parseFloat(String(item.safety)) : undefined;
        
        const life = typeof item.life_score === 'number' ? item.life_score : 
                    !isNaN(parseFloat(String(item.life_score))) ? parseFloat(String(item.life_score)) : undefined;
        
        const friendly = typeof item.friendly_to_foreigners === 'number' ? item.friendly_to_foreigners : 
                        !isNaN(parseFloat(String(item.friendly_to_foreigners))) ? parseFloat(String(item.friendly_to_foreigners)) : undefined;
        
        const freedom = typeof item.freedom_score === 'number' ? item.freedom_score : 
                        !isNaN(parseFloat(String(item.freedom_score))) ? parseFloat(String(item.freedom_score)) : undefined;

        return {
          id: `city-${idx}-${place.replace(/[^a-zA-Z0-9]/g, '-')}`,
          place,
          country: typeof item.country === 'string' && item.country.trim() && item.country.trim() !== 'Unknown'
            ? item.country.trim()
            : '',
          latitude,
          longitude,
          nomad_score: nomad,
          internet_speed: internet,
          cost_nomad: cost,
          arbitrage_index: arbitrage, // Add arbitrage index
          safety: safety,
          life_score: life,
          friendly_to_foreigners: friendly,
          freedom_score: freedom,
        };
      });

    console.log('Loaded cities:', validCities.length);
    
    // Calculate min/max arbitrage values
    const arbitrageValues = validCities
      .map(city => city.arbitrage_index)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0);
    
    if (arbitrageValues.length > 0) {
      const min = Math.min(...arbitrageValues);
      const max = Math.max(...arbitrageValues);
      setArbitrageRange({min, max});
    }
    
    setCities(validCities);
  }, []);

  // Calculate min/max for each attribute
  const attributeRanges = useMemo(() => {
    if (!cities.length) return {};
    
    const calculateRange = (attr: AttributeKey) => {
      const values = cities
        .map(c => c[attr])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));
      
      if (!values.length) return { min: 0, max: 1, median: 0.5 };
      
      values.sort((a, b) => a - b);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const median = values[Math.floor(values.length / 2)];
      
      return { min, max, median };
    };
    
    return {
      nomad_score: calculateRange('nomad_score'),
      internet_speed: calculateRange('internet_speed'),
      cost_nomad: calculateRange('cost_nomad'),
      arbitrage_index: calculateRange('arbitrage_index'),
      safety: calculateRange('safety'),
      life_score: calculateRange('life_score'),
      friendly_to_foreigners: calculateRange('friendly_to_foreigners'),
      freedom_score: calculateRange('freedom_score')
    };
  }, [cities]);

  // Helper function to normalize a value within a range
  const normalizeValue = (value: number | undefined, attr: AttributeKey): number => {
    // If value is undefined or NaN, return a default value
    if (value === undefined || isNaN(value) || !attributeRanges[attr]) return 0.5;
    
    const { min, max } = attributeRanges[attr];
    // If min equals max, avoid division by zero
    if (max === min) return 0.5;
    
    // Special handling for cost_nomad (use median for better distribution)
    if (attr === 'cost_nomad') {
      const { median } = attributeRanges[attr];
      // For cost, lower is better (higher normalized value)
      return value < median 
        ? 0.5 + (median - value) / (median - min) * 0.5 
        : (max - value) / (max - median) * 0.5;
    }
    
    // Special handling for arbitrage_index
    if (attr === 'arbitrage_index') {
      // For arbitrage, higher is better (1.0 or more is good)
      // Use EXPENSIVE_THRESHOLD and ARBITRAGE_THRESHOLD for coloring
      if (value < EXPENSIVE_THRESHOLD) {
        // Below 0.8: remap to 0.0-0.33
        return Math.max(0, Math.min(0.33, value / EXPENSIVE_THRESHOLD * 0.33));
      } else if (value < ARBITRAGE_THRESHOLD) {
        // Between 0.8 and 1.5: remap to 0.33-0.66
        return 0.33 + Math.min(0.33, (value - EXPENSIVE_THRESHOLD) / (ARBITRAGE_THRESHOLD - EXPENSIVE_THRESHOLD) * 0.33);
      } else {
        // Above 1.5: remap to 0.66-1.0
        // Cap at max to avoid extreme values dominating the scale
        const cappedValue = Math.min(value, max);
        return 0.66 + Math.min(0.34, (cappedValue - ARBITRAGE_THRESHOLD) / (max - ARBITRAGE_THRESHOLD) * 0.34);
      }
    }
    
    // Return normalized value, ensuring it's between 0 and 1
    const normalized = (value - min) / (max - min);
    return Math.max(0, Math.min(1, normalized));
  };
  
  // Get color based on attribute value and colorblind mode
  const getAttributeColor = (value: number | undefined, attr: AttributeKey): string => {
    const normalized = normalizeValue(value, attr);
    
    // Special color scheme for arbitrage index
    if (attr === 'arbitrage_index') {
      // Different color schemes based on colorblind mode
      switch(colorblindMode) {
        case 'deuteranopia': 
        case 'protanopia':
          // Blue to Yellow scheme (better for red-green deficiency)
          if (normalized < 0.33) {
            // Dark blue (expensive) to medium blue
            return `rgb(25, 25, ${Math.round(100 + normalized * 3 * 155)})`;
          } else if (normalized < 0.66) {
            // Medium blue to light blue/white
            const factor = (normalized - 0.33) * 3;
            return `rgb(${Math.round(25 + factor * 230)}, ${Math.round(25 + factor * 230)}, 255)`;
          } else {
            // Light blue/white to yellow (arbitrage)
            const factor = (normalized - 0.66) * 3;
            return `rgb(255, 255, ${Math.round(255 - factor * 210)})`;
          }
          
        case 'tritanopia':
          // Purple to Orange scheme (better for blue deficiency)
          if (normalized < 0.33) {
            // Purple (expensive)
            return `rgb(${Math.round(100 + normalized * 3 * 155)}, 50, ${Math.round(100 + normalized * 3 * 155)})`;
          } else if (normalized < 0.66) {
            // Purple to white
            const factor = (normalized - 0.33) * 3;
            return `rgb(${Math.round(255 - factor * 50)}, ${Math.round(50 + factor * 205)}, ${Math.round(255 - factor * 50)})`;
          } else {
            // White to orange (arbitrage)
            const factor = (normalized - 0.66) * 3;
            return `rgb(255, ${Math.round(255 - factor * 120)}, 50)`;
          }
          
        case 'monochromacy':
          // Pure grayscale with patterns
          const grayVal = Math.round(normalized * 220);
          return `rgb(${grayVal}, ${grayVal}, ${grayVal})`;
          
        default:
          // Original colorful scheme: Red → Orange → Yellow → Green
          if (normalized < 0.33) {
            // Below EXPENSIVE_THRESHOLD: Red to Orange (0 to 30 hue)
            const hue = normalized * 3 * 30;
            return `hsla(${hue}, 90%, 50%, 1)`;
          } else if (normalized < 0.66) {
            // Between thresholds: Orange to Yellow (30 to 60 hue)
            const hue = 30 + (normalized - 0.33) * 3 * 30;
            return `hsla(${hue}, 90%, 50%, 1)`;
          } else {
            // Above ARBITRAGE_THRESHOLD: Yellow to Green (60 to 120 hue)
            const hue = 60 + (normalized - 0.66) * 3 * 60;
            return `hsla(${hue}, 90%, 50%, 1)`;
          }
      }
    }
    
    // Other attributes
    if (attr === 'cost_nomad') {
      // Cost: lower is better
      switch(colorblindMode) {
        case 'deuteranopia':
        case 'protanopia':
          // Blue (low cost) to Yellow (high cost) for red-green deficiency
          return `rgb(${Math.round(normalized * 255)}, ${Math.round(normalized * 255)}, ${Math.round(255 - normalized * 255)})`;
          
        case 'tritanopia':
          // Purple (low cost) to Orange (high cost) for blue deficiency
          return `rgb(${Math.round(150 + normalized * 105)}, ${Math.round(50 + normalized * 130)}, ${Math.round(200 - normalized * 150)})`;
          
        case 'monochromacy':
          // Light (low cost) to Dark (high cost)
          const val = Math.round(220 - normalized * 180);
          return `rgb(${val}, ${val}, ${val})`;
          
        default:
          // Original: Green (low) to Red (high)
          const hue = 120 - normalized * 120;
          return `hsla(${hue}, 70%, 50%, 1)`;
      }
    } else {
      // Everything else: higher is better
      switch(colorblindMode) {
        case 'deuteranopia':
        case 'protanopia':
          // Yellow (high value) to Blue (low value) for red-green deficiency
          return `rgb(${Math.round(normalized * 255)}, ${Math.round(normalized * 255)}, ${Math.round(255 - normalized * 200)})`;
          
        case 'tritanopia':
          // Orange (high value) to Purple (low value) for blue deficiency
          return `rgb(${Math.round(150 + normalized * 105)}, ${Math.round(normalized * 180)}, ${Math.round(150 - normalized * 100)})`;
          
        case 'monochromacy':
          // Light (high value) to Dark (low value)
          const val = Math.round(40 + normalized * 180);
          return `rgb(${val}, ${val}, ${val})`;
          
        default:
          // Original: Red (low) to Green (high)
          const hue = normalized * 120;
          return `hsla(${hue}, 70%, 50%, 1)`;
      }
    }
  };
  
  // Get size based on attribute value
  const getAttributeSize = (value: number | undefined, attr: AttributeKey): number => {
    // Default size if value is invalid
    if (value === undefined || isNaN(value)) return 3;
    
    const normalized = normalizeValue(value, attr);
    // Base size 3, maximum size 12
    return 3 + normalized * 9;
  };

  // Get opacity based on attribute value
  const getAttributeOpacity = (value: number | undefined, attr: AttributeKey): number => {
    const normalized = normalizeValue(value, attr);
    // Ensure minimum opacity for visibility
    return 0.2 + normalized * 0.8;
  };

  // Enhanced marker rendering with patterns for extra colorblind accessibility
  const renderMarker = (city: NomadCity) => {
    const circleSize = getAttributeSize(city[sizeAttribute], sizeAttribute);
    const circleColor = getAttributeColor(city[colorAttribute], colorAttribute);
    const circleOpacity = getAttributeOpacity(city[opacityAttribute], opacityAttribute);
    
    const isMonochrome = colorblindMode === 'monochromacy';
    const isArbitrage = colorAttribute === 'arbitrage_index' && 
                        city.arbitrage_index !== undefined && 
                        city.arbitrage_index >= ARBITRAGE_THRESHOLD;
    const isExpensive = colorAttribute === 'arbitrage_index' && 
                        city.arbitrage_index !== undefined && 
                        city.arbitrage_index < EXPENSIVE_THRESHOLD;
                        
    // Add patterns for monochrome mode
    let patternStroke = "none";
    let patternStrokeWidth = 0;
    let pattern = null;
    
    if (isMonochrome && colorAttribute === 'arbitrage_index') {
      if (isArbitrage) {
        patternStroke = "#000";
        patternStrokeWidth = 0.5;
        pattern = (
          <pattern
            id={`pattern-${city.id}`}
            width="4" 
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="4" stroke="#000" strokeWidth="2" />
          </pattern>
        );
      } else if (isExpensive) {
        patternStroke = "#000";  
        patternStrokeWidth = 0.5;
        pattern = (
          <pattern
            id={`pattern-${city.id}`}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="#000" />
          </pattern>
        );
      }
    }
    
    return (
      <Marker
        key={city.id}
        coordinates={[city.longitude, city.latitude]}
        onMouseEnter={() => {
          setTooltipHtml(makeTooltip(city));
          setHighlightCountry(city.country || null);
        }}
        onMouseLeave={() => {
          setTooltipHtml('');
          setHighlightCountry(null);
        }}
      >
        {pattern && <defs>{pattern}</defs>}
        <circle
          r={circleSize}
          fill={pattern ? `url(#pattern-${city.id})` : circleColor}
          fillOpacity={circleOpacity}
          stroke={patternStroke}
          strokeWidth={patternStrokeWidth}
          style={{ cursor: 'pointer', transition: '0.2s' }}
          data-tooltip-id="nomad-tooltip"
        />
        <circle 
          r={circleSize} 
          fill={pattern ? circleColor : "none"}
          fillOpacity={pattern ? circleOpacity : 0}
          stroke="#333"
          strokeWidth={0.5}
          style={{ cursor: 'pointer' }}
        />
      </Marker>
    );
  };

  // Build tooltip HTML with colorblind adaptations
  const makeTooltip = (c: NomadCity) => {
    const lines: string[] = [];
    lines.push(`<strong>${c.place}</strong>`);
    if (c.country) lines.push(`<em>${c.country}</em>`);
    lines.push(`<div style="margin-top:4px; font-size:0.9em;">`);
    
    // Add arbitrage index to tooltip with appropriate formatting for colorblind mode
    if (c.arbitrage_index != null) {
      let arbitrageColor = 'red';
      let arbitrageLabel = 'Expensive';
      
      // Adjust colors for colorblind mode in tooltip
      if (colorblindMode === 'deuteranopia' || colorblindMode === 'protanopia') {
        arbitrageColor = c.arbitrage_index >= ARBITRAGE_THRESHOLD ? 'gold' : 
                        c.arbitrage_index >= EXPENSIVE_THRESHOLD ? 'lightblue' : 'blue';
      } else if (colorblindMode === 'tritanopia') {
        arbitrageColor = c.arbitrage_index >= ARBITRAGE_THRESHOLD ? 'orange' : 
                        c.arbitrage_index >= EXPENSIVE_THRESHOLD ? 'lightgray' : 'purple';
      } else if (colorblindMode === 'monochromacy') {
        arbitrageColor = c.arbitrage_index >= ARBITRAGE_THRESHOLD ? 'white' : 
                        c.arbitrage_index >= EXPENSIVE_THRESHOLD ? 'lightgray' : 'gray';
      } else {
        arbitrageColor = c.arbitrage_index >= ARBITRAGE_THRESHOLD ? 'green' : 
                        c.arbitrage_index >= EXPENSIVE_THRESHOLD ? 'orange' : 'red';
      }
      
      if (c.arbitrage_index >= ARBITRAGE_THRESHOLD) {
        arbitrageLabel = 'Arbitrage';
      } else if (c.arbitrage_index >= EXPENSIVE_THRESHOLD) {
        arbitrageLabel = 'Breakeven';
      }
      
      lines.push(`<span style="font-weight:bold; color:${arbitrageColor}">Arbitrage Index: ${c.arbitrage_index.toFixed(2)}x (${arbitrageLabel})</span>`);
    }
    
    // Rest of your tooltip content...
    lines.push(`Nomad Score: ${c.nomad_score.toFixed(2)}`);
    lines.push(`Internet: ${c.internet_speed.toFixed(2)}`);
    if (c.cost_nomad != null) lines.push(`Cost: $${Math.round(c.cost_nomad)}/month`);
    if (c.safety != null) lines.push(`Safety: ${c.safety.toFixed(2)}`);
    if (c.life_score != null) lines.push(`Life: ${c.life_score.toFixed(2)}`);
    if (c.friendly_to_foreigners != null) lines.push(`Foreigner Friendly: ${c.friendly_to_foreigners.toFixed(2)}`);
    if (c.freedom_score != null) lines.push(`Freedom Score: ${c.freedom_score.toFixed(2)}`);
    
    lines.push(`</div>`);
    return lines.join('<br/>');
  };

  // Helper function for attribute labels
  const getAttributeLabel = (attr: AttributeKey): string => {
    const labels: Record<AttributeKey, string> = {
      internet_speed: 'Internet Speed',
      safety: 'Safety Score',
      nomad_score: 'Nomad Score',
      life_score: 'Life Quality',
      friendly_to_foreigners: 'Foreigner Friendly',
      cost_nomad: 'Cost of Living ($)',
      freedom_score: 'Freedom Score',
      arbitrage_index: 'Arbitrage Index'
    };
    return labels[attr];
  };

  return (
    <div className="relative h-[700px] w-full border rounded-lg overflow-hidden bg-white">
      <ComposableMap
        projectionConfig={{ 
          scale: 220,
          center: [0, 10],
          rotate: [0, 0, 0]
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          padding: 0,
          margin: 0
        }}
        data-tooltip-id="nomad-tooltip"
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: GeographyType[] }) => (
            geographies
              .filter(geo => geo.properties.NAME !== 'Antarctica')
              .map((geo) => {
                const isOn = geo.properties.NAME === highlightCountry;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isOn ? '#9FE2BF' : '#E0E0E0'}
                    stroke="#FFF"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover:  { fill: '#C0C0C0', outline: 'none' },
                    }}
                  />
                );
              })
          )}
        </Geographies>

        {cities.map(city => renderMarker(city))}
      </ComposableMap>

      {/* Dynamic Legend & Controls */}
      <div className="absolute top-2 right-2 bg-white bg-opacity-95 p-3 rounded-lg text-sm text-black shadow-md max-w-xs">
        <div className="font-semibold text-black mb-3 text-center">Visualization Controls</div>
        
        {/* Colorblind Mode Control */}
        <div className="mb-3 border-b pb-2">
          <div className="font-medium mb-1">Colorblind Mode:</div>
          <select 
            value={colorblindMode}
            onChange={(e) => setColorblindMode(e.target.value as ColorblindMode)}
            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
          >
            <option value="none">Standard Colors</option>
            <option value="deuteranopia">Deuteranopia (Red-Green)</option>
            <option value="protanopia">Protanopia (Red-Green)</option>
            <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
            <option value="monochromacy">Monochromacy (Grayscale)</option>
          </select>
        </div>
        
        {/* Size Control */}
        <div className="mb-3 border-b pb-2">
          <div className="font-medium mb-1">Circle Size by:</div>
          <select 
            value={sizeAttribute}
            onChange={(e) => setSizeAttribute(e.target.value as AttributeKey)}
            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
          >
            <option value="nomad_score">Nomad Score</option>
            <option value="internet_speed">Internet Speed</option>
            <option value="cost_nomad">Cost of Living</option>
            <option value="arbitrage_index">Arbitrage Index</option>
            <option value="safety">Safety</option>
            <option value="life_score">Life Quality</option>
            <option value="friendly_to_foreigners">Foreigner Friendly</option>
            <option value="freedom_score">Freedom Score</option>
          </select>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center">
              <svg width="12" height="12"><circle cx="6" cy="6" r="3" fill="gray" /></svg>
              <span className="ml-1 text-xs">Low</span>
            </div>
            <div className="flex items-center">
              <svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="gray" /></svg>
              <span className="ml-1 text-xs">High</span>
            </div>
          </div>
        </div>
        
        {/* Color Control with Colorblind-Friendly Legend */}
        <div className="mb-3 border-b pb-2">
          <div className="font-medium mb-1">Circle Color by:</div>
          <select 
            value={colorAttribute}
            onChange={(e) => setColorAttribute(e.target.value as AttributeKey)}
            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
          >
            <option value="arbitrage_index">Arbitrage Index</option>
            <option value="cost_nomad">Cost of Living</option>
            <option value="nomad_score">Nomad Score</option>
            <option value="internet_speed">Internet Speed</option>
            <option value="safety">Safety</option>
            <option value="life_score">Life Quality</option>
            <option value="friendly_to_foreigners">Foreigner Friendly</option>
            <option value="freedom_score">Freedom Score</option>
          </select>
          <div className="h-3 w-full mt-1">
            {colorAttribute === 'arbitrage_index' ? (
              colorblindMode === 'deuteranopia' || colorblindMode === 'protanopia' ? (
                <div className="h-full" style={{background: 'linear-gradient(to right, blue, lightblue, yellow)'}}></div>
              ) : colorblindMode === 'tritanopia' ? (
                <div className="h-full" style={{background: 'linear-gradient(to right, purple, white, orange)'}}></div>
              ) : colorblindMode === 'monochromacy' ? (
                <div className="h-full" style={{background: 'linear-gradient(to right, #333, #AAA, #FFF)'}}></div>
              ) : (
                <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded"></div>
              )
            ) : colorAttribute === 'cost_nomad' ? (
              colorblindMode === 'deuteranopia' || colorblindMode === 'protanopia' ? (
                <div className="h-full" style={{background: 'linear-gradient(to right, blue, yellow)'}}></div>
              ) : colorblindMode === 'tritanopia' ? (
                <div className="h-full" style={{background: 'linear-gradient(to right, purple, orange)'}}></div>
              ) : colorblindMode === 'monochromacy' ? (
                <div className="h-full" style={{background: 'linear-gradient(to right, white, black)'}}></div>
              ) : (
                <div className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded"></div>
              )
            ) : (
              colorblindMode === 'deuteranopia' || colorblindMode === 'protanopia' ? (
                <div className="h-full" style={{background: 'linear-gradient(to right, blue, yellow)'}}></div>
              ) : colorblindMode === 'tritanopia' ? (
                <div className="h-full" style={{background: 'linear-gradient(to right, purple, orange)'}}></div>
              ) : colorblindMode === 'monochromacy' ? (
                <div className="h-full" style={{background: 'linear-gradient(to right, black, white)'}}></div>
              ) : (
                <div className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded"></div>
              )
            )}
          </div>
          <div className="flex justify-between text-xs">
            {colorAttribute === 'arbitrage_index' ? (
              <>
                <span>{"< "+EXPENSIVE_THRESHOLD+"x"}</span>
                <span>{EXPENSIVE_THRESHOLD+"–"+ARBITRAGE_THRESHOLD+"x"}</span>
                <span>{"> "+ARBITRAGE_THRESHOLD+"x"}</span>
              </>
            ) : colorAttribute === 'cost_nomad' ? (
              <>
                <span>Lower</span>
                <span>Higher</span>
              </>
            ) : (
              <>
                <span>Poor</span>
                <span>Better</span>
              </>
            )}
          </div>
        </div>
        
        {/* Opacity Control */}
        <div className="mb-2">
          <div className="font-medium mb-1">Circle Opacity by:</div>
          <select 
            value={opacityAttribute}
            onChange={(e) => setOpacityAttribute(e.target.value as AttributeKey)}
            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
          >
            <option value="internet_speed">Internet Speed</option>
            <option value="nomad_score">Nomad Score</option>
            <option value="cost_nomad">Cost of Living</option>
            <option value="arbitrage_index">Arbitrage Index</option>
            <option value="safety">Safety</option>
            <option value="life_score">Life Quality</option>
            <option value="friendly_to_foreigners">Foreigner Friendly</option>
            <option value="freedom_score">Freedom Score</option>
          </select>
          <div className="h-3 w-full bg-gradient-to-r from-gray-100 to-gray-800 mt-1 rounded"></div>
          <div className="flex justify-between text-xs">
            <span>Transparent</span>
            <span>Opaque</span>
          </div>
        </div>
      </div>

      {/* Arbitrage Index Legend with Colorblind Adaptations */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 p-3 rounded-lg text-sm shadow-md">
        <div className="font-semibold text-black mb-1">
          Arbitrage Index
          {colorblindMode !== 'none' && <span className="ml-2 text-xs bg-blue-100 px-1 py-0.5 rounded">Colorblind Mode: {colorblindMode}</span>}
        </div>
        <p className="text-xs mb-2 text-black">
          How far a $3,000/mo US salary stretches
          <span className="block mt-1 text-black">
            Min: {arbitrageRange.min.toFixed(2)}x · Max: {arbitrageRange.max.toFixed(2)}x
          </span>
        </p>
        
        {colorblindMode === 'monochromacy' ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white"></div>
              </div>
              <span className="text-xs text-black">&lt; {EXPENSIVE_THRESHOLD}x (Expensive)</span>
            </div>
            <div className="flex items-center text-black gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <span className="text-xs text-black">{EXPENSIVE_THRESHOLD}–{ARBITRAGE_THRESHOLD}x (Breakeven)</span>
            </div>
            <div className="flex text-black items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-100" style={{backgroundImage: 'linear-gradient(45deg, #999 25%, transparent 25%, transparent 50%, #999 50%, #999 75%, transparent 75%, transparent)', backgroundSize: '4px 4px'}}></div>
              <span className="text-xs text-black">&gt; {ARBITRAGE_THRESHOLD}x (Arbitrage)</span>
            </div>
          </>
        ) : colorblindMode === 'deuteranopia' || colorblindMode === 'protanopia' ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'blue' }}></div>
              <span className="text-xs text-black">&lt; {EXPENSIVE_THRESHOLD}x (Expensive)</span>
            </div>
            <div className="flex items-center text-black gap-2 mb-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'lightblue' }}></div>
              <span className="text-xs text-black">{EXPENSIVE_THRESHOLD}–{ARBITRAGE_THRESHOLD}x (Breakeven)</span>
            </div>
            <div className="flex text-black items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'yellow' }}></div>
              <span className="text-xs text-black">&gt; {ARBITRAGE_THRESHOLD}x (Arbitrage)</span>
            </div>
          </>
        ) : colorblindMode === 'tritanopia' ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'purple' }}></div>
              <span className="text-xs text-black">&lt; {EXPENSIVE_THRESHOLD}x (Expensive)</span>
            </div>
            <div className="flex items-center text-black gap-2 mb-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'white', border: '1px solid #ccc' }}></div>
              <span className="text-xs text-black">{EXPENSIVE_THRESHOLD}–{ARBITRAGE_THRESHOLD}x (Breakeven)</span>
            </div>
            <div className="flex text-black items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'orange' }}></div>
              <span className="text-xs text-black">&gt; {ARBITRAGE_THRESHOLD}x (Arbitrage)</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(0, 90%, 50%)' }}></div>
              <span className="text-xs text-black">&lt; {EXPENSIVE_THRESHOLD}x (Expensive)</span>
            </div>
            <div className="flex items-center text-black gap-2 mb-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(60, 90%, 50%)' }}></div>
              <span className="text-xs text-black">{EXPENSIVE_THRESHOLD}–{ARBITRAGE_THRESHOLD}x (Breakeven)</span>
            </div>
            <div className="flex text-black items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(120, 90%, 50%)' }}></div>
              <span className="text-xs text-black">&gt; {ARBITRAGE_THRESHOLD}x (Arbitrage)</span>
            </div>
          </>
        )}

        {/* Help text for patterns in monochrome mode */}
        {colorblindMode === 'monochromacy' && (
          <div className="mt-2 text-xs text-gray-600">
            <p>High-value areas also use patterns for better distinction</p>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <Tooltip
        id="nomad-tooltip"
        html={tooltipHtml}
        place="top"
        noArrow
        style={{
          background: 'rgba(30,30,30,0.9)',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '4px',
          maxWidth: '240px',
          lineHeight: 1.4,
          fontSize: '0.9em',
          zIndex: 1000
        }}
      />
    </div>
  );
};

export default NomadMap;
