import React, { useState } from 'react';
import {
  Store,
  Clock,
  MapPin,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  X,
  Play,
  ClipboardList,
  Flame,
  Tag,
  BarChart3,
  Percent,
  Upload,
  Camera,
} from 'lucide-react';
import { Restaurant, MenuItem, Order, OrderStatus } from '../types';

interface RestaurantViewProps {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onAddMenuItem: (restaurantId: string, itemData: any) => Promise<void>;
  onUpdateMenuItem: (menuId: string, itemData: any) => Promise<void>;
  onDeleteMenuItem: (menuId: string) => Promise<void>;
  onUpdateRestaurant: (restaurantId: string, data: any) => Promise<void>;
}

export default function RestaurantView({
  restaurants,
  menuItems,
  orders,
  onUpdateOrderStatus,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onUpdateRestaurant,
}: RestaurantViewProps) {
  // Let the user select which restaurant they are managing
  const [activeRestId, setActiveRestId] = useState<string>(restaurants[0]?.id || 'rest-1');
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'profile' | 'reports' | 'promos'>('orders');

  // Menu form state
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodDescription, setNewFoodDescription] = useState('');
  const [newFoodPrice, setNewFoodPrice] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState('Burgers');
  const [newFoodImage, setNewFoodImage] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');

  // Find active restaurant profile
  const restaurant = restaurants.find(r => r.id === activeRestId) || restaurants[0];

  const handleToggleAvailability = async (item: MenuItem) => {
    await onUpdateMenuItem(item.id, { isAvailable: !item.isAvailable });
  };

  const handleAddMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName || !newFoodPrice) return;

    await onAddMenuItem(activeRestId, {
      name: newFoodName,
      description: newFoodDescription,
      price: parseInt(newFoodPrice, 10),
      category: newFoodCategory,
      image: newFoodImage,
      isAvailable: true,
      addOns: [],
    });

    // Reset Form
    setNewFoodName('');
    setNewFoodDescription('');
    setNewFoodPrice('');
    setShowAddMenuModal(false);
  };

  const handleUpdateProfile = async (field: string, value: any) => {
    await onUpdateRestaurant(activeRestId, { [field]: value });
  };

  // Filter orders for this restaurant
  const restOrders = orders.filter(o => o.restaurantId === activeRestId);
  const incomingOrders = restOrders.filter(o => o.status === 'Order Received');
  const activePreparations = restOrders.filter(o => ['Preparing', 'Ready for Pickup', 'Rider Assigned', 'Rider En Route', 'Arriving Soon'].includes(o.status));
  const completedOrders = restOrders.filter(o => o.status === 'Delivered');

  // Financial calculations
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalTaxCollected = completedOrders.reduce((sum, o) => sum + o.tax, 0);
  const orderCount = restOrders.length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] pb-16">
      <div className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* Quick Restaurant Switcher Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-gray-200 p-4 rounded-2xl gap-4 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-[#FF6B35]" />
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Managing Restaurant</label>
              <select
                value={activeRestId}
                onChange={(e) => setActiveRestId(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer pr-4"
              >
                {restaurants.map(r => (
                  <option key={r.id} value={r.id} className="bg-white text-gray-800 font-semibold">{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Core Analytics Quick Stats */}
          <div className="grid grid-cols-3 gap-6 text-xs md:text-right">
            <div>
              <p className="text-gray-400 font-medium">Total Sales</p>
              <p className="text-sm font-black text-[#FF6B35] mt-0.5">₦{totalRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Delivered</p>
              <p className="text-sm font-black text-emerald-600 mt-0.5">{completedOrders.length} Orders</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Rating</p>
              <p className="text-sm font-black text-[#FF6B35] mt-0.5">⭐ {restaurant?.rating || '5.0'}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs bar */}
        <div className="flex gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto">
          {[
            { id: 'orders' as const, label: 'Incoming & Active Orders', icon: ClipboardList, badge: incomingOrders.length > 0 ? incomingOrders.length : null },
            { id: 'menu' as const, label: 'Menu Catalog', icon: Flame },
            { id: 'reports' as const, label: 'Performance Reports', icon: BarChart3 },
            { id: 'promos' as const, label: 'Promotions', icon: Percent },
            { id: 'profile' as const, label: 'Business Profile', icon: Store }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#FF6B35] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-[#FF6B35]' : 'bg-[#FF6B35]/10 text-[#FF6B35]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB BODY CONTENTS */}
        <div className="mt-6">

          {/* 1. ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Incoming Orders */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-ping" />
                  New Incoming Requests ({incomingOrders.length})
                </h3>

                {incomingOrders.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-100 p-10 text-center rounded-2xl">
                    <p className="text-xs text-gray-400 font-semibold">No new orders at the moment.</p>
                    <p className="text-[10px] text-gray-400 mt-1">When a customer places an order, it will ring here live!</p>
                  </div>
                ) : (
                  incomingOrders.map((ord) => (
                    <div key={ord.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">Order #{ord.id}</h4>
                          <p className="text-[10px] text-gray-500 mt-1">Customer: <strong className="text-gray-700">{ord.customerName}</strong> ({ord.customerPhone})</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Payment: <strong className="text-gray-700">{ord.paymentMethod}</strong> • {ord.paymentStatus}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#FF6B35] font-black">₦{ord.total.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{new Date(ord.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="py-3 space-y-2">
                        {ord.items.map((it, i) => (
                          <div key={i} className="flex justify-between text-xs text-gray-600">
                            <span>{it.quantity}x {it.name}</span>
                            <span className="font-mono text-gray-400">₦{(it.price * it.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 border-t border-gray-100 pt-3 mt-1">
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'Cancelled')}
                          className="flex-1 py-1.5 border border-gray-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 rounded-xl text-[11px] font-semibold transition-colors text-gray-500"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'Preparing')}
                          className="flex-1 py-1.5 bg-[#FF6B35] text-white rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-sm hover:bg-[#E55A2B]"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3.5]" /> Accept & Cook
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Preparing / Active Orders */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ClipboardList className="w-4.5 h-4.5 text-[#FF6B35]" />
                  Active Cooking Operations ({activePreparations.length})
                </h3>

                {activePreparations.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-100 p-10 text-center rounded-2xl">
                    <p className="text-xs text-gray-400 font-semibold">No active operations.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Accept an incoming order to begin preparation!</p>
                  </div>
                ) : (
                  activePreparations.map((ord) => (
                    <div key={ord.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                        <div>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 rounded-full">
                            {ord.status}
                          </span>
                          <h4 className="text-sm font-bold text-gray-800 mt-1.5">Order #{ord.id}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400">Rider Assigned</p>
                          <p className="text-xs font-bold text-gray-800 mt-0.5">{ord.riderName || 'Searching rider...'}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 text-xs text-gray-600 pb-3 border-b border-gray-100">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{it.quantity}x {it.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Status Update actions */}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-gray-400">Update status:</span>
                        <div className="flex gap-2">
                          {ord.status === 'Preparing' && (
                            <button
                              onClick={() => onUpdateOrderStatus(ord.id, 'Ready for Pickup')}
                              className="px-3 py-1.5 bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                            >
                              <Check className="w-3 h-3 stroke-[3]" /> Food Ready
                            </button>
                          )}
                          {ord.status === 'Ready for Pickup' && (
                            <span className="text-[10px] text-[#FF6B35] font-semibold animate-pulse">
                              ⏳ Waiting for rider pick up
                            </span>
                          )}
                          {['Rider Assigned', 'Rider En Route', 'Arriving Soon'].includes(ord.status) && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              🚴 Rider is delivering...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* 2. MENU CATALOG TAB */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                  <Flame className="w-4.5 h-4.5 text-[#FF6B35]" />
                  Menu Items management
                </h3>
                <button
                  onClick={() => setShowAddMenuModal(true)}
                  className="px-3 py-1.5 bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" /> Add Meal
                </button>
              </div>

              {/* Menu items Grid list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems
                  .filter(m => m.restaurantId === activeRestId)
                  .map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                      <div className="h-36 relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200">
                          {item.category}
                        </div>
                        <label className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-600 hover:text-[#FF6B35] p-1.5 rounded-full border border-gray-200 shadow-sm cursor-pointer transition-all flex items-center justify-center" title="Upload custom image">
                          <Camera className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    onUpdateMenuItem(item.id, { image: reader.result });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">{item.name}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                          <p className="text-base font-black text-[#FF6B35] mt-3">₦{item.price.toLocaleString()}</p>
                        </div>

                        {/* Availability Toggles & Delete */}
                        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                              item.isAvailable
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                : 'bg-gray-50 border-gray-200 text-gray-400'
                            }`}
                          >
                            {item.isAvailable ? '● Available' : '○ Unavailable'}
                          </button>

                          <button
                            onClick={() => onDeleteMenuItem(item.id)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 3. PERFORMANCE REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5 border-b border-gray-200 pb-2">
                <BarChart3 className="w-4.5 h-4.5 text-[#FF6B35]" />
                Sales & Financial Analytics Reports
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Revenue</span>
                  <p className="text-2xl font-black text-[#FF6B35] mt-1.5">₦{totalRevenue.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-400 mt-1">Excludes VAT and delivery commissions</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Completed Orders</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1.5">{completedOrders.length}</p>
                  <p className="text-[9px] text-gray-400 mt-1">Successfully delivered and finalized</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tax Collected (VAT)</span>
                  <p className="text-2xl font-black text-gray-800 mt-1.5">₦{totalTaxCollected.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-400 mt-1">Calculated at standard 7.5%</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Order Ticket</span>
                  <p className="text-2xl font-black text-[#FF6B35] mt-1.5">
                    ₦{completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length).toLocaleString() : '0'}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-1">Average spent per meal order</p>
                </div>
              </div>

              {/* Best Selling Meals & Customer list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Popular items simulation list */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">⭐ Best-Selling Products</h4>
                  <div className="space-y-4 text-xs">
                    {menuItems
                      .filter(m => m.restaurantId === activeRestId)
                      .slice(0, 3)
                      .map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-[#FF6B35] font-bold font-mono">#0{index + 1}</span>
                            <div>
                              <p className="font-bold text-gray-700">{item.name}</p>
                              <p className="text-[10px] text-gray-400">{item.category}</p>
                            </div>
                          </div>
                          <p className="font-bold text-[#FF6B35]">
                            {completedOrders.length * (3 - index) + 4} Sold
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Customer Reviews for active restaurant */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">💬 Customer Reviews</h4>
                  <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 text-xs">
                    {completedOrders.filter(o => o.feedback?.comment).length === 0 ? (
                      <div className="h-full flex items-center justify-center py-8 text-gray-400 text-center">
                        No reviews logged for this restaurant yet.
                      </div>
                    ) : (
                      completedOrders
                        .filter(o => o.feedback)
                        .map((ord) => (
                          <div key={ord.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-700">{ord.customerName}</span>
                              <span className="text-[#FF6B35] font-bold">⭐ {ord.feedback?.restaurantRating}/5</span>
                            </div>
                            <p className="text-gray-500 leading-relaxed italic">"{ord.feedback?.comment}"</p>
                            <p className="text-[9px] text-gray-400 font-medium">Order #{ord.id}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 4. PROMOTIONS TAB */}
          {activeTab === 'promos' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5 border-b border-gray-200 pb-2">
                <Tag className="w-4.5 h-4.5 text-[#FF6B35]" />
                Manage Promotional Discounts & Coupons
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-1">Active Coupon Codes</h4>
                  
                  <div className="space-y-3 text-xs">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono font-black text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2 py-0.5 rounded">
                          WELCOME30
                        </span>
                        <p className="text-[11px] text-gray-500 mt-2">Get 30% off your entire meal ticket</p>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">Active</span>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono font-black text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2 py-0.5 rounded">
                          FREEDELIV
                        </span>
                        <p className="text-[11px] text-gray-500 mt-2">Free shipping on orders above ₦5,000</p>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">Active</span>
                    </div>
                  </div>
                </div>

                {/* Create Promo coupon simulation form */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-1">Create Promotional Offer</h4>
                  <form onSubmit={(e) => { e.preventDefault(); alert("Promotion successfully launched and active on customer devices!"); }} className="space-y-4 text-xs">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Coupon Code Name</label>
                      <input
                        type="text"
                        placeholder="e.g. FREEJOLLOF"
                        className="bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-gray-800 outline-none focus:border-[#FF6B35]/40"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Discount Percentage (%)</label>
                      <input
                        type="number"
                        placeholder="e.g. 20"
                        className="bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-gray-800 outline-none focus:border-[#FF6B35]/40"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#FF6B35] text-white hover:bg-[#E55A2B] font-bold rounded-xl text-xs transition-colors shadow-sm"
                    >
                      Publish Promotion
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 5. PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-3">
                <Store className="w-4.5 h-4.5 text-[#FF6B35]" />
                Manage Operational Business Profile
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Profile Fields */}
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cuisine Type / category</label>
                    <input
                      type="text"
                      value={restaurant?.cuisine || ''}
                      onChange={(e) => handleUpdateProfile('cuisine', e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-gray-800 outline-none focus:border-[#FF6B35]/40"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Operating Hours</label>
                    <input
                      type="text"
                      value={restaurant?.operatingHours || ''}
                      onChange={(e) => handleUpdateProfile('operatingHours', e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-gray-800 outline-none focus:border-[#FF6B35]/40"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Business Contact Number</label>
                    <input
                      type="text"
                      value={restaurant?.contactNumber || ''}
                      onChange={(e) => handleUpdateProfile('contactNumber', e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-gray-800 outline-none focus:border-[#FF6B35]/40"
                    />
                  </div>
                </div>

                {/* Radius and physical address */}
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Operational Delivery Radius (KM)</label>
                    <input
                      type="number"
                      value={7} // static or simulated radius
                      className="bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-gray-400 outline-none cursor-not-allowed"
                      disabled
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Business Physical Address</label>
                    <textarea
                      value={restaurant?.address || ''}
                      onChange={(e) => handleUpdateProfile('address', e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-gray-800 outline-none h-20 focus:border-[#FF6B35]/40"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ADD MEAL MODAL */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl text-gray-700">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-sm font-bold text-gray-800">Add New Meal to Menu</h4>
              <button onClick={() => setShowAddMenuModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMealSubmit} className="p-5 space-y-4 text-xs">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Meal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gourmet Bacon Cheeseburger"
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:border-[#FF6B35]/40"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  placeholder="Describe ingredients, cooking prep, flavor profile..."
                  value={newFoodDescription}
                  onChange={(e) => setNewFoodDescription(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800 outline-none h-16 focus:border-[#FF6B35]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Price (₦)</label>
                  <input
                    type="number"
                    placeholder="3500"
                    value={newFoodPrice}
                    onChange={(e) => setNewFoodPrice(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:border-[#FF6B35]/40"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={newFoodCategory}
                    onChange={(e) => setNewFoodCategory(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:border-[#FF6B35]/40"
                  >
                    <option value="Burgers">Burgers</option>
                    <option value="Sushi Rolls">Sushi Rolls</option>
                    <option value="Woodfired Pizza">Pizza</option>
                    <option value="Rice Dishes">Rice Dishes</option>
                    <option value="Sides">Sides</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-2 border border-gray-100 bg-gray-50/50 rounded-xl p-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meal Image Cover</label>
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-lg border border-gray-200 overflow-hidden bg-white flex-shrink-0 relative">
                    <img
                      src={newFoodImage}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center border border-dashed border-gray-300 hover:border-[#FF6B35] bg-white rounded-lg py-2 px-3 cursor-pointer transition-colors text-[10px] text-gray-500 hover:text-[#FF6B35] font-semibold text-center">
                      <Upload className="w-4 h-4 mb-0.5" />
                      <span>Upload Meal Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setNewFoodImage(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Or paste custom image URL..."
                    value={newFoodImage.startsWith('data:') ? '' : newFoodImage}
                    onChange={(e) => setNewFoodImage(e.target.value || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80')}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 outline-none focus:border-[#FF6B35]/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold rounded-xl text-xs transition-colors shadow-sm mt-2"
              >
                Launch Meal live
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
