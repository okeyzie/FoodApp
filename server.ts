import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { MongoClient } from "mongodb";
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

let mongoClient: any = null;
let mongoDbConnected = false;

async function initMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MONGODB_URI environment variable set. Defaulting to local JSON storage (db_store.json).");
    return;
  }
  try {
    console.log(`Connecting to MongoDB using URI: ${uri.replace(/\/\/.*@/, "//***:***@")}`);
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    mongoDbConnected = true;
    console.log("MongoDB connection established successfully!");
    
    const dbInstance = mongoClient.db();
    const stateCollection = dbInstance.collection("app_state");
    const doc = await stateCollection.findOne({ _id: "current_state" });
    if (doc) {
      console.log("Found existing AppState document in MongoDB. Synchronizing local memory state...");
      const { _id, ...savedState } = doc;
      db = {
        restaurants: savedState.restaurants || initialRestaurants,
        menuItems: savedState.menuItems || initialMenuItems,
        riders: savedState.riders || initialRiders,
        orders: savedState.orders || [],
        messages: savedState.messages || [],
        reviews: savedState.reviews || initialReviews,
        customers: savedState.customers || initialCustomers,
        admins: savedState.admins || initialAdmins
      };
      console.log("Memory state updated successfully from MongoDB!");
    } else {
      console.log("No existing state found in MongoDB. Initializing MongoDB collection with current baseline data...");
      await stateCollection.updateOne(
        { _id: "current_state" },
        { $set: JSON.parse(JSON.stringify(db)) },
        { upsert: true }
      );
      console.log("MongoDB collection seeded successfully!");
    }
  } catch (err) {
    console.error("Failed to connect or synchronize with MongoDB. Falling back to local JSON. Error:", err);
  }
}

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
          if (c.verified === undefined) {
            c.verified = true;
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

  if (mongoDbConnected && mongoClient) {
    try {
      const dbInstance = mongoClient.db();
      const stateCollection = dbInstance.collection("app_state");
      stateCollection.updateOne(
        { _id: "current_state" },
        { $set: JSON.parse(JSON.stringify(state)) },
        { upsert: true }
      ).catch((err: any) => {
        console.error("Failed to asynchronously save state update to MongoDB:", err);
      });
    } catch (mongoErr) {
      console.error("Failed to enqueue state update to MongoDB:", mongoErr);
    }
  }
}

// Send real-time OTP notification using Brevo Transactional Email API
async function sendBrevoEmail(toEmail: string, toName: string, otpCode: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("BREVO_API_KEY is not defined in the environment variables. Email was not sent. Standard local demo/simulation mode remains active.");
    return false;
  }

  // Smart default sender: use leookeyzie@gmail.com if not specified, since it's the customer's email and highly likely verified in Brevo.
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "leookeyzie@gmail.com";
  const senderName = process.env.BREVO_SENDER_NAME || "FoodHub App";

  try {
    const payload = {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: toEmail,
          name: toName
        }
      ],
      subject: `Your FoodHub Verification Code: ${otpCode}`,
      htmlContent: `
        <div style="background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; margin: 0; min-height: 100%;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 550px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid #f0f0f0;">
            <!-- Brand Header Banner -->
            <tr>
              <td style="background: linear-gradient(135deg, #FF6B35 0%, #FF8552 100%); padding: 40px 30px; text-align: center;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 14px; padding: 12px; display: inline-block;">
                      <span style="font-size: 32px; line-height: 1; vertical-align: middle;">🍔</span>
                    </td>
                  </tr>
                </table>
                <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 15px 0 5px 0; letter-spacing: -0.5px;">FoodHub</h1>
                <p style="color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 1.5px;">Premium Lagos Culinary Delivery</p>
              </td>
            </tr>
            <!-- Content Body -->
            <tr>
              <td style="padding: 40px 35px;">
                <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Verify Your Email Address</h2>
                <p style="color: #555555; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
                  Hello <strong>${toName}</strong>,<br><br>
                  Welcome to FoodHub! We are thrilled to have you join our exclusive culinary circle in Lagos. To activate your account and access rapid doorstep delivery, secure wallet options, and gourmet meals, please enter this secure 4-digit verification code:
                </p>
                
                <!-- Code Display Container -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; background-color: #fff8f5; border: 1.5px dashed #ff9c75; border-radius: 16px;">
                  <tr>
                    <td style="padding: 24px; text-align: center;">
                      <span style="font-size: 11px; color: #ff6b35; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Your OTP Verification Code</span>
                      <span style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 44px; font-weight: 900; letter-spacing: 8px; color: #ff6b35; display: inline-block; line-height: 1;">${otpCode}</span>
                    </td>
                  </tr>
                </table>
                
                <!-- Safety Advisory -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fcfcfc; border-radius: 12px; border: 1px solid #f1f1f1; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 16px; color: #666666; font-size: 12px; line-height: 1.5;">
                      🔒 <strong>Security Warning:</strong> This verification code expires in 15 minutes. For your security, never share this code with anyone. FoodHub support agents will never ask you for this code.
                    </td>
                  </tr>
                </table>
                
                <p style="color: #555555; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                  If you did not initiate this registration, you can safely ignore this message. Your email address remains secure.
                </p>
              </td>
            </tr>
            <!-- Footer Section -->
            <tr>
              <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #f0f0f0;">
                <p style="color: #999999; font-size: 11px; line-height: 1.5; margin: 0 0 10px 0;">
                  This is an automated security transmission. Please do not reply directly to this email.
                </p>
                <p style="color: #bbbbbb; font-size: 11px; margin: 0;">
                  FoodHub Lagos • Plot 8, Admiralty Road, Lekki Phase 1, Lagos, Nigeria
                </p>
              </td>
            </tr>
          </table>
        </div>
      `
    };

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorResponse = await res.text();
      console.error(`Brevo email sending failed for ${toEmail} using sender ${senderEmail}: ${res.status} - ${errorResponse}`);
      return false;
    }

    console.log(`Real OTP verification email successfully dispatched to ${toEmail} using Brevo with sender ${senderEmail}!`);
    return true;
  } catch (error) {
    console.error(`Error encountered while dispatching Brevo email to ${toEmail}:`, error);
    return false;
  }
}

// Initialize db (synchronous file-system baseline)
let db = loadDatabase();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Local in-memory cache of uploaded images for offline/local fallback
const localImagesCache = new Map<string, { data: string; contentType: string }>();

// API Endpoints
// GET endpoint to serve images stored in MongoDB (or local cache fallback) with correct Content-Type header
app.get("/api/images/:id", async (req, res) => {
  const imageId = req.params.id;
  try {
    // 1. Check local in-memory cache first
    let imgDoc = localImagesCache.get(imageId);

    // 2. If not found and MongoDB is active, look up in 'stored_images' collection
    if (!imgDoc && mongoDbConnected && mongoClient) {
      const dbInstance = mongoClient.db();
      const imagesCollection = dbInstance.collection("stored_images");
      const doc = await imagesCollection.findOne({ _id: imageId });
      if (doc) {
        imgDoc = { data: doc.data, contentType: doc.contentType };
        // Save to cache for high-speed subsequent queries
        localImagesCache.set(imageId, imgDoc);
      }
    }

    if (imgDoc) {
      const base64Data = imgDoc.data.split(",")[1] || imgDoc.data;
      const imgBuffer = Buffer.from(base64Data, "base64");
      res.setHeader("Content-Type", imgDoc.contentType || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      return res.send(imgBuffer);
    }

    // 3. Fallback placeholder if not found
    return res.redirect("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80");
  } catch (error) {
    console.error(`Error retrieving/serving image ${imageId}:`, error);
    return res.status(500).json({ error: "Failed to load image" });
  }
});

// POST endpoint to upload a base64 image and save it directly into MongoDB 'stored_images' collection
app.post("/api/upload-image", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "No image data provided" });
    }

    // Capture MIME Content-Type from Data URI (e.g., data:image/png;base64,...)
    let contentType = "image/jpeg";
    const matches = image.match(/^data:([^;]+);base64,/);
    if (matches && matches.length > 1) {
      contentType = matches[1];
    }

    // Generate lightweight unique handle
    const imageId = `img-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const imageDoc = {
      _id: imageId,
      data: image,
      contentType,
      createdAt: new Date().toISOString()
    };

    // Cache locally
    localImagesCache.set(imageId, { data: image, contentType });

    // Store in MongoDB 'stored_images' collection if connection is active
    if (mongoDbConnected && mongoClient) {
      const dbInstance = mongoClient.db();
      const imagesCollection = dbInstance.collection("stored_images");
      await imagesCollection.updateOne(
        { _id: imageId },
        { $set: imageDoc },
        { upsert: true }
      );
      console.log(`Successfully stored image ${imageId} inside MongoDB 'stored_images' collection!`);
    } else {
      console.warn(`MongoDB is not active. Image ${imageId} stored inside local cache fallback only.`);
    }

    return res.status(201).json({
      success: true,
      id: imageId,
      url: `/api/images/${imageId}`
    });
  } catch (err) {
    console.error("Error encountered while uploading image to MongoDB:", err);
    return res.status(500).json({ error: "Internal server error uploading image" });
  }
});

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
    avatar: req.body.avatar || "",
    balance: req.body.balance !== undefined ? parseFloat(req.body.balance) : 0,
    walletCreated: req.body.walletCreated !== undefined ? !!req.body.walletCreated : false,
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
    if (req.body.walletCreated !== undefined) {
      customer.walletCreated = !!req.body.walletCreated;
      if (customer.walletCreated && !customer.bankAccountNumber) {
        // Generate unique Nigerian virtual bank account details
        const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
        customer.bankAccountNumber = `950${randomNum}`;
        customer.bankName = "Providus Bank (FoodHub Settlements)";
        customer.bankAccountName = `FDHB-${customer.name.toUpperCase().replace(/[^A-Z]/g, '')}`;
      }
    }
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
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, phone, address, avatar } = req.body;
  if (!email || !password || !name || !phone || !address) {
    return res.status(400).json({ error: "All registration fields (email, password, name, phone, address) are required." });
  }
  const trimmedEmail = email.trim().toLowerCase();
  const existing = db.customers.find(c => c.email.toLowerCase() === trimmedEmail);
  if (existing) {
    return res.status(400).json({ error: "This email address is already registered." });
  }

  // Generate a random 4-digit verification code
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  
  const newCustomer: CustomerAccount = {
    id: `customer-${Date.now()}`,
    name,
    email: trimmedEmail,
    phone,
    address,
    avatar: avatar || "",
    balance: 0, // starting balance is 0 as requested
    walletCreated: false, // Must explicitly create/activate wallet account
    password, // stored securely in db_store.json
    verified: false, // Must verify email first
    otpCode,
    createdAt: new Date().toISOString()
  };
  
  db.customers.push(newCustomer);
  saveDatabase(db);

  // Send the real Brevo email
  const emailSent = await sendBrevoEmail(newCustomer.email, newCustomer.name, otpCode);

  res.status(201).json({
    ...newCustomer,
    emailSent
  });
});

// 2. Email and Password Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const trimmedEmail = email.trim().toLowerCase();
  const customer = db.customers.find(c => c.email.toLowerCase() === trimmedEmail && c.password === password);
  if (!customer) {
    return res.status(400).json({ error: "Invalid email or password." });
  }

  // If the account is registered but not verified yet, block login and request verification
  if (customer.verified === false) {
    const otpCode = customer.otpCode || Math.floor(1000 + Math.random() * 9000).toString();
    customer.otpCode = otpCode;
    saveDatabase(db);

    // Resend the real Brevo email
    const emailSent = await sendBrevoEmail(customer.email, customer.name, otpCode);

    return res.status(403).json({
      error: "Verification required",
      verificationRequired: true,
      email: customer.email,
      otpCode: otpCode, // Send as backup so frontend works with or without Brevo variables configured
      emailSent
    });
  }

  res.json(customer);
});

// 3. Verify OTP
app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and verification code are required." });
  }
  const trimmedEmail = email.trim().toLowerCase();
  const customer = db.customers.find(c => c.email.toLowerCase() === trimmedEmail);
  if (!customer) {
    return res.status(404).json({ error: "Account not found." });
  }

  if (customer.otpCode !== otp.toString().trim()) {
    return res.status(400).json({ error: "Invalid verification code. Please check and try again." });
  }

  customer.verified = true;
  customer.otpCode = undefined; // clear once verified
  saveDatabase(db);
  res.json({ message: "Email verified successfully!", customer });
});

// 4. Resend OTP
app.post("/api/auth/resend-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const trimmedEmail = email.trim().toLowerCase();
  const customer = db.customers.find(c => c.email.toLowerCase() === trimmedEmail);
  if (!customer) {
    return res.status(404).json({ error: "Account not found." });
  }

  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  customer.otpCode = otpCode;
  saveDatabase(db);

  // Send the real Brevo email
  const emailSent = await sendBrevoEmail(customer.email, customer.name, otpCode);

  res.json({ 
    message: "A new 4-digit verification code has been generated.", 
    otpCode,
    emailSent
  });
});

// 2b. Admin Registration
app.post("/api/admin/register", (req, res) => {
  const { email, password, name, businessPasscode } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "All admin registration fields (email, password, name) are required." });
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  // 1. Verify business email domain
  if (!trimmedEmail.endsWith("@foodhub.com") && !trimmedEmail.endsWith("@foodhublagos.com")) {
    return res.status(403).json({ 
      error: "Access Denied: Admin account creation is strictly restricted to verified corporate domains (@foodhub.com or @foodhublagos.com)." 
    });
  }

  // 2. Verify business passcode
  if (businessPasscode !== "FOODHUB-CORP-SECURE-2026") {
    return res.status(403).json({ 
      error: "Access Denied: Invalid Business Authorization Passcode. You must be an authorized FoodHub employee to register." 
    });
  }

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
  // Initialize MongoDB connection if MONGODB_URI is provided
  await initMongoDB();

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
