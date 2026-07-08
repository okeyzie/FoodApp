import { Restaurant, MenuItem, Rider, Review, CustomerAccount, AdminAccount } from './types.js';

export const initialRestaurants: Restaurant[] = [
  {
    id: "rest-1",
    name: "Burger & Co.",
    description: "Flame-grilled premium beef burgers, crispy sides, and thick shakes.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    cuisine: "Burgers & Fast Food",
    rating: 4.7,
    reviewsCount: 124,
    deliveryTime: 25,
    distance: 1.8,
    deliveryFee: 450,
    address: "12, Admiralty Way, Lekki Phase 1, Lagos",
    lat: 6.4350,
    lng: 3.4580,
    isApproved: true,
    ownerId: "owner-1",
    operatingHours: "09:00 AM - 10:00 PM",
    contactNumber: "+234 812 345 6789"
  },
  {
    id: "rest-2",
    name: "Sushi Zen",
    description: "Authentic Japanese sushi, sashimi, ramen, and fresh tempura.",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
    cuisine: "Japanese & Sushi",
    rating: 4.9,
    reviewsCount: 86,
    deliveryTime: 35,
    distance: 3.2,
    deliveryFee: 600,
    address: "24, Sanusi Fafunwa St, Victoria Island, Lagos",
    lat: 6.4280,
    lng: 3.4350,
    isApproved: true,
    ownerId: "owner-2",
    operatingHours: "11:00 AM - 09:30 PM",
    contactNumber: "+234 809 876 5432"
  },
  {
    id: "rest-3",
    name: "La Piazza",
    description: "Woodfired neapolitan pizzas, handmade pastas, and Italian desserts.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    cuisine: "Italian & Pizza",
    rating: 4.5,
    reviewsCount: 198,
    deliveryTime: 30,
    distance: 2.5,
    deliveryFee: 500,
    address: "15, Isaac John St, Ikeja GRA, Lagos",
    lat: 6.5820,
    lng: 3.3540,
    isApproved: true,
    ownerId: "owner-3",
    operatingHours: "10:00 AM - 11:00 PM",
    contactNumber: "+234 703 111 2222"
  },
  {
    id: "rest-4",
    name: "Spicy Delight",
    description: "The best local Nigerian delicacies, Jollof, Suya, and hot soups.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
    cuisine: "Nigerian Traditional",
    rating: 4.8,
    reviewsCount: 312,
    deliveryTime: 20,
    distance: 1.2,
    deliveryFee: 300,
    address: "5, Herbert Macaulay Way, Yaba, Lagos",
    lat: 6.5180,
    lng: 3.3750,
    isApproved: true,
    ownerId: "owner-4",
    operatingHours: "08:00 AM - 09:00 PM",
    contactNumber: "+234 802 444 5555"
  }
];

export const initialMenuItems: MenuItem[] = [
  // Burger & Co
  {
    id: "menu-1",
    restaurantId: "rest-1",
    name: "Double Cheese Smasher",
    description: "Two smashed beef patties, cheddar cheese, burger sauce, pickles, toasted brioche bun.",
    price: 4500,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    category: "Burgers",
    isAvailable: true,
    addOns: [
      { name: "Extra Cheddar", price: 500 },
      { name: "Crispy Bacon", price: 800 },
      { name: "Caramelized Onions", price: 300 }
    ]
  },
  {
    id: "menu-2",
    restaurantId: "rest-1",
    name: "Spicy Nashville Chicken Burger",
    description: "Buttermilk fried chicken dipped in spicy oil, slaw, comeback sauce, pickles.",
    price: 4200,
    image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
    category: "Burgers",
    isAvailable: true,
    addOns: [
      { name: "Extra Cheese", price: 500 },
      { name: "Sliced Jalapenos", price: 200 }
    ]
  },
  {
    id: "menu-3",
    restaurantId: "rest-1",
    name: "Sweet Potato Waffle Fries",
    description: "Crispy sweet potato fries served with chipotle mayo dipping sauce.",
    price: 1800,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    category: "Sides",
    isAvailable: true,
    addOns: [
      { name: "Cheese Sauce Dip", price: 400 },
      { name: "Truffle Oil", price: 600 }
    ]
  },
  {
    id: "menu-4",
    restaurantId: "rest-1",
    name: "Choco-Fudge Thickshake",
    description: "Creamy vanilla soft serve blended with dark Belgian chocolate fudge syrup.",
    price: 2200,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    category: "Drinks",
    isAvailable: true,
    addOns: [
      { name: "Whipped Cream", price: 200 },
      { name: "Crushed Oreos", price: 350 }
    ]
  },

  // Sushi Zen
  {
    id: "menu-5",
    restaurantId: "rest-2",
    name: "Dragon Maki Roll (8pcs)",
    description: "Shrimp tempura, cucumber inside, topped with avocado, unagi eel, eel sauce, sesame seeds.",
    price: 9500,
    image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&q=80",
    category: "Sushi Rolls",
    isAvailable: true,
    addOns: [
      { name: "Extra Wasabi & Ginger", price: 400 },
      { name: "Spicy Mayo Drizzle", price: 200 }
    ]
  },
  {
    id: "menu-6",
    restaurantId: "rest-2",
    name: "Spicy Salmon Crunch Roll",
    description: "Fresh salmon, green onion, spicy mayo, rolled in tempura crunch.",
    price: 8000,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
    category: "Sushi Rolls",
    isAvailable: true,
    addOns: [
      { name: "Tobiko (Fish Eggs)", price: 800 }
    ]
  },
  {
    id: "menu-7",
    restaurantId: "rest-2",
    name: "Shoyu Ramen Classic",
    description: "Slow-cooked chicken-pork broth, ramen noodles, chashu pork belly, soft-boiled egg, nori, bamboo shoots.",
    price: 7500,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
    category: "Main Bowls",
    isAvailable: true,
    addOns: [
      { name: "Extra Chashu Pork", price: 1500 },
      { name: "Extra Ajitsuke Tamago (Egg)", price: 600 }
    ]
  },

  // La Piazza
  {
    id: "menu-8",
    restaurantId: "rest-3",
    name: "Diavola Pizza",
    description: "San Marzano tomato base, fresh fior di latte mozzarella, spicy Italian salami, chili flakes, basil.",
    price: 6500,
    image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80",
    category: "Woodfired Pizza",
    isAvailable: true,
    addOns: [
      { name: "Extra Mozzarella", price: 800 },
      { name: "Truffle Honey Drizzle", price: 600 },
      { name: "Sliced Olives", price: 300 }
    ]
  },
  {
    id: "menu-9",
    restaurantId: "rest-3",
    name: "Creamy Fettuccine Carbonara",
    description: "Tagliatelle pasta tossed with crispy pancetta, egg yolk, pecorino romano, cracked black pepper.",
    price: 5800,
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80",
    category: "Handmade Pasta",
    isAvailable: true,
    addOns: [
      { name: "Grilled Chicken Strips", price: 1200 },
      { name: "Sautéed Mushrooms", price: 800 }
    ]
  },

  // Spicy Delight
  {
    id: "menu-10",
    restaurantId: "rest-4",
    name: "Signature Jollof Rice Feast",
    description: "Rich, smoky firewood Jollof rice, served with sweet plantain dodo and grilled quarter chicken.",
    price: 3500,
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=600&q=80",
    category: "Rice Dishes",
    isAvailable: true,
    addOns: [
      { name: "Extra Dodo (Plantain)", price: 400 },
      { name: "Assorted Beef Piece", price: 800 },
      { name: "Moin Moin Cup", price: 600 }
    ]
  },
  {
    id: "menu-11",
    restaurantId: "rest-4",
    name: "Spicy Beef Suya platter",
    description: "Tender, thinly sliced beef marinated in traditional spicy peanut Yaji spice, grilled over coal, served with onions & tomatoes.",
    price: 3000,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    category: "Grills",
    isAvailable: true,
    addOns: [
      { name: "Extra Suya Spice (Yaji)", price: 200 },
      { name: "Extra Grilled Onions", price: 150 }
    ]
  },
  {
    id: "menu-12",
    restaurantId: "rest-4",
    name: "Fisherman's Pepper Soup",
    description: "Hot, aromatic local broth slow-cooked with fresh catfish, local scent leaf, and traditional spices.",
    price: 4500,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80",
    category: "Soups",
    isAvailable: true,
    addOns: [
      { name: "Yam Cubes", price: 400 }
    ]
  }
];

