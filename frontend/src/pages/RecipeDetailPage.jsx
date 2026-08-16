import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { fileUrl } from '../api/client';
import { extractError } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import CommentForm from '../components/CommentForm';
import CommentItem from '../components/CommentItem';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get(`/recipes/${id}`)
      .then(({ data }) => {
        setRecipe(data.recipe);
        setIngredients(data.ingredients);
        setComments(data.comments);
      })
      .catch(() => setError('No se pudo cargar la receta.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const canModify = recipe && user && (user.roleUser === 'admin' || user.username === recipe.usernameAuthor);

  const handleDeleteRecipe = async () => {
    if (!window.confirm('Seguro que deseas eliminar esta receta?')) return;
    try {
      await api.delete(`/recipes/${id}`);
      navigate('/');
    } catch (err) {
      setError(extractError(err).message);
    }
  };

  const handleAddComment = async (bodyComment) => {
    try {
      await api.post(`/recipes/${id}/comments`, { bodyComment });
      load();
    } catch (err) {
      throw new Error(extractError(err).message);
    }
  };

  const handleDeleteComment = async (idComment) => {
    if (!window.confirm('Eliminar este comentario?')) return;
    try {
      await api.delete(`/comments/${idComment}`);
      setComments((prev) => prev.filter((c) => c.idComment !== idComment));
    } catch (err) {
      setError(extractError(err).message);
    }
  };

  if (loading) return <p className="page-status">Cargando...</p>;
  if (error && !recipe) return <p className="page-status error">{error}</p>;
  if (!recipe) return null;

  return (
    <div className="page recipe-detail">
      <div className="recipe-detail-header">
        {recipe.imageRecipe && <img src={fileUrl(recipe.imageRecipe)} alt={recipe.nameRecipe} />}
        <div>
          <span className="recipe-card-category">{recipe.categoryRecipe}</span>
          <h1>{recipe.nameRecipe}</h1>
          <p className="recipe-card-author">
            Por {recipe.authorNameUser} {recipe.authorLastnameUser}
          </p>
          {canModify && (
            <div className="button-row">
              <Link to={`/recetas/${id}/editar`} className="secondary-button">
                Editar
              </Link>
              <button type="button" className="danger-button" onClick={handleDeleteRecipe}>
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <section>
        <h2>Descripcion</h2>
        <p>{recipe.descriptionRecipe}</p>
      </section>

      <section>
        <h2>Ingredientes</h2>
        <ul className="ingredients-list">
          {ingredients.map((ing) => (
            <li key={ing.idIngredient}>
              <strong>{ing.quantityIngredient}</strong> {ing.nameIngredient}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Preparacion</h2>
        <p className="steps-text">{recipe.stepsRecipe}</p>
      </section>

      <section>
        <h2>Comentarios</h2>
        {user ? (
          <CommentForm onSubmit={handleAddComment} />
        ) : (
          <p className="page-status">
            <Link to="/login">Inicia sesion</Link> para comentar.
          </p>
        )}
        {error && <p className="page-status error">{error}</p>}
        <ul className="comments-list">
          {comments.map((comment) => (
            <CommentItem key={comment.idComment} comment={comment} onDelete={handleDeleteComment} />
          ))}
        </ul>
      </section>
    </div>
  );
}
