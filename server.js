import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Configurações iniciais
const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
dotenv.config();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Configuração do multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper para URL base
const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${port}`;

// Rota POST: Criar produto
app.post('/produtos', upload.fields(Array.from({ length: 10 }, (_, i) => ({ name: `foto0${i + 1}` }))), async (req, res) => {
    const { titulo, descricao, quartos, banheiros, garagem, preco, metragem, localizacao } = req.body;

    const data = {
        titulo: titulo || null,
        descricao: descricao || null,
        quartos: parseInt(quartos) || 0,
        banheiros: parseInt(banheiros) || 0,
        garagem: parseInt(garagem) || 0,
        preco: parseFloat(preco) || 0.0,
        metragem: parseFloat(metragem) || null,
        localizacao: localizacao || null,
    };

    for (let i = 1; i <= 10; i++) {
        if (req.files[`foto0${i}`]?.length) {
            data[`foto0${i}`] = `/uploads/${req.files[`foto0${i}`][0].filename}`;
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

// Rota GET: Listar produtos
// Rota GET: Listar produtos
app.get('/produtos', async (req, res) => {
    const baseUrl = getBaseUrl();
    try {
        // Garante que todos os campos sejam buscados explicitamente
        const produtos = await prisma.produto.findMany({
            select: {
                id: true,
                titulo: true,
                descricao: true,
                quartos: true,
                banheiros: true,
                garagem: true,
                preco: true,
                metragem: true,
                localizacao: true,
            },
        });

        // Adiciona URLs completas para as imagens
        const produtosComImagens = produtos.map(produto => {
            for (let i = 1; i <= 10; i++) {
                const fotoKey = `foto0${i}`;
                if (produto[fotoKey]) {
                    produto[fotoKey] = `${baseUrl}${produto[fotoKey]}`;
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


// Rota PUT: Atualizar produto
app.put('/produtos/:id', upload.fields(Array.from({ length: 10 }, (_, i) => ({ name: `foto0${i + 1}` }))), async (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, quartos, banheiros, garagem, preco, metragem, localizacao } = req.body;

    const data = {
        titulo: titulo || null,
        descricao: descricao || null,
        quartos: parseInt(quartos) || 0,
        banheiros: parseInt(banheiros) || 0,
        garagem: parseInt(garagem) || 0,
        preco: parseFloat(preco) || 0.0,
        metragem: parseFloat(metragem) || null,
        localizacao: localizacao || null,
    };

    for (let i = 1; i <= 10; i++) {
        if (req.files[`foto0${i}`]?.length) {
            data[`foto0${i}`] = `/uploads/${req.files[`foto0${i}`][0].filename}`;
        }
    }

    try {
        const updatedProduto = await prisma.produto.update({
            where: { id },
            data,
        });
        res.status(200).json(updatedProduto);
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

// Rota DELETE: Excluir produto
app.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const produto = await prisma.produto.delete({ where: { id } });
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
