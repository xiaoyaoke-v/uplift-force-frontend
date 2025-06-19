import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header
      className="w-full flex items-center justify-between px-10 py-7 bg-gradient-to-br from-[#18181b]/95 via-[#10131a]/90 to-[#23234a]/95 shadow-2xl border-b border-[#23234a] backdrop-blur-lg transition-all duration-500 ease-in-out sticky top-0 z-30"
      style={{ boxShadow: '0 6px 32px 0 rgba(36,40,80,0.22)' }}
    >
      <div className="flex items-center">
        <span className="text-2xl font-extrabold tracking-wide flex items-center bg-gradient-to-r from-[#6ee7b7] via-[#3b82f6] to-[#9333ea] bg-clip-text text-transparent">
          <img 
            src="/favicon.png"
            alt="Uplift Force Logo"
            className="mr-2 w-8 h-8 object-contain" 
          />
          Uplift Force
        </span>
      </div>
      <div className="transform transition-all duration-300 hover:scale-[1.05]">
        <ConnectButton />
      </div>
    </header>
  );
}