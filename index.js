Pular para o conteúdo
Você disse:
verifique onde esta o erro deste script, ao adicionar o produto ele esta caindo no erro Erro ao adicionar o produto. Verifique os dados e tente novamente.
document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    await Promise.all([loadProducts(), loadCategories()]);
    hideLoading();

    const toggleStore = document.getElementById('toggle-store');

    // Carregar o estado inicial do backend
    try {
        const response = await fetch('https://online-store-backend-vw45.onrender.com/api/store-status');
        const data = await response.json();
        console.log('Estado inicial da loja:', data.status); // Log do estado inicial
        toggleStore.checked = data.status === 'open';
    } catch (error) {
        console.error('Erro ao carregar o estado inicial da loja:', error);
    }

    // Listener para mudança de estado do checkbox
    toggleStore.addEventListener('change', async function() {
        console.log('onChange started');
        const newStatus = toggleStore.checked ? 'open' : 'closed';
        console.log('Mudança detectada. Novo estado:', newStatus); // Log da mudança

        try {
            await fetch('https://online-store-backend-vw45.onrender.com/api/store-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (newStatus === 'open') {
                openStore();
            } else {
                closeStore();
            }
        } catch (error) {
            console.error('Erro ao atualizar o estado da loja:', error);
        }
        console.log('onChange completed');
    });

    // Atualizar o estado da loja baseado no estado inicial
    const storeStatus = toggleStore.checked ? 'open' : 'closed';
    console.log('Estado da loja baseado no estado inicial:', storeStatus); // Log do estado inicial baseado no checkbox
    if (storeStatus === 'open') {
        openStore();
    } else {
        closeStore();
    }

    document.getElementById('addProductForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await addProduct();
    });
});

function openStore() {
    console.log('Abrindo a loja'); // Log ao abrir a loja
    // Lógica para mostrar produtos
    document.querySelectorAll('.product').forEach(product => {
        product.style.display = 'block';
    });
}

function closeStore() {
    console.log('Fechando a loja'); // Log ao fechar a loja
    // Lógica para esconder produtos
    document.querySelectorAll('.product').forEach(product => {
        product.style.display = 'none';
    });
}

let products = [];
let categories = [];

function displayError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'none';
}

function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

async function loadProducts() {
    try {
        const response = await fetch('https://online-store-backend-vw45.onrender.com/api/products', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) throw new Error(HTTP error! status: ${response.status});
        products = await response.json();
        renderProducts();
        hideError();
    } catch (error) {
        console.error('Error loading products:', error);
        displayError('Erro ao carregar produtos. Tente novamente mais tarde.');
    }
}

async function loadCategories() {
    try {
        const response = await fetch('https://online-store-backend-vw45.onrender.com/api/categories', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) throw new Error(HTTP error! status: ${response.status});
        categories = await response.json();
        updateCategoryOptions();
        displayCategories();
        hideError();
    } catch (error) {
        console.error('Error loading categories:', error);
        displayError('Erro ao carregar categorias. Tente novamente mais tarde.');
    }
}

function updateCategoryOptions() {
    const productCategorySelect = document.getElementById('productCategory');
    productCategorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.replace('-', ' ');
        productCategorySelect.appendChild(option);
    });
}

function displayCategories() {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';
    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.classList.add('category-item');
        categoryItem.innerHTML = 
            <input type="text" value="${category.replace('-', ' ')}" data-category="${category}" readonly>
            <button class="remove-btn" onclick="removeCategory('${category}')">Remover</button>
        ;
        categoriesList.appendChild(categoryItem);
    });
}

