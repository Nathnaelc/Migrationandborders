'use client';

import { useState, useEffect } from 'react';
import MarkdownSection from './MarkdownSection';

interface Section {
  id: string;
  title: string;
  content: string;
}

export default function ContentSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSections() {
      try {
        const response = await fetch('/api/sections');
        if (!response.ok) throw new Error('Failed to fetch sections');
        
        const data = await response.json();
        setSections(data);
      } catch (error) {
        console.error('Error loading sections:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSections();
  }, []);

  if (loading) {
    return <div className="my-8 text-center">Loading content sections...</div>;
  }

  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <div key={section.id} id={section.id} className="section-container">
          <MarkdownSection 
            title={section.title} 
            content={section.content} 
          />
        </div>
      ))}
    </div>
  );
}