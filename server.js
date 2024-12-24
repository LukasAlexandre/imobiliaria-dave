import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Storage } from '@google-cloud/storage';
import cors from 'cors';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Configuração para simular __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, './config/node-project-dave-ac102d9d064e.json'), // Caminho para o arquivo JSON
});
const bucketName = 'dave-bucket-imagens'; // Substitua pelo nome do seu bucket
const bucket = storage.bucket(bucketName);

// Configuração da pasta local para upload no Render
const uploadPath = '/var/data/uploads';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

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

// Função para fazer upload para o Google Cloud Storage
const uploadToGCS = (filePath, fileName) => {
  return new Promise((resolve, reject) => {
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream
      .on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        resolve(publicUrl);
      })
      .on('error', (err) => {
        reject(err);
      });

    fs.createReadStream(filePath).pipe(blobStream);
  });
};

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

// Endpoint para criar produtos com upload local e para o Google Cloud Storage
app.post('/produtos', localUpload.fields([
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
]), async (req, res) => {
  const { titulo, descricao, quartos, banheiros, garagem, preco, metragem, localizacao, tipo } = req.body;

  try {
    const urls = {};

    for (const fieldName in req.files) {
      const file = req.files[fieldName][0];
      const filePath = path.join(uploadPath, file.filename);
      const url = await uploadToGCS(filePath, file.filename);
      urls[fieldName] = url;

      // Remover o arquivo local após o upload para o GCS
      fs.unlinkSync(filePath);
    }

    const data = {
      titulo,
      descricao,
      quartos: parseInt(quartos),
      banheiros: parseInt(banheiros),
      garagem: parseInt(garagem),
      preco: parseFloat(preco),
      metragem: parseFloat(metragem),
      localizacao,
      tipo,
      ...urls, // Inclui foto01, foto02, ..., foto10
    };

    const produto = await prisma.produto.create({ data });
    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro no backend:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para editar um produto
app.put('/produtos/:id', localUpload.fields([
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
]), async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, quartos, banheiros, garagem, preco, metragem, localizacao, tipo } = req.body;

  try {
    const urls = {};

    for (const fieldName in req.files) {
      const file = req.files[fieldName][0];
      const filePath = path.join(uploadPath, file.filename);
      const url = await uploadToGCS(filePath, file.filename);
      urls[fieldName] = url;

      // Remover o arquivo local após o upload para o GCS
      fs.unlinkSync(filePath);
    }

    const data = {
      titulo,
      descricao,
      quartos: parseInt(quartos),
      banheiros: parseInt(banheiros),
      garagem: parseInt(garagem),
      preco: parseFloat(preco),
      metragem: parseFloat(metragem),
      localizacao,
      tipo,
      ...urls, // Atualiza fotos apenas se houver novas
    };

    const produto = await prisma.produto.update({
      where: { id },
      data,
    });

    res.status(200).json(produto);
  } catch (error) {
    console.error('Erro ao editar produto:', error);
    res.status(500).json({ error: 'Erro ao editar produto.' });
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

    // Deletar as fotos associadas no Google Cloud Storage
    for (let i = 1; i <= 10; i++) {
      const fotoKey = `foto0${i}`;
      if (produto[fotoKey]) {
        const fileName = produto[fotoKey].split('/').pop();
        await bucket.file(fileName).delete();
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
