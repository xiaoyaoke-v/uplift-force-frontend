'use client'

import Header from '@/components/Header';
import { useAccount, useSignMessage } from "wagmi"
import { FC, useEffect, useState } from 'react';
import { check, login } from '@/apis'
import { formatCurrentDateTime } from '@/utils/day';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { setRefreshToken, setToken } from './utils/token';
import NextButton from '@/components/NextButton';

export default function Home() {
  
  const [isRegister, setIsRegister] = useState(false)
  const { address, isConnected } = useAccount()
  const router = useRouter();
  const { setUser, user } = useUser();

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

  // Logout if wallet is disconnected and user is logged in
  useEffect(() => {
    if (!isConnected && user) {
      setUser(null);
      router.push('/');
    }
  }, [isConnected, user, router, setUser]);

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

      const {access_token, refresh_token, user} = await login(loginParams) // Get the full IUserInfo response
      
      setUser(user); // Set the nested user object in global context
      setToken(access_token);
      setRefreshToken(refresh_token);

      // Redirect based on user role
      if (user.role === 'player') {
        router.push('/player');
      } else if (user.role === 'booster') {
        router.push('/booster');
      }

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
