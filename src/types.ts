export interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string;
  rating: number;
  reviewsCount: number;
  deliveryTime: number; // in minutes
  distance: number; // in km
  deliveryFee: number;
  address: string;
  lat: number;
  lng: number;
  isApproved: boolean;
  ownerId: string;
  operatingHours: string;
  contactNumber: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  addOns: { name: string; price: number }[];
}

export type OrderStatus =
  | 'Order Received'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Rider Assigned'
  | 'Rider En Route'
  | 'Arriving Soon'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'Card' | 'Bank Transfer' | 'Wallet' | 'Apple Pay' | 'Google Pay' | 'Cash on Delivery';
export type PaymentProvider = 'Paystack' | 'Flutterwave' | 'Stripe' | 'COD';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedAddOns: { name: string; price: number }[];
  specialInstructions?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  riderTip: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  deliveryAddress: string;
  deliveryNotes?: string;
  pickupOption: 'delivery' | 'pickup';
  createdAt: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderLat?: number;
  riderLng?: number;
  estimatedDeliveryTime?: string; // in minutes or ISO string
  feedback?: {
    restaurantRating?: number;
    riderRating?: number;
    comment?: string;
  };
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  status: 'online' | 'offline';
  vehicleType: 'bicycle' | 'motorcycle' | 'car';
  lat: number;
  lng: number;
  earnings: number;
  balance: number;
  rating: number;
  deliveriesCount: number;
  currentOrderId?: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  sender: 'customer' | 'rider';
  text: string;
  timestamp: string;
}

export interface Review {
  id: string;
  restaurantId: string;
  orderId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  balance: number; // For virtual wallet payment gateway support
  walletCreated?: boolean; // Track if the customer has created/linked their wallet
  password?: string; // Optional password for email/password auth
  googleId?: string; // Optional google unique id for Google Auth
  isGoogleAuth?: boolean; // True if account was created/connected via Google OAuth
  createdAt: string;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: string;
}

export interface AppState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  riders: Rider[];
  messages: ChatMessage[];
  reviews: Review[];
  customers: CustomerAccount[];
  admins?: AdminAccount[];
}
