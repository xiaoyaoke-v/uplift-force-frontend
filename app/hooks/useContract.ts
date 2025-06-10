import { useReadContract, type Config } from 'wagmi';
import { Abi, ContractFunctionName, ContractFunctionArgs, type Account, type BlockTag } from 'viem';
// TODO: Replace with your actual contract ABI
// For example: `import YOUR_CONTRACT_ABI from './YOUR_CONTRACT_ABI.json';`
const abi = [] as const;

type UseContractConfig<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
  TSelectData = unknown
> = {
  address: `0x${string}`;
  abi: TAbi;
  functionName: TFunctionName;
  args?: ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>;
  account?: `0x${string}` | Account;
  blockNumber?: bigint;
  blockTag?: BlockTag;
  query?: {
    refetchInterval?: number;
    select?: (data: unknown) => TSelectData;
  };
};

export function useContract<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
  TSelectData = unknown
>(config: UseContractConfig<TAbi, TFunctionName, TSelectData>) {
  const { query, ...rest } = config;

  return useReadContract({
    ...rest,
    query: {
      refetchInterval: query?.refetchInterval ?? 10000,
      select: query?.select,
    },
  } as any); // TODO: Remove type assertion once wagmi types are fixed
} 