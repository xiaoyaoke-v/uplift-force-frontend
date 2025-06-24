import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
  avalancheFuji, 
} from 'wagmi/chains';
import { type Config } from 'wagmi';

// Create a function to get the config
function createConfig() {
  return getDefaultConfig({
    appName: process.env.NEXT_PUBLIC_APP_NAME!,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
    chains: [
      mainnet,
      polygon,
      optimism,
      arbitrum,
      base,
      ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' 
        ? [sepolia, avalancheFuji] 
        : []
      ),
    ],
    ssr: false,
  });
}

// Export the function instead of the config instance
export { createConfig };