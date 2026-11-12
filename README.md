# Desafio Aceito — aplicativo mobile

Aplicativo **React Native + TypeScript + Expo**, com navegação nativa por abas e telas empilhadas. Projeto FutTech, baseado na documentação técnica do grupo da FECAP e conferido contra os 50 critérios da auditoria de 11/11/2026.

## Abrir no celular

1. Extraia este projeto e abra a pasta no VS Code.
2. Instale Node.js 24 LTS no computador e o Expo Go compatível com SDK 58 no celular.
3. No terminal da pasta do projeto, execute:

```sh
npm ci
npx expo start
```

4. Deixe computador e celular na mesma rede. Leia o QR code pelo Expo Go no Android; no iOS, use a câmera ou o Expo Go.
5. Na primeira tela, toque em **Explorar demonstração**. Não precisa de servidor ou cadastro para testar os fluxos offline.

A demonstração salva os registros em SQLite no aparelho, inclusive ao fechar e reabrir. O projeto entregue é código-fonte executável: **o pacote ZIP não é um APK**. A compilação do JavaScript para Android foi verificada; instalação em aparelho e compilação de APK assinado ainda precisam ser realizadas.

## Cadastrar sua própria equipe

Na tela inicial, toque em **Cadastrar ou abrir meu time neste aparelho**. Preencha nome, bairro, cidade, UF, categoria e nível técnico; a descrição é opcional. Toque em **Cadastrar meu time**. Após a confirmação **Seu time está cadastrado!**, escolha **Ver minha equipe**. A nova equipe começa sem matches ou partidas anteriores.

O cadastro local funciona sem servidor e salva os dados no aparelho; ele não cria uma conta online nem publica o time para outras pessoas. Ao reabrir o app, a equipe local é retomada. A demonstração mantém seus próprios dados fictícios, separados da equipe cadastrada. Para editar depois, abra o perfil da equipe.

Para usar uma conta online, configure a API conforme as instruções abaixo e crie uma conta de organizador. Depois conclua o mesmo cadastro de equipe; os dados ficam associados à conta autenticada. Consulte [os critérios de aceite e o roteiro de cadastro](docs/CADASTRO_EQUIPE.md).

## O que está implementado

- Descoberta, filtros por raio, bairro, nível e categoria, cartões de equipes e perfis.
- Interesse recíproco, bloqueio de chat sem match, conversa e histórico de mensagens.
- Agendamento com validação de data, horário, local, mando e conflito de agenda.
- Caução simulada, estados da partida, cancelamento com penalidade ilustrativa e acordo climático.
- Histórico, registro de placar depois do início do jogo, avaliação única e ranking.
- Cadastro dedicado da própria equipe, persistência local separada da demonstração e persistência por conta na API.
- Perfil da equipe, edição, compartilhamento textual, denúncias e desativação com proteção de partidas ativas.
- Perfil de árbitro, disponibilidade e aceite/recusa de convites da demonstração.
- Notificações internas, configurações e modo escuro.
- Telas de acesso e cadastro; API NestJS com PostgreSQL para contas, sessões e persistência por usuário.

## Limites desta versão

Esta entrega é um **MVP mobile demonstrativo**, com equipes fictícias. As contas da API possuem espaços separados; ainda não negociam partidas entre si. O chat não envia mensagens a outra pessoa real. O pagamento não faz cobranças reais. Os preços R$ 50 / R$ 10 / R$ 30 são exemplos configurados para demonstração; o PDF não define valores.

Ainda faltam: recuperação por e-mail, Google OAuth, gateway com webhook, mapas e distâncias reais, push, moderação operacional, comunicação entre contas, sincronização em tempo real, autorização profissional dos árbitros e DER completo em produção. A API persiste o estado do MVP em JSONB por conta, além das tabelas relacionais de usuários e sessões; **isso não substitui o DER normalizado proposto no PDF**.

