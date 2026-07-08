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
      activeColor: 'bg-emerald-50 text-emerald-800 border-emerald-600/30 font-bold',
      badge: null,
    },
    {
      id: 'admin' as const,
      label: 'Admin Panel',
      icon: ShieldCheck,
      color: 'border-gray-200 text-gray-500 bg-gray-50',
      activeColor: 'bg-emerald-50 text-emerald-800 border-emerald-600/30 font-bold',
      badge: null,
    },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Brand Logo & Tag */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0F4C3A] text-amber-400 shadow-md shadow-[#0F4C3A]/10">
              <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-emerald-950 flex items-center gap-1.5">
                FoodHub <span className="text-xs bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">Lagos</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Royal Logistics & Catering Hub</p>
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
                className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border flex items-center gap-2 transition-all duration-300 shadow-xs relative cursor-pointer ${
                  isActive ? role.activeColor + ' ring-2 ring-emerald-600/10' : 'border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-gray-400'}`} />
                {role.label}
                {role.badge && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#0F4C3A] text-amber-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
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
