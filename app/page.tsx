'use client'

import Header from '@/components/Header';
import { useAccount, useSignMessage } from "wagmi"
import { FC, useEffect, useState } from 'react';
import { check, login } from '@/apis'
import { formatCurrentDateTime } from '@/utils/day';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

interface IButton {
  isConnected: boolean
  isRegister: boolean
  sign: () => void
  register: () => void
}

const NextButton: FC<IButton> = ({isConnected, isRegister, sign, register}) => {
  if (!isConnected) {
    return (
      <div className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 text-white font-bold text-lg shadow-lg text-center animate-pulse">
        Please connect your wallet!
      </div>
    );
  } else if (!isRegister) {
    return (
      <button
        onClick={register}
        className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold text-lg shadow-lg hover:scale-105 hover:shadow-2xl transition"
      >
        Register now!
      </button>
    );
  } else {
    return (
      <button
        onClick={sign}
        className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#9333ea] text-white font-bold text-lg shadow-lg hover:scale-105 hover:shadow-2xl transition"
      >
        Sign in with wallet!
      </button>
    );
  }
}


export default function Home() {
  
  const [isRegister, setIsRegister] = useState(false)
  const { address, isConnected } = useAccount()
  const router = useRouter();
  const { setUser } = useUser();

  const {signMessageAsync} = useSignMessage()

  // Call checkWallet when wallet is connected
  useEffect(() => {
    const checkWallet = async () => {
      if(!address) return
      try {
        const { is_registered } = await check({
          wallet_address: address!
        })
        setIsRegister(is_registered)
      } catch (error: any) {
        console.error('Error checking wallet:', error);
      }
    }
  
    if (isConnected && address) {
      checkWallet();
    }
  }, [isConnected, address]);

  const onLogin = async () => {
    if (!address || !isConnected) {
      return;
    }

    try {
      const msg = `Welcome to the uplift force at ${formatCurrentDateTime()}, please sign this message to prove you are the owner of the wallet.`;
      const signature = await signMessageAsync({ message: msg });

      const loginParams = {
        wallet_address: address,
        message: msg,
        signature
      }

      const userData = await login(loginParams)

      console.log(userData);
      
      setUser(userData);

    } catch (error: any) {
      console.error("Login failed:", error);
    }
  };

  const registerUser = () => {
    router.push('/register');
  };

  return(
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#18181b] via-[#23234a] to-[#0a0a23]">
        <div className="max-w-2xl w-full text-center p-8 rounded-3xl bg-white/5 backdrop-blur-lg shadow-2xl border border-[#23234a]">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-[#6ee7b7] via-[#3b82f6] to-[#9333ea] bg-clip-text text-transparent drop-shadow-lg">
            Welcome to Uplift Force
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
          Connecting players and boosters, becoming the best boosting platform on web3!         </p>
          <NextButton isConnected={isConnected} isRegister={isRegister} sign={onLogin} register={registerUser}></NextButton>

        </div>
      </main>
    </div>
  );
};
