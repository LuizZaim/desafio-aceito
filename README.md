# Desafio Aceito

App de match entre times de futebol amador ("Tinder de equipes"), da empresa fictícia FutTech. Projeto da faculdade de Ciência da Computação da FECAP.

- **App:** React Native + TypeScript, Expo SDK 58, expo-router. Entrega por **APK Android**.
- **API:** Node + TypeScript (NestJS), PostgreSQL no Neon, hospedada no Render (plano gratuito).
- **Caução e pagamentos:** sempre **simulados**. Não há cobrança nem gateway. Cartões guardam só apelido e 4 dígitos fictícios.

## Estado atual (1.5.0)

| Item | Situação |
|---|---|
| API | https://desafio-aceito-api.onrender.com (`/health` responde 200, HTTPS obrigatório) |
| Banco | Neon, migrações 001–009 em `api/migrations` |
| Testes | 47 do app e 24 da API passam; tipos e lint sem erro |
| APK | Build `preview` pelo Expo/EAS, a partir do branch `main` |
| Google e e-mail | Implementados, mas **desativados**: faltam clientes OAuth e provedor de e-mail |
| Verificação em celular | **Não concluída**: matriz visual, instalação em aparelho e ensaio dos integrantes |

O Render gratuito dorme após inatividade. A primeira requisição pode levar cerca de 1 minuto, e o app mostra um contador de espera.

## Funcionalidades

- Cadastro, login, troca de senha e códigos de recuperação de uso único.
- Cadastro e edição da equipe (categoria, nível, campo preferido, elenco).
- Descoberta com filtros, interesse mútuo, matches e chat entre contas.
- Propostas de amistoso com data, local e mando de campo; verificação de conflito de agenda.
- Caução simulada (R$ 50), cancelamento comum e por clima, penalidades ilustrativas (R$ 10 / R$ 30).
- Resultado após o início do jogo, avaliação em quatro critérios e ranking.
- Área do árbitro: perfil, disponibilidade, convites e aceite.
- Modo local sem internet (dados fictícios identificados) e modo demonstração.

Limites conhecidos: a distância entre equipes não é calculada de verdade, e notificações push externas não existem.

## Rodar o app (desenvolvimento)

Requer Node.js 24.

```sh
git clone https://github.com/LuizZaim/desafio-aceito.git
cd desafio-aceito
npm ci
cp .env.example .env
npx expo start
```

Abra pelo Expo Go (SDK 58) no Android, na mesma rede do computador. O `.env` traz só a URL pública da API (`EXPO_PUBLIC_API_URL`).

## Rodar a API local

Com Docker:

```sh
# defina POSTGRES_PASSWORD no .env da raiz
docker compose up --build
```

Sem Docker, com PostgreSQL instalado:

```sh
cd api
npm ci
cp .env.example .env   # configure DATABASE_URL
npm run migrate
npm run start:dev
```

Variáveis da API em `api/.env.example`. Nunca versione o `.env`.

## Publicar a API no Render

O arquivo `render.yaml` define o serviço (plano gratuito, região Oregon). No Render, crie um Blueprint a partir deste repositório e informe `DATABASE_URL` (Neon) no campo secreto. O build instala também as devDependencies (`npm ci --include=dev`) e a migração roda no início.

Para e-mail no plano gratuito (SMTP é bloqueado), use `MAIL_PROVIDER=brevo` com `BREVO_API_KEY` e `MAIL_FROM`. Veja `docs/CONFIGURAR_GOOGLE_EMAIL.md` para Google e e-mail.

## Gerar o APK

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

O perfil `preview` aponta para a API do Render. Suba o `versionCode` em `app.json` antes de cada build, ou o Android pode recusar a instalação por cima de uma versão igual. Se recusar, desinstale o app antigo.

## Versão web (opcional)

O app é nativo, mas a exportação web usa modo SPA (`web.output = single`). Todas as rotas caem em `index.html`, então recarregar uma página não gera 404.

```sh
npx expo export --platform web --output-dir dist-web
```

Em qualquer hospedagem estática, configure o fallback para `index.html`.

## Verificações

```sh
npm run typecheck
npm run lint
npm test
cd api
npm run build
npm test
```

Os testes da API usam PostgreSQL embutido (PGlite). O teste de SMTP exige OpenSSL.

## Estrutura

```
src/app          telas (expo-router)
src/components   componentes
src/core         domínio, estado, cliente da API
src/storage      persistência local (SQLite)
api/src          API (controllers, serviços, banco)
api/migrations   esquema do banco, em ordem
docs             requisitos, auditoria, validação e guias
```

## Documentação

- [Requisitos](docs/REQUISITOS.md)
- [Auditoria dos critérios](docs/AUDITORIA.md)
- [Evidências de validação](docs/VALIDACAO.md)
- [Plano de conclusão](docs/PLANO_CONCLUSAO.md)
- [Guia de leitura do código](docs/GUIA_CODIGO.md)
- [Roteiro entre contas](docs/HOMOLOGACAO_ENTRE_CONTAS.md)
- [PDF técnico](docs/referencias/Documentacao_Tecnica_Desafio_Aceito.pdf)

## Integrantes

Luiz Henrique Zaim da Cruz, Guilherme Monteiro da Silva, Murilo Angelo Pimentel Braggio, Enzo Henrique, Vitor Kolle.

## Licença

Veja [LICENSE](LICENSE).
