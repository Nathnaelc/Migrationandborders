'use client';

import { useState, useEffect } from 'react';
import NomadMap from './NomadMap';
import MapCaption from './MapCaption';
import dynamic from 'next/dynamic';
import { MarkdownContent } from '../utils/markdown';
import ChartErrorBoundary from './ChartErrorBoundary';

const BarChartVisas = dynamic(() => import('./BarChartVisas'), { ssr: false });

const renderComponent = (componentName: string, section: MarkdownContent) => {
  switch (componentName) {
    case 'NomadMap':
      return (
        <div className="mb-16"> 
          <NomadMap /> 
        </div>
      );
    case 'BarChartVisas':
      return (
        <div className="py-4 w-full max-w-5xl mx-auto mb-16 h-[1160px] overflow-hidden"> 
          <ChartErrorBoundary>
            <div className="chart-container">
              <BarChartVisas />
            </div>
          </ChartErrorBoundary>
          {section.chartCaption && (
            <div className="pt-4 text-center text-gray-700 text-sm border-t border-gray-200 mt-4">
              {section.chartCaption}
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
};

export default function ClientPageWrapper() {
  const [sections, setSections] = useState<MarkdownContent[]>([]);

  useEffect(() => {
    fetch('/api/sections')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSections(data.sort((a: MarkdownContent, b: MarkdownContent) => a.order - b.order));
        } else {
          console.error('Expected array from /api/sections but got:', data);
          setSections([]);
        }
      })
      .catch(error => {
        console.error('Error fetching sections:', error);
        setSections([]);
      });
  }, []);

  return (
    <div className="container mx-auto px-2 py-8 max-w-7xl">
      {/* Main Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-black mb-2">
          Work Without Borders and the Global Inequality in the Digital Labor Economy
        </h1>
        <div className="text-gray-600">
          <p>By <a className="text-emerald-700" href="https://nathnael.net" target='blank' >Nathnael Mekonnen</a></p>
          <p>April 24, 2025</p>
        </div>
      </div>
      
      <div className="space-y-8"> 
        {sections.map((section) => (
          <div key={section.id} className="markdown-section mb-8"> 
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">{section.title}</h2>
        
            <div className="section-content" dangerouslySetInnerHTML={{ __html: section.contentHtml }} />
            
            {section.insertComponentAfter && (
              <div className="py-6 mt-6">
                {renderComponent(section.insertComponentAfter, section)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}