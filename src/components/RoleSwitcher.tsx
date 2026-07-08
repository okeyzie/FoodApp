import React from 'react';
import { ShoppingBag, ChefHat, Bike, ShieldCheck } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: 'customer' | 'restaurant' | 'rider' | 'admin';
  setRole: (role: 'customer' | 'restaurant' | 'rider' | 'admin') => void;
  activeOrdersCount: number;
  onlineRidersCount: number;
}

export default function RoleSwitcher({
  currentRole,
  setRole,
  activeOrdersCount,
  onlineRidersCount,
}: RoleSwitcherProps) {
  const roles = [
    {
      id: 'customer' as const,
      label: 'Customer Portal',
      icon: ShoppingBag,
      color: 'border-gray-200 text-gray-500 bg-gray-50',
      activeColor: 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30',
      badge: null,
    },
    {
      id: 'admin' as const,
      label: 'Admin Panel',
      icon: ShieldCheck,
      color: 'border-gray-200 text-gray-500 bg-gray-50',
      activeColor: 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30',
      badge: null,
    },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Brand Logo & Tag */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/10">
              <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A] flex items-center gap-1.5">
                FoodHub
              </h1>
              <p className="text-[10px] text-gray-500 font-medium">Multi-role simulator in Lagos, Nigeria</p>
            </div>
          </div>
        </div>

        {/* Roles Selector Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = currentRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setRole(role.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all duration-300 shadow-sm relative ${
                  isActive ? role.activeColor : 'border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {role.label}
                {role.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#FF6B35] text-white' : 'bg-[#FF6B35]/10 text-[#FF6B35]'
                  }`}>
                    {role.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
