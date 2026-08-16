import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fileUrl } from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        Recetario
      </Link>
      <nav className="navbar-links">
        <Link to="/">Recetas</Link>
        {user && <Link to="/recetas/nueva">Nueva receta</Link>}
        {!user && <Link to="/login">Iniciar sesion</Link>}
        {!user && <Link to="/registro">Crear cuenta</Link>}
        {user && (
          <span className="navbar-user">
            {user.imageUser && (
              <img className="avatar-sm" src={fileUrl(user.imageUser)} alt="" />
            )}
            {user.nameUser}
            {user.roleUser === 'admin' && <span className="badge">admin</span>}
            <button type="button" className="link-button" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </span>
        )}
      </nav>
    </header>
  );
}
