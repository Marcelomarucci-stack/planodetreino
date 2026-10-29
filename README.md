# Plano de Treino – 13 semanas

PWA mobile-first para acompanhar o plano de treino (02/11/2026 → 30/01/2027) pelo celular.
Sem backend: os dados ficam no `localStorage` do aparelho, com backup em JSON.

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes do calendário/plano
npm run build    # gera dist/
```

## Editar o plano

Tudo está em [`src/data/plan.ts`](src/data/plan.ts):

- `exercises` – catálogo (nome, tipo de registro, observação técnica). O **id** liga o histórico
  entre semanas; mantenha-o ao renomear um exercício.
- `fase1`, `fase2`, `fase3` – treinos de segunda (1) a sábado (6). Use
  `ex(id, séries, reps, { rest, perSide, note, optional })` e `cardio(id, nome, { minutes, rounds, detail })`.
  Um dia pode ser uma função `(semana) => treino` quando varia por semana.
- `DELOAD_WEEKS`, `DELOAD_SETS`, `DELOAD_CARDIO_FACTOR` – regras da semana leve, aplicadas automaticamente.
- `WARMUP` e `SAFETY_NOTICE` – aquecimento dos dias de força e aviso fixo.

Depois de editar, rode `npm test` para conferir que todo dia continua válido.

## Dados e backup

- Registros salvos em `localStorage` (chave `planodetreino:data`) com `schemaVersion`;
  migrações futuras ficam em `migrate()` em `src/lib/store.ts`.
- **Ajustes → Exportar backup** gera um `.json` (no celular abre o menu de compartilhar).
- **Importar** mescla: para cada treino, fica a versão editada mais recentemente.

## Deploy no GitHub Pages

O workflow `.github/workflows/deploy.yml` publica a cada push na `main`.

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Faça merge desta branch na `main` (ou rode o workflow manualmente em **Actions → Deploy no GitHub Pages → Run workflow**).
3. O app fica em `https://<usuario>.github.io/planodetreino/`.

## Deploy na Vercel (alternativa)

Importe o repositório em vercel.com → framework **Vite** (build `npm run build`, saída `dist`). Não precisa de
variáveis: sem `BASE_PATH`, o app usa `/`.

## Instalar no celular

Abra o endereço no navegador uma vez (com internet):

- **iPhone (Safari):** Compartilhar → “Adicionar à Tela de Início”.
- **Android (Chrome):** menu ⋮ → “Instalar app”.

Depois disso funciona offline. Atualizações são baixadas sozinhas quando houver internet.

Obs.: no iPhone, o app instalado e o Safari guardam dados **separados** — use sempre o ícone da tela inicial.
