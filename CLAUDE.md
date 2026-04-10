# ConfortRide E-commerce

## Sobre o Projeto
E-commerce para a marca ConfortRide — acessórios para motociclistas. Apenas **2 produtos** no catálogo:
1. **Encosto para motos** — possui **6 variações** de modelo para atender diferentes motos do mercado
2. Um segundo produto (acessório complementar)

**Não usar aba de categorias no site** — com apenas 2 produtos, categorias são desnecessárias.

## Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Radix UI + Wouter (router) + tRPC client
- **Backend:** Node.js + Express + tRPC + Drizzle ORM
- **Banco:** Supabase (PostgreSQL) + Supabase Auth
- **Storage:** S3 (AWS)
- **Package Manager:** pnpm

## Estrutura
```
confortride-ecommerce/
├── client/src/          # Frontend React SPA
│   ├── pages/           # Home, Products, ProductDetail, Cart, Login, Admin, MyAccount
│   ├── components/      # UI components + admin panels
│   ├── hooks/           # Custom hooks
│   ├── contexts/        # Cart, Theme contexts
│   └── lib/             # Utilitários
├── server/              # Backend Express + tRPC
│   ├── routers.ts       # Todos os endpoints tRPC
│   ├── db.ts            # Helpers do banco (Supabase)
│   ├── notifications.ts # Push notifications
│   └── _core/           # Core services
├── shared/              # Tipos e constantes compartilhados
└── drizzle/             # Schema e migrations
```

## Fase 2 — Funcionalidades a Desenvolver (Proposta Aceita)
1. **Gateway de Pagamento** — Mercado Pago (PIX, cartão, boleto)
2. **E-mails Pós-Venda** — Resend/Brevo (confirmação, pagamento, rastreio, agradecimento, cupom)
3. **WhatsApp Automatizado** — Z-API ou Meta Business API
4. **Página de Notícias** — Seção editorial com categorias/tags + SEO
5. **Agente de Notícias (IA)** — Busca diária automática + sugestão no admin
6. **Melhorias Complementares** — Frete (Melhor Envio), cupons, avaliações, SEO técnico
7. **Variantes de Produto** — Sistema para o encosto com 6 modelos de moto

## Convenções
- Idioma do código: inglês (nomes de variáveis, funções, componentes)
- Idioma da UI: português brasileiro
- Autenticação: Supabase Auth com JWT
- RBAC: `adminProcedure` / `protectedProcedure` / `publicProcedure`
- Validação: Zod
- Forms: React Hook Form
- Testes: Vitest

## Comandos
```bash
pnpm dev          # Dev server
pnpm build        # Build produção
pnpm test         # Rodar testes
```
