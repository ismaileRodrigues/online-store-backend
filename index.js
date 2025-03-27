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

// Endpoint para listar categorias
app.get('/api/categories', async (req, res) => {
    console.log("Endpoint /api/categories acessado");
    try {
        const categories = await Category.find();
        res.json(categories.map(cat => cat.name));
    } catch (err) {
        console.error('Erro ao listar categorias:', err);
        res.status(500).json({ message: 'Erro ao listar categorias.', error: err.message });
    }
});

// Endpoint para listar produtos
app.get('/api/products', async (req, res) => {
    console.log("Endpoint /api/products acessado");
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error('Erro ao listar produtos:', err);
        res.status(500).json({ message: 'Erro ao listar produtos.', error: err.message });
    }
});

// Endpoint para adicionar uma categoria
app.post('/api/categories', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
    }
    try {
        const newCategory = new Category({ name });
        await newCategory.save();
        res.status(201).json({ name });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Esta categoria já existe.' });
        }
        console.error('Erro ao adicionar categoria:', err);
        res.status(500).json({ message: 'Erro ao adicionar categoria.', error: err.message });
    }
});

// Endpoint para deletar uma categoria
app.delete('/api/categories/:name', async (req, res) => {
    const { name } = req.params;
    try {
        const category = await Category.findOneAndDelete({ name });
        if (!category) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar categoria:', err);
        res.status(500).json({ message: 'Erro ao deletar categoria.', error: err.message });
    }
});

// Endpoint para adicionar um produto
app.post('/api/products', upload.single('image'), async (req, res) => {
    if (!req.body.name || !req.body.price || !req.file) {
        return res.status(400).json({ message: 'Nome, preço e imagem são obrigatórios.' });
    }
    try {
        const newProduct = new Product({
            name: req.body.name,
            description: req.body.description || '',
            price: parseFloat(req.body.price),
            image: req.file.path,
            category: req.body.category || ''
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Erro ao adicionar produto:', err);
        res.status(500).json({ message: 'Erro ao adicionar produto.', error: err.message });
    }
});

// Endpoint para deletar um produto
app.delete('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        if (product.image) {
            const publicId = product.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`products/${publicId}`);
        }
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar produto:', err);
        res.status(500).json({ message: 'Erro ao deletar produto.', error: err.message });
    }
});

// Tratamento de erros globais
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Algo deu errado!' });
});

// Iniciar servidor
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
});
