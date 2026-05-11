let app;

function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    req.headers['access-control-request-method'] || 'GET,POST,PATCH,OPTIONS'
  );
  res.setHeader('Vary', 'Access-Control-Request-Headers, Access-Control-Request-Method');
}

module.exports = (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (!app) {
    const appModule = require('../dist/app');
    app = appModule.default || appModule.app;
  }

  return app(req, res);
};
