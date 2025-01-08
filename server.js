import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from "url";
import { z } from "zod";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Configuração para simular __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração da pasta local para upload
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const corsOptions = {
  origin: ["http://localhost:3000", "https://imobiliaria-dave.onrender.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));
app.use("/uploads", express.static(uploadPath));

// Validação do esquema
const produtoSchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  quartos: z.number().int().min(0),
  banheiros: z.number().int().min(0),
  garagem: z.number().int().min(0),
  preco: z.number().min(0),
  localizacao: z.string(),
  tipo: z.string(),
  metragemCasa: z.number().int().min(0).nullable().optional(), // Agora permite null
  metragemTerreno: z.number().int().min(0).nullable().optional(), // Agora permite null
  observacao: z.string().nullable().optional(), // Agora permite null
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Endpoint para listar todos os produtos
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { id: "desc" },
    });
    res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar produtos." });
  }
});

// Endpoint para criar produtos com upload local
app.post(
  "/produtos",
  localUpload.fields([
    { name: "foto01", maxCount: 1 },
    { name: "foto02", maxCount: 1 },
    { name: "foto03", maxCount: 1 },
    { name: "foto04", maxCount: 1 },
    { name: "foto05", maxCount: 1 },
    { name: "foto06", maxCount: 1 },
    { name: "foto07", maxCount: 1 },
    { name: "foto08", maxCount: 1 },
    { name: "foto09", maxCount: 1 },
    { name: "foto10", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("📩 Dados recebidos:", req.body);

      // Mapeando os campos para o nome esperado
      const parsedBody = {
        ...req.body,
        quartos: parseInt(req.body.quartos) || 0,
        banheiros: parseInt(req.body.banheiros) || 0,
        garagem: parseInt(req.body.garagem) || 0,
        preco: parseFloat(req.body.preco) || 0,
        metragemCasa: req.body.metragemCasa ? parseInt(req.body.metragemCasa) : undefined, // Troque null por undefined
        metragemTerreno: req.body.metragemTerreno ? parseInt(req.body.metragemTerreno) : undefined, // Troque null por undefined
        observacao: req.body.observacao || undefined, // Troque null por undefined
      };

      console.log("📤 Dados processados para validação:", parsedBody);

      // Validação com Zod
      const validData = produtoSchema.parse(parsedBody);

      // Tratamento das fotos
      const fotos = Object.fromEntries(
        Object.entries(req.files || {}).map(([key, files]) => [
          key,
          `${req.protocol}://${req.get("host")}/uploads/${files[0].filename}`,
        ])
      );

      const data = { ...validData, ...fotos };

      console.log("📤 Enviando para Prisma:", data);

      const produto = await prisma.produto.create({ data });
      res.status(201).json(produto);
    } catch (error) {
      console.error("❌ Erro ao criar produto:", error);
      res.status(400).json({
        error: error instanceof z.ZodError ? error.errors : error.message || "Erro ao criar produto.",
      });
    }
  }
);

// Inicializa o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
