<div align="center">

<img src="./public/favicon.svg" alt="Bonsucesso+ Logo" width="64" height="64" />

# Bonsucesso+

**Plataforma de Gestão Acadêmica e Comunitária — Cursinho Comunitário Bonsucesso**

*Design System Bauhaus Suíço (Regra 90/10) • Alta Densidade Operacional • Mobile-First • WCAG AA/AAA*

[![React](https://img.shields.io/badge/React-18.3-18181B?style=flat-square&logo=react&logoColor=60A5FA)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-18181B?style=flat-square&logo=typescript&logoColor=60A5FA)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-18181B?style=flat-square&logo=tailwindcss&logoColor=4ADE80)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-GPU_60%2F120fps-18181B?style=flat-square&logo=framer&logoColor=FACC15)](https://www.framer.com/motion/)
[![Vite](https://img.shields.io/badge/Vite-6.4-18181B?style=flat-square&logo=vite&logoColor=F87171)](https://vitejs.dev/)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel_Ready-111111?style=flat-square&logo=vercel&logoColor=FFFFFF)](https://vercel.com/)

</div>

---

## Visão Geral

O **Bonsucesso+** é a plataforma web de gestão acadêmica, pedagógica e comunitária do **Cursinho Comunitário Bonsucesso** (preparatório popular para o ENEM). Projetada sob a filosofia **Bauhaus Suíço & Sinalização Funcional (Regra 90/10)**, a interface prioriza velocidade percebida, descanso ocular em uso prolongado e acessibilidade cidadã em dispositivos móveis e desktops.

---

## Identidade Visual & Design System (`Bauhaus Suíço 90/10`)

A interface mantém **90% da superfície monocromática** (papel quente no modo claro e carbono quente no modo escuro) e reserva **10% exclusivamente para as 4 cores institucionais da marca** como código semântico funcional:

| Token Semântico | Modo Claro (*Papel Quente*) | Modo Escuro (*Quadro-Negro Suíço*) | Função Exclusiva na Interface |
| :--- | :--- | :--- | :--- |
| **Fundo Base (`paper`)** | `#FAF9F6` | `#0C0D10` | Plano de fundo principal sem fadiga ocular |
| **Superfície (`surface`)** | `#FFFFFF` | `#14161B` | Cards, tabelas, sidebar, modais e drawers |
| **Texto Primário (`ink`)** | `#18181B` | `#F4F4F5` | Títulos, leitura principal e indicadores |
| **Azul Acadêmico (`academic`)** | `#1D4ED8` | `#60A5FA` | Aulas, turmas, disciplinas e **Google Classroom** |
| **Verde Progresso (`progress`)** | `#15803D` | `#4ADE80` | Presença (`>= 75%`), matrículas ativas e metas atingidas |
| **Amarelo Avaliação (`assess`)** | `#EAB308` / `#854D0E` | `#FACC15` | Simulados ENEM (`0–1000`), redação e alertas preventivos |
| **Vermelho Crítico (`critical`)** | `#DC2626` | `#F87171` | Frequência `< 75%`, choques de horário e bloqueios |

- **Tipografia Pareada:** `Plus Jakarta Sans` para leitura editorial + `JetBrains Mono` (`tabular-nums`) estritamente para notas ENEM, porcentagens, CPFs, matrículas, datas e horários.
- **Catálogo Interativo:** Acesse `/design-system` na aplicação para inspecionar todos os tokens e componentes ao vivo.

---

## Os 4 Portais de Acesso (RBAC Estrito)

| Perfil | Rota Base | Modo de Interface | Módulos Principais |
| :--- | :--- | :--- | :--- |
| **Coordenação Pedagógica** | `/coordenacao` | Alta Densidade Operacional | Painel, Alunos, Professores, Responsáveis, Turmas, Matrículas, Disciplinas, Grade Horária, Copa & Doações |
| **Professor(a) Voluntário(a)** | `/professor` | Alta Densidade Operacional | Minhas Turmas, Aulas & Classroom, Chamada Rápida (`P`/`F`/`J`), Avaliações em Lote e Desempenho |
| **Estudante** | `/aluno` | Clareza & Motivação | Resumo do Dia, Evolução ENEM (`0–1000`), Grade Semanal, Materiais & Google Classroom e Calendário |
| **Mãe / Pai / Responsável** | `/responsavel` | Clareza & Acompanhamento | Barra Fixa de Proteção de Contexto Multi-Aluno, Resumo, Frequência Mensal, Simulados e Avisos |

---

## Engenharia de UX & Ergonomia Operacional

1. **Command Palette Global (`Ctrl + K` / `Cmd + K`):**
   - Busca instantânea filtrada por RBAC para **Ações Rápidas** (*Novo Aluno*, *Nova Matrícula*, *Registrar Doação*, *Fazer Chamada*, *Alternar Tema*), **Navegação** e **Registros**. Selecionar um estudante abre seu `SlideOverDrawer` imediatamente.
2. **Chamada Invertida, Operação 100% por Teclado e Auto-Save (`600ms`):**
   - Botão **"Marcar todos como presentes"** para lançamento por exceção.
   - Atalhos `P` (Presente), `F` (Falta) e `J` (Justificada) com avanço automático de foco para o próximo aluno.
   - Persistência automática de rascunhos de chamada e notas no `localStorage` com indicador em tempo real (`Rascunho salvo às HH:mm`).
3. **Prioridade Global ao Nome Social (`getDisplayName`):**
   - Respeito integral ao Nome Social em 100% das superfícies (chamadas, boletins, listas, saudações e busca), mantendo o nome civil restrito aos formulários administrativos e à aba *Dados Pessoais* da Coordenação.
4. **Mobile-First Real (`< 768px`):**
   - **Bottom Navigation Bar** fixa (`h-16`, `pb-safe`) com alvos de toque `>= 44px` e indicador semântico deslizante (`layoutId`).
   - Card **"Próxima Aula"** em destaque no topo da home mobile do Aluno com botão direto para o **Google Classroom**.
   - Conversão automática de `DataTable` em listas de cards empilhados limpos.
5. **Modo de Impressão (`@media print`) & Exportação CSV (Excel PT-BR):**
   - Geração de arquivos `.csv` com BOM UTF-8 (`\uFEFF`) e separador `;` + folhas de impressão limpas com cabeçalho oficial `PrintReportHeader`.
6. **Performance & Code-Splitting:**
   - Carregamento sob demanda por portal (`React.lazy` + `Suspense` com `BrandLoader`), mantendo o bundle inicial em **`~33 kB` (gzip)** e buscas indexadas em `O(1)` via `Map`.

---

## Acesso Rápido de Demonstração

Na tela `/login`, utilize o painel **Acesso Rápido (Demonstração)** para entrar em 1 clique com qualquer perfil, ou autentique-se manualmente (senha padrão: `123456`):

| Perfil | Identificador (E-mail ou CPF) | Senha |
| :--- | :--- | :--- |
| **Coordenador(a)** | `anapaula.coord@bonsucesso.org.br` | `123456` |
| **Professor(a)** | `carlos.mat@bonsucesso.org.br` | `123456` |
| **Aluno(a)** | `mariana.santos@estudante.bonsucesso.org.br` | `123456` |
| **Responsável** | `helena.oliveira@familia.bonsucesso.org.br` | `123456` |

---

## Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (http://localhost:5173)
npm run dev

# 3. Validar tipagem estrita (TypeScript)
npm run lint

# 4. Gerar build otimizada de produção
npm run build
```

---

## Deploy na Vercel

O projeto já inclui o arquivo [`vercel.json`](./vercel.json) configurado com *SPA Rewrites* para o `react-router-dom` e cabeçalhos de cache imutável para `/assets/*`:

1. Importe o repositório no painel da **[Vercel](https://vercel.com/new)**.
2. Mantenha o preset **Vite** (`Build Command: npm run build`, `Output Directory: dist`).
3. Clique em **Deploy**.

---

## Arquitetura de Pastas

```text
src/
├── components/
│   ├── ui/             # Primitivos Bauhaus (BrandLockup, BrandLoader, CommandPalette, Button, Badge, Card, Modal, SlideOverDrawer...)
│   └── shared/         # Componentes compostos (DataTable, ScheduleMatrix, StudentCard, PrintReportHeader, ErrorBoundary...)
├── contexts/           # ThemeProvider/AccessibilityContext, SessionContext (RBAC), MockDatabaseContext (O(1) Maps) e ToastContext
├── features/           # Portais isolados por domínio (auth, coordinator, teacher, student, guardian)
├── layouts/            # AppShellLayout (Sidebar + Topbar + Bottom Bar + Context Bar) e BaseLayout
├── lib/                # Física de movimento (motion.ts), Nome Social (person.ts), Exportação CSV (exportCsv.ts) e Máscaras (masks.ts)
├── mocks/              # Base de dados inicial realista do Cursinho Comunitário Bonsucesso
├── pages/              # Catálogo interativo (/design-system), Meus Dados e Configurações
├── services/           # Camada assíncrona (Promises) pronta para integração com API REST Python/Django
├── types/              # Contratos TypeScript de domínio
└── utils/              # Cálculos acadêmicos (frequência 75%, médias ENEM, detecção de choque de horário)
```
