import { PrismaClient } from '@prisma/client';
import connectDB from './connectMongo.js';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
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
    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

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

// Rota PUT para editar um produto existente
// Rota PUT para editar um produto existente
app.put('/produtos/:id', upload.fields([
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
    const { id } = req.params;
    const { descricao, quartos, banheiros, garagem, preco } = req.body;

    // Dados do produto para atualização
    const data = { descricao, quartos: parseInt(quartos), banheiros: parseInt(banheiros), garagem: parseInt(garagem), preco: parseFloat(preco) };

    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

    // Verifica e atualiza as imagens
    for (let i = 1; i <= 10; i++) {
        if (req.files[`foto0${i}`] && req.files[`foto0${i}`].length > 0) {
            data[`foto0${i}`] = `${baseUrl}/uploads/${req.files[`foto0${i}`][0].filename}`;
        }
    }

    try {
        const produto = await prisma.produto.update({
            where: { id: id },  // Busca o produto pelo ID
            data,               // Dados a serem atualizados
        });

        res.status(200).json(produto); // Retorna o produto atualizado
    } catch (error) {
        console.error('Erro ao editar produto:', error);
        res.status(500).json({ error: 'Erro ao editar produto' });
    }
});


// Rota DELETE para excluir um produto
app.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;  // ID do produto que será deletado
  
    try {
      // Não é necessário usar parseInt, pois o ID é uma String do MongoDB
      const produto = await prisma.produto.delete({
        where: {
          id: id,  // Passa o ID diretamente como uma String
        },
      });
  
      res.status(200).json(produto);  // Retorna o produto excluído
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      res.status(500).json({
        message: "Erro ao deletar produtos",
        error: error.message,
      });
    }
  });
  




  
  

// Iniciando o servidor
app.listen(port, () => {
    console.log(`O servidor está rodando na porta ${port}`);   
});
