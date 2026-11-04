"""Teste no browser (Playwright) da etapa 1 do DailyMed, incluindo a revisão final da PR #1.
Dados 100% fictícios. Uso: python tests/browser/teste-browser-etapa1.py URL [pasta_capturas]
"""
import json, sys, time
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765/index.html"
SHOTS = sys.argv[2] if len(sys.argv) > 2 else "."
GREY = "rgb(117, 117, 117)"   # #757575
RED_OLD = "rgb(211, 47, 47)"  # #D32F2F, a cor antiga da regra em revisão
RED = "rgb(179, 38, 30)"      # #B3261E

def med(i, name, substance, **kw):
    d = {"id": i, "name": name, "substance": substance, "dosage": "1 un", "quantity": 5,
         "isActive": True, "category": "Outros", "notes": ""}
    d.update(kw); return d

SO_REVISAO = [med("t1", "Medicamento DEMO A", "sildenafil (teste)", notes="nota de teste"),
              med("t2", "Medicamento DEMO B", "ibuprofeno (teste)")]
TODAS = SO_REVISAO + [med("t4", "Medicamento DEMO D", "lisinopril (teste)"),
                      med("t5", "Medicamento DEMO E", "rivaroxabano (teste)")]
XSS = [med("x1", '<img src=x onerror="window.__xss=1">', "sildenafil", dosage='<script>window.__xss=2</script>',
           notes='<b onmouseover="window.__xss=3">n</b>', manufacturer='"><svg onload="window.__xss=4">'),
       med("x2", "Brufen <i>demo</i>", "ibuprofeno")]

fails, errs = [], []
def chk(name, cond):
    print(("OK  " if cond else "FAIL") + " " + name)
    if not cond: fails.append(name)

def set_meds(pg, meds):
    pg.evaluate("m => localStorage.setItem('dailymed_medications', JSON.stringify(m))", meds)

def go(pg, route):
    pg.goto(URL + "#" + route); pg.reload(); time.sleep(1.2)

def border(pg, sel):
    return pg.eval_on_selector(sel, "e => getComputedStyle(e).borderLeftColor")

with sync_playwright() as p:
    br = p.chromium.launch()
    pg = br.new_page(viewport={"width": 390, "height": 844})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); time.sleep(1)
    pg.evaluate("() => { localStorage.setItem('dailymed_onboarding_done','true'); localStorage.setItem('dailymed_extra_teste','manter'); }")

    # 1. Só o par em revisão no armário
    set_meds(pg, SO_REVISAO); go(pg, "medicacao-interacoes")
    chk("aviso de lista limitada visível", pg.locator("#interactions-limit-notice").is_visible())
    chk("aviso: verificação limitada", "Verificação limitada" in pg.inner_text("#interactions-limit-notice"))
    chk("regra em revisão NÃO está em 'Interações detetadas'", pg.locator("#interactions-detected").count() == 0)
    chk("mensagem: nenhuma combinação com descrição", pg.locator("#interactions-none-described").is_visible())
    chk("secção 'A confirmar com o farmacêutico' visível", pg.locator("#interactions-review").is_visible())
    rv = "#interactions-review [data-interaction='sildenafil-brufen']"
    txt = pg.inner_text(rv)
    chk("revisão: 'Em revisão' e 'Gravidade por confirmar'", "Em revisão" in txt and "Gravidade por confirmar" in txt)
    chk("revisão: explica validação por farmacêutico", "validação por um farmacêutico" in txt)
    chk("revisão: não mostra 'grave'", "grave" not in txt.lower())
    chk("revisão: secção diz que não confirma nem exclui", "não confirma nem exclui" in pg.inner_text("#interactions-review"))
    c = border(pg, rv)
    chk(f"revisão: borda cinzenta ({c})", c == GREY and c not in (RED_OLD, RED))
    c2 = border(pg, "#interactions-known [data-interaction='sildenafil-brufen']")
    chk(f"lista geral: regra em revisão também cinzenta ({c2})", c2 == GREY)
    pg.screenshot(path=f"{SHOTS}/revisao-1-so-regra-em-revisao.png", full_page=True)

    # 2. As três regras encontradas
    set_meds(pg, TODAS); go(pg, "medicacao-interacoes")
    ids = pg.eval_on_selector_all("#interactions-detected [data-interaction]", "es => es.map(e => e.dataset.interaction)")
    chk(f"detetadas = só regras com descrição ({ids})", ids == ["lisinopril-brufen", "xarelto-brufen"])
    chk("regras com descrição marcadas 'Texto por validar'",
        all("Texto por validar" in pg.inner_text(f"#interactions-detected [data-interaction='{i}']") for i in ids))
    chk("texto original do rivaroxabano mantido", "aumenta o risco de hemorragias" in pg.inner_text("#interactions-detected"))
    chk("nenhum cartão verde", all(border(pg, f"#interactions-known [data-interaction='{i}']") != "rgb(46, 125, 50)"
                                    for i in ["sildenafil-brufen", "lisinopril-brufen", "xarelto-brufen"]))
    pg.screenshot(path=f"{SHOTS}/revisao-2-tres-regras.png", full_page=True)

    # 3. Lista vazia
    set_meds(pg, [med("t3", "Medicamento DEMO C", "substância fictícia")]); go(pg, "medicacao-interacoes")
    empty = pg.inner_text("#interactions-empty")
    chk("lista vazia não é garantia", "Nenhuma das 3 combinações" in empty and pg.locator("#interactions-limit-notice").is_visible())
    chk("lista vazia: sem secção de revisão", pg.locator("#interactions-review").count() == 0)

    # 4. Modal depois de guardar um medicamento
    set_meds(pg, SO_REVISAO); go(pg, "medicacao-armario")
    pg.evaluate("() => showInteractionsModal(detectInteractions())")
    chk("modal (só revisão): título 'Combinação a confirmar'", pg.inner_text("#modal-interactions-title") == "Combinação a confirmar")
    chk("modal (só revisão): sem lista de detetadas", pg.locator("#modal-interactions-detected").count() == 0)
    mc = border(pg, "#modal-interactions-review [data-interaction='sildenafil-brufen']")
    chk(f"modal: regra em revisão cinzenta ({mc})", mc == GREY)
    pg.screenshot(path=f"{SHOTS}/revisao-3-modal.png")
    pg.eval_on_selector("#modal-close-btn", "b => b.click()")  # o CDN do Tailwind está bloqueado no ambiente de teste e .hidden não se aplica
    set_meds(pg, TODAS); go(pg, "medicacao-armario")
    pg.evaluate("() => showInteractionsModal(detectInteractions())")
    chk("modal (todas): 'Interações detetadas' + secção a confirmar",
        pg.inner_text("#modal-interactions-title") == "Interações detetadas"
        and pg.locator("#modal-interactions-detected [data-interaction]").count() == 2
        and pg.locator("#modal-interactions-review [data-interaction]").count() == 1)
    pg.eval_on_selector("#modal-close-btn", "b => b.click()")  # o CDN do Tailwind está bloqueado no ambiente de teste e .hidden não se aplica

    # 5. Injeção de HTML através dos dados do utilizador
    set_meds(pg, XSS)
    for r in ["medicacao-interacoes", "medicacao-armario", "medicacao-detalhes?id=x1", "medicacao-folheto?id=x1"]:
        go(pg, r)
    go(pg, "medicacao-armario"); pg.evaluate("() => showInteractionsModal(detectInteractions())"); time.sleep(0.3)
    chk("nenhum código injetado foi executado", pg.evaluate("() => window.__xss") is None)
    chk("nenhum elemento injetado no DOM", pg.locator("img[src='x'], svg[onload], b[onmouseover]").count() == 0)
    pg.eval_on_selector("#modal-close-btn", "b => b.click()")  # o CDN do Tailwind está bloqueado no ambiente de teste e .hidden não se aplica

    # 6. A minha ficha (rota antiga)
    set_meds(pg, SO_REVISAO); go(pg, "medicacao-detalhes?id=t1")
    body = pg.inner_text("body")
    chk("detalhes: 'Ver a minha ficha'", "Ver a minha ficha" in body and "Ver folheto" not in body)
    pg.goto(URL + "#medicacao-folheto?id=t1"); time.sleep(1.2)
    body = pg.inner_text("body")
    chk("rota #medicacao-folheto abre 'A minha ficha'", "A minha ficha" in body and "Folheto informativo" not in body)
    chk("ficha: dados do utilizador, não folheto oficial", "dados introduzidos por ti" in body.lower() and "não substitui o folheto oficial" in body)
    chk("ficha mostra os dados guardados", "Medicamento DEMO A" in body and "sildenafil (teste)" in body)
    pg.screenshot(path=f"{SHOTS}/revisao-4-a-minha-ficha.png", full_page=True)

    # 7. Os dados não são apagados
    before = pg.evaluate("() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])))")
    for r in ["medicacao-interacoes", "medicacao-folheto?id=t1", "medicacao-armario"]:
        go(pg, r)
    after = pg.evaluate("() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])))")
    b, a = json.loads(before), json.loads(after)
    chk("medicamentos iguais depois de navegar e recarregar", b.get("dailymed_medications") == a.get("dailymed_medications"))
    chk("nenhuma chave do localStorage desapareceu", set(b) <= set(a) and a.get("dailymed_extra_teste") == "manter")
    br.close()

app_errs = [e for e in errs if "tailwind is not defined" not in e]
chk(f"sem erros JavaScript da app ({len(app_errs)})", not app_errs)
print("erros ignorados (CDN bloqueado no ambiente de teste):", sorted(set(errs) - set(app_errs)))
print(f"FALHAS ({len(fails)}):", fails)
sys.exit(1 if fails else 0)
