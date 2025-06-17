'use client'

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, Spin, Space, Tag, Modal, Modal as AntdModal, Select as AntdSelect } from 'antd';
import { TrophyOutlined, SafetyOutlined, DollarOutlined, RocketOutlined } from '@ant-design/icons';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getPlayerOrders, submitOrder, getPlayerInfo } from '@/apis';
import type { IPlayerInfo, IPlayerAccount } from '@/apis';
import GameCard from '@/components/ui/GameCard';
import PromoCard from '@/components/ui/PromoCard';
import type { Game } from '@/types';

const { Option } = Select;

interface Order {
  id: string;
  game: string;
  currentRank: string;
  desiredRank: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  boosterId?: string;
}

const games: Game[] = [
  { name: "League of Legends", imagePath: "/assets/lol.jpg" },
  { name: "Honor of Kings", imagePath: "/assets/zympYphpKVhaHN1685523686230531.png" },
  { name: "LoL Mobile", imagePath: "/assets/lS2IgphpoLR7Nz1627293846210726.png" },
  { name: "Genshin Impact", imagePath: "/assets/U0lBQphpIpZJ4r1691047295230803.png" },
  { name: "Naruto Online", imagePath: "/assets/YRWCFphpsLACiz1609212217201229.jpg" },
  { name: "Valorant", imagePath: "/assets/w8eVLphpkcD8vY1688004090230629.jpg" },
  { name: "Diablo Ⅳ", imagePath: "/assets/diablo.jpg" },
  { name: "World of Warcraft", imagePath: "/assets/wow.jpg" },
];

const regionOptions = [
  { label: 'BR1', value: 'BR1' },
  { label: 'EUN1', value: 'EUN1' },
  { label: 'EUW1', value: 'EUW1' },
  { label: 'JP1', value: 'JP1' },
  { label: 'KR', value: 'KR' },
  { label: 'LA1', value: 'LA1' },
  { label: 'LA2', value: 'LA2' },
  { label: 'ME1', value: 'ME1' },
  { label: 'NA1', value: 'NA1' },
  { label: 'OC1', value: 'OC1' },
  { label: 'RU', value: 'RU' },
  { label: 'SG2', value: 'SG2' },
  { label: 'TR1', value: 'TR1' },
  { label: 'TW2', value: 'TW2' },
  { label: 'VN2', value: 'VN2' },
];

const RANK_ORDER = [
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND',
  'MASTER',
  'GRANDMASTER',
  'CHALLENGER',
];

