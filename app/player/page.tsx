'use client'

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, Spin, Space, Tag } from 'antd';
import { TrophyOutlined, SafetyOutlined, DollarOutlined, RocketOutlined } from '@ant-design/icons';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getPlayerOrders, submitOrder } from '@/apis';

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

const games = [
  { name: "英雄联盟", imagePath: "/assets/vPDdLphp8evDVz1631089142210908.png" },
  { name: "王者荣耀", imagePath: "/assets/zympYphpKVhaHN1685523686230531.png" },
  { name: "LoL 手游", imagePath: "/assets/lS2IgphpoLR7Nz1627293846210726.png" },
  { name: "原神", imagePath: "/assets/U0lBQphpIpZJ4r1691047295230803.png" },
  { name: "火影忍者", imagePath: "/assets/YRWCFphpsLACiz1609212217201229.jpg" },
  { name: "第五人格手游", imagePath: "/assets/DUlTBphp99strS1715841920240516.jpg" },
  { name: "无畏契约", imagePath: "/assets/w8eVLphpkcD8vY1688004090230629.jpg" },
  { name: "三角洲行动", imagePath: "/assets/68GDUphpGl5gM71727258391240925.webp" },



];

export default function PlayerDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [form] = Form.useForm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

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
              提升您的游戏体验
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <TrophyOutlined style={{ fontSize: '48px', color: '#6ee7b7' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">专业提升</h3>
                <p className="text-gray-400">经验丰富的玩家助您快速上分，突破瓶颈。</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <SafetyOutlined style={{ fontSize: '48px', color: '#3b82f6' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">安全可靠</h3>
                <p className="text-gray-400">隐私保护，安全交易，让您无后顾之忧。</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <DollarOutlined style={{ fontSize: '48px', color: '#9333ea' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">高性价比</h3>
                <p className="text-gray-400">合理价格，高效服务，助您实现目标。</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <RocketOutlined style={{ fontSize: '48px', color: '#e7b76e' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">极速响应</h3>
                <p className="text-gray-400">快速匹配，即时启动，节省您的宝贵时间。</p>
              </Card>
            </div>
          </div>
          {/* End New Promotional Section */}

          {/* Second Promotional Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              我们的优势
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <TrophyOutlined style={{ fontSize: '48px', color: '#e76e6e' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">顶级玩家</h3>
                <p className="text-gray-400">只选择最高水平的玩家，保障您的体验。</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <SafetyOutlined style={{ fontSize: '48px', color: '#6ee7b7' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">24/7支持</h3>
                <p className="text-gray-400">全天候在线客服，随时为您解决问题。</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <DollarOutlined style={{ fontSize: '48px', color: '#3b82f6' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">透明进度</h3>
                <p className="text-gray-400">实时查看订单进度，一切尽在掌握。</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <RocketOutlined style={{ fontSize: '48px', color: '#9333ea' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">定制服务</h3>
                <p className="text-gray-400">根据您的需求，提供个性化提升方案。</p>
              </Card>
            </div>
          </div>
          {/* End Second Promotional Section */}

          {/* Fifth Promotional Section - Popular Games */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              热门游戏全覆盖
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              {games.map((game) => (
                <Card key={game.name} className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg !border-none">
                  <img src={game.imagePath} alt={game.name} className="w-32 h-32 mb-6 object-cover rounded-2xl shadow-lg" />
                  <h3 className="text-2xl font-bold text-white">{game.name}</h3>
                </Card>
              ))}
            </div>
          </div>
          {/* End Fifth Promotional Section */}

          <div className="text-center mt-12">
            <Button type="primary" size="large" className="!bg-gradient-to-r !from-[#3b82f6] !to-[#9333ea] !text-white !font-extrabold !text-base !rounded-xl !py-5 !px-12 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
              立即下单
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
} 