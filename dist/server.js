import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import express from "express";
import util from "util";
import multer from "multer";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { z } from "zod";
dotenv.config();
const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
// Configuração Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "imobiliaria",
        allowed_formats: ["jpg", "jpeg", "png"],
        transformation: [{ width: 1200, crop: "limit" }],
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
}).fields(Array.from({ length: 10 }, (_, i) => ({
    name: `foto0${i + 1}`,
    maxCount: 1,
})));
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));
// Schema de validação
const produtoSchema = z.object({
    titulo: z.string(),
    descricao: z.string(),
    descricaoPrevia: z.string(),
    status: z.enum(["Disponível", "Indisponível"]),
    quartos: z.number().int().min(0),
    banheiros: z.number().int().min(0),
    garagem: z.number().int().min(0),
    preco: z.number().min(0),
    localizacao: z.string(),
    tipo: z.string(),
    metragemCasa: z.number().int().min(0),
    metragemTerreno: z.number().int().optional(),
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
// POST
app.post("/produtos", upload, async (req, res, next) => {
    try {
        console.log("📥 Requisição recebida para cadastro de produto");
        console.log("Body bruto:", req.body);
        console.log("Files:", req.files);
        // Mapear snake_case → camelCase
        const raw = req.body;
        const body = {
            ...raw,
            descricaoPrevia: raw.descricaoPrevia ?? raw.descricao_previa,
            quartos: parseInt(raw.quartos, 10),
            banheiros: parseInt(raw.banheiros, 10),
            garagem: parseInt(raw.garagem, 10),
            preco: parseFloat(raw.preco),
            metragemCasa: parseInt(raw.metragemCasa, 10),
            metragemTerreno: raw.metragemTerreno
                ? parseInt(raw.metragemTerreno, 10)
                : undefined,
        };
        const fotos = Array.from({ length: 10 }, (_, i) => req.files?.[`foto0${i + 1}`]?.[0]?.path ?? null);
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
        console.log("✨ produtoData validado:", util.inspect(produtoData, { depth: null }));
        const produto = await prisma.produto.create({ data: produtoData });
        return res.status(201).json(produto);
    }
    catch (err) {
        console.error("❌ Erro ao salvar produto:", util.inspect(err, { depth: null }));
        if (err instanceof z.ZodError) {
            console.error("❗️ Erros de validação Zod:", err.errors);
            return res
                .status(400)
                .json({ message: "Dados inválidos", issues: err.errors });
        }
        return res.status(500).json({
            message: "Erro interno ao salvar produto",
            error: err.message ?? err,
        });
    }
});
// GET todos
app.get("/produtos", async (req, res) => {
    try {
        const produtos = await prisma.produto.findMany();
        res.status(200).json(produtos);
    }
    catch (error) {
        console.error("❌ Erro ao listar produtos:", error);
        res.status(500).json({ message: "Erro ao listar produtos", error });
    }
});
// GET por ID
app.get("/produtos/:id", async (req, res) => {
    try {
        const produto = await prisma.produto.findUnique({
            where: { id: Number(req.params.id) },
        });
        if (!produto)
            return res.status(404).json({ message: "Produto não encontrado" });
        res.json(produto);
    }
    catch (error) {
        console.error("❌ Erro ao buscar produto:", error);
        res.status(500).json({ message: "Erro interno", error });
    }
});
// PUT
app.put("/produtos/:id", upload, async (req, res) => {
    try {
        const raw = req.body;
        const body = {
            ...raw,
            descricaoPrevia: raw.descricaoPrevia ?? raw.descricao_previa,
            quartos: parseInt(raw.quartos, 10),
            banheiros: parseInt(raw.banheiros, 10),
            garagem: parseInt(raw.garagem, 10),
            preco: parseFloat(raw.preco),
            metragemCasa: parseInt(raw.metragemCasa, 10),
            metragemTerreno: raw.metragemTerreno
                ? parseInt(raw.metragemTerreno, 10)
                : undefined,
        };
        const fotos = Array.from({ length: 10 }, (_, i) => req.files?.[`foto0${i + 1}`]?.[0]?.path ??
            raw[`foto0${i + 1}`] ??
            null);
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
        const produto = await prisma.produto.update({
            where: { id: Number(req.params.id) },
            data: produtoData,
        });
        res.json(produto);
    }
    catch (error) {
        console.error("❌ Erro ao atualizar produto:", error);
        res.status(500).json({
            message: "Erro ao atualizar produto",
            error: error.message ?? error,
        });
    }
});
// DELETE
app.delete("/produtos/:id", async (req, res) => {
    try {
        await prisma.produto.delete({ where: { id: Number(req.params.id) } });
        res.status(200).json({ message: "Produto excluído com sucesso!" });
    }
    catch (error) {
        console.error("❌ Erro ao excluir produto:", error);
        res.status(500).json({ error: "Erro ao excluir produto" });
    }
});
app.listen(port, () => console.log(`🚀 Servidor rodando na porta ${port}`));
