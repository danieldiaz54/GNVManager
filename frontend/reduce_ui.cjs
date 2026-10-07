const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('c:/Users/DesarrolloIT Android/Desktop/Daniel/GNV/frontend/src', filePath => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Reducir grosor de bordes
    content = content.replace(/border-4/g, 'border-2');
    content = content.replace(/stroke-\[3px\]/g, 'stroke-[2px]');
    
    // Suavizar color de los bordes muy negros a slate oscuro para que no sea tan pesado
    content = content.replace(/border-black/g, 'border-slate-800');
    
    // Reducir tamaño de las sombras sólidas
    content = content.replace(/shadow-\[12px_12px_0px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-md shadow-slate-300');
    content = content.replace(/shadow-\[8px_8px_0px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-md shadow-slate-300');
    content = content.replace(/shadow-\[8px_0px_0px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-md shadow-slate-300');
    content = content.replace(/shadow-\[6px_6px_0px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-sm shadow-slate-300');
    content = content.replace(/shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-sm shadow-slate-300');
    content = content.replace(/shadow-\[4px_4px_0px_0px_rgba\(255,255,255,1\)\]/g, 'shadow-sm shadow-slate-200');
    content = content.replace(/shadow-\[4px_4px_0px_0px_rgba\(200,200,200,1\)\]/g, 'shadow-sm shadow-slate-300');
    
    // Reducir text-shadows
    content = content.replace(/textShadow: '4px 4px 0px rgba\(0,0,0,0\.1\)'/g, "textShadow: '2px 2px 0px rgba(0,0,0,0.05)'");

    fs.writeFileSync(filePath, content);
  }
});
console.log('Done!');
