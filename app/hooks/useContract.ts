import { useAccount, useReadContract } from 'wagmi';
//  abi 合约 ABI
const abi = [] as const;

export function useContract(contractAddress: `0x${string}`) {
  const { address } = useAccount();
  return useReadContract({
    address: contractAddress,
    abi,
    functionName: 'balanceOf',
    args: [address],
    query: { refetchInterval: 10000 },
  });
} 