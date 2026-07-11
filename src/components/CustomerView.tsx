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
  User,
  Copy,
  Check,
  History,
  RotateCcw,
} from 'lucide-react';
import { Restaurant, MenuItem, Order, OrderItem, ChatMessage, PaymentMethod, PaymentProvider, CustomerAccount } from '../types';
import LiveTrackingMap from './LiveTrackingMap';

interface CustomerViewProps {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  activeOrder: Order | null;
  orders: Order[];
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
  orders = [],
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
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const [isSimulatingTransfer, setIsSimulatingTransfer] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  
  // Chat state
  const [newMessageText, setNewMessageText] = useState('');
  
  // Payment Simulation Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'provider_select' | 'card_details' | 'otp_verify' | 'bank_transfer' | 'success'>('provider_select');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [transferTimer, setTransferTimer] = useState(600); // 10 mins countdown
  const [copiedPaymentAcc, setCopiedPaymentAcc] = useState(false);

  // Bank transfer countdown timer
  React.useEffect(() => {
    let interval: any;
    if (showPaymentModal && paymentStep === 'bank_transfer' && transferTimer > 0) {
      interval = setInterval(() => {
        setTransferTimer(prev => prev - 1);
      }, 1000);
    } else if (transferTimer === 0 && paymentStep === 'bank_transfer') {
      setPaymentError("The unique transfer account has expired. Please close checkout and try again.");
    }
    return () => clearInterval(interval);
  }, [showPaymentModal, paymentStep, transferTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
    { id: 'Nigeria Local Meals', emoji: '🇳🇬' },
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

  const handleIncrementCartItem = (cartItemId: string) => {
    const index = cart.findIndex(c => c.id === cartItemId);
    if (index === -1) return;
    const updated = [...cart];
    updated[index].quantity += 1;
    setCart(updated);
  };

  const handleReorder = (order: Order) => {
    const matchedRest = restaurants.find(r => r.id === order.restaurantId);
    if (!matchedRest) {
      alert("This restaurant is no longer available.");
      return;
    }
    
    const newCartItems: OrderItem[] = order.items.map(item => {
      const mItem = menuItems.find(m => m.id === item.menuItemId);
      return {
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        price: mItem ? mItem.price : item.price,
        quantity: item.quantity,
        selectedAddOns: item.selectedAddOns || [],
        specialInstructions: item.specialInstructions || '',
      };
    });

    setCart(newCartItems);
    setSelectedRestaurant(matchedRest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleCardNumberChange = (value: string) => {
    let clean = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    for (let i = 0; i < clean.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += clean[i];
    }
    setCardNumber(formatted);
    setPaymentError(null);
  };

  const handleCardExpiryChange = (value: string) => {
    let clean = value.replace(/[^0-9]/gi, '');
    let formatted = '';
    if (clean.length > 0) {
      formatted = clean.substring(0, 2);
      if (clean.length > 2) {
        formatted += '/' + clean.substring(2, 4);
      }
    }
    setCardExpiry(formatted);
    setPaymentError(null);
  };

  const handleCardCVVChange = (value: string) => {
    let clean = value.replace(/[^0-9]/gi, '').substring(0, 3);
    setCardCVV(clean);
    setPaymentError(null);
  };

  const validateCardDetails = () => {
    const rawCardNum = cardNumber.replace(/\s/g, '');
    if (rawCardNum.length !== 16) {
      setPaymentError("Invalid Card Number. Please enter a valid 16-digit card number.");
      return false;
    }
    if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
      setPaymentError("Invalid Expiry Date. Please use MM/YY format.");
      return false;
    }
    const [monthStr, yearStr] = cardExpiry.split('/');
    const month = parseInt(monthStr, 10);
    if (month < 1 || month > 12) {
      setPaymentError("Invalid Expiry Month. Must be between 01 and 12.");
      return false;
    }
    if (cardCVV.length !== 3) {
      setPaymentError("Invalid CVV. Please enter a 3-digit CVV code.");
      return false;
    }
    return true;
  };

  const handleCardAuthSubmit = () => {
    if (!validateCardDetails()) return;
    
    setIsProcessingPayment(true);
    setPaymentError(null);
    
    // Simulate real bank authorization network lag
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentStep('otp_verify');
      setOtpCode('');
    }, 1500);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingOrder) return;
    if (otpCode.length < 4) {
      setPaymentError("Please enter the 4-digit code sent to your mobile device.");
      return;
    }
    
    setIsProcessingPayment(true);
    setPaymentError(null);
    
    setTimeout(async () => {
      try {
        await onPayOrder(pendingOrder.id, paymentProvider);
        setIsProcessingPayment(false);
        setPaymentStep('success');
        setCart([]); // Clear cart ONLY upon successful payment!
      } catch (e) {
        console.error(e);
        setIsProcessingPayment(false);
        setPaymentError("Failed to authorize card OTP. Please retry.");
      }
    }, 1500);
  };

