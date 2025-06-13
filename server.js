import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Validação com Zod
const produtoSchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  descricaoPrevia: z.string(),
  status: z.string().refine(val => ["Disponível", "Indisponível", "Disponivel", "Indisponivel"].includes(val), {
    message: "Status inválido",
  }),
  quartos: z.number().int().min(0),
  banheiros: z.number().int().min(0),
  garagem: z.number().int().min(0),
  preco: z.number().min(0),
  localizacao: z.string(),
  tipo: z.string(),
  metragemCasa: z.number().int().min(0),
  metragemTerreno: z.number().int().optional(),
  observacao: z.string().optional(),
  images: z.array(z.string()).max(10),
});

// POST /produtos
app.post("/produtos", async (req, res) => {
  try {
    const body = {
      ...req.body,
      quartos: parseInt(req.body.quartos, 10),
      banheiros: parseInt(req.body.banheiros, 10),
      garagem: parseInt(req.body.garagem, 10),
      preco: parseFloat(req.body.preco),
      metragemCasa: parseInt(req.body.metragemCasa, 10),
      metragemTerreno: req.body.metragemTerreno ? parseInt(req.body.metragemTerreno, 10) : undefined,
       images: typeof req.body.images === "string" ? JSON.parse(req.body.images) : req.body.images,
    };

    const parsed = produtoSchema.parse(body);

    const produto = await prisma.produto.create({
      data: {
        ...parsed,
        images: JSON.stringify(parsed.images),
      },
    });

    res.status(201).json(produto);
  } catch (error) {
    console.error("❌ Erro ao salvar produto:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Erro de validação", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao salvar produto", error: error.message });
  }
});

// GET /produtos
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany();
    const produtosComImagens = produtos.map(produto => ({
      ...produto,
      images: produto.images ? JSON.parse(produto.images) : [],
    }));
    res.status(200).json(produtosComImagens);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar produtos", error });
  }
});
// GET /produtos/:id
app.get("/produtos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const produto = await prisma.produto.findUnique({ where: { id } });

    if (!produto) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const produtoComImagens = {
      ...produto,
      images: produto.images ? JSON.parse(produto.images) : [],
    };

    res.status(200).json(produtoComImagens);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ message: "Erro ao buscar produto", error: error.message });
  }
});


// DELETE /produtos/:id
app.delete("/produtos/:id", async (req, res) => {
  try {
    await prisma.produto.delete({ where: { id: Number(req.params.id) } });
    res.status(200).json({ message: "Produto excluído com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir produto" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
//