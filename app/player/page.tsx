'use client'

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, Spin, Space, Tag } from 'antd';
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
      <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#18181b] via-[#23234a] to-[#0a0a23] p-4">
        <div className="max-w-4xl w-full p-8 rounded-3xl bg-white/5 backdrop-blur-lg shadow-2xl border border-[#23234a]">
          <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-[#6ee7b7] via-[#3b82f6] to-[#9333ea] bg-clip-text text-transparent drop-shadow-lg text-center">
            Player
          </h1>

          <Card title="Submit New Boosting Request" className="mb-8 !bg-white/5 !border-[#23234a] !text-gray-300 p-6 rounded-xl shadow-lg">
            <Form form={form} layout="vertical" onFinish={handleSubmitOrder}>
              <Form.Item label={<span className="text-white text-base font-semibold">Game</span>} name="game" rules={[{ required: true, message: 'Please select a game!' }]}>
                <Select placeholder="Select a game" className="!bg-white/15 !border-[#4a4a6b] !text-white focus:!border-[#6ee7b7] transition-all duration-300" dropdownStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #4a4a6b' }}>
                  <Option value="LoL">League of Legends</Option>
                  <Option value="Valorant">Valorant</Option>
                  {/* Add more games as needed */}
                </Select>
              </Form.Item>
              <Form.Item label={<span className="text-white text-base font-semibold">Current Rank</span>} name="currentRank" rules={[{ required: true, message: 'Please enter your current rank!' }]}>
                <Input placeholder="e.g., Silver IV" className="!bg-white/15 !border-[#4a4a6b] !text-white focus:!border-[#6ee7b7] transition-all duration-300" />
              </Form.Item>
              <Form.Item label={<span className="text-white text-base font-semibold">Desired Rank</span>} name="desiredRank" rules={[{ required: true, message: 'Please enter your desired rank!' }]}>
                <Input placeholder="e.g., Gold II" className="!bg-white/15 !border-[#4a4a6b] !text-white focus:!border-[#6ee7b7] transition-all duration-300" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block className="!bg-gradient-to-r !from-[#6ee7b7] !to-[#3b82f6] hover:!from-[#3b82f6] hover:!to-[#6ee7b7] !text-white !font-bold !text-lg !rounded-lg !py-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  Submit Request
                </Button>
              </Form.Item>
            </Form>
          </Card>

        </div>
      </main>
    </div>
  );
} 