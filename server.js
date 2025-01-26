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

const upload = multer({ storage: storage }).fields([
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
]);

// CORS Configuration
const corsOptions = {
  origin: "*", // Permitir todas as origens para teste (substitua com domínios específicos em produção)
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
  metragemTerreno: z.number().optional(),
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


app.post(
  "/produtos",
  upload, // Middleware de upload
  async (req, res) => {
    try {
      console.log("Headers:", req.headers);
      console.log("Arquivos recebidos:", req.files);
      console.log("Body recebido antes da conversão:", req.body);

      if (!req.files) {
        throw new Error("Nenhum arquivo foi enviado.");
      }

      // Converta os campos numéricos do req.body
      const body = {
        ...req.body,
        quartos: parseInt(req.body.quartos, 10),
        banheiros: parseInt(req.body.banheiros, 10),
        garagem: parseInt(req.body.garagem, 10),
        preco: parseFloat(req.body.preco),
        metragemCasa: parseInt(req.body.metragemCasa, 10),
        metragemTerreno: req.body.metragemTerreno ? parseInt(req.body.metragemTerreno, 10) : undefined,
      };

      console.log("Body recebido após conversão:", body);

      // Mapeando arquivos para as variáveis correspondentes
      const fotos = [
        req.files.foto01?.[0]?.filename || null,
        req.files.foto02?.[0]?.filename || null,
        req.files.foto03?.[0]?.filename || null,
        req.files.foto04?.[0]?.filename || null,
        req.files.foto05?.[0]?.filename || null,
        req.files.foto06?.[0]?.filename || null,
        req.files.foto07?.[0]?.filename || null,
        req.files.foto08?.[0]?.filename || null,
        req.files.foto09?.[0]?.filename || null,
        req.files.foto10?.[0]?.filename || null,
      ];

      // Validação do esquema com Zod
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

      // Salvando no banco de dados
      const produto = await prisma.produto.create({
        data: produtoData,
      });

      return res.status(201).json(produto);
    } catch (error) {
      console.error("Erro ao salvar produto:", error.message);
      return res.status(500).json({ message: "Erro ao salvar produto", error: error.message });
    }
  }
);


const deleteProduct = async (id) => {
  try {
    const response = await fetch(`https://imobiliaria-dave.onrender.com/produtos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Erro ao excluir o produto.");
    }

    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== id)
    );
    setMessage("Produto excluído com sucesso!");
    setMessageType("success");
  } catch (error) {
    setMessage(`Erro ao excluir o produto: ${error.message}`);
    setMessageType("error");
  }
};



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

