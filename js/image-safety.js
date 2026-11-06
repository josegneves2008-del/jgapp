/**
 * DailyMed — segurança das fotografias de medicamentos.
 * - Só aceita JPEG, PNG, GIF e WebP, identificados pelos bytes iniciais (não pela extensão nem pelo MIME declarado).
 * - Rejeita SVG, HTML e qualquer outro conteúdo.
 * - Antes de guardar, volta a codificar a imagem num <canvas> (JPEG, máx. 1024 px): o resultado não contém metadados nem conteúdo embutido.
 * - Ao apresentar, valida de novo; se falhar, a app mostra um placeholder.
 */
(function (global) {
  'use strict';

  var MAX_DATA_URL_CHARS = 3 * 1024 * 1024;   // ~2,2 MB de imagem
  var MAX_FILE_BYTES = 15 * 1024 * 1024;      // ficheiro original antes de reduzir
  var MAX_SIDE = 1024;
  var DATA_URL_RE = /^data:image\/(jpeg|jpg|png|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

  /** Identifica o formato pelos primeiros bytes. Devolve 'jpeg' | 'png' | 'gif' | 'webp' | null. */
  function sniff(bytes) {
    if (!bytes || bytes.length < 12) return null;
    var b = bytes;
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'jpeg';
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A) return 'png';
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return 'gif';
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'webp';
    return null;
  }

  function base64Head(b64, nBytes) {
    var chars = Math.ceil(nBytes / 3) * 4;
    var bin;
    try { bin = (typeof atob === 'function') ? atob(b64.slice(0, chars)) : Buffer.from(b64.slice(0, chars), 'base64').toString('binary'); }
    catch (e) { return null; }
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /** Valida um data URL de imagem guardado. Síncrono, sem rede, seguro para usar em cada apresentação. */
  function validateImageDataUrl(uri) {
    if (typeof uri !== 'string' || !uri) return { ok: false, reason: 'vazia' };
    if (uri.length > MAX_DATA_URL_CHARS) return { ok: false, reason: 'demasiado grande' };
    var m = DATA_URL_RE.exec(uri);
    if (!m) return { ok: false, reason: 'formato não permitido' };
    var declared = m[1] === 'jpg' ? 'jpeg' : m[1];
    if (m[2].length % 4 !== 0) return { ok: false, reason: 'conteúdo inválido' };
    var real = sniff(base64Head(m[2], 16));
    if (!real) return { ok: false, reason: 'o conteúdo não é uma imagem JPEG, PNG, GIF ou WebP' };
    if (real !== declared) return { ok: false, reason: 'o conteúdo não corresponde ao tipo declarado' };
    return { ok: true, type: real };
  }

  /** Devolve o próprio URI se for uma imagem válida, ou null. */
  function safeImageSrc(uri) { return validateImageDataUrl(uri).ok ? uri : null; }

  /**
   * Prepara um ficheiro escolhido pelo utente: verifica os bytes reais, descodifica-o como imagem
   * e volta a codificá-lo como JPEG. Devolve Promise<string data URL>; rejeita com Error(mensagem para o utente).
   */
  function prepareImageFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('Nenhum ficheiro escolhido.'));
      if (file.size > MAX_FILE_BYTES) return reject(new Error('A fotografia é demasiado grande (máximo 15 MB).'));
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Não foi possível ler o ficheiro.')); };
      reader.onload = function () {
        var bytes = new Uint8Array(reader.result);
        var type = sniff(bytes.subarray(0, 16));
        if (!type) return reject(new Error('Formato não permitido. Usa uma fotografia JPEG, PNG, GIF ou WebP.'));
        var blob = new Blob([bytes], { type: 'image/' + type });
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('O ficheiro não é uma imagem válida.')); };
        img.onload = function () {
          try {
            var w = img.naturalWidth, h = img.naturalHeight;
            if (!w || !h) throw new Error('imagem vazia');
            var scale = Math.min(1, MAX_SIDE / Math.max(w, h));
            var canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(w * scale));
            canvas.height = Math.max(1, Math.round(h * scale));
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            var out = canvas.toDataURL('image/jpeg', 0.85);
            URL.revokeObjectURL(url);
            var check = validateImageDataUrl(out);
            if (!check.ok) return reject(new Error('Não foi possível preparar a fotografia (' + check.reason + ').'));
            resolve(out);
          } catch (e) { URL.revokeObjectURL(url); reject(new Error('Não foi possível preparar a fotografia.')); }
        };
        img.src = url;
      };
      reader.readAsArrayBuffer(file);
    });
  }

  var api = { sniff: sniff, validateImageDataUrl: validateImageDataUrl, safeImageSrc: safeImageSrc, prepareImageFile: prepareImageFile, MAX_DATA_URL_CHARS: MAX_DATA_URL_CHARS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.DailyMedImages = api;
})(typeof window !== 'undefined' ? window : globalThis);
