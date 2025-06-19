import React from 'react';
import { Home, List, FilePlus2 } from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface SidebarProps {
  role?: "player" | "booster"; // 添加可选标记
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

export default function Sidebar({ role = "player" }: SidebarProps) { // 添加默认值
  // 添加安全检查
  if (!role || !sidebarConfig[role]) {
    return (
      <aside className="w-52 min-h-screen bg-gray-900 border-r-2 border-gray-700 shadow-lg">
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
  
  return (
    <aside className="w-52 min-h-screen bg-gray-900 border-r-2 border-gray-700 shadow-lg">
      <div className="pt-6 px-4">
        <div className="mb-8 pb-4 border-b-2 border-gray-700">
          <div className="text-sm text-gray-400 mb-1 font-semibold">
            {role === "player" ? "Player Panel" : "Booster Panel"}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Dashboard
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
    </aside>
  );
}