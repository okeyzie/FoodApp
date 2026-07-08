import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Store,
  Bike,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Check,
  X,
  Lock,
  Sparkles,
  BarChart3,
  Sliders,
} from 'lucide-react';
import { Restaurant, Rider, Order, Review, MenuItem, ChatMessage } from '../types';
import RestaurantView from './RestaurantView';
import RiderView from './RiderView';
import SalesGrowthChart from './SalesGrowthChart';

interface AdminViewProps {
  restaurants: Restaurant[];
  riders: Rider[];
  orders: Order[];
  reviews: Review[];
  menuItems: MenuItem[];
  messages: ChatMessage[];
  onApproveRestaurant: (restaurantId: string) => Promise<void>;
  onAddRestaurant: (data: any) => Promise<void>;
  onAddRider: (data: any) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: any) => Promise<void>;
  onAddMenuItem: (restaurantId: string, itemData: any) => Promise<void>;
  onUpdateMenuItem: (menuId: string, itemData: any) => Promise<void>;
  onDeleteMenuItem: (menuId: string) => Promise<void>;
  onUpdateRestaurant: (restaurantId: string, data: any) => Promise<void>;
  onUpdateRider: (riderId: string, data: any) => Promise<void>;
  onAssignRiderToOrder: (orderId: string, riderId: string) => Promise<void>;
  onSendMessage: (orderId: string, text: string, sender: 'customer' | 'rider') => Promise<void>;
}

export default function AdminView({
  restaurants,
  riders,
  orders,
  reviews,
  menuItems,
  messages,
  onApproveRestaurant,
  onAddRestaurant,
  onAddRider,
  onUpdateOrderStatus,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onUpdateRestaurant,
  onUpdateRider,
  onAssignRiderToOrder,
  onSendMessage,
}: AdminViewProps) {
  const [adminTab, setAdminTab] = useState<'overview' | 'restaurants' | 'onboarding' | 'orders' | 'payouts' | 'restaurant_hub' | 'rider_dashboard' | 'analytics'>('overview');
  const [commissionRate, setCommissionRate] = useState(15); // Platform standard commission rate
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Restaurant onboarding form state
  const [restName, setRestName] = useState('');
  const [restCuisine, setRestCuisine] = useState('Nigerian Jollof');
  const [restAddress, setRestAddress] = useState('');
  const [restDeliveryFee, setRestDeliveryFee] = useState('500');
  const [restOperatingHours, setRestOperatingHours] = useState('08:00 AM - 10:00 PM');
  const [restContact, setRestContact] = useState('');

  // Rider onboarding form state
  const [riderNameInput, setRiderNameInput] = useState('');
  const [riderPhoneInput, setRiderPhoneInput] = useState('');
  const [riderVehicleInput, setRiderVehicleInput] = useState<'bicycle' | 'motorcycle' | 'car'>('motorcycle');

  const handleAddRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restName || !restAddress) return;
    try {
      await onAddRestaurant({
        name: restName,
        cuisine: restCuisine,
        address: restAddress,
        deliveryFee: parseFloat(restDeliveryFee) || 500,
        operatingHours: restOperatingHours,
        contactNumber: restContact,
        isApproved: true // Auto-approved on admin addition
      });
      setRestName('');
      setRestAddress('');
      setRestContact('');
      setBannerMessage("New restaurant client onboarded & activated instantly!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderNameInput || !riderPhoneInput) return;
    try {
      await onAddRider({
        name: riderNameInput,
        phone: riderPhoneInput,
        vehicleType: riderVehicleInput,
        status: 'online'
      });
      setRiderNameInput('');
      setRiderPhoneInput('');
      setBannerMessage("New dispatch rider client onboarded & registered online!");
    } catch (err) {
      console.error(err);
    }
  };

  // Financial and platform-wide math
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const platformCommissions = Math.round(totalRevenue * (commissionRate / 100));
  const activeDeliveries = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] pb-16 relative">
      <div className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* Toast Notification Banner */}
        {bannerMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-gray-900 text-white text-xs font-semibold px-4.5 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
            <span>💡</span>
            <span>{bannerMessage}</span>
            <button onClick={() => setBannerMessage(null)} className="ml-1 text-gray-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Admin Dashboard header */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-50 border border-gray-100 text-emerald-800 rounded-2xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-1.5">
                Central Operations Console <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">HQ Root</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Real-time telemetry and management controls for Lagos municipality</p>
            </div>
          </div>

          {/* Admin mini navbar */}
          <div className="flex flex-wrap gap-1.5 text-xs bg-gray-50 border border-gray-100 p-1.5 rounded-2xl">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'analytics' as const, label: '📈 Sales & Growth' },
              { id: 'restaurants' as const, label: 'KYC Approvals' },
              { id: 'onboarding' as const, label: 'Add Clients & Riders' },
              { id: 'orders' as const, label: 'Live Order Monitor' },
              { id: 'payouts' as const, label: 'Revenue Settings' },
              { id: 'restaurant_hub' as const, label: '🍳 Restaurant Hub' },
              { id: 'rider_dashboard' as const, label: '🏍️ Rider Dashboard' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setAdminTab(t.id)}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  adminTab === t.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div>

          {/* 1. OPERATIONS OVERVIEW */}
          {adminTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Stat card deck */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div 
                  onClick={() => setAdminTab('analytics')}
                  className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs cursor-pointer hover:border-emerald-700/30 hover:shadow-sm transition-all group"
                >
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-emerald-800 transition-colors">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-800" /> Platform Gross Volume
                  </span>
                  <p className="text-2xl font-black text-amber-600 mt-2">₦{totalRevenue.toLocaleString()}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[9px] text-gray-400">Sum of all successfully settled meals</p>
                    <span className="text-[9px] font-extrabold text-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity">Trends →</span>
                  </div>
                </div>

                <div 
                  onClick={() => setAdminTab('analytics')}
                  className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs cursor-pointer hover:border-emerald-700/30 hover:shadow-sm transition-all group"
                >
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-emerald-800 transition-colors">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Platform Commission ({commissionRate}%)
                  </span>
                  <p className="text-2xl font-black text-emerald-600 mt-2">₦{platformCommissions.toLocaleString()}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[9px] text-gray-400">Net platform earnings from operations</p>
                    <span className="text-[9px] font-extrabold text-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity">Trends →</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-800" /> Active Deliveries
                  </span>
                  <p className="text-2xl font-black text-gray-800 mt-2">{activeDeliveries.length}</p>
                  <p className="text-[9px] text-gray-400 mt-1">In transit, preparing, or ready</p>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-500" /> Operational Users
                  </span>
                  <p className="text-2xl font-black text-emerald-800 mt-2">{restaurants.length + riders.length + 5}</p>
                  <p className="text-[9px] text-gray-400 mt-1">Registered accounts, kitchens & riders</p>
                </div>
              </div>

              {/* Visual summaries & telemetry */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Active kitchen registers */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 md:col-span-2 space-y-4 shadow-xs">
                  <h4 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-1">
                    <Store className="w-4 h-4 text-emerald-800" />
                    Kitchen Status Log
                  </h4>

                  <div className="space-y-2 text-xs">
                    {restaurants.map((rest) => (
                      <div key={rest.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100/60">
                        <div>
                          <p className="font-bold text-gray-800">{rest.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{rest.address}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            rest.isApproved 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'
                          }`}>
                            {rest.isApproved ? 'Approved KYC' : 'Pending Verification'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rider grid registers */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-xs">
                  <h4 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-1">
                    <Bike className="w-4 h-4 text-emerald-800" />
                    Rider Status Log
                  </h4>

                  <div className="space-y-3 text-xs">
                    {riders.map((r) => (
                      <div key={r.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100/60">
                        <div>
                          <p className="font-bold text-gray-800">{r.name}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">Vehicle: {r.vehicleType}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          r.status === 'online'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-gray-100 border border-gray-200 text-gray-400'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 2. KYC RESTAURANT APPROVAL WORKFLOW */}
          {adminTab === 'restaurants' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4.5 h-4.5 text-[#FF6B35]" />
                KYC Verification Queue
              </h3>

              <div className="space-y-4 text-xs">
                {restaurants.filter(r => !r.isApproved).length === 0 ? (
                  <div className="bg-white border border-gray-200 p-8 text-center rounded-2xl text-gray-400 shadow-sm">
                    No pending KYC applications. All registered restaurants are approved and active!
                  </div>
                ) : (
                  restaurants
                    .filter(r => !r.isApproved)
                    .map((r) => (
                      <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-gray-800">{r.name}</h4>
                          <p className="text-gray-400 font-medium">Address: {r.address}</p>
                          <p className="text-gray-400 font-medium">Operating hours: {r.operatingHours} • Contact: {r.contactNumber || 'N/A'}</p>
                          <div className="bg-gray-50 p-3 rounded border border-gray-100 mt-2">
                            <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Document Review Status</p>
                            <p className="text-[10px] text-gray-400 mt-1">✔ CAC Registration Cert Checked • ✔ Tax Clearance verified</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setBannerMessage("Verification declined. Request sent to owner for document re-upload.")}
                            className="px-3.5 py-1.5 border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-xl font-semibold transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => onApproveRestaurant(r.id)}
                            className="px-3.5 py-1.5 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3.5]" /> Approve KYC Live
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* CLIENT ONBOARDING HUB */}
          {adminTab === 'onboarding' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Restaurant Client Onboarding */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="p-2 bg-orange-50 border border-orange-100 text-[#FF6B35] rounded-xl">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800">Onboard Restaurant Client</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Register, activate, and list a brand new kitchen partner</p>
                  </div>
                </div>

                <form onSubmit={handleAddRestaurantSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Restaurant Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Lagos Pepper Kitchen"
                      value={restName}
                      onChange={(e) => setRestName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#FF6B35]/40"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500">Cuisine Category</label>
                      <select
                        value={restCuisine}
                        onChange={(e) => setRestCuisine(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#FF6B35]/40 font-semibold text-gray-700"
                      >
                        <option value="Nigerian Jollof">Nigerian Jollof & Grill</option>
                        <option value="Suya & Kebab">Smoky Suya & Kebab</option>
                        <option value="Gourmet Burgers">Gourmet Burgers</option>
                        <option value="Asian Fusion">Asian Fusion / Sushi</option>
                        <option value="Healthy Bowls">Healthy Bowls & Salads</option>
                        <option value="Continental">Continental Desserts</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500">Delivery Fee (₦)</label>
                      <input
                        required
                        type="number"
                        placeholder="500"
                        value={restDeliveryFee}
                        onChange={(e) => setRestDeliveryFee(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#FF6B35]/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Operating Hours</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 08:00 AM - 10:00 PM"
                      value={restOperatingHours}
                      onChange={(e) => setRestOperatingHours(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#FF6B35]/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Contact Telephone</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. +234 811 222 3333"
                      value={restContact}
                      onChange={(e) => setRestContact(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#FF6B35]/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Kitchen Address / Coordinates</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 21, Admiralty Road, Lekki Phase 1, Lagos"
                      value={restAddress}
                      onChange={(e) => setRestAddress(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#FF6B35]/40"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🏪 Onboard & Activate Kitchen</span>
                  </button>
                </form>
              </div>

              {/* Rider Partner Onboarding */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800">Onboard Dispatch Rider</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Register a new courier, assign logistics vehicle, & connect online</p>
                  </div>
                </div>

                <form onSubmit={handleAddRiderSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Rider Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Kelechi Okafor"
                      value={riderNameInput}
                      onChange={(e) => setRiderNameInput(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#FF6B35]/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Logistics Vehicle Assigned</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bicycle' as const, icon: '🚲', label: 'Bicycle' },
                        { id: 'motorcycle' as const, icon: '🏍️', label: 'Motorcycle' },
                        { id: 'car' as const, icon: '🚗', label: 'Car' }
                      ].map((veh) => (
                        <button
                          type="button"
                          key={veh.id}
                          onClick={() => setRiderVehicleInput(veh.id)}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            riderVehicleInput === veh.id
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-base">{veh.icon}</span>
                          <span>{veh.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Contact Mobile Number</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. +234 815 333 4444"
                      value={riderPhoneInput}
                      onChange={(e) => setRiderPhoneInput(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#FF6B35]/40"
                    />
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                    <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">Logistics Telemetry Default</p>
                    <p className="text-[10px] text-emerald-600 mt-1">✔ Assigned starting GPS cluster: Lagos Municipality Center</p>
                    <p className="text-[10px] text-emerald-600">✔ Default operational status: logged ONLINE</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🏍 Onboard & Connect Rider</span>
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* 3. LIVE ORDER MONITOR */}
          {adminTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-1.5">
                <BarChart3 className="w-4.5 h-4.5 text-[#FF6B35]" />
                Live Platforms Order Grid
              </h3>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-semibold">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Restaurant</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Rider</th>
                      <th className="p-4 text-right">Invoice Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-gray-400">
                          No orders registered in system yet. Simulate a customer purchase!
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-gray-50/50 text-gray-600 transition-colors">
                          <td className="p-4 font-bold text-gray-800">#{ord.id}</td>
                          <td className="p-4">{ord.restaurantName}</td>
                          <td className="p-4">{ord.customerName}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              ord.status === 'Delivered' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : ord.status === 'Cancelled' 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-4">{ord.riderName || 'Assigning...'}</td>
                          <td className="p-4 text-right font-black text-[#FF6B35]">₦{ord.total.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. REVENUE SETTINGS */}
          {adminTab === 'payouts' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-3">
                <Sliders className="w-4.5 h-4.5 text-[#FF6B35]" />
                Commission Configuration Settings
              </h3>

              <div className="max-w-md space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-gray-600">
                    <label>Platform Commission Split Rate</label>
                    <span className="text-[#FF6B35] font-mono text-sm">{commissionRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseInt(e.target.value, 10))}
                    className="w-full bg-gray-100 h-2 rounded outline-none cursor-pointer accent-[#FF6B35]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Platform takes commission percentage cut on all meal subtotal transactions.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3.5">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Projected Platform Split simulation
                  </h4>
                  <div className="space-y-1 text-gray-500">
                    <div className="flex justify-between">
                      <span>Gross Sales Settled:</span>
                      <span className="font-semibold text-gray-800">₦{totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Platform Commission Cut ({commissionRate}%):</span>
                      <span className="font-bold">₦{platformCommissions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setBannerMessage("Platform-wide splits successfully updated and propagated!")}
                  className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  Apply & Save Split Configurations
                </button>
              </div>
            </div>
          )}

          {adminTab === 'restaurant_hub' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span>🍳</span> Integrated Merchant Workspace
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Admin-controlled system simulation for merchant menus and storefront approvals</p>
              </div>
              <RestaurantView
                restaurants={restaurants}
                menuItems={menuItems}
                orders={orders}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onAddMenuItem={onAddMenuItem}
                onUpdateMenuItem={onUpdateMenuItem}
                onDeleteMenuItem={onDeleteMenuItem}
                onUpdateRestaurant={onUpdateRestaurant}
              />
            </div>
          )}

          {adminTab === 'rider_dashboard' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span>🏍️</span> Integrated Dispatch Rider Console
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Admin-monitored courier simulation for route assignments, map coordinate tracking and messaging</p>
              </div>
              <RiderView
                riders={riders}
                orders={orders}
                messages={messages}
                onUpdateRider={onUpdateRider}
                onAssignRiderToOrder={onAssignRiderToOrder}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onSendMessage={onSendMessage}
              />
            </div>
          )}

          {/* 5. SALES & GROWTH ANALYTICS */}
          {adminTab === 'analytics' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-emerald-950 flex items-center gap-1.5">
                    <TrendingUp className="w-5 h-5 text-emerald-800" />
                    <span>Lagos Sales & Growth Telemetry</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-semibold">Granular analytics detailing daily revenue curves, customer peak windows, and recipe performance</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                    Active Session Engine
                  </span>
                </div>
              </div>
              <SalesGrowthChart orders={orders} menuItems={menuItems} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
