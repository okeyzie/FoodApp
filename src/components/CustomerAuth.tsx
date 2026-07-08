import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, MapPin, Sparkles, ShieldCheck, Upload, Image, Trash2, Heart, Clock, Star, Utensils } from 'lucide-react';
import { motion } from 'motion/react';
import { CustomerAccount } from '../types';

interface CustomerAuthProps {
  onLoginSuccess: (customerId: string, customerData?: CustomerAccount) => void;
  customers: CustomerAccount[];
}

export default function CustomerAuth({ onLoginSuccess, customers }: CustomerAuthProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Interactive Showcase States
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'soups' | 'rice' | 'grills' | 'dessert'>('all');
  const [dishLikes, setDishLikes] = useState<Record<string, number>>({
    'ld-1': 245,
    'ld-2': 512,
    'ld-3': 189,
    'ld-4': 310
  });
  const [likedDishes, setLikedDishes] = useState<Record<string, boolean>>({});
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);

  // Sign In states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // OTP Verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationOtp, setVerificationOtp] = useState('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('');
  const [isRealEmailSent, setIsRealEmailSent] = useState(false);
  
  // Sign Up states
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('Plot 8, Admiralty Road, Lekki Phase 1, Lagos');
  const [signUpAvatar, setSignUpAvatar] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignUpAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please drop a valid image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignUpAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle standard email/password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;
    
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Unable to authenticate inside the iframe (third-party cookies may be blocked). Please open this app in a new tab using the button in the top-right to log in.');
      }

      if (!res.ok) {
        if (res.status === 403 && data.verificationRequired) {
          // Account requires verification. Switch to OTP mode!
          setVerificationEmail(data.email);
          setSimulatedOtpCode(data.otpCode || '');
          setIsRealEmailSent(data.emailSent || false);
          setVerificationOtp('');
          setShowVerification(true);
          setError(null);
          setSuccessMsg(data.emailSent 
            ? 'Account registered but email is not verified yet. We have sent a 4-digit code to your email.'
            : 'Account registered but email is not verified yet. We have generated a 4-digit code for you.'
          );
          return;
        }
        throw new Error(data.error || 'Invalid credentials');
      }
      setSuccessMsg('Logged in successfully!');
      setTimeout(() => {
        onLoginSuccess(data.id, data);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  // Handle standard email/password Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpPhone || !signUpAddress) {
      setError('Please fill in all registration fields.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signUpName,
          email: signUpEmail,
          password: signUpPassword,
          phone: signUpPhone,
          address: signUpAddress,
          avatar: signUpAvatar
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Unable to register inside the iframe (third-party cookies may be blocked). Please open this app in a new tab using the button in the top-right to register.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Instead of instant logging-in, show the OTP verification screen
      setVerificationEmail(data.email);
      setSimulatedOtpCode(data.otpCode || '');
      setIsRealEmailSent(data.emailSent || false);
      setVerificationOtp('');
      setShowVerification(true);
      setError(null);
      setSuccessMsg(data.emailSent 
        ? `Account registered successfully! A 4-digit verification code has been dispatched to your email address.`
        : `Account registered successfully! A 4-digit verification code has been generated.`
      );
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationOtp) {
      setError('Please enter the 4-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, otp: verificationOtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccessMsg('Email verified successfully! Logging you in...');
      setTimeout(() => {
        onLoginSuccess(data.customer.id, data.customer);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend verification code.');
      }

      setSimulatedOtpCode(data.otpCode || '');
      setIsRealEmailSent(data.emailSent || false);
      setSuccessMsg(data.emailSent
        ? `A new 4-digit verification code has been successfully dispatched to ${verificationEmail}.`
        : `A new 4-digit verification code has been generated for ${verificationEmail}.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth Popup Trigger
  const handleGoogleConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      // 1. Fetch Google auth redirect URL
      const response = await fetch('/api/auth/google-url');
      if (!response.ok) {
        throw new Error('Failed to start Google Auth');
      }
      
      let urlData;
      try {
        urlData = await response.json();
      } catch (parseErr) {
        throw new Error('Unable to connect to Google Auth inside the iframe. Please open this app in a new tab to authenticate.');
      }
      const { url } = urlData;

      // 2. Open popup directly to authorization URL
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(
        url,
        'google_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
      );

      if (!popup) {
        setError('Popup was blocked. Please enable popups in your browser settings to continue.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to Google Auth server.');
      setLoading(false);
    }
  };

  // Listen for message from popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('europe-west2.run.app')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const loggedInId = event.data.customerId;
        const loggedInCustomer = event.data.customer;
        setSuccessMsg('Signed in securely with Google account!');
        setLoading(false);
        setTimeout(() => {
          if (loggedInId) {
            onLoginSuccess(loggedInId, loggedInCustomer);
          }
        }, 1000);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onLoginSuccess]);

  // Poll localStorage for Google callback token in case iframe postMessage is blocked
  useEffect(() => {
    let intervalId: any;
    if (loading) {
      intervalId = setInterval(() => {
        try {
          const storedId = localStorage.getItem('OAUTH_SUCCESS_CUSTOMER_ID');
          if (storedId) {
            localStorage.removeItem('OAUTH_SUCCESS_CUSTOMER_ID');
            const storedCustomerStr = localStorage.getItem('OAUTH_SUCCESS_CUSTOMER_DATA');
            let storedCustomer;
            if (storedCustomerStr) {
              try {
                storedCustomer = JSON.parse(storedCustomerStr);
                localStorage.removeItem('OAUTH_SUCCESS_CUSTOMER_DATA');
              } catch (e) {}
            }
            setSuccessMsg('Signed in securely with Google account (synced)!');
            setLoading(false);
            clearInterval(intervalId);
            onLoginSuccess(storedId, storedCustomer);
          }
        } catch (e) {
          console.error("Failed to read localStorage token fallback", e);
        }
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading, onLoginSuccess]);

  // Autofill helpers for easier testing
  const handleAutofillDemo = (email: string) => {
    setSignInEmail(email);
    setSignInPassword('password123');
    setActiveTab('signin');
  };

  const handleAutofillSignUp = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const names = ["Amara Okafor", "Babajide Kolawole", "Chioma Egwu", "Damilola Balogun", "Emeka Nwosu", "Femi Adebayo"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomEmail = `${randomName.toLowerCase().replace(' ', '.')}@example.com`;
    const randomPhone = `+234 80${Math.floor(10000000 + Math.random() * 90000000)}`;
    const addresses = [
      "22, Admiralty Way, Lekki Phase 1, Lagos",
      "10, Sanusi Fafunwa St, Victoria Island, Lagos",
      "5, Isaac John St, Ikeja GRA, Lagos",
      "12, Herbert Macaulay Way, Yaba, Lagos",
      "Plot 18, Awolowo Road, Ikoyi, Lagos"
    ];
    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
    const avatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
    ];

    setSignUpName(randomName);
    setSignUpEmail(randomEmail);
    setSignUpPassword('password123');
    setSignUpPhone(randomPhone);
    setSignUpAddress(randomAddress);
    setSignUpAvatar(avatars[Math.floor(Math.random() * avatars.length)]);
  };

  const handleInstantSignUpAndLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const names = ["Amara Okafor", "Babajide Kolawole", "Chioma Egwu", "Damilola Balogun", "Emeka Nwosu", "Femi Adebayo"];
      const randomName = `${names[Math.floor(Math.random() * names.length)]} (${randomSuffix})`;
      const randomEmail = `demo.user.${randomSuffix}@example.com`;
      const randomPhone = `+234 80${Math.floor(10000000 + Math.random() * 90000000)}`;
      const addresses = [
        "22, Admiralty Way, Lekki Phase 1, Lagos",
        "10, Sanusi Fafunwa St, Victoria Island, Lagos",
        "5, Isaac John St, Ikeja GRA, Lagos",
        "12, Herbert Macaulay Way, Yaba, Lagos",
        "Plot 18, Awolowo Road, Ikoyi, Lagos"
      ];
      const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: randomName,
          email: randomEmail,
          password: 'password123',
          phone: randomPhone,
          address: randomAddress
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Registration sync failed, trying local fallback...');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Automatically verify OTP for 1-Click signup!
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: randomEmail, otp: data.otpCode }),
      });
      const verifyData = await verifyRes.json();
      
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Instant verification failed');
      }

      setSuccessMsg(`Welcome ${randomName}! Direct 1-Click login and email verification success.`);
      setTimeout(() => {
        onLoginSuccess(verifyData.customer.id, verifyData.customer);
      }, 1000);
    } catch (err: any) {
      // Fallback local registry entry if server is blocked
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const newCustomer: CustomerAccount = {
        id: `customer-demo-${randomSuffix}`,
        name: `Demo User ${randomSuffix}`,
        email: `demo.user.${randomSuffix}@example.com`,
        phone: "+234 803 999 8888",
        address: "22, Admiralty Way, Lekki Phase 1, Lagos",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        balance: 0,
        walletCreated: false,
        password: "password123",
        createdAt: new Date().toISOString()
      };
      setSuccessMsg(`Registered ${newCustomer.name} locally! Welcome.`);
      setTimeout(() => {
        onLoginSuccess(newCustomer.id, newCustomer);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const landingDishes = [
    {
      id: 'ld-1',
      name: 'Spicy Seafood Okra Swallows 🍲',
      category: 'soups',
      price: 12500,
      time: '20 mins',
      rating: 4.9,
      chef: "Nkechi's Lekki Kitchen",
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      description: 'Prepared with jumbo prawns, crabs, fresh fish, minced spinach, and premium fresh okra. Prepared with local spices and served with soft pounded yam or yellow garri.'
    },
    {
      id: 'ld-2',
      name: 'Elite Lekki Smokey Jollof Rice 🍚',
      category: 'rice',
      price: 4500,
      time: '15 mins',
      rating: 5.0,
      chef: 'Mega Jollof & Grill',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80',
      description: 'Firewood-smoke-infused parboiled rice, sweet fried plantains (dodo), spiced pepper sauce, and tender peppered beef.'
    },
    {
      id: 'ld-3',
      name: 'Charcoal Roasted Peppered Suya 🥩',
      category: 'grills',
      price: 6000,
      time: '12 mins',
      rating: 4.8,
      chef: 'Alhaji Suya Spot (Ikeja)',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      description: 'Spiced tender beef flank cuts skewered, roasted slow over hot embers, finished with real yaji pepper, cabbage, and red onions.'
    },
    {
      id: 'ld-4',
      name: 'Gourmet Double Beef Burger 🍔',
      category: 'dessert',
      price: 7500,
      time: '10 mins',
      rating: 4.7,
      chef: 'Burgers & Co. Ikoyi',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      description: 'Two pure wagyu patties, sharp cheddar cheese, secret burger layout sauce, inside toasted brioche buns. Served with hand-cut fries.'
    }
  ];

  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isLiked = likedDishes[id];
    setLikedDishes(prev => ({ ...prev, [id]: !isLiked }));
    setDishLikes(prev => ({
      ...prev,
      [id]: isLiked ? prev[id] - 1 : prev[id] + 1
    }));
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#FAF6ED] via-[#FCFAF5] to-[#E2F1EB] min-h-[calc(100vh-80px)] py-8 lg:py-16">
      {/* Decorative ambient elements for realistic depth */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: GORGEOUS INTERACTIVE LANDING SHOWCASE */}
        <div className="lg:col-span-7 space-y-8 text-left py-2">
          {/* Brand Badge & Hero Title */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-black text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>🇳🇬 Lagos No. 1 Fine Dining App</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-emerald-950 leading-tight">
              Savor Lagos' Finest <br className="hidden sm:inline" />
              <span className="text-emerald-800">
                Culinary Delicacies
              </span>
            </h1>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-xl font-semibold">
              We connect you directly to elite kitchens in Lekki, Ikoyi, and Ikeja GRA. Taste real charcoal-grilled Suya, authentic Jollof, and gourmet seafood Okra delivered with hyper-speed logistics and simple cashless payments.
            </p>
          </div>

          {/* Bento-Grid Stats Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/40 border border-emerald-100/50 p-4 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-800 font-extrabold uppercase font-mono tracking-wider">Logistics</span>
                <span className="text-lg">⚡</span>
              </div>
              <h3 className="text-base font-black text-emerald-950">15 Mins Avg</h3>
              <p className="text-[10px] text-gray-500 font-semibold leading-normal">Lightning dispatch with smart heat-retaining food pouches.</p>
            </div>
            
            <div className="bg-emerald-50/40 border border-emerald-100/50 p-4 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-800 font-extrabold uppercase font-mono tracking-wider">Cashless</span>
                <span className="text-lg">💳</span>
              </div>
              <h3 className="text-base font-black text-emerald-950">Bank Transfers</h3>
              <p className="text-[10px] text-gray-500 font-semibold leading-normal">Instant virtual accounts generated for zero-friction settlement.</p>
            </div>

            <div className="bg-emerald-50/40 border border-emerald-100/50 p-4 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-800 font-extrabold uppercase font-mono tracking-wider">Quality</span>
                <span className="text-lg">🍲</span>
              </div>
              <h3 className="text-base font-black text-emerald-950">5-Star Kitchens</h3>
              <p className="text-[10px] text-gray-500 font-semibold leading-normal">Strict hygiene reviews on every chef & rider.</p>
            </div>
          </div>

          {/* Interactive Menu Board */}
          <div className="bg-white border border-gray-200/60 rounded-3xl p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-emerald-950 flex items-center gap-1.5">
                  <Utensils className="w-5 h-5 text-emerald-800" />
                  <span>Interactive Taste Playground</span>
                </h2>
                <p className="text-[11px] text-gray-400 font-semibold">Click dishes to inspect recipes or like to upvote!</p>
              </div>
              
              {/* Filter pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All 🍲' },
                  { id: 'soups', label: 'Soups 🥣' },
                  { id: 'rice', label: 'Rice 🍚' },
                  { id: 'grills', label: 'Grills 🥩' },
                  { id: 'dessert', label: 'Comfort 🍔' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    type="button"
                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-800 text-white border-emerald-800/20 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Showcase Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {landingDishes
                .filter(d => selectedCategory === 'all' || d.category === selectedCategory)
                .map(dish => {
                  const isLiked = likedDishes[dish.id];
                  const totalLikes = dishLikes[dish.id];
                  const isViewingDetails = viewingDetailsId === dish.id;

                  return (
                    <div
                      key={dish.id}
                      onClick={() => setViewingDetailsId(isViewingDetails ? null : dish.id)}
                      className={`group border rounded-2xl overflow-hidden bg-gray-50/50 hover:bg-white cursor-pointer transition-all duration-300 text-left ${
                        isViewingDetails ? 'border-emerald-700/40 ring-2 ring-emerald-700/5' : 'border-gray-200/80 hover:border-emerald-600/30'
                      }`}
                    >
                      <div className="h-32 overflow-hidden relative">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        
                        {/* Rating Tag */}
                        <span className="absolute top-2.5 left-2.5 bg-white/95 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-emerald-800 text-emerald-800" /> {dish.rating}
                        </span>

                        {/* Price Tag Overlay */}
                        <span className="absolute bottom-2.5 right-2.5 bg-emerald-900/90 text-white text-[10px] font-black px-2.5 py-1 rounded-lg">
                          ₦{dish.price.toLocaleString()}
                        </span>

                        {/* Interactive Love Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleLike(dish.id, e)}
                          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full border shadow-xs transition-all cursor-pointer ${
                            isLiked
                              ? 'bg-rose-50 border-rose-100 text-rose-600 scale-110'
                              : 'bg-white/80 backdrop-blur-xs border-gray-100 text-gray-500 hover:text-rose-600 hover:bg-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
                        </button>
                      </div>

                      <div className="p-3 text-left space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-extrabold text-emerald-950 group-hover:text-emerald-800 transition-colors line-clamp-1">
                            {dish.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold">By {dish.chef}</p>
                        
                        <div className="flex items-center gap-3 text-[9px] text-gray-500 font-semibold pt-1 border-t border-gray-100">
                          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-emerald-700" /> {dish.time}</span>
                          <span className="flex items-center gap-0.5">❤️ {totalLikes} upvotes</span>
                        </div>

                        {/* Expandable Recipe Description */}
                        {isViewingDetails && (
                          <div className="pt-2.5 text-[10px] text-gray-600 leading-relaxed border-t border-dashed border-gray-200 mt-1 space-y-1 bg-emerald-50/20 p-2 rounded-lg">
                            <p className="font-bold text-emerald-900">👩‍🍳 Kitchen Notes:</p>
                            <p>{dish.description}</p>
                            <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[9px] text-emerald-800 font-bold">
                              <span>🔥 Temp: Piping Hot</span>
                              <span>🌱 100% Organic Ingredients</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREMIUM SECURE LOG IN / REGISTER */}
        <div id="auth-form-container" className="lg:col-span-5 w-full max-w-md mx-auto transition-all duration-300">
          {/* Tab Header Card */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-black text-emerald-800 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>{showVerification ? "Secured Account Verification" : "Secured Live Customer Hub"}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-emerald-950">
              {showVerification ? "Verify Email" : "Access Account"}
            </h2>
            <p className="text-xs text-gray-400 font-semibold mt-1">
              {showVerification 
                ? "Enter the code generated for your email to continue" 
                : "Authenticate to access real, live gourmet delivery logistics"}
            </p>
          </div>

          {/* Tabs */}
          {!showVerification && (
            <div className="bg-gray-100 p-1.5 rounded-2xl flex mb-6 border border-gray-200/50">
              <button
                onClick={() => { setActiveTab('signin'); setError(null); }}
                type="button"
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setError(null); }}
                type="button"
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Register Account
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold mb-6 flex items-start gap-2.5">
              <span className="text-base leading-none">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold mb-6 flex items-start gap-2.5 animate-pulse">
              <span className="text-base leading-none">✔</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Forms Container */}
          <div className="bg-white border border-gray-200/80 shadow-xs rounded-3xl p-6 sm:p-8 space-y-6">
        {showVerification ? (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-sm font-black text-emerald-950">Verify Email Address</h3>
              <p className="text-[11px] text-gray-500 font-semibold max-w-xs mx-auto leading-relaxed">
                We have generated a 4-digit verification code to secure your email address: <span className="text-emerald-900 font-bold">{verificationEmail}</span>.
              </p>
            </div>

            {isRealEmailSent ? (
              <div className="bg-emerald-50/80 border border-emerald-200/60 p-4 rounded-2xl text-center space-y-2">
                <span className="text-xs text-emerald-800 font-extrabold flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  📩 Real-Time Email Dispatched
                </span>
                <p className="text-[11px] text-gray-600 font-semibold leading-relaxed">
                  We have successfully delivered your secure 4-digit verification code to <span className="text-emerald-950 font-bold">{verificationEmail}</span> via Brevo API. Please check your inbox and your spam folder.
                </p>
              </div>
            ) : (
              simulatedOtpCode && (
                <div className="bg-amber-50/60 border border-amber-200/50 p-4 rounded-2xl text-center space-y-1.5">
                  <span className="text-[10px] text-amber-800 font-extrabold uppercase font-mono tracking-wider block">🛠️ Developer Sandbox Fallback</span>
                  <p className="text-[11px] text-gray-500 font-semibold leading-normal max-w-xs mx-auto">
                    To enable live email dispatch, please configure your <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">BREVO_API_KEY</code> in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">.env</code>. Until then, use this code to sign in:
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="bg-emerald-800 text-emerald-50 font-mono font-black text-xs px-2.5 py-1.5 rounded-lg shadow-sm tracking-widest select-all cursor-pointer">
                      {simulatedOtpCode}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-semibold mt-0.5 leading-none">Click or double-click to select and copy</p>
                </div>
              )
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>Verification Code (OTP)</span>
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="e.g. 1234"
                value={verificationOtp}
                onChange={(e) => setVerificationOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-sm font-mono font-bold tracking-widest outline-none focus:border-emerald-600/40 text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 font-sans"
              >
                {loading ? 'Verifying security code...' : 'Confirm Verification Code 🛡️'}
              </button>

              <div className="flex justify-between items-center pt-2 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer disabled:opacity-50"
                >
                  Resend Code 🔄
                </button>
                <button
                  type="button"
                  onClick={() => { setShowVerification(false); setError(null); setSuccessMsg(null); }}
                  disabled={loading}
                  className="text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
                >
                  Back to Sign In 👈
                </button>
              </div>
            </div>
          </form>
        ) : activeTab === 'signin' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>Email Address</span>
              </label>
              <input
                id="customer-email-input"
                type="email"
                required
                placeholder="e.g. blessing.amadi@example.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-600/40 text-gray-800 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-600/40 text-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? 'Validating account credentials...' : 'Sign In with Email 🔓'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            {/* Custom Image Upload Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Image className="w-3.5 h-3.5 text-gray-400" />
                <span>Profile Picture / Avatar</span>
              </label>

              {signUpAvatar ? (
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-600/20 bg-emerald-50 shrink-0">
                    <img src={signUpAvatar} alt="Profile Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[11px] font-black text-gray-800 leading-tight">Image Uploaded Successfully</p>
                    <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Ready to use for registration</p>
                    <button
                      type="button"
                      onClick={() => setSignUpAvatar(null)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-100 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Image</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  id="avatar-drop-zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('avatar-file-upload')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="file"
                    id="avatar-file-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">Drag & drop your photo here</p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">or click to browse from device (max 2MB)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chinedu Okafor"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-600/40 text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. chinedu@example.com"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-600/40 text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-600/40 text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. +234 803 999 8888"
                value={signUpPhone}
                onChange={(e) => setSignUpPhone(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-600/40 text-gray-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={handleAutofillSignUp}
                disabled={loading}
                className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 rounded-xl text-[10px] font-bold text-emerald-800 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>⚡ Autofill Random Profile</span>
              </button>
              <button
                type="button"
                onClick={handleInstantSignUpAndLogin}
                disabled={loading}
                className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[10px] font-bold text-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🚀 Instant 1-Click Sign Up</span>
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl flex items-center gap-2 mt-2">
              <span className="text-base">💳</span>
              <p className="text-[10px] text-emerald-800 font-bold leading-tight">
                Secure Wallet: Activate your 1-click personal virtual wallet upon logging in to make seamless cashless payments!
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              {loading ? 'Creating your live account...' : 'Create Account & Login ✨'}
            </button>
          </form>
        )}

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Or authenticate via</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Google Authentication Button */}
        <button
          onClick={handleGoogleConnect}
          disabled={loading}
          type="button"
          className="w-full py-3.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-extrabold text-gray-700 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.28c1.92,-1.77 3.03,-4.38 3.03,-7.4c0,-0.33 -0.03,-0.67 -0.08,-1H21.35z" fill="#4285F4" />
              <path d="M12,20.5c2.3,0 4.23,-0.76 5.64,-2.1l-3.28,-2.6c-0.9,0.6 -2.07,0.97 -3.36,0.97 -2.59,0 -4.79,-1.75 -5.57,-4.1H2.05v2.7C3.51,18.33 7.48,20.5 12,20.5z" fill="#34A853" />
              <path d="M6.43,12.77c-0.2,-0.6 -0.31,-1.24 -0.31,-1.9c0,-0.66 0.11,-1.3 0.31,-1.9V6.27H2.05c-0.67,1.34 -1.05,2.85 -1.05,4.46s0.38,3.12 1.05,4.46l4.38,-3.42z" fill="#FBBC05" />
              <path d="M12,5.13c1.25,0 2.37,0.43 3.25,1.27l2.43,-2.43C16.21,2.54 14.28,1.7 12,1.7C7.48,1.7 3.51,3.87 2.05,7.77l4.38,3.42c0.78,-2.35 2.98,-4.06 5.57,-4.06z" fill="#EA4335" />
            </g>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>

      {/* Demo helper card */}
      <div className="mt-8 bg-gray-50 border border-gray-200/60 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Fast Live Testing Portal</h4>
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
          This is a live database. You can instantly register a new custom account or click a pre-loaded account below to fill the login form with standard password <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800">password123</code>:
        </p>
        <div className="grid grid-cols-1 gap-2 pt-1.5">
          {customers.slice(0, 3).map((cust) => (
            <button
              type="button"
              key={cust.id}
              onClick={() => handleAutofillDemo(cust.email)}
              className="w-full bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-xl px-3 py-2 text-left text-[10px] flex items-center justify-between transition-all cursor-pointer font-semibold text-gray-700"
            >
              <div>
                <span className="block font-bold text-gray-800">{cust.name}</span>
                <span className="block text-[9px] text-gray-400 mt-0.5">{cust.email}</span>
              </div>
              <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Select</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>
</div>
  );
}
