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

// Configuração de upload de arquivo com multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage: storage });

// CORS Configuration
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

// Teste de conexão com o banco
const connectToDatabase = async () => {
  try {
    console.log("🔄 Tentando conectar ao banco...");
    await prisma.$connect();
    console.log("✅ Conectado ao banco MySQL com Prisma!");
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco:", error);
    process.exit(1);
  }
};

connectToDatabase();

// Validação do esquema com Zod
const produtoSchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  quartos: z.number().int().min(0),
  banheiros: z.number().int().min(0),
  garagem: z.number().int().min(0),
  preco: z.number().min(0),
  localizacao: z.string(),
  tipo: z.string(),
  metragemCasa: z.number().int().min(0),
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
  metragemTerreno: z.number().optional(),
  observacao: z.string().optional(),
});

app.post(
  "/produtos",
  upload.fields([
    { name: "foto-1", maxCount: 1 },
    { name: "foto-2", maxCount: 1 },
    { name: "foto-3", maxCount: 1 },
    { name: "foto-4", maxCount: 1 },
    { name: "foto-5", maxCount: 1 },
    { name: "foto-6", maxCount: 1 },
    { name: "foto-7", maxCount: 1 },
    { name: "foto-8", maxCount: 1 },
    { name: "foto-9", maxCount: 1 },
    { name: "foto-10", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Valida os dados do produto usando o Zod
      const produtoData = produtoSchema.parse({
        ...req.body,
        foto01: req.files["foto-1"] ? `/uploads/${req.files["foto-1"][0].filename}` : null,
        foto02: req.files["foto-2"] ? `/uploads/${req.files["foto-2"][0].filename}` : null,
        foto03: req.files["foto-3"] ? `/uploads/${req.files["foto-3"][0].filename}` : null,
        foto04: req.files["foto-4"] ? `/uploads/${req.files["foto-4"][0].filename}` : null,
        foto05: req.files["foto-5"] ? `/uploads/${req.files["foto-5"][0].filename}` : null,
        foto06: req.files["foto-6"] ? `/uploads/${req.files["foto-6"][0].filename}` : null,
        foto07: req.files["foto-7"] ? `/uploads/${req.files["foto-7"][0].filename}` : null,
        foto08: req.files["foto-8"] ? `/uploads/${req.files["foto-8"][0].filename}` : null,
        foto09: req.files["foto-9"] ? `/uploads/${req.files["foto-9"][0].filename}` : null,
        foto10: req.files["foto-10"] ? `/uploads/${req.files["foto-10"][0].filename}` : null,
      });

      // Criação do produto no banco de dados
      const novoProduto = await prisma.produto.create({
        data: produtoData,
      });
      console.log("Arquivos recebidos:", req.files);

      return res.status(201).json({ message: "Produto criado com sucesso!", produto: novoProduto });
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      return res.status(400).json({ message: error.message || "Erro ao salvar produto.", error });
    }
  }
);

// Método GET para listar produtos
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany();
    return res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return res.status(500).json({ message: "Erro ao listar produtos.", error });
  }
});

// Inicia o servidor
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
