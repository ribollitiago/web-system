# Web-System

Aplicação web interna construída com Angular 19, Firebase e ngx-toastr, com suporte a múltiplos idiomas, fluxo de registro multi-etapas e gestão de usuários.

## Sumário

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Arquitetura](#arquitetura)
- [Instalação e Execução](#instalação-e-execução)
- [Ambiente Firebase](#ambiente-firebase)
- [Design e Deploy](#design-e-deploy)

## Visão Geral

Este projeto é um sistema interno que oferece:

- Autenticação de usuários (login/logout e recuperação de senha)
- Registro de usuários em múltiplas etapas
- Listagem e gestão de usuários
- Controle de permissões
- Interface responsiva com layout de sidebar + header
- Suporte a múltiplos idiomas via arquivos JSON

## Tecnologias

- **Framework:** Angular 19 (standalone components + `bootstrapApplication`)
- **Linguagem:** TypeScript
- **Backend (BaaS):** Firebase Authentication + Realtime Database
- **UI/UX:**
  - Angular Material (tooltips)
  - SCSS
  - Componentes reutilizáveis para inputs, listas e steps
- **Feedback ao usuário:** `ngx-toastr`
- **Internacionalização:** arquivos em `public/assets/i18n`

## Funcionalidades Principais

- **Autenticação**
  - Login com email e senha
  - Logout com sincronização entre abas
  - Recuperação de senha via email
  - Proteção de rotas com `AuthGuard`

- **Registro Multi-Step**
  - Step 1: dados básicos (nome, email, telefone, CPF, senha)
  - Step 2: seleção de permissões e grupos
  - Step 3: informações complementares
  - Step 4: resumo e confirmação
  - Validação de CPF, email e senha
  - Verificação de CPF/email duplicados no Firebase

- **Gestão de Usuários**
  - Listagem de usuários registrados
  - Filtro e busca
  - Integração com Realtime Database via serviço dedicado

- **Permissões**
  - Carregamento de permissões a partir de arquivo JSON
  - Traduções por idioma
  - Seleção de permissões por nível crítico

## Arquitetura

Estrutura simplificada do projeto:

- `src/main.ts` – bootstrap da aplicação com `bootstrapApplication`.
- `src/app/app.routes.ts` – definição de rotas (login, home, register, users).
- `src/app/app.component.ts` – componente raiz e integração com serviço de tradução.
- `src/app/layout` – componentes de layout:
  - `main-layout` – header, sidebar e `<router-outlet>` principal
  - `header` – barra superior
  - `sidebar` – menu lateral com navegação
  - `default-step` – layout base para steps de cadastro
- `src/app/pages` – páginas principais:
  - `login` – tela de login e recuperação de senha
  - `main/home` – tela inicial autenticada
  - `main/register` – fluxo de registro multi-step
  - `main/users` – tela de gestão de usuários
- `src/app/components` – componentes reutilizáveis:
  - `primary-input`, `search-input`, `list-users`, `steps-filter`, etc.
- `src/app/services` – serviços de domínio:
  - `login.service` – autenticação
  - `register.service` – fluxo de registro e gravação no Firebase
  - `firebase.service` – wrapper para Realtime Database
  - `permissions.service` – carregamento e gestão de permissões
  - `translate.service` – internacionalização
- `src/app/guard/auth.guard.ts` – proteção de rotas autenticadas.

## Instalação e Execução

Pré-requisitos:

- Node.js (versão compatível com Angular 19)
- NPM ou Yarn
- Projeto Firebase configurado (Auth + Realtime Database)

### Instalar dependências

```bash
npm install
```

### Rodar em desenvolvimento

```bash
npm start
# ou
ng serve
```

A aplicação ficará disponível em `http://localhost:4200` por padrão.

### Build de produção

```bash
npm run build
```

### Testes

```bash
npm test
```

## Ambiente Firebase

As credenciais do Firebase são definidas em `src/environments/environment.ts` (não incluído no controle de versão por segurança).

Para rodar o projeto localmente:

- Crie um projeto no Firebase.
- Ative Authentication (Email/Password) e Realtime Database.
- Preencha `environment.firebaseConfig` com as chaves do seu projeto.

## Design e Deploy

- **Protótipo de Design (Figma):**  
  [Design no Figma](https://www.figma.com/proto/Qb5YsGSR1AcT9ONUHKk526/System-Web?node-id=1-5&t=Z0pGnRgHZapHDYrB-1)

- **Aplicação em produção:**  
  [Acesse o sistema aqui](https://gtsystem.netlify.app)

---

Sinta-se à vontade para abrir issues ou pull requests se quiser sugerir melhorias.
