// Este arquivo serve como proxy para o servidor Express no Vercel
// Ele encaminha todas as solicitações de API para o servidor principal

export default function handler(req, res) {
  // Redirecionando para o servidor principal
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  
  // Resposta temporária para depuração
  res.end(JSON.stringify({
    status: 'error',
    message: 'API não disponível neste caminho. Use o endpoint principal em /',
    requestPath: req.url,
    vercelInfo: {
      isVercel: true,
      envVars: Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')),
      apiPath: req.url
    }
  }));
}