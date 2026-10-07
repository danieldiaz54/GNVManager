const fs = require('fs');
let c = fs.readFileSync('backend/src/infrastructure/webserver/server.ts', 'utf8');
c = c.replace(/const PORT = process\.env\.PORT[\s\S]*\}\);/m, 'if (process.env.VERCEL !== "1") {\n  const PORT = process.env.PORT || 3000;\n  app.listen(PORT, () => {\n    console.log("[Seguridad Activada] Servidor escuchando en el puerto ");\n    console.log("[CORS] Orígenes permitidos: ");\n  });\n}\n\nexport default app;\n');
fs.writeFileSync('backend/src/infrastructure/webserver/server.ts', c);