Consulte [a matriz dos 50 critérios](docs/AUDITORIA.md) e [os requisitos RF01–RF30](docs/REQUISITOS.md). Não foi atribuída uma nota de conformidade de 100%.

## Login e cadastro com API

O modo offline funciona sem `.env`. Para habilitar contas:

1. Instale PostgreSQL ou use o Docker Compose incluído.
2. Configure um arquivo `.env` na raiz com `POSTGRES_PASSWORD` (sem esse valor o Compose não inicia).
3. Execute `docker compose up --build`. A migração inicial é aplicada na criação do banco.
4. Adicione `EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:3000` ao `.env` da raiz. Use o IP da rede local, não `localhost` no celular.
5. Reinicie o Expo com `npx expo start --clear`.

HTTP deve ser usado apenas na rede local de desenvolvimento. Para distribuir um app conectado, configure uma API HTTPS. Contas reais e dados pessoais não devem ser colocados no ambiente de testes.

Para executar a API sem Docker:

```sh
cd api
npm ci
# Copie .env.example para .env e ajuste DATABASE_URL.
npm run migrate
npm run start:dev
```

As senhas são derivadas com scrypt e salt individual. Sessões usam tokens aleatórios; o banco guarda o hash do token. No celular, o token fica no SecureStore. Atualizações têm controle de versão para evitar sobrescrever mudanças de outra sessão. Os endpoints usam consultas parametrizadas e erros sem stack trace.

## APK para instalação Android

O arquivo `eas.json` contém os perfis `development`, `preview` (APK) e `production` (AAB).

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

Esse processo exige conta Expo, vinculação do projeto e credenciais de assinatura gerenciadas pelo serviço. Não foi realizado nesta entrega. Para iOS, a distribuição também requer a configuração e as credenciais da Apple. Não há APK ou publicação na Play Store/App Store incluídos.

## Verificações

```sh
npm run typecheck
npx expo lint
npm test
npx expo-doctor
npx expo export --platform android --output-dir outputs/android-bundle
cd api
npm run build
npm test
```

A suíte de integração usa PostgreSQL embutido PGlite, instala a migração e testa a API por HTTP local: cadastro, autenticação, erros, isolamento entre contas, persistência, conflito de versão, prevenção de SQL injection e revogação de sessão. Não substitui teste de carga, teste em PostgreSQL de produção ou homologação em aparelho físico.

## Clonar o histórico local

O ZIP inclui `repositorio.bundle`, com branches e commits desta entrega. Depois de extraí-lo, você pode restaurar o repositório sem servidor Git:

```sh
git clone repositorio.bundle desafio-aceito
cd desafio-aceito
npm ci
```

O projeto ainda não foi publicado em um repositório remoto.

## Estrutura

```text
src/app/           Telas e navegação Expo Router
src/components/    Componentes nativos e estilos
src/core/          Regras, estado, filtros e cliente HTTP
src/storage/       SQLite local; adaptador web exclusivo de QA
api/src/           Controllers NestJS, serviço e acesso PostgreSQL
api/migrations/    Migração SQL versionada
api/tests/         Integração HTTP e banco de testes
tests/             Regras de negócio
docs/              Auditoria, requisitos e roteiro de apresentação
```

O renderer web é usado apenas para QA de navegação; a entrega principal é mobile. A documentação de arquitetura original propõe React Native/NestJS/PostgreSQL, Redis e PostGIS; os dois últimos ainda não estão implementados neste MVP.

## Fontes

- `Documentacao_Tecnica_Desafio_Aceito_Auditada_Revisada(1).pdf`, fornecido pelo usuário.
- `auditoria_vibe_coding_2026-11-11.txt`, fornecido pelo usuário.
- [Documentação versionada Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/).
- [Instalação do Expo Router](https://docs.expo.dev/router/installation/).

Integrantes do projeto: Luiz Henrique Zaim da Cruz; Guilherme Monteiro da Silva; Murilo Angelo Pimentel Braggio; Enzo Henrique; Vitor Kolle.
