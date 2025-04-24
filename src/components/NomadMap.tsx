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

// Add a new type for visualization mode
type VisualizationMode = 'size' | 'color' | 'opacity';
type AttributeKey = 'nomad_score' | 'internet_speed' | 'cost_nomad' | 'safety' | 'life_score' | 'friendly_to_foreigners' | 'freedom_score';

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
  const [colorAttribute, setColorAttribute] = useState<AttributeKey>('cost_nomad');
  const [opacityAttribute, setOpacityAttribute] = useState<AttributeKey>('internet_speed');

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
          safety: safety,
          life_score: life,
          friendly_to_foreigners: friendly,
          freedom_score: freedom,
        };
      });

    console.log('Loaded cities:', validCities.length);
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
    
    // Special handling for cost (use median for better distribution)
    if (attr === 'cost_nomad') {
      const { median } = attributeRanges[attr];
      return value < median 
        ? (value - min) / (median - min) * 0.5 
        : 0.5 + (value - median) / (max - median) * 0.5;
    }
    
    // Return normalized value, ensuring it's between 0 and 1
    const normalized = (value - min) / (max - min);
    return Math.max(0, Math.min(1, normalized));
  };
  
  // Get color based on attribute value
  const getAttributeColor = (value: number | undefined, attr: AttributeKey): string => {
    const normalized = normalizeValue(value, attr);
    
    // Color scheme depends on attribute
    if (attr === 'cost_nomad') {
      // Cost: Green (low) to Red (high)
      const hue = 120 - normalized * 120;
      return `hsla(${hue}, 70%, 50%, 1)`;
    } else {
      // Everything else: Red (low) to Green (high)
      const hue = normalized * 120;
      return `hsla(${hue}, 70%, 50%, 1)`;
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

  // Build tooltip HTML
  const makeTooltip = (c: NomadCity) => {
    const lines: string[] = [];
    lines.push(`<strong>${c.place}</strong>`);
    if (c.country) lines.push(`<em>${c.country}</em>`);
    lines.push(`<div style="margin-top:4px; font-size:0.9em;">`);
    lines.push(`Nomad Score: ${c.nomad_score.toFixed(2)}`);
    lines.push(`Internet: ${c.internet_speed.toFixed(2)}`);
    if (c.cost_nomad != null) lines.push(`Cost: $${Math.round(c.cost_nomad)}`);
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
      freedom_score: 'Freedom Score'
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

        {cities.map(c => {
          // Get visualization properties based on selected attributes
          const circleSize = getAttributeSize(c[sizeAttribute], sizeAttribute);
          const circleColor = getAttributeColor(c[colorAttribute], colorAttribute);
          const circleOpacity = getAttributeOpacity(c[opacityAttribute], opacityAttribute);
          
          return (
            <Marker
              key={c.id}
              coordinates={[c.longitude, c.latitude]}
              onMouseEnter={() => {
                setTooltipHtml(makeTooltip(c));
                setHighlightCountry(c.country || null);
              }}
              onMouseLeave={() => {
                setTooltipHtml('');
                setHighlightCountry(null);
              }}
            >
              <circle
                r={circleSize}
                fill={circleColor}
                fillOpacity={circleOpacity}
                stroke="#333"
                strokeWidth={0.5}
                data-tooltip-id="nomad-tooltip"
                style={{ cursor: 'pointer', transition: '0.2s' }}
              />
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Dynamic Legend & Controls */}
      <div className="absolute top-2 right-2 bg-white bg-opacity-95 p-3 rounded-lg text-sm text-black shadow-md max-w-xs">
        <div className="font-semibold text-black mb-3 text-center">Visualization Controls</div>
        
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
        
        {/* Color Control */}
        <div className="mb-3 border-b pb-2">
          <div className="font-medium mb-1">Circle Color by:</div>
          <select 
            value={colorAttribute}
            onChange={(e) => setColorAttribute(e.target.value as AttributeKey)}
            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
          >
            <option value="cost_nomad">Cost of Living</option>
            <option value="nomad_score">Nomad Score</option>
            <option value="internet_speed">Internet Speed</option>
            <option value="safety">Safety</option>
            <option value="life_score">Life Quality</option>
            <option value="friendly_to_foreigners">Foreigner Friendly</option>
            <option value="freedom_score">Freedom Score</option>
          </select>
          <div className="h-3 w-full mt-1">
            {colorAttribute === 'cost_nomad' ? (
              <div className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded"></div>
            ) : (
              <div className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded"></div>
            )}
          </div>
          <div className="flex justify-between text-xs">
            <span>{colorAttribute === 'cost_nomad' ? 'Lower' : 'Poor'}</span>
            <span>{colorAttribute === 'cost_nomad' ? 'Higher' : 'Better'}</span>
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
