import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { AppState, Restaurant, MenuItem, Order, Rider, ChatMessage, Review, OrderStatus, CustomerAccount, AdminAccount } from "./src/types.js";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db_store.json");

// Seed data
const initialRestaurants: Restaurant[] = [
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

const initialMenuItems: MenuItem[] = [
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

const initialRiders: Rider[] = [
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

const initialReviews: Review[] = [
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

const initialCustomers: CustomerAccount[] = [
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

const initialAdmins: AdminAccount[] = [
  {
    id: "admin-1",
    name: "System Administrator",
    email: "admin@foodhub.com",
    password: "password123",
    createdAt: new Date().toISOString()
  }
];

function loadDatabase(): AppState {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const loaded = JSON.parse(raw);
      if (!loaded.customers || !Array.isArray(loaded.customers)) {
        loaded.customers = initialCustomers;
      } else {
        // Guarantee passwords for pre-existing initial accounts
        loaded.customers.forEach((c: any) => {
          if (!c.password && !c.isGoogleAuth) {
            c.password = "password123";
          }
        });
      }
      if (!loaded.admins || !Array.isArray(loaded.admins)) {
        loaded.admins = initialAdmins;
      }
      return loaded;
    } catch (e) {
      console.error("Error reading database file, resetting to initial", e);
    }
  }
  const defaultState: AppState = {
    restaurants: initialRestaurants,
    menuItems: initialMenuItems,
    riders: initialRiders,
    orders: [],
    messages: [],
    reviews: initialReviews,
    customers: initialCustomers,
    admins: initialAdmins
  };
  saveDatabase(defaultState);
  return defaultState;
}

function saveDatabase(state: AppState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing database file", e);
  }
}

// Initialize db
let db = loadDatabase();

// Middleware
app.use(express.json());

// API Endpoints
app.get("/api/state", (req, res) => {
  res.json(db);
});

app.post("/api/reset", (req, res) => {
  db = {
    restaurants: JSON.parse(JSON.stringify(initialRestaurants)),
    menuItems: JSON.parse(JSON.stringify(initialMenuItems)),
    riders: JSON.parse(JSON.stringify(initialRiders)),
    orders: [],
    messages: [],
    reviews: JSON.parse(JSON.stringify(initialReviews)),
    customers: JSON.parse(JSON.stringify(initialCustomers)),
    admins: JSON.parse(JSON.stringify(initialAdmins))
  };
  saveDatabase(db);
  res.json({ message: "Database reset to initial state", state: db });
});

// RESTAURANT APIS
app.post("/api/restaurants", (req, res) => {
  const newRestaurant: Restaurant = {
    id: `rest-${Date.now()}`,
    name: req.body.name || "Untitled Restaurant",
    description: req.body.description || "",
    image: req.body.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    cuisine: req.body.cuisine || "Other",
    rating: 5.0,
    reviewsCount: 0,
    deliveryTime: req.body.deliveryTime || 30,
    distance: parseFloat((Math.random() * 4 + 1).toFixed(1)),
    deliveryFee: req.body.deliveryFee || 500,
    address: req.body.address || "",
    lat: req.body.lat || 6.5244 + (Math.random() * 0.04 - 0.02),
    lng: req.body.lng || 3.3792 + (Math.random() * 0.04 - 0.02),
    isApproved: req.body.isApproved || false, // KYC Approval workflow
    ownerId: req.body.ownerId || "owner-custom",
    operatingHours: req.body.operatingHours || "09:00 AM - 09:00 PM",
    contactNumber: req.body.contactNumber || ""
  };
  db.restaurants.push(newRestaurant);
  saveDatabase(db);
  res.status(201).json(newRestaurant);
});

app.put("/api/restaurants/:id", (req, res) => {
  const index = db.restaurants.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    db.restaurants[index] = { ...db.restaurants[index], ...req.body };
    saveDatabase(db);
    res.json(db.restaurants[index]);
  } else {
    res.status(404).json({ error: "Restaurant not found" });
  }
});

// MENU APIS
app.post("/api/restaurants/:restId/menu", (req, res) => {
  const newItem: MenuItem = {
    id: `menu-${Date.now()}`,
    restaurantId: req.params.restId,
    name: req.body.name || "Unnamed Item",
    description: req.body.description || "",
    price: req.body.price || 0,
    image: req.body.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    category: req.body.category || "Main",
    isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
    addOns: req.body.addOns || []
  };
  db.menuItems.push(newItem);
  saveDatabase(db);
  res.status(201).json(newItem);
});

app.put("/api/menu/:id", (req, res) => {
  const index = db.menuItems.findIndex(m => m.id === req.params.id);
  if (index !== -1) {
    db.menuItems[index] = { ...db.menuItems[index], ...req.body };
    saveDatabase(db);
    res.json(db.menuItems[index]);
  } else {
    res.status(404).json({ error: "Menu item not found" });
  }
});

app.delete("/api/menu/:id", (req, res) => {
  const index = db.menuItems.findIndex(m => m.id === req.params.id);
  if (index !== -1) {
    const deleted = db.menuItems.splice(index, 1);
    saveDatabase(db);
    res.json({ message: "Menu item deleted", item: deleted[0] });
  } else {
    res.status(404).json({ error: "Menu item not found" });
  }
});

// ORDER APIS & PAYMENTS
app.post("/api/orders", (req, res) => {
  const orderId = `ord-${Math.floor(100000 + Math.random() * 900000)}`;
  const subtotal = req.body.items.reduce((sum: number, item: any) => {
    const itemAddons = item.selectedAddOns?.reduce((s: number, a: any) => s + a.price, 0) || 0;
    return sum + (item.price + itemAddons) * item.quantity;
  }, 0);
  const tax = Math.round(subtotal * 0.075); // 7.5% VAT
  const deliveryFee = req.body.pickupOption === "pickup" ? 0 : (req.body.deliveryFee || 500);
  const riderTip = req.body.riderTip || 0;
  const total = subtotal + tax + deliveryFee + riderTip;

  const newOrder: Order = {
    id: orderId,
    customerId: req.body.customerId || "customer-1",
    customerName: req.body.customerName || "Simulated User",
    customerPhone: req.body.customerPhone || "+234 800 000 0000",
    restaurantId: req.body.restaurantId,
    restaurantName: req.body.restaurantName,
    items: req.body.items,
    subtotal,
    tax,
    deliveryFee,
    riderTip,
    total,
    status: "Order Received",
    paymentMethod: req.body.paymentMethod || "Card",
    paymentProvider: req.body.paymentProvider || "Paystack",
    paymentStatus: req.body.paymentMethod === "Cash on Delivery" ? "Pending" : "Pending", // Set as pending until simulated webhook/completion API is called
    deliveryAddress: req.body.deliveryAddress || "Home Address",
    deliveryNotes: req.body.deliveryNotes || "",
    pickupOption: req.body.pickupOption || "delivery",
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);
  saveDatabase(db);
  res.status(201).json(newOrder);
});

// Call this to simulate successful Paystack/Flutterwave payments
app.post("/api/orders/:id/pay", (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (order) {
    order.paymentStatus = "Paid";
    order.paymentProvider = req.body.paymentProvider || order.paymentProvider;
    saveDatabase(db);
    res.json(order);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

app.put("/api/orders/:id/status", (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (order) {
    const oldStatus = order.status;
    const newStatus: OrderStatus = req.body.status;
    order.status = newStatus;

    // Simulate real-time interactions based on status updates
    if (newStatus === "Preparing") {
      order.estimatedDeliveryTime = "25 mins";
    } else if (newStatus === "Ready for Pickup") {
      order.estimatedDeliveryTime = "15 mins";
      
      // Auto-assign an online rider if rider is not already assigned and is delivery
      if (order.pickupOption === "delivery" && !order.riderId) {
        const availableRider = db.riders.find(r => r.status === "online" && !r.currentOrderId);
        if (availableRider) {
          order.riderId = availableRider.id;
          order.riderName = availableRider.name;
          order.riderPhone = availableRider.phone;
          order.riderLat = availableRider.lat;
          order.riderLng = availableRider.lng;
          order.status = "Rider Assigned";
          availableRider.currentOrderId = order.id;
        }
      }
    } else if (newStatus === "Rider En Route") {
      order.estimatedDeliveryTime = "10 mins";
    } else if (newStatus === "Arriving Soon") {
      order.estimatedDeliveryTime = "3 mins";
    } else if (newStatus === "Delivered") {
      order.estimatedDeliveryTime = "0 mins";
      order.paymentStatus = "Paid"; // Delievered order is paid

      // Add earnings to rider if rider is assigned
      if (order.riderId) {
        const rider = db.riders.find(r => r.id === order.riderId);
        if (rider) {
          const riderPay = Math.round(order.deliveryFee * 0.8) + order.riderTip;
          rider.earnings += riderPay;
          rider.balance += riderPay;
          rider.deliveriesCount += 1;
          rider.currentOrderId = undefined;
        }
      }
    }

    saveDatabase(db);
    res.json(order);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

// Assign a Rider to an Order explicitly (Rider Dashboard / Admin Console)
app.put("/api/orders/:id/assign-rider", (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  const rider = db.riders.find(r => r.id === req.body.riderId);

  if (order && rider) {
    // Unassign old rider if any
    if (order.riderId) {
      const oldRider = db.riders.find(r => r.id === order.riderId);
      if (oldRider) oldRider.currentOrderId = undefined;
    }

    order.riderId = rider.id;
    order.riderName = rider.name;
    order.riderPhone = rider.phone;
    order.riderLat = rider.lat;
    order.riderLng = rider.lng;
    order.status = "Rider Assigned";
    
    rider.currentOrderId = order.id;

    saveDatabase(db);
    res.json({ order, rider });
  } else {
    res.status(404).json({ error: "Order or Rider not found" });
  }
});

// Update rider details (coords, status)
app.put("/api/riders/:id", (req, res) => {
  const rider = db.riders.find(r => r.id === req.params.id);
  if (rider) {
    if (req.body.status) rider.status = req.body.status;
    if (req.body.lat) {
      rider.lat = req.body.lat;
      // sync with active order
      if (rider.currentOrderId) {
        const order = db.orders.find(o => o.id === rider.currentOrderId);
        if (order) {
          order.riderLat = req.body.lat;
        }
      }
    }
    if (req.body.lng) {
      rider.lng = req.body.lng;
      // sync with active order
      if (rider.currentOrderId) {
        const order = db.orders.find(o => o.id === rider.currentOrderId);
        if (order) {
          order.riderLng = req.body.lng;
        }
      }
    }
    if (req.body.balance !== undefined) rider.balance = req.body.balance;
    saveDatabase(db);
    res.json(rider);
  } else {
    res.status(404).json({ error: "Rider not found" });
  }
});

// CUSTOMER ACCOUNTS APIS
app.post("/api/customers", (req, res) => {
  const newCustomer: CustomerAccount = {
    id: `customer-${Date.now()}`,
    name: req.body.name || "Anonymous Customer",
    email: req.body.email || "",
    phone: req.body.phone || "+234 800 000 0000",
    address: req.body.address || "Lagos, Nigeria",
    avatar: req.body.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
    balance: req.body.balance !== undefined ? parseFloat(req.body.balance) : 10000,
    createdAt: new Date().toISOString()
  };
  db.customers.push(newCustomer);
  saveDatabase(db);
  res.status(201).json(newCustomer);
});

app.put("/api/customers/:id", (req, res) => {
  const customer = db.customers.find(c => c.id === req.params.id);
  if (customer) {
    if (req.body.name !== undefined) customer.name = req.body.name;
    if (req.body.email !== undefined) customer.email = req.body.email;
    if (req.body.phone !== undefined) customer.phone = req.body.phone;
    if (req.body.address !== undefined) customer.address = req.body.address;
    if (req.body.balance !== undefined) customer.balance = parseFloat(req.body.balance);
    saveDatabase(db);
    res.json(customer);
  } else {
    res.status(404).json({ error: "Customer not found" });
  }
});

// ADMIN CREATING RIDERS API
app.post("/api/riders", (req, res) => {
  const newRider: Rider = {
    id: `rider-${Date.now()}`,
    name: req.body.name || "New Rider",
    phone: req.body.phone || "+234 811 000 0000",
    status: req.body.status || "online",
    vehicleType: req.body.vehicleType || "motorcycle",
    lat: 6.4280 + (Math.random() * 0.04 - 0.02),
    lng: 3.4350 + (Math.random() * 0.04 - 0.02),
    earnings: 0,
    balance: 0,
    rating: 5.0,
    deliveriesCount: 0
  };
  db.riders.push(newRider);
  saveDatabase(db);
  res.status(201).json(newRider);
});

// Send message
app.post("/api/messages", (req, res) => {
  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    orderId: req.body.orderId,
    sender: req.body.sender, // 'customer' | 'rider'
    text: req.body.text,
    timestamp: new Date().toISOString()
  };
  db.messages.push(newMessage);
  saveDatabase(db);
  res.status(201).json(newMessage);
});

// Leave Review
app.post("/api/orders/:id/rate", (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (order) {
    order.feedback = {
      restaurantRating: req.body.restaurantRating,
      riderRating: req.body.riderRating,
      comment: req.body.comment || ""
    };

    // Add to reviews list
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      restaurantId: order.restaurantId,
      orderId: order.id,
      customerName: order.customerName,
      rating: req.body.restaurantRating,
      comment: req.body.comment || "Reviewed this meal",
      createdAt: new Date().toISOString()
    };
    db.reviews.push(newReview);

    // Recompute restaurant rating
    const restReviews = db.reviews.filter(r => r.restaurantId === order.restaurantId);
    const rest = db.restaurants.find(r => r.id === order.restaurantId);
    if (rest) {
      rest.reviewsCount = restReviews.length;
      const sum = restReviews.reduce((s, r) => s + r.rating, 0);
      rest.rating = parseFloat((sum / restReviews.length).toFixed(1));
    }

    // Recompute rider rating
    if (order.riderId && req.body.riderRating) {
      const rider = db.riders.find(r => r.id === order.riderId);
      if (rider) {
        // Average rating based on deliveries count
        rider.rating = parseFloat(((rider.rating * (rider.deliveriesCount - 1) + req.body.riderRating) / rider.deliveriesCount).toFixed(1));
      }
    }

    saveDatabase(db);
    res.json(order);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

// ============================================================================
// SECURE AUTHENTICATION & GOOGLE OAUTH APIS
// ============================================================================

// 1. Email and Password Registration
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, phone, address } = req.body;
  if (!email || !password || !name || !phone || !address) {
    return res.status(400).json({ error: "All registration fields (email, password, name, phone, address) are required." });
  }
  const trimmedEmail = email.trim().toLowerCase();
  const existing = db.customers.find(c => c.email.toLowerCase() === trimmedEmail);
  if (existing) {
    return res.status(400).json({ error: "This email address is already registered." });
  }
  
  const newCustomer: CustomerAccount = {
    id: `customer-${Date.now()}`,
    name,
    email: trimmedEmail,
    phone,
    address,
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
    balance: 20000, // starting balance ₦20,000 as a welcome gift for ordering
    password, // stored securely in db_store.json
    createdAt: new Date().toISOString()
  };
  
  db.customers.push(newCustomer);
  saveDatabase(db);
  res.status(201).json(newCustomer);
});

// 2. Email and Password Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const trimmedEmail = email.trim().toLowerCase();
  const customer = db.customers.find(c => c.email.toLowerCase() === trimmedEmail && c.password === password);
  if (!customer) {
    return res.status(400).json({ error: "Invalid email or password." });
  }
  res.json(customer);
});

// 2b. Admin Registration
app.post("/api/admin/register", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "All admin registration fields (email, password, name) are required." });
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!db.admins) {
    db.admins = [];
  }
  const existing = db.admins.find(a => a.email.toLowerCase() === trimmedEmail);
  if (existing) {
    return res.status(400).json({ error: "An administrator with this email already exists." });
  }

  const newAdmin: AdminAccount = {
    id: `admin-${Date.now()}`,
    name,
    email: trimmedEmail,
    password,
    createdAt: new Date().toISOString()
  };

  db.admins.push(newAdmin);
  saveDatabase(db);
  res.status(201).json(newAdmin);
});

