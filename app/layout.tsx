import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { type ReactNode } from 'react'
import Providers from './providers'
import { cookies } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { config } from './wagmi';
import Header from './components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Uplift Force',
  description: 'Uplift Force is a platform for creating and managing your own NFTs.',
}

export default async function RootLayout(props: { children: ReactNode }) {


  return (
<html lang="en">
      <body className={inter.className}>
        <Providers >{props.children}</Providers>
      </body>
    </html>
  )
}
