'use client'

import {
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {type ReactNode, useState } from 'react'
import { WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { config } from './wagmi';
import { App, message } from 'antd';


export default function Providers(props: {
  children: ReactNode,
}) {
  const [queryClient] = useState(() => new QueryClient())
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