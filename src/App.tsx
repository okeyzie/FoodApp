import React, { useState, useEffect, useRef } from 'react';
import RoleSwitcher from './components/RoleSwitcher';
import CustomerView from './components/CustomerView';
import CustomerAuth from './components/CustomerAuth';
import RestaurantView from './components/RestaurantView';
import RiderView from './components/RiderView';
import AdminView from './components/AdminView';
import AdminAuth from './components/AdminAuth';
import { AppState, Order, OrderStatus, PaymentProvider } from './types';
import {
  initialRestaurants,
  initialMenuItems,
  initialRiders,
  initialReviews,
  initialCustomers,
  initialAdmins
} from './initialData';

export default function App() {
  const [role, setRole] = useState<'customer' | 'restaurant' | 'rider' | 'admin'>('customer');
  
  // Initialize state with localStorage fallback or default initial seed data
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('foodhub_local_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.restaurants)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to read local state, falling back to seed", e);
    }
    return {
      restaurants: initialRestaurants,
      menuItems: initialMenuItems,
      riders: initialRiders,
      orders: [],
      messages: [],
      reviews: initialReviews,
      customers: initialCustomers,
      admins: initialAdmins
    };
  });

  const [loading, setLoading] = useState(true);
  const pollCountRef = useRef(0);
  
  const [currentCustomerId, setCurrentCustomerId] = useState<string>(() => {
    try {
      return localStorage.getItem('currentCustomerId') || '';
    } catch {
      return '';
    }
  });

  const [currentAdminId, setCurrentAdminId] = useState<string>(() => {
    try {
      return localStorage.getItem('currentAdminId') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      if (currentCustomerId) {
        localStorage.setItem('currentCustomerId', currentCustomerId);
      } else {
        localStorage.removeItem('currentCustomerId');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentCustomerId]);

  useEffect(() => {
    try {
      if (currentAdminId) {
        localStorage.setItem('currentAdminId', currentAdminId);
      } else {
        localStorage.removeItem('currentAdminId');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentAdminId]);

  // Persist state to localStorage on any state mutation
  useEffect(() => {
    if (state) {
      try {
        localStorage.setItem('foodhub_local_state', JSON.stringify(state));
      } catch (e) {
        console.error("Failed to write state to localStorage", e);
      }
    }
  }, [state]);

  // Load state from the backend Express API with fallback check for cookie redirects
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setState(data);
          setLoading(false);
          return;
        }
      }
      // If we got redirected (cookie check) or server sent HTML, we stop loading and use offline state
      setLoading(false);
    } catch (e) {
      console.warn("Express server sync unavailable (cookie check or network block). Using offline-first simulated local storage.", e);
      setLoading(false);
    }
  };

  // Trigger initial fetch on load, then poll every 3 seconds for live synchronized roles
  useEffect(() => {
    fetchState();

    const intervalId = setInterval(() => {
      pollCountRef.current += 1;
      fetchState();
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const handleResetState = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        alert("Simulated database has been wiped and reset to default Lagos, Nigeria restaurants & riders!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // CUSTOMER FLOW APIS
  const handlePlaceOrder = async (orderData: any): Promise<Order> => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('Failed to place order');
    const newOrder = await res.json();
    await fetchState();
    return newOrder;
  };

  const handlePayOrder = async (orderId: string, provider: PaymentProvider) => {
    const res = await fetch(`/api/orders/${orderId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentProvider: provider }),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  const handleRateOrder = async (orderId: string, data: any) => {
    const res = await fetch(`/api/orders/${orderId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  // RESTAURANT / GENERAL OPERATION ORDER APIS
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  const handleAddMenuItem = async (restaurantId: string, itemData: any) => {
    const res = await fetch(`/api/restaurants/${restaurantId}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  const handleUpdateMenuItem = async (menuId: string, itemData: any) => {
    const res = await fetch(`/api/menu/${menuId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  const handleDeleteMenuItem = async (menuId: string) => {
    const res = await fetch(`/api/menu/${menuId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchState();
    }
  };

  const handleUpdateRestaurant = async (restaurantId: string, data: any) => {
    const res = await fetch(`/api/restaurants/${restaurantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  // RIDER FLOW APIS
  const handleUpdateRider = async (riderId: string, data: any) => {
    const res = await fetch(`/api/riders/${riderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  const handleAssignRiderToOrder = async (orderId: string, riderId: string) => {
    const res = await fetch(`/api/orders/${orderId}/assign-rider`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riderId }),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  // CHAT INTERACTION APIS
  const handleSendMessage = async (orderId: string, text: string, sender: 'customer' | 'rider') => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, text, sender }),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  // ADMIN OPERATIONS APIS
  const handleApproveRestaurant = async (restaurantId: string) => {
    await handleUpdateRestaurant(restaurantId, { isApproved: true });
  };

  // ADDITIONAL APIS FOR PORTAL & SCALABLE ADMIN CLIENT CREATIONS
  const handleCreateCustomerAccount = async (customerData: any) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    });
    if (res.ok) {
      const newCust = await res.json();
      await fetchState();
      setCurrentCustomerId(newCust.id);
      return newCust;
    }
  };

  const handleUpdateCustomerAccount = async (customerId: string, customerData: any) => {
    const res = await fetch(`/api/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  const handleAdminAddRestaurant = async (restaurantData: any) => {
    const res = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restaurantData),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  const handleAdminAddRider = async (riderData: any) => {
    const res = await fetch('/api/riders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(riderData),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  if (loading || !state) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black text-emerald-950 mt-4 tracking-tight">Connecting to FoodHub Express telemetry...</p>
        <p className="text-xs text-emerald-700/60 mt-1 font-semibold uppercase tracking-wider">Populating simulated databases</p>
      </div>
    );
  }

  // Identify active order for Customer role
  // We define an active order as the latest non-finalized delivery order
  const activeCustomerOrder = state.orders
    .filter(o => o.customerId === currentCustomerId && o.status !== 'Delivered' && o.status !== 'Cancelled')
    .slice(-1)[0] || null;

  // Active metrics count
  const activeOrdersCount = state.orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;
  const onlineRidersCount = state.riders.filter(r => r.status === 'online').length;

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans text-[#1A1A1A] selection:bg-emerald-800/10 selection:text-emerald-800">
      {/* Floating Global Swappable Role Header */}
      <RoleSwitcher
        currentRole={role}
        setRole={setRole}
        activeOrdersCount={activeOrdersCount}
        onlineRidersCount={onlineRidersCount}
      />

      {/* RENDER CURRENT INTERACTIVE VIEW MODULE */}
      <main className="transition-all duration-300">
        {role === 'customer' && (
          state.customers.some(c => c.id === currentCustomerId) ? (
            <CustomerView
              restaurants={state.restaurants.filter(r => r.isApproved)} // only approved restaurants visible to customer
              menuItems={state.menuItems.filter(m => m.isAvailable)} // only available meals visible
              activeOrder={activeCustomerOrder}
              onPlaceOrder={handlePlaceOrder}
              onPayOrder={handlePayOrder}
              onRateOrder={handleRateOrder}
              messages={state.messages}
              onSendMessage={handleSendMessage}
              customers={state.customers}
              currentCustomerId={currentCustomerId}
              onSelectCustomerId={setCurrentCustomerId}
              onCreateCustomerAccount={handleCreateCustomerAccount}
              onUpdateCustomerAccount={handleUpdateCustomerAccount}
              onLogout={() => {
                setCurrentCustomerId('');
                localStorage.removeItem('currentCustomerId');
              }}
            />
          ) : (
            <CustomerAuth
              onLoginSuccess={(customerId, customerData) => {
                if (customerData) {
                  setState(prev => {
                    const alreadyExists = prev.customers.some(c => c.id === customerId);
                    if (!alreadyExists) {
                      return {
                        ...prev,
                        customers: [...prev.customers, customerData]
                      };
                    }
                    return prev;
                  });
                }
                setCurrentCustomerId(customerId);
              }}
              customers={state.customers}
            />
          )
        )}

        {role === 'admin' && (
          (state.admins || []).some(a => a.id === currentAdminId) ? (
            <div className="space-y-4">
              <div className="bg-rose-900 text-rose-100 py-3 px-4 text-xs font-bold flex justify-between items-center max-w-7xl mx-auto rounded-b-xl border border-rose-950 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Active Operations Deck Admin Session: <strong className="text-white font-black">{(state.admins || []).find(a => a.id === currentAdminId)?.name || 'Admin'}</strong> ({(state.admins || []).find(a => a.id === currentAdminId)?.email})</span>
                </div>
                <button
                  onClick={() => {
                    setCurrentAdminId('');
                    localStorage.removeItem('currentAdminId');
                  }}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/15 cursor-pointer font-bold text-[10px]"
                >
                  Exit Control Room 🔒
                </button>
              </div>
              <AdminView
                restaurants={state.restaurants}
                riders={state.riders}
                orders={state.orders}
                reviews={state.reviews}
                menuItems={state.menuItems}
                messages={state.messages}
                onApproveRestaurant={handleApproveRestaurant}
                onAddRestaurant={handleAdminAddRestaurant}
                onAddRider={handleAdminAddRider}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onAddMenuItem={handleAddMenuItem}
                onUpdateMenuItem={handleUpdateMenuItem}
                onDeleteMenuItem={handleDeleteMenuItem}
                onUpdateRestaurant={handleUpdateRestaurant}
                onUpdateRider={handleUpdateRider}
                onAssignRiderToOrder={handleAssignRiderToOrder}
                onSendMessage={handleSendMessage}
              />
            </div>
          ) : (
            <AdminAuth
              onLoginSuccess={(adminId, adminData) => {
                if (adminData) {
                  setState(prev => {
                    const exists = (prev.admins || []).some(a => a.id === adminId);
                    return {
                      ...prev,
                      admins: exists ? (prev.admins || []) : [...(prev.admins || []), adminData]
                    };
                  });
                }
                setCurrentAdminId(adminId);
              }}
              admins={state.admins || []}
            />
          )
        )}
      </main>
    </div>
  );
}
