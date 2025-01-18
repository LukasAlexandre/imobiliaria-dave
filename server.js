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
  metragemCasa: z.number().int().min(0),
  fotos: z.array(z.string().url()).min(1).max(10), // Fotos como array de URLs
});

// Método POST para salvar produto
app.post("/produtos", upload.array("fotos", 10), async (req, res) => {
  try {
    // Validação dos dados recebidos com Zod
    const produtoData = produtoSchema.parse({
      ...req.body,
      fotos: req.files ? req.files.map(file => `/uploads/${file.filename}`) : [],
    });

    // Salvar no banco de dados
    const novoProduto = await prisma.produto.create({
      data: produtoData,
    });

    res.status(201).json(novoProduto);
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    res.status(400).json({ message: error.errors || error.message });
  }
});

// Exemplo de dados para testar o método POST (3 URLs de imagens)
const exemploDeDados = {
  titulo: "Casa Moderna",
  descricao: "Casa com 3 quartos e excelente localização.",
  quartos: 3,
  banheiros: 2,
  garagem: 1,
  preco: 500000,
  localizacao: "Rua Exemplo, 123",
  tipo: "Venda",
  metragemCasa: 120,
  fotos: [
    "https://exemplo.com/imagem1.jpg",
    "https://exemplo.com/imagem2.jpg",
    "https://exemplo.com/imagem3.jpg",
  ],
};

// Rota para testar o envio de dados
app.get("/testar-produto", (req, res) => {
  res.json(exemploDeDados);
});

// Inicializando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
