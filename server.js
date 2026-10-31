/**
 * 나고야 여행 가이드 로컬 웹 서버 (server.js)
 * Node.js 내장 모듈만 사용하여 별도 설치 없이 구동
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // CORS 및 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');

  let reqUrl = decodeURIComponent(req.url.split('?')[0]);
  if (reqUrl === '/') reqUrl = '/index.html';

  const safePath = path.normalize(path.join(BASE_DIR, reqUrl));

  if (!safePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('접근이 거부되었습니다.');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('파일을 찾을 수 없습니다.');
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(safePath).pipe(res);
  });
});

// 로컬 IP 주소 탐색
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log('=====================================================');
  console.log(`✈️ 나고야 여행 가이드 웹서비스가 시작되었습니다.`);
  console.log(`• PC 브라우저 접속: http://localhost:${PORT}`);
  console.log(`• 스마트폰 접속(동일 Wi-Fi): http://${localIp}:${PORT}`);
  console.log('=====================================================');
});

