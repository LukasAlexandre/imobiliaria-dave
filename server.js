// importações
import { PrismaClient } from '@prisma/client';
import connectDB from './connectMongo.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
 
// variaveis

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

//functions 
connectDB();
dotenv.config();

// rota get - listar
app.get('/produtos', async (req, res) => {
    const products = await prisma.products.findMany()
    res.status(200).json(products)
})

// rota post - criar
app.post('/produtos', async (req, res) => {

    await prisma.user.create({
        data: {
            email: req.body.email,
            name: req.body.name,
            age: req.body.age
        }
    })
    res.status(201).json(req.body)
})

// rota put - editar
app.put('/produtos/:id', async (req, res) => {

    await prisma.user.update({
        where: {
            id: req.params.id
        },
        data: {
            email: req.body.email,
            name: req.body.name,
            age: req.body.age
        }
    })
    res.status(201).json(req.body)
})
// rota delete - deletar
app.delete('/produtos/:id', async (req, res) => {

    await prisma.user.delete({
        where: {
            id: req.params.id
        }
    })
    res.status(200).json({message: 'usuário deletado com sucesso'})
})



app.listen(port, () => { 
console.log(`O servidor está rodando na porta ${port}`)
});