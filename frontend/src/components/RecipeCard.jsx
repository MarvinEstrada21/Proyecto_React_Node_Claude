import { Link } from 'react-router-dom';
import { fileUrl } from '../api/client';

export default function RecipeCard({ recipe }) {
  return (
    <Link to={`/recetas/${recipe.idRecipe}`} className="recipe-card">
      <div className="recipe-card-image">
        {recipe.imageRecipe ? (
          <img src={fileUrl(recipe.imageRecipe)} alt={recipe.nameRecipe} />
        ) : (
          <div className="recipe-card-placeholder">Sin imagen</div>
        )}
      </div>
      <div className="recipe-card-body">
        <span className="recipe-card-category">{recipe.categoryRecipe}</span>
        <h3>{recipe.nameRecipe}</h3>
        <p className="recipe-card-author">
          Por {recipe.authorNameUser} {recipe.authorLastnameUser}
        </p>
      </div>
    </Link>
  );
}
