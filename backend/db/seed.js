// Script de un solo uso para poblar la base con datos de prueba, usando la
// propia API (no inserta SQL directo, salvo para promover un usuario a
// admin, que no tiene endpoint publico por diseno de seguridad).
// Requiere que el backend este corriendo en API_URL.
require('dotenv').config();
const pool = require('../src/config/db');

const API_URL = process.env.SEED_API_URL || 'http://localhost:4000/api';

function extractCookie(res) {
  const raw = res.headers.get('set-cookie');
  if (!raw) return null;
  return raw.split(';')[0];
}

async function register(user) {
  const form = new FormData();
  form.append('username', user.username);
  form.append('nameUser', user.nameUser);
  form.append('lastnameUser', user.lastnameUser);
  form.append('password', user.password);

  const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', body: form });
  const body = await res.json();
  if (!res.ok) throw new Error(`register ${user.username}: ${JSON.stringify(body)}`);
  return extractCookie(res);
}

async function createRecipe(cookie, recipe) {
  const form = new FormData();
  form.append('nameRecipe', recipe.nameRecipe);
  form.append('categoryRecipe', recipe.categoryRecipe);
  form.append('descriptionRecipe', recipe.descriptionRecipe);
  form.append('stepsRecipe', recipe.stepsRecipe);
  form.append('ingredients', JSON.stringify(recipe.ingredients));

  const res = await fetch(`${API_URL}/recipes`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`recipe ${recipe.nameRecipe}: ${JSON.stringify(body)}`);
  return body.idRecipe;
}

async function comment(cookie, idRecipe, bodyComment) {
  const res = await fetch(`${API_URL}/recipes/${idRecipe}/comments`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bodyComment }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`comment on ${idRecipe}: ${JSON.stringify(body)}`);
}

const USERS = [
  { username: 'mariagonzalez', nameUser: 'Maria', lastnameUser: 'Gonzalez', password: 'Password123' },
  { username: 'juanperez', nameUser: 'Juan', lastnameUser: 'Perez', password: 'Password123' },
  { username: 'anacruz', nameUser: 'Ana', lastnameUser: 'Cruz', password: 'Password123' },
  { username: 'admin1', nameUser: 'Admin', lastnameUser: 'Principal', password: 'Password123' },
];

const RECIPES_BY_MARIA = [
  {
    nameRecipe: 'Tarta de manzana',
    categoryRecipe: 'Postres',
    descriptionRecipe: 'Una tarta clasica de manzana con masa quebrada y canela.',
    stepsRecipe: '1. Preparar la masa y estirarla en el molde. 2. Cortar las manzanas en laminas y acomodarlas. 3. Espolvorear canela y azucar. 4. Hornear a 180C por 40 minutos.',
    ingredients: [
      { nameIngredient: 'Manzana', quantityIngredient: '4 unidades', orderIngredient: 0 },
      { nameIngredient: 'Harina', quantityIngredient: '2 tazas', orderIngredient: 1 },
      { nameIngredient: 'Manteca', quantityIngredient: '100 g', orderIngredient: 2 },
      { nameIngredient: 'Azucar', quantityIngredient: '3/4 taza', orderIngredient: 3 },
      { nameIngredient: 'Canela', quantityIngredient: '1 cucharadita', orderIngredient: 4 },
    ],
  },
  {
    nameRecipe: 'Sopa de tomate',
    categoryRecipe: 'Sopas',
    descriptionRecipe: 'Sopa cremosa de tomate, ideal para dias frios.',
    stepsRecipe: '1. Rehogar la cebolla y el ajo. 2. Agregar los tomates y el caldo. 3. Cocinar 20 minutos. 4. Licuar y servir con crema.',
    ingredients: [
      { nameIngredient: 'Tomate', quantityIngredient: '6 unidades', orderIngredient: 0 },
      { nameIngredient: 'Cebolla', quantityIngredient: '1 unidad', orderIngredient: 1 },
      { nameIngredient: 'Ajo', quantityIngredient: '2 dientes', orderIngredient: 2 },
      { nameIngredient: 'Caldo de verduras', quantityIngredient: '1 litro', orderIngredient: 3 },
    ],
  },
  {
    nameRecipe: 'Brownies de chocolate',
    categoryRecipe: 'Postres',
    descriptionRecipe: 'Brownies humedos y intensos en chocolate.',
    stepsRecipe: '1. Derretir el chocolate con la manteca. 2. Batir los huevos con el azucar. 3. Unir todo con la harina y el cacao. 4. Hornear 25 minutos a 180C.',
    ingredients: [
      { nameIngredient: 'Chocolate semiamargo', quantityIngredient: '200 g', orderIngredient: 0 },
      { nameIngredient: 'Manteca', quantityIngredient: '150 g', orderIngredient: 1 },
      { nameIngredient: 'Huevo', quantityIngredient: '3 unidades', orderIngredient: 2 },
      { nameIngredient: 'Azucar', quantityIngredient: '1 taza', orderIngredient: 3 },
      { nameIngredient: 'Harina', quantityIngredient: '1 taza', orderIngredient: 4 },
      { nameIngredient: 'Cacao amargo', quantityIngredient: '1/4 taza', orderIngredient: 5 },
    ],
  },
];

