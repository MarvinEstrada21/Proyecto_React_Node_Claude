export function extractError(err) {
  const data = err && err.response && err.response.data;
  return {
    message: (data && data.error) || 'Ocurrio un error inesperado. Intenta de nuevo.',
    details: (data && data.details) || {},
  };
}
