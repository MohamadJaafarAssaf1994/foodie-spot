import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===========================================
// Configuration
// ===========================================
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET || "foodiespot-super-secret-jwt-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "foodiespot-super-secret-refresh-key-change-in-production";
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "1h";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

const UPLOADS_DIR = process.env.UPLOADS_DIR 
  ? path.resolve(__dirname, process.env.UPLOADS_DIR) 
  : path.join(__dirname, "uploads");
const DATA_DIR = process.env.DATA_DIR 
  ? path.resolve(__dirname, process.env.DATA_DIR) 
  : path.join(__dirname, "data");

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ===========================================
// Database helpers (JSON files)
// ===========================================
function loadJSON(filename) {
  try {
    const filepath = path.join(DATA_DIR, filename);
    const raw = fs.readFileSync(filepath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`No ${filename} found, starting with empty data.`);
    return filename === "menus.json" ? {} : [];
  }
}

function saveJSON(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf8");
}

// Charger les données
let restaurants = loadJSON("restaurants.json");
let menus = loadJSON("menus.json");
let categories = loadJSON("categories.json");
let users = loadJSON("users.json");
let orders = loadJSON("orders.json");
let reviews = loadJSON("reviews.json") || [];
let favorites = loadJSON("favorites.json") || {};
let pushTokens = loadJSON("push-tokens.json") || {};

// ===========================================
// Express App Setup
// ===========================================
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

// Multer pour upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max



// ===========================================
// Middleware - Authentication
// ===========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token d'accès requis" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Token invalide ou expiré" });
    }
    req.user = decoded;
    next();
  });
};

// Middleware optionnel (ne bloque pas si pas de token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.user = decoded;
      }
    });
  }
  next();
};

// ===========================================
// Helper functions
// ===========================================
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ===========================================
// Routes - Health Check
// ===========================================
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "FoodieSpot API", ts: Date.now() });
});

// ===========================================
// Routes - Authentication (Module 08)
// ===========================================
app.post("/auth/register", (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body || {};

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ 
      success: false, 
      message: "Email, mot de passe, prénom et nom sont requis" 
    });
  }

  // Vérifier si l'email existe déjà
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ success: false, message: "Cet email est déjà utilisé" });
  }

  const newUser = {
    id: uuidv4(),
    email,
    password, // En prod: hasher avec bcrypt!
    firstName,
    lastName,
    phone: phone || "",
    avatar: "",
    addresses: [],
    notificationsEnabled: true,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveJSON("users.json", users);

  const { password: _, ...userWithoutPassword } = newUser;
  const tokens = generateTokens(newUser);

  res.status(201).json({
    success: true,
    data: {
      user: userWithoutPassword,
      ...tokens,
      expiresIn: 3600
    }
  });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email et mot de passe requis" });
  }

  // Pour le mock: on accepte tout ou on vérifie dans users.json
  let user = users.find(u => u.email === email);
  
  if (!user) {
    // Créer un utilisateur mock si n'existe pas
    user = {
      id: uuidv4(),
      email,
      firstName: email.split("@")[0],
      lastName: "Demo",
      phone: "",
      avatar: "",
      addresses: [
        {
          id: uuidv4(),
          label: "Maison",
          street: "123 Rue de Paris",
          city: "Paris",
          postalCode: "75001",
          country: "France",
          latitude: 48.8566,
          longitude: 2.3522,
          isDefault: true
        }
      ],
      notificationsEnabled: true,
      createdAt: new Date().toISOString()
    };
    users.push({ ...user, password });
    saveJSON("users.json", users);
  }

  const { password: _, ...userWithoutPassword } = user;
  const tokens = generateTokens(user);

  // Format compatible avec le frontend (user + token à la racine de data)
  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token: tokens.accessToken, // Alias pour le frontend
      ...tokens,
      expiresIn: 3600
    }
  });
});

app.post("/auth/refresh", (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "Refresh token requis" });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Refresh token invalide" });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    res.json({
      success: true,
      data: { accessToken, expiresIn: 3600 }
    });
  });
});

app.post("/auth/logout", authenticateToken, (req, res) => {
  // En prod: invalider le refresh token
  res.json({ success: true, message: "Déconnexion réussie" });
});

app.post("/auth/forgot-password", (req, res) => {
  const { email } = req.body || {};
  // Mock: toujours succès
  res.json({ success: true, message: "Email de récupération envoyé" });
});

// ===========================================
// Routes - User Profile
// ===========================================
app.get("/users/profile", authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, data: userWithoutPassword });
});

app.put("/users/profile", authenticateToken, (req, res) => {
  const { firstName, lastName, phone } = req.body || {};
  const userIndex = users.findIndex(u => u.id === req.user.userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
  }

  if (firstName) users[userIndex].firstName = firstName;
  if (lastName) users[userIndex].lastName = lastName;
  if (phone !== undefined) users[userIndex].phone = phone;

  saveJSON("users.json", users);

  const { password: _, ...userWithoutPassword } = users[userIndex];
  res.json({ success: true, data: userWithoutPassword });
});

app.post("/users/avatar", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Aucun fichier uploadé" });
  }

  const userIndex = users.findIndex(u => u.id === req.user.userId);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
  }

  const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  users[userIndex].avatar = avatarUrl;
  saveJSON("users.json", users);

  res.json({ success: true, data: { url: avatarUrl } });
});

// ===========================================
// Routes - Addresses
// ===========================================
app.get("/users/addresses", authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
  }
  res.json({ success: true, data: user.addresses || [] });
});

app.post("/users/addresses", authenticateToken, (req, res) => {
  const { label, street, apartment, city, postalCode, country, latitude, longitude, isDefault, instructions } = req.body;
  
  const userIndex = users.findIndex(u => u.id === req.user.userId);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
  }

  const newAddress = {
    id: uuidv4(),
    label: label || "Adresse",
    street,
    apartment,
    city,
    postalCode,
    country: country || "France",
    latitude: latitude || 48.8566,
    longitude: longitude || 2.3522,
    isDefault: isDefault || false,
    instructions
  };

  if (newAddress.isDefault) {
    users[userIndex].addresses = users[userIndex].addresses.map(a => ({ ...a, isDefault: false }));
  }

  users[userIndex].addresses.push(newAddress);
  saveJSON("users.json", users);

  res.status(201).json({ success: true, data: newAddress });
});

app.delete("/users/addresses/:addressId", authenticateToken, (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.user.userId);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
  }

  users[userIndex].addresses = users[userIndex].addresses.filter(a => a.id !== req.params.addressId);
  saveJSON("users.json", users);

  res.json({ success: true, message: "Adresse supprimée" });
});

// ===========================================
// Routes - User (alias pour compatibilité frontend)
// ===========================================
// PATCH /user/profile (alias de PUT /users/profile)
app.patch("/user/profile", authenticateToken, (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.user.userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
  }

  const allowedFields = ['firstName', 'lastName', 'phone', 'photo', 'notificationsEnabled'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      users[userIndex][field] = req.body[field];
    }
  });

  // Support pour le champ "name" du frontend
  if (req.body.name) {
    const nameParts = req.body.name.split(' ');
    users[userIndex].firstName = nameParts[0];
    users[userIndex].lastName = nameParts.slice(1).join(' ') || '';
  }

  saveJSON("users.json", users);

  const { password: _, ...userWithoutPassword } = users[userIndex];
  res.json({ success: true, data: userWithoutPassword });
});

// POST /user/favorites/:restaurantId (toggle)
app.post("/user/favorites/:restaurantId", authenticateToken, (req, res) => {
  const { restaurantId } = req.params;
  
  if (!favorites[req.user.userId]) {
    favorites[req.user.userId] = [];
  }

  const index = favorites[req.user.userId].indexOf(restaurantId);
  
  if (index === -1) {
    // Ajouter aux favoris
    favorites[req.user.userId].push(restaurantId);
    saveJSON("favorites.json", favorites);
    res.json({ success: true, message: "Ajouté aux favoris", isFavorite: true });
  } else {
    // Retirer des favoris
    favorites[req.user.userId].splice(index, 1);
    saveJSON("favorites.json", favorites);
    res.json({ success: true, message: "Retiré des favoris", isFavorite: false });
  }
});

// GET /user/favorites
app.get("/user/favorites", authenticateToken, (req, res) => {
  const userFavs = favorites[req.user.userId] || [];
  const favoriteRestaurants = restaurants.filter(r => userFavs.includes(r.id));
  res.json({ success: true, data: favoriteRestaurants });
});

// POST /upload (alias de /uploads pour compatibilité)
app.post("/upload", authenticateToken, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Aucun fichier uploadé" });
  }
  
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, url: fileUrl, data: { url: fileUrl, id: req.file.filename } });
});

// ===========================================
// Routes - Categories
// ===========================================
app.get("/categories", (req, res) => {
  res.json({ success: true, data: categories });
});

// ===========================================
// Routes - Search (pour compatibilité frontend)
// ===========================================
app.get("/restaurants/search", optionalAuth, (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.json({ success: true, data: [] });
  }

  const query = q.toString().toLowerCase();
  let result = restaurants.filter(r => 
    r.name.toLowerCase().includes(query) ||
    r.cuisine.some(c => c.toLowerCase().includes(query)) ||
    r.description.toLowerCase().includes(query) ||
    r.categories.some(c => c.toLowerCase().includes(query))
  );

  // Ajouter favoris si user connecté
  if (req.user) {
    const userFavs = favorites[req.user.userId] || [];
    result = result.map(r => ({ ...r, isFavorite: userFavs.includes(r.id) }));
  }

  res.json({ success: true, data: result });
});

// ===========================================
// Routes - Restaurants (Module 04)
// ===========================================
app.get("/restaurants", optionalAuth, (req, res) => {
  const { category, cuisine, search, sortBy, lat, lng, radius, priceRange, rating, page = 1, limit = 20 } = req.query;
  
  let result = [...restaurants];

  // Filtrer par catégorie
  if (category) {
    result = result.filter(r => r.categories.includes(category));
  }

  // Filtrer par cuisine
  if (cuisine) {
    result = result.filter(r => r.cuisine.some(c => c.toLowerCase().includes(cuisine.toLowerCase())));
  }

  // Recherche textuelle
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.cuisine.some(c => c.toLowerCase().includes(q)) ||
      r.description.toLowerCase().includes(q)
    );
  }

  // Filtrer par prix
  if (priceRange) {
    const prices = priceRange.split(",").map(Number);
    result = result.filter(r => prices.includes(r.priceRange));
  }

  // Filtrer par note minimum
  if (rating) {
    result = result.filter(r => r.rating >= parseFloat(rating));
  }

  // Calculer la distance si lat/lng fournis
  if (lat && lng) {
    result = result.map(r => ({
      ...r,
      distance: calculateDistance(parseFloat(lat), parseFloat(lng), r.latitude, r.longitude)
    }));

    // Filtrer par rayon
    if (radius) {
      result = result.filter(r => r.distance <= parseFloat(radius));
    }
  }

  // Ajouter favoris si user connecté
  if (req.user) {
    const userFavs = favorites[req.user.userId] || [];
    result = result.map(r => ({ ...r, isFavorite: userFavs.includes(r.id) }));
  }

  // Trier
  switch (sortBy) {
    case "distance":
      result.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "deliveryTime":
      result.sort((a, b) => a.deliveryTime.min - b.deliveryTime.min);
      break;
    case "popularity":
      result.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    default:
      result.sort((a, b) => b.rating - a.rating);
  }

  // Pagination
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const paginatedResult = result.slice(startIndex, startIndex + parseInt(limit));

  res.json({
    success: true,
    data: paginatedResult,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: result.length,
      totalPages: Math.ceil(result.length / parseInt(limit))
    }
  });
});

app.get("/restaurants/nearby", optionalAuth, (req, res) => {
  const { lat, lng, radius = 5 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: "Latitude et longitude requises" });
  }

  let result = restaurants.map(r => ({
    ...r,
    distance: calculateDistance(parseFloat(lat), parseFloat(lng), r.latitude, r.longitude)
  }));

  result = result.filter(r => r.distance <= parseFloat(radius));
  result.sort((a, b) => a.distance - b.distance);

  if (req.user) {
    const userFavs = favorites[req.user.userId] || [];
    result = result.map(r => ({ ...r, isFavorite: userFavs.includes(r.id) }));
  }

  res.json({ success: true, data: result });
});

app.get("/restaurants/:id", optionalAuth, (req, res) => {
  const restaurant = restaurants.find(r => r.id === req.params.id);
  
  if (!restaurant) {
    return res.status(404).json({ success: false, message: "Restaurant non trouvé" });
  }

  let result = { ...restaurant };

  if (req.user) {
    const userFavs = favorites[req.user.userId] || [];
    result.isFavorite = userFavs.includes(restaurant.id);
  }

  res.json({ success: true, data: result });
});

app.get("/restaurants/:id/menu", (req, res) => {
  const menu = menus[req.params.id];
  
  if (!menu) {
    return res.status(404).json({ success: false, message: "Menu non trouvé" });
  }

  res.json({ success: true, data: menu });
});

app.get("/restaurants/:id/reviews", (req, res) => {
  const restaurantReviews = reviews.filter(r => r.restaurantId === req.params.id);
  res.json({ success: true, data: restaurantReviews });
});

// ===========================================
// Routes - Favorites
// ===========================================
app.get("/favorites", authenticateToken, (req, res) => {
  const userFavs = favorites[req.user.userId] || [];
  const favoriteRestaurants = restaurants.filter(r => userFavs.includes(r.id));
  res.json({ success: true, data: favoriteRestaurants });
});

app.post("/favorites", authenticateToken, (req, res) => {
  const { restaurantId } = req.body;
  
  if (!restaurantId) {
    return res.status(400).json({ success: false, message: "restaurantId requis" });
  }

  if (!favorites[req.user.userId]) {
    favorites[req.user.userId] = [];
  }

  if (!favorites[req.user.userId].includes(restaurantId)) {
    favorites[req.user.userId].push(restaurantId);
    saveJSON("favorites.json", favorites);
  }

  res.json({ success: true, message: "Ajouté aux favoris" });
});

app.delete("/favorites/:restaurantId", authenticateToken, (req, res) => {
  if (favorites[req.user.userId]) {
    favorites[req.user.userId] = favorites[req.user.userId].filter(id => id !== req.params.restaurantId);
    saveJSON("favorites.json", favorites);
  }
  res.json({ success: true, message: "Retiré des favoris" });
});

// ===========================================
// Routes - Cart (côté client principalement)
// ===========================================
app.post("/cart/validate", authenticateToken, (req, res) => {
  const { restaurantId, items } = req.body;

  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: "Restaurant non trouvé" });
  }

  const menu = menus[restaurantId];
  if (!menu) {
    return res.status(404).json({ success: false, message: "Menu non trouvé" });
  }

  // Valider que tous les items existent et sont disponibles
  const allMenuItems = menu.flatMap(cat => cat.items);
  let subtotal = 0;

  for (const item of items) {
    const menuItem = allMenuItems.find(m => m.id === item.menuItemId);
    if (!menuItem) {
      return res.status(400).json({ success: false, message: `Article ${item.menuItemId} non trouvé` });
    }
    if (!menuItem.isAvailable) {
      return res.status(400).json({ success: false, message: `${menuItem.name} n'est plus disponible` });
    }
    subtotal += menuItem.price * item.quantity;
  }

  if (subtotal < restaurant.minimumOrder) {
    return res.status(400).json({ 
      success: false, 
      message: `Commande minimum: ${restaurant.minimumOrder}€ (actuel: ${subtotal}€)` 
    });
  }

  res.json({
    success: true,
    data: {
      subtotal,
      deliveryFee: restaurant.deliveryFee,
      serviceFee: 0.99,
      total: subtotal + restaurant.deliveryFee + 0.99
    }
  });
});

// ===========================================
// Routes - Orders
// ===========================================
app.get("/orders", authenticateToken, (req, res) => {
  const userOrders = orders.filter(o => o.userId === req.user.userId);
  userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: userOrders });
});

app.get("/orders/:id", authenticateToken, (req, res) => {
  const order = orders.find(o => o.id === req.params.id && o.userId === req.user.userId);
  
  if (!order) {
    return res.status(404).json({ success: false, message: "Commande non trouvée" });
  }

  res.json({ success: true, data: order });
});

app.post("/orders", authenticateToken, (req, res) => {
  const { restaurantId, items, deliveryAddress, paymentMethod, tip = 0, deliveryInstructions } = req.body;

  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: "Restaurant non trouvé" });
  }

  // Calculer les totaux
  const menu = menus[restaurantId];
  const allMenuItems = menu ? menu.flatMap(cat => cat.items) : [];
  
  let subtotal = 0;
  const orderItems = items.map(item => {
    const menuItem = allMenuItems.find(m => m.id === item.menuItemId);
    const itemTotal = menuItem ? menuItem.price * item.quantity : 0;
    subtotal += itemTotal;
    return {
      ...item,
      menuItem,
      totalPrice: itemTotal
    };
  });

  const deliveryFee = restaurant.deliveryFee;
  const serviceFee = 0.99;
  const total = subtotal + deliveryFee + serviceFee + tip;

  const newOrder = {
    id: uuidv4(),
    orderNumber: `FS-${Date.now().toString().slice(-8)}`,
    userId: req.user.userId,
    restaurantId,
    restaurantName: restaurant.name,
    restaurantImage: restaurant.image,
    items: orderItems,
    status: "pending",
    subtotal,
    deliveryFee,
    serviceFee,
    tip,
    discount: 0,
    total,
    paymentMethod: paymentMethod || "card",
    deliveryAddress,
    deliveryInstructions,
    estimatedDelivery: new Date(Date.now() + (restaurant.deliveryTime.max * 60 * 1000)).toISOString(),
    timeline: [
      { status: "pending", timestamp: new Date().toISOString(), message: "Commande reçue" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.push(newOrder);
  saveJSON("orders.json", orders);

  // Simuler progression de la commande
  simulateOrderProgress(newOrder.id);

  res.status(201).json({ success: true, data: newOrder });
});

app.post("/orders/:id/cancel", authenticateToken, (req, res) => {
  const orderIndex = orders.findIndex(o => o.id === req.params.id && o.userId === req.user.userId);
  
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: "Commande non trouvée" });
  }

  if (!["pending", "confirmed"].includes(orders[orderIndex].status)) {
    return res.status(400).json({ success: false, message: "Cette commande ne peut plus être annulée" });
  }

  orders[orderIndex].status = "cancelled";
  orders[orderIndex].updatedAt = new Date().toISOString();
  orders[orderIndex].timeline.push({
    status: "cancelled",
    timestamp: new Date().toISOString(),
    message: "Commande annulée par le client"
  });

  saveJSON("orders.json", orders);
  res.json({ success: true, data: orders[orderIndex] });
});

// Track order (avec infos livreur en temps réel)
app.get("/orders/:id/track", authenticateToken, (req, res) => {
  const order = orders.find(o => o.id === req.params.id && o.userId === req.user.userId);
  
  if (!order) {
    return res.status(404).json({ success: false, message: "Commande non trouvée" });
  }

  // Simuler la position du livreur si en livraison
  let trackingData = { ...order };
  
  if (order.status === "delivering" || order.status === "picked_up") {
    trackingData.driverLocation = {
      latitude: 48.8566 + (Math.random() - 0.5) * 0.01,
      longitude: 2.3522 + (Math.random() - 0.5) * 0.01,
      heading: Math.random() * 360,
      updatedAt: new Date().toISOString()
    };
    trackingData.estimatedArrival = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  }

  res.json({ success: true, data: trackingData });
});

// Simuler la progression d'une commande
function simulateOrderProgress(orderId) {
  const statuses = [
    { status: "confirmed", delay: 10000, message: "Commande confirmée par le restaurant" },
    { status: "preparing", delay: 20000, message: "Préparation en cours" },
    { status: "ready", delay: 40000, message: "Commande prête" },
    { status: "picked_up", delay: 50000, message: "Récupérée par le livreur" },
    { status: "delivering", delay: 60000, message: "En cours de livraison" },
    { status: "delivered", delay: 90000, message: "Livrée" }
  ];

  statuses.forEach(({ status, delay, message }) => {
    setTimeout(() => {
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex !== -1 && orders[orderIndex].status !== "cancelled") {
        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();
        orders[orderIndex].timeline.push({
          status,
          timestamp: new Date().toISOString(),
          message
        });
        if (status === "delivered") {
          orders[orderIndex].actualDelivery = new Date().toISOString();
        }
        saveJSON("orders.json", orders);
      }
    }, delay);
  });
}

