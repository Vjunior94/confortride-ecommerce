# Planejamento de Execução — ConfortRide Fase 2

**Início:** 10/04/2026 | **Prazo:** 1 mês | **Status:** Em andamento

## Contexto
- 2 produtos apenas (encosto para motos com 6 variações + 1 acessório)
- Sem aba de categorias no site
- Proposta aceita: R$ 4.000

---

## SEMANA 1 — Gateway de Pagamento (Mercado Pago)

| # | Tarefa | Status |
|---|--------|--------|
| 1.1 | Sistema de Variantes de Produto (tabela + UI) | ⬜ Pendente |
| 1.2 | Remover categoria da navegação e simplificar catálogo | ⬜ Pendente |
| 1.3 | Integração Mercado Pago — Backend (SDK, preferência, webhook) | ⬜ Pendente |
| 1.4 | Integração Mercado Pago — Frontend (step de pagamento no checkout) | ⬜ Pendente |
| 1.5 | Webhook + atualização automática de status do pedido | ⬜ Pendente |

---

## SEMANA 2 — E-mails Pós-Venda + WhatsApp

| # | Tarefa | Status |
|---|--------|--------|
| 2.1 | Setup Resend/Brevo (SDK, domínio, DNS) | ⬜ Pendente |
| 2.2 | Templates de e-mail (confirmação, pagamento, rastreio, agradecimento, cupom) | ⬜ Pendente |
| 2.3 | Disparo automático por evento (mudança de status do pedido) | ⬜ Pendente |
| 2.4 | Setup WhatsApp (Z-API ou Evolution API) | ⬜ Pendente |
| 2.5 | Templates WhatsApp (pedido, pagamento, rastreio, entrega) | ⬜ Pendente |
| 2.6 | Notification service centralizado (push + e-mail + WhatsApp) | ⬜ Pendente |

---

## SEMANA 3 — Página de Notícias + Agente IA

| # | Tarefa | Status |
|---|--------|--------|
| 3.1 | Schema de notícias (news_articles, news_tags) | ⬜ Pendente |
| 3.2 | Admin — Gestão de notícias (CRUD, editor, publicação) | ⬜ Pendente |
| 3.3 | Frontend — Página de News (listagem, artigo, filtros) | ⬜ Pendente |
| 3.4 | Agente de Notícias IA (busca + resumo + sugestão no admin) | ⬜ Pendente |
| 3.5 | Agendamento diário (cron/edge function) | ⬜ Pendente |
| 3.6 | SEO das notícias (sitemap, meta tags, JSON-LD) | ⬜ Pendente |

---

## SEMANA 4 — Melhorias Complementares + Deploy

| # | Tarefa | Status |
|---|--------|--------|
| 4.1 | Cálculo de frete (Melhor Envio) | ⬜ Pendente |
| 4.2 | Sistema de cupons (tabela, checkout, admin) | ⬜ Pendente |
| 4.3 | Avaliações de produtos (reviews + moderação) | ⬜ Pendente |
| 4.4 | SEO técnico (sitemap, robots, meta tags, Open Graph) | ⬜ Pendente |
| 4.5 | Upload de imagens no admin (S3) | ⬜ Pendente |
| 4.6 | Testes finais (fluxo completo end-to-end) | ⬜ Pendente |
| 4.7 | Deploy em produção (Vercel + domínio) | ⬜ Pendente |

---

## Pré-requisitos do Cliente

| Item | Quando | Status |
|------|--------|--------|
| Credenciais Mercado Pago (Public Key + Access Token) | Semana 1 | ⬜ |
| Domínio registrado + acesso DNS | Semana 2 | ⬜ |
| Número de celular dedicado para WhatsApp | Semana 2 | ⬜ |
| Escolher API de IA (OpenAI ou Anthropic) | Semana 3 | ⬜ |
| Conta Melhor Envio + dimensões/peso dos produtos | Semana 4 | ⬜ |

---

## Log de Progresso

### 10/04/2026
- Proposta aceita pelo cliente
- Planejamento criado
- Início da Semana 1
