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
  fotos: z.array(z.string()).min(1).max(10), // Aceita URLs ou nomes de arquivos
  metragemTerreno: z.number().optional(),
  observacao: z.string().optional(),
});

// Método POST para salvar produto
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
      // Coleta as URLs das fotos a partir dos arquivos
      const fotosUrls = Object.values(req.files || {}).map(
        (files) => `/uploads/${files[0].filename}`
      );

      // Verifica se pelo menos uma foto foi enviada
      if (fotosUrls.length === 0) {
        return res.status(400).json({ message: "É necessário enviar pelo menos uma foto." });
      }

      // Valida os dados do produto usando o Zod
      const produtoData = produtoSchema.parse({
        ...req.body,
        fotos: fotosUrls,
      });

      // Criação do produto no banco de dados
      const novoProduto = await prisma.produto.create({
        data: {
          ...produtoData,
          foto01: fotosUrls[0] || null,
          foto02: fotosUrls[1] || null,
          foto03: fotosUrls[2] || null,
          foto04: fotosUrls[3] || null,
          foto05: fotosUrls[4] || null,
          foto06: fotosUrls[5] || null,
          foto07: fotosUrls[6] || null,
          foto08: fotosUrls[7] || null,
          foto09: fotosUrls[8] || null,
          foto10: fotosUrls[9] || null,
        },
      });

      return res.status(201).json(novoProduto);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      return res.status(400).json({ message: "Erro ao salvar produto.", error });
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
