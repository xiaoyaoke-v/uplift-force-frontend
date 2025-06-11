import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { type ReactNode } from 'react'
import Providers from './providers'
import { UserProvider } from './contexts/UserContext';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Uplift Force',
  description: 'Uplift Force is a platform for creating and managing your own NFTs.',
}

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className + " min-h-screen flex flex-col"}>
        <Providers>
          <UserProvider>
            {props.children}
          </UserProvider>
        </Providers>
      </body>
    </html>
  )
}