export default function PlayerDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [form] = Form.useForm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 表单相关状态
  const [selectedGame, setSelectedGame] = useState<string>('League of Legends');
  const [selectedRegion, setSelectedRegion] = useState<string>(''); // 默认为空
  const [riotId, setRiotId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<IPlayerAccount | null>(null);
  const [playerError, setPlayerError] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string>('Boosting');
  const [targetRank, setTargetRank] = useState<string | null>(null);
  const [extraInfo, setExtraInfo] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
    } else if (user.role !== 'player') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === 'player') {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const fetchedOrders = await getPlayerOrders(user!.id);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSearchPlayer = async () => {
    if (!riotId || !selectedRegion) return;
    
    setSearchLoading(true);
    setPlayerInfo(null);
    setPlayerError('');
    setSelectedIdx(null);
    setTargetRank(null);
    setPrice(null);
    
    try {
      const params: IPlayerInfo = { characterName: riotId, tagLine: selectedRegion };
      const res = await getPlayerInfo(params);
      console.log('Player Info:', res);
      if (res.leagueCount === 0) {
        setPlayerError('No player information found');
      } else {
        setPlayerInfo(res);
      }
    } catch (e) {
      console.error('Search player failed:', e);
      setPlayerError('No player information found');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRankSelection = (idx: number) => {
    setSelectedIdx(idx);
    if (playerInfo && playerInfo.leagueEntries[idx]) {
      const currentTier = playerInfo.leagueEntries[idx].tier?.toUpperCase() || 'IRON';
      const currentTierIdx = RANK_ORDER.indexOf(currentTier);
      setTargetRank(null);
      setPrice(null);
    }
  };

  const calculatePrice = () => {
    if (!targetRank || selectedIdx === null || !playerInfo) return;
    
    const currentTier = playerInfo.leagueEntries[selectedIdx].tier?.toUpperCase() || 'IRON';
    const fromIdx = RANK_ORDER.indexOf(currentTier);
    const toIdx = RANK_ORDER.indexOf(targetRank);
    const diff = Math.max(0, toIdx - fromIdx);
    const calculatedPrice = diff * 0.002;
    setPrice(calculatedPrice);
  };

  const handlePlaceOrder = async () => {
    if (!playerInfo || selectedIdx === null || !targetRank || !price) return;
    
    setPlacingOrder(true);
    try {
      setTimeout(() => {
        setPlacingOrder(false);
        setIsModalOpen(false);
        setRiotId('');
        setPlayerInfo(null);
        setSelectedIdx(null);
        setTargetRank(null);
        setExtraInfo('');
        setPrice(null);
        setPlayerError('');
        setSelectedRegion(''); // 重置为空
      }, 1200);
    } catch (error) {
      console.error('Failed to place order:', error);
      setPlacingOrder(false);
    }
  };

  const getCurrentRank = () => {
    if (!playerInfo || selectedIdx === null) return null;
    return playerInfo.leagueEntries[selectedIdx].tier?.toUpperCase() || 'IRON';
  };

  const getCurrentRankIndex = () => {
    const currentRank = getCurrentRank();
    if (!currentRank) return -1;
    return RANK_ORDER.indexOf(currentRank);
  };

  const getRankButtonStyle = (rank: string, index: number) => {
    const currentRankIdx = getCurrentRankIndex();
    const isCurrentRank = index === currentRankIdx;
    const isBelowCurrent = index < currentRankIdx;
    const isAboveCurrent = index > currentRankIdx;
    const isSelected = targetRank === rank;

    if (isCurrentRank) {
      // 当前段位 - 高亮显示但不可选
      return {
        className: 'relative py-4 rounded-xl font-bold transition-all duration-300 border-2 bg-gradient-to-br from-yellow-600/60 to-orange-600/60 border-yellow-400 text-white cursor-not-allowed',
        disabled: true,
        label: '(CURRENT)'
      };
    } else if (isBelowCurrent) {
      // 低于当前段位 - 灰色不可选
      return {
        className: 'relative py-4 rounded-xl font-bold transition-all duration-300 border-2 bg-gray-800/40 border-gray-700/50 text-gray-500 cursor-not-allowed opacity-50',
        disabled: true,
        label: ''
      };
    } else if (isAboveCurrent && isSelected) {
      // 高于当前段位且被选中
      return {
        className: 'relative py-4 rounded-xl font-bold transition-all duration-300 border-2 bg-gradient-to-br from-pink-600/50 to-purple-600/50 border-pink-400 text-white shadow-lg shadow-pink-400/30 transform scale-105',
        disabled: false,
        label: ''
      };
    } else if (isAboveCurrent) {
      // 高于当前段位但未选中 - 可选择
      return {
        className: 'relative py-4 rounded-xl font-bold transition-all duration-300 border-2 bg-gray-900/40 border-gray-600/50 text-gray-300 hover:border-pink-400/70 hover:bg-pink-900/20 cursor-pointer',
        disabled: false,
        label: ''
      };
    }

    // 默认情况（如果没有选择当前段位）
    return {
      className: 'relative py-4 rounded-xl font-bold transition-all duration-300 border-2 bg-gray-900/40 border-gray-600/50 text-gray-300 hover:border-pink-400/70 hover:bg-pink-900/20 cursor-pointer',
      disabled: false,
      label: ''
    };
  };

  useEffect(() => {
    if (targetRank) {
      calculatePrice();
    }
  }, [targetRank, selectedIdx, playerInfo]);

  if (!user || user.role !== 'player') {
    return <p>Access Denied or Loading User Data...</p>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center bg-gradient-to-br from-[#18181b] via-[#23234a] to-[#0a0a23] px-4 py-8">
        <div className="w-full">
          {/* Promotional Sections */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Enhance Your Gaming Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              <PromoCard icon={<TrophyOutlined style={{ fontSize: '48px', color: '#6ee7b7' }} />} title="Professional Boosting" description="Experienced players help you rank up quickly and break through bottlenecks." />
              <PromoCard icon={<SafetyOutlined style={{ fontSize: '48px', color: '#3b82f6' }} />} title="Safe & Reliable" description="Privacy protection and secure transactions for peace of mind." />
              <PromoCard icon={<DollarOutlined style={{ fontSize: '48px', color: '#9333ea' }} />} title="Great Value" description="Reasonable prices and efficient service to help you achieve your goals." />
              <PromoCard icon={<RocketOutlined style={{ fontSize: '48px', color: '#e7b76e' }} />} title="Fast Response" description="Quick matching and instant start to save your valuable time." />
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Our Advantages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              <PromoCard icon={<TrophyOutlined style={{ fontSize: '48px', color: '#e76e6e' }} />} title="Top Players" description="Only the highest-level players are selected to ensure your experience." />
              <PromoCard icon={<SafetyOutlined style={{ fontSize: '48px', color: '#6ee7b7' }} />} title="24/7 Support" description="Customer service is online around the clock to solve your problems at any time." />
              <PromoCard icon={<DollarOutlined style={{ fontSize: '48px', color: '#3b82f6' }} />} title="Transparent Progress" description="View your order progress in real time, everything is under control." />
              <PromoCard icon={<RocketOutlined style={{ fontSize: '48px', color: '#9333ea' }} />} title="Customized Service" description="Personalized boosting plans tailored to your needs." />
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Popular Games Covered
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              {games.map((game) => (
                <Card key={game.name} className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                  <GameCard game={game} />
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              type="primary"
              size="large"
              className="!bg-gradient-to-r !from-[#3b82f6] !to-[#9333ea] !text-white !font-extrabold !text-base !rounded-xl !py-5 !px-12 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setIsModalOpen(true)}
            >
              Order Now
            </Button>
          </div>

          {/* 赛博朋克风格表单弹窗 */}
          <Modal
            open={isModalOpen}
            onCancel={() => {
              setIsModalOpen(false);
              setRiotId('');
              setPlayerInfo(null);
              setSelectedIdx(null);
              setTargetRank(null);
              setExtraInfo('');
              setPrice(null);
              setPlayerError('');
              setSelectedRegion('');
            }}
            footer={null}
            centered
            width={900}
            style={{ maxHeight: '90vh' }}
            bodyStyle={{ 
              maxHeight: '80vh', 
              overflowY: 'auto', 
              padding: '0',
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%)',
              borderRadius: '16px',
              /* 隐藏滚动条但保持可滚动 */
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* IE and Edge */
            }}
            className="cyber-modal"
            maskStyle={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div className="relative overflow-hidden">
              {/* 赛博朋克背景效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-purple-900/20 to-pink-900/20"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
              
              {/* 标题 */}
              <div className="relative p-6 border-b border-cyan-500/30">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wider">
                  ⚡ BOOST PROTOCOL ⚡
                </h2>
                <div className="text-center text-sm text-cyan-300/70 mt-2">INITIALIZE RANK ENHANCEMENT SEQUENCE</div>
              </div>

              <div className="relative p-8 space-y-8">
                {/* 游戏选择 */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-purple-500"></div>
                    <h3 className="text-xl font-bold text-cyan-300 tracking-wider">SELECT GAME UNIVERSE</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {games.map((game) => {
                      const disabled = game.name !== 'League of Legends';
                      return (
                        <button
                          key={game.name}
                          className={`group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 ${
                            disabled 
                              ? 'bg-gray-900/50 border-gray-700/50 cursor-not-allowed opacity-40' 
                              : selectedGame === game.name 
                                ? 'bg-gradient-to-br from-cyan-900/50 to-purple-900/50 border-cyan-400 shadow-lg shadow-cyan-400/30 transform scale-105' 
                                : 'bg-gray-900/30 border-gray-600/50 hover:border-purple-400/70 hover:bg-purple-900/20'
                          }`}
                          disabled={disabled}
                          onClick={() => !disabled && setSelectedGame(game.name)}
                        >
                          <img src={game.imagePath} alt={game.name} className="w-12 h-12 object-cover rounded-lg mb-2" />
                          <span className="text-sm font-medium text-center text-gray-300">{game.name}</span>
                          {selectedGame === game.name && !disabled && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 服务器选择 */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-500"></div>
                    <h3 className="text-xl font-bold text-purple-300 tracking-wider">SELECT REGION NODE</h3>
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {regionOptions.map(opt => (
                      <button
                        key={opt.value}
                        className={`relative py-3 px-2 rounded-lg border-2 font-bold transition-all duration-300 ${
                          selectedRegion === opt.value 
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-pink-400 text-white shadow-lg shadow-pink-400/30 transform scale-105' 
                            : 'bg-gray-900/40 border-gray-600/50 text-gray-300 hover:border-purple-400/70 hover:bg-purple-900/20 hover:text-purple-300'
                        }`}
                        onClick={() => setSelectedRegion(opt.value)}
                      >
                        {opt.label}
                        {selectedRegion === opt.value && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 玩家信息查询 */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-pink-400 to-orange-500"></div>
                    <h3 className="text-xl font-bold text-pink-300 tracking-wider">PLAYER IDENTIFICATION</h3>
                  </div>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="ENTER RIOT ID..."
                        value={riotId}
                        onChange={e => setRiotId(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-900/60 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400 focus:bg-gray-900/80 outline-none transition-all font-mono tracking-wider"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-400">
                        {riotId && '●'}
                      </div>
                    </div>
                    <button
                      onClick={handleSearchPlayer}
                      disabled={searchLoading || !riotId || !selectedRegion}
                      className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold tracking-wider hover:from-blue-600 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-500/30"
                    >
                      {searchLoading ? 'SCANNING...' : 'SCAN PLAYER'}
                    </button>
                  </div>
                  
                  {playerError && (
                    <div className="text-red-400 text-center py-4 bg-red-900/20 border border-red-500/30 rounded-lg font-mono">
                      ERROR: {playerError}
                    </div>
                  )}

                  {playerInfo && (
                    <div className="bg-gradient-to-br from-gray-900/60 to-purple-900/20 border border-purple-500/30 rounded-xl p-6">
                      <div className="text-center text-2xl font-bold mb-6 text-cyan-300 tracking-wider">
                        PLAYER: {playerInfo.summoner.gameName}
                      </div>
                      <div className="mb-4">
                        <h4 className="font-bold mb-4 text-purple-300 tracking-wider">SELECT CURRENT RANK</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {playerInfo.leagueEntries.map((entry, idx) => {
                            const tier = entry.tier?.toUpperCase() || 'UNRANKED';
                            const isSelected = selectedIdx === idx;
                            return (
                              <div
                                key={entry.queueType}
                                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                                  isSelected 
                                    ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-cyan-400 shadow-lg shadow-cyan-400/30 transform scale-105' 
                                    : 'bg-gray-900/40 border-gray-600/50 hover:border-purple-400/70 hover:bg-purple-900/20'
                                }`}
                                onClick={() => handleRankSelection(idx)}
                              >
                                <div className="text-center">
                                  <div className="font-bold text-sm mb-3 text-purple-300 tracking-wider">{entry.queueType}</div>
                                  <div className="text-xl font-bold text-cyan-300">
                                    {entry.tier} {entry.rank}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 服务类型选择 */}
                {playerInfo && selectedIdx !== null && (
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-red-500"></div>
                      <h3 className="text-xl font-bold text-orange-300 tracking-wider">SELECT SERVICE PROTOCOL</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <button
                        className={`relative py-6 rounded-xl font-bold text-lg transition-all duration-300 border-2 ${
                          selectedService === 'Boosting' 
                            ? 'bg-gradient-to-br from-orange-600/50 to-red-600/50 border-orange-400 text-white shadow-lg shadow-orange-400/30 transform scale-105' 
                            : 'bg-gray-900/40 border-gray-600/50 text-gray-300 hover:border-orange-400/70 hover:bg-orange-900/20'
                        }`}
                        onClick={() => setSelectedService('Boosting')}
                      >
                        RANK BOOSTING
                        {selectedService === 'Boosting' && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
                        )}
                      </button>
                      <button
                        className="py-6 rounded-xl font-bold text-lg border-2 bg-gray-900/20 border-gray-700/30 text-gray-500 cursor-not-allowed relative overflow-hidden"
                        disabled
                      >
                        <span className="relative z-10">PLAY WITH</span>
                        <div className="absolute inset-0 bg-red-900/20"></div>
                        {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-red-400 font-mono">
                          [LOCKED]
                        </div> */}
                      </button>
                    </div>
                  </div>
                )}

                {/* 目标段位选择 - 修改后的版本 */}
                {playerInfo && selectedIdx !== null && selectedService && (
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-red-400 to-pink-500"></div>
                      <h3 className="text-xl font-bold text-red-300 tracking-wider">TARGET RANK PROTOCOL</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {RANK_ORDER.map((rank, index) => {
                        const style = getRankButtonStyle(rank, index);
                        return (
                          <button
                            key={rank}
                            className={style.className}
                            disabled={style.disabled}
                            onClick={() => !style.disabled && setTargetRank(rank)}
                          >
                            <div className="flex flex-col items-center">
                              <span>{rank.charAt(0) + rank.slice(1).toLowerCase()}</span>
                              {style.label && (
                                <span className="text-xs mt-1 opacity-80">{style.label}</span>
                              )}
                            </div>
                            {targetRank === rank && !style.disabled && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 额外信息 */}
                {targetRank && (
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-500"></div>
                      <h3 className="text-xl font-bold text-purple-300 tracking-wider">ADDITIONAL PARAMETERS</h3>
                    </div>
                    <textarea
                      className="w-full p-6 bg-gray-900/60 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:bg-gray-900/80 outline-none resize-vertical font-mono tracking-wider"
                      style={{
                        scrollbarWidth: 'none', /* Firefox */
                        msOverflowStyle: 'none', /* IE and Edge */
                      }}
                      rows={4}
                      placeholder="ENTER SPECIAL REQUIREMENTS OR NOTES..."
                      value={extraInfo}
                      onChange={e => setExtraInfo(e.target.value)}
                    />
                  </div>
                )}

                {/* 价格显示和下单 */}
                {price !== null && (
                  <div className="relative bg-gradient-to-br from-gray-900/80 to-purple-900/40 border-2 border-purple-500/50 rounded-xl p-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
                    <div className="text-center">
                      <div className="text-sm text-purple-300 mb-2 tracking-wider font-mono">BOOST PROTOCOL COST</div>
                      <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-6 tracking-wider">
                        {price} ETH
                      </div>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={placingOrder}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white font-bold text-xl rounded-xl hover:from-red-600 hover:via-pink-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/40 tracking-wider"
                      >
                        {placingOrder ? 'INITIALIZING PROTOCOL...' : '⚡ EXECUTE BOOST PROTOCOL ⚡'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Modal>

          <style jsx global>{`
            /* 去掉Modal的黑框 */
            .cyber-modal .ant-modal-content {
              background: transparent !important;
              border-radius: 16px !important;
              overflow: hidden !important;
              box-shadow: 0 0 50px rgba(139, 92, 246, 0.3) !important;
              border: none !important;
              padding: 0 !important;
            }
            .cyber-modal .ant-modal-header {
              display: none !important;
            }
            .cyber-modal .ant-modal-close {
              color: #22d3ee !important;
              font-size: 20px !important;
              top: 16px !important;
              right: 16px !important;
              z-index: 1000 !important;
              background: rgba(0, 0, 0, 0.3) !important;
              border-radius: 50% !important;
              width: 32px !important;
              height: 32px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border: 1px solid rgba(34, 211, 238, 0.3) !important;
            }
            .cyber-modal .ant-modal-close:hover {
              background: rgba(34, 211, 238, 0.2) !important;
            }
            .cyber-modal .ant-modal-body {
              padding: 0 !important;
            }

            /* 完全隐藏滚动条 */
            .cyber-modal .ant-modal-body::-webkit-scrollbar {
              display: none !important;
            }
            
            /* 为textarea也隐藏滚动条 */
            textarea::-webkit-scrollbar {
              display: none !important;
            }
          `}</style>
        </div>
      </main>
    </div>
  );
}