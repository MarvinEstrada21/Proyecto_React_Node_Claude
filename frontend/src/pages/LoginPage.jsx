import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../api/errors';
import FieldError from '../components/FieldError';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!username.trim()) next.username = 'El username es obligatorio.';
    if (!password) next.password = 'La contrasena es obligatoria.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setFormError(extractError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page auth-page">
      <h1>Iniciar sesion</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={100} />
        </label>
        <FieldError message={errors.username} />

        <label>
          Contrasena
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <FieldError message={errors.password} />

        <FieldError message={formError} />

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <p>
        No tienes cuenta? <Link to="/registro">Crea una</Link>
      </p>
    </div>
  );
}
