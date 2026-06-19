import { createHash } from 'node:crypto';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);
const appName = process.env.APP_NAME || 'todo-app';
const issuer = mustEnv('OIDC_ISSUER_URL');
const audience = process.env.OIDC_AUDIENCE || 'frontend';
const jwksUrl = process.env.OIDC_JWKS_URL || `${issuer}/protocol/openid-connect/certs`;
const todosByUser = new Map();
const jwksClient = jwksRsa({
  cache: true,
  cacheMaxAge: 5 * 60 * 1000,
  jwksUri: jwksUrl,
  rateLimit: true
});

http
  .createServer(async (req, res) => {
    try {
      if (req.url === '/healthz') return json(res, 200, { ok: true });
      if (!req.url?.startsWith('/api/')) return json(res, 404, { error: 'not_found' });

      const claims = await authenticate(req);
      const userTodos = todosFor(claims.sub);
      const url = new URL(req.url, 'http://localhost');

      if (req.method === 'GET' && url.pathname === '/api/me') {
        return json(res, 200, {
          app: appName,
          subject: claims.sub,
          username: claims.preferred_username || claims.email || claims.name || claims.sub,
          email: claims.email || null,
          issuer: claims.iss
        });
      }

      if (req.method === 'GET' && url.pathname === '/api/todos') {
        return json(res, 200, userTodos);
      }

      if (req.method === 'POST' && url.pathname === '/api/todos') {
        const body = await readJson(req);
        const title = String(body.title || '').trim();
        if (!title) return json(res, 400, { error: 'title_required' });
        const todo = { id: createId(), title, done: false };
        userTodos.push(todo);
        return json(res, 201, todo);
      }

      const todoMatch = url.pathname.match(/^\/api\/todos\/([^/]+)$/);
      if (todoMatch && req.method === 'PATCH') {
        const todo = userTodos.find((item) => item.id === todoMatch[1]);
        if (!todo) return json(res, 404, { error: 'not_found' });
        const body = await readJson(req);
        if ('title' in body) todo.title = String(body.title || '').trim() || todo.title;
        if ('done' in body) todo.done = Boolean(body.done);
        return json(res, 200, todo);
      }

      if (todoMatch && req.method === 'DELETE') {
        const index = userTodos.findIndex((item) => item.id === todoMatch[1]);
        if (index === -1) return json(res, 404, { error: 'not_found' });
        userTodos.splice(index, 1);
        return json(res, 204);
      }

      return json(res, 404, { error: 'not_found' });
    } catch (error) {
      const status = error.status || 500;
      return json(res, status, { error: status === 500 ? 'server_error' : error.message });
    }
  })
  .listen(port, host, () => {
    console.log(`${appName} backend listening on ${host}:${port}`);
  });

function mustEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function todosFor(subject) {
  if (!todosByUser.has(subject)) todosByUser.set(subject, []);
  return todosByUser.get(subject);
}

async function authenticate(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) throw httpError(401, 'missing_bearer_token');
  return verifyJwt(match[1]);
}

function verifyJwt(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ['RS256'],
        audience,
        issuer
      },
      (error, decoded) => {
        if (error) return reject(httpError(401, 'bad_token'));
        return resolve(decoded);
      }
    );
  });
}

function getSigningKey(header, callback) {
  jwksClient.getSigningKey(header.kid, (error, key) => {
    if (error) return callback(error);
    return callback(null, key.getPublicKey());
  });
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function json(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  if (status !== 204) res.end(JSON.stringify(body));
  else res.end();
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createId() {
  return createHash('sha256').update(`${Date.now()}:${Math.random()}`).digest('hex').slice(0, 12);
}
