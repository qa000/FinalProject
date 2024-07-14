const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // 알라딘 API 경로 프록시
    createProxyMiddleware({
      target: 'http://www.aladin.co.kr/ttb/api',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // 알라딘 API 요청 시 '/api' 경로 제거
      },
    })
  );
  
  app.use(
    '/iamport', // 아임포트 API 경로 프록시
    createProxyMiddleware({
      target: 'https://api.iamport.kr',
      changeOrigin: true,
      pathRewrite: {
        '^/iamport': '', // 아임포트 API 요청 시 '/iamport' 경로 제거
      },
    })
  );


};