// ===========================================
// Routes - Reviews (Module 05 - avec upload)
// ===========================================
app.post("/reviews", authenticateToken, upload.array("images", 5), (req, res) => {
  const { restaurantId, orderId, rating, comment } = req.body;

  if (!restaurantId || !rating) {
    return res.status(400).json({ success: false, message: "restaurantId et rating requis" });
  }

  const user = users.find(u => u.id === req.user.userId);
  const images = req.files ? req.files.map(f => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`) : [];

  const newReview = {
    id: uuidv4(),
    userId: req.user.userId,
    userName: user ? `${user.firstName} ${user.lastName}` : "Utilisateur",
    userAvatar: user?.avatar,
    restaurantId,
    orderId,
    rating: parseInt(rating),
    comment: comment || "",
    images,
    likes: 0,
    createdAt: new Date().toISOString()
  };

  reviews.push(newReview);
  saveJSON("reviews.json", reviews);

  // Mettre à jour la note du restaurant
  const restaurantReviews = reviews.filter(r => r.restaurantId === restaurantId);
  const avgRating = restaurantReviews.reduce((sum, r) => sum + r.rating, 0) / restaurantReviews.length;
  const restaurantIndex = restaurants.findIndex(r => r.id === restaurantId);
  if (restaurantIndex !== -1) {
    restaurants[restaurantIndex].rating = Math.round(avgRating * 10) / 10;
    restaurants[restaurantIndex].reviewCount = restaurantReviews.length;
    saveJSON("restaurants.json", restaurants);
  }

  res.status(201).json({ success: true, data: newReview });
});

// ===========================================
// Routes - Upload (Module 05)
// ===========================================
app.post("/uploads", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Aucun fichier uploadé" });
  }
  
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, data: { url: fileUrl, id: req.file.filename } });
});

// ===========================================
// Routes - Push Notifications (Module 09)
// ===========================================
app.post("/notifications/register-token", authenticateToken, (req, res) => {
  const { token, platform, deviceName } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: "Token requis" });
  }

  pushTokens[req.user.userId] = {
    token,
    platform: platform || "unknown",
    deviceName: deviceName || "Unknown Device",
    registeredAt: new Date().toISOString()
  };

  saveJSON("push-tokens.json", pushTokens);
  res.json({ success: true, message: "Token enregistré" });
});

app.get("/notifications", authenticateToken, (req, res) => {
  // Mock notifications
  const notifications = [
    {
      id: uuidv4(),
      type: "promotion",
      title: "🎉 -20% chez Pizza Napoli !",
      body: "Profitez de 20% de réduction sur votre prochaine commande",
      data: { restaurantId: "rest-002" },
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: uuidv4(),
      type: "new_restaurant",
      title: "🆕 Nouveau restaurant !",
      body: "Découvrez Green Bowl, votre nouvelle adresse healthy",
      data: { restaurantId: "rest-005" },
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];
  
  res.json({ success: true, data: notifications });
});

// ===========================================
// Routes - Promos
// ===========================================
app.post("/promos/validate", authenticateToken, (req, res) => {
  const { code, subtotal } = req.body;

  const promoCodes = {
    "BIENVENUE30": { discount: 30, type: "percent", minOrder: 20, maxDiscount: 15 },
    "FOODIE10": { discount: 10, type: "percent", minOrder: 15, maxDiscount: 10 },
    "LIVRAISON": { discount: 100, type: "delivery", minOrder: 25 }
  };

  const promo = promoCodes[code?.toUpperCase()];

  if (!promo) {
    return res.status(400).json({ success: false, message: "Code promo invalide" });
  }

  if (subtotal < promo.minOrder) {
    return res.status(400).json({ 
      success: false, 
      message: `Commande minimum de ${promo.minOrder}€ requise pour ce code` 
    });
  }

  let discountAmount = 0;
  if (promo.type === "percent") {
    discountAmount = Math.min((subtotal * promo.discount) / 100, promo.maxDiscount || Infinity);
  } else if (promo.type === "delivery") {
    discountAmount = "free_delivery";
  }

  res.json({
    success: true,
    data: {
      code: code.toUpperCase(),
      discount: discountAmount,
      type: promo.type,
      message: promo.type === "delivery" ? "Livraison gratuite !" : `-${discountAmount.toFixed(2)}€`
    }
  });
});

// ===========================================
// 404 Handler
// ===========================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route non trouvée" });
});

// ===========================================
// Start Server
// ===========================================
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🍔 FoodieSpot Mock API Server                  ║
║                                                   ║
║   Running on: http://localhost:${PORT}              ║
║                                                   ║
║   Endpoints:                                      ║
║   - GET  /health                                  ║
║   - POST /auth/register                           ║
║   - POST /auth/login                              ║
║   - POST /auth/refresh                            ║
║   - GET  /categories                              ║
║   - GET  /restaurants                             ║
║   - GET  /restaurants/:id                         ║
║   - GET  /restaurants/:id/menu                    ║
║   - GET  /favorites                               ║
║   - POST /favorites                               ║
║   - GET  /orders                                  ║
║   - POST /orders                                  ║
║   - POST /uploads                                 ║
║   - POST /reviews                                 ║
║   - POST /notifications/register-token            ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});