export const initialRiders: Rider[] = [
  {
    id: "rider-1",
    name: "Alex Rider",
    phone: "+234 811 222 3333",
    status: "online",
    vehicleType: "motorcycle",
    lat: 6.5200,
    lng: 3.3700,
    earnings: 4200,
    balance: 4200,
    rating: 4.8,
    deliveriesCount: 14
  },
  {
    id: "rider-2",
    name: "Daniel Rider",
    phone: "+234 815 555 6666",
    status: "online",
    vehicleType: "bicycle",
    lat: 6.5350,
    lng: 3.3800,
    earnings: 1500,
    balance: 1500,
    rating: 4.6,
    deliveriesCount: 5
  },
  {
    id: "rider-3",
    name: "Sheddy Rider",
    phone: "+234 802 888 9999",
    status: "offline",
    vehicleType: "car",
    lat: 6.4500,
    lng: 3.4200,
    earnings: 0,
    balance: 0,
    rating: 5.0,
    deliveriesCount: 0
  }
];

export const initialReviews: Review[] = [
  {
    id: "rev-1",
    restaurantId: "rest-1",
    orderId: "ord-mock-1",
    customerName: "Blessing Amadi",
    rating: 5,
    comment: "Absolutely mouth-watering beef burger! Smashed perfectly, cheese is melted nicely. Delivery was incredibly fast too.",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: "rev-2",
    restaurantId: "rest-4",
    orderId: "ord-mock-2",
    customerName: "Chinedu O.",
    rating: 4,
    comment: "The Jollof Rice has that authentic smoky party taste. Suya was a bit spicy but delicious.",
    createdAt: new Date(Date.now() - 10 * 3600000).toISOString()
  }
];

export const initialCustomers: CustomerAccount[] = [
  {
    id: "customer-1",
    name: "Blessing Amadi",
    email: "blessing.amadi@example.com",
    phone: "+234 803 111 2222",
    address: "Plot 8, Admiralty Road, Lekki Phase 1, Lagos",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    balance: 25000,
    password: "password123",
    createdAt: new Date().toISOString()
  },
  {
    id: "customer-2",
    name: "Tunde Bakare",
    email: "tunde.bakare@example.com",
    phone: "+234 815 444 5555",
    address: "15, Isaac John St, Ikeja GRA, Lagos",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    balance: 45000,
    password: "password123",
    createdAt: new Date().toISOString()
  },
  {
    id: "customer-3",
    name: "Olumide Johnson",
    email: "olumide.j@example.com",
    phone: "+234 901 222 3333",
    address: "5, Herbert Macaulay Way, Yaba, Lagos",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    balance: 12000,
    password: "password123",
    createdAt: new Date().toISOString()
  }
];

export const initialAdmins: AdminAccount[] = [
  {
    id: "admin-1",
    name: "System Administrator",
    email: "admin@foodhub.com",
    password: "password123",
    createdAt: new Date().toISOString()
  }
];
