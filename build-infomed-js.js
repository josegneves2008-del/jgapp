/**
 * Gera lista_infomed_data.js a partir de lista_infomed.json
 * para permitir pesquisa sem servidor (abrir index.html diretamente).
 * Executar uma vez: node build-infomed-js.js
 */
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'lista_infomed.json');
const outPath = path.join(__dirname, 'lista_infomed_data.js');

console.log('A ler', jsonPath, '...');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log('A escrever', outPath, '...');
fs.writeFileSync(outPath, 'window.LISTA_INFOMED = ' + JSON.stringify(data) + ';\n', 'utf8');
console.log('Feito. Pode abrir index.html diretamente (sem servidor).');
