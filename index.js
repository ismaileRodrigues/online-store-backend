require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-store-backend';

async function connectDB() {
    try {
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado ao MongoDB');
    } catch (err) {
        console.error('❌ Erro ao conectar ao MongoDB:', err.message);
        process.exit(1);
    }
}

// Modelos
const storeStatusSchema = new mongoose.Schema({
    status: { type: String, enum: ['open', 'closed'], default: 'open' }
});
const StoreStatus = mongoose.model('StoreStatus', storeStatusSchema);

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});
const Category = mongoose.model('Category', categorySchema);

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    image: String,
    category: { type: String, required: false }
});
const Product = mongoose.model('Product', productSchema);

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'products', allowed_formats: ['jpg', 'jpeg', 'png'] }
});
const upload = multer({ storage });

// Middlewares
app.use(bodyParser.json());
app.use(cors({
    origin: [
        'https://online-store-admin-portal.vercel.app',
        'https://oline-store-frontend.vercel.app',
        'http://127.0.0.1:5500',
        'https://loja-oline-cliente.vercel.app',
    ]
}));

// Endpoints de estado da loja
app.get('/api/store-status', async (req, res) => {
    const store = await StoreStatus.findOne();
    res.json({ status: store ? store.status : 'open' });
});

app.post('/api/store-status', async (req, res) => {
    const newStatus = req.body.status;
    await StoreStatus.updateOne({}, { status: newStatus }, { upsert: true });
    res.json({ status: newStatus });
});

// Demais endpoints (produtos, categorias) permanecem iguais...

// Iniciar servidor
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
});
