# ⚽ Desafio Aceito

> O "Tinder de equipes" do futebol amador: encontre um adversário, combine data e campo, marque o jogo.

Projeto da faculdade de **Ciência da Computação da FECAP**, da empresa fictícia **FutTech**.

![Expo SDK](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.88-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/API-NestJS-e0234e?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL%20(Neon)-336791?logo=postgresql&logoColor=white)
![Versão](https://img.shields.io/badge/vers%C3%A3o-1.5.3-green)

---

## 📌 Índice

1. [O que é](#-o-que-é)
2. [Como testar em 2 minutos (avaliador)](#-como-testar-em-2-minutos-avaliador)
3. [Funcionalidades](#-funcionalidades)
4. [Como o sistema é montado](#-como-o-sistema-é-montado)
5. [Mapa do código](#-mapa-do-código)
6. [Rodar no seu computador](#-rodar-no-seu-computador)
7. [Publicar (API e APK)](#-publicar-api-e-apk)
8. [Testes e verificações](#-testes-e-verificações)
9. [Documentação](#-documentação)
10. [Equipe](#-equipe)

---

## 🎯 O que é

Times de futebol amador têm dificuldade de achar adversário. O **Desafio Aceito** resolve assim:

1. Você cadastra sua equipe (categoria, nível, campo, elenco).
2. Vê outras equipes e demonstra interesse. Se o interesse for **mútuo**, vira **match**.
3. Conversam no chat e combinam o amistoso (data, local, mando de campo).
4. Uma **caução simulada** garante o compromisso.
5. Depois do jogo: resultado, avaliação do adversário e **ranking**.

> 💳 **Pagamentos, caução e cartões são sempre simulados.** Não existe cobrança real nem gateway de pagamento.

---

## 🚀 Como testar em 2 minutos (avaliador)

### Opção A: só ler e rodar os testes (sem instalar app)

```sh
git clone https://github.com/LuizZaim/desafio-aceito.git
cd desafio-aceito
npm ci
npm run typecheck && npm run lint && npm test
```

### Opção B: instalar o app no Android (recomendado)

1. **Baixe o APK (versão 1.5.3):** [desafio-aceito-1.5.3.apk](https://github.com/LuizZaim/desafio-aceito/releases/download/v1.5.3/desafio-aceito-1.5.3.apk) (link permanente, aba Releases).
2. Abra o arquivo no Android e permita **"instalar de fontes desconhecidas"** quando pedido.
3. Na tela inicial, escolha **uma** destas entradas:

| Entrada | Precisa de internet? | Para que serve |
|---|---|---|
| **Explorar demonstração** (conta de demonstração) | Não | **Não precisa de cadastro nem senha.** Entra direto, com **várias equipes**, conversas e partidas **fictícias**. O time adversário "responde" sozinho (mensagens marcadas como `[Demonstração]`). É a forma mais rápida de ver todos os fluxos. |
| **Cadastre-se** (conta real) | Sim | Cria **a sua própria conta** no servidor, com e-mail válido e senha de 8+ caracteres (letras e números), e depois o seu time. |
| **Continuar com Google** | Sim | Login com Google. |

#### 🧪 Conta de demonstração × conta real

| | Demonstração | Conta real |
|---|---|---|
| Como entrar | Botão **Explorar demonstração** | **Cadastre-se** ou Google |
| Equipes para dar match | **Várias** (fictícias, ilustrativas) | **Conta do avaliador** com 5 equipes `[Demo]` já no servidor (veja abaixo), mais quem se cadastrar |
| Onde ficam os dados | Só no seu celular | No servidor (banco Neon) |
| Resposta do adversário | Simulada, automática | Só existe se outra pessoa real responder (as equipes `[Demo]` não respondem) |
| Pagamento/caução | Simulado | Simulado |


**Conta de teste do avaliador (servidor real):** e-mail `avaliador@desafioaceito.test`, senha `Avaliador2026`. Já tem a equipe `[Demo] Avaliador FC` e 5 equipes `[Demo]` para descobrir; 3 delas já demonstraram interesse, então basta curtir de volta para dar match. São dados fictícios, criados por `api/scripts/seed-demo.mjs` (pode ser rodado de novo sem duplicar).

> Por isso, **para ver o app "cheio" (Descobrir, match, chat, amistoso, resultado, ranking), use a demonstração.** Use a conta real para ver o cadastro, o login e o time salvo no servidor. Para testar match e chat reais, é preciso **duas contas** (dois aparelhos ou duas pessoas).

4. Para sair da conta, use o botão no canto superior direito.

### Opção C: ver no computador (sem APK)

```sh
npm ci
npx expo start --web
```

Abre no navegador. O login com Google **não** funciona na web.

### ⏳ Aviso importante: o servidor "dorme"

A API roda no plano **gratuito** do Render, que adormece após inatividade. **A primeira ação pode levar cerca de 1 minuto.** O app mostra um aviso de espera e tenta de novo sozinho. Para acordar antes:

```sh
curl -m 15 https://desafio-aceito-api.onrender.com/health
```

Resposta `200` = servidor acordado. Se der timeout, repita em 30 segundos.

---



---

## ⚽ Funcionalidades

- **Conta:** cadastro, login, troca de senha, códigos de recuperação de uso único.
- **Equipe:** cadastro e edição (categoria, nível, campo preferido), elenco de jogadores.
- **Descoberta:** filtros, interesse mútuo, matches.
- **Chat** entre equipes com match.
- **Amistosos:** proposta com data, local e mando de campo; checagem de conflito de agenda.
- **Caução simulada** (R$ 50), cancelamento comum e por clima, penalidades ilustrativas (R$ 10 / R$ 30).
- **Pós-jogo:** resultado, avaliação em quatro critérios, ranking.
- **Árbitro:** perfil, disponibilidade, convites e aceite.
- **Demonstração offline** com equipes fictícias identificadas como tal.

---

## 🧩 Como o sistema é montado

```
┌──────────────┐   HTTPS    ┌──────────────────┐    SQL    ┌────────────────┐
│  App Android │ ─────────► │  API (NestJS)    │ ────────► │  PostgreSQL    │
│  Expo / RN   │            │  Render (grátis) │           │  Neon (grátis) │
└──────────────┘            └──────────────────┘           └────────────────┘
       │  login Google                │ valida o token do Google
       └──────────────► Google ◄──────┘
```

- **App:** React Native + TypeScript, rotas por arquivo (expo-router). Tokens de sessão guardados com `expo-secure-store`.
- **API:** NestJS sobre Express. Senhas com `scrypt`, `helmet`, limite de requisições em memória, filtro global de erros (`Errors`).
- **Banco:** migrações numeradas e executadas no início do servidor.
- **Modos do app** (`src/core/store`): `none` (deslogado), `demo` (offline, dados fictícios), `online` (conta real). Existe código de modo `local`, mas o botão de entrada foi removido.

---

## 🗺️ Mapa do código

```
.
├── src/
│   ├── app/            Telas (uma por arquivo, expo-router). (tabs)/ = abas principais
│   ├── components/     Componentes visuais (ui.tsx = paleta, botões, campos, escudo)
│   ├── core/           Regras de domínio, estado (store), cliente da API, filtros
│   └── storage/        Persistência local (SQLite) usada no modo demo
├── api/
│   ├── src/            app.ts (rotas/erros), service.ts (regras), db.ts, passwords.ts,
│   │                   google-*.ts (login Google), arbitration.ts, mail.ts
│   ├── migrations/     Esquema do banco, 001 a 009, em ordem
│   └── tests/          Testes da API (usam PGlite, sem precisar de Postgres)
├── tests/              Testes do app (node --test)
├── docs/               Requisitos, auditoria, validação, guias, política de privacidade
├── app.json            Versão e configuração do Expo/Android
├── eas.json            Perfis de build do APK
└── render.yaml         Definição do serviço no Render
```

Telas principais: `index.tsx` (entrada), `cadastro.tsx`, `(tabs)/descobrir`, `matches`, `agenda`, `ranking`, `perfil`, `chat.tsx`, `agendar.tsx`, `partida.tsx`, `avaliar.tsx`, `arbitragem.tsx`.

---

## 💻 Rodar no seu computador

Requer **Node.js 24**.

**App**

```sh
git clone https://github.com/LuizZaim/desafio-aceito.git
cd desafio-aceito
npm ci
cp .env.example .env     # só traz a URL pública da API (EXPO_PUBLIC_API_URL)
npx expo start
```

Abra com o Expo Go (SDK 58) na mesma rede, ou pressione `a` para emulador Android, ou `w` para web.

**API local, com Docker**

```sh
# defina POSTGRES_PASSWORD no .env da raiz
docker compose up --build
```

**API local, sem Docker (precisa de PostgreSQL)**

```sh
cd api
npm ci
cp .env.example .env     # configure DATABASE_URL
npm run migrate
npm run start:dev
```

Variáveis da API: `api/.env.example`. **Nunca versione o `.env`.**

---

## 📦 Publicar (API e APK)

**API no Render.** O `render.yaml` define o serviço (plano gratuito, região Oregon). Crie um Blueprint a partir do repositório e informe `DATABASE_URL` (Neon) como segredo. Variáveis novas só valem após **Manual Deploy**. O build usa `npm ci --include=dev` e a migração roda no início.

**E-mail (opcional).** SMTP é bloqueado no plano gratuito; use `MAIL_PROVIDER=brevo` com `BREVO_API_KEY` e `MAIL_FROM`. Detalhes em `docs/CONFIGURAR_GOOGLE_EMAIL.md`.

**Gerar o APK.**

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Também dá para disparar o build pelo site do Expo ("Build from GitHub", perfil `preview`, branch `main`). Suba o `versionCode` em `app.json` antes de cada build; se o Android recusar instalar por cima, desinstale a versão antiga.

**Versão web (opcional).**

```sh
npx expo export --platform web --output-dir dist-web
```

Em hospedagem estática, configure fallback para `index.html` (modo SPA).

---

## 🧪 Testes e verificações

```sh
# app (na raiz)
npm run typecheck
npm run lint
npm test

# API
cd api
npm run build
npm test
```

Os testes da API usam PostgreSQL embutido (PGlite). O teste de SMTP exige OpenSSL.

---



## 📚 Documentação

- [Requisitos](docs/REQUISITOS.md)
- [Auditoria dos critérios](docs/AUDITORIA.md)
- [Evidências de validação](docs/VALIDACAO.md)
- [Plano de conclusão](docs/PLANO_CONCLUSAO.md)
- [Guia de leitura do código](docs/GUIA_CODIGO.md)
- [Roteiro entre contas](docs/HOMOLOGACAO_ENTRE_CONTAS.md)
- [Roteiro de demonstração](docs/ROTEIRO_DEMONSTRACAO.md)
- [Configurar Google e e-mail](docs/CONFIGURAR_GOOGLE_EMAIL.md)
- [PDF técnico](docs/referencias/Documentacao_Tecnica_Desafio_Aceito.pdf)

---

## 👥 Equipe

**FutTech** — Luiz Henrique Zaim da Cruz, Guilherme Monteiro da Silva, Murilo Angelo Pimentel Braggio, Enzo Henrique, Vitor Kolle.

## 📄 Licença

Veja [LICENSE](LICENSE).
