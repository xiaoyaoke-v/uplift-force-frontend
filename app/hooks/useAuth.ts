// hooks/useAuth.ts
import { useDisconnect } from 'wagmi';
import { useState, useCallback } from 'react';

export const useAuth = () => {
  const { disconnect } = useDisconnect();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      
      // 1. 调用后端登出API
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log('后端登出成功');
          } else {
            console.warn('后端登出失败，但继续前端清理');
          }
        } catch (error) {
          console.error('调用后端登出API失败:', error);
          // 即使后端失败也继续前端清理
        }
      }
      
      // 2. 清除本地存储的所有认证信息
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('user');
      
      // 清除其他可能的用户相关数据
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('loginTime');
      
      // 3. 断开钱包连接
      disconnect();
      
      // 4. 跳转到登录页面
      window.location.href = '';
      
    } catch (error) {
      console.error('登出过程出错:', error);
      
      // 即使出错也要确保清除本地状态
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('user');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('loginTime');
      
      disconnect();
      window.location.href = '';
    } finally {
      setIsLoggingOut(false);
    }
  }, [disconnect]);

  // 检查登录状态的辅助函数
  const isAuthenticated = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    try {
      // 检查JWT是否过期
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }, []);

  // 获取当前用户信息 - 兼容你的UserContext
  const getCurrentUser = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      // 先尝试从userInfo获取
      let userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        return JSON.parse(userInfo);
      }
      
      // 如果没有userInfo，尝试从user获取
      userInfo = localStorage.getItem('user');
      if (userInfo) {
        return JSON.parse(userInfo);
      }
      
      return null;
    } catch {
      return null;
    }
  }, []);

  // 获取访问令牌
  const getAccessToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }, []);

  return {
    logout,
    isLoggingOut,
    isAuthenticated,
    getCurrentUser,
    getAccessToken
  };
};