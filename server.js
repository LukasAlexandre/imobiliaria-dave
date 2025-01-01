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
  origin: ['http://localhost:3000', 'https://imobiliaria-dave.onrender.com/'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));
app.use('/uploads', express.static(uploadPath));

// Validação do esquema
const produtoSchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  quartos: z.number().int().min(0),
  banheiros: z.number().int().min(0),
  garagem: z.number().int().min(0),
  preco: z.number().int().min(0),
  localizacao: z.string(),
  tipo: z.string(),
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
    const produtos = await prisma.produto.findMany();
    res.status(200).json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar produtos.' });
  }
});

// Endpoint para criar produtos com upload local
app.post(
  '/produtos',
  localUpload.fields([
    { name: 'foto01', maxCount: 1 },
    { name: 'foto02', maxCount: 1 },
    { name: 'foto03', maxCount: 1 },
    { name: 'foto04', maxCount: 1 },
    { name: 'foto05', maxCount: 1 },
    { name: 'foto06', maxCount: 1 },
    { name: 'foto07', maxCount: 1 },
    { name: 'foto08', maxCount: 1 },
    { name: 'foto09', maxCount: 1 },
    { name: 'foto10', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log('Dados recebidos no backend:', req.body);
      console.log('Arquivos recebidos no backend:', req.files);

      // Validação e fallback para valores padrão
      const camposNumericos = ['quartos', 'banheiros', 'garagem', 'preco'];
      camposNumericos.forEach((campo) => {
        req.body[campo] = parseInt(req.body[campo], 10) || 0; // Converte para número inteiro ou define como 0
      });

      // Validação com Zod
      produtoSchema.parse(req.body);

      const data = {
        ...req.body,
        ...Object.fromEntries(
          Object.entries(req.files || {}).map(([key, files]) => [
            key,
            `${req.protocol}://${req.get('host')}/uploads/${files[0].filename}`,
          ])
        ),
      };
      console.log('Dados sendo enviados para o Prisma:', data);

      const produto = await prisma.produto.create({ data });
      res.status(201).json(produto);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(400).json({ error: error.message || 'Erro ao criar produto.' });
    }
  }
);

// Inicializa o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
