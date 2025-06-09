'use client'

import Header from './components/Header';
import { useAccount, useSignMessage } from "wagmi"
import { useState } from 'react';
import { request } from './utils/request';
import { message } from 'antd';


export default function Home() {
  
  const [isSigned, setIsSigned] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const { address, isConnected } = useAccount()
  const [messageApi, contextHolder] = message.useMessage()

  const {signMessageAsync} = useSignMessage()

  const sign = async () => {
    if (!address) {
      messageApi.error('Wallet address is not available.');
      return;
    }
    try {
      const msg = `Welcome to uplift force, timestamp is ${Date.now()}!`;
      const signature = await signMessageAsync({ message: msg });

      const data = await request('/v1/auth/login', {
        method: "POST",
        data: {
          wallet_address: address,
          message: msg,
          signature
        }
      });

      messageApi.open({
        type: 'success',
        content: 'Login successful!',
      });

      setIsSigned(true);
      setMessageContent(msg);
    } catch (error: any) {
      messageApi.open({
        type: 'error',
        content: `Sign-in or login failed: ${error.message}`,
      });
      setIsSigned(false);
    }
  };

  return(
    <div className="flex flex-col h-screen">
      {contextHolder}
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#18181b] via-[#23234a] to-[#0a0a23]">
        <div className="max-w-2xl w-full text-center p-8 rounded-3xl bg-white/5 backdrop-blur-lg shadow-2xl border border-[#23234a]">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-[#6ee7b7] via-[#3b82f6] to-[#9333ea] bg-clip-text text-transparent drop-shadow-lg">
            Welcome to Uplift Force
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
          Connecting players and boosters, becoming the best boosting platform on web3!         </p>
          {!isConnected ? (
            <div className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 text-white font-bold text-lg shadow-lg text-center animate-pulse">
              Please connect your wallet!
            </div>
          ) : (
            <button
              onClick={sign}
              className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#9333ea] text-white font-bold text-lg shadow-lg hover:scale-105 hover:shadow-2xl transition"
            >
              Try it now!
            </button>
          )}

        </div>
      </main>
    </div>
  );
};
