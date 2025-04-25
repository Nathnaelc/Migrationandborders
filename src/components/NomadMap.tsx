import React, { useEffect, useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import HydrationErrorSuppressor from './HydrationErrorSuppressor';
import rawCitiesData from '../../csvjson.json';

// Add a caption prop to the component
interface NomadMapProps {
  caption?: string;
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';


const MEDIAN_US_NOMAD_SALARY = 3000; // $3,000/month

const EXPENSIVE_THRESHOLD = 0.8;
const ARBITRAGE_THRESHOLD = 1.5;

type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'monochromacy';

type VisualizationMode = 'size' | 'color' | 'opacity';
type AttributeKey = 'nomad_score' | 'internet_speed' | 'cost_nomad' | 'safety' | 'life_score' | 'friendly_to_foreigners' | 'freedom_score' | 'arbitrage_index';


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

const NomadMap: React.FC<NomadMapProps> = ({ caption }) => {
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
        
        const cost = typeof item.cost_nomad === 'number' ? item.cost_nomad : 
                    !isNaN(parseFloat(String(item.cost_nomad))) ? parseFloat(String(item.cost_nomad)) : undefined;
        
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
          arbitrage_index: arbitrage,
          safety: safety,
          life_score: life,
          friendly_to_foreigners: friendly,
          freedom_score: freedom,
        };
      });

    
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


  const normalizeValue = (value: number | undefined, attr: AttributeKey): number => {
    if (value === undefined || isNaN(value) || !attributeRanges[attr]) return 0.5;
    
    const { min, max } = attributeRanges[attr];
    if (max === min) return 0.5;
    
    if (attr === 'cost_nomad') {
      const { median } = attributeRanges[attr];
      return value < median 
        ? 0.5 + (median - value) / (median - min) * 0.5 
        : (max - value) / (max - median) * 0.5;
    }
    
    if (attr === 'arbitrage_index') {
      if (value < EXPENSIVE_THRESHOLD) {
        return Math.max(0, Math.min(0.33, value / EXPENSIVE_THRESHOLD * 0.33));
      } else if (value < ARBITRAGE_THRESHOLD) {
        return 0.33 + Math.min(0.33, (value - EXPENSIVE_THRESHOLD) / (ARBITRAGE_THRESHOLD - EXPENSIVE_THRESHOLD) * 0.33);
      } else {
        const cappedValue = Math.min(value, max);
        return 0.66 + Math.min(0.34, (cappedValue - ARBITRAGE_THRESHOLD) / (max - ARBITRAGE_THRESHOLD) * 0.34);
      }
    }
    
    const normalized = (value - min) / (max - min);
    return Math.max(0, Math.min(1, normalized));
  };
  
  const getAttributeColor = (value: number | undefined, attr: AttributeKey): string => {
    const normalized = normalizeValue(value, attr);
    
    if (attr === 'arbitrage_index') {
      switch(colorblindMode) {
        case 'deuteranopia': 
        case 'protanopia':
          if (normalized < 0.33) {
            return `rgb(25, 25, ${Math.round(100 + normalized * 3 * 155)})`;
          } else if (normalized < 0.66) {
            const factor = (normalized - 0.33) * 3;
            return `rgb(${Math.round(25 + factor * 230)}, ${Math.round(25 + factor * 230)}, 255)`;
          } else {
            const factor = (normalized - 0.66) * 3;
            return `rgb(255, 255, ${Math.round(255 - factor * 210)})`;
          }
          
        case 'tritanopia':
          if (normalized < 0.33) {
            return `rgb(${Math.round(100 + normalized * 3 * 155)}, 50, ${Math.round(100 + normalized * 3 * 155)})`;
          } else if (normalized < 0.66) {
            const factor = (normalized - 0.33) * 3;
            return `rgb(${Math.round(255 - factor * 50)}, ${Math.round(50 + factor * 205)}, ${Math.round(255 - factor * 50)})`;
          } else {
            const factor = (normalized - 0.66) * 3;
            return `rgb(255, ${Math.round(255 - factor * 120)}, 50)`;
          }
          
        case 'monochromacy':
          const grayVal = Math.round(normalized * 220);
          return `rgb(${grayVal}, ${grayVal}, ${grayVal})`;
          
        default:
          if (normalized < 0.33) {
            const hue = normalized * 3 * 30;
            return `hsla(${hue}, 90%, 50%, 1)`;
          } else if (normalized < 0.66) {
            const hue = 30 + (normalized - 0.33) * 3 * 30;
            return `hsla(${hue}, 90%, 50%, 1)`;
          } else {
            const hue = 60 + (normalized - 0.66) * 3 * 60;
            return `hsla(${hue}, 90%, 50%, 1)`;
          }
      }
    }
    
    // Other attributes
    if (attr === 'cost_nomad') {
      switch(colorblindMode) {
        case 'deuteranopia':
        case 'protanopia':
          return `rgb(${Math.round(normalized * 255)}, ${Math.round(normalized * 255)}, ${Math.round(255 - normalized * 255)})`;
          
        case 'tritanopia':
          return `rgb(${Math.round(150 + normalized * 105)}, ${Math.round(50 + normalized * 130)}, ${Math.round(200 - normalized * 150)})`;
          
        case 'monochromacy':
          const val = Math.round(220 - normalized * 180);
          return `rgb(${val}, ${val}, ${val})`;
          
        default:
          const hue = 120 - normalized * 120;
          return `hsla(${hue}, 70%, 50%, 1)`;
      }
    } else {
      switch(colorblindMode) {
        case 'deuteranopia':
        case 'protanopia':
          return `rgb(${Math.round(normalized * 255)}, ${Math.round(normalized * 255)}, ${Math.round(255 - normalized * 200)})`;
          
        case 'tritanopia':
          return `rgb(${Math.round(150 + normalized * 105)}, ${Math.round(normalized * 180)}, ${Math.round(150 - normalized * 100)})`;
          
        case 'monochromacy':
          const val = Math.round(40 + normalized * 180);
          return `rgb(${val}, ${val}, ${val})`;
          
        default:
          const hue = normalized * 120;
          return `hsla(${hue}, 70%, 50%, 1)`;
      }
    }
  };
  
  const getAttributeSize = (value: number | undefined, attr: AttributeKey): number => {
    if (value === undefined || isNaN(value)) return 3;
    
    const normalized = normalizeValue(value, attr);
    return 3 + normalized * 9;
  };

  const getAttributeOpacity = (value: number | undefined, attr: AttributeKey): number => {
    const normalized = normalizeValue(value, attr);
    return 0.2 + normalized * 0.8;
  };

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


  const makeTooltip = (c: NomadCity) => {
    const lines: string[] = [];
    lines.push(`<strong style="color: #ffffff; font-size: 1.1em;">${c.place}</strong>`);
    if (c.country) lines.push(`<em style="color: #cccccc;">${c.country}</em>`);
    lines.push(`<div style="margin-top:4px; font-size:0.9em;">`);
    
    if (c.arbitrage_index != null) {
      let arbitrageColor = '#ff5555'; 
      let arbitrageLabel = 'Expensive';
      
      if (colorblindMode === 'deuteranopia' || colorblindMode === 'protanopia') {
        arbitrageColor = c.arbitrage_index >= ARBITRAGE_THRESHOLD ? '#ffff00' : 
                        c.arbitrage_index >= EXPENSIVE_THRESHOLD ? '#00ffff' : 
                        '#0088ff'; 
      } else if (colorblindMode === 'tritanopia') {
        arbitrageColor = c.arbitrage_index >= ARBITRAGE_THRESHOLD ? '#ffa500' : 
                        c.arbitrage_index >= EXPENSIVE_THRESHOLD ? '#ffffff' : 
                        '#ff00ff'; 
      } else if (colorblindMode === 'monochromacy') {
        arbitrageColor = c.arbitrage_index >= ARBITRAGE_THRESHOLD ? '#ffffff' :
                        c.arbitrage_index >= EXPENSIVE_THRESHOLD ? '#bbbbbb' :
                        '#777777'; 
      } else {
        arbitrageColor = c.arbitrage_index >= ARBITRAGE_THRESHOLD ? '#55ff55' :
                        c.arbitrage_index >= EXPENSIVE_THRESHOLD ? '#ffaa00' :
                        '#ff5555'; 
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
    <HydrationErrorSuppressor>
      <div className="w-full md:w-[95vw] h-[1000px] max-w-none relative left-1/2 right-1/2 transform -translate-x-1/2 mb-20">
        {/* Title */}
        <div className="pt-6 pb-2 text-center">
          <h2 className="text-2xl font-bold mb-1 text-gray-900">Global Digital Nomad City Map</h2>
        </div>
        <div className="w-full h-[820px] bg-white border rounded-lg overflow-hidden px-4 md:px-8 xl:px-12">
          <ComposableMap
            projectionConfig={{ 
              scale: 230,
              center: [10, 10],
              rotate: [0, 0, 0]
            }}
            style={{ 
              width: '100%',
              height: '100%',
              minWidth: '100%', 
              minHeight: '700px',
              maxWidth: '100%',
              display: 'block',
            }}
            data-tooltip-id="nomad-tooltip"
            className="w-full h-full"
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
                          hover: { 
                            fill: '#C0C0C0', 
                            outline: 'none',
                            stroke: '#e5e7eb', 
                            strokeWidth: 1.5
                          },
                        }}
                      />
                    );
                  })
              )}
            </Geographies>

            {cities.map(city => renderMarker(city))}
          </ComposableMap>
        </div>

        {/* Move caption OUTSIDE the map container */}
        {caption && (
          <div className="mt-6 mb-10 text-center text-gray-700 text-sm max-w-3xl mx-auto">
            <p className="font-bold mb-1">Figure 3</p>
            {caption}
          </div>
        )}

        {/* Dynamic Legend & Controls */}
        <div className="absolute top-2 right-4 lg:right-2 bg-white bg-opacity-95 p-3 mt-28 rounded-lg text-sm text-black shadow-md max-w-[280px]">
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
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 p-3 mb-20 rounded-lg text-sm shadow-md">
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

          {colorblindMode === 'monochromacy' && (
            <div className="mt-2 text-xs text-gray-600">
              <p>High-value areas also use patterns for better distinction</p>
            </div>
          )}
        </div>

        {/* Tooltip */}
        <Tooltip
          id="nomad-tooltip"
          place="top"
          html={tooltipHtml}
          style={{
            background: 'rgba(15,15,15,0.95)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '4px',
            maxWidth: '260px',
            lineHeight: 1.5,
            fontSize: '0.95em',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}
        />
        {/* Caption at the bottom */}
        <div className="pt-6 pb-8 text-center text-gray-700 text-sm">
          {caption || "This interactive map visualizes digital nomad cities worldwide, showing economic arbitrage, cost of living, and quality of life indicators. Hover over a city to see detailed metricsss."}
        </div>
      </div>
    </HydrationErrorSuppressor>
  );
};

export default NomadMap;
