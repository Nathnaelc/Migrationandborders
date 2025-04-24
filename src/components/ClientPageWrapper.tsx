'use client';

import dynamic from "next/dynamic";

// Client-side dynamic imports
const NomadMap = dynamic(() => import("./NomadMap"), { ssr: false });
const LineChart = dynamic(() => import("./LineChart"), { ssr: false });
const RadarChart = dynamic(() => import("./RadarChart"), { ssr: false });
const BarChart = dynamic(() => import("./BarChart"), { ssr: false });

export default function ClientPageWrapper() {
  return (
    <>
      {/* World Map Visualization */}
        <section className="mb-12">
        <div className="relative h-[850px] w-full border rounded-lg overflow-hidden p-6">
            <h2 className="text-2xl text-black font-semibold mb-4">
            Digital Nomad Destinations
            </h2>
            <p className="mb-4 text-gray-600">
            Explore the world’s top remote-work hotspots:  
            <strong>bubble size</strong> shows Nomad Score,  
            <strong>bubble color</strong> shows average Internet Mbps,
            Hover over any city to uncover safety, life-quality, and more.  
            </p>
            <div className="h-[700px] w-full">
            <NomadMap />
            </div>
        </div>
        </section>


      {/* City Metrics Comparison
      <section className="mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">City Metrics Comparison</h2>
          <p className="mb-4 text-gray-600">
            Compare key metrics across digital nomad destinations. The chart shows nomad scores, internet speed, and monthly costs.
          </p>
          <LineChart />
        </div>
      </section> */}

      {/* Cost Comparison Bar Chart
      <section className="mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Cost Comparison</h2>
          <p className="mb-4 text-gray-600">
            Compare monthly living costs for the top digital nomad destinations. This visualization helps you identify 
            affordable options among the most desirable cities.
          </p>
          <BarChart />
        </div>
      </section> */}

      {/* Radar Chart for City Comparison
      <section className="mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Multi-Factor City Comparison</h2>
          <p className="mb-4 text-gray-600">
            Select cities to compare across multiple factors. This radar chart visualization allows you to see strengths 
            and weaknesses of each location across important digital nomad metrics.
          </p>
          <RadarChart />
        </div>
      </section> */}
    </>
  );
}