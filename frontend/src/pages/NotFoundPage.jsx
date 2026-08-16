import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page page-status">
      <h1>404</h1>
      <p>La pagina que buscas no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}
