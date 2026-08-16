import FieldError from './FieldError';

export default function IngredientsEditor({ ingredients, onChange, error }) {
  const updateItem = (index, field, value) => {
    const next = ingredients.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  };

  const addItem = () => {
    onChange([...ingredients, { nameIngredient: '', quantityIngredient: '' }]);
  };

  const removeItem = (index) => {
    if (ingredients.length === 1) return;
    onChange(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div className="ingredients-editor">
      <label>Ingredientes</label>
      {ingredients.map((item, index) => (
        <div className="ingredient-row" key={index}>
          <input
            type="text"
            placeholder="Nombre (ej. Harina)"
            maxLength={255}
            value={item.nameIngredient}
            onChange={(e) => updateItem(index, 'nameIngredient', e.target.value)}
          />
          <input
            type="text"
            placeholder="Cantidad (ej. 2 tazas)"
            maxLength={100}
            value={item.quantityIngredient}
            onChange={(e) => updateItem(index, 'quantityIngredient', e.target.value)}
          />
          <button
            type="button"
            className="icon-button"
            onClick={() => removeItem(index)}
            disabled={ingredients.length === 1}
            aria-label="Eliminar ingrediente"
          >
            &times;
          </button>
        </div>
      ))}
      <button type="button" className="secondary-button" onClick={addItem}>
        + Agregar ingrediente
      </button>
      <FieldError message={error} />
    </div>
  );
}
