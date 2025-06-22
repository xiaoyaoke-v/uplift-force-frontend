import React from 'react';
import { Home, List, FilePlus2, LogOut } from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '@/contexts/UserContext'; // 添加这个import

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface SidebarProps {
  role?: "player" | "booster";
}

const sidebarConfig: Record<"player" | "booster", SidebarItem[]> = {
  player: [
    {
      label: "Create Order",
      icon: <FilePlus2 className="w-5 h-5" />,
      href: "/player",
    },
    {
      label: "Order List",
      icon: <List className="w-5 h-5" />,
      href: "/orders",
    },
  ],
  booster: [
    {
      label: "Order List",
      icon: <List className="w-5 h-5" />,
      href: "/booster",
     },
  ],
};

export default function Sidebar({ role = "player" }: SidebarProps) {
  const { logout, isLoggingOut } = useAuth();
  const { user } = useUser(); // 使用和主页面相同的用户数据源

  if (!role || !sidebarConfig[role]) {
    return (
      <aside className="fixed left-0 top-[88px] w-52 h-[calc(100vh-88px)] bg-gray-900 border-r-2 border-gray-700 shadow-lg z-20">
        <div className="pt-6 px-4">
          <div className="text-gray-400 text-center">加载中...</div>
        </div>
      </aside>
    );
  }

  const items = sidebarConfig[role];
  const router = useRouter();
  const pathname = usePathname();
     
  const handleNavigation = (href: string) => {
    if (pathname === href) {
      return;
    }
    router.push(href);
  };

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout();
    }
  };
     
  return (
    <aside className="fixed left-0 top-[88px] w-52 h-[calc(100vh-88px)] bg-gray-900 border-r-2 border-gray-700 shadow-lg z-20 overflow-y-auto flex flex-col">
      {/* 主要内容区域 */}
      <div className="flex-1 pt-6 px-4">
        <div className="mb-8 pb-4 border-b-2 border-gray-700">
          <div className="text-sm text-gray-400 mb-1 font-semibold">
            {user?.username || 'User'}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            {role === "player" ? "Player" : "Booster"}
          </div>
        </div>

        <nav className="space-y-2">
          {items && items.map((item) => {
            const isActive = pathname === item.href;
                        
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-all duration-200 group hover:shadow-md ${
                  isActive
                     ? 'text-white bg-blue-600 hover:bg-blue-700'
                     : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 shadow-sm ${
                  isActive
                     ? 'bg-blue-700 group-hover:bg-blue-800'
                     : 'bg-gray-800 group-hover:bg-gray-700'
                }`}>
                  {React.cloneElement(item.icon as React.ReactElement, {
                    className: `w-4 h-4 transition-colors duration-200 ${
                      isActive
                         ? 'text-white'
                         : 'text-gray-400 group-hover:text-blue-400'
                    }`,
                    strokeWidth: 2.5
                  })}
                </div>
                                
                <span className="text-sm font-semibold">
                  {item.label}
                </span>
                                
                <div className={`ml-auto transition-opacity duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full shadow-sm ${
                    isActive ? 'bg-white' : 'bg-blue-400'
                  }`}></div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 底部登出按钮 */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-all duration-200 group hover:shadow-md text-red-300 hover:text-red-200 hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 shadow-sm bg-red-900/30 group-hover:bg-red-800/40">
            <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors duration-200" strokeWidth={2.5} />
          </div>
          
          <span className="text-sm font-semibold">
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </span>
          
          <div className="ml-auto transition-opacity duration-200 opacity-0 group-hover:opacity-100">
            <div className="w-2 h-2 rounded-full shadow-sm bg-red-400"></div>
          </div>
        </button>
      </div>
    </aside>
  );
}