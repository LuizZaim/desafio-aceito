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

A demonstração salva os registros em SQLite no aparelho, inclusive ao fechar e reabrir. O projeto entregue é código-fonte executável: **o pacote ZIP não é um APK**. O APK da primeira versão foi concluído no Expo em 12/11/2026, conforme o histórico do projeto. As alterações deste pacote precisam de uma nova compilação para chegar ao celular. A instalação e a homologação em aparelho continuam sem evidência registrada.

## Cadastrar sua própria equipe

Na tela inicial, toque em **Cadastrar ou abrir meu time neste aparelho**. Preencha nome, bairro, cidade, UF, categoria e nível técnico; a descrição é opcional. Toque em **Cadastrar meu time**. Após a confirmação **Seu time está cadastrado!**, escolha **Ver minha equipe**. A nova equipe começa sem matches ou partidas anteriores.

O cadastro local funciona sem servidor e salva os dados no aparelho; ele não cria uma conta online nem publica o time para outras pessoas. Ao reabrir o app, a equipe local é retomada. A demonstração mantém seus próprios dados fictícios, separados da equipe cadastrada. Para editar depois, abra o perfil da equipe.

Para usar uma conta online, configure a API conforme as instruções abaixo e crie uma conta de organizador. Depois conclua o mesmo cadastro de equipe; os dados ficam associados à conta autenticada. Consulte [os critérios de aceite e o roteiro de cadastro](docs/CADASTRO_EQUIPE.md).

## O que está implementado

- Descoberta, filtros por região, nível e categoria, cartões de equipes e perfis. O filtro de raio em km está restrito às distâncias fictícias da demonstração; coordenadas reais ainda não foram integradas.
- Interesse recíproco, bloqueio de chat sem match, conversa e histórico de mensagens.
- Propostas online com aceite/recusa exclusiva do adversário, agenda compartilhada e validação de conflitos das duas equipes e do local informado (2 horas). Mando usa o identificador da equipe.
- Cancelamento compartilhado; acordo climático só pode ser confirmado por quem não o solicitou. Partidas ativas impedem encerrar match/desativar equipe.
- Na demonstração: caução simulada, resultado e cancelamento com penalidade ilustrativa. No modo online: aceite leva à espera de caução; pagamento, resultado e avaliação permanecem bloqueados até as respectivas integrações.
- Histórico das propostas online. Na demonstração: placar depois do início do jogo, avaliação única em quatro critérios (nível técnico, fair play, pontualidade e organização) e ranking.
- Cadastro dedicado da própria equipe, persistência local separada da demonstração e persistência por conta na API.
- Perfil da equipe, edição, compartilhamento textual, denúncias e desativação com proteção de partidas ativas.
- Perfil de árbitro, disponibilidade e aceite/recusa de convites da demonstração.
- Notificações internas, configurações e modo escuro.
- Telas de acesso e cadastro; API NestJS com PostgreSQL para contas, sessões e persistência por usuário.

## Limites desta versão

Esta versão inclui um modo demonstrativo com equipes fictícias e um modo conectado para contas independentes. Com a API configurada, organizadores com equipes cadastradas podem descobrir adversários reais, registrar interesse e trocar mensagens depois da reciprocidade. Propostas e cancelamentos são compartilhados entre os dois organizadores; apenas o adversário pode aceitar ou recusar uma proposta. Depois do aceite, a partida fica **Aguardando caução**, sem confirmação ou cobrança simulada no modo online. O pagamento não faz cobranças reais. Os preços R$ 50 / R$ 10 / R$ 30 são exemplos configurados para demonstração; o PDF não define valores.

Ainda faltam: recuperação por e-mail, Google OAuth, gateway com webhook, mapas e distâncias reais, push, moderação operacional, confirmação financeira e pós-jogo compartilhado, autorização profissional dos árbitros e DER completo em produção. A API mantém preferências em JSONB por conta e usa tabelas relacionais para equipes, interesses, matches, mensagens, locais e propostas de partidas; **o DER completo, incluindo cauções, avaliações e alocação de árbitros, permanece pendente**. Locais informados por texto são comparados na agenda interna; isso não é uma reserva real do estabelecimento. O catálogo online não inventa distâncias ou avaliações.

Consulte [o plano de conclusão com critérios de aceite](docs/PLANO_CONCLUSAO.md).

Para testar entre contas A/B/C, siga [o roteiro de homologação](docs/HOMOLOGACAO_ENTRE_CONTAS.md).

Consulte [a matriz dos 50 critérios](docs/AUDITORIA.md) e [os requisitos RF01–RF30](docs/REQUISITOS.md). Não foi atribuída uma nota de conformidade de 100%.

## Login e cadastro com API

O modo offline funciona sem `.env`. Para habilitar contas:

1. Instale PostgreSQL ou use o Docker Compose incluído.
2. Configure um arquivo `.env` na raiz com `POSTGRES_PASSWORD` (sem esse valor o Compose não inicia).
3. Execute `docker compose up --build`. A API aplica as migrações SQL em ordem antes de iniciar, inclusive em bancos existentes; o controle de versões impede a reaplicação de migrações concluídas.
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

O projeto já está vinculado à conta Expo usada no primeiro APK. A primeira compilação foi concluída; este incremento ainda não possui APK novo. O APK anterior não inclui estas alterações. Para distribuir o modo online, configure a URL HTTPS da API no ambiente de build antes de compilar. Para iOS, a distribuição também requer a configuração e as credenciais da Apple. Não houve publicação na Play Store/App Store.

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

A suíte de integração usa PostgreSQL embutido PGlite, aplica as migrações e testa a API por HTTP local: cadastro, autenticação, erros, isolamento entre contas, persistência, conflito de versão, prevenção de SQL injection e revogação de sessão; relações entre contas independentes, chat privado, propostas bilaterais, conflitos de equipes/local, cancelamento climático e preservação de cadastros legados. Há também teste de migração e restrições de integridade. Não substitui teste de carga, teste em PostgreSQL de produção ou homologação em aparelho físico.

## Clonar o histórico local

O ZIP inclui `repositorio.bundle`, com branches e commits desta entrega. Depois de extraí-lo, você pode restaurar o repositório sem servidor Git:

```sh
git clone repositorio.bundle desafio-aceito
cd desafio-aceito
npm ci
```

O projeto ainda não foi publicado em um repositório remoto. O bundle acompanha o código para preservar o histórico local.

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

- [PDF técnico original](docs/referencias/Documentacao_Tecnica_Desafio_Aceito.pdf), fornecido pelo usuário.
- [Auditoria original de 11/11/2026](docs/referencias/auditoria_original_2026-11-11.txt), fornecida pelo usuário.
- [Documentação versionada Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/).
- [Instalação do Expo Router](https://docs.expo.dev/router/installation/).

Integrantes do projeto: Luiz Henrique Zaim da Cruz; Guilherme Monteiro da Silva; Murilo Angelo Pimentel Braggio; Enzo Henrique; Vitor Kolle.
