// Arquivo de API catch-all do Vercel para funcionar com Next.js API Routes
// Intercepta todas as chamadas de API no ambiente do Vercel

export default function handler(req, res) {
  // Detalhes da requisição para depuração
  const { route } = req.query;
  const path = Array.isArray(route) ? route.join('/') : route;
  
  // Configurando resposta
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  
  // Resposta de depuração
  res.end(JSON.stringify({
    status: 'success',
    message: 'API route handler do Vercel funcionando',
    details: {
      path: path,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    },
    note: 'Este endpoint é apenas para depuração do Vercel. A aplicação completa deve ser acessada através da URL principal.'
  }));
}