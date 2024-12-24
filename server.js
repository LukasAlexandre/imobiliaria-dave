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
const bucketName = 'dave-bucket-imagens'; // Substitua pelo nome do seu bucket
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

// Endpoint para criar produtos com upload para o Google Cloud Storage
app.post('/produtos', upload.array('fotos', 10), async (req, res) => {
    const { titulo, descricao, quartos, banheiros, garagem, preco, metragem, localizacao, tipo } = req.body;
  
    try {
      console.log("Recebendo dados:", req.body);
  
      const urls = [];
      for (const file of req.files) {
        console.log("Arquivo recebido:", file.originalname);
        const url = await uploadToGCS(file);
        urls.push(url);
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
        fotos: urls,
      };
  
      console.log("Salvando no banco de dados:", data);
      const produto = await prisma.produto.create({ data });
      res.status(201).json(produto);
    } catch (error) {
      console.error('Erro no backend:', error.message, error.stack);
      res.status(500).json({ error: error.message });
    }
  });
  

// Endpoint para editar um produto
app.put('/produtos/:id', upload.array('fotos', 10), async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, quartos, banheiros, garagem, preco, metragem, localizacao, tipo } = req.body;

  try {
    const urls = [];
    if (req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToGCS(file);
        urls.push(url);
      }
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
      fotos: urls.length > 0 ? urls : undefined, // Atualiza apenas se houver novas fotos
    };

    const produto = await prisma.produto.update({
      where: { id: parseInt(id) },
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
      where: { id: parseInt(id) },
    });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    // Deletar as fotos associadas no Google Cloud Storage
    if (produto.fotos) {
      for (const fotoUrl of produto.fotos) {
        const fileName = fotoUrl.split('/').pop();
        await bucket.file(fileName).delete();
      }
    }

    await prisma.produto.delete({
      where: { id: parseInt(id) },
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
