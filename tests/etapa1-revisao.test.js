// Etapa 1 — revisão final (PR #1): apresentação das regras em revisão, cores e escape de HTML.
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const core = require('../js/core.js');
const root = (p) => fileURLToPath(new URL('../' + p, import.meta.url));

function loadDataJs() {
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(root('js/data.js'), 'utf8') + '\n;this.__known = KNOWN_INTERACTIONS;', ctx);
  return ctx.__known;
}

const known = loadDataJs();
const byId = (id) => known.find((i) => i.id === id);
const GREY = core.INTERACTION_TONES.revisao;
const RED = core.INTERACTION_TONES.grave;

describe('regra em revisão: nunca apresentada como interação confirmada', () => {
  const sild = byId('sildenafil-brufen');

  it('fica a cinzento, com "Gravidade por confirmar" e a nota de validação por farmacêutico', () => {
    const d = core.interactionDisplay(sild);
    expect(d.status).toBe('em_revisao');
    expect(d.color).toBe(GREY);
    expect(d.color).not.toBe(RED);
    expect(d.severityLabel).toBe('Gravidade por confirmar');
    expect(d.note).toContain('validação por um farmacêutico');
    expect(d.showMechanism).toBe(false);
  });

  it('o cartão não usa a cor vermelha guardada nos dados nem a palavra "grave"', () => {
    const html = core.renderInteractionItem(sild);
    expect(sild.color).toBe('#D32F2F'); // o dado antigo continua no ficheiro, mas é ignorado
    expect(html).not.toContain('#D32F2F');
    expect(html).not.toContain(RED);
    expect(html).toContain('border-left-color:' + GREY);
    expect(html).toContain('Gravidade por confirmar');
    expect(html).toContain('Em revisão');
    expect(html.toLowerCase()).not.toContain('grave');
    expect(html).toContain('data-status="em_revisao"');
  });

  it('é separada das interações detetadas', () => {
    const found = core.detectInteractions([{ name: 'Sildenafil 50 mg' }, { name: 'Brufen 400' }], known);
    const g = core.groupDetectedInteractions(found);
    expect(g.described).toHaveLength(0);
    expect(g.inReview.map((i) => i.id)).toEqual(['sildenafil-brufen']);
  });

  it('o texto da secção não confirma nem exclui a interação', () => {
    expect(core.REVIEW_MATCH_TEXT).toContain('não confirma nem exclui');
    expect(core.REVIEW_MATCH_TEXT).toContain('farmacêutico');
  });
});

describe('restantes regras: texto mantido, marcado como por validar', () => {
  it('lisinopril e rivaroxabano mostram o texto original com "Texto por validar"', () => {
    for (const id of ['lisinopril-brufen', 'xarelto-brufen']) {
      const r = byId(id);
      const d = core.interactionDisplay(r);
      expect(d.status).toBe('por_validar');
      expect(d.statusLabel).toBe('Texto por validar');
      expect(d.note).toContain('ainda não foi revista por um farmacêutico');
      const html = core.renderInteractionItem(r);
      expect(html).toContain(core.escapeHtml(r.mechanism)); // texto clínico intacto
      expect(html).toContain('Gravidade indicada: ' + r.severity);
    }
  });

  it('nenhuma regra usa verde (verde sugere "sem risco")', () => {
    for (const r of known) expect(core.interactionDisplay(r).color.toUpperCase()).not.toBe('#2E7D32');
  });

  it('só uma regra com reviewStatus "validada" aparece como validada', () => {
    const d = core.interactionDisplay({ id: 'x', severity: 'ligeira', mechanism: 'm', reviewStatus: 'validada' });
    expect(d.status).toBe('validada');
    expect(d.note).toBe('');
    expect(known.some((r) => core.interactionDisplay(r).status === 'validada')).toBe(false);
  });

  it('gravidade desconhecida fica neutra', () => {
    const d = core.interactionDisplay({ id: 'x', severity: 'inventada', mechanism: '' });
    expect(d.color).toBe(core.INTERACTION_TONES.desconhecida);
    expect(d.severityLabel).toBe('Gravidade não indicada');
  });
});

describe('segurança: texto dinâmico escapado e estilos só com valores internos', () => {
  const evil = {
    id: '"><img src=x onerror=alert(1)>',
    combination: '<script>alert(1)</script>',
    mechanism: '<img src=x onerror=alert(2)>',
    severity: 'grave" onmouseover="alert(3)',
    color: 'red;background:url(javascript:alert(4))',
    reviewNote: '<b>x</b>',
  };

  it('nenhuma etiqueta HTML dos dados passa para o cartão', () => {
    for (const r of [evil, { ...evil, reviewStatus: 'em_revisao' }]) {
      const html = core.renderInteractionItem(r);
      expect(html).not.toMatch(/<script|<img|<b>/i);
      expect(html).not.toContain('onerror="');
      expect(html).not.toContain('" onmouseover="');
      expect(html).not.toContain('javascript:');
      expect(html).not.toContain('background:url');
    }
  });

  it('a cor do cartão é sempre uma das cores internas', () => {
    const allowed = Object.values(core.INTERACTION_TONES);
    for (const r of [...known, evil, {}, null]) {
      const m = core.renderInteractionItem(r).match(/border-left-color:([^"]+)"/);
      expect(allowed).toContain(m[1]);
    }
  });

  it('app.js já não usa i.color nem insere texto das regras sem escape', () => {
    const app = readFileSync(root('js/app.js'), 'utf8');
    expect(app).not.toMatch(/\bi\.color\b/);
    expect(app).not.toContain("+ i.combination +");
    expect(app).not.toContain("+ i.mechanism +");
    expect((app.match(/DailyMedCore\.renderInteractionItem\(/g) || []).length).toBe(2); // ecrã + modal
  });
});

describe('lista limitada com diferentes números de regras', () => {
  it.each([0, 1, 2, 3, 25])('%i regras: nunca promete ausência de interações', (n) => {
    const t = core.interactionCheckTexts(n);
    expect(t.limitNotice).toContain('Não encontrar uma interação aqui não significa que ela não exista');
    for (const s of [t.limitNotice, t.emptyMessage]) {
      expect(s).not.toMatch(/sem interações|não há interações|é seguro|nenhuma interação detetada/i);
    }
    expect(t.emptyMessage).toContain(n === 1 ? '1 combinação' : n + ' combinações');
  });

  it('agrupamento de listas vazias, mistas e inválidas', () => {
    expect(core.groupDetectedInteractions([])).toEqual({ described: [], inReview: [] });
    expect(core.groupDetectedInteractions(null)).toEqual({ described: [], inReview: [] });
    const all = core.detectInteractions([{ name: 'Sildenafil' }, { name: 'Lisinopril' }, { name: 'Xarelto' }, { name: 'Ibuprofeno' }], known);
    const g = core.groupDetectedInteractions(all);
    expect(g.described.map((i) => i.id)).toEqual(['lisinopril-brufen', 'xarelto-brufen']);
    expect(g.inReview.map((i) => i.id)).toEqual(['sildenafil-brufen']);
  });
});
