import React from "react";
import ClientPageWrapper from "../components/ClientPageWrapper";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-6 md:p-12 bg-gray-50">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-700">Digital Nomad City Explorer</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Interactive visualizations of digital nomad-friendly cities around the world.
          Compare costs, safety, internet speeds, and more to find your ideal remote work destination.
        </p>
      </header>

      {/* Client-side visualizations */}
      <ClientPageWrapper />

      {/* Additional Information */}
      <section className="mb-12">
        <div className="bg-white h-[700px]: rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">About This Data</h2>
          <p className="mb-4 text-gray-600">
            This interactive website uses data compiled from various sources on digital nomad friendly cities.
            Metrics include:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <li>Nomad Score: Overall rating for digital nomads</li>
            <li>Cost: Monthly living expenses</li>
            <li>Internet Speed: Quality of internet connectivity</li>
            <li>Safety: Personal safety rating</li>
            <li>Life Score: Quality of life assessment</li>
            <li>Friendly to Foreigners: How welcoming locals are to expats</li>
          </ul>
          <p className="text-gray-600">
            Use these visualizations to discover potential cities that match your remote work and lifestyle preferences.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-500 mt-auto pt-8">
        <p>Created with Next.js, React, Tailwind CSS, and Chart.js</p>
        <p>© 2025 Digital Nomad Explorer</p>
      </footer>
    </main>
  );
}
