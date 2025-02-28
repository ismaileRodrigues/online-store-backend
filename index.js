const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const products = require('./products');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de body parser para JSON
app.use(bodyParser.json());

// Configuração do CORS
app.use(cors({
    origin: 'https://online-store-admin-portal.vercel.app', // Permitir apenas esta origem
    methods: ['GET', 'POST', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type'], // Cabeçalhos permitidos
    credentials: true // Se precisar de cookies ou autenticação
}));

// Servir arquivos estáticos para uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome único para o arquivo
    }
});

const upload = multer({ storage });

// Endpoint para obter produtos
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
        image: `/uploads/${req.file.filename}`
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

// Inicializar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
