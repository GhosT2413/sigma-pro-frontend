export const environment = {
  production: false,
  // En desarrollo, ng serve usa proxy.conf.json para reenviar
  // /api/* hacia http://localhost:3000/api/* SIN pasar por el
  // navegador -> no hace falta enableCors() en el backend.
  apiUrl: '/api',
};
