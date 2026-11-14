# Desafio Aceito — aplicativo mobile

Projeto acadêmico da FutTech/FECAP em React Native, TypeScript e Expo SDK 58. A API usa NestJS e PostgreSQL. A caução é sempre **simulada**, sem cartão, cobrança ou transferência real.

## Versão 1.2.0

- Contas e cadastro/edição da própria equipe.
- Descoberta e filtros, interesse mútuo, matches e chat privado entre contas.
- Propostas com aceite/recusa adversária, mando por ID e agenda compartilhada.
- Verificação de conflitos das equipes e do local informado em intervalos de duas horas.
- Caução simulada de R$ 50 após aceite, confirmação, cancelamento e estorno simulados. Penalidades ilustrativas de R$ 10/R$ 30; o PDF não define valores.
- Resultado após o início, avaliação única por participante em quatro critérios e ranking agregado no servidor.
- Cadastro separado de árbitro/bandeirinha, disponibilidade, convites privados e aceite/recusa. O servidor impede atuação na própria equipe e conflito de horário.
- Persistência local isolada da demonstração, notificações internas e modo escuro.

## API e banco online

API: https://desafio-aceito-api-production.up.railway.app

- API NestJS publicada no Railway, executada no runtime Bun a partir do mesmo código compilado e testado.
- PostgreSQL no Neon, com migrações versionadas, chaves e integridades.
- A conexão do banco fica somente nas variáveis privadas do servidor. O aplicativo recebe apenas a URL pública da API.
- A publicação foi feita sem criar/publicar um repositório no GitHub.

A área de acesso permite criar contas conectadas ao mesmo servidor. Cadastre duas equipes independentes para demonstrar interesse mútuo, mensagens e propostas. O perfil profissional pode existir sem equipe.

A caução serve apenas à apresentação acadêmica: todos os registros financeiros são identificados como simulações. O local digitado verifica a agenda interna do aplicativo e não reserva um estabelecimento. Distâncias geográficas, e-mail de recuperação, login Google e push externo permanecem fora desta implementação; não são apresentados como serviços reais.

## Abrir pelo Expo Go

Instale Node.js 24 e Expo Go compatível com SDK 58. Na pasta do projeto:

```sh
npm ci
# Copie .env.example para .env. A URL da API publicada já consta no exemplo.
npx expo start
```

Computador e celular devem estar na mesma rede para carregar o código do Expo. Leia o QR code pelo Expo Go no Android. As contas usam a API HTTPS publicada, independentemente do banco local.

## Apresentação sem internet

Use **Cadastrar ou abrir meu time neste aparelho**. O perfil da equipe é seu; os adversários, reciprocidades, conversas e pagamentos são fictícios e identificados nas telas. O cadastro começa sem partidas e matches anteriores, e o fluxo fica salvo em SQLite no aparelho. É possível criar um amistoso, simular caução e simular imediatamente o jogo para demonstrar placar e avaliação, sem esperar a data marcada.

**Explorar demonstração** abre um espaço separado com dados fictícios já preparados. Os dois espaços não substituem as contas conectadas nem publicam seus dados na internet.

## API local para desenvolvimento

Com Docker:

```sh
# Configure POSTGRES_PASSWORD no .env da raiz.
docker compose up --build
```

Sem Docker, instale PostgreSQL e execute:

```sh
cd api
npm ci
# Copie .env.example para .env e configure DATABASE_URL.
npm run migrate
npm run start:dev
```

As migrações 001–006 são aplicadas em ordem sob transação/trava, com registro em schema_migrations. A API no Docker aplica as migrações antes de iniciar, inclusive em banco existente. Cadastros antigos válidos são preservados; incompletos mantêm rascunhos; matches fictícios não são importados para relações reais.

## Atualizar a API no Railway sem GitHub

```sh
cd api
npm ci
npm run build:railway
```

O gerador cria `outputs/railway/api.ts` na raiz, com o código NestJS compilado, dependências fixadas nas versões do lockfile e migrações. O arquivo não contém credenciais. O Railway executa esse arquivo no runtime Bun. Alterações podem ser aplicadas na função `desafio-aceito-api`; as variáveis de conexão continuam privadas no serviço. O Dockerfile também permanece disponível para uma distribuição tradicional.

## APK Android

O perfil preview já configura a URL HTTPS da API. Para gerar a versão atual:

```sh
npx eas-cli@latest login --device
npx eas-cli@latest build --platform android --profile preview
```

O ZIP contém o projeto executável e não é um APK. O APK anterior, gerado em 12/11/2026, não incorpora automaticamente alterações posteriores. O APK 1.2.0 já foi gerado: [baixar versão Android](https://expo.dev/artifacts/eas/9XNjPamhqQQm1NlGjO9TcO9aNbIAHRsIe4svpbIkDIA.apk). Deve ser instalado e homologado antes da demonstração ao professor.

## Verificações

```sh
npm run typecheck
npm run lint
npm test
npx expo export --platform android --output-dir outputs/android
cd api
npm run build
npm test
SMOKE_API_URL=https://desafio-aceito-api-production.up.railway.app node scripts/smoke-online.mjs
```

O último comando cria cadastros técnicos temporários na API publicada, verifica o fluxo entre contas, desativa as equipes de teste e encerra as sessões. Não executa cobranças. Os demais testes usam domínio, SQLite e PostgreSQL embutido/PGlite; não substituem homologação no aparelho.

## Código e checklist

O histórico Git local acompanha `repositorio.bundle` dentro do ZIP:

```sh
git clone repositorio.bundle desafio-aceito
```

A publicação do repositório no GitHub fica para uma etapa posterior, conforme solicitado. O README descreve execução e configuração; o PDF acadêmico original foi preservado.

- [Evidências executadas](docs/VALIDACAO.md).
- [Conferência dos 50 critérios](docs/AUDITORIA.md).
- [Checklist de código e critérios de aceite](docs/PLANO_CONCLUSAO.md).
- [Roteiro entre contas](docs/HOMOLOGACAO_ENTRE_CONTAS.md).
- [PDF técnico fornecido](docs/referencias/Documentacao_Tecnica_Desafio_Aceito.pdf).
- [Auditoria original](docs/referencias/auditoria_original_2026-11-11.txt).

Integrantes: Luiz Henrique Zaim da Cruz; Guilherme Monteiro da Silva; Murilo Angelo Pimentel Braggio; Enzo Henrique; Vitor Kolle.
