"use client";

import React, { useEffect, useState } from 'react';

export default function HydrationErrorSuppressor({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Return a simple placeholder during server rendering and first client render
  // This avoids the hydration mismatch
  if (!isClient) {
    return <div suppressHydrationWarning style={{ visibility: 'hidden' }} />;
  }
  
  // Once we're firmly on the client, render the actual children
  return <>{children}</>;
}