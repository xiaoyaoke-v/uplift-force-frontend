'use client'

import React, { useState, useEffect } from 'react';
import { Card, Spin, Space, Tag, Button, Select, Input, Pagination, Modal, message } from 'antd';
import { TrophyOutlined, EyeOutlined, MessageOutlined, RedoOutlined, StarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from "@/components/Sidebar";
import { getMyOrders, getAllOrders, type IOrder, type IOrdersParams } from '@/apis';

const { Option } = Select;

// Order status mapping - English
const ORDER_STATUSES = {
  'posted': { color: 'blue', text: 'Posted' },
  'accepted': { color: 'orange', text: 'Accepted' },
  'confirmed': { color: 'cyan', text: 'Confirmed' },
  'in_progress': { color: 'processing', text: 'In Progress' },
  'completed': { color: 'success', text: 'Completed' },
  'cancelled': { color: 'default', text: 'Cancelled' },
  'failed': { color: 'error', text: 'Failed' },
};

// Game types mapping
const GAME_TYPES = {
  'League of Legends': { 
    shortName: 'LoL', 
    color: '#C8AA6E',
    icon: '🏆'
  },
  'Valorant': { 
    shortName: 'Val', 
    color: '#FF4654',
    icon: '🎯'
  },
  'Honor of Kings': { 
    shortName: 'HoK', 
    color: '#1E90FF',
    icon: '👑'
  },
  'Genshin Impact': { 
    shortName: 'GI', 
    color: '#4A90E2',
    icon: '⚔️'
  },
  'World of Warcraft': { 
    shortName: 'WoW', 
    color: '#F4C430',
    icon: '🐉'
  },
  'Diablo IV': { 
    shortName: 'D4', 
    color: '#8B0000',
    icon: '🔥'
  },
};

// Service type mapping - English
const SERVICE_TYPES = {
  'Boosting': 'Boosting',
  'PLAY WITH': 'Play With'
};

// Game mode mapping - English
const GAME_MODES = {
  'RANKED_SOLO_5x5': 'Solo Queue',
  'RANKED_FLEX_SR': 'Flex Queue'
};

export default function OrdersPage() {
  const { user } = useUser();
  const router = useRouter();
  
  // State management
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [myOrders, setMyOrders] = useState<IOrder[]>([]);
  const [allOrders, setAllOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [myOrdersPage, setMyOrdersPage] = useState(1);
  const [allOrdersPage, setAllOrdersPage] = useState(1);
  const [myOrdersTotal, setMyOrdersTotal] = useState(0);
  const [allOrdersTotal, setAllOrdersTotal] = useState(0);
  const pageSize = 10;
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [gameTypeFilter, setGameTypeFilter] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (!user.role || (user.role !== 'player' && user.role !== 'booster')) {
      console.error('Invalid user role:', user.role);
      router.push('/');
      return;
    }
    
    // If user is booster, default to 'all' tab
    if (user.role === 'booster') {
      setActiveTab('all');
    }
    
    fetchOrders();
  }, [user, activeTab, myOrdersPage, allOrdersPage, statusFilter, gameTypeFilter]);

  // Get my orders
  const fetchMyOrders = async () => {
    try {
      const params: IOrdersParams = {
        page: myOrdersPage,
        page_size: pageSize,
      };
      
      if (statusFilter) params.status = statusFilter;
      if (gameTypeFilter) params.game_type = gameTypeFilter;
      
      const data = await getMyOrders(params);
      
      if (data && Array.isArray(data.orders)) {
        setMyOrders(data.orders);
        setMyOrdersTotal(data.total || 0);
      } else {
        console.error('Invalid data format:', data);
        message.error('Data format error');
      }
    } catch (error) {
      console.error('Failed to fetch my orders:', error);
      message.error('Failed to fetch my orders');
    }
  };

  // Get all orders
  const fetchAllOrders = async () => {
    try {
      const params: IOrdersParams = {
        page: allOrdersPage,
        page_size: pageSize,
      };
      
      if (statusFilter) params.status = statusFilter;
      if (gameTypeFilter) params.game_type = gameTypeFilter;
      
      const data = await getAllOrders(params);
      
      if (data && Array.isArray(data.orders)) {
        setAllOrders(data.orders);
        setAllOrdersTotal(data.total || 0);
      } else {
        console.error('Invalid data format:', data);
        message.error('Data format error');
      }
    } catch (error) {
      console.error('Failed to fetch all orders:', error);
      message.error('Failed to fetch all orders');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my') {
        await fetchMyOrders();
      } else {
        await fetchAllOrders();
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('');
    setGameTypeFilter('');
    setMyOrdersPage(1);
    setAllOrdersPage(1);
  };

  // Get game info
  const getGameInfo = (gameType: string) => {
    return GAME_TYPES[gameType] || { 
      shortName: gameType.substring(0, 3), 
      color: '#666666',
      icon: '🎮'
    };
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format amount - no rounding, remove trailing zeros
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num === 0) return "0";
    return num.toString().replace(/\.?0+$/, '');
  };

  // Render order card
  const renderOrderCard = (order: IOrder) => {
    const gameInfo = getGameInfo(order.game_type);
    const statusInfo = ORDER_STATUSES[order.status];
    
    return (
      <Card
        key={order.id}
        className="order-card"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '12px',
          marginBottom: '16px',
          transition: 'all 0.3s ease',
        }}
        hoverable
      >
        {/* Order header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: `linear-gradient(45deg, ${gameInfo.color}, #00ffff)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#000',
              }}
            >
              {gameInfo.shortName}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                #{order.order_no}
              </div>
              <div style={{ color: '#00ffff', fontSize: '12px' }}>
                {order.game_type} · {GAME_MODES[order.game_mode]}
              </div>
            </div>
          </div>
          <Tag color={statusInfo.color} style={{ fontWeight: 'bold' }}>
            {statusInfo.text}
          </Tag>
        </div>

        {/* Order details grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '16px', 
          marginBottom: '16px' 
        }}>
          {/* Service type */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
              Service
            </div>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>
              {SERVICE_TYPES[order.service_type]}
            </div>
          </div>
          
          {/* Current rank */}
          {order.current_rank && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                From Rank
              </div>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>
                {order.current_rank}
              </div>
            </div>
          )}
          
          {/* Target rank */}
          {order.target_rank && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                To Rank
              </div>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>
                {order.target_rank}
              </div>
            </div>
          )}
          
          {/* Price */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
              Amount
            </div>
            <div style={{ color: '#00ff00', fontWeight: 'bold' }}>
              {formatAmount(order.total_amount)} ETH
            </div>
          </div>

          {/* Server region */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
              Region
            </div>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>
              {order.server_region}
            </div>
          </div>
          
          {/* My role (only show in my orders page) */}
          {activeTab === 'my' && order.my_role && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                My Role
              </div>
              <div style={{ color: '#ff00ff', fontWeight: 'bold' }}>
                {order.my_role === 'player' ? 'Client' : 'Booster'}
              </div>
            </div>
          )}
          
          {/* User info (only show in all orders page) */}
          {activeTab === 'all' && (
            <>
              {order.player_username && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Client
                  </div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>
                    {order.player_username}
                  </div>
                </div>
              )}
              
              {order.booster_username && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Booster
                  </div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>
                    {order.booster_username}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Game account */}
        <div style={{ 
          marginBottom: '16px',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
          border: '1px solid rgba(0, 255, 255, 0.2)'
        }}>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
            Game Account
          </div>
          <div style={{ color: '#00ffff', fontWeight: 'bold' }}>
            {order.game_account}
          </div>
        </div>

        {/* Requirements */}
        {order.requirements && (
          <div style={{ 
            color: '#ccc', 
            fontSize: '14px', 
            lineHeight: '1.4', 
            marginBottom: '16px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px'
          }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
              Requirements
            </div>
            {order.requirements}
          </div>
        )}

        {/* Time information */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '12px',
          color: '#888',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ClockCircleOutlined />
            Created: {formatDate(order.created_at)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ClockCircleOutlined />
            Deadline: {formatDate(order.deadline)}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          justifyContent: 'flex-end'
        }}>
          {activeTab === 'my' ? (
            <>
              {order.status === 'in_progress' && (
                <Button
                  size="small"
                  icon={<MessageOutlined />}
                  style={{
                    background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  Contact {order.my_role === 'player' ? 'Booster' : 'Client'}
                </Button>
              )}
              
              {order.status === 'completed' && order.my_role === 'player' && (
                <>
                  <Button
                    size="small"
                    icon={<StarOutlined />}
                    style={{
                      background: 'transparent',
                      color: '#ffa500',
                      border: '1px solid #ffa500',
                      borderRadius: '20px',
                    }}
                  >
                    Review
                  </Button>
                  <Button
                    size="small"
                    icon={<RedoOutlined />}
                    style={{
                      background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                    }}
                  >
                    Reorder
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              {order.status === 'posted' && user?.role === 'booster' ? (
                <Button
                  size="small"
                  style={{
                    background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  Accept Order
                </Button>
              ) : null}
            </>
          )}
        </div>
      </Card>
    );
  };

  // Safety check
  if (!user || !user.role) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  const currentOrders = activeTab === 'my' ? myOrders : allOrders;
  const currentTotal = activeTab === 'my' ? myOrdersTotal : allOrdersTotal;
  const currentPage = activeTab === 'my' ? myOrdersPage : allOrdersPage;
  const setCurrentPage = activeTab === 'my' ? setMyOrdersPage : setAllOrdersPage;

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <style jsx global>{`
        .ant-select-selector {
          background-color: rgba(30, 30, 63, 0.8) !important;
          border-color: rgba(0, 255, 255, 0.3) !important;
          color: white !important;
        }
        
        .ant-select-selection-placeholder {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        
        .ant-select-selection-item {
          color: white !important;
        }
        
        .ant-select-arrow {
          color: rgba(0, 255, 255, 0.8) !important;
        }
        
        .ant-select-dropdown {
          background-color: rgba(30, 30, 63, 0.95) !important;
          border: 1px solid rgba(0, 255, 255, 0.3) !important;
        }
        
        .ant-select-item {
          color: white !important;
          background-color: transparent !important;
        }
        
        .ant-select-item:hover {
          background-color: rgba(0, 255, 255, 0.1) !important;
        }
        
        .ant-select-item-option-selected {
          background-color: rgba(0, 255, 255, 0.2) !important;
        }
      `}</style>
      
      <Header />
      <div style={{ display: 'flex' }}>
        <Sidebar role={user.role as "player" | "booster"} />
        <div style={{ flex: 1, padding: '24px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1e3f 0%, #2a2a5e 100%)',
              border: '2px solid',
              borderImage: 'linear-gradient(45deg, #00ffff, #ff00ff) 1',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '1200px',
              margin: '0 auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '24px', color: '#00ffff' }}>⚡</span>
                BOOST PROTOCOL
                <span style={{ fontSize: '24px', color: '#00ffff' }}>⚡</span>
              </h1>
              <p style={{
                color: '#00ffff',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Order Management System
              </p>
            </div>

            {/* Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              marginBottom: '30px', 
              justifyContent: 'center' 
            }}>
              <div
                onClick={() => setActiveTab('my')}
                style={{
                  padding: '12px 30px',
                  background: activeTab === 'my' 
                    ? 'linear-gradient(45deg, #00ffff, #ff00ff)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: activeTab === 'my' 
                    ? 'none' 
                    : '1px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  color: activeTab === 'my' ? '#000' : '#fff',
                }}
              >
                My Orders
              </div>
              <div
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '12px 30px',
                  background: activeTab === 'all' 
                    ? 'linear-gradient(45deg, #00ffff, #ff00ff)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: activeTab === 'all' 
                    ? 'none' 
                    : '1px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  color: activeTab === 'all' ? '#000' : '#fff',
                }}
              >
                All Orders
              </div>
            </div>

            {/* Filters */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginBottom: '24px', 
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <Select
                placeholder="Order Status"
                value={statusFilter || undefined}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 150 }}
              >
                {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.text}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Game Type"
                value={gameTypeFilter || undefined}
                onChange={setGameTypeFilter}
                allowClear
                style={{ width: 180 }}
              >
                {Object.keys(GAME_TYPES).map(game => (
                  <Option key={game} value={game}>
                    {game}
                  </Option>
                ))}
              </Select>

              <Button 
                onClick={resetFilters}
                style={{
                  background: 'transparent',
                  color: '#00ffff',
                  border: '1px solid #00ffff',
                }}
              >
                Reset Filters
              </Button>
            </div>

            {/* Order list */}
            <div style={{ 
              maxHeight: '600px', 
              overflowY: 'auto',
              paddingRight: '10px'
            }}>
              <Spin spinning={loading}>
                {currentOrders.length > 0 ? (
                  currentOrders.map(renderOrderCard)
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '50px', 
                    color: '#888' 
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>
                      📋
                    </div>
                    <div>No orders found</div>
                  </div>
                )}
              </Spin>
            </div>

            {/* Pagination */}
            {currentTotal > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginTop: '24px' 
              }}>
                <Pagination
                  current={currentPage}
                  total={currentTotal}
                  pageSize={pageSize}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) => 
                    `${range[0]}-${range[1]} of ${total} items`
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}