function renderProducts() {
    const productsDiv = document.getElementById('products');
    productsDiv.innerHTML = '';

    const productsByCategory = {};
    products.forEach(product => {
        const category = product.category || 'sem-categoria';
        if (!productsByCategory[category]) {
            productsByCategory[category] = [];
        }
        productsByCategory[category].push(product);
    });

    Object.keys(productsByCategory).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('category');
        categoryDiv.innerHTML = <h3>${category.replace('-', ' ')}</h3>;
        productsDiv.appendChild(categoryDiv);

        productsByCategory[category].forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product');
            productDiv.innerHTML = 
                <h4>${product.name}</h4>
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <p>${product.description}</p>
                <p>Preço: R$ ${product.price.toFixed(2)}</p>
                <button onclick="confirmDeleteProduct('${product._id}')">Excluir Produto</button>
            ;
            categoryDiv.appendChild(productDiv);
        });
    });
}

async function addProduct() {
    showLoading();
    const formData = new FormData();
    formData.append('name', document.getElementById('productName').value);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('image', document.getElementById('productImage').files[0]);
    formData.append('category', document.getElementById('productCategory').value);

    try {
        const response = await fetch('https://online-store-backend-vw45.onrender.com/api/products', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error(HTTP error! status: ${response.status});
        const product = await response.json();
        products.push(product);
        renderProducts();
        document.getElementById('addProductForm').reset();
        hideError();
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        displayError('Erro ao adicionar o produto. Verifique os dados e tente novamente.');
    } finally {
        hideLoading();
    }
}

async function confirmDeleteProduct(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        await deleteProduct(id);
    }
}

async function deleteProduct(id) {
    showLoading();
    try {
        const response = await fetch(https://online-store-backend-vw45.onrender.com/api/products/${id}, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(HTTP error! status: ${response.status});
        products = products.filter(product => product._id !== id);
        renderProducts();
        hideError();
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        displayError('Erro ao excluir o produto. Tente novamente.');
    } finally {
        hideLoading();
    }
}

async function addCategory() {
    showLoading();
    const newCategoryName = document.getElementById('newCategoryName').value.trim();
    if (!newCategoryName) {
        hideLoading();
        return displayError('Por favor, insira o nome da categoria.');
    }

    try {
        const response = await fetch('https://online-store-backend-vw45.onrender.com/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newCategoryName })
        });
        if (!response.ok) throw new Error(HTTP error! status: ${response.status});
        await loadCategories(); // Recarrega a lista de categorias
        document.getElementById('manageCategoriesForm').reset();
        hideError();
    } catch (error) {
        console.error('Erro ao adicionar categoria:', error);
        displayError(error.message.includes('já existe') ? 'Esta categoria já existe.' : 'Erro ao adicionar categoria.');
    } finally {
        hideLoading();
    }
}

