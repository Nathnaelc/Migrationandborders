'use client';
import React from 'react';

interface MapCaptionProps {
  caption?: string;
}

const MapCaption: React.FC<MapCaptionProps> = ({ caption }) => {
  return (
    <div className="my-4 text-center text-gray-700 text-sm max-w-5xl mx-auto">
      {<strong>Figure 1: </strong> }
      {"This interactive map visualizes major digital nomad destinations worldwide, combining data on economic arbitrage, living costs, connectivity, and life quality. Circle size reflects the Arbitrage Index (calculated as median U.S. remote salary ÷ local nomad living cost); greener colors indicate greater purchasing power for remote workers. Hovering over a city reveals detailed metrics, including Nomad Score, Internet Speed, Safety, and Foreigner Friendliness. Data sources include the Global Digital Nomad Cities database (Hain, 2018) and supplementary migration infrastructure guides. This tool highlights not only ideal destinations for remote professionals but also urban ecosystems under growing socioeconomic pressure."}
    </div>
  );
};

export default MapCaption;