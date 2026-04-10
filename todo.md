# ConfortRide E-commerce - TODO

## Assets & Setup
- [x] Upload logo ConfortRide para CDN
- [x] Upload vídeo HeroSection para CDN
- [x] Configurar identidade visual (cores, fontes, CSS)

## Banco de Dados
- [x] Schema: tabela products (nome, descrição, preço, categoria, estoque, imagem)
- [x] Schema: tabela categories
- [x] Schema: tabela orders (pedidos)
- [x] Schema: tabela order_items (itens do pedido)
- [x] Schema: tabela addresses (endereços do cliente)
- [x] Schema: tabela push_subscriptions
- [x] Executar migrations

## Backend (tRPC Routers)
- [x] Router: products (listar, buscar, detalhe, CRUD admin)
- [x] Router: categories (listar, CRUD admin)
- [x] Router: orders (criar, listar por usuário, listar admin, atualizar status, stats)
- [x] Router: cart (gerenciado no frontend via CartContext)
- [x] Router: addresses (criar, listar, atualizar, deletar)
- [x] Router: push (subscribe, unsubscribe, mySubscriptions)
- [x] Router: users (list - admin only)
- [x] adminProcedure para controle de acesso por role

## Frontend - Layout
- [x] Navbar responsiva com logo, busca, carrinho e login
- [x] Footer com informações da empresa
- [x] Layout geral da loja

## Frontend - Hero Page
- [x] Hero Section com vídeo de fundo (HeroSectionConfotRide.mp4)
- [x] Logo ConfortRide na Hero Page
- [x] CTA (Call to Action) na Hero Page
- [x] Seção de categorias em destaque
- [x] Seção de produtos em destaque

## Frontend - Catálogo
- [x] Página de listagem de produtos com filtros
- [x] Filtro por categoria
- [x] Busca por nome/descrição
- [x] Página de detalhe do produto
- [x] Breadcrumb de navegação

## Frontend - Carrinho
- [x] Drawer/página de carrinho
- [x] Adicionar produto ao carrinho
- [x] Remover produto do carrinho
- [x] Alterar quantidade
- [x] Cálculo de subtotal e total
- [x] Persistência do carrinho (localStorage)

## Frontend - Checkout
- [x] Formulário de endereço de entrega
- [x] Resumo do pedido
- [x] Confirmação do pedido
- [x] Página de sucesso do pedido

## Frontend - Autenticação
- [x] Login/logout via Manus OAuth
- [x] Redirecionamento por role (admin vs cliente)
- [x] Proteção de rotas por role

## Frontend - Área do Cliente
- [x] Página de perfil do cliente
- [x] Histórico de pedidos
- [x] Gerenciamento de notificações push

## Frontend - Painel Admin
- [x] Dashboard administrativo com estatísticas
- [x] Gestão de produtos (listar, criar, editar, excluir)
- [x] Gestão de pedidos (listar, visualizar, atualizar status)
- [x] Gestão de categorias

## PWA
- [x] Configurar manifest.json (nome: ConfortRide, ícone com logo)
- [x] Configurar service worker para cache offline
- [x] Suporte a instalação manual (sem prompt automático)
- [x] Ícone PWA com logo ConfortRide
- [x] Registro do service worker no App.tsx

## Notificações de Pedidos
- [x] Notificação push via PWA para admin quando novo pedido é criado
- [x] Notificação push via PWA para cliente quando status do pedido muda
- [x] Notificação por email/plataforma para admin (via notifyOwner do Manus)
- [x] Integração com sistema de notificações do Manus (notifyOwner)
- [x] Tabela push_subscriptions para armazenar inscrições de notificação
- [x] Hook usePushNotifications no frontend

## Testes
- [x] Testes unitários dos routers principais (22 testes passando)
- [x] Testes de RBAC (admin vs user)
- [x] Seed de dados de exemplo (produtos e categorias)

## Entrega
- [x] Checkpoint final
- [ ] Publicação

## Pendente (próximas iterações)
- [ ] Upload de imagens de produtos via painel admin (S3)
- [ ] Integração com gateway de pagamento
- [ ] Cálculo de frete (integração Correios/Melhor Envio)
- [ ] Informações da empresa (CNPJ, endereço, contato)
- [ ] Página "Sobre Nós"
- [ ] Política de privacidade e termos de uso
- [ ] Integração WhatsApp Business API (notificações)

## Correções Hero Section
- [x] Trocar slogan para "ConfortRide - para homem e máquina"
- [x] Fazer upload do vídeo correto para CDN e corrigir exibição na Hero Section

## Migração para Supabase
- [x] Configurar credenciais Supabase (URL, Anon Key, Service Role Key)
- [x] Instalar @supabase/supabase-js no projeto
- [x] Criar schema PostgreSQL no Supabase (todas as tabelas do e-commerce)
- [x] Migrar autenticação: substituir Manus OAuth pelo Supabase Auth (email+senha)
- [x] Migrar server/db.ts para usar Supabase client (PostgreSQL)
- [x] Migrar server/routers.ts para usar Supabase como fonte de dados
- [x] Atualizar frontend: criar página Login com Supabase Auth
- [x] Atualizar main.tsx para enviar Bearer token JWT do Supabase
- [x] Remover todas as referências ao Manus OAuth do frontend
- [x] Seed de dados iniciais no Supabase (6 categorias e 10 produtos)
- [x] 30 testes passando (auth, routers, Supabase connection)

## Correções Visuais
- [x] Logo pequena no header — aumentar para encostar nas bordas superior e inferior do header- [x] Imagem quebrada na página de login — corrigir URL da logo