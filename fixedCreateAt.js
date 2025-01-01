import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCreatedAt() {
  try {
    const updatedRecords = await prisma.produto.updateMany({
      where: {
        createdAt: null,
      },
      data: {
        createdAt: new Date(), // Define a data atual como valor padrão
      },
    });

    console.log(`${updatedRecords.count} registros corrigidos.`);
  } catch (error) {
    console.error('Erro ao corrigir registros:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCreatedAt();
