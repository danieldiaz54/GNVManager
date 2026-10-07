$content = Get-Content backend/src/infrastructure/webserver/server.ts -Raw
$newContent = $content -replace '(?sm)const PORT = process\.env\.PORT.*?\);', 'if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[Seguridad Activada] Servidor escuchando en el puerto ${PORT}`);
  });
}

export default app;
'
Set-Content backend/src/infrastructure/webserver/server.ts $newContent
