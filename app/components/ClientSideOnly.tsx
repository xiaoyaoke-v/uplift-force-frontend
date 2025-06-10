'use client'

import { useEffect, useState, type ReactNode } from 'react';

interface ClientSideOnlyProps {
  children: ReactNode;
}

export default function ClientSideOnly({ children }: ClientSideOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // Render nothing on the server, or before hydration completes
  }

  return <>{children}</>; // Render children only on the client after mounting
} 