async function removeCategory(category) {
    if (confirm('Tem certeza que deseja remover esta categoria? Isso afetará os produtos associados.')) {
        showLoading();
        try {
            const response = await fetch(https://online-store-backend-vw45.onrender.com/api/categories/${category}, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error(HTTP error! status: ${response.status});
            products = products.map(product => {
                if (product.category === category) {
                    product.category = '';
                }
                return product;
            });
            await loadCategories(); // Recarrega a lista de categorias
            renderProducts();
            hideError();
        } catch (error) {
            console.error('Erro ao remover categoria:', error);
            displayError('Erro ao remover categoria.');
        } finally {
            hideLoading();
        }
    }
}
O ChatGPT disse:
Seu script parece estar bem estruturado, mas como você está recebendo a mensagem genérica:

"Erro ao adicionar o produto. Verifique os dados e tente novamente."

Precisamos investigar algumas causas comuns para isso no trecho addProduct. Vamos analisar os pontos principais que podem estar gerando esse erro:

✅ 1. O endpoint aceita FormData corretamente?
Você está enviando o formulário com FormData, o que não adiciona o header Content-Type: multipart/form-data automaticamente, e isso pode causar problemas se o backend estiver esperando esse header explicitamente.

Correção no backend (Node.js exemplo):
Certifique-se de que o backend use algo como multer para lidar com multipart/form-data sem depender de cabeçalhos manuais.

✅ 2. Campo de imagem está sendo enviado?
Se o usuário não escolher uma imagem, document.getElementById('productImage').files[0] será undefined, e o FormData enviará um campo vazio, o que pode fazer com que o backend falhe ao tentar processar.

Solução:

const imageInput = document.getElementById('productImage');
if (imageInput.files.length === 0) {
    hideLoading();
    return displayError('Selecione uma imagem para o produto.');
}
formData.append('image', imageInput.files[0]);
✅ 3. Backend retorna status 400/500?
Se o backend retornar um erro HTTP como 400 ou 500, ele é capturado aqui:

if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
Solução útil para debug:
Adicione um console.log para o corpo da resposta de erro:

try {
    const response = await fetch(...);
    if (!response.ok) {
        const errorBody = await response.text(); // ou response.json() se souber que é JSON
        console.error('Resposta do backend:', errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    ...
} catch (error) {
    console.error('Erro ao adicionar produto:', error);
    displayError('Erro ao adicionar o produto. Verifique os dados e tente novamente.');
}
✅ 4. Categoria está sendo enviada corretamente?
Se productCategory estiver vazio, pode causar erro no backend, especialmente se for obrigatório.

Solução:
Valide os campos antes de enviar:

const name = document.getElementById('productName').value.trim();
const price = document.getElementById('productPrice').value.trim();
const category = document.getElementById('productCategory').value.trim();

if (!name || !price || !category) {
    hideLoading();
    return displayError('Preencha todos os campos obrigatórios.');
}
✅ 5. Verifique CORS e políticas de segurança
Se o backend estiver em outro domínio e não estiver configurado corretamente para aceitar CORS, você pode ver erro de fetch, principalmente em ambientes como o Render.

Verifique no console de rede (DevTools > Network > aba da requisição) se há erro de CORS.

✅ Resumo de recomendações
✅ Adicione validação de campos no front-end antes de enviar.

✅ Verifique se a imagem está sendo enviada corretamente.

✅ Adicione console.log(await response.text()) para ver o que o backend está dizendo.

✅ Confirme se o backend aceita FormData e lida com arquivos corretamente.

✅ Verifique a aba "Network" do DevTools para inspecionar a requisição que falha.

Se quiser, posso ajudar você a testar e ajustar seu backend também (se for em Node.js/Express, por exemplo). É só colar o código da rota /api/products.

Você disse:
aqui esta o backend

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
        'http://127.0.0.1:5500',
        'https://loja-oline-cliente.vercel.app',
        'https://donutstia-loja-online.vercel.app',

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
            await cloudinary.uploader.destroy(products/${publicId});
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
        console.log(🚀 Servidor rodando na porta ${PORT});
    });
});
O ChatGPT disse:
Obrigado por compartilhar o backend. O código está bem estruturado, mas com base na mensagem de erro que você mostrou antes:

net::ERR_CONNECTION_REFUSED
Esse erro significa que o frontend está tentando se conectar a um servidor que não está aceitando conexões no endereço/porta especificado. Aqui vão algumas verificações e sugestões para resolver o problema:

✅ 1. O servidor backend está realmente rodando?
Confirme se o backend está de fato ativo.

Ao iniciar com node server.js (ou como estiver nomeado), deve aparecer:

✅ Conectado ao MongoDB
🚀 Servidor rodando na porta 3000
✅ 2. O frontend está apontando para o endereço correto?
Verifique no frontend qual URL está sendo usada para chamar a API, por exemplo:

fetch("http://localhost:3000/api/products") // ← isso pode gerar problema em produção
Se estiver em produção ou usando o Vercel, não pode chamar localhost, pois o navegador tentará conectar ao localhost do dispositivo do usuário, que não tem seu backend rodando.

✅ SOLUÇÃO:
Mude para a URL pública da API no frontend:

fetch("https://SEU-BACKEND-DEPLOYADO/api/products")
Se ainda estiver testando localmente:

Certifique-se de que o frontend está acessando http://localhost:3000 ou outro valor correspondente ao endereço real do backend.

✅ 3. Você já publicou o backend?
Se sim, em qual serviço? (Render, Railway, Vercel Functions, etc.)

Caso não tenha publicado:

O frontend hospedado na Vercel não conseguirá se comunicar com seu backend local (localhost), e por isso você precisa subir seu backend para um servidor online como:

Alternativas para hospedar seu backend:
Render (simples e gratuito)

Railway

Fly.io

Se quiser, posso te ajudar a configurar em qualquer um deles.

✅ 4. CORS está configurado corretamente?
Sim! O backend já permite essas origens:

cors({
  origin: [
    'https://online-store-admin-portal.vercel.app',
    'http://127.0.0.1:5500',
    'https://loja-oline-cliente.vercel.app',
    'https://donutstia-loja-online.vercel.app'
  ]
})
Garanta que a URL do frontend esteja exatamente igual a alguma das listadas (sem barra no final, sem www, etc.).

✅ 5. Checklist final
Verificação	✅
Backend está rodando (node index.js)	
Frontend usa a URL correta da API	
CORS está permitindo a origem correta	✅
Backend está online e acessível publicamente?	
Se quiser, posso te ajudar a:

Subir o backend para um servidor online.

Ajustar o frontend para usar o endpoint correto.

Você já tem o backend publicado em algum lugar?

Você disse:
Imagem carregada
veja estou usando o render 
O ChatGPT disse:
Ótimo! Como você está usando o Render e o backend já está publicado, o próximo passo é garantir que o frontend esteja chamando o backend pela URL correta.

✅ Passo 1: Use a URL correta da API no frontend
Na sua tela do Render aparece a URL pública do backend:

https://online-store-backend-vw45.onrender.com
Então, no frontend, substitua qualquer chamada para localhost por essa URL.

Por exemplo, se você tiver algo assim:

fetch("http://localhost:3000/api/products")
Troque para:

fetch("https://online-store-backend-vw45.onrender.com/api/products")
✅ Passo 2: Garanta que seu backend esteja aceitando requisições da origem correta (CORS)
No seu backend, você já adicionou essa linha:

cors({
  origin: [
    'https://online-store-admin-portal.vercel.app',
    'http://127.0.0.1:5500',
    'https://loja-oline-cliente.vercel.app',
    'https://donutstia-loja-online.vercel.app'
  ]
});
✔ Verifique se a URL do frontend que você está usando está exatamente igual (sem barra no final, sem www, etc).

✅ Passo 3: Testar no navegador
Abra o console do navegador (F12)

Vá até a aba "Network"

Atualize a página e veja se as chamadas fetch para a API aparecem com status 200 OK

Se der erro, veja a mensagem completa – ela ajuda a identificar se o problema é CORS, rota inexistente, etc.

✅ Extra: Render demora para acordar
Como você está na versão gratuita do Render, seu backend pode demorar 30 a 60 segundos para "acordar" se estiver inativo. Durante esse tempo inicial, a requisição pode falhar. Recarregue a página e aguarde o backend acordar.

✅ Resumo
 Backend no Render ✅

 Usar URL correta no frontend ✅ https://online-store-backend-vw45.onrender.com

 CORS configurado ✅

 Testar requisições no navegador

Se quiser, posso revisar seu código frontend (só colar aqui a parte que chama a API), e também posso te ajudar a criar um pequeno health check para manter seu backend “acordado” com menos lentidão. Deseja isso?

Você disse:
==> Cloning from https://github.com/ismaileRodrigues/online-store-backend
==> Checking out commit 3b2d0a087a2b39f043ec8369d2b01e10e7618f07 in branch main
==> Downloading cache...
==> Transferred 240MB in 8s. Extraction took 7s.
==> Using Node.js version 22.12.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Using Bun version 1.1.0 (default)
==> Docs on specifying a bun version: https://render.com/docs/bun-version
==> Running build command 'npm install'...
changed 3 packages, and audited 285 packages in 11s
32 packages are looking for funding
  run npm fund for details
found 0 vulnerabilities
==> Uploading build...
==> Uploaded in 3.8s. Compression took 1.9s
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
> online-store@1.0.0 start
> node index.js
/opt/render/project/src/index.js:67
});
 ^
SyntaxError: missing ) after argument list
    at wrapSafe (node:internal/modules/cjs/loader:1515:18)
    at Module._compile (node:internal/modules/cjs/loader:1537:20)
    at Object..js (node:internal/modules/cjs/loader:1708:10)
    at Module.load (node:internal/modules/cjs/loader:1318:32)
    at Function._load (node:internal/modules/cjs/loader:1128:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:219:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:170:5)
    at node:internal/main/run_main_module:36:49
Node.js v22.12.0
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'npm start'
> online-store@1.0.0 start
> node index.js
/opt/render/project/src/index.js:67
});
 ^
SyntaxError: missing ) after argument list
    at wrapSafe (node:internal/modules/cjs/loader:1515:18)
    at Module._compile (node:internal/modules/cjs/loader:1537:20)
    at Object..js (node:internal/modules/cjs/loader:1708:10)
    at Module.load (node:internal/modules/cjs/loader:1318:32)
    at Function._load (node:internal/modules/cjs/loader:1128:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:219:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:170:5)
    at node:internal/main/run_main_module:36:49
Node.js v22.12.0
O ChatGPT disse:
O erro que você está enfrentando na Render é:

SyntaxError: missing ) after argument list
Isso indica que você tem um parêntese faltando no seu arquivo index.js, mais precisamente na linha 67.

✅ Como corrigir:
Abra seu arquivo index.js e vá até a linha 67. Provavelmente você tem algo assim:

app.use(cors({
  origin: [
    'https://online-store-admin-portal.vercel.app',
    'http://127.0.0.1:5500',
    'https://loja-oline-cliente.vercel.app',
    'https://donutstia-loja-online.vercel.app'
  ]
}); // <- Aqui está o erro
Note que a linha termina com }); — mas você abriu apenas um parêntese depois do cors(, então não pode ter dois fechamentos.

✅ Correção:
Você precisa fechar corretamente a função cors(...) antes de passar para app.use.

Substitua por:

app.use(cors({
  origin: [
    'https://online-store-admin-portal.vercel.app',
    'http://127.0.0.1:5500',
    'https://loja-oline-cliente.vercel.app',
    'https://donutstia-loja-online.vercel.app'
  ]
}));
Observe que agora os parênteses estão bem balanceados: abre ( com cors({, e fecha com })).

✅ Próximos passos:
Salve o arquivo corrigido

Faça commit e push no GitHub:

git add index.js
git commit -m "Corrige erro de sintaxe na configuração do CORS"
git push origin main
O Render fará o deploy automático

Acompanhe o log da Render — deve aparecer Build successful 🎉 sem erro

Se quiser, posso revisar seu index.js inteiro se você colar ele aqui. Assim evitamos outros erros escondidos. Deseja isso?

Você disse:
por favor corrija o codigo

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
    'http://127.0.0.1:5500',
    'https://loja-oline-cliente.vercel.app',
    'https://donutstia-loja-online.vercel.app'
  ]
}); // <- Aqui está o erro


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
            await cloudinary.uploader.destroy(products/${publicId});
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
        console.log(🚀 Servidor rodando na porta ${PORT});
    });
});
O ChatGPT disse:
Aqui está o código corrigido — o erro estava na linha onde você configurou o cors(). Faltava um parêntese de fechamento correto.

Segue o trecho corrigido e o código completo:

✅ Linha corrigida:
app.use(cors({
  origin: [
    'https://online-store-admin-portal.vercel.app',
    'http://127.0.0.1:5500',
    'https://loja-oline-cliente.vercel.app',
    'https://donutstia-loja-online.vercel.app'
  ]
}));
✅ Código completo corrigido:
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
    'http://127.0.0.1:5500',
    'https://loja-oline-cliente.vercel.app',
    'https://donutstia-loja-online.vercel.app'
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
Pronto para subir! Faça git add, commit, e push e o Render deve rodar sem erros. Se quiser, posso ajudar a criar testes ou documentação também.




Nenhum arquivo escolhidoNenhum arquivo escolhido
O ChatGPT pode cometer erros. Considere verificar informações importantes.