  const handleInitiateBankTransfer = () => {
    setPaymentStep('bank_transfer');
    setTransferTimer(600); // 10 minutes
    setPaymentError(null);
  };

  const handleBankTransferConfirm = () => {
    if (!pendingOrder) return;
    setIsProcessingPayment(true);
    setPaymentError(null);
    
    setTimeout(async () => {
      try {
        await onPayOrder(pendingOrder.id, paymentProvider);
        setIsProcessingPayment(false);
        setPaymentStep('success');
        setCart([]); // Clear cart ONLY upon successful payment!
      } catch (e) {
        console.error(e);
        setIsProcessingPayment(false);
        setPaymentError("Transfer verification timed out. Please retry.");
      }
    }, 2000);
  };

  const handleCheckout = async () => {
    let rest = selectedRestaurant;
    if (!rest && cart.length > 0) {
      const firstItem = cart[0];
      const mItem = menuItems.find(m => m.id === firstItem.menuItemId);
      if (mItem) {
        rest = restaurants.find(r => r.id === mItem.restaurantId) || null;
      }
    }

    if (!rest || cart.length === 0) {
      alert("Please select a restaurant or add items from a restaurant menu first.");
      return;
    }
    
    try {
      const order = await onPlaceOrder({
        customerId: activeCustomer?.id || 'customer-1',
        customerName: activeCustomer?.name || 'Anonymous',
        customerPhone: activeCustomer?.phone || '+234 800 000 0000',
        restaurantId: rest.id,
        restaurantName: rest.name,
        items: cart,
        deliveryFee: rest.deliveryFee,
        riderTip,
        paymentMethod,
        paymentProvider,
        deliveryAddress,
        deliveryNotes,
        pickupOption: 'delivery',
      });
      
      setPendingOrder(order);
      setPaymentError(null);
      
      if (paymentMethod === 'Cash on Delivery') {
        setCart([]); // Clear cart immediately for COD
        setPaymentStep('success');
        setShowPaymentModal(true);
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
    // This serves as fallback for any legacy buttons calling simulatePayment
    if (!pendingOrder) return;
    setIsProcessingPayment(true);
    
    setTimeout(async () => {
      try {
        await onPayOrder(pendingOrder.id, paymentProvider);
        setIsProcessingPayment(false);
        setPaymentStep('success');
        setCart([]); // Clear cart on success
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
        setCart([]); // Clear cart on success!
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
      
      const cleanName = activeCustomer.name.toUpperCase().replace(/[^A-Z]/g, '');
      const bankName = "Providus Bank (FoodHub Settlements)";
      const accNumber = `950${Math.floor(1000000 + Math.random() * 9000000)}`;
      const accName = `FDHB-${cleanName}`;
      
      alert(`🎉 Your secure FoodHub Digital Wallet has been successfully activated! \n\nWe have instantly generated your unique virtual local bank transfer details:\n🏦 Bank: ${bankName}\n🔢 Account Number: ${accNumber}\n👤 Account Name: ${accName}\n\nYou can fund your wallet at any time by making a bank transfer directly to this unique local account!`);
    } catch (e) {
      console.error(e);
      alert("Failed to activate wallet. Please try again.");
    }
  };

  const handleSimulateBankTransfer = async () => {
    if (!activeCustomer || !fundAmount) return;
    const added = parseFloat(fundAmount);
    if (isNaN(added) || added <= 0) {
      alert("Please enter a valid amount to transfer.");
      return;
    }
    
    setIsSimulatingTransfer(true);
    setSimulationStep(1);
    
    setTimeout(() => {
      setSimulationStep(2);
      setTimeout(() => {
        setSimulationStep(3);
        setTimeout(async () => {
          try {
            const newBalance = activeCustomer.balance + added;
            await onUpdateCustomerAccount(activeCustomer.id, { balance: newBalance });
            setIsSimulatingTransfer(false);
            setSimulationStep(0);
            setShowFundModal(false);
            alert(`⚡ Secure Bank Settlement Confirmed!\n\nYour FoodHub virtual wallet has been credited with ₦${added.toLocaleString()} via instant local bank transfer to your unique virtual account.`);
          } catch (e) {
            console.error(e);
            setIsSimulatingTransfer(false);
            setSimulationStep(0);
            alert("Settlement simulation failed. Please try again.");
          }
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleFundWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSimulateBankTransfer();
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
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-600/20 bg-emerald-100 flex items-center justify-center shrink-0">
                {activeCustomer.avatar ? (
                  <img src={activeCustomer.avatar} alt={activeCustomer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-5 h-5 text-emerald-800" />
                )}
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

                  {/* Order History Section */}
                  <div className="mt-12 border-t border-gray-100 pt-8" id="order-history-section">
                    <div className="flex items-center gap-2.5 mb-6">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 border border-emerald-100/30">
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-800">Your Order History</h3>
                        <p className="text-xs text-gray-500 font-medium">View previous Lagos culinary runs and quickly duplicate them</p>
                      </div>
                    </div>

                    {(() => {
                      const customerOrders = orders.filter(o => o.customerId === currentCustomerId);
                      const sortedCustomerOrders = [...customerOrders].sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      );

                      if (sortedCustomerOrders.length === 0) {
                        return (
                          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400 shadow-sm">
                            <Clock className="w-10 h-10 mx-auto stroke-[1.5] mb-2 text-gray-300 animate-pulse" />
                            <h4 className="text-xs font-bold text-gray-700">No Past Orders Found</h4>
                            <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto">Once you complete a Lagos gourmet run, your delivery records and invoices will populate here.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {sortedCustomerOrders.map((order) => {
                            const orderDate = new Date(order.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });

                            // Status badge styling helper
                            const getStatusBadge = (status: string) => {
                              switch (status) {
                                case 'Delivered':
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase tracking-wider">
                                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                                      Delivered
                                    </span>
                                  );
                                case 'Cancelled':
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-100 uppercase tracking-wider">
                                      <X className="w-3 h-3 text-rose-600" />
                                      Cancelled
                                    </span>
                                  );
                                default:
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100 uppercase tracking-wider animate-pulse">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      {status}
                                    </span>
                                  );
                              }
                            };

                            return (
                              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-600/30 hover:shadow-xs transition-all duration-300">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                  <div>
                                    <span className="text-[9px] font-mono text-gray-400 font-bold block uppercase tracking-wider">ORDER #{order.id}</span>
                                    <h4 className="text-sm font-black text-gray-800 mt-0.5">{order.restaurantName}</h4>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{orderDate}</p>
                                  </div>
                                  <div className="flex items-center gap-2.5 self-start sm:self-center">
                                    {getStatusBadge(order.status)}
                                    <span className="text-sm font-black text-emerald-900">₦{order.total.toLocaleString()}</span>
                                  </div>
                                </div>

                                <div className="py-3">
                                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Ordered Items</p>
                                  <div className="space-y-1.5">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between text-xs text-gray-600 font-medium">
                                        <span>
                                          {item.quantity}x <strong className="text-gray-700 font-bold">{item.name}</strong>
                                          {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                            <span className="text-[10px] text-gray-400 block ml-4">
                                              + {item.selectedAddOns.map(a => `${a.name} (₦${a.price})`).join(', ')}
                                            </span>
                                          )}
                                        </span>
                                        <span className="text-gray-400 font-mono">
                                          ₦{((item.price + (item.selectedAddOns || []).reduce((sum, ad) => sum + ad.price, 0)) * item.quantity).toLocaleString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                                  <span className="text-[10px] text-gray-400 font-semibold">
                                    Payment: <strong className="text-gray-600">{order.paymentMethod} • {order.paymentStatus}</strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleReorder(order)}
                                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-black rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Re-order Items</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
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
                            onClick={() => handleIncrementCartItem(item.id)}
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

                    {/* Delivery Location & Instructions */}
                    <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl space-y-2.5 animate-fade-in">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">📍</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Delivery Destination</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">Destination Address</label>
                        <input
                          type="text"
                          placeholder="Enter your delivery address in Lagos..."
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 outline-none focus:border-emerald-500 shadow-3xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">Rider Instructions (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Ring bell twice, leave with security guard..."
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 outline-none focus:border-emerald-500 shadow-3xs"
                        />
                      </div>
                    </div>

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
                    <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-gray-500 block">💳 Checkout Payment Option</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setPaymentMethod('Card'); setPaymentProvider('Paystack'); }}
                          className={`px-2 py-2 text-[10px] font-black rounded-lg border text-center transition-all cursor-pointer ${
                            paymentProvider === 'Paystack' && paymentMethod === 'Card'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-teal-500 hover:text-teal-600'
                          }`}
                        >
                          Paystack
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPaymentMethod('Card'); setPaymentProvider('Flutterwave'); }}
                          className={`px-2 py-2 text-[10px] font-black rounded-lg border text-center transition-all cursor-pointer ${
                            paymentProvider === 'Flutterwave' && paymentMethod === 'Card'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-500 hover:text-indigo-600'
                          }`}
                        >
                          Flutterwave
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPaymentMethod('Wallet'); setPaymentProvider('Paystack'); }}
                          className={`px-2 py-2 text-[10px] font-black rounded-lg border text-center transition-all cursor-pointer ${
                            paymentMethod === 'Wallet'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-600'
                          }`}
                        >
                          FoodHub Wallet
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPaymentMethod('Cash on Delivery'); setPaymentProvider('COD'); }}
                          className={`px-2 py-2 text-[10px] font-black rounded-lg border text-center transition-all cursor-pointer ${
                            paymentMethod === 'Cash on Delivery'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-amber-500 hover:text-amber-600'
                          }`}
                        >
                          Cash on Delivery
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
            <div className={`p-5 text-white flex items-center justify-between transition-colors duration-300 ${
              paymentProvider === 'Paystack' ? 'bg-[#00A389]' : 'bg-[#EF4444]'
            }`}>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-85">Secure Cashless Checkout</span>
                <h3 className="text-base font-black mt-0.5 font-sans">
                  {paymentProvider === 'Paystack' ? 'Paystack Gateway' : 'Flutterwave Checkout'}
                </h3>
              </div>
              <div className="px-2.5 py-1 rounded bg-white/10 border border-white/20 text-[9px] font-black font-mono flex items-center gap-1">
                <span>🔒</span> SECURE
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 space-y-4 max-h-[75vh] overflow-y-auto">
              {paymentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold rounded-xl animate-fade-in flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <span className="flex-1">{paymentError}</span>
                </div>
              )}

              {paymentStep === 'provider_select' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Transaction Invoice</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">Order #{pendingOrder.id}</p>
                    <p className="text-2xl font-black text-slate-950 mt-1">₦{pendingOrder.total.toLocaleString()}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Choose secure payment option:</label>
                    
                    {/* Instant Wallet checkout choice */}
                    {activeCustomer && (
                      activeCustomer.walletCreated ? (
                        <button
                          onClick={handlePayWithWallet}
                          disabled={isProcessingPayment}
                          className="w-full py-3 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-150 hover:border-emerald-300 rounded-xl text-left px-4 transition-all flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">🏦</span>
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
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">🏦</span>
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
                      onClick={() => { setPaymentStep('card_details'); setPaymentError(null); }}
                      disabled={isProcessingPayment}
                      className="w-full py-3 border border-slate-200 hover:border-slate-400 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-between px-4 transition-colors cursor-pointer bg-white"
                    >
                      <span className="flex items-center gap-2.5">💳 Pay with Credit / Debit Card</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    <button
                      onClick={handleInitiateBankTransfer}
                      disabled={isProcessingPayment}
                      className="w-full py-3 border border-slate-200 hover:border-slate-400 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-between px-4 transition-colors cursor-pointer bg-white"
                    >
                      <span className="flex items-center gap-2.5">⚡ Secure Instant Bank Transfer</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'card_details' && (
                <div className="space-y-4">
                  {/* Visual card preview */}
                  <div className={`p-4 rounded-2xl text-white relative overflow-hidden shadow-md flex flex-col justify-between h-28 font-mono transition-all duration-300 ${
                    paymentProvider === 'Paystack' ? 'bg-gradient-to-br from-teal-700 to-emerald-900' : 'bg-gradient-to-br from-indigo-700 to-purple-900'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase opacity-75">Debit Card</span>
                      <span className="text-base">💳</span>
                    </div>
                    <div className="text-sm tracking-widest font-black py-1">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between text-[9px] font-semibold uppercase opacity-80">
                      <div>
                        <span className="block text-[6px] opacity-60">Card Holder</span>
                        <span className="truncate max-w-[120px] block">{activeCustomer?.name || 'Anonymous'}</span>
                      </div>
                      <div>
                        <span className="block text-[6px] opacity-60">Expiry</span>
                        <span>{cardExpiry || 'MM/YY'}</span>
                      </div>
                      <div>
                        <span className="block text-[6px] opacity-60">CVV</span>
                        <span>{cardCVV ? '•••' : '000'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Card Number</label>
                      <input
                        type="text"
                        placeholder="5061 1234 5678 9010"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-300 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          value={cardExpiry}
                          onChange={(e) => handleCardExpiryChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-300 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          maxLength={3}
                          value={cardCVV}
                          onChange={(e) => handleCardCVVChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-300 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => { setPaymentStep('provider_select'); setPaymentError(null); }}
                        className="w-1/3 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleCardAuthSubmit}
                        disabled={isProcessingPayment}
                        className={`w-2/3 py-3 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1 ${
                          paymentProvider === 'Paystack' 
                            ? 'bg-[#00A389] hover:bg-[#008A74]' 
                            : 'bg-[#EF4444] hover:bg-[#D93838]'
                        }`}
                      >
                        {isProcessingPayment ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          `Pay ₦${pendingOrder.total.toLocaleString()}`
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paymentStep === 'otp_verify' && (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
                    <span className="text-2xl">🛡️</span>
                    <h4 className="text-xs font-black text-slate-800 mt-2">3D Secure Card Authentication</h4>
                    <p className="text-[10px] text-slate-400 mt-1">We have sent a 4-digit verification code to the mobile device connected to this card.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-center">Enter Verification OTP</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 1234"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value.replace(/[^0-9]/g, '')); setPaymentError(null); }}
                      className="w-32 mx-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold tracking-widest text-center text-slate-800 outline-none focus:border-slate-300 font-mono block"
                    />
                    <span className="block text-[9px] text-slate-400 text-center font-semibold mt-1">Demo sandbox tip: Use code <strong className="text-slate-600">1234</strong> or any digits.</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setPaymentStep('card_details'); setPaymentError(null); }}
                      className="w-1/3 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className={`w-2/3 py-3 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1 ${
                        paymentProvider === 'Paystack' 
                          ? 'bg-[#00A389] hover:bg-[#008A74]' 
                          : 'bg-[#EF4444] hover:bg-[#D93838]'
                      }`}
                    >
                      {isProcessingPayment ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Submit Secure OTP'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {paymentStep === 'bank_transfer' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-500">PROVIDER BANK:</span>
                      <span className="font-extrabold text-slate-800 font-sans">
                        {paymentProvider === 'Paystack' ? 'WEMA BANK (via Paystack)' : 'PROVIDUS BANK (via Flutterwave)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-200/60 pt-2.5">
                      <div className="space-y-0.5">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Account Number</span>
                        <span className="text-base font-black text-slate-900 tracking-wider font-mono">
                          {paymentProvider === 'Paystack' ? '9012938475' : '9502938471'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentProvider === 'Paystack' ? '9012938475' : '9502938471');
                          setCopiedPaymentAcc(true);
                          setTimeout(() => setCopiedPaymentAcc(false), 2000);
                        }}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          copiedPaymentAcc 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {copiedPaymentAcc ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-200/60 pt-2.5 text-[11px]">
                      <span className="font-bold text-slate-500">ACCOUNT NAME:</span>
                      <span className="font-extrabold text-slate-800 font-mono">FoodHub - Order #{pendingOrder.id}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-200/60 pt-2.5 text-[11px]">
                      <span className="font-bold text-slate-500">TOTAL AMOUNT:</span>
                      <span className="font-black text-rose-600 text-sm">₦{pendingOrder.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block font-mono">⚠️ TRANSFER RETRY CLOCK</span>
                    <p className="text-[11px] font-extrabold text-amber-900">
                      Unique account expires in: <span className="font-mono text-xs font-black bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">{formatTimer(transferTimer)}</span>
                    </p>
                    <p className="text-[9px] text-amber-600 font-semibold leading-tight mt-1">Please perform a bank transfer of exactly ₦{pendingOrder.total.toLocaleString()} before the countdown ends.</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setPaymentStep('provider_select'); setPaymentError(null); }}
                      className="w-1/3 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleBankTransferConfirm}
                      disabled={isProcessingPayment || transferTimer === 0}
                      className={`w-2/3 py-3 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1 ${
                        paymentProvider === 'Paystack' 
                          ? 'bg-[#00A389] hover:bg-[#008A74]' 
                          : 'bg-[#EF4444] hover:bg-[#D93838]'
                      }`}
                    >
                      {isProcessingPayment ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="animate-pulse">Checking logs...</span>
                        </div>
                      ) : (
                        "I've made the transfer"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && pendingOrder && (
                <div className="text-center py-6 space-y-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner animate-bounce">
                    ✔
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      {pendingOrder.paymentMethod === 'Cash on Delivery' ? 'Order Placed Successfully!' : 'Transaction Approved'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {pendingOrder.paymentMethod === 'Cash on Delivery'
                        ? `Your Cash on Delivery order #${pendingOrder.id} has been transmitted to ${pendingOrder.restaurantName}! Please prepare exactly ₦${pendingOrder.total.toLocaleString()} cash to pay upon delivery.`
                        : `Payment successfully verified and settled. Your order #${pendingOrder.id} has been transmitted to ${pendingOrder.restaurantName}!`
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPendingOrder(null);
                      setSelectedRestaurant(null);
                    }}
                    className="w-full py-3 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors shadow-md animate-pulse"
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
                className="py-3.5 text-center text-xs font-semibold text-slate-400 hover:text-rose-500 border-t border-slate-100 transition-colors bg-slate-50 hover:bg-rose-50 cursor-pointer"
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
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 text-slate-800 flex flex-col relative">
            
            {/* Header */}
            <div className="p-5 bg-emerald-850 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 font-mono">Secure Settlement Portal</span>
                <h3 className="text-base font-black mt-0.5">Fund via Local Bank Transfer</h3>
              </div>
              <button 
                onClick={() => {
                  if (!isSimulatingTransfer) setShowFundModal(false);
                }} 
                disabled={isSimulatingTransfer}
                className="text-white hover:text-gray-200 text-sm font-bold bg-white/10 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Simulation Overlay */}
            {isSimulatingTransfer && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-800 animate-spin mb-4" />
                <h4 className="text-sm font-black text-slate-800">Secure Settlement Processing</h4>
                
                <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-emerald-700 h-full transition-all duration-500" 
                    style={{ width: simulationStep === 1 ? '33%' : simulationStep === 2 ? '66%' : '100%' }}
                  />
                </div>

                <p className="text-[11px] font-bold text-emerald-800 mt-4 animate-pulse font-mono uppercase tracking-wide">
                  {simulationStep === 1 && "⏳ Connecting to Interbank Settlement System (NIBSS)..."}
                  {simulationStep === 2 && "🔍 Verifying transfer credit for virtual account..."}
                  {simulationStep === 3 && "⚡ Reconciling FoodHub virtual wallet ledger..."}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Please do not refresh or close this window.</p>
              </div>
            )}

            <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Wallet Info */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <div>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">Current Wallet Balance</p>
                  <p className="text-xl font-black text-emerald-950 mt-0.5">₦{activeCustomer.balance.toLocaleString()}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              {/* Unique Generated Bank Details */}
              <div className="border border-emerald-100 bg-emerald-50/40 p-4 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="absolute right-[-10px] top-[-10px] text-emerald-100 text-7xl font-bold font-serif select-none pointer-events-none opacity-20">
                  🏦
                </div>
                <div className="flex items-center gap-1.5 text-emerald-900">
                  <span className="text-xs font-black uppercase tracking-wider font-mono bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md">
                    Unique Virtual Account Details
                  </span>
                </div>

                <div className="space-y-2.5 pt-1 text-slate-800">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Receiving Bank</span>
                    <span className="block text-xs font-extrabold text-slate-800">
                      {activeCustomer.bankName || "Providus Bank (FoodHub Settlements)"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Account Name</span>
                    <span className="block text-xs font-extrabold text-slate-800">
                      {activeCustomer.bankAccountName || `FDHB-${activeCustomer.name.toUpperCase().replace(/[^A-Z]/g, '')}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-xl">
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">Virtual Account Number</span>
                      <span className="block text-sm font-black text-emerald-850 tracking-wider font-mono">
                        {activeCustomer.bankAccountNumber || "9501234567"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const accNum = activeCustomer.bankAccountNumber || "9501234567";
                        navigator.clipboard.writeText(accNum);
                        setCopiedAccountNumber(true);
                        setTimeout(() => setCopiedAccountNumber(false), 2000);
                      }}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-black"
                    >
                      {copiedAccountNumber ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 border border-amber-200/50 p-3.5 rounded-2xl flex items-start gap-2.5">
                <span className="text-base mt-0.5">ℹ️</span>
                <p className="text-[10px] text-amber-900 leading-normal font-semibold">
                  <strong className="font-extrabold block mb-0.5">Payment Instructions:</strong>
                  To top up, please open your commercial bank application (e.g. GTBank, Kuda, Zenith, Kuda, etc.) and complete a local bank transfer to your unique virtual account number shown above.
                </p>
              </div>

              {/* Sandbox Simulation Panel */}
              <div className="border border-slate-200 bg-slate-50 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Live Simulation Sandbox</span>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  Settle payments instantly within this browser context by choosing an amount and clicking simulation below:
                </p>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {['2000', '5000', '10000'].map((amount) => (
                      <button
                        type="button"
                        key={amount}
                        onClick={() => setFundAmount(amount)}
                        className={`py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                          fundAmount === amount
                            ? 'bg-emerald-850 border-emerald-800 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-3xs'
                        }`}
                      >
                        ₦{parseInt(amount).toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₦</span>
                    <input
                      type="number"
                      placeholder="Or enter custom amount (e.g. 15000)"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-extrabold text-slate-800 outline-none focus:border-emerald-500 shadow-3xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateBankTransfer}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-700/30"
                >
                  ⚡ Trigger Instant Bank Transfer Settlement
                </button>
              </div>

            </div>
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
