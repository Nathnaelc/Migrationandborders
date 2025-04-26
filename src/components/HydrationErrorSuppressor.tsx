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
  
  if (!isClient) {
    return <div suppressHydrationWarning style={{ visibility: 'hidden' }} />;
  }
  
  return <>{children}</>;
}