const RECIPES_BY_JUAN = [
  {
    nameRecipe: 'Ensalada Cesar',
    categoryRecipe: 'Ensaladas',
    descriptionRecipe: 'La clasica ensalada Cesar con aderezo casero y croutons.',
    stepsRecipe: '1. Lavar y cortar la lechuga. 2. Preparar el aderezo con yema, mostaza, anchoas y aceite. 3. Tostar los croutons. 4. Mezclar todo con queso parmesano.',
    ingredients: [
      { nameIngredient: 'Lechuga romana', quantityIngredient: '1 planta', orderIngredient: 0 },
      { nameIngredient: 'Pan para croutons', quantityIngredient: '2 rebanadas', orderIngredient: 1 },
      { nameIngredient: 'Queso parmesano', quantityIngredient: '50 g', orderIngredient: 2 },
      { nameIngredient: 'Anchoas', quantityIngredient: '4 filetes', orderIngredient: 3 },
    ],
  },
  {
    nameRecipe: 'Tacos al pastor',
    categoryRecipe: 'Platos fuertes',
    descriptionRecipe: 'Tacos mexicanos con carne marinada en achiote y pina.',
    stepsRecipe: '1. Marinar la carne con achiote y especias. 2. Cocinar a fuego alto. 3. Cortar en trozos pequenos. 4. Servir en tortillas con pina, cebolla y cilantro.',
    ingredients: [
      { nameIngredient: 'Carne de cerdo', quantityIngredient: '1 kg', orderIngredient: 0 },
      { nameIngredient: 'Achiote', quantityIngredient: '3 cucharadas', orderIngredient: 1 },
      { nameIngredient: 'Pina', quantityIngredient: '1/2 unidad', orderIngredient: 2 },
      { nameIngredient: 'Tortillas de maiz', quantityIngredient: '12 unidades', orderIngredient: 3 },
      { nameIngredient: 'Cilantro', quantityIngredient: 'un manojo', orderIngredient: 4 },
    ],
  },
];

async function main() {
  const cookies = {};
  for (const user of USERS) {
    cookies[user.username] = await register(user);
    console.log(`usuario creado: ${user.username}`);
  }

  const recipeIds = {};
  for (const recipe of RECIPES_BY_MARIA) {
    const id = await createRecipe(cookies.mariagonzalez, recipe);
    recipeIds[recipe.nameRecipe] = id;
    console.log(`receta creada: ${recipe.nameRecipe} (#${id})`);
  }
  for (const recipe of RECIPES_BY_JUAN) {
    const id = await createRecipe(cookies.juanperez, recipe);
    recipeIds[recipe.nameRecipe] = id;
    console.log(`receta creada: ${recipe.nameRecipe} (#${id})`);
  }

  await comment(cookies.anacruz, recipeIds['Tarta de manzana'], 'Quedo espectacular, la hice el fin de semana!');
  await comment(cookies.juanperez, recipeIds['Tarta de manzana'], 'Le agregue un poco mas de canela y quedo perfecta.');
  await comment(cookies.anacruz, recipeIds['Tacos al pastor'], 'Mi favorita, el marinado es clave.');
  await comment(cookies.mariagonzalez, recipeIds['Ensalada Cesar'], 'Muy rica y facil de preparar.');
  await comment(cookies.anacruz, recipeIds['Sopa de tomate'], 'Ideal para el invierno, gracias por la receta.');
  await comment(cookies.juanperez, recipeIds['Brownies de chocolate'], 'El mejor brownie que probe, super humedo.');
  console.log('comentarios creados');

  await pool.query("UPDATE TB_Users SET roleUser = 'admin' WHERE username = ?", ['admin1']);
  console.log('admin1 promovido a admin');

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