// 2c. Admin Login
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Admin email and password are required." });
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!db.admins) {
    db.admins = [];
  }
  const admin = db.admins.find(a => a.email.toLowerCase() === trimmedEmail && a.password === password);
  if (!admin) {
    return res.status(400).json({ error: "Invalid admin email or password." });
  }
  res.json(admin);
});

// 3. Get Google OAuth URL (Returns Google's or the local simulation URL)
app.get("/api/auth/google-url", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${origin}/auth/callback`;

  if (clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account'
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  } else {
    // Return simulated beautiful Google Login page URL
    res.json({ url: `${origin}/api/auth/google-sim` });
  }
});

// 4. Simulated Interactive Google Account Chooser UI
app.get("/api/auth/google-sim", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Sign in with Google</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Roboto', sans-serif; }
        </style>
      </head>
      <body class="bg-[#F8F9FA] flex flex-col justify-between min-h-screen">
        <div class="flex-grow flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <!-- Google Logo -->
            <div class="flex justify-center mb-6">
              <svg class="h-8" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.28c1.92,-1.77 3.03,-4.38 3.03,-7.4c0,-0.33 -0.03,-0.67 -0.08,-1H21.35z" fill="#4285F4" />
                  <path d="M12,20.5c2.3,0 4.23,-0.76 5.64,-2.1l-3.28,-2.6c-0.9,0.6 -2.07,0.97 -3.36,0.97 -2.59,0 -4.79,-1.75 -5.57,-4.1H2.05v2.7C3.51,18.33 7.48,20.5 12,20.5z" fill="#34A853" />
                  <path d="M6.43,12.77c-0.2,-0.6 -0.31,-1.24 -0.31,-1.9c0,-0.66 0.11,-1.3 0.31,-1.9V6.27H2.05c-0.67,1.34 -1.05,2.85 -1.05,4.46s0.38,3.12 1.05,4.46l4.38,-3.42z" fill="#FBBC05" />
                  <path d="M12,5.13c1.25,0 2.37,0.43 3.25,1.27l2.43,-2.43C16.21,2.54 14.28,1.7 12,1.7C7.48,1.7 3.51,3.87 2.05,7.77l4.38,3.42c0.78,-2.35 2.98,-4.06 5.57,-4.06z" fill="#EA4335" />
                </g>
              </svg>
            </div>

            <h2 class="text-xl font-medium text-center text-[#202124] mb-2">Choose an account</h2>
            <p class="text-sm text-center text-[#5F6368] mb-8">to continue to <strong class="text-gray-800">FoodHub Lagos</strong></p>

            <!-- Account List -->
            <div class="space-y-3 mb-6">
              <!-- Account 1 -->
              <button onclick="selectAccount('Blessing Amadi', 'blessing.amadi@example.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80')" class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div class="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" class="w-8 h-8 rounded-full">
                  <div>
                    <div class="text-sm font-medium text-[#3C4043]">Blessing Amadi</div>
                    <div class="text-xs text-[#5F6368]">blessing.amadi@example.com</div>
                  </div>
                </div>
                <div class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Live Login</div>
              </button>

              <!-- Account 2 -->
              <button onclick="selectAccount('Tunde Bakare', 'tunde.bakare@example.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80')" class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div class="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" class="w-8 h-8 rounded-full">
                  <div>
                    <div class="text-sm font-medium text-[#3C4043]">Tunde Bakare</div>
                    <div class="text-xs text-[#5F6368]">tunde.bakare@example.com</div>
                  </div>
                </div>
                <div class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Live Login</div>
              </button>

              <!-- Custom Account option -->
              <div class="border-t border-gray-100 my-4 pt-4">
                <p class="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Or register with a new Google Account</p>
                <div class="space-y-2">
                  <input type="text" id="customName" placeholder="Full Name (e.g. John Doe)" class="w-full text-xs border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500">
                  <input type="email" id="customEmail" placeholder="Gmail Address (e.g. johndoe@gmail.com)" class="w-full text-xs border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500">
                  <button onclick="useCustom()" class="w-full py-2 bg-[#4285F4] hover:bg-[#357AE8] text-white text-xs font-medium rounded transition-colors">
                    Continue to FoodHub Lagos
                  </button>
                </div>
              </div>
            </div>

            <p class="text-xs text-gray-500 leading-relaxed text-center">
              Google will securely share your email and name details to register or authenticate your FoodHub account.
            </p>
          </div>
        </div>

        <!-- Google Footer -->
        <div class="bg-[#F1F3F4] text-xs text-[#5f6368] py-3 px-6 flex flex-wrap justify-between items-center border-t border-gray-200">
          <div class="flex gap-4">
            <span>English (United States)</span>
          </div>
          <div class="flex gap-4">
            <a href="#" class="hover:underline">Help</a>
            <a href="#" class="hover:underline">Privacy</a>
            <a href="#" class="hover:underline">Terms</a>
          </div>
        </div>

        <script>
          function selectAccount(name, email, avatar) {
            const redirectUrl = '/auth/callback?simulated=true&googleId=google_' + encodeURIComponent(email) + '&name=' + encodeURIComponent(name) + '&email=' + encodeURIComponent(email) + '&avatar=' + encodeURIComponent(avatar);
            window.location.href = redirectUrl;
          }

          function useCustom() {
            const name = document.getElementById('customName').value.trim();
            const email = document.getElementById('customEmail').value.trim();
            if (!name || !email) {
              alert('Please fill out both your name and Google email.');
              return;
            }
            if (!email.includes('@')) {
              alert('Please enter a valid email address.');
              return;
            }
            const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
            selectAccount(name, email, avatar);
          }
        </script>
      </body>
    </html>
  `);
});

