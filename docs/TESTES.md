# Testes da DailyMed

Todos os testes usam só dados fictícios.

## Versões testadas

| Ferramenta | Versão | Onde está declarada |
|---|---|---|
| Node.js | 22.x (testado com 22.23.4) | `package.json` → `engines` |
| npm | 10.x (testado com 10.9.9) | — |
| Vitest | 5.1.0 | `package.json` → `devDependencies` (versão exata) + `package-lock.json` |
| Playwright (Node) | 1.63.0 | `package.json` → `devDependencies` (versão exata) + `package-lock.json` |
| Chromium do Playwright | o da versão 1.63.0 (testado com 153.0.8010.12) | instalado com `npm run browsers` |
| Python | 3.x (testado com 3.13.18) | — |
| Playwright (Python) | 1.63.0 | `tests/browser/requirements.txt` |

Não foram testadas outras versões.

## Instalação limpa

```bash
git clone --branch dailymed-sprint2-integration https://github.com/josegneves2008-del/jgapp.git
cd jgapp
npm ci                       # instala exatamente o que está no package-lock.json
npm run browsers             # descarrega o Chromium do Playwright (precisa de acesso à internet)
python -m venv .venv         # opcional, recomendado
# Windows: .venv\Scripts\activate    ·    Linux/macOS: source .venv/bin/activate
pip install -r tests/browser/requirements.txt
python -m playwright install chromium
```

## Correr os testes

| Comando | O que corre |
|---|---|
| `npm test` (ou `npx vitest run`) | testes unitários (Vitest), em `Europe/Lisbon` |
| `npm run test:browser` | testes no browser da Sprint 2 (Playwright, Chromium real, localStorage e Web Locks reais) |
| `npm run test:etapa1` | teste no browser da Etapa 1 (Python); arranca o próprio servidor local |
| `npm run test:all` | os três, por esta ordem |

Os testes de browser arrancam um servidor local próprio numa porta livre, por isso não é preciso ter a app aberta.
Também aceitam um URL: `node tests/browser/sprint2.e2e.js http://127.0.0.1:8765/index.html` e
`python tests/browser/teste-browser-etapa1.py http://127.0.0.1:8765/index.html <pasta-para-capturas>`.

Se o Python não se chamar `python3` (Linux/macOS) ou `python` (Windows), indica-o com a variável `PYTHON`.

## Fuso horário

A app usa de propósito o fuso horário do dispositivo: os lembretes seguem o relógio do utente.
Para os testes não dependerem da máquina:

- Vitest: `vitest.config.mjs` fixa `TZ=Europe/Lisbon`, e um teste confirma o fuso antes dos testes de mudança de hora.
- Browser: todos os contextos do Playwright usam `timezoneId: 'Europe/Lisbon'`. Um contexto em `America/New_York` confirma que a app segue o fuso do dispositivo.

Para confirmar que os resultados não dependem do fuso da máquina: `TZ=America/New_York npm test` e `TZ=Asia/Tokyo npm run test:browser`.

## Sem acesso à internet para o Chromium

`npm run browsers` descarrega o browser do servidor do Playwright. Se já existir uma instalação dos browsers do Playwright 1.63.0 noutra pasta, indica-a com `PLAYWRIGHT_BROWSERS_PATH=<pasta>`.
