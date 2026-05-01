require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/raakhscrn';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

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
  isComingSoon: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

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

// Root API Route
app.get('/', (req, res) => {
  res.json({ message: 'RAAKHSCRN API is running.' });
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

// API: Create a product
app.post('/api/admin/products', adminAuth, upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, price, isComingSoon, sizes, colors } = req.body;
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'At least one image is required' });
    
    const imageUrls = req.files.map(f => `/uploads/${f.filename}`);
    
    const sizesArr = sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const colorsArr = colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [];

    const product = new Product({
      name,
      description,
      price: Number(price),
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
    const { name, description, price, isComingSoon, sizes, colors } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (isComingSoon !== undefined) product.isComingSoon = isComingSoon === 'true';
    if (sizes !== undefined) product.sizes = sizes.split(',').map(s => s.trim()).filter(Boolean);
    if (colors !== undefined) product.colors = colors.split(',').map(c => c.trim()).filter(Boolean);

    // If new images uploaded, replace all
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(f => `/uploads/${f.filename}`);
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
