require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Serve uploaded images and frontend static files
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'frontend')));

// Multer Setup for Image Uploads
const storage = multer.memoryStorage(); // Use memory storage for processing
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Image Processing Helper
const processImage = async (file) => {
  const filename = `raakh-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
  const outputPath = path.join(uploadsDir, filename);

  await sharp(file.buffer)
    .resize(1200, 1600, {
      fit: 'contain',
      background: { r: 10, g: 10, b: 10, alpha: 1 } // Matches --black theme
    })
    .webp({ quality: 85 })
    .toFile(outputPath);

  return `/uploads/${filename}`;
};

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('Error: MongoDB connection string (MONGODB_URI or MONGO_URI) is not defined in environment variables.');
}

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
})
  .then(() => {
    console.log('Connected to MongoDB');
    initSettings();
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Exit if cannot connect to DB in production
  });
// --- SCHEMAS ---
const orderItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  price: Number
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  orderItems: [orderItemSchema],
  orderID: { type: String, required: true, unique: true },
  status: { type: String, default: 'Pending' },
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: { type: [String], required: true }, // Array of image URL paths
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  discount: { type: Number, default: 0 }, // Percentage discount
  isComingSoon: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

const settingsSchema = new mongoose.Schema({
  promoPopupEnabled: { type: Boolean, default: false },
  promoMessage: { type: String, default: 'Flash Sale! Get 20% off on all products.' },
  promoDiscount: { type: Number, default: 0 } // Information only for the popup
});
const Settings = mongoose.model('Settings', settingsSchema);

// Initialize default settings if not exists
const initSettings = async () => {
  const count = await Settings.countDocuments();
  if (count === 0) {
    await Settings.create({});
  }
};
initSettings(); // Also call initially just in case

// Generate short Order ID
const generateOrderID = async () => {
  const count = await Order.countDocuments();
  return `RAKH-${101 + count}`;
};

// --- PUBLIC APIs ---
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, whatsappNumber, address, city, orderItems, totalPrice } = req.body;
    const orderID = await generateOrderID();
    const newOrder = new Order({
      customerName, whatsappNumber, address, city, orderItems, orderID, totalPrice
    });
    await newOrder.save();
    res.status(201).json({ success: true, orderID, newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Root API Route - Serve the frontend index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Get public settings
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- ADMIN APIs & MIDDLEWARE ---
const adminAuth = (req, res, next) => {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'raakh123';

  if (login && password && login === ADMIN_USER && password === ADMIN_PASS) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="401"');
  res.status(401).send('Authentication required.');
};

// Serve Admin UI Page
app.get('/admin', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// API: Get all orders
app.get('/api/admin/orders', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Update order status
app.put('/api/admin/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Delete an order
app.delete('/api/admin/orders/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Create a product
app.post('/api/admin/products', adminAuth, upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, price, discount, isComingSoon, sizes, colors } = req.body;
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'At least one image is required' });

    const imagePromises = req.files.map(f => processImage(f));
    const imageUrls = await Promise.all(imagePromises);

    const sizesArr = sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const colorsArr = colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [];

    const product = new Product({
      name,
      description,
      price: Number(price),
      discount: Number(discount) || 0,
      isComingSoon: isComingSoon === 'true',
      images: imageUrls,
      sizes: sizesArr,
      colors: colorsArr
    });

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Update a product
app.put('/api/admin/products/:id', adminAuth, upload.array('newImages', 10), async (req, res) => {
  try {
    const { name, description, price, discount, isComingSoon, sizes, colors } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (discount !== undefined) product.discount = Number(discount);
    if (isComingSoon !== undefined) product.isComingSoon = isComingSoon === 'true';
    if (sizes !== undefined) product.sizes = sizes.split(',').map(s => s.trim()).filter(Boolean);
    if (colors !== undefined) product.colors = colors.split(',').map(c => c.trim()).filter(Boolean);

    // If new images uploaded, process and replace
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(f => processImage(f));
      product.images = await Promise.all(imagePromises);
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


app.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product && product.images) {
      product.images.forEach(imgPath => {
        const filePath = path.join(__dirname, imgPath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Update settings
app.put('/api/admin/settings', adminAuth, async (req, res) => {
  try {
    const { promoPopupEnabled, promoMessage, promoDiscount } = req.body;
    const settings = await Settings.findOneAndUpdate({}, {
      promoPopupEnabled, promoMessage, promoDiscount
    }, { new: true, upsert: true });
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Global error handler (prevents server crashes from Multer etc)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
  }
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
