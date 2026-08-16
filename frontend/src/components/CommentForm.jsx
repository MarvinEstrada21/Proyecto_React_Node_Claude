import { useState } from 'react';
import FieldError from './FieldError';

const MAX_LEN = 500;

export default function CommentForm({ onSubmit }) {
  const [bodyComment, setBodyComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = bodyComment.trim();
    if (!trimmed) {
      setError('El comentario no puede estar vacio.');
      return;
    }
    if (trimmed.length > MAX_LEN) {
      setError(`El comentario no puede superar los ${MAX_LEN} caracteres.`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setBodyComment('');
    } catch (err) {
      setError(err.message || 'No se pudo publicar el comentario.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        value={bodyComment}
        onChange={(e) => setBodyComment(e.target.value)}
        maxLength={MAX_LEN}
        placeholder="Escribe un comentario..."
        rows={3}
      />
      <FieldError message={error} />
      <button type="submit" className="primary-button" disabled={submitting}>
        {submitting ? 'Publicando...' : 'Publicar comentario'}
      </button>
    </form>
  );
}
