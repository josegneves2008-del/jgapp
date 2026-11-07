/**
 * Corre o teste de browser da Etapa 1 (Python + Playwright para Python) contra um servidor local próprio.
 * Uso: npm run test:etapa1   (ou: node tests/browser/run-etapa1.js)
 * Requisitos: Python 3 com o pacote do tests/browser/requirements.txt e o Chromium do Playwright (ver docs/TESTES.md).
 * O executável de Python pode ser indicado com a variável PYTHON (por omissão: "python" no Windows, "python3" nos outros).
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
srv.listen(0, '127.0.0.1', () => {
  const url = 'http://127.0.0.1:' + srv.address().port + '/index.html';
  const shots = fs.mkdtempSync(path.join(require('os').tmpdir(), 'dailymed-etapa1-'));
  const py = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  const child = spawn(py, [path.join(__dirname, 'teste-browser-etapa1.py'), url, shots], { stdio: 'inherit' });
  child.on('error', (e) => { console.error('Não foi possível executar ' + py + ': ' + e.message); srv.close(); process.exit(2); });
  child.on('exit', (code) => { srv.close(); process.exit(code == null ? 1 : code); });
});
