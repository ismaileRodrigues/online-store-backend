require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://https://online-store-backend-vw45.onrender.com';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao MongoDB');
}).catch((err) => {
    console.error('Erro ao conectar ao MongoDB', err);
});

// Definindo o modelo de Produto
const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    image: String // URL da imagem no Cloudinary
});

const Product = mongoose.model('Product', productSchema);

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || 'dopruzxku',
    api_key: process.env.CLOUD_API_KEY || '536127753752631',
    api_secret: process.env.CLOUD_API_SECRET || 'HawnvSLpWas_QkTYyqoPw4yb9OI'
});

// Configuração do multer com storage no Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'products', // Pasta onde as imagens serão armazenadas no Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png'] // Formatos permitidos
    }
});

const upload = multer({ storage });

app.use(bodyParser.json());
app.use(cors());

// Endpoint para listar produtos
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// Endpoint para adicionar um produto
app.post('/api/products', upload.single('image'), async (req, res) => {
    if (!req.body.name || !req.body.price || !req.file) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const newProduct = new Product({
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        image: req.file.path // URL da imagem armazenada no Cloudinary
    });

    await newProduct.save();
    res.status(201).json(newProduct);
});

// Endpoint para deletar um produto
app.delete('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    res.status(204).send(); // No Content
});

// Tratamento de erros globais
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Algo deu errado!' });
});

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
