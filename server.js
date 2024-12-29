import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { z } from 'zod';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Configuração para simular __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração da pasta local para upload
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
const corsOptions = {
  origin: ['http://localhost:3000', 'https://seu-frontend-onrender.com'], // Substitua pelo domínio correto do seu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(cors(corsOptions));
app.use('/uploads', express.static(uploadPath));
const produtoSchema = z.object({
  titulo: z.string().nullable(),
  descricao: z.string().nullable(),
  quartos: z.number().min(0),
  banheiros: z.number().min(0),
  garagem: z.number().min(0),
  preco: z.number().min(0),
  metragemCasa: z.number().min(0),
  metragemTerreno: z.number().min(0),
  localizacao: z.string().nullable(),
  tipo: z.string().nullable(),
  observacoes: z.string().nullable(),
});
// Configuração do multer para salvar arquivos localmente
const localUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
});

// Endpoint para listar todos os produtos
app.get('/produtos', async (req, res) => {
  try {
    console.log('Tentando buscar produtos...');
    const produtos = await prisma.produto.findMany();
    console.log('Produtos encontrados:', produtos);
    res.status(200).json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar produtos.' });
  }
});

// Endpoint para criar produtos com upload local
app.post('/produtos', localUpload.fields([...]), async (req, res) => {
  try {
    // Validação
    produtoSchema.parse(req.body);

    const data = {
      ...req.body,
      preco: parseFloat(req.body.preco),
      quartos: parseInt(req.body.quartos),
      banheiros: parseInt(req.body.banheiros),
      garagem: parseInt(req.body.garagem),
      metragemCasa: parseFloat(req.body.metragemCasa),
      metragemTerreno: parseFloat(req.body.metragemTerreno),
    };

    // Lógica para salvar no banco
    const produto = await prisma.produto.create({ data });
    res.status(201).json(produto);
  } catch (error) {
    res.status(400).json({ error: 'Erro de validação: ' + error.message });
  }
});

// Endpoint para deletar um produto
app.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const produto = await prisma.produto.findUnique({
      where: { id },
    });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    // Deletar as fotos associadas no diretório local
    for (let i = 1; i <= 10; i++) {
      const fotoKey = `foto0${i}`;
      if (produto[fotoKey]) {
        const filePath = path.join(uploadPath, path.basename(produto[fotoKey]));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await prisma.produto.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Produto deletado com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto.' });
  }
});

// Inicializa o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
