# Recetario en linea

Aplicacion web de recetas: backend en Node.js/Express + MySQL, frontend en React (Vite), comunicados por una API HTTP.

## 1. Esquema leido del diagrama (`diagramaBD.png`)

```
TB_Users
  username        varchar(100)  PK
  nameUser        varchar(100)  NOT NULL
  lastnameUser    varchar(100)  NOT NULL
  passwordUser    varchar(255)  NOT NULL   -- hash, nunca texto plano
  imageUser       varchar(500)  NULL
  roleUser        varchar(100)  NOT NULL   -- 'user' | 'admin'
  createdIn       timestamp     NOT NULL

TB_Recipes
  idRecipe          int           PK (asumido AUTO_INCREMENT)
  nameRecipe        varchar(200)  NOT NULL
  categoryRecipe    varchar(100)  NOT NULL
  descriptionRecipe varchar(500)  NOT NULL   -- longitud truncada en el diagrama, asumida en 500
  stepsRecipe       varchar(500)  NOT NULL
  imageRecipe       varchar(500)  NULL
  usernameAuthor    varchar(100)  NOT NULL  FK -> TB_Users.username
  createdIn         timestamp     NOT NULL

TB_Ingredients
  idIngredient        int           PK (asumido AUTO_INCREMENT)
  idRecipe            int           NOT NULL  FK -> TB_Recipes.idRecipe
  nameIngredient       varchar(255)  NOT NULL
  quantityIngredient   varchar(100)  NOT NULL  -- longitud truncada en el diagrama, asumida en 100
  orderIngredient      int           NULL

TB_Comments
  idComment        int           PK (asumido AUTO_INCREMENT)
  idRecipe         int           NOT NULL  FK -> TB_Recipes.idRecipe
  bodyComment      varchar(500)  NOT NULL
  usernameComment  varchar(100)  NOT NULL  FK -> TB_Users.username
  createdIn        timestamp     NOT NULL
```

Relaciones (segun las lineas del diagrama): `TB_Users 1—N TB_Recipes` (por `usernameAuthor`), `TB_Users 1—N TB_Comments` (por `usernameComment`), `TB_Recipes 1—N TB_Ingredients` y `TB_Recipes 1—N TB_Comments` (por `idRecipe`).

### Supuestos tomados (el diagrama no era 100% legible o el esquema no lo especifica)
- `descriptionRecipe` y `quantityIngredient` truncados en la imagen: se asumieron `varchar(500)` y `varchar(100)` respectivamente.
- `idRecipe`, `idIngredient`, `idComment` son `AUTO_INCREMENT`.
- `roleUser` solo admite `'user'` o `'admin'`; el registro publico siempre crea `'user'`. Un admin debe promoverse manualmente en la base de datos (no hay endpoint para crear admins, por seguridad).
- El esquema no puede modificarse, por lo que el control de intentos fallidos de login vive en memoria del proceso Node (no en una tabla nueva). Esto reinicia si se reinicia el servidor; es razonable para un entorno de desarrollo local.
- Un comentario puede ser eliminado por su autor o por un admin; solo un admin puede **editar** un comentario ajeno (el enunciado solo garantiza edicion a administradores).
- El perfil de usuario expone `username, nameUser, lastnameUser, imageUser` publicamente; `roleUser` solo se expone al propio usuario autenticado.

## 2. Arbol de carpetas

