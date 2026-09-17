export const environment = {
  production: true,
  // En producción ya no hay proxy de ng serve: si sirves este build desde un dominio
  // distinto al del backend, ahí SÍ vas a necesitar enableCors() en el backend
  // (o servir ambos bajo el mismo dominio con un reverse proxy tipo Nginx).
  apiUrl: 'https://api.sigmapro.example.com',
};
