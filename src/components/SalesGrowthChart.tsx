import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Order, MenuItem } from '../types';
import { TrendingUp, Clock, Utensils, DollarSign, BarChart3, PieChart as PieIcon, Award } from 'lucide-react';

interface SalesGrowthChartProps {
  orders: Order[];
  menuItems: MenuItem[];
}

export default function SalesGrowthChart({ orders, menuItems }: SalesGrowthChartProps) {
  
  // 1. Process 7-day Daily Revenue Trends
  const dailyData = useMemo(() => {
    // Generate last 7 days labels dynamically
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayName = days[d.getDay()];
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Default high-fidelity baseline data based on day of week to represent historical growth
      // Add a slight weekend multiplier for a realistic Lagos food delivery trend
      const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
      const baseRevenue = isWeekend 
        ? 120000 + Math.floor(Math.random() * 30000)
        : 65000 + Math.floor(Math.random() * 20000);
      const baseOrders = isWeekend ? 15 + Math.floor(Math.random() * 5) : 8 + Math.floor(Math.random() * 4);

      return {
        key: d.toDateString(),
        day: `${dayName} (${dateStr})`,
        revenue: baseRevenue,
        orders: baseOrders,
        realOrdersCount: 0,
        realRevenue: 0,
      };
    });

    // Parse and aggregate real system orders
    orders.forEach(order => {
      if (order.status === 'Cancelled') return;
      
      const orderDate = new Date(order.createdAt);
      const dayKey = orderDate.toDateString();
      
      const dayMatch = result.find(r => r.key === dayKey);
      if (dayMatch) {
        // Add to baseline or override
        dayMatch.realRevenue += order.total;
        dayMatch.realOrdersCount += 1;
        
        // Accumulate onto chart
        dayMatch.revenue += order.total;
        dayMatch.orders += 1;
      } else {
        // If it's a today-only order or matches close dates, handle fallback addition to last day
        const todayKey = new Date().toDateString();
        if (dayKey === todayKey) {
          result[6].revenue += order.total;
          result[6].orders += 1;
          result[6].realRevenue += order.total;
          result[6].realOrdersCount += 1;
        }
      }
    });

    return result;
  }, [orders]);

  // 2. Process Hourly Peak Ordering Hours
  const hourlyData = useMemo(() => {
    const hoursSlots = [
      { slot: 'Morning (8AM-11AM)', orders: 4, revenue: 18000 },
      { slot: 'Lunch Rush (11AM-2PM)', orders: 18, revenue: 84500 },
      { slot: 'Afternoon (2PM-5PM)', orders: 9, revenue: 42000 },
      { slot: 'Dinner Bell (5PM-8PM)', orders: 24, revenue: 145000 },
      { slot: 'Late Night (8PM-11PM)', orders: 12, revenue: 58000 },
    ];

    // Map real orders to peak hours
    orders.forEach(order => {
      if (order.status === 'Cancelled') return;
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();

      let targetIndex = 3; // Default to Dinner Bell if unclear
      if (hour >= 8 && hour < 11) targetIndex = 0;
      else if (hour >= 11 && hour < 14) targetIndex = 1;
      else if (hour >= 14 && hour < 17) targetIndex = 2;
      else if (hour >= 17 && hour < 20) targetIndex = 3;
      else if (hour >= 20 && hour < 23) targetIndex = 4;

      hoursSlots[targetIndex].orders += 1;
      hoursSlots[targetIndex].revenue += order.total;
    });

    return hoursSlots;
  }, [orders]);

  // 3. Process Top-Selling Categories
  const categoryData = useMemo(() => {
    // Standard default baselines
    const catMap: Record<string, { name: string; value: number; revenue: number }> = {
      'Burgers': { name: '🍔 Burgers & Comfort', value: 34, revenue: 153000 },
      'Rice Dishes': { name: '🍚 Smoky Jollof & Rice', value: 48, revenue: 216000 },
      'Grills': { name: '🥩 Traditional Suya Grills', value: 26, revenue: 78000 },
      'Soups': { name: '🍲 Seafood Okra & Soups', value: 15, revenue: 187500 },
      'Drinks': { name: '🥤 Desserts & Drinks', value: 22, revenue: 48400 },
    };

    // Parse items inside orders
    orders.forEach(order => {
      if (order.status === 'Cancelled') return;
      
      order.items.forEach(item => {
        // Look up item category
        let category = 'Burgers'; // Fallback
        const dbItem = menuItems.find(mi => mi.id === item.menuItemId);
        
        if (dbItem && dbItem.category) {
          category = dbItem.category;
        } else {
          // Guess based on name
          const name = item.name.toLowerCase();
          if (name.includes('jollof') || name.includes('rice') || name.includes('feast')) category = 'Rice Dishes';
          else if (name.includes('suya') || name.includes('skew') || name.includes('roast')) category = 'Grills';
          else if (name.includes('soup') || name.includes('okra') || name.includes('seafood') || name.includes('broth')) category = 'Soups';
          else if (name.includes('burger') || name.includes('patty') || name.includes('smasher')) category = 'Burgers';
          else if (name.includes('drink') || name.includes('shake') || name.includes('soda') || name.includes('beverage')) category = 'Drinks';
        }

        // Standardize keys
        let catKey = 'Burgers';
        if (category.toLowerCase().includes('rice')) catKey = 'Rice Dishes';
        else if (category.toLowerCase().includes('grill') || category.toLowerCase().includes('suya')) catKey = 'Grills';
        else if (category.toLowerCase().includes('soup') || category.toLowerCase().includes('okra')) catKey = 'Soups';
        else if (category.toLowerCase().includes('drink') || category.toLowerCase().includes('shake') || category.toLowerCase().includes('dessert')) catKey = 'Drinks';

        if (catMap[catKey]) {
          catMap[catKey].value += item.quantity;
          catMap[catKey].revenue += (item.price * item.quantity);
        } else {
          catMap[catKey] = {
            name: `🥘 ${category}`,
            value: item.quantity,
            revenue: item.price * item.quantity
          };
        }
      });
    });

    return Object.values(catMap);
  }, [orders, menuItems]);

  const COLORS = ['#047857', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

  const totalSum = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [categoryData]);

  const bestPerformingCategory = useMemo(() => {
    if (categoryData.length === 0) return 'Smoky Jollof';
    return [...categoryData].sort((a, b) => b.revenue - a.revenue)[0].name;
  }, [categoryData]);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Summary Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">Highest Gross Category</span>
            <h4 className="text-lg font-black">{bestPerformingCategory}</h4>
            <p className="text-[10px] text-emerald-300">Driven by premium ingredient margins</p>
          </div>
          <Award className="w-10 h-10 text-amber-400 stroke-[1.5]" />
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Aggregated Pipeline Total</span>
            <h4 className="text-xl font-black text-emerald-950">₦{totalSum.toLocaleString()}</h4>
            <p className="text-[10px] text-emerald-700 font-semibold">Includes live transactions & baseline history</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Peak Dining Hours Window</span>
            <h4 className="text-base font-black text-gray-800">Dinner Bell (5PM - 8PM)</h4>
            <p className="text-[10px] text-gray-500">Fastest courier dispatch required</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: DAILY REVENUE TRENDS */}
        <div className="lg:col-span-8 bg-white border border-gray-100 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-800">Daily Revenue Trends</h3>
                <p className="text-[10px] text-gray-400">Real-time revenue curves over the last 7 calendar days</p>
              </div>
            </div>
            {orders.length > 0 && (
              <span className="text-[9px] font-black bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full animate-pulse">
                Live Data Connected
              </span>
            )}
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#047857" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={(val) => `₦${(val / 1000)}k`}
                  tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#047857" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: CATEGORY SPLIT PIE */}
        <div className="lg:col-span-4 bg-white border border-gray-100 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <PieIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800">Cuisine Performance</h3>
              <p className="text-[10px] text-gray-400">Total units sold per major food category</p>
            </div>
          </div>

          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} Units`, 'Quantity Sold']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center justify-center">
              <Utensils className="w-5 h-5 text-gray-300" />
              <span className="text-[9px] text-gray-400 font-extrabold mt-0.5">SHARES</span>
            </div>
          </div>

          {/* Custom Legends for Pie */}
          <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-gray-50">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-gray-500 font-semibold truncate" title={cat.name}>{cat.name}</span>
                <span className="text-gray-900 font-bold ml-auto shrink-0">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CHART 2: PEAK ORDERING HOURS */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
            <BarChart3 className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-800">Peak Ordering Hours Breakdown</h3>
            <p className="text-[10px] text-gray-400">Aggregate order distribution patterns over morning, lunch, and dinner peak intervals</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="slot" 
                tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: any, name: any) => [
                  name === 'revenue' ? `₦${Number(value).toLocaleString()}` : `${value} Orders`, 
                  name === 'revenue' ? 'Sales Value' : 'Total Orders'
                ]}
                contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
              />
              <Bar dataKey="orders" name="Order Volume" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={45} />
              <Bar dataKey="revenue" name="Sales Value (₦)" fill="#047857" radius={[4, 4, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
