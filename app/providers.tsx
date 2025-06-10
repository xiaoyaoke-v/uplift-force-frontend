'use client'

import {
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {type ReactNode, useMemo, useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { createConfig } from './wagmi';
import { App } from 'antd';

// Create a single instance of QueryClient
const queryClient = new QueryClient();

export default function Providers(props: {
  children: ReactNode,
}) {
  const [mounted, setMounted] = useState(false);

  // Use useMemo to ensure config is only created once
  const config = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createConfig();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !config) {
    return null;
  }

  return (
    <App>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            {props.children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </App>
  );
}