'use client';

import React from "react";
import ClientPageWrapper from '../components/ClientPageWrapper';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-6 md:p-12 bg-gray-50">
      <ClientPageWrapper />
      <footer className="text-center text-gray-500 mt-auto pt-8">
        {/* Footer content */}
      </footer>
    </main>
  );
}
