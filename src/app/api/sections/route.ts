import { NextResponse } from 'next/server';
import { getAllSections, getSectionContent } from '@/utils/markdown';

export async function GET() {
  try {
    // Get all section IDs and metadata
    const sections = await getAllSections();
    
    // For each section, get the full content
    const sectionsWithContent = await Promise.all(
      sections.map(async (section) => {
        const fullSection = await getSectionContent(section.id);
        return {
          id: section.id,
          title: section.title,
          content: fullSection.rawContent,
          contentHtml: fullSection.contentHtml,
          insertComponentAfter: section.insertComponentAfter || "",
          order: section.order
        };
      })
    );
    
    // Sort by order field
    sectionsWithContent.sort((a, b) => a.order - b.order);
    
    // Ensure we're returning an array (add check to prevent empty object)
    return NextResponse.json(sectionsWithContent.length > 0 ? sectionsWithContent : []);
  } catch (error) {
    console.error('Error fetching sections:', error);
    // Return an empty array instead of an error object
    return NextResponse.json([], { status: 500 });
  }
}