import { PrismaClient } from '@prisma/client';
import connectDB from './connectMongo.js';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Variáveis e configurações iniciais
const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
dotenv.config();
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Configuração de upload do multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use((req, res, next) => {
    console.log('Body recebido:', req.body);
    next();
});
console.log(`Servidor rodando em ${getBaseUrl()}`);

// Base URL para imagens
const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${port}`;

// Rota POST para criar um produto
app.post('/produtos', upload.fields(Array.from({ length: 10 }, (_, i) => ({ name: `foto0${i + 1}` }))), async (req, res) => {
    const { descricao, quartos, banheiros, garagem, preco } = req.body;
    const data = {
        descricao,
        quartos: parseInt(quartos),
        banheiros: parseInt(banheiros),
        garagem: parseInt(garagem),
        preco: parseFloat(preco),
    };

    const baseUrl = getBaseUrl();
    for (let i = 1; i <= 10; i++) {
        if (req.files[`foto0${i}`] && req.files[`foto0${i}`].length > 0) {
            data[`foto0${i}`] = `${baseUrl}/uploads/${req.files[`foto0${i}`][0].filename}`;
        }
    }

    try {
        const produto = await prisma.produto.create({ data });
        res.status(201).json(produto);
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
});

// Rota GET para listar todos os produtos
app.get('/produtos', async (req, res) => {
    const baseUrl = getBaseUrl();
    try {
        const produtos = await prisma.produto.findMany();
        const produtosComImagens = produtos.map(produto => {
            for (let i = 1; i <= 10; i++) {
                const fotoKey = `foto0${i}`;
                if (produto[fotoKey]) {
                    produto[fotoKey] = `${baseUrl}/${produto[fotoKey].replace(/\\/g, '/')}`;
                }
            }
            return produto;
        });
        res.json(produtosComImagens);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).send('Erro ao buscar produtos');
    }
});

// Rota PUT para atualizar um produto
app.put('/produtos/:id', upload.fields(Array.from({ length: 10 }, (_, i) => ({ name: `foto0${i + 1}` }))), async (req, res) => {
    const { id } = req.params;
    const { descricao, quartos, banheiros, garagem, preco } = req.body;
    const data = {
        descricao,
        quartos: parseInt(quartos),
        banheiros: parseInt(banheiros),
        garagem: parseInt(garagem),
        preco: parseFloat(preco),
    };

    const baseUrl = getBaseUrl();
    for (let i = 1; i <= 10; i++) {
        if (req.files[`foto0${i}`] && req.files[`foto0${i}`].length > 0) {
            data[`foto0${i}`] = `${baseUrl}/uploads/${req.files[`foto0${i}`][0].filename}`;
        }
    }

    try {
        const updatedProduto = await prisma.produto.update({
            where: { id: parseInt(id) },
            data,
        });
        res.status(200).json(updatedProduto);
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

// Rota DELETE para excluir um produto
app.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const produto = await prisma.produto.delete({ where: { id: parseInt(id) } });
        res.status(200).json(produto);
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
