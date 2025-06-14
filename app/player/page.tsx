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
  // Add more order details as needed
}

const games: Game[] = [
  { name: "League of Legends", imagePath: "/assets/vPDdLphp8evDVz1631089142210908.png" },
  { name: "Honor of Kings", imagePath: "/assets/zympYphpKVhaHN1685523686230531.png" },
  { name: "LoL Mobile", imagePath: "/assets/lS2IgphpoLR7Nz1627293846210726.png" },
  { name: "Genshin Impact", imagePath: "/assets/U0lBQphpIpZJ4r1691047295230803.png" },
  { name: "Naruto Online", imagePath: "/assets/YRWCFphpsLACiz1609212217201229.jpg" },
  { name: "Identity V", imagePath: "/assets/DUlTBphp99strS1715841920240516.jpg" },
  { name: "Valorant", imagePath: "/assets/w8eVLphpkcD8vY1688004090230629.jpg" },
  { name: "Delta Force", imagePath: "/assets/68GDUphpGl5gM71727258391240925.webp" },
];

// 网络和服务器选项
const networkOptions = [
  { label: 'Telecom', value: 'telecom' },
  { label: 'Unicom', value: 'unicom' },
  { label: 'All Networks', value: 'all' },
];

// 国家/地区选项
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

// Tier 样式映射
const tierStyles: Record<string, string> = {
  'IRON': 'from-gray-200 via-gray-300 to-gray-100 border-gray-400 text-gray-800',
  'BRONZE': 'from-yellow-100 via-yellow-200 to-yellow-50 border-yellow-400 text-yellow-800',
  'SILVER': 'from-slate-100 via-slate-200 to-slate-50 border-slate-400 text-slate-800',
  'GOLD': 'from-yellow-200 via-yellow-300 to-yellow-100 border-yellow-500 text-yellow-900',
  'PLATINUM': 'from-green-100 via-green-200 to-green-50 border-green-400 text-green-800',
  'EMERALD': 'from-emerald-100 via-emerald-200 to-emerald-50 border-emerald-400 text-emerald-800',
  'DIAMOND': 'from-blue-100 via-blue-200 to-blue-50 border-blue-400 text-blue-800',
  'MASTER': 'from-purple-100 via-purple-200 to-purple-50 border-purple-400 text-purple-800',
  'GRANDMASTER': 'from-pink-100 via-pink-200 to-pink-50 border-pink-400 text-pink-800',
  'CHALLENGER': 'from-orange-100 via-orange-200 to-orange-50 border-orange-400 text-orange-800',
};

