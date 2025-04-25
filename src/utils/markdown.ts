import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export interface MarkdownContent {
  id: string;
  title: string;
  order: number;
  contentHtml: string;
  rawContent: string;
  insertComponentAfter?: string; 
}

const sectionsDirectory = path.join(process.cwd(), 'src/content/sections');

export function getAllSectionIds() {
  const fileNames = fs.readdirSync(sectionsDirectory);
  
  return fileNames.map((fileName) => {
    return {
      params: {
        id: fileName.replace(/\.md$/, ''),
      },
    };
  });
}

export async function getAllSections(): Promise<MarkdownContent[]> {
  // Get file names under /sections
  const fileNames = fs.readdirSync(sectionsDirectory);
  const allSectionsData = await Promise.all(
    fileNames.map(async (fileName) => {
      // Remove ".md" from file name to get id
      const id = fileName.replace(/\.md$/, '');

      // Read markdown file as string
      const fullPath = path.join(sectionsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Use gray-matter to parse the section metadata
      const matterResult = matter(fileContents);

      // Process markdown content to HTML
      const processedContent = await remark()
        .use(html, { sanitize: false }) // Don't sanitize to preserve styling
        .process(matterResult.content);
      const contentHtml = processedContent.toString();

      // Return the combined data
      return {
        id,
        title: matterResult.data.title,
        order: matterResult.data.order,
        contentHtml,
        rawContent: matterResult.content,
        insertComponentAfter: matterResult.data.insertComponentAfter || '',
      };
    })
  );

  // Sort sections by order
  return allSectionsData.sort((a, b) => a.order - b.order);
}

export async function getSectionContent(id: string): Promise<MarkdownContent> {
  const fullPath = path.join(sectionsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Use gray-matter to parse the section metadata
  const matterResult = matter(fileContents);

  // Process markdown content to HTML
  const processedContent = await remark()
    .use(html, { sanitize: false }) // Don't sanitize to preserve styling
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    id,
    title: matterResult.data.title,
    order: matterResult.data.order,
    contentHtml,
    rawContent: matterResult.content,
    insertComponentAfter: matterResult.data.insertComponentAfter || '',
  };
}