import React from 'react';
import {
  Package,
  Compass,
  Calendar,
  MessageSquare,
  User,
  Coffee,
  CheckCircle2,
} from 'lucide-react';

export type DriverNavTab = 'DELIVERIES' | 'MAP' | 'MONTHLY' | 'MESSAGES' | 'PROFILE';

interface DriverBottomNavProps {
  activeTab: DriverNavTab;
  onChangeTab: (tab: DriverNavTab) => void;
  activeDeliveriesCount: number;
  unreadMessagesCount: number;
  isOnBreak?: boolean;
  hasActiveShift?: boolean;
}

export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({
  activeTab,
  onChangeTab,
  activeDeliveriesCount,
  unreadMessagesCount,
  isOnBreak,
  hasActiveShift,
}) => {
  const navItems = [
    {
      id: 'DELIVERIES' as DriverNavTab,
      label: 'Deliveries',
      icon: Package,
      badge: activeDeliveriesCount > 0 ? activeDeliveriesCount : null,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'MAP' as DriverNavTab,
      label: 'Route Map',
      icon: Compass,
      badge: null,
    },
    {
      id: 'MONTHLY' as DriverNavTab,
      label: 'Trip / Month',
      icon: Calendar,
      badge: null,
    },
    {
      id: 'MESSAGES' as DriverNavTab,
      label: 'Chat',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
      badgeColor: 'bg-rose-500 text-white animate-ping-slow',
    },
    {
      id: 'PROFILE' as DriverNavTab,
      label: 'Duty / Shift',
      icon: isOnBreak ? Coffee : User,
      badge: isOnBreak ? '☕' : hasActiveShift ? '●' : null,
      badgeColor: isOnBreak ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-950',
    },
  ];

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 px-2 pt-2 pb-4 select-none shadow-2xl">
      {/* Home bar indicator for iOS feeling */}
      <div className="w-24 h-1 bg-slate-700/60 rounded-full mx-auto mb-2.5 opacity-60" />

      <nav className="flex items-center justify-around gap-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 cursor-pointer min-h-[48px] relative ${
                isActive
                  ? 'text-amber-400 scale-102 font-black'
                  : 'text-slate-400 hover:text-slate-200 font-semibold'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Badge indicator */}
                {item.badge !== null && (
                  <span
                    className={`absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black leading-tight border border-slate-900 shadow-sm ${
                      item.badgeColor || 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] tracking-tight mt-1 leading-none text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
