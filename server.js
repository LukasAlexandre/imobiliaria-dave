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
  destination: function (req, file, cb) {
    cb(null, uploadPath); // Define a pasta para onde os arquivos serão enviados
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome único para o arquivo
  },
});

const upload = multer({ storage: storage });

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
(async () => {
  try {
    console.log("🔄 Tentando conectar ao banco...");
    await prisma.$connect();
    console.log("✅ Conectado ao banco MySQL com Prisma!");
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco:", error);
    console.error("🛠️ Verifique se o banco está online e se a DATABASE_URL está correta.");
    process.exit(1); // Encerra o processo para evitar falhas em produção
  }
})();

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
  metragemCasa: z.number().int().min(0).nullable().optional(),
  metragemTerreno: z.number().int().min(0).nullable().optional(),
  observacao: z.string().nullable().optional(),
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
});

// Endpoint para listar produtos
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { id: "desc" },
    });
    res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    res.status(500).json({ message: "Erro ao listar produtos" });
  }
});

// Endpoint para criar novo produto
app.post("/produtos", upload.array("fotos", 10), async (req, res) => {
  try {
    // Validação do corpo da requisição
    const produtoData = produtoSchema.parse({
      ...req.body,
      fotos: req.files?.map((file) => file.filename),
    });

    // Criando o produto no banco de dados
    const produto = await prisma.produto.create({
      data: produtoData,
    });

    res.status(201).json(produto);
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    res.status(400).json({ message: "Erro ao salvar produto" });
  }
});

// Iniciando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
