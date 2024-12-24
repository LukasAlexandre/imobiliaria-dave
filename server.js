import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
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
  keyFilename: path.join(__dirname, 'config/seu-arquivo-credenciais.json'), // Caminho para o arquivo JSON
});
const bucketName = 'meu-bucket-imagens'; // Substitua pelo nome do seu bucket
const bucket = storage.bucket(bucketName);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Configuração do multer
const upload = multer({ storage: multer.memoryStorage() }); // Armazena arquivos na memória temporária

// Função para fazer upload para o Google Cloud Storage
const uploadToGCS = (file) => {
  return new Promise((resolve, reject) => {
    const blob = bucket.file(file.originalname);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream
      .on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
        resolve(publicUrl);
      })
      .on('error', (err) => {
        reject(err);
      })
      .end(file.buffer);
  });
};

// Endpoint para criar produtos com upload para o Google Cloud Storage
app.post('/produtos', upload.array('fotos', 10), async (req, res) => {
  const { titulo, descricao, quartos, banheiros, garagem, preco, metragem, localizacao, tipo } = req.body;

  try {
    const urls = [];
    for (const file of req.files) {
      const url = await uploadToGCS(file);
      urls.push(url); // Salva as URLs das imagens
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
      fotos: urls, // Armazena as URLs das imagens no banco
    };

    const produto = await prisma.produto.create({ data });
    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    res.status(500).json({ error: 'Erro ao salvar produto.' });
  }
});

// Inicializa o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
