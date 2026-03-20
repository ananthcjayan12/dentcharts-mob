const { createProxyMiddleware } = require('http-proxy-middleware');

const STG_TARGET = 'https://dentapistg.cue360.in';
const proxyOptions = {
  target: STG_TARGET,
  pathFilter: ['/api/**', '/files/**', '/private/**', '/assets/**', '/socket.io/**'],
  changeOrigin: true,
  secure: true,
  ws: true,
  cookieDomainRewrite: 'localhost',
};

module.exports = function setupProxy(app) {
  console.log(`[setupProxy] Proxying API routes to ${STG_TARGET}`);
  app.use(createProxyMiddleware(proxyOptions));
};
