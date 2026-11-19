# IntegraCurso — Front-End (MVP)

Portal web acolhedor e acessível para administração e acompanhamento de um **cursinho popular comunitário preparatório para o ENEM** (*Cursinho Comunitário Bonsucesso — Educação que transforma*).

## Princípios de UX, IHC e Acessibilidade
- **Linguagem cidadã**: textos claros em português cotidiano, sem jargões burocráticos ou técnicos.
- **Acessibilidade WCAG 2.1 AA**: alto contraste em Modo Claro e Modo Escuro, corpo de texto a partir de `16px`, áreas clicáveis amplas (`>= 44x44px`), ícones sempre acompanhados de rótulos de texto e ajuste de **Tamanho da Fonte** (Normal / Grande / Extra Grande) nas preferências do perfil.
- **Mobile-first**: pensado para jovens estudantes, professores voluntários e pais/responsáveis que acessam majoritariamente pelo celular.

## Stack Tecnológica
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (Design System próprio com tokens institucionais e semânticos)
- **React Router DOM** (Controle de rotas protegido por perfil — RBAC)
- **Lucide React** (Iconografia acessível)

## Perfis de Acesso (RBAC)
1. `student` — **Estudante** *(visão completa implementada: Início, Minhas Aulas, Meus Materiais, Eventos e Avisos, Meu Desempenho)*
2. `guardian` — **Mãe / Pai / Responsável** *(suporte a múltiplos estudantes vinculados)*
3. `teacher` — **Professor(a) Voluntário(a)**
4. `coordinator` — **Coordenação Pedagógica** *(centraliza gestão acadêmica, matrículas, copa/merenda e registro interno de doações)*

## Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Gerar build de produção (verificação TypeScript + Vite)
npm run build
```

### Acesso Rápido para Demonstração
Na tela de login (`/login`), utilize o bloco **Acesso Rápido para Demonstração** para entrar com qualquer um dos 4 perfis em 1 clique, ou faça login manual usando a senha padrão de demonstração `123456`.

- Catálogo visual dos componentes do Design System: `/design-system`

## Estrutura de Pastas

```text
src/
├── components/
│   ├── ui/         # Primitivos do Design System (Button, Input, MetricCard, Modal, etc.)
│   └── shared/     # Componentes compostos reutilizáveis
├── contexts/       # Acessibilidade, Sessão/RBAC, Toast e Store Mockada (localStorage)
├── features/       # Módulos por domínio (auth, student, guardian, teacher, coordinator)
├── layouts/        # AppShellLayout (Desktop + Mobile) e BaseLayout
├── mocks/          # Base fictícia anonimizada do Cursinho Comunitário Bonsucesso
├── pages/          # Catálogo /design-system e placeholders de rotas
├── types/          # Interfaces TypeScript de domínio (Entidade central Person, etc.)
└── utils/          # Funções puras de cálculo (frequência, média ENEM) e formatação
```
