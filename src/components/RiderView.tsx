import React, { useState } from 'react';
import {
  Bike,
  Navigation,
  DollarSign,
  Award,
  Power,
  TrendingUp,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  MessageSquare,
  Send,
  Eye,
} from 'lucide-react';
import { Rider, Order, ChatMessage, OrderStatus } from '../types';

interface RiderViewProps {
  riders: Rider[];
  orders: Order[];
  messages: ChatMessage[];
  onUpdateRider: (riderId: string, data: any) => Promise<void>;
  onAssignRiderToOrder: (orderId: string, riderId: string) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onSendMessage: (orderId: string, text: string, sender: 'customer' | 'rider') => Promise<void>;
}

export default function RiderView({
  riders,
  orders,
  messages,
  onUpdateRider,
  onAssignRiderToOrder,
  onUpdateOrderStatus,
  onSendMessage,
}: RiderViewProps) {
  const [activeRiderId, setActiveRiderId] = useState<string>(riders[0]?.id || 'rider-1');
  const [newMessageText, setNewMessageText] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [mockSignature, setMockSignature] = useState('');

  // Find active rider profile
  const rider = riders.find(r => r.id === activeRiderId) || riders[0];

  // Toggle Online / Offline
  const handleToggleOnline = async () => {
    const nextStatus = rider.status === 'online' ? 'offline' : 'online';
    await onUpdateRider(rider.id, { status: nextStatus });
  };

  // Filter available orders needing a rider
  const availableOrders = orders.filter(o => o.pickupOption === 'delivery' && !o.riderId && o.status === 'Ready for Pickup');
  
  // Find current active assigned order
  const activeOrder = orders.find(o => o.riderId === rider.id && o.status !== 'Delivered' && o.status !== 'Cancelled');
  const finishedOrders = orders.filter(o => o.riderId === rider.id && o.status === 'Delivered');

  const handleAcceptOrder = async (orderId: string) => {
    await onAssignRiderToOrder(orderId, rider.id);
  };

  const handleUpdateDeliveryStep = async (nextStatus: OrderStatus) => {
    if (!activeOrder) return;
    await onUpdateOrderStatus(activeOrder.id, nextStatus);
  };

  const handleConfirmFinalDelivery = async () => {
    if (!activeOrder) return;
    await onUpdateOrderStatus(activeOrder.id, 'Delivered');
    setShowSignaturePad(false);
    setMockSignature('');
  };

  const activeOrderMessages = messages.filter(m => m.orderId === activeOrder?.id);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeOrder) return;
    await onSendMessage(activeOrder.id, newMessageText, 'rider');
    setNewMessageText('');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] pb-16">
      <div className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* Rider Switcher & Status bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-gray-200 p-4 rounded-2xl gap-4 shadow-sm mb-6">
          {/* Rider profile select */}
          <div className="flex items-center gap-3">
            <Bike className="w-5 h-5 text-[#FF6B35]" />
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Managing Rider</label>
              <select
                value={activeRiderId}
                onChange={(e) => {
                  setActiveRiderId(e.target.value);
                  setShowSignaturePad(false);
                }}
                className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer pr-4"
              >
                {riders.map(r => (
                  <option key={r.id} value={r.id} className="bg-white text-gray-800 font-semibold">{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Online toggle */}
          <div className="flex items-center md:justify-center gap-2">
            <button
              onClick={handleToggleOnline}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                rider.status === 'online'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {rider.status === 'online' ? 'Online & Available' : 'Offline'}
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex justify-between md:justify-end gap-6 text-xs text-right">
            <div>
              <p className="text-gray-400 font-medium">Earnings</p>
              <p className="text-sm font-black text-emerald-600 mt-0.5">₦{rider.earnings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Rating</p>
              <p className="text-sm font-black text-[#FF6B35] mt-0.5">⭐ {rider.rating}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Deliveries</p>
              <p className="text-sm font-black text-gray-700 mt-0.5">{rider.deliveriesCount} trips</p>
            </div>
          </div>
        </div>

        {/* MAIN RIDER WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Job / Available Offers Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. ACTIVE ORDER ROUTE NAVIGATOR */}
            {activeOrder ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF6B35] text-white px-2.5 py-1 rounded-full">
                      ACTIVE TRIP: {activeOrder.status}
                    </span>
                    <h3 className="text-lg font-bold text-gray-800 mt-3">Trip #{activeOrder.id}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Kitchen: <strong className="text-gray-700">{activeOrder.restaurantName}</strong></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total Payout</p>
                    <p className="text-lg font-black text-emerald-600 mt-0.5">₦{(Math.round(activeOrder.deliveryFee * 0.8) + activeOrder.riderTip).toLocaleString()}</p>
                  </div>
                </div>

                {/* Pickup and Delivery Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Restaurant Pickup
                    </p>
                    <p className="font-bold text-gray-800 mt-2">{activeOrder.restaurantName}</p>
                    <p className="text-gray-500 mt-1">Lekki Phase 1, Lagos</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Customer Destination
                    </p>
                    <p className="font-bold text-gray-800 mt-2">{activeOrder.customerName}</p>
                    <p className="text-gray-500 mt-1">{activeOrder.deliveryAddress}</p>
                    {activeOrder.deliveryNotes && (
                      <p className="text-[10px] text-[#FF6B35] mt-1.5 font-medium italic">"Note: {activeOrder.deliveryNotes}"</p>
                    )}
                  </div>
                </div>

                {/* TRIP GPS NAVIGATION RADAR CONTROLLER */}
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    Trip Steps Tracker
                  </h4>

                  {/* Operational buttons for rider navigation simulation */}
                  <div className="flex flex-wrap gap-2.5">
                    {activeOrder.status === 'Rider Assigned' && (
                      <button
                        onClick={() => handleUpdateDeliveryStep('Preparing')}
                        className="flex-1 py-2.5 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        🏍️ Arrived at Restaurant
                      </button>
                    )}

                    {activeOrder.status === 'Preparing' && (
                      <div className="text-center w-full py-4 bg-white border border-gray-200 rounded-xl text-gray-500">
                        <p className="text-xs">The kitchen is preparing the food package...</p>
                        <p className="text-[10px] mt-1 text-gray-400">Wait for the kitchen to mark it as ready!</p>
                      </div>
                    )}

                    {activeOrder.status === 'Ready for Pickup' && (
                      <button
                        onClick={() => handleUpdateDeliveryStep('Rider En Route')}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        📦 Collect Package & Start Riding
                      </button>
                    )}

                    {activeOrder.status === 'Rider En Route' && (
                      <button
                        onClick={() => handleUpdateDeliveryStep('Arriving Soon')}
                        className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 animate-pulse"
                      >
                        ⚡ Approaching Customer Location
                      </button>
                    )}

                    {activeOrder.status === 'Arriving Soon' && (
                      <button
                        onClick={() => setShowSignaturePad(true)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        ✔ Handover Meal & Complete Trip
                      </button>
                    )}
                  </div>
                </div>

                {/* TRIP GPS SIGNATURE PAD (MODAL SIMULATOR) */}
                {showSignaturePad && (
                  <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-xl space-y-4 shadow-inner">
                    <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <span>✍</span> Proof of Delivery (POD) Confirmation
                    </h4>
                    <p className="text-[10px] text-emerald-600">Ask the customer to sign on your device to unlock delivery payout.</p>

                    <div className="bg-white border-2 border-dashed border-gray-200 h-28 rounded-xl flex items-center justify-center relative overflow-hidden">
                      {mockSignature ? (
                        <span className="font-cursive text-2xl text-emerald-600 select-none transform rotate-3">
                          {mockSignature}
                        </span>
                      ) : (
                        <div className="text-center space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setMockSignature(activeOrder.customerName)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] rounded transition-all"
                          >
                            Sign Customer Name
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => { setMockSignature(''); setShowSignaturePad(false); }}
                        className="flex-1 py-2 border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmFinalDelivery}
                        disabled={!mockSignature}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg disabled:opacity-50 transition-all"
                      >
                        Submit Signature
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* NO ACTIVE ORDER, SHOW OFFERS */
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] animate-pulse" />
                  Live Available Delivery Requests ({availableOrders.length})
                </h3>

                {rider.status === 'offline' ? (
                  <div className="bg-white border border-gray-200 p-8 rounded-2xl text-center space-y-2">
                    <p className="text-xs font-bold text-gray-400">You are offline.</p>
                    <p className="text-[10px] text-gray-500">Toggle status to ONLINE to accept delivery requests and earn commissions!</p>
                  </div>
                ) : availableOrders.length === 0 ? (
                  <div className="bg-white border border-gray-100 p-10 text-center rounded-2xl shadow-sm">
                    <p className="text-xs text-gray-400 font-semibold">Scanning Lekki grid for ready packages...</p>
                    <p className="text-[10px] text-gray-400 mt-1">When a restaurant marks food as ready, it will appear here!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableOrders.map((ord) => (
                      <div key={ord.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                        <div>
                          <div className="flex justify-between">
                            <span className="text-[9px] font-bold text-amber-600 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded">
                              Ready for Pick up
                            </span>
                            <span className="text-sm font-black text-emerald-600">
                              ₦{(Math.round(ord.deliveryFee * 0.8) + ord.riderTip).toLocaleString()}
                            </span>
                          </div>
                          
                          <h4 className="text-xs font-bold text-gray-800 mt-3">From: {ord.restaurantName}</h4>
                          <p className="text-[10px] text-gray-500 mt-1">To: {ord.customerName} ({ord.deliveryAddress})</p>
                        </div>

                        <button
                          onClick={() => handleAcceptOrder(ord.id)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl mt-4 transition-colors"
                        >
                          Accept Delivery Run
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rider History log */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">📜 Trip Run History</h4>
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 text-xs">
                {finishedOrders.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-[10px]">No trips completed today yet.</div>
                ) : (
                  finishedOrders.map((ord) => (
                    <div key={ord.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100/60">
                      <div>
                        <p className="font-bold text-gray-800">Trip #{ord.id}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">To: {ord.customerName} ({ord.deliveryAddress})</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">₦{(Math.round(ord.deliveryFee * 0.8) + ord.riderTip).toLocaleString()}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Completed</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Side Column: Active Trip Chats & Controls */}
          <div className="space-y-6">
            
            {/* 2. CHAT WITH CUSTOMER (Only enabled if active order assigned) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col h-[380px]">
              <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Chat with Customer
              </h3>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
                {!activeOrder ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                    <p className="text-[10px]">No active delivery.</p>
                    <p className="text-[9px] mt-1">Accept a delivery trip to coordinate with the customer.</p>
                  </div>
                ) : activeOrderMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                    <p className="text-[10px]">No messages yet.</p>
                    <p className="text-[9px] mt-1">Tell the customer you are heading to the kitchen or on your way!</p>
                  </div>
                ) : (
                  activeOrderMessages.map((msg) => {
                    const isMe = msg.sender === 'rider';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className={`px-3 py-2 rounded-2xl ${
                          isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }`}>
                          <p className="text-[11px] leading-relaxed break-words">{msg.text}</p>
                        </div>
                        <span className="text-[8px] text-gray-400 mt-0.5">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message send form */}
              <form onSubmit={handleSendChat} className="flex gap-2 border-t border-gray-100 pt-3">
                <input
                  type="text"
                  placeholder="Type a message to customer..."
                  disabled={!activeOrder}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 text-gray-700 outline-none focus:border-emerald-500/40 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!activeOrder}
                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
