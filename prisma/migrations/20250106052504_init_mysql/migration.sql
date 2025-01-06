-- CreateTable
CREATE TABLE `produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(255) NOT NULL,
    `descricao` TEXT NOT NULL,
    `quartos` INTEGER NOT NULL,
    `banheiros` INTEGER NOT NULL,
    `garagem` INTEGER NOT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `localizacao` VARCHAR(255) NOT NULL,
    `tipo` VARCHAR(255) NOT NULL,
    `metragemCasa` INTEGER NULL,
    `metragemTerreno` INTEGER NULL,
    `observacao` TEXT NULL,
    `foto01` VARCHAR(255) NULL,
    `foto02` VARCHAR(255) NULL,
    `foto03` VARCHAR(255) NULL,
    `foto04` VARCHAR(255) NULL,
    `foto05` VARCHAR(255) NULL,
    `foto06` VARCHAR(255) NULL,
    `foto07` VARCHAR(255) NULL,
    `foto08` VARCHAR(255) NULL,
    `foto09` VARCHAR(255) NULL,
    `foto10` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
