// Etapa 1 — correções urgentes: aviso de lista limitada, regras em revisão e "A minha ficha".
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const core = require('../js/core.js');
const root = (p) => fileURLToPath(new URL('../' + p, import.meta.url));

// data.js é um script de browser: corre num contexto isolado e lê as variáveis globais.
function loadDataJs() {
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(root('js/data.js'), 'utf8') + '\n;this.__known = KNOWN_INTERACTIONS;', ctx);
  return ctx.__known;
}

describe('interações: aviso de lista limitada', () => {
  it('o aviso indica quantas combinações a app conhece e que a lista vazia não é garantia', () => {
    const t = core.interactionCheckTexts(3);
    expect(t.limitNotice).toContain('Verificação limitada');
    expect(t.limitNotice).toContain('3 combinações');
    expect(t.limitNotice).toContain('não significa que ela não exista');
    expect(t.limitNotice).toMatch(/farmacêutico ou médico/);
  });

  it('a mensagem de lista vazia já não diz apenas "Nenhuma interação detetada"', () => {
    const t = core.interactionCheckTexts(3);
    expect(t.emptyMessage).not.toBe('Nenhuma interação detetada.');
    expect(t.emptyMessage).toContain('Nenhuma das 3 combinações que a app conhece');
  });

  it('usa singular com 1 regra', () => {
    expect(core.interactionCheckTexts(1).limitNotice).toContain('1 combinação ');
  });
});

describe('interações: regras em revisão', () => {
  const known = loadDataJs();

  it('mantém as 3 regras existentes (nenhuma acrescentada nem apagada)', () => {
    expect(known.map((i) => i.id)).toEqual(['sildenafil-brufen', 'lisinopril-brufen', 'xarelto-brufen']);
  });

  it('a regra sildenafil + ibuprofeno está em revisão e já não tem o texto incorreto', () => {
    const r = known.find((i) => i.id === 'sildenafil-brufen');
    expect(r.reviewStatus).toBe('em_revisao');
    expect(r.mechanism).toBe('');
    expect(JSON.stringify(r).toLowerCase()).not.toContain('não devem ser coadministrados');
    expect(r.reviewNote).toContain('validação por um farmacêutico');
  });

  it('interactionReviewInfo devolve rótulos de revisão só para regras em revisão', () => {
    const rev = core.interactionReviewInfo(known.find((i) => i.id === 'sildenafil-brufen'));
    expect(rev).toMatchObject({ inReview: true, label: 'Em revisão', severityLabel: 'Gravidade por confirmar' });
    const ok = core.interactionReviewInfo(known.find((i) => i.id === 'lisinopril-brufen'));
    expect(ok.inReview).toBe(false);
    expect(core.interactionReviewInfo(null).inReview).toBe(false);
  });

  it('a deteção continua a encontrar a regra em revisão no armário', () => {
    const found = core.detectInteractions([{ name: 'Sildenafil' }, { name: 'Brufen' }], known);
    expect(found.map((i) => i.id)).toContain('sildenafil-brufen');
  });
});

describe('"Folheto informativo" passa a "A minha ficha"', () => {
  const app = readFileSync(root('js/app.js'), 'utf8');

  it('não há textos visíveis "Folheto informativo" nem "Ver folheto"', () => {
    expect(app).not.toContain("'Folheto informativo'");
    expect(app).not.toContain('>Ver folheto<');
    expect(app).not.toContain('leaflet-kicker">Folheto<');
  });

  it('o ecrã e as ligações usam "A minha ficha" e explicam a origem dos dados', () => {
    expect(app).toContain("pageHeader('A minha ficha'");
    expect((app.match(/Ver a minha ficha/g) || []).length).toBe(2);
    expect(app).toContain('não substitui o folheto oficial do medicamento');
  });

  it('a rota antiga continua a funcionar (ligações guardadas não partem)', () => {
    expect(app).toContain("'medicacao-folheto': viewMedicacaoFolheto");
  });
});
