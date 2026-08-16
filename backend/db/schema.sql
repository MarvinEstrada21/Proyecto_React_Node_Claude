-- Esquema transcrito de diagramaBD.png. Ver README.md para los supuestos
-- tomados sobre las longitudes truncadas en la imagen.

CREATE DATABASE IF NOT EXISTS recetario_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE recetario_db;

CREATE TABLE IF NOT EXISTS TB_Users (
  username     VARCHAR(100) NOT NULL,
  nameUser     VARCHAR(100) NOT NULL,
  lastnameUser VARCHAR(100) NOT NULL,
  passwordUser VARCHAR(255) NOT NULL,
  imageUser    VARCHAR(500) NULL,
  roleUser     VARCHAR(100) NOT NULL DEFAULT 'user',
  createdIn    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS TB_Recipes (
  idRecipe          INT NOT NULL AUTO_INCREMENT,
  nameRecipe        VARCHAR(200) NOT NULL,
  categoryRecipe    VARCHAR(100) NOT NULL,
  descriptionRecipe VARCHAR(500) NOT NULL,
  stepsRecipe       VARCHAR(500) NOT NULL,
  imageRecipe       VARCHAR(500) NULL,
  usernameAuthor    VARCHAR(100) NOT NULL,
  createdIn         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idRecipe),
  KEY idx_recipes_category (categoryRecipe),
  KEY idx_recipes_author (usernameAuthor),
  CONSTRAINT fk_recipes_author FOREIGN KEY (usernameAuthor)
    REFERENCES TB_Users (username) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS TB_Ingredients (
  idIngredient       INT NOT NULL AUTO_INCREMENT,
  idRecipe           INT NOT NULL,
  nameIngredient     VARCHAR(255) NOT NULL,
  quantityIngredient VARCHAR(100) NOT NULL,
  orderIngredient    INT NULL,
  PRIMARY KEY (idIngredient),
  KEY idx_ingredients_recipe (idRecipe),
  CONSTRAINT fk_ingredients_recipe FOREIGN KEY (idRecipe)
    REFERENCES TB_Recipes (idRecipe) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS TB_Comments (
  idComment       INT NOT NULL AUTO_INCREMENT,
  idRecipe        INT NOT NULL,
  bodyComment     VARCHAR(500) NOT NULL,
  usernameComment VARCHAR(100) NOT NULL,
  createdIn       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idComment),
  KEY idx_comments_recipe (idRecipe),
  KEY idx_comments_username (usernameComment),
  CONSTRAINT fk_comments_recipe FOREIGN KEY (idRecipe)
    REFERENCES TB_Recipes (idRecipe) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (usernameComment)
    REFERENCES TB_Users (username) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
