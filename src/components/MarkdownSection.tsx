'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';

interface MarkdownSectionProps {
  content: string;
  title?: string;
}

const MarkdownSection = ({ content, title }: MarkdownSectionProps) => {
  return (
    <div className="markdown-section prose prose-blue max-w-none">
      {title && <h2 className="text-2xl font-semibold mb-4">{title}</h2>}
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownSection;