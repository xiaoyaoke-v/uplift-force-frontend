'use client'

import React, { useState, useEffect } from 'react';
import { Card, Spin, Space, Tag, Button, Tabs } from 'antd';
import { PlayCircleOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getAvailableOrders, getBoosterOrders, acceptOrder } from '@/apis';
import type { Order } from '@/types';

const { TabPane } = Tabs;

export default function BoosterDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingAvailableOrders, setLoadingAvailableOrders] = useState(false);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/'); // Redirect to login if not authenticated
    } else if (user.role !== 'booster') {
      // Optionally redirect to a different page or show an access denied message
      router.push('/'); // Redirect if not a booster
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === 'booster') {
      fetchAvailableOrders();
      fetchMyOrders();
    }
  }, [user]);

  const fetchAvailableOrders = async () => {
    setLoadingAvailableOrders(true);
    try {
      const fetchedOrders = await getAvailableOrders();
      setAvailableOrders(fetchedOrders);
    } catch (error) {
      console.error('Failed to fetch available orders:', error);
    } finally {
      setLoadingAvailableOrders(false);
    }
  };

  const fetchMyOrders = async () => {
    setLoadingMyOrders(true);
    try {
      const fetchedMyOrders = await getBoosterOrders(user!.id);
      setMyOrders(fetchedMyOrders);
    } catch (error) {
      console.error('Failed to fetch my orders:', error);
    } finally {
      setLoadingMyOrders(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder({ orderId, boosterId: user!.id });
      fetchAvailableOrders();
      fetchMyOrders();
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  };

  if (!user || user.role !== 'booster') {
    return <p>Access Denied or Loading User Data...</p>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#18181b] via-[#23234a] to-[#0a0a23] p-6 md:p-10 lg:p-14">
        <div className="max-w-4xl w-full p-8 rounded-3xl bg-white/5 backdrop-blur-lg shadow-2xl border border-[#23234a]">
          <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-[#6ee7b7] via-[#3b82f6] to-[#9333ea] bg-clip-text text-transparent drop-shadow-lg text-center">
            Booster
          </h1>

          <Tabs 
            defaultActiveKey="available" 
            centered 
            className="!text-gray-300"
            tabBarStyle={{ borderColor: '#23234a' }}
            items={[
              {
                label: <span className="!text-gray-300 hover:!text-[#6ee7b7] focus:!text-[#6ee7b7] text-lg font-semibold">Available Boosting Requests</span>,
                key: 'available',
                children: (
                  <Card className="!bg-white/5 !border-[#23234a] !text-gray-300">
                    {loadingAvailableOrders ? (
                      <Spin tip="Loading available orders...">
                        <div style={{ height: '100px' }} />
                      </Spin>
                    ) : availableOrders.length === 0 ? (
                      <p>No available orders found.</p>
                    ) : (
                      <Space direction="vertical" className="w-full">
                        {availableOrders.map(order => (
                          <Card key={order.id} size="small" className="!bg-white/10 !border-[#23234a] !text-gray-200 p-6 rounded-xl transform transition-all duration-300 hover:scale-[1.02] shadow-md">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base mb-4">
                              <p className="flex items-center"><PlayCircleOutlined className="mr-2 text-lg text-blue-400" /><strong>Game:</strong> <span className="ml-2 text-gray-100">{order.game}</span></p>
                              <p className="flex items-center"><TrophyOutlined className="mr-2 text-lg text-yellow-400" /><strong>Current Rank:</strong> <span className="ml-2 text-gray-100">{order.currentRank}</span></p>
                              <p className="flex items-center"><TrophyOutlined className="mr-2 text-lg text-yellow-400" /><strong>Desired Rank:</strong> <span className="ml-2 text-gray-100">{order.desiredRank}</span></p>
                              <p className="flex items-center"><UserOutlined className="mr-2 text-lg text-purple-400" /><strong>Player:</strong> <span className="ml-2 text-gray-100">{order.playerId}</span></p>
                            </div>
                            <div className="flex items-center mb-4">
                              <strong className="mr-2">Status:</strong> 
                              <Tag className="!rounded-full !px-3 !py-1 !text-sm" color={order.status === 'pending' ? 'volcano' : order.status === 'accepted' ? 'blue' : 'green'}>{order.status.toUpperCase()}</Tag>
                            </div>
                            <Button type="primary" size="large" onClick={() => handleAcceptOrder(order.id)} className="w-full !bg-gradient-to-r !from-[#6ee7b7] !to-[#3b82f6] hover:!from-[#3b82f6] hover:!to-[#6ee7b7] !text-white !font-bold !rounded-lg !py-2">
                              Accept Order
                            </Button>
                          </Card>
                        ))}
                      </Space>
                    )}
                  </Card>
                ),
              },
              {
                label: <span className="!text-gray-300 hover:!text-[#6ee7b7] focus:!text-[#6ee7b7] text-lg font-semibold">My Accepted Orders</span>,
                key: 'myOrders',
                children: (
                  <Card className="!bg-white/5 !border-[#23234a] !text-gray-300">
                    {loadingMyOrders ? (
                      <Spin tip="Loading my orders...">
                        <div style={{ height: '100px' }} />
                      </Spin>
                    ) : myOrders.length === 0 ? (
                      <p>No accepted orders found.</p>
                    ) : (
                      <Space direction="vertical" className="w-full">
                        {myOrders.map(order => (
                          <Card key={order.id} size="small" className="!bg-white/10 !border-[#23234a] !text-gray-200 p-6 rounded-xl transform transition-all duration-300 hover:scale-[1.02] shadow-md">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base mb-4">
                              <p className="flex items-center"><PlayCircleOutlined className="mr-2 text-lg text-blue-400" /><strong>Game:</strong> <span className="ml-2 text-gray-100">{order.game}</span></p>
                              <p className="flex items-center"><TrophyOutlined className="mr-2 text-lg text-yellow-400" /><strong>Current Rank:</strong> <span className="ml-2 text-gray-100">{order.currentRank}</span></p>
                              <p className="flex items-center"><TrophyOutlined className="mr-2 text-lg text-yellow-400" /><strong>Desired Rank:</strong> <span className="ml-2 text-gray-100">{order.desiredRank}</span></p>
                              <p className="flex items-center"><UserOutlined className="mr-2 text-lg text-purple-400" /><strong>Player:</strong> <span className="ml-2 text-gray-100">{order.playerId}</span></p>
                            </div>
                            <div className="flex items-center mb-4">
                              <strong className="mr-2">Status:</strong> 
                              <Tag className="!rounded-full !px-3 !py-1 !text-sm" color={order.status === 'accepted' ? 'blue' : 'green'}>{order.status.toUpperCase()}</Tag>
                            </div>
                            {/* Add options to update order status (e.g., mark as completed) */}
                          </Card>
                        ))}
                      </Space>
                    )}
                  </Card>
                ),
              },
            ]}
          />
        </div>
      </main>
    </div>
  );
} 