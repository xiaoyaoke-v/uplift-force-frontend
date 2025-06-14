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
  { name: "League of Legends", imagePath: "/assets/vPDdLphp8evDVz1631089142210908.png" },
  { name: "Honor of Kings", imagePath: "/assets/zympYphpKVhaHN1685523686230531.png" },
  { name: "LoL Mobile", imagePath: "/assets/lS2IgphpoLR7Nz1627293846210726.png" },
  { name: "Genshin Impact", imagePath: "/assets/U0lBQphpIpZJ4r1691047295230803.png" },
  { name: "Naruto Online", imagePath: "/assets/YRWCFphpsLACiz1609212217201229.jpg" },
  { name: "Identity V", imagePath: "/assets/DUlTBphp99strS1715841920240516.jpg" },
  { name: "Valorant", imagePath: "/assets/w8eVLphpkcD8vY1688004090230629.jpg" },
  { name: "Delta Force", imagePath: "/assets/68GDUphpGl5gM71727258391240925.webp" },
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
              Enhance Your Gaming Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <TrophyOutlined style={{ fontSize: '48px', color: '#6ee7b7' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Professional Boosting</h3>
                <p className="text-gray-400">Experienced players help you rank up quickly and break through bottlenecks.</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <SafetyOutlined style={{ fontSize: '48px', color: '#3b82f6' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Safe & Reliable</h3>
                <p className="text-gray-400">Privacy protection and secure transactions for peace of mind.</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <DollarOutlined style={{ fontSize: '48px', color: '#9333ea' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Great Value</h3>
                <p className="text-gray-400">Reasonable prices and efficient service to help you achieve your goals.</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <RocketOutlined style={{ fontSize: '48px', color: '#e7b76e' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Fast Response</h3>
                <p className="text-gray-400">Quick matching and instant start to save your valuable time.</p>
              </Card>
            </div>
          </div>
          {/* End New Promotional Section */}

          {/* Second Promotional Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Our Advantages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <TrophyOutlined style={{ fontSize: '48px', color: '#e76e6e' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Top Players</h3>
                <p className="text-gray-400">Only the highest-level players are selected to ensure your experience.</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <SafetyOutlined style={{ fontSize: '48px', color: '#6ee7b7' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">24/7 Support</h3>
                <p className="text-gray-400">Customer service is online around the clock to solve your problems at any time.</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <DollarOutlined style={{ fontSize: '48px', color: '#3b82f6' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Transparent Progress</h3>
                <p className="text-gray-400">View your order progress in real time, everything is under control.</p>
              </Card>
              <Card className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
                <RocketOutlined style={{ fontSize: '48px', color: '#9333ea' }} className="mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Customized Service</h3>
                <p className="text-gray-400">Personalized boosting plans tailored to your needs.</p>
              </Card>
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
                  <div className="flex flex-col items-center justify-center w-full gap-4">
                    <img src={game.imagePath} alt={game.name} className="w-24 h-24 min-w-24 min-h-24 object-cover rounded-2xl shadow-lg mx-auto" />
                    <h3 className="text-2xl font-bold text-white text-center w-full">{game.name}</h3>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          {/* End Fifth Promotional Section */}

          <div className="text-center mt-12">
            <Button type="primary" size="large" className="!bg-gradient-to-r !from-[#3b82f6] !to-[#9333ea] !text-white !font-extrabold !text-base !rounded-xl !py-5 !px-12 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
              Order Now
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
} 