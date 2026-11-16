<p align="center"><img src="docs/logo.png" width="220" alt="Desafio Aceito, FutTech"></p>

# ⚽ Desafio Aceito

> O "Tinder de equipes" do futebol amador: encontre um adversário, combine data e campo, marque o jogo.

Projeto da faculdade de **Ciência da Computação da FECAP**, da empresa fictícia **FutTech**.

![Expo SDK](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.88-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/API-NestJS-e0234e?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL%20(Neon)-336791?logo=postgresql&logoColor=white)
![Versão](https://img.shields.io/badge/vers%C3%A3o-1.5.3-green)

> 📄 **Documentação técnica completa:** [abrir o PDF](documentacao/Documentacao_Tecnica_Desafio_Aceito_Completa.pdf) (49 páginas, ABNT). Demais documentos em [Documentação](#-documentação).

---

## 📌 Índice

1. [O que é](#-o-que-é)
2. [Como testar (avaliador)](#-como-testar-avaliador)
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

## 🚀 Como testar (avaliador)

**Em 3 passos, no celular Android:**

1. **Instale o app:** baixe o [APK 1.5.3](https://github.com/LuizZaim/desafio-aceito/releases/download/v1.5.3/desafio-aceito-1.5.3.apk), abra o arquivo e permita instalar de fontes desconhecidas.
2. **Entre com a conta de teste:**

   | E-mail | Senha |
   |---|---|
   | `avaliador@desafioaceito.test` | `Avaliador2026` |

3. **Teste com as equipes `[Demo]`.** Elas reagem sozinhas, então uma conta e um aparelho bastam:

   | Você faz | A equipe [Demo] responde |
   |---|---|
   | Curte uma equipe em **Descobrir** | Curte de volta: **match** na hora |
   | Escreve no **chat** | Responde conforme o assunto (horário, campo, valor, elenco, uniforme, chuva, árbitro...) |
   | Propõe um **amistoso** (data futura, local, mando) | Aceita sozinha |
   | Paga a **caução** (simulada) | Partida confirmada |
   | Registra o **resultado** e **avalia** | A nota entra no **ranking** |

A conta começa **sem matches e sem conversas**: as 5 equipes [Demo] aparecem em **Descobrir** para você curtir.

> ⏳ O servidor gratuito dorme: o **primeiro acesso pode levar cerca de 1 minuto**. O app avisa e tenta de novo sozinho.

### Sem celular Android?

- **Vídeo da demonstração (2 min):** [baixar e assistir](https://github.com/LuizZaim/desafio-aceito/raw/main/docs/demo-desafio-aceito.mp4) (o GitHub não mostra o vídeo na página; o arquivo baixa e abre no seu player). Mostra o fluxo completo no app: descobrir, match, chat, amistoso, caução simulada e ranking.
- **Prints de cada tela:** seção 2.4 do [PDF da documentação](documentacao/Documentacao_Tecnica_Desafio_Aceito_Completa.pdf).
- **Emulador (opcional):** instale o Android Studio, crie um aparelho virtual em *Device Manager* (Pixel, Android 14), arraste o APK para a janela do emulador, abra o app e entre com a conta de teste acima. Não testado por nós; o login com Google pode não funcionar no emulador.

### Outras formas de entrar

- **Explorar demonstração:** sem cadastro, sem internet. Dados fictícios guardados só no celular; mostra todos os fluxos, inclusive o de árbitro.
- **Cadastre-se** ou **Continuar com Google:** criam uma conta real, que começa **vazia** (sem adversários, conversas ou partidas).

> 💳 Pagamentos, caução e cartões são **sempre simulados**.

### Só ler o código e rodar os testes

```sh
git clone https://github.com/LuizZaim/desafio-aceito.git
cd desafio-aceito
npm ci
npm run typecheck && npm run lint && npm test
```

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
├── documentacao/       Documento técnico completo (PDF, ABNT)
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

Abra com o Expo Go (SDK 58) na mesma rede, ou pressione `a` para emulador Android.

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
- [**Documento técnico completo (PDF, ABNT)**](documentacao/Documentacao_Tecnica_Desafio_Aceito_Completa.pdf): wireframes, arquitetura, requisitos, diagramas, banco e prints do app

---

## 👥 Equipe

**FutTech** — Luiz Henrique Zaim da Cruz, Guilherme Monteiro da Silva, Murilo Angelo Pimentel Braggio, Enzo Henrique, Vitor Kolle.

## 📄 Licença

Veja [LICENSE](LICENSE).
