import Header from './components/Header';

export default function Home() {
  return(
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#18181b] via-[#23234a] to-[#0a0a23]">
        <div className="max-w-2xl w-full text-center p-8 rounded-3xl bg-white/5 backdrop-blur-lg shadow-2xl border border-[#23234a]">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-[#6ee7b7] via-[#3b82f6] to-[#9333ea] bg-clip-text text-transparent drop-shadow-lg">
            欢迎来到 Uplift Force
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            体验下一代 Web3 平台，安全、开放、创新。连接你的钱包，开启链上新世界！
          </p>
          <a
            href="#"
            className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#9333ea] text-white font-bold text-lg shadow-lg hover:scale-105 hover:shadow-2xl transition"
          >
            立即体验
          </a>
        </div>
      </main>
    </div>
  );
};