// 段位顺序
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
  const [selectedGame, setSelectedGame] = useState<string>('League of Legends');
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('telecom');
  const [selectedRegion, setSelectedRegion] = useState('NA');
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [riotId, setRiotId] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<IPlayerAccount | null>(null);
  const [playerError, setPlayerError] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [targetOptions, setTargetOptions] = useState<string[]>([]);
  const [targetRank, setTargetRank] = useState<string | null>(null);
  const [extraModalOpen, setExtraModalOpen] = useState(false);
  const [extraInfo, setExtraInfo] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/'); // Redirect to login if not authenticated
    } else if (user.role !== 'player') {
      // Optionally redirect to a different page or show an access denied message
      router.push('/'); // Redirect if not a player
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

  const handleSubmitOrder = async (values: any) => {
    try {
      const newOrder = await submitOrder({ ...values, playerId: user!.id });
      setOrders(prevOrders => [...prevOrders, newOrder]);
      form.resetFields();
    } catch (error) {
      console.error('Failed to submit order:', error);
    }
  };

  // 默认选中第一项
  useEffect(() => {
    if (playerInfo && playerInfo.leagueEntries.length > 0 && selectedIdx === null) {
      setSelectedIdx(0);
    }
  }, [playerInfo]);

  if (!user || user.role !== 'player') {
    return <p>Access Denied or Loading User Data...</p>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center bg-gradient-to-br from-[#18181b] via-[#23234a] to-[#0a0a23] px-4 py-8">
        <div className="w-full">

          {/* New Promotional Section */}
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
          {/* End New Promotional Section */}

          {/* Second Promotional Section */}
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
          {/* End Second Promotional Section */}

          {/* Fifth Promotional Section - Popular Games */}
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
          {/* End Fifth Promotional Section */}

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
          <Modal
            title={<span className="block truncate text-lg font-bold">Select a Game</span>}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
            centered
            width={700}
          >
            <div className="grid grid-cols-4 gap-6 py-4">
              {games.map((game) => {
                const disabled = game.name !== 'League of Legends';
                return (
                  <button
                    key={game.name}
                    className={`flex flex-col items-center justify-center w-full aspect-square max-w-[160px] h-[160px] mx-auto p-4 rounded-xl border transition-all duration-200 ${disabled ? 'bg-gray-200 cursor-not-allowed opacity-60' : 'bg-white/10 hover:bg-blue-500/20 cursor-pointer'} ${selectedGame === game.name && !disabled ? 'ring-2 ring-blue-400' : ''}`}
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) {
                        setSelectedGame(game.name);
                        setIsModalOpen(false);
                        setTimeout(() => setIsServerModalOpen(true), 200);
                      }
                    }}
                    type="button"
                  >
                    <img
                      src={game.imagePath}
                      alt={game.name}
                      className="w-16 h-16 object-cover rounded-lg mb-3"
                      style={{ filter: disabled ? 'grayscale(1)' : 'none' }}
                    />
                    <span className="text-base font-semibold text-gray-900 text-center break-words w-full" style={{ color: disabled ? '#aaa' : undefined }}>{game.name}</span>
                  </button>
                );
              })}
            </div>
          </Modal>
          {/* 服务器选择弹窗 */}
          <Modal
            title={<span className="block truncate text-lg font-bold">Select Region Server</span>}
            open={isServerModalOpen}
            onCancel={() => setIsServerModalOpen(false)}
            footer={null}
            centered
            width={500}
            className="!rounded-2xl !shadow-2xl"
          >
            <div className="py-4 flex flex-col items-center">
              <div className="grid grid-cols-4 gap-4 w-full">
                {regionOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`w-full py-3 px-2 rounded-xl border-2 font-semibold transition-all duration-200 text-base shadow-sm ${selectedRegion === opt.value ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white border-purple-500 shadow-lg scale-105' : 'bg-white/10 hover:bg-purple-100 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'}`}
                    onClick={() => {
                      setSelectedRegion(opt.value);
                      setIsServerModalOpen(false);
                      setTimeout(() => setIsInputModalOpen(true), 300);
                    }}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Modal>
          {/* 输入角色名和tagLine弹窗 */}
          <Modal
            title={<span className="block truncate text-2xl font-extrabold text-gradient bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent">Player Information</span>}
            open={isInputModalOpen}
            onCancel={() => setIsInputModalOpen(false)}
            footer={null}
            centered
            width={600}
            className="!rounded-2xl !shadow-2xl web3-modal"
          >
            <div className="flex flex-col gap-6 py-4">
              {playerInfo ? (
                <div>
                  <div className="mb-8 text-center text-2xl font-extrabold text-gradient bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent tracking-wide drop-shadow">{playerInfo.summoner.gameName}</div>
                  <div className="grid grid-cols-2 gap-6">
                    {playerInfo.leagueEntries.map((entry: IPlayerAccount['leagueEntries'][number], idx) => {
                      const tier = entry.tier?.toUpperCase() || 'UNRANKED';
                      const tierTextStyles: Record<string, string> = {
                        'IRON': 'text-gray-500',
                        'BRONZE': 'text-yellow-700',
                        'SILVER': 'text-slate-500',
                        'GOLD': 'text-yellow-500',
                        'PLATINUM': 'text-green-500',
                        'EMERALD': 'text-emerald-500',
                        'DIAMOND': 'text-blue-500',
                        'MASTER': 'text-purple-500',
                        'GRANDMASTER': 'text-pink-500',
                        'CHALLENGER': 'text-orange-500',
                      };
                      const textStyle = tierTextStyles[tier] || 'text-gray-700';
                      // 浅色背景
                      const itemBg = 'bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 border border-purple-500';
                      // hover/选中样式
                      const isSelected = selectedIdx === idx;
                      return (
                        <div
                          key={entry.queueType}
                          className={
                            `${itemBg} rounded-2xl p-8 shadow-lg flex flex-col items-center cursor-pointer transition-all duration-150 ` +
                            `hover:shadow-2xl hover:border-pink-400 hover:scale-105 ` +
                            `${isSelected ? 'ring-4 ring-pink-400 scale-105' : ''}`
                          }
                          onClick={() => {
                            setSelectedIdx(idx);
                            // 计算可选目标段位
                            const currentTierIdx = RANK_ORDER.indexOf(tier);
                            setTargetOptions(RANK_ORDER.slice(currentTierIdx + 1));
                            setTargetRank(null);
                            setIsInputModalOpen(false); // 关闭 Player Information 弹窗
                            setTimeout(() => setServiceModalOpen(true), 200);
                          }}
                        >
                          <div className="text-xl font-bold mb-3 tracking-wider uppercase drop-shadow-sm opacity-95 text-gradient bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">{entry.queueType}</div>
                          <div className={`text-3xl font-extrabold mt-2 drop-shadow-lg ${textStyle}`}>
                            {entry.tier} {entry.rank}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : playerError ? (
                <div className="text-red-500 text-center text-base font-semibold py-6">{playerError}</div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Riot ID"
                    value={riotId}
                    onChange={e => setRiotId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base"
                  />
                  <button
                    className="w-full mt-2 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-base shadow-md hover:from-purple-500 hover:to-blue-500 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                    disabled={searchLoading || !riotId}
                    onClick={async () => {
                      setSearchLoading(true);
                      setPlayerInfo(null);
                      setPlayerError('');
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
                    }}
                  >
                    {searchLoading ? 'Searching...' : 'Search Player'}
                  </button>
                </>
              )}
            </div>
            <style jsx global>{`
              .web3-modal {
                background: linear-gradient(135deg, #181a2a 0%, #23234d 100%);
                border: 2px solid #6d28d9;
              }
            `}</style>
          </Modal>
          {/* 服务选择弹窗 */}
          <AntdModal
            open={serviceModalOpen}
            onCancel={() => setServiceModalOpen(false)}
            footer={null}
            title={<span className="text-xl font-bold">Select Service</span>}
            centered
          >
            <div className="grid grid-cols-2 gap-6 my-6">
              <button
                className={`py-6 rounded-xl font-bold text-lg transition-all border-2
                  ${selectedService === 'Boosting' ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 text-white border-pink-400 scale-105 shadow-lg' : 'bg-white/10 text-purple-700 border-purple-200 hover:border-pink-400 hover:bg-purple-50'}`}
                onClick={() => {
                  setSelectedService('Boosting');
                  setServiceModalOpen(false);
                  setTimeout(() => setTargetModalOpen(true), 200);
                }}
              >
                Boosting
              </button>
              <button
                className="py-6 rounded-xl font-bold text-lg border-2 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                disabled
              >
                Play with
              </button>
            </div>
          </AntdModal>
          {/* 目标段位选择弹窗（按钮风格） */}
          <AntdModal
            open={targetModalOpen}
            onCancel={() => setTargetModalOpen(false)}
            footer={null}
            title={<span className="text-xl font-bold">Select Target Rank</span>}
            centered
          >
            <div className="grid grid-cols-3 gap-4 my-4">
              {targetOptions.map(opt => (
                <button
                  key={opt}
                  className={`py-3 rounded-xl font-bold text-base transition-all border-2
                    ${targetRank === opt ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 text-white border-pink-400 scale-105 shadow-lg' : 'bg-white/10 text-purple-700 border-purple-200 hover:border-pink-400 hover:bg-purple-50'}`}
                  onClick={() => {
                    setTargetRank(opt);
                    setTargetModalOpen(false);
                    setTimeout(() => setExtraModalOpen(true), 200);
                  }}
                >
                  {opt.charAt(0) + opt.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </AntdModal>
          {/* 额外信息弹窗 */}
          <AntdModal
            open={extraModalOpen}
            footer={null}
            title={<span className="text-xl font-bold">Additional Information</span>}
            centered
            onCancel={() => setExtraModalOpen(false)}
          >
            <textarea
              className="w-full min-h-[100px] p-3 rounded-lg border border-purple-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none text-base resize-vertical"
              placeholder="Enter any additional information (optional)"
              value={extraInfo}
              onChange={e => setExtraInfo(e.target.value)}
            />
            <div className="mt-6 flex flex-col items-center gap-4">
              <button
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 text-white font-bold text-lg shadow-md hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => {
                  // 计算价格
                  if (!targetRank || selectedIdx === null || !playerInfo) return;
                  const currentTier = playerInfo.leagueEntries[selectedIdx].tier?.toUpperCase() || 'IRON';
                  const fromIdx = RANK_ORDER.indexOf(currentTier);
                  const toIdx = RANK_ORDER.indexOf(targetRank);
                  const diff = Math.max(0, toIdx - fromIdx);
                  setPrice(diff * 0.002);
                  setExtraModalOpen(false);
                  setTimeout(() => setPriceModalOpen(true), 200);
                }}
                disabled={!targetRank}
              >
                Get Price
              </button>
            </div>
          </AntdModal>
          {/* 价格弹窗 */}
          <AntdModal
            open={priceModalOpen}
            footer={null}
            title={<span className="text-xl font-bold">Price</span>}
            centered
            onCancel={() => setPriceModalOpen(false)}
          >
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="text-2xl font-extrabold text-gradient bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent">{price} ETH</div>
              <button
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 via-purple-500 to-blue-400 text-white font-bold text-lg shadow-md hover:from-blue-500 hover:to-pink-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={async () => {
                  setPlacingOrder(true);
                  // TODO: 下单逻辑·
                  setTimeout(() => {
                    setPlacingOrder(false);
                    setPriceModalOpen(false);
                    setPrice(null);
                  }, 1200);
                }}
                disabled={placingOrder}
              >
                {placingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </AntdModal>
        </div>
      </main>
    </div>
  );
} 