```
Proyecto_React_Node_Claude/
  backend/
    src/
      config/db.js
      controllers/authController.js
      controllers/recipesController.js
      controllers/commentsController.js
      controllers/usersController.js
      middleware/auth.js
      middleware/upload.js
      middleware/loginRateLimit.js
      middleware/errorHandler.js
      routes/auth.routes.js
      routes/users.routes.js
      routes/recipes.routes.js
      routes/comments.routes.js
      validators/validate.js
      validators/authValidators.js
      validators/recipeValidators.js
      utils/ApiError.js
      utils/asyncHandler.js
      utils/generateFilename.js
      app.js
      server.js
    uploads/
      recipes/
      users/
    .env / .env.example
    .gitignore
    package.json
  frontend/
    src/
      api/client.js
      api/errors.js
      context/AuthContext.jsx
      components/Navbar.jsx
      components/ProtectedRoute.jsx
      components/RecipeCard.jsx
      components/IngredientsEditor.jsx
      components/CommentForm.jsx
      components/CommentItem.jsx
      components/FieldError.jsx
      pages/HomePage.jsx
      pages/RecipeDetailPage.jsx
      pages/RecipeFormPage.jsx
      pages/LoginPage.jsx
      pages/RegisterPage.jsx
      pages/NotFoundPage.jsx
      App.jsx
      main.jsx
      index.css
    index.html
    .env / .env.example
    package.json
```

Todos los archivos completos ya estan escritos en disco en las rutas de arriba (no se repiten aqui para mantener este README legible).

## 3. Como instalar y levantar

```bash
# Backend
cd backend
npm install
npm run dev      # nodemon en http://localhost:4000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev       # Vite en http://localhost:5173
```

### IMPORTANTE antes de usar la app
Edita `backend/.env` y reemplaza `DB_PASSWORD=CHANGE_ME` por la contrasena real de tu usuario MySQL `root` (o el usuario que uses), y ajusta `DB_NAME` si tu schema no se llama `recetario_db`. El servidor arranca sin esa base de datos, pero cualquier endpoint que consulte datos respondera 500 hasta que la conexion sea valida.

## 4. Seguridad implementada
- Contrasenas con `bcryptjs` (costo 12), salt unico por usuario.
- Rate limiting de login por IP (`express-rate-limit`) y por cuenta (memoria del proceso, 5 intentos / 15 min).
- Mensaje de login generico (no distingue usuario inexistente vs contrasena incorrecta).
- Ningun endpoint devuelve `passwordUser`.
- Autorizacion siempre verificada en el servidor (`requireAuth`, `requireAdmin`, comparacion de `usernameAuthor`/`usernameComment` contra el usuario de la sesion, nunca datos del cliente).
- Rol tomado siempre de una consulta a la base de datos via el JWT, nunca del body/query del cliente.
- Validacion server-side con `express-validator` + validacion manual de ingredientes (tipo, longitud, obligatoriedad, duplicados).
- Consultas parametrizadas (`mysql2` con placeholders `?`) en todo el codigo, sin concatenar SQL.
- Sanitizacion automatica de React en el render (no se usa `dangerouslySetInnerHTML`).
- Subida de imagenes: `multer` en memoria, verificacion del tipo real por bytes magicos (`file-type`, no por extension ni por el `mimetype` del cliente), limite de 2 MB, nombre de archivo generado por el servidor (`crypto.randomBytes`), guardado fuera de cualquier ruta ejecutable, servido solo estaticamente desde `/uploads`.
- JWT en cookie `httpOnly`, `SameSite=Lax`, `secure` controlable por `.env`.
- CORS restringido a `FRONTEND_ORIGIN` (sin comodin), con `credentials: true`.
- `helmet` para cabeceras HTTP seguras.
- Manejador de errores central: nunca expone stack traces, SQL ni rutas del sistema de archivos; los errores 500 devuelven un mensaje generico.
- Sin credenciales ni secretos hardcodeados: todo viene de `backend/.env` (no versionado, ver `.gitignore`).
- `npm audit` sin vulnerabilidades conocidas en backend y frontend al momento de generar el proyecto.

## 5. Validaciones de campos
Implementadas tanto en el frontend (feedback inmediato por campo) como, de forma autoritativa, en el backend: trim automatico, longitudes maximas iguales a las columnas de la base de datos, campos obligatorios no vacios/no solo espacios, minimo un ingrediente por receta, ingredientes sin nombres duplicados dentro de la misma receta, imagenes opcionales JPG/PNG/WEBP <= 2 MB, y mensaje especifico de "username ya registrado" sin perder el resto del formulario (el frontend no limpia el formulario ante un error del servidor).
