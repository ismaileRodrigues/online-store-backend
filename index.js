require('dotenv').config(); // Para usar variáveis de ambiente
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const products = require('./products'); // Certifique-se de que este arquivo existe e exporta os produtos como um array ou objeto

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://ismailearliene:oK7PnhpEU5UJMvm1.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao MongoDB');
}).catch((err) => {
    console.error('Erro ao conectar ao MongoDB', err);
});

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
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Endpoint para adicionar um produto
app.post('/api/products', upload.single('image'), (req, res) => {
    if (!req.body.name || !req.body.price || !req.file) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const newProduct = {
        id: products.length + 1,
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        image: req.file.path // URL da imagem armazenada no Cloudinary
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Endpoint para deletar um produto
app.delete('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const index = products.findIndex(product => product.id === productId);

    if (index !== -1) {
        products.splice(index, 1);
        res.status(204).send(); // No Content
    } else {
        res.status(404).json({ message: 'Produto não encontrado.' });
    }
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
