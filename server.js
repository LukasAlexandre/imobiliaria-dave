import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { z } from "zod";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "imobiliaria",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1200, crop: "limit" }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 5MB por imagem
}).fields(Array.from({ length: 10 }, (_, i) => ({
  name: `foto0${i + 1}`,
  maxCount: 1,
})));

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));

const produtoSchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  descricaoPrevia: z.string(),
  status: z.enum(["Disponível", "Indisponível"]),
  quartos: z.number().int().min(0),
  banheiros: z.number().int().min(0),
  garagem: z.number().int().min(0),
  preco: z.number().min(0),
  localizacao: z.string(),
  tipo: z.string(),
  metragemCasa: z.number().int().min(0),
  metragemTerreno: z.number().int().optional(),
  foto01: z.string().nullable().optional(),
  foto02: z.string().nullable().optional(),
  foto03: z.string().nullable().optional(),
  foto04: z.string().nullable().optional(),
  foto05: z.string().nullable().optional(),
  foto06: z.string().nullable().optional(),
  foto07: z.string().nullable().optional(),
  foto08: z.string().nullable().optional(),
  foto09: z.string().nullable().optional(),
  foto10: z.string().nullable().optional(),
  observacao: z.string().optional(),
});

// POST
app.post("/produtos", upload, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "Nenhuma imagem foi enviada." });
    }

    const body = {
      ...req.body,
      quartos: parseInt(req.body.quartos, 10),
      banheiros: parseInt(req.body.banheiros, 10),
      garagem: parseInt(req.body.garagem, 10),
      preco: parseFloat(req.body.preco),
      metragemCasa: parseInt(req.body.metragemCasa, 10),
      metragemTerreno: req.body.metragemTerreno
        ? parseInt(req.body.metragemTerreno, 10)
        : undefined,
    };

    const fotos = Array.from({ length: 10 }, (_, i) =>
      req.files[`foto0${i + 1}`]?.[0]?.path || null
    );

    const produtoData = produtoSchema.parse({
      ...body,
      foto01: fotos[0],
      foto02: fotos[1],
      foto03: fotos[2],
      foto04: fotos[3],
      foto05: fotos[4],
      foto06: fotos[5],
      foto07: fotos[6],
      foto08: fotos[7],
      foto09: fotos[8],
      foto10: fotos[9],
    });

    const produto = await prisma.produto.create({ data: produtoData });
    res.status(201).json(produto);
  } catch (error) {
    console.error("Erro ao salvar produto:", error.message);
    res.status(500).json({ message: "Erro ao salvar produto", error: error.message });
  }
});

// GET todos
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany();
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar produtos", error });
  }
});

// GET por ID
app.get("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const produto = await prisma.produto.findUnique({ where: { id: Number(id) } });
    if (!produto) return res.status(404).json({ message: "Produto não encontrado" });
    res.json(produto);
  } catch (error) {
    res.status(500).json({ message: "Erro interno", error });
  }
});

// PUT atualizar
app.put("/produtos/:id", upload, async (req, res) => {
  const { id } = req.params;

  try {
    const body = {
      ...req.body,
      quartos: parseInt(req.body.quartos, 10),
      banheiros: parseInt(req.body.banheiros, 10),
      garagem: parseInt(req.body.garagem, 10),
      preco: parseFloat(req.body.preco),
      metragemCasa: parseInt(req.body.metragemCasa, 10),
      metragemTerreno: req.body.metragemTerreno
        ? parseInt(req.body.metragemTerreno, 10)
        : undefined,
    };

    const fotos = Array.from({ length: 10 }, (_, i) =>
      req.files[`foto0${i + 1}`]?.[0]?.path || req.body[`foto0${i + 1}`] || null
    );

    const produtoData = produtoSchema.parse({
      ...body,
      foto01: fotos[0],
      foto02: fotos[1],
      foto03: fotos[2],
      foto04: fotos[3],
      foto05: fotos[4],
      foto06: fotos[5],
      foto07: fotos[6],
      foto08: fotos[7],
      foto09: fotos[8],
      foto10: fotos[9],
    });

    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: produtoData,
    });

    res.json(produto);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar produto", error: error.message });
  }
});

// DELETE
app.delete("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.produto.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: "Produto excluído com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir produto" });
  }
});

app.listen(port, () => console.log(`🚀 Servidor rodando na porta ${port}`));
