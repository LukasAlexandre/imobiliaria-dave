import { PrismaClient } from '@prisma/client';
import connectDB from './connectMongo.js';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// variaveis

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
// Middleware de upload do multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//functions 
connectDB();
dotenv.config();
app.use(express.json());

// Configuração de destino e nome do arquivo para upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // A pasta onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Nome do arquivo
    }
});

const upload = multer({ storage: storage });

app.use(express.json());

// Rota POST para upload de arquivos e dados do produto
app.post('/produtos', upload.single('fotos'), async (req, res) => {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo foi enviado.');
    }
    
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    // Simulando uma resposta bem-sucedida, substitua isso com sua lógica de banco de dados
    res.status(201).json({
        descricao: req.body.descricao,
        quartos: req.body.quartos,
        banheiros: req.body.banheiros,
        garagem: req.body.garagem,
        preco: req.body.preco,
        fotos: filePath // Caminho da foto
    });
});


// // rota put - editar
// app.put('/produtos/:id', async (req, res) => {

//     await prisma.user.update({
//         where: {
//             id: req.params.id
//         },
//         data: {
//             email: req.body.email,
//             name: req.body.name,
//             age: req.body.age
//         }
//     })
//     res.status(201).json(req.body)
// })
// rota delete - deletar
// app.delete('/produtos/:id', async (req, res) => {

//     await prisma.user.delete({
//         where: {
//             id: req.params.id
//         }
//     })
//     res.status(200).json({message: 'usuário deletado com sucesso'})
// })



app.listen(port, () => {
    console.log(`O servidor está rodando na porta ${port}`)
});