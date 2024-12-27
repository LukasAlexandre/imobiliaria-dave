import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Configuração para simular __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração da pasta local para upload no Render
const uploadPath = '/var/data/uploads';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(uploadPath));

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
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// Endpoint para criar produtos com upload local
console.log(data)


// Endpoint para editar um produto
app.put(
  '/produtos/:id',
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
    const { id } = req.params;
    const {
      titulo,
      descricao,
      quartos,
      banheiros,
      garagem,
      preco,
      metragemCasa,
      metragemTerreno,
      localizacao,
      tipo,
      observacoes,
    } = req.body;

    try {
      const data = {
        titulo: titulo || null,
        descricao: descricao || null,
        quartos: parseInt(quartos) || 0,
        banheiros: parseInt(banheiros) || 0,
        garagem: parseInt(garagem) || 0,
        preco: parseFloat(preco) || 0,
        metragemCasa: parseFloat(metragemCasa) || 0,
        metragemTerreno: parseFloat(metragemTerreno) || 0,
        localizacao: localizacao || null,
        tipo: tipo || null,
        observacoes: observacoes || null,
      };

      console.log('Dados prontos para salvar no banco:', data);

      const urls = {};
      for (const fieldName in req.files) {
        const file = req.files[fieldName][0];
        const url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        urls[fieldName] = url;
      }

      console.log('URLs geradas:', urls);

      const produto = await prisma.produto.create({
        data: { ...data, ...urls },
      });

      res.status(201).json(produto);
    } catch (error) {
      console.error('Erro ao criar produto:', error.message, error.stack);
      res.status(500).json({ error: error.message });
    }

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
