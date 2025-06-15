'use client'

import { useState, useEffect } from 'react';
import { Form, Input, Button, Select } from 'antd';
import { useAccount, useSignMessage } from 'wagmi';
import { register } from '@/apis';
import { formatCurrentDateTime } from '@/utils/day';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useUser } from '@/contexts/UserContext';
import { setRefreshToken, setToken } from '@/utils/token';

const { Option } = Select;

export default function Register() {
  const [form] = Form.useForm();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const { setUser } = useUser();

  const [isLoading, setIsLoading] = useState(false);

  const onFinish = async (values: any) => {
    console.log('onFinish called', values, isConnected, address);
    if (!isConnected || !address) {
      console.log('Wallet not connected');
      return;
    }
    setIsLoading(true);
    try {
      const message = `Welcome to the uplift force at ${formatCurrentDateTime()}, please sign this message to prove you are the owner of the wallet.`;
      const signature = await signMessageAsync({ message });
      const registerData = {
        ...values,
        wallet_address: address,
        message,
        signature,
      };
      console.log('Calling register API', registerData);
      const registerResponse = await register(registerData);
      console.log('Register response', registerResponse);
      setUser(registerResponse.user); // Set the nested user object in global context
      setToken(registerResponse.token);
      setRefreshToken(registerResponse.refresh_token);
      // Redirect based on user role
      if (registerResponse.user.role === 'player') {
        router.push('/player');
      } else if (registerResponse.user.role === 'booster') {
        router.push('/booster');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      // 注册失败消息由 request.ts 统一处理
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#18181b] via-[#23234a] to-[#0a0a23] p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/5 backdrop-blur-lg shadow-2xl border border-[#23234a]">
          <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-[#6ee7b7] via-[#3b82f6] to-[#9333ea] bg-clip-text text-transparent drop-shadow-lg text-center">
            Register
          </h1>
          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            initialValues={{
              role: 'player', // Default role
              wallet_address: address || '',
            }}
          >
            <Form.Item
              label={<span className="text-gray-300">Wallet Address</span>}
              name="wallet_address"
              rules={[{ required: true, message: 'Please connect your wallet!' }]}
            >
              <Input
                disabled
                placeholder="Connect your wallet to auto-fill"
                className="!bg-white/10 !border-[#23234a] !text-gray-200 !placeholder-gray-400 focus:!border-[#3b82f6] focus:!shadow-lg transition"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-300">Username</span>}
              name="username"
              rules={[{ required: true, message: 'Please input your Username!' }]}
            >
              <Input
                placeholder="Enter your desired username"
                className="!bg-white/10 !border-[#23234a] !text-gray-200 !placeholder-gray-400 focus:!border-[#3b82f6] focus:!shadow-lg transition"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-300">Email</span>}
              name="email"
              rules={[{ required: true, message: 'Please input your Email!', type: 'email' }]}
            >
              <Input
                placeholder="Enter your email address"
                className="!bg-white/10 !border-[#23234a] !text-gray-200 !placeholder-gray-400 focus:!border-[#3b82f6] focus:!shadow-lg transition"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-300">Role</span>}
              name="role"
              rules={[{ required: true, message: 'Please select your Role!' }]}
            >
              <Select
                placeholder="Select a role"
                className="!bg-white/10 !border-[#23234a] !text-gray-200 focus:!border-[#3b82f6] focus:!shadow-lg transition"
                styles={{
                  popup: {
                    root: {
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #23234a'
                    }
                  }
                }}
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const childrenText = String(option?.children || ''); // Safely convert to string
                  return childrenText.toLowerCase().includes(input.toLowerCase());
                }}
                suffixIcon={<span className="text-gray-400">&#9660;</span>} // Custom arrow icon
              >
                <Option value="player" className="!bg-[#1a1a2e] !text-gray-300 hover:!bg-[#2e2e4a]">Player</Option>
                <Option value="booster" className="!bg-[#1a1a2e] !text-gray-300 hover:!bg-[#2e2e4a]">Booster</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Message (Auto-generated)"
              name="message"
              hidden={true} // Keep it hidden from the user
            >
              <Input disabled />
            </Form.Item>

            <Form.Item
              label="Signature (Auto-generated)"
              name="signature"
              hidden={true} // Keep it hidden from the user
            >
              <Input disabled />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={isLoading}
                disabled={!isConnected}
                className="!bg-gradient-to-r !from-[#3b82f6] !to-[#9333ea] !text-white !font-bold !text-lg !shadow-lg hover:!scale-105 hover:!shadow-2xl !transition"
              >
                Register
              </Button>
            </Form.Item>
          </Form>
        </div>
      </main>
    </div>
  );
} 