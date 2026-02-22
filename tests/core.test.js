const { describe, it, expect } = require('vitest');
const core = require('../js/core.js');

describe('core utilities', () => {
  it('todayStr uses local date parts', () => {
    const d = new Date(2026, 1, 2); // 2026-02-02 local
    expect(core.todayStr(d)).toBe('2026-02-02');
  });

  it('getValidityStatus returns expired/soon/ok', () => {
    const today = new Date(2026, 1, 22); // 2026-02-22
    expect(core.getValidityStatus('2026-02-21', today).type).toBe('expired');
    expect(core.getValidityStatus('2026-02-25', today).type).toBe('soon');
    expect(core.getValidityStatus('2026-04-01', today).type).toBe('ok');
  });

  it('parseHash splits path and params', () => {
    const res = core.parseHash('#medicacao-armario?cat=Febre&q=teste');
    expect(res.path).toBe('medicacao-armario');
    expect(res.params.cat).toBe('Febre');
    expect(res.params.q).toBe('teste');
  });

  it('detectInteractions finds known combinations', () => {
    const meds = [
      { name: 'Sildenafil', substance: '' },
      { name: 'Brufen', substance: 'ibuprofeno' }
    ];
    const known = [
      { id: 'sildenafil-brufen', drug1: ['sildenafil'], drug2: ['brufen', 'ibuprofeno'] }
    ];
    const found = core.detectInteractions(meds, known);
    expect(found.length).toBe(1);
    expect(found[0].id).toBe('sildenafil-brufen');
  });

  it('buildTimeGrid and toggleTimeSelection', () => {
    const slots = core.buildTimeGrid('06:00', '07:00', 30);
    expect(slots).toEqual(['06:00', '06:30', '07:00']);
    let sel = [];
    sel = core.toggleTimeSelection(sel, '06:00', 3).times;
    sel = core.toggleTimeSelection(sel, '06:30', 3).times;
    sel = core.toggleTimeSelection(sel, '07:00', 3).times;
    const res = core.toggleTimeSelection(sel, '07:30', 3);
    expect(res.exceeded).toBe(true);
  });

  it('pickPeriodId finds matching period', () => {
    const periods = [
      { id: 'pequeno_almoco', start: '06:00', end: '10:00' },
      { id: 'almoco', start: '12:00', end: '14:00' }
    ];
    expect(core.pickPeriodId(['13:00'], periods)).toBe('almoco');
    expect(core.pickPeriodId([], periods)).toBe('pequeno_almoco');
  });
});
