# Estado atual — 1.4.0

API 1.4.0 publicada no Railway, com migrações 001–009 confirmadas no Neon. Foram aprovados 44 testes do aplicativo, 21 cenários de API, lint e tipos; exportações Android/iOS/web concluídas. Nenhum APK novo foi gerado nesta etapa, conforme solicitado.

O código inclui Google nativo com verificação oficial no servidor, vínculo seguro por senha do aplicativo e testes criptográficos. Ainda é necessário cadastrar os clientes reais e configurar `GOOGLE_WEB_CLIENT_ID`. E-mail exige configuração SMTP privada; o transporte foi testado com TLS local, sem entrega externa. Veja [configuração das integrações](docs/CONFIGURAR_GOOGLE_EMAIL.md). O teste SMTP da suíte da API requer OpenSSL instalado.

A comparação com o Figma, a matriz visual, a instalação em aparelho e o ensaio dos integrantes continuam sem comprovação. O APK 1.2.0 abaixo é histórico e não contém estas mudanças. GitHub permanece sem publicação.

---

# Desafio Aceito — aplicativo mobile

Projeto acadêmico da FutTech/FECAP em React Native, TypeScript e Expo SDK 58. A API usa NestJS e PostgreSQL. A caução é sempre **simulada**, sem cobrança ou transferência real. Identificadores de cartão acadêmicos guardam somente apelido e quatro dígitos fictícios, sem PAN/CVV.

## Código e API 1.3.0

- Contas e cadastro/edição da própria equipe.
- Descoberta e filtros, interesse mútuo, matches e chat privado entre contas.
- Propostas com aceite/recusa adversária, mando por ID e agenda compartilhada.
- Verificação de conflitos das equipes e do local informado em intervalos de duas horas.
- Caução simulada de R$ 50 após aceite, confirmação, cancelamento e estorno simulados. Penalidades ilustrativas de R$ 10/R$ 30; o PDF não define valores.
- Resultado após o início, avaliação única por participante em quatro critérios e ranking agregado no servidor.
- Cadastro separado de árbitro/bandeirinha, disponibilidade, convites privados e aceite/recusa. O servidor impede atuação na própria equipe e conflito de horário.
- Persistência local isolada da demonstração, notificações internas e modo escuro.
- Minha conta, troca de senha e códigos de recuperação de uso único; recuperação/confirmação por e-mail com transporte SMTP configurável.
- Pagamentos/cartões/planos acadêmicos, elenco, campo preferido e interesse prioritário sem dispensar reciprocidade.
- Tratamento de links e retomada segura de destino após autenticação, com validação de rotas, IDs e tokens.

## API e banco online

API: https://desafio-aceito-api-production.up.railway.app

- API NestJS publicada no Railway, executada no runtime Bun a partir do mesmo código compilado e testado.
- PostgreSQL no Neon, com migrações versionadas, chaves e integridades.
- A conexão do banco fica somente nas variáveis privadas do servidor. O aplicativo recebe apenas a URL pública da API.
- A publicação foi feita sem criar/publicar um repositório no GitHub.

A área de acesso permite criar contas conectadas ao mesmo servidor. Cadastre duas equipes independentes para demonstrar interesse mútuo, mensagens e propostas. O perfil profissional pode existir sem equipe.

A caução serve apenas à apresentação acadêmica: todos os registros financeiros são identificados como simulações. O local digitado verifica a agenda interna do aplicativo e não reserva um estabelecimento. Distância geográfica, login Google e push externo não estão implementados/configurados como serviços reais. O código de recuperação/confirmação por e-mail existe, mas o ambiente publicado está sem SMTP; códigos de recuperação previamente salvos permitem redefinir a senha sem e-mail. Não há envio fictício de mensagens.

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

As migrações 001–008 são aplicadas em ordem sob transação/trava, com registro em schema_migrations. A API no Docker aplica as migrações antes de iniciar, inclusive em banco existente. Cadastros antigos válidos são preservados; incompletos mantêm rascunhos; matches fictícios não são importados para relações reais.

## Recuperação e manutenção da conta

Abra **Configurações → Minha conta** com uma conta conectada. A senha atual autoriza trocar senha e gerar seis códigos de recuperação; guarde-os antes de perder o acesso. Eles são mostrados uma vez, usados uma única vez e regenerá-los invalida os anteriores. Recuperar/trocar credenciais encerra as sessões da conta.

Para habilitar entrega de e-mail, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` somente no servidor. O adaptador exige TLS ou STARTTLS com certificado verificado. Sem configuração, a API informa indisponibilidade e a interface não declara envio. Tokens de recuperação/confirmação duram 20 minutos e só seus hashes ficam no banco. Testes com adaptador injetado não comprovam entrega por um provedor externo.

Os planos e créditos são escolhas da demonstração, sem preços: ativação acadêmica libera um crédito fictício uma vez e a recarga gratuita permite até dez. Prioridade não garante match. Esses números não foram definidos pelo PDF.

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

O ZIP contém o projeto executável e não é um APK. O APK anterior, gerado em 12/11/2026, não incorpora automaticamente alterações posteriores. O APK anterior 1.2.0 já foi gerado: [baixar APK 1.2.0](https://expo.dev/artifacts/eas/9XNjPamhqQQm1NlGjO9TcO9aNbIAHRsIe4svpbIkDIA.apk). Ele não contém as novidades 1.3.0. O APK 1.3.0 ainda não foi gerado; a sessão Expo/EAS precisa ser autenticada novamente. Instalação e homologação no celular continuam necessárias.

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
- [Guia de leitura do código](docs/GUIA_CODIGO.md).
- [Conferência dos 50 critérios](docs/AUDITORIA.md).
- [Checklist de código e critérios de aceite](docs/PLANO_CONCLUSAO.md).
- [Roteiro entre contas](docs/HOMOLOGACAO_ENTRE_CONTAS.md).
- [PDF técnico fornecido](docs/referencias/Documentacao_Tecnica_Desafio_Aceito.pdf).
- [Auditoria original](docs/referencias/auditoria_original_2026-11-11.txt).

Integrantes: Luiz Henrique Zaim da Cruz; Guilherme Monteiro da Silva; Murilo Angelo Pimentel Braggio; Enzo Henrique; Vitor Kolle.

Verificação 1.3.0: **37 testes mobile e 15 cenários de API passaram**, além de tipos, lint, compilação e exportação Android. API publicada confirmou `/health` 200/1.3.0 e capacidades coerentes com SMTP indisponível. Permanecem sem evidência: fidelidade ao Figma (permissão do arquivo negada), nova matriz visual, APK 1.3.0/instalação, deep link entregue pelo Android e ensaio dos integrantes. Não se declara 100% do checklist.
