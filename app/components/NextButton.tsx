'use client'

import { FC } from 'react'

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

export default NextButton; 