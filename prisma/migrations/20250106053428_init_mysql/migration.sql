/*
  Warnings:

  - You are about to alter the column `titulo` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `preco` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.
  - You are about to alter the column `localizacao` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `tipo` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `foto01` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `foto02` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `foto03` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `foto04` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `foto05` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `foto06` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `foto07` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `foto08` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `foto09` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `foto10` on the `produto` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `produto` MODIFY `titulo` VARCHAR(191) NOT NULL,
    MODIFY `descricao` VARCHAR(191) NOT NULL,
    MODIFY `preco` DOUBLE NOT NULL,
    MODIFY `localizacao` VARCHAR(191) NOT NULL,
    MODIFY `tipo` VARCHAR(191) NOT NULL,
    MODIFY `observacao` VARCHAR(191) NULL,
    MODIFY `foto01` VARCHAR(191) NULL,
    MODIFY `foto02` VARCHAR(191) NULL,
    MODIFY `foto03` VARCHAR(191) NULL,
    MODIFY `foto04` VARCHAR(191) NULL,
    MODIFY `foto05` VARCHAR(191) NULL,
    MODIFY `foto06` VARCHAR(191) NULL,
    MODIFY `foto07` VARCHAR(191) NULL,
    MODIFY `foto08` VARCHAR(191) NULL,
    MODIFY `foto09` VARCHAR(191) NULL,
    MODIFY `foto10` VARCHAR(191) NULL;
