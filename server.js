// Importando dependências
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");

const app = express();
const prisma = new PrismaClient();

// Middleware para permitir o parsing de JSON
app.use(express.json());

// Definindo o esquema de validação com Zod
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
  fotos: z.array(z.string().url()).min(1).max(10), // Aceita URLs de imagens
  metragemTerreno: z.number().optional(),
  observacao: z.string().optional(),
});

// Endpoint para criar um novo produto
app.post("/produtos", async (req, res) => {
  try {
    // Valida os dados do produto usando Zod
    const produtoData = produtoSchema.parse(req.body);

    // Criação do produto no banco de dados
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
        metragemTerreno: produtoData.metragemTerreno || null,
        observacao: produtoData.observacao || null,
        // Armazenando as fotos nos campos apropriados
        foto01: produtoData.fotos[0] || null,
        foto02: produtoData.fotos[1] || null,
        foto03: produtoData.fotos[2] || null,
        foto04: produtoData.fotos[3] || null,
        foto05: produtoData.fotos[4] || null,
        foto06: produtoData.fotos[5] || null,
        foto07: produtoData.fotos[6] || null,
        foto08: produtoData.fotos[7] || null,
        foto09: produtoData.fotos[8] || null,
        foto10: produtoData.fotos[9] || null,
      },
    });

    // Retorna o novo produto criado
    return res.status(201).json(novoProduto);
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    return res.status(400).json({ message: "Erro ao salvar produto.", error });
  }
});

// Endpoint para listar todos os produtos
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany();
    return res.json(produtos);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return res.status(500).json({ message: "Erro ao listar produtos.", error });
  }
});

// Iniciando o servidor na porta 3000
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
