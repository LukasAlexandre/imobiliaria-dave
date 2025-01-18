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
  fotos: z.array(z.string().url()).min(1).max(10), // Aceita URLs de imagens diretamente
  metragemTerreno: z.number().optional(),
  observacao: z.string().optional(),
});

// Método POST para salvar produto
app.post("/produtos", upload.array("fotos", 10), async (req, res) => {
  try {
    // Se os arquivos foram enviados, geramos URLs para os mesmos
    const fotosUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Se não houver fotos (nem arquivos nem URLs no corpo), retornamos erro
    if (fotosUrls.length === 0 && !req.body.fotos) {
      return res.status(400).json({ message: "É necessário enviar pelo menos uma foto." });
    }

    // Se as URLs de fotos foram enviadas diretamente no corpo, as adicionamos
    const finalFotosUrls = fotosUrls.length > 0 ? fotosUrls : req.body.fotos;

    // Log para depuração
    console.log("Arquivos recebidos:", req.files);
    console.log("Corpo da requisição:", req.body);

    // Validação dos dados recebidos com Zod
    const produtoData = produtoSchema.parse({
      ...req.body,
      fotos: finalFotosUrls, // Inclui as URLs de imagens ou arquivos
    });

    // Salvar o produto no banco de dados
    const novoProduto = await prisma.produto.create({
      data: {
        titulo: produtoData.titulo,
        descricao: produtoData.descricao,
        quartos: produtoData.quartos,
        banheiros: produtoData.banheiros,
        garagem: produtoData.garagem,
        preco: produtoData.preco,
        localizacao: produtoData.localizacao,
        tipo: produtoData.tipo,
        metragemCasa: produtoData.metragemCasa,
        fotos: produtoData.fotos, // Usar as URLs validadas
        metragemTerreno: produtoData.metragemTerreno,
        observacao: produtoData.observacao,
      },
    });

    res.status(201).json(novoProduto);
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    res.status(500).json({ message: "Erro ao salvar produto no banco de dados." });
  }
});

// Rota para testar a criação de um produto
app.get("/testar-produto", async (req, res) => {
  try {
    const produto = await prisma.produto.create({
      data: {
        titulo: "Testar Produto",
        descricao: "Produto de teste para a API.",
        quartos: 2,
        banheiros: 1,
        garagem: 1,
        preco: 500000,
        localizacao: "Rua Teste, 123",
        tipo: "Venda",
        metragemCasa: 100,
        fotos: ["https://example.com/imagem.jpg"],
      },
    });

    res.json(produto);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar produto de teste." });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
