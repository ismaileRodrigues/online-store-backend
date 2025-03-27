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

// Conexão com o MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-store-backend';

async function connectDB() {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado ao MongoDB');
    } catch (err) {
        console.error('❌ Erro ao conectar ao MongoDB:', err.message);
        process.exit(1);
    }
}

connectDB();

// Modelo de Estado da Loja
const storeStatusSchema = new mongoose.Schema({
    status: { type: String, required: true, enum: ['open', 'closed'] }
});

const StoreStatus = mongoose.model('StoreStatus', storeStatusSchema);

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração do multer com storage no Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'products',
        allowed_formats: ['jpg', 'jpeg', 'png']
    }
});

const upload = multer({ storage });

// Middlewares
app.use(bodyParser.json());
app.use(cors({
    origin: [
        'https://online-store-admin-portal.vercel.app',
        'https://online-store-frontend.vercel.app',
        'http://127.0.0.1:5500',
        'https://loja-online-cliente.vercel.app'
    ]
}));

// Endpoint para obter o estado da loja
app.get('/api/store-status', async (req, res) => {
    try {
        const storeStatus = await StoreStatus.findOne();
        if (!storeStatus) {
            return res.json({ status: 'closed' });
        }
        res.json({ status: storeStatus.status });
    } catch (err) {
        console.error('Erro ao obter o estado da loja:', err);
        res.status(500).json({ message: 'Erro ao obter o estado da loja.' });
    }
});

// Endpoint para atualizar o estado da loja
app.post('/api/store-status', async (req, res) => {
    const { status } = req.body;
    if (!['open', 'closed'].includes(status)) {
        return res.status(400).json({ message: 'Estado inválido da loja.' });
    }
    try {
        let storeStatus = await StoreStatus.findOne();
        if (!storeStatus) {
            storeStatus = new StoreStatus({ status });
        } else {
            storeStatus.status = status;
        }
        await storeStatus.save();
        res.json({ status: storeStatus.status });
    } catch (err) {
        console.error('Erro ao atualizar o estado da loja:', err);
        res.status(500).json({ message: 'Erro ao atualizar o estado da loja.' });
    }
});

// Outros endpoints e configuração do servidor...

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
