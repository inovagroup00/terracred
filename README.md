# Credshow

MVP de credito pre-aprovado para casas de show. 4 apps em monorepo compartilhando Supabase.

## Apps

| App | Path | URL prevista | Funcao |
|-----|------|--------------|--------|
| Promotor | `apps/promotor` | `credshow-promotor.vercel.app` | Consulta CPF na fila, dispara SMS |
| Cliente | `apps/cliente` | `credshow-cliente.vercel.app` | Onboarding e geracao do QR |
| Caixa | `apps/caixa` | `credshow-caixa.vercel.app` | Scanner QR + PIN + ativacao |
| Admin | `apps/admin` | `credshow-admin.vercel.app` | Dashboard, eventos, tokens |

## Stack

- Turborepo + pnpm workspaces
- React + Vite + TypeScript + Tailwind + shadcn/ui
- Supabase (DB, Auth, Edge Functions, Realtime)
- Vercel (deploy)
- Playwright (E2E)

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Estrutura

```
credshow/
  apps/
    promotor/  cliente/  caixa/  admin/
  packages/
    types/   # tipos gerados do supabase
    lib/     # supabase client, helpers, validadores
    ui/      # componentes shadcn compartilhados
  supabase/
    migrations/
    functions/
```
