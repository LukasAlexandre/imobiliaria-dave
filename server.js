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
});

// Endpoint para listar produtos
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { id: "desc" },
    });
    res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro ao buscar produtos." });
  }
});

// Rota POST para criar um novo produto
app.post("/produtos", async (req, res) => {
  try {
    const dadosValidados = produtoSchema.parse(req.body);

    const novoProduto = await prisma.produto.create({
      data: dadosValidados,
    });

    res.status(201).json(novoProduto);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Erro de validação:", error.errors);
      res.status(400).json({ error: "Dados inválidos.", detalhes: error.errors });
    } else {
      console.error("Erro ao criar produto:", error);
      res.status(500).json({ error: "Erro ao criar produto." });
    }
  }
});

// Rota PUT para atualizar um produto existente
app.put("/produtos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const dadosValidados = produtoSchema.parse(req.body);

    const produtoAtualizado = await prisma.produto.update({
      where: { id: parseInt(id, 10) },
      data: dadosValidados,
    });

    res.status(200).json(produtoAtualizado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Erro de validação:", error.errors);
      res.status(400).json({ error: "Dados inválidos.", detalhes: error.errors });
    } else if (error.code === "P2025") {
      res.status(404).json({ error: "Produto não encontrado." });
    } else {
      console.error("Erro ao atualizar produto:", error);
      res.status(500).json({ error: "Erro ao atualizar produto." });
    }
  }
});

// Rota DELETE para excluir um produto
app.delete("/produtos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.produto.delete({
      where: { id: parseInt(id, 10) },
    });

    res.status(200).json({ message: "Produto excluído com sucesso." });
  } catch (error) {
    if (error.code === "P2025") {
      res.status(404).json({ error: "Produto não encontrado." });
    } else {
      console.error("Erro ao excluir produto:", error);
      res.status(500).json({ error: "Erro ao excluir produto." });
    }
  }
});

// Inicializa o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