// 5. OAuth Success Callback Handler
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  let googleId = "";
  let email = "";
  let name = "";
  let avatar = "";

  const { code, simulated, googleId: simGoogleId, name: simName, email: simEmail, avatar: simAvatar } = req.query;

  if (simulated === "true" || !process.env.GOOGLE_CLIENT_ID) {
    googleId = (simGoogleId as string) || `google_${Date.now()}`;
    email = (simEmail as string) || "simulated@gmail.com";
    name = (simName as string) || "Simulated Google User";
    avatar = (simAvatar as string) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
  } else {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const redirectUri = `${origin}/auth/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokens: any = await tokenRes.json();
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      if (!userRes.ok) {
        throw new Error("Failed to fetch userinfo");
      }

      const profile: any = await userRes.json();
      googleId = profile.id;
      email = profile.email;
      name = profile.name || "Google User";
      avatar = profile.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      return res.send(`
        <html>
          <body>
            <script>
              alert("Google authentication failed. Please try again or use email/password.");
              window.close();
            </script>
          </body>
        </html>
      `);
    }
  }

  const lowerEmail = email.toLowerCase().trim();
  let customer = db.customers.find(c => c.email.toLowerCase() === lowerEmail || c.googleId === googleId);

  if (customer) {
    if (!customer.googleId) {
      customer.googleId = googleId;
      customer.isGoogleAuth = true;
    }
  } else {
    customer = {
      id: `customer-${Date.now()}`,
      name,
      email: lowerEmail,
      phone: "+234 800 GOOGLE",
      address: "Plot 8, Admiralty Road, Lekki Phase 1, Lagos",
      avatar,
      balance: 20000, // Welcome gift wallet funding
      googleId,
      isGoogleAuth: true,
      createdAt: new Date().toISOString()
    };
    db.customers.push(customer);
  }

  saveDatabase(db);

  res.send(`
    <html>
      <body>
        <script>
          try {
            localStorage.setItem('OAUTH_SUCCESS_CUSTOMER_ID', '${customer.id}');
            localStorage.setItem('OAUTH_SUCCESS_CUSTOMER_DATA', JSON.stringify(${JSON.stringify(customer)}));
          } catch (e) {
            console.error("localStorage write failed in Google OAuth popup", e);
          }
          if (window.opener) {
            try {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                customerId: '${customer.id}',
                customer: ${JSON.stringify(customer)}
              }, '*');
            } catch (err) {
              console.error("opener.postMessage failed", err);
            }
            window.close();
          } else {
            // fallback for missing window.opener
            setTimeout(() => {
              window.close();
            }, 1000);
          }
        </script>
        <p>Success! Securely logging you into FoodHub...</p>
      </body>
    </html>
  `);
});

// Start server
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
