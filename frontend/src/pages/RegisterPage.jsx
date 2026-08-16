import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../api/errors';
import FieldError from '../components/FieldError';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    nameUser: '',
    lastnameUser: '',
    password: '',
    confirmPassword: '',
  });
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImage(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, imageUser: 'La imagen debe ser JPG, PNG o WEBP.' }));
      e.target.value = '';
      setImage(null);
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrors((prev) => ({ ...prev, imageUser: 'La imagen no puede superar 2 MB.' }));
      e.target.value = '';
      setImage(null);
      return;
    }
    setErrors((prev) => ({ ...prev, imageUser: undefined }));
    setImage(file);
  };

  const validate = () => {
    const next = {};
    if (!form.username.trim()) next.username = 'El username es obligatorio.';
    else if (form.username.trim().length < 3 || form.username.trim().length > 100)
      next.username = 'El username debe tener entre 3 y 100 caracteres.';
    else if (!/^[a-zA-Z0-9_.-]+$/.test(form.username.trim()))
      next.username = 'Solo letras, numeros, punto, guion y guion bajo.';

    if (!form.nameUser.trim()) next.nameUser = 'El nombre es obligatorio.';
    else if (form.nameUser.trim().length > 100) next.nameUser = 'Maximo 100 caracteres.';

    if (!form.lastnameUser.trim()) next.lastnameUser = 'El apellido es obligatorio.';
    else if (form.lastnameUser.trim().length > 100) next.lastnameUser = 'Maximo 100 caracteres.';

    if (!form.password) next.password = 'La contrasena es obligatoria.';
    else if (form.password.length < 8 || form.password.length > 72)
      next.password = 'La contrasena debe tener entre 8 y 72 caracteres.';

    if (form.confirmPassword !== form.password) next.confirmPassword = 'Las contrasenas no coinciden.';

    setErrors((prev) => ({ ...prev, ...next, imageUser: prev.imageUser }));
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    if (errors.imageUser) return;

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('username', form.username.trim());
      data.append('nameUser', form.nameUser.trim());
      data.append('lastnameUser', form.lastnameUser.trim());
      data.append('password', form.password);
      if (image) data.append('imageUser', image);

      await register(data);
      navigate('/', { replace: true });
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

  return (
    <div className="page auth-page">
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Username
          <input value={form.username} onChange={(e) => setField('username', e.target.value)} maxLength={100} />
        </label>
        <FieldError message={errors.username} />

        <label>
          Nombre
          <input value={form.nameUser} onChange={(e) => setField('nameUser', e.target.value)} maxLength={100} />
        </label>
        <FieldError message={errors.nameUser} />

        <label>
          Apellido
          <input
            value={form.lastnameUser}
            onChange={(e) => setField('lastnameUser', e.target.value)}
            maxLength={100}
          />
        </label>
        <FieldError message={errors.lastnameUser} />

        <label>
          Contrasena
          <input
            type="password"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
          />
        </label>
        <FieldError message={errors.password} />

        <label>
          Confirmar contrasena
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setField('confirmPassword', e.target.value)}
          />
        </label>
        <FieldError message={errors.confirmPassword} />

        <label>
          Foto de perfil (opcional)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
        </label>
        <FieldError message={errors.imageUser} />

        <FieldError message={formError} />

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
      <p>
        Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
      </p>
    </div>
  );
}
