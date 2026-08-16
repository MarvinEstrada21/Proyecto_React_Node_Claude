import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { fileUrl } from '../api/client';
import { extractError } from '../api/errors';
import FieldError from '../components/FieldError';
import IngredientsEditor from '../components/IngredientsEditor';

const LIMITS = { nameRecipe: 200, categoryRecipe: 100, descriptionRecipe: 500, stepsRecipe: 500 };
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

const emptyForm = { nameRecipe: '', categoryRecipe: '', descriptionRecipe: '', stepsRecipe: '' };
const emptyIngredient = () => ({ nameIngredient: '', quantityIngredient: '' });

export default function RecipeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [ingredients, setIngredients] = useState([emptyIngredient()]);
  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/recipes/${id}`)
      .then(({ data }) => {
        setForm({
          nameRecipe: data.recipe.nameRecipe,
          categoryRecipe: data.recipe.categoryRecipe,
          descriptionRecipe: data.recipe.descriptionRecipe,
          stepsRecipe: data.recipe.stepsRecipe,
        });
        setCurrentImage(data.recipe.imageRecipe);
        setIngredients(
          data.ingredients.length
            ? data.ingredients.map((i) => ({
                nameIngredient: i.nameIngredient,
                quantityIngredient: i.quantityIngredient,
              }))
            : [emptyIngredient()]
        );
      })
      .catch(() => setFormError('No se pudo cargar la receta.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImage(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: 'La imagen debe ser JPG, PNG o WEBP.' }));
      e.target.value = '';
      setImage(null);
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrors((prev) => ({ ...prev, image: 'La imagen no puede superar 2 MB.' }));
      e.target.value = '';
      setImage(null);
      return;
    }
    setErrors((prev) => ({ ...prev, image: undefined }));
    setImage(file);
  };

  const validate = () => {
    const next = {};
    for (const [field, max] of Object.entries(LIMITS)) {
      const value = form[field].trim();
      if (!value) next[field] = 'Este campo es obligatorio.';
      else if (value.length > max) next[field] = `Maximo ${max} caracteres.`;
    }

    const cleanIngredients = ingredients
      .map((i) => ({ nameIngredient: i.nameIngredient.trim(), quantityIngredient: i.quantityIngredient.trim() }))
      .filter((i) => i.nameIngredient || i.quantityIngredient);

    if (cleanIngredients.length === 0) {
      next.ingredients = 'La receta requiere al menos un ingrediente.';
    } else {
      const names = new Set();
      for (const ing of cleanIngredients) {
        if (!ing.nameIngredient || !ing.quantityIngredient) {
          next.ingredients = 'Completa el nombre y la cantidad de cada ingrediente.';
          break;
        }
        const key = ing.nameIngredient.toLowerCase();
        if (names.has(key)) {
          next.ingredients = `El ingrediente "${ing.nameIngredient}" esta repetido.`;
          break;
        }
        names.add(key);
      }
    }

    setErrors((prev) => ({ ...prev, ...next, image: prev.image }));
    return { valid: Object.keys(next).length === 0, cleanIngredients };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const { valid, cleanIngredients } = validate();
    if (!valid || errors.image) return;

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('nameRecipe', form.nameRecipe.trim());
      data.append('categoryRecipe', form.categoryRecipe.trim());
      data.append('descriptionRecipe', form.descriptionRecipe.trim());
      data.append('stepsRecipe', form.stepsRecipe.trim());
      data.append(
        'ingredients',
        JSON.stringify(cleanIngredients.map((ing, idx) => ({ ...ing, orderIngredient: idx })))
      );
      if (image) data.append('imageRecipe', image);

      if (isEdit) {
        const { data: res } = await api.patch(`/recipes/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        navigate(`/recetas/${res.idRecipe}`);
      } else {
        const { data: res } = await api.post('/recipes', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        navigate(`/recetas/${res.idRecipe}`);
      }
    } catch (err) {
      const { message, details } = extractError(err);
      if (details && Object.keys(details).length > 0) {
        setErrors((prev) => ({ ...prev, ...details }));
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="page-status">Cargando...</p>;

  return (
    <div className="page auth-page">
      <h1>{isEdit ? 'Editar receta' : 'Nueva receta'}</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Nombre de la receta
          <input
            value={form.nameRecipe}
            onChange={(e) => setField('nameRecipe', e.target.value)}
            maxLength={LIMITS.nameRecipe}
          />
        </label>
        <FieldError message={errors.nameRecipe} />

        <label>
          Categoria
          <input
            value={form.categoryRecipe}
            onChange={(e) => setField('categoryRecipe', e.target.value)}
            maxLength={LIMITS.categoryRecipe}
            placeholder="Ej. Postres, Ensaladas, Sopas..."
          />
        </label>
        <FieldError message={errors.categoryRecipe} />

        <label>
          Descripcion
          <textarea
            value={form.descriptionRecipe}
            onChange={(e) => setField('descriptionRecipe', e.target.value)}
            maxLength={LIMITS.descriptionRecipe}
            rows={3}
          />
        </label>
        <FieldError message={errors.descriptionRecipe} />

        <IngredientsEditor ingredients={ingredients} onChange={setIngredients} error={errors.ingredients} />

        <label>
          Pasos de preparacion
          <textarea
            value={form.stepsRecipe}
            onChange={(e) => setField('stepsRecipe', e.target.value)}
            maxLength={LIMITS.stepsRecipe}
            rows={5}
          />
        </label>
        <FieldError message={errors.stepsRecipe} />

        <label>
          Imagen (opcional)
          {currentImage && !image && (
            <img className="current-image-preview" src={fileUrl(currentImage)} alt="Actual" />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
        </label>
        <FieldError message={errors.image} />

        <FieldError message={formError} />

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar receta'}
        </button>
      </form>
    </div>
  );
}
