const http = require('http');

const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || '1.0.0';

const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', version: VERSION }));
    return;
  }

  // Main endpoint
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Docker + Jenkins App</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              padding: 30px;
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            h1 { margin-top: 0; }
            .info { 
              background: rgba(255, 255, 255, 0.2);
              padding: 15px;
              border-radius: 5px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Jenkins + Docker Demo App</h1>
            <div class="info">
              <strong>Version:</strong> ${VERSION}
            </div>
            <div class="info">
              <strong>Build:</strong> ${process.env.BUILD_NUMBER || 'local'}
            </div>
            <div class="info">
              <strong>Node Version:</strong> ${process.version}
            </div>
            <div class="info">
              <strong>Status:</strong> ✅ Running in Docker Container!
            </div>
            <p>This app was built and deployed using Jenkins Pipeline!</p>
          </div>
        </body>
      </html>
    `);
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📦 Version: ${VERSION}`);
  console.log(`🐳 Running in Docker container!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});