'use client';

interface PageHeaderProps {
  title: string;
  author: string;
  date: string;
}

export default function PageHeader({ title, author, date }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-semibold text-center mb-2">
        {title}
      </h1>
      <div className="text-center text-gray-600">
        <p>By {author}</p>
        <p>{date}</p>
      </div>
    </div>
  );
}