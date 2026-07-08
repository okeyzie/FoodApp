import React, { useState } from 'react';
import {
  Search,
  Clock,
  Star,
  MapPin,
  ShoppingBag,
  Plus,
  Minus,
  X,
  CreditCard,
  MessageSquare,
  Send,
  ThumbsUp,
  Heart,
  ChevronRight,
  Info,
  Wallet,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { Restaurant, MenuItem, Order, OrderItem, ChatMessage, PaymentMethod, PaymentProvider, CustomerAccount } from '../types';
import LiveTrackingMap from './LiveTrackingMap';

interface CustomerViewProps {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  activeOrder: Order | null;
  onPlaceOrder: (orderData: any) => Promise<Order>;
  onPayOrder: (orderId: string, provider: PaymentProvider) => Promise<void>;
  onRateOrder: (orderId: string, data: any) => Promise<void>;
  messages: ChatMessage[];
  onSendMessage: (orderId: string, text: string, sender: 'customer' | 'rider') => Promise<void>;
  customers: CustomerAccount[];
  currentCustomerId: string;
  onSelectCustomerId: (id: string) => void;
  onCreateCustomerAccount: (data: any) => Promise<any>;
  onUpdateCustomerAccount: (id: string, data: any) => Promise<void>;
  onLogout: () => void;
}

export default function CustomerView({
  restaurants,
  menuItems,
  activeOrder,
  onPlaceOrder,
  onPayOrder,
  onRateOrder,
  messages,
  onSendMessage,
  customers = [],
  currentCustomerId,
  onSelectCustomerId,
  onCreateCustomerAccount,
  onUpdateCustomerAccount,
  onLogout,
}: CustomerViewProps) {
  const activeCustomer = customers.find(c => c.id === currentCustomerId) || null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [riderTip, setRiderTip] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('Paystack');
  
  // Use customer's default address if logged in, otherwise default
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    const cust = customers.find(c => c.id === currentCustomerId) || customers[0];
    return cust ? cust.address : 'Plot 8, Admiralty Road, Lekki Phase 1, Lagos';
  });
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Sync address when customer changes
  React.useEffect(() => {
    if (activeCustomer) {
      setDeliveryAddress(activeCustomer.address);
    }
  }, [currentCustomerId, customers]);

  // Customer account creation state
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustBalance, setNewCustBalance] = useState('0'); // Default starting funds is 0

  // Wallet funding state
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWalletCreationModal, setShowWalletCreationModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('5000');
  
  // Chat state
  const [newMessageText, setNewMessageText] = useState('');
  
  // Payment Simulation Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'provider_select' | 'card_details' | 'success'>('provider_select');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  // Review state
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const categories = [
    { id: 'Burgers', emoji: '🍔' },
    { id: 'Sushi Rolls', emoji: '🍣' },
    { id: 'Woodfired Pizza', emoji: '🍕' },
    { id: 'Rice Dishes', emoji: '🍚' },
    { id: 'Sides', emoji: '🍟' },
  ];

  // Filtering Restaurants
  const filteredRestaurants = restaurants.filter(rest => {
    const matchesSearch = rest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rest.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAddToCart = (item: MenuItem, selectedAddOns: { name: string; price: number }[]) => {
    const cartItemId = `${item.id}-${selectedAddOns.map(a => a.name).join('-')}`;
    const existingIndex = cart.findIndex(c => c.id === cartItemId);
    
    if (existingIndex !== -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      const newCartItem: OrderItem = {
        id: cartItemId,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        selectedAddOns,
      };
      setCart([...cart, newCartItem]);
    }
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    const index = cart.findIndex(c => c.id === cartItemId);
    if (index === -1) return;
    
    const updated = [...cart];
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
      setCart(updated);
    } else {
      updated.splice(index, 1);
      setCart(updated);
    }
  };

  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => {
      const addonsSum = item.selectedAddOns.reduce((s, a) => s + a.price, 0);
      return sum + (item.price + addonsSum) * item.quantity;
    }, 0);
  };

  const getCartTax = () => Math.round(getCartSubtotal() * 0.075); // 7.5% VAT Nigeria
  const getDeliveryFee = () => (selectedRestaurant ? selectedRestaurant.deliveryFee : 500);
  const getCartTotal = () => getCartSubtotal() + getCartTax() + getDeliveryFee() + riderTip;

  const handleCheckout = async () => {
    if (!selectedRestaurant || cart.length === 0) return;
    
    try {
      const order = await onPlaceOrder({
        customerId: activeCustomer?.id || 'customer-1',
        customerName: activeCustomer?.name || 'Anonymous',
        customerPhone: activeCustomer?.phone || '+234 800 000 0000',
        restaurantId: selectedRestaurant.id,
        restaurantName: selectedRestaurant.name,
        items: cart,
        deliveryFee: selectedRestaurant.deliveryFee,
        riderTip,
        paymentMethod,
        paymentProvider,
        deliveryAddress,
        deliveryNotes,
        pickupOption: 'delivery',
      });
      
      setPendingOrder(order);
      setCart([]);
      
      if (paymentMethod === 'Cash on Delivery') {
        // No checkout modal needed for COD
        setSelectedRestaurant(null);
      } else {
        // Display beautiful Paystack / Flutterwave popup
        setPaymentStep('provider_select');
        setShowPaymentModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const simulatePayment = async () => {
    if (!pendingOrder) return;
    setIsProcessingPayment(true);
    
    // Simulate real bank authorization network lag
    setTimeout(async () => {
      try {
        await onPayOrder(pendingOrder.id, paymentProvider);
        setIsProcessingPayment(false);
        setPaymentStep('success');
      } catch (e) {
        console.error(e);
        setIsProcessingPayment(false);
      }
    }, 2000);
  };

  const handlePayWithWallet = async () => {
    if (!pendingOrder || !activeCustomer) return;
    if (activeCustomer.balance < pendingOrder.total) {
      alert("Insufficient Wallet Balance! Please add funds to your wallet or select another payment gateway (Paystack/Flutterwave).");
      return;
    }
    
    setIsProcessingPayment(true);
    setTimeout(async () => {
      try {
        // Subtract from customer balance
        const updatedBalance = activeCustomer.balance - pendingOrder.total;
        await onUpdateCustomerAccount(activeCustomer.id, { balance: updatedBalance });
        // Mark order as paid
        await onPayOrder(pendingOrder.id, paymentProvider);
        setIsProcessingPayment(false);
        setPaymentStep('success');
      } catch (e) {
        console.error(e);
        setIsProcessingPayment(false);
        alert("Wallet payment failed. Please try again.");
      }
    }, 1500);
  };

  const handleActivateWallet = async () => {
    if (!activeCustomer) return;
    try {
      await onUpdateCustomerAccount(activeCustomer.id, { walletCreated: true, balance: 0 });
      setShowWalletCreationModal(false);
      alert("🎉 Your secure FoodHub Digital Wallet has been successfully activated! Your starting balance is ₦0.00. You can now fund it using Card or Bank Transfer.");
    } catch (e) {
      console.error(e);
      alert("Failed to activate wallet. Please try again.");
    }
  };

  const handleFundWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !fundAmount) return;
    const added = parseFloat(fundAmount);
    if (isNaN(added) || added <= 0) return;
    const newBalance = activeCustomer.balance + added;
    await onUpdateCustomerAccount(activeCustomer.id, { balance: newBalance });
    setShowFundModal(false);
    alert(`Wallet funded successfully with ₦${added.toLocaleString()}!`);
  };

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    try {
      await onCreateCustomerAccount({
        name: newCustName,
        email: newCustEmail || `${newCustName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        phone: newCustPhone,
        address: newCustAddress || 'Plot 8, Admiralty Road, Lekki Phase 1, Lagos',
        balance: parseFloat(newCustBalance) || 20000,
      });
      setShowAddAccountModal(false);
      setNewCustName('');
      setNewCustEmail('');
      setNewCustPhone('');
      setNewCustAddress('');
      alert("Account registered and activated successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const activeOrderMessages = messages.filter(m => m.orderId === activeOrder?.id);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeOrder) return;
    await onSendMessage(activeOrder.id, newMessageText, 'customer');
    setNewMessageText('');
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    await onRateOrder(activeOrder.id, {
      restaurantRating,
      riderRating,
      comment: reviewComment,
    });
    setReviewSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] text-[#1A1A1A] pb-20">
      {/* CUSTOMER PORTAL HEADER BAR */}
      <div className="bg-white border-b border-gray-100 py-3 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Active User Info & Wallet */}
          {activeCustomer ? (
            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-600/20 bg-emerald-50 shrink-0">
                <img src={activeCustomer.avatar} alt={activeCustomer.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-extrabold text-gray-800">{activeCustomer.name}</h4>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase tracking-wider">
                    Customer Account
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">{activeCustomer.email} • {activeCustomer.phone}</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">No active customer account. Create one below to begin!</div>
          )}

          {/* Quick Wallet Balance & Switcher actions */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {/* Wallet Balance widget */}
            {activeCustomer && (
              activeCustomer.walletCreated ? (
                <div className="bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-left">
                    <p className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider font-mono">Wallet Balance</p>
                    <p className="text-xs font-black text-emerald-800">₦{activeCustomer.balance.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => {
                      setFundAmount('5000');
                      setShowFundModal(true);
                    }}
                    className="ml-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                  >
                    + Fund
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowWalletCreationModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white px-3.5 py-2 rounded-xl text-[11px] font-extrabold shadow-sm hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer border border-amber-400/20"
                >
                  <Wallet className="w-3.5 h-3.5 text-amber-300" />
                  <span>Activate Secure Wallet 💳</span>
                </button>
              )
            )}

            {/* Sign Out Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={onLogout}
                className="px-4 py-2 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Sign Out ➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Search & Promo Hero banner */}
      {!selectedRestaurant && !activeOrder && (
        <div className="bg-[#0F4C3A]/5 border-b border-emerald-950/5 px-4 py-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="max-w-xl text-center md:text-left">
              <span className="bg-emerald-50 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">
                ⭐ Promo Code: FOODHUB30
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-3 text-emerald-950 leading-tight">
                Satisfy Your Cravings, <br />
                <span className="text-emerald-800">
                  Delivered in 20 Mins!
                </span>
              </h2>
              <p className="text-gray-500 text-sm mt-2 font-medium">
                Order from Lagos' top rated kitchens with live order tracking and seamless cashless checkout.
              </p>
            </div>
            {/* Search Input Box */}
            <div className="w-full max-w-md bg-white border border-gray-100 p-2 rounded-2xl flex items-center shadow-xs">
              <Search className="text-gray-400 w-5 h-5 ml-2" />
              <input
                type="text"
                placeholder="Search Burgers, Sushi, Jollof, Pizza..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm text-[#1A1A1A] outline-none placeholder-gray-400 font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* ACTIVE ORDER LIVE TRACKING VIEW */}
        {activeOrder && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Order Tracking Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-xs font-black text-emerald-800 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 uppercase tracking-wider">
                      Live Delivery Tracking
                    </span>
                    <h3 className="text-lg font-extrabold text-gray-800 mt-2">
                      Order #{activeOrder.id}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      From <strong className="text-gray-700">{activeOrder.restaurantName}</strong> • {new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Estimated Delivery</p>
                    <p className="text-2xl font-black text-emerald-800 mt-0.5">
                      {activeOrder.estimatedDeliveryTime || '25 Mins'}
                    </p>
                  </div>
                </div>

                {/* Tracking Progress Steps */}
                <div className="py-6">
                  <div className="relative flex justify-between items-center w-full">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 -z-0" />
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-800 transition-all duration-1000 -z-0"
                      style={{
                        width: 
                          activeOrder.status === 'Order Received' ? '10%' :
                          activeOrder.status === 'Preparing' ? '30%' :
                          activeOrder.status === 'Ready for Pickup' ? '50%' :
                          activeOrder.status === 'Rider Assigned' ? '65%' :
                          activeOrder.status === 'Rider En Route' ? '80%' :
                          activeOrder.status === 'Arriving Soon' ? '92%' : '100%'
                      }}
                    />

                    {/* Step Nodes */}
                    {[
                      { label: 'Received', status: 'Order Received' },
                      { label: 'Preparing', status: 'Preparing' },
                      { label: 'En Route', status: 'Rider En Route' },
                      { label: 'Delivered', status: 'Delivered' }
                    ].map((step, idx) => {
                      const statuses = ['Order Received', 'Preparing', 'Ready for Pickup', 'Rider Assigned', 'Rider En Route', 'Arriving Soon', 'Delivered'];
                      const currentIdx = statuses.indexOf(activeOrder.status);
                      const stepIdx = statuses.indexOf(step.status);
                      const isCompleted = currentIdx >= stepIdx;
                      const isCurrent = activeOrder.status === step.status || (step.status === 'Rider En Route' && ['Ready for Pickup', 'Rider Assigned', 'Rider En Route', 'Arriving Soon'].includes(activeOrder.status));

                      return (
                        <div key={idx} className="flex flex-col items-center z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-emerald-800 border-emerald-800/50 text-white scale-115' 
                              : 'bg-white border-gray-200 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-emerald-800/20 shadow-lg' : ''}`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[10px] font-semibold mt-2 ${
                            isCompleted ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subtext info */}
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-start gap-3 mt-2">
                  <Info className="w-5 h-5 text-[#FF6B35] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">
                      Current Status: {activeOrder.status}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {activeOrder.status === 'Order Received' && 'The kitchen has received your order and will begin prep soon.'}
                      {activeOrder.status === 'Preparing' && 'Our chefs are crafting your fresh hot meal right now.'}
                      {activeOrder.status === 'Ready for Pickup' && 'The order is packaged, sealed, and ready at the counter.'}
                      {activeOrder.status === 'Rider Assigned' && `Rider ${activeOrder.riderName} is arriving at the restaurant to pick up.`}
                      {activeOrder.status === 'Rider En Route' && 'Your food is on the bike! Track the rider cruising on the map.'}
                      {activeOrder.status === 'Arriving Soon' && 'Look outside! Your delivery rider is turning onto your street.'}
                      {activeOrder.status === 'Delivered' && 'Order complete! Enjoy your hot meal and please leave feedback.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Map */}
              <LiveTrackingMap order={activeOrder} />

              {/* FEEDBACK RATING FORM - show only if status is Delivered */}
              {activeOrder.status === 'Delivered' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span>🌟</span> Review Your Order
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">Help us improve the community by rating the kitchen and the rider.</p>

                  {!reviewSubmitted ? (
                    <form onSubmit={handleRateSubmit} className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Restaurant Rating */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <label className="text-xs font-semibold text-gray-700">Rate the Restaurant ({activeOrder.restaurantName})</label>
                          <div className="flex gap-2 mt-2">
                            {[1, 2, 3, 4, 5].map((stars) => (
                              <button
                                type="button"
                                key={stars}
                                onClick={() => setRestaurantRating(stars)}
                                className="text-2xl transition-transform hover:scale-125"
                              >
                                {stars <= restaurantRating ? '⭐️' : '☆'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rider Rating */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <label className="text-xs font-semibold text-gray-700">Rate the Rider ({activeOrder.riderName || 'Rider'})</label>
                          <div className="flex gap-2 mt-2">
                            {[1, 2, 3, 4, 5].map((stars) => (
                              <button
                                type="button"
                                key={stars}
                                onClick={() => setRiderRating(stars)}
                                className="text-2xl transition-transform hover:scale-125"
                              >
                                {stars <= riderRating ? '⭐️' : '☆'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Comment Box */}
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-700 mb-2">Write a Review (Optional)</label>
                        <textarea
                          placeholder="Tell us what you liked, or how we can improve..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-800 outline-none h-20 placeholder-gray-400 focus:border-[#FF6B35]/40"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#FF6B35] text-white font-bold rounded-xl text-xs hover:bg-[#E55A2B] transition-colors shadow-sm"
                      >
                        Submit Review & Complete Demo
                      </button>
                    </form>
                  ) : (
                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-center rounded-xl mt-4">
                      <p className="text-emerald-600 text-sm font-bold">✨ Thank you! Your feedback has been recorded.</p>
                      <p className="text-gray-500 text-xs mt-1">The restaurant menu rating is now updated on the homepage!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Col: Delivery Rider Chat & Details */}
            <div className="space-y-6">
              {/* Rider Card */}
              {activeOrder.riderId && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35] border border-[#FF6B35]/20 text-lg">
                    🚴
                  </div>
                  <div>
                    <h4 className="text-xs text-gray-500">Assigned Delivery Rider</h4>
                    <h3 className="text-sm font-bold text-gray-800 mt-0.5">{activeOrder.riderName}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">📞 {activeOrder.riderPhone}</p>
                  </div>
                </div>
              )}

              {/* Chat Panel with Rider */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col h-[300px]">
                <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#FF6B35]" />
                  Chat with Delivery Rider
                </h3>

                {/* Messages container */}
                <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
                  {activeOrderMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <p className="text-[10px]">No messages yet.</p>
                      <p className="text-[9px] mt-1 text-center text-gray-500">Ask the rider where they are or provide delivery instructions!</p>
                    </div>
                  ) : (
                    activeOrderMessages.map((msg) => {
                      const isMe = msg.sender === 'customer';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          <div className={`px-3 py-2 rounded-2xl ${
                            isMe ? 'bg-[#FF6B35] text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
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

                {/* Message input */}
                <form onSubmit={handleSendChat} className="flex gap-2 border-t border-gray-100 pt-3">
                  <input
                    type="text"
                    placeholder="Type a message to rider..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 text-xs rounded-xl px-3 py-2 text-gray-800 outline-none focus:border-[#FF6B35]/40"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-[#FF6B35] text-white hover:bg-[#E55A2B] transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* RESTAURANT SELECTION OR MEAL SELECTION VIEW */}
        {!activeOrder && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Middle Content: Restaurants or Menu list */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* If browsing a particular restaurant */}
              {selectedRestaurant ? (
                <div>
                  {/* Back Navigation Bar */}
                  <button
                    onClick={() => setSelectedRestaurant(null)}
                    className="mb-4 text-xs font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors flex items-center gap-1"
                  >
                    ← Back to All Restaurants
                  </button>

                  {/* Restaurant Banner Header */}
                  <div className="relative h-48 rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                    <img
                      src={selectedRestaurant.image}
                      alt={selectedRestaurant.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/45 to-transparent" />
                    <div className="absolute bottom-6 left-6">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF6B35] text-white px-2.5 py-1 rounded-full">
                        {selectedRestaurant.cuisine}
                      </span>
                      <h2 className="text-2xl font-black text-white mt-2">{selectedRestaurant.name}</h2>
                      <p className="text-gray-200 text-xs mt-1 max-w-xl">{selectedRestaurant.description}</p>
                      
                      <div className="flex flex-wrap gap-4 items-center text-xs mt-3 text-gray-200 font-medium">
                        <span className="flex items-center gap-1 text-[#FF6B35] font-bold">
                          <Star className="w-4 h-4 fill-[#FF6B35]" /> {selectedRestaurant.rating} ({selectedRestaurant.reviewsCount} reviews)
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {selectedRestaurant.deliveryTime} mins
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {selectedRestaurant.distance} km
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Restaurant Menu Grid */}
                  <h3 className="text-lg font-bold text-gray-800 mt-8 mb-4 border-b border-gray-100 pb-2">🍳 Menu Catalog</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menuItems
                      .filter(m => m.restaurantId === selectedRestaurant.id)
                      .map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4 shadow-sm hover:border-gray-300 transition-all">
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-gray-800">{item.name}</h4>
                              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2.5">
                              <span className="text-sm font-black text-emerald-800">₦{item.price.toLocaleString()}</span>
                              <button
                                onClick={() => handleAddToCart(item, [])}
                                className="px-3 py-1 bg-emerald-800 text-white text-xs font-black rounded-lg hover:bg-emerald-950 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                /* Browsing Restaurants list */
                <div>
                  {/* Category Pill Filters */}
                  <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        selectedCategory === null
                          ? 'bg-[#FF6B35] text-white border-[#FF6B35]/40'
                          : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      All Foods 🍲
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                          selectedCategory === c.id
                            ? 'bg-[#FF6B35] text-white border-[#FF6B35]/40'
                            : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        {c.id} {c.emoji}
                      </button>
                    ))}
                  </div>

                  {/* Restaurants Grid List */}
                  <h3 className="text-lg font-bold text-gray-800 mt-6 mb-4">Nearby Restaurants in Lekki</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredRestaurants.map((rest) => (
                      <div
                        key={rest.id}
                        onClick={() => setSelectedRestaurant(rest)}
                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-[#FF6B35]/50 group transition-all duration-300 shadow-sm flex flex-col"
                      >
                        <div className="h-40 overflow-hidden relative">
                          <img
                            src={rest.image}
                            alt={rest.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/70 via-transparent to-transparent" />
                          <span className="absolute top-3 right-3 bg-white/95 text-[#FF6B35] text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-100">
                            {rest.cuisine}
                          </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-base font-bold text-gray-800 group-hover:text-[#FF6B35] transition-colors">
                              {rest.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{rest.description}</p>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs mt-4 text-gray-500 border-t border-gray-100 pt-3">
                            <span className="flex items-center gap-1 text-[#FF6B35] font-bold">
                              <Star className="w-3.5 h-3.5 fill-[#FF6B35]" /> {rest.rating}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {rest.deliveryTime} mins
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {rest.distance} km
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Interactive Shopping Cart */}
            <div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-24 shadow-sm flex flex-col max-h-[calc(100vh-140px)]">
                <h3 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><ShoppingBag className="w-4.5 h-4.5 text-[#FF6B35]" /> Cart</span>
                  <span className="text-xs font-bold text-gray-400">{cart.length} items</span>
                </h3>

                {/* Cart list */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center justify-center">
                      <ShoppingBag className="w-10 h-10 stroke-[1.5] text-gray-300 mb-2" />
                      <p className="text-xs font-semibold">Your cart is empty.</p>
                      <p className="text-[10px] mt-1 text-gray-400">Browse menus to add delicious meals!</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-xs border-b border-gray-100 pb-3">
                        <div className="max-w-[70%]">
                           <h4 className="font-bold text-gray-700">{item.name}</h4>
                          <span className="text-[10px] text-[#FF6B35] font-bold">₦{item.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-gray-700 px-1">{item.quantity}</span>
                          <button
                            onClick={() => handleAddToCart({ id: item.menuItemId, name: item.name, price: item.price } as MenuItem, [])}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart Checkout Summary controls */}
                {cart.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 space-y-3.5 text-xs">

                    {/* Tip Rider */}
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-100 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-500">🏍️ Tip Delivery Rider</span>
                      <div className="flex gap-1.5">
                        {[0, 500, 1000].map((tip) => (
                          <button
                            key={tip}
                            onClick={() => setRiderTip(tip)}
                            className={`px-2 py-1 text-[10px] font-black rounded-md border transition-all ${
                              riderTip === tip
                                ? 'bg-[#FF6B35] text-white border-[#FF6B35]/40'
                                : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            {tip === 0 ? 'None' : `₦${tip}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Gateways Selection */}
                    <div className="bg-gray-50 border border-gray-100 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-500 block mb-1.5">💳 Checkout Payment Gateway</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => { setPaymentMethod('Card'); setPaymentProvider('Paystack'); }}
                          className={`px-2 py-1 text-[10px] font-black rounded-md border text-center transition-all ${
                            paymentProvider === 'Paystack' && paymentMethod === 'Card'
                              ? 'bg-teal-600 text-white border-teal-500'
                              : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          Paystack Card
                        </button>
                        <button
                          onClick={() => { setPaymentMethod('Card'); setPaymentProvider('Flutterwave'); }}
                          className={`px-2 py-1 text-[10px] font-black rounded-md border text-center transition-all ${
                            paymentProvider === 'Flutterwave' && paymentMethod === 'Card'
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          Flutterwave
                        </button>
                      </div>
                    </div>

                    {/* Summary cost */}
                    <div className="space-y-1 text-[11px] text-gray-500">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₦{getCartSubtotal().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT (7.5%)</span>
                        <span>₦{getCartTax().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>₦{getDeliveryFee().toLocaleString()}</span>
                      </div>
                      {riderTip > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Rider Tip</span>
                          <span>₦{riderTip.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-black text-gray-800 border-t border-gray-100 pt-2.5">
                        <span>Total Invoice</span>
                        <span className="text-[#FF6B35]">₦{getCartTotal().toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className="w-full py-3 bg-[#FF6B35] text-white font-black rounded-xl text-xs hover:bg-[#E55A2B] transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-4.5 h-4.5" />
                      Place Food Order
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* AUTHENTIC PAYSTACK / FLUTTERWAVE GATEWAY SIMULATION MODAL */}
      {showPaymentModal && pendingOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 text-slate-800 flex flex-col">
            
            {/* Payment Header themed by Provider */}
            <div className={`p-5 text-white flex items-center justify-between ${
              paymentProvider === 'Paystack' ? 'bg-teal-600' : 'bg-indigo-600'
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">Secure Cashless Checkout</span>
                <h3 className="text-base font-black mt-0.5">
                  {paymentProvider === 'Paystack' ? 'Paystack Gateway' : 'Flutterwave Checkout'}
                </h3>
              </div>
              <div className="px-2 py-1 rounded bg-white/10 border border-white/25 text-[10px] font-bold font-mono">
                SECURE 🔒
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 space-y-4">
              
              {paymentStep === 'provider_select' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <p className="text-xs text-slate-500">Transaction Invoice</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">Order #{pendingOrder.id}</p>
                    <p className="text-2xl font-black text-slate-950 mt-1">₦{pendingOrder.total.toLocaleString()}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 font-sans">Choose secure payment option:</label>
                    
                    {/* Instant Wallet checkout choice */}
                    {activeCustomer && (
                      activeCustomer.walletCreated ? (
                        <button
                          onClick={handlePayWithWallet}
                          disabled={isProcessingPayment}
                          className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-xl text-left px-4 transition-all flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏦</span>
                            <div>
                              <span className="block text-[11px] font-black text-emerald-900 leading-tight font-sans">Instant FoodHub Wallet</span>
                              <span className="block text-[9px] text-emerald-600 font-bold mt-0.5">Available Balance: ₦{activeCustomer.balance.toLocaleString()}</span>
                            </div>
                          </div>
                          {isProcessingPayment ? (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-emerald-500" />
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏦</span>
                            <div>
                              <span className="block text-[11px] font-bold text-gray-400 leading-tight font-sans">Instant FoodHub Wallet (Locked)</span>
                              <span className="block text-[9px] text-gray-400 mt-0.5 font-semibold">Activate wallet account to pay with balance</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPaymentModal(false);
                              setShowWalletCreationModal(true);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold rounded-lg transition-all cursor-pointer shadow-xs"
                          >
                            Activate
                          </button>
                        </div>
                      )
                    )}

                    <div className="border-t border-slate-100 my-2 pt-1" />

                    <button
                      onClick={() => setPaymentStep('card_details')}
                      disabled={isProcessingPayment}
                      className="w-full py-2.5 border border-slate-200 hover:border-slate-400 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between px-4 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">💳 Pay with Credit / Debit Card</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={simulatePayment}
                      disabled={isProcessingPayment}
                      className="w-full py-2.5 border border-slate-200 hover:border-slate-400 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between px-4 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">⚡ Secure Instant Bank Transfer</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'card_details' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Card Number</label>
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none focus:border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none focus:border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CVV</label>
                      <input
                        type="password"
                        placeholder="123"
                        maxLength={3}
                        value={cardCVV}
                        onChange={(e) => setCardCVV(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none focus:border-slate-300"
                      />
                    </div>
                  </div>

                  <button
                    onClick={simulatePayment}
                    disabled={isProcessingPayment}
                    className={`w-full py-3 text-white font-black rounded-xl text-xs transition-colors mt-2 shadow-md ${
                      paymentProvider === 'Paystack' 
                        ? 'bg-teal-600 hover:bg-teal-500' 
                        : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {isProcessingPayment ? 'Processing Transaction...' : `Authorize Payment of ₦${pendingOrder.total.toLocaleString()}`}
                  </button>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
                    ✔
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">Transaction Approved</h4>
                    <p className="text-xs text-slate-500 mt-1">Payment successfully routed via {paymentProvider}. Your order is now live!</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPendingOrder(null);
                      setSelectedRestaurant(null);
                    }}
                    className="w-full py-2.5 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors shadow-md"
                  >
                    Track My Order 🏍️
                  </button>
                </div>
              )}

            </div>

            {/* Cancel transaction footer */}
            {paymentStep !== 'success' && (
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPendingOrder(null);
                }}
                className="py-3.5 text-center text-xs font-semibold text-slate-400 hover:text-rose-500 border-t border-slate-100 transition-colors bg-slate-50 hover:bg-rose-50"
              >
                Cancel Transaction
              </button>
            )}

          </div>
        </div>
      )}

      {/* REGISTER NEW CUSTOMER ACCOUNT MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 text-slate-800 flex flex-col">
            <div className="p-5 bg-[#FF6B35] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Customer Portal</span>
                <h3 className="text-base font-black mt-0.5">Register New Account</h3>
              </div>
              <button onClick={() => setShowAddAccountModal(false)} className="text-white hover:text-gray-200 text-sm font-bold bg-white/10 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddAccountSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Phone Number</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. +234 803 000 0000"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Initial Wallet Funding (₦)</label>
                <input
                  type="number"
                  placeholder="20000"
                  value={newCustBalance}
                  onChange={(e) => setNewCustBalance(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FF6B35] text-white font-extrabold rounded-xl text-xs hover:bg-[#E55A2B] transition-colors mt-2 shadow-md cursor-pointer"
              >
                Register & Login 👤
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WALLET FUNDING GATEWAY MODAL */}
      {showFundModal && activeCustomer && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 text-slate-800 flex flex-col">
            <div className="p-5 bg-emerald-600 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 font-mono">Secure Settlement</span>
                <h3 className="text-base font-black mt-0.5">Fund Your Wallet</h3>
              </div>
              <button onClick={() => setShowFundModal(false)} className="text-white hover:text-gray-200 text-sm font-bold bg-white/10 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleFundWalletSubmit} className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <p className="text-xs text-emerald-600 font-bold">Current Balance</p>
                <p className="text-2xl font-black text-emerald-800 mt-1">₦{activeCustomer.balance.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Select pre-set top-up amount:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['2000', '5000', '10000'].map((amount) => (
                    <button
                      type="button"
                      key={amount}
                      onClick={() => setFundAmount(amount)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        fundAmount === amount
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      ₦{parseInt(amount).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Or specify custom amount (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-colors mt-2 shadow-md cursor-pointer"
              >
                Complete Wallet Funding 🔒
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECURE WALLET CREATION / CONNECT MODAL */}
      {showWalletCreationModal && activeCustomer && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 text-slate-800 flex flex-col transform transition-all">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-[#0F4C3A] to-[#165c47] text-white flex flex-col relative">
              <button 
                onClick={() => setShowWalletCreationModal(false)} 
                className="absolute top-4 right-4 text-white/80 hover:text-white text-sm font-bold bg-white/10 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
              <div className="p-2.5 bg-amber-500/10 text-amber-300 w-fit rounded-xl border border-amber-400/20 mb-3">
                <Wallet className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 font-mono">Instant Cashless Payments</span>
              <h3 className="text-xl font-black mt-0.5 tracking-tight">Setup FoodHub Wallet</h3>
              <p className="text-xs text-emerald-100/80 mt-1 font-semibold">Activate your high-security virtual ledger for gourmet ordering</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/30">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Zero Payment Failure Rate</h4>
                    <p className="text-[10px] text-emerald-800 mt-0.5">Settle bills instantly using pre-loaded virtual balances. Avoid card processing issues.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/30">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Instant Refunds & Rewards</h4>
                    <p className="text-[10px] text-emerald-800 mt-0.5">Refunds from canceled runs or rider settlements credit back instantly into your balance.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/30">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Top-Up at Your Convenience</h4>
                    <p className="text-[10px] text-emerald-800 mt-0.5">Easily fund your ledger via card simulations or manual Bank Transfers anytime.</p>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3.5 py-2.5 rounded-xl text-[10px] text-slate-500 font-semibold font-mono">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Protected by FoodHub Secure Settlement protocol. Starting balance: ₦0.00</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWalletCreationModal(false)}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleActivateWallet}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer border border-emerald-700/45 hover:scale-[1.01]"
                >
                  Activate Wallet 💳
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
