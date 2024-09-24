import express from "express";
import { PrimasClient } from '@prisma/client'
import cors from 'cors'
const app = express()
const prisma = new PrimasClient()

app.use(express.json())
