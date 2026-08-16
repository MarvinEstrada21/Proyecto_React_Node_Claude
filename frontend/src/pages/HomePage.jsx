import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import RecipeCard from '../components/RecipeCard';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page') || '1');

  useEffect(() => {
    api.get('/recipes/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get('/recipes', { params: { search, category, page, limit: 12 } })
      .then(({ data }) => {
        if (cancelled) return;
        setRecipes(data.recipes);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar las recetas.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, category, page]);

  const updateParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      next.set('page', '1');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  return (
    <div className="page">
      <div className="filters-bar">
        <input
          type="search"
          placeholder="Buscar receta por nombre..."
          defaultValue={search}
          onChange={(e) => updateParam('search', e.target.value)}
        />
        <select value={category} onChange={(e) => updateParam('category', e.target.value)}>
          <option value="">Todas las categorias</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="page-status">Cargando recetas...</p>}
      {error && <p className="page-status error">{error}</p>}
      {!loading && !error && recipes.length === 0 && (
        <p className="page-status">No se encontraron recetas.</p>
      )}

      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.idRecipe} recipe={recipe} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            Anterior
          </button>
          <span>
            Pagina {page} de {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
