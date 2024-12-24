import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Resolve os caminhos de arquivos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, 'uploads');

// Garante que a pasta de uploads existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(uploadDir));
 // Serve os arquivos da pasta uploads

// Configuração do multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });

// Helper para construir URLs de arquivos
const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${port}`;

// Rotas
app.post(
    '/produtos',
    upload.fields(Array.from({ length: 10 }, (_, i) => ({ name: `foto0${i + 1}` }))),
    async (req, res) => {
      const { titulo, descricao, quartos, banheiros, garagem, preco, metragem, localizacao, tipo } = req.body;
  
      // Validação do campo "tipo"
      const validTypes = ["Apartamento", "Casa", "Terreno", "Imóvel Comercial"];
      if (!validTypes.includes(tipo)) {
        return res.status(400).json({ error: `Tipo inválido. Os valores permitidos são: ${validTypes.join(", ")}` });
      }
  
      const data = {
        titulo: titulo || null,
        descricao: descricao || null,
        quartos: parseInt(quartos) || 0,
        banheiros: parseInt(banheiros) || 0,
        garagem: parseInt(garagem) || 0,
        preco: parseFloat(preco) || 0.0,
        metragem: parseFloat(metragem) || null,
        localizacao: localizacao || null,
        tipo: tipo || null,
      };
  
      // Salva as URLs das imagens no banco de dados
      for (let i = 1; i <= 10; i++) {
        if (req.files[`foto0${i}`]?.length) {
          const uploadedFilePath = `/uploads/${req.files[`foto0${i}`][0].filename}`;
          data[`foto0${i}`] = uploadedFilePath;
        }
      }
  
      try {
        const produto = await prisma.produto.create({ data });
        res.status(201).json(produto);
        console.log('Arquivos salvos e dados inseridos no banco:', req.files);
      } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar produto' });
      }
    }
  );

app.get('/produtos', async (req, res) => {
    const baseUrl = getBaseUrl();

    try {
        const produtos = await prisma.produto.findMany();

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

// Exclui produtos com imagens associadas
app.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const produto = await prisma.produto.findUnique({ where: { id: parseInt(id) } });
        if (!produto) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        // Remove arquivos de imagens associados
        for (let i = 1; i <= 10; i++) {
            const fotoKey = `foto0${i}`;
            if (produto[fotoKey]) {
                const filePath = path.join(__dirname, produto[fotoKey]);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        await prisma.produto.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ message: 'Produto excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ error: 'Erro ao excluir produto' });
    }
});

// Inicializa o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
