import { PrismaClient } from '@prisma/client';
import connectDB from './connectMongo.js';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Variáveis
const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Middleware de upload do multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funções
connectDB();
dotenv.config();
app.use(express.json());
app.use(cors());

// Configuração de destino e nome do arquivo para upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // A pasta onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Nome do arquivo
    }
});

const upload = multer({ storage: storage });

// Rota POST para upload de arquivos e dados do produto
app.post('/produtos', upload.fields([
    { name: 'foto01' },
    { name: 'foto02' },
    { name: 'foto03' },
    { name: 'foto04' },
    { name: 'foto05' },
    { name: 'foto06' },
    { name: 'foto07' },
    { name: 'foto08' },
    { name: 'foto09' },
    { name: 'foto10' }
]), async (req, res) => {
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    const data = {
        descricao: req.body.descricao,
        quartos: parseInt(req.body.quartos),
        banheiros: parseInt(req.body.banheiros),
        garagem: parseInt(req.body.garagem),
        preco: parseFloat(req.body.preco),
    };

    // Adicione as fotos se existirem
    for (let i = 1; i <= 10; i++) {
        if (req.files[`foto0${i}`] && req.files[`foto0${i}`].length > 0) {
            data[`foto0${i}`] = req.files[`foto0${i}`][0].path;
        }
    }

    console.log('Dados do produto:', data);

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
    console.log('Recebida uma requisição para a rota /produtos');
    try {
        const produtos = await prisma.produto.findMany();
        console.log('Produtos encontrados:', produtos);
        res.json(produtos);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).send('Erro ao buscar produtos');
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`O servidor está rodando na porta ${port}`);   
});
