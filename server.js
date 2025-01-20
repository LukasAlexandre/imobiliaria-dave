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

app.post("/produtos", upload.fields([
  { name: "foto01", maxCount: 1 },
  { name: "foto02", maxCount: 1 },
  { name: "foto03", maxCount: 1 },
  { name: "foto04", maxCount: 1 },
  { name: "foto05", maxCount: 1 },
  { name: "foto06", maxCount: 1 },
  { name: "foto07", maxCount: 1 },
  { name: "foto08", maxCount: 1 },
  { name: "foto09", maxCount: 1 },
  { name: "foto10", maxCount: 1 }
]), async (req, res) => {
  try {
    // Extraindo dados do corpo da requisição
    const produtoData = req.body;

    // Mapeando fotos de acordo com a estrutura do produto
    const fotos = [];
    for (let i = 1; i <= 10; i++) {
      if (req.files[`foto-${i}`]) {
        fotos.push(req.files[`foto-${i}`][0].filename); // Armazenando o nome do arquivo
      } else {
        fotos.push(null); // Nenhuma foto foi enviada
      }
    }

    // Validação com Zod
    const validProdutoData = produtoSchema.parse({
      ...produtoData,
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

    // Salvando produto no banco de dados
    const produto = await prisma.produto.create({
      data: {
        ...validProdutoData,
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
      },
    });

    return res.status(201).json(produto);
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    return res.status(500).json({ message: "Erro ao salvar produto", error });
  }
});


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
