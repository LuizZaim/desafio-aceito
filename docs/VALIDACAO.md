# Evidências de validação

## Implementação 1.4.0 — Google, transporte TLS e correções de fluxo

Registro do código atual; 1.3.0 e versões anteriores permanecem como histórico abaixo. Não houve geração de APK nesta etapa, conforme solicitado pelo usuário.

| Verificação executada | Resultado / limite |
|---|---|
| `npm test` no aplicativo | 44 testes passaram. Incluem composição atômica de interesse prioritário local, preservação do estado após falha, links/retomada, compartilhamento e ações de diálogo executadas uma única vez. As verificações do Google estão na suíte da API. |
| Tipos e lint | Passaram novamente no código 1.4.0 após a retomada. Nenhuma execução visual em celular é inferida desses comandos. |
| API: testes e compilação | 21 cenários passaram e a API compilou. Incluem identidade Google/vínculo seguro e transporte SMTP TLS local, além das regras anteriores. |
| Google no servidor | Biblioteca oficial verifica assinatura RS256, audiência configurada, emissor, expiração, e-mail verificado e identidade `sub`. Testes incluem assinatura real de teste e rejeição de token inválido. Sem ID Web real configurado, o provedor permanece indisponível. |
| Vínculo Google | Primeiro vínculo/conta nova exige senha do aplicativo via HTTP 428; não há associação automática apenas por e-mail. Identidade vinculada permanece estável sem sobrescrever e-mail/dados da conta. Não houve login externo real no Google. |
| Google no cliente | SDK nativo Android integrado por autolinking; carregamento protegido para web/Expo Go e ausência de configuração. Plugin iOS só é incluído com ID iOS real. Não foi gerado binário com esse módulo nem testado login nativo real. |
| SMTP TLS local | Transporte real entregou ao servidor TLS local com certificado explicitamente confiável; certificado não confiável foi rejeitado. Requer CLI OpenSSL para a fixture. Nenhum e-mail foi enviado a provedor/caixa externa. |
| Migração 009 | Testada em branch Neon isolada, com 25 tabelas. `google_identities` associa usuário/issuer/sub com unicidade e FK. Aplicação à base principal confirmada pelo ledger 001–009; deploy Railway `262c4c44-dc82-4bc8-bba7-e039c819a30a` concluído. |
| Exportação | Android: 1.243 módulos; iOS: 1.236; web: 878. Bundles nativos de aproximadamente 2,9 MB. Exportação JavaScript/Hermes não comprova compilação nativa, APK ou execução visual. |
| Ambiente publicado | `/auth/capabilities` confirmou troca de senha e códigos ativos; Google, recuperação por e-mail e alteração de e-mail desativados. Railway tem somente variáveis de banco/servidor, sem ID OAuth ou SMTP. |
| Correções de fluxo | Compartilhamento/consulta de equipe fora do catálogo, perfil próprio, autodesafio recusado, campos durante gravação, retomada depois do cadastro, alerta único e desbloqueio após falha de armazenamento no logout tratados. Prioridade que falha não consome crédito nem dispensa match/cadastro. |
| Artefato de deploy | Bundle Railway compilado e loader comprimido gerados; descompressão comparada com o conteúdo original. O deploy desse artefato terminou com sucesso; `/health` respondeu 200/1.4.0 na retomada. |

**Pendências externas/manuais:** clientes Google reais/`GOOGLE_WEB_CLIENT_ID`, SMTP com credenciais de provedor e prova de entrega externa, acesso suficiente ao arquivo Figma, matriz visual, abertura de links/instalação física e ensaio/domínio dos integrantes. A instrução atual é terminar essas verificações antes de solicitar novo APK; não iniciar EAS ou declarar um binário 1.4.0 pronto. Setup: `CONFIGURAR_GOOGLE_EMAIL.md`.

## Implementação 1.3.0 — segurança, sitemap e navegação

Esta seção registra a nova implementação sem substituir a evidência histórica 1.2.0 abaixo. O PDF acadêmico permaneceu intacto.

| Verificação executada | Resultado / limite |
|---|---|
| `npm test` no aplicativo | 37 testes passaram, incluindo complementos acadêmicos, isolamento de persistência e cinco cenários de navegação/links. |
| `npm run typecheck` e `npm run lint` | Passaram no código atual. |
| Exportação Android/Hermes | Passou após o ajuste final de alertas do renderer web: 1.225 módulos, bundle de aproximadamente 2,9 MB. Exportação não produz APK instalável nem comprova inspeção visual. |
| API: `npm test` e `npm run build` | 15 cenários de integração passaram e a API compilou. Incluem segurança de conta, complementos acadêmicos e rollback HTTP de operações rejeitadas, além dos fluxos anteriores. |
| Segurança sem SMTP | Troca de senha e geração de seis códigos privados de recuperação exigem senha atual; código previamente salvo funciona uma única vez. Regeneração invalida os antigos. Recuperação/troca revogam sessões; só hashes são persistidos. |
| Segurança com transporte de teste | Adaptador injetado testou token único de 20 min, confirmação de novo e-mail, respostas genéricas e invalidação após falha de entrega. Isso não comprova entrega de e-mail por SMTP externo. Sem credenciais, API informa 503/capacidade indisponível e não simula envio. |
| Complementos do sitemap | Conta/recuperação/confirmação, pagamentos/cartões/planos, elenco/campo preferido e interesse prioritário implementados. Cartões guardam só rótulo/últimos quatro dígitos fictícios; créditos/planos são escolhas acadêmicas sem cobrança e não garantem match. |
| Links e proteção de rotas | Cinco testes verificam scheme/origem, rotas permitidas, IDs/tokens inválidos ou repetidos, rejeição de redirect externo e retomada após autenticação/cadastro. Tokens de recuperação não são guardados como destino pós-login. Não testa a entrega pelo sistema Android. |
| Banco | 007/008 primeiro verificadas na branch de teste Neon; depois ledger 001–008 e 24 tabelas públicas confirmados na base principal. Teste isolado e atualização publicada são evidências distintas. |
| API 1.3.0 publicada | Deploy Railway concluído; `/health` respondeu 200/1.3.0. `/auth/capabilities` respondeu 200 com troca de senha/códigos ativos e recuperação/troca por e-mail indisponíveis. Nenhuma entrega SMTP foi declarada realizada. |
| Referência visual Figma | Conta conectada; criação de sessão e leitura de contexto do arquivo negadas por permissão. A conta tem acesso de visualização e as operações disponíveis pediram edição. Não houve leitura das telas nem prova de fidelidade. |
| Matriz visual | Duas tentativas de abrir o renderer local falharam nos navegadores. Não houve nova inspeção desktop/tablet/mobile nesta etapa. |

**Ainda sem evidência nesta revisão:** APK 1.3.0 concluído, envio SMTP externo, Google OAuth, abertura fria por link no Android, instalação física e ensaio/compreensão dos integrantes. O APK 1.2.0 abaixo continua sendo evidência daquela versão, não das alterações novas. `GUIA_CODIGO.md` apoia o estudo sem certificar entendimento humano.

A sessão Expo/EAS estava expirada na checagem final; o novo APK depende da retomada da autenticação. Não foi declarado um build 1.3.0 concluído. A igualdade do PDF técnico preservado com o original foi confirmada por hash; nenhum conteúdo acadêmico do PDF foi reescrito.

## Fluxo acadêmico completo — 13/11/2026

Código-fonte **1.2.0**. Esta seção atualiza o comportamento da etapa anterior: caução, penalidade e estorno passaram a ser simulados também no modo conectado, permitindo concluir o fluxo esportivo sem gateway. Nenhum dinheiro real é cobrado. A API/banco hospedados foram verificados pelos testes de fumaça abaixo; a compilação do APK 1.2.0 foi concluída; a instalação em aparelho permanece sem homologação registrada.

| Verificação executada | Resultado |
|---|---|
| `npm test` no aplicativo | 29 testes passaram: 17 de domínio, 1 de fluxo acadêmico offline, 2 de persistência e 9 de sessão/transporte. Incluem cadastro próprio e dados separados da demonstração pronta. |
| `npm run typecheck` e `npm run lint` | Passaram após as telas e o estado de arbitragem conectada, sem erros/avisos. |
| Exportação Android/Hermes | Passou: 1.212 módulos, bundle de aproximadamente 2,8 MB. Não é APK instalável. |
| Persistência local | Adaptadores nativo (SQL executado contra SQLite de teste) e web verificam cadastro próprio → adversário fictício → match → conversa → partida → caução simulada, reabertura e isolamento da demonstração. Não executa a ponte Expo em um celular real. |
| `cd api && npm test` | 8 cenários passaram: os 5 da etapa abaixo, fluxo acadêmico, arbitragem e preservação/alinhamento de entidades na migração 006. Incluem validação conjunta de coordenadas opcionais, novas PKs/uniques, dados anteriores e ausência de localização/transação externa inventadas. |
| `cd api && npm run build` | Passou após as migrações 001–006 e os fluxos acadêmico/arbitragem. |
| Caução/cancelamento | Participante simula após aceite bilateral e antes do horário do jogo; duplicidade e acesso de terceiro recusados. Valor controlado pelo servidor. Cancelamento usa penalidade ilustrativa de R$ 10/R$ 30; clima requer o outro organizador e registra estorno simulado sem penalidade. |
| Resultado/avaliação | Resultado somente após início e por participante; placar apresentado na perspectiva de cada equipe. Uma avaliação por participante/partida, com quatro notas inteiras 1–5; médias recebidas consolidadas no servidor. |
| Arbitragem | Cenário com seis contas verifica perfil/edição, disponibilidade, dados públicos sem credenciais, convite privado, resposta só do designado, tipo/vaga corretos, conflito de 2 h, recusa/novo convite, impossibilidade de apitar a própria equipe e cancelamento das alocações quando o jogo é cancelado. Perfil autodeclarado, sem certificação externa. |
| Deploy API/banco | API Railway com PostgreSQL Neon; `GET https://desafio-aceito-api-production.up.railway.app/health` respondeu 200, versão 1.2.0. 16 tabelas e aplicação das migrações 001–006 verificadas na base hospedada. Nenhum repositório GitHub foi publicado. |
| HTTPS | Requisição HTTPS concluída e acesso HTTP redirecionado para HTTPS com status 301. Isso comprova o endpoint verificado, não um ensaio de segurança/carga completo. |
| Teste de fumaça no ambiente hospedado | Fluxo com três contas passou: autenticação/persistência, reciprocidade, chat privado, proposta bilateral, caução simulada, convite/aceite por árbitro designado e cancelamento compartilhado. Equipes de teste desativadas e sessões encerradas ao final. |
| Atualização aditiva 006 hospedada | Deploy concluído e `/health` 200/1.2.0. SQL confirmou colunas de campo, PK própria de caução/avaliação, unicidade por partida/avaliador e transação externa opcional. A caução simulada já existente permaneceu preservada, com ID não nulo e transação externa NULL. O fluxo completo acima ocorreu antes da 006; após ela foram verificados estrutura, preservação e saúde, com contrato da API mantido. |

Os testes de integração automatizados usam PostgreSQL/PGlite local; o teste de fumaça adicional acima executou contra a API e o banco realmente hospedados. O modo local continua disponível sem servidor e com dados fictícios identificados. Não houve teste de gateway financeiro, Docker local, carga, instalação em aparelho ou ensaio do grupo. O APK antigo não inclui automaticamente o código 1.2.0; o APK 1.2.0 foi gerado no build registrado abaixo.

**APK 1.2.0 concluído:** após autorização explícita do usuário para envio do código mobile e dos assets ao Expo/EAS, a compilação terminou com status FINISHED, versionCode 3. [Build Expo](https://expo.dev/accounts/luizzaim/projects/desafio-aceito-app/builds/b4b0d6fc-fa6d-4585-b28e-a036c193b8fd). [Baixar APK](https://expo.dev/artifacts/eas/9XNjPamhqQQm1NlGjO9TcO9aNbIAHRsIe4svpbIkDIA.apk). A assinatura usa as credenciais Android já configuradas. Isso não comprova instalação ou homologação em aparelho.

## Etapa anterior: rede de equipes e propostas — 13/11/2026

Versão do código-fonte: **1.1.0**. Esta revisão não gerou novo APK.

| Verificação executada | Resultado |
|---|---|
| `npm test` no aplicativo | 27 testes passaram: 17 de domínio, 2 dos adaptadores de persistência e 8 de sessão/transporte. |
| Domínio/persistência | Cadastro próprio/local, regras da demonstração e avaliações novas com nível técnico, fair play, pontualidade e organização; campos ausentes/inválidos e duplicidade recusados, registros antigos de dois critérios preservados. |
| Sessão/transporte | Polling e escrita serializados, versão recebida usada no envio, respostas antigas descartadas após troca de conta, falha preserva última leitura, POST sem repetição automática, timeout e erro seguro. Testes sem execução da ponte nativa em aparelho. |
| `npm run typecheck` | Passou no aplicativo. |
| `npm run lint` | Passou sem erros ou avisos após os ajustes finais de ciclo de vida do estado e das telas. |
| `cd api && npm run build` | Passou na API. |
| `cd api && npm test` | 5 cenários de integração HTTP/PGlite passaram: autenticação/cadastro; migração; rede privada entre três contas; propostas/conflitos entre quatro contas; rascunho de cadastro legado incompleto. Cada cenário contém diversas verificações de fluxo e exceção. |
| Rede de equipes | Reciprocidade real, match único, mensagens persistidas para o outro participante, bloqueio de terceiro, identidade/propriedade de equipe, notificações internas, denúncias e encerramento do match. Adversário inativo só fica acessível ao participante com histórico de jogo; demais usuários recebem recusa. |
| Propostas compartilhadas | Somente adversário aceita/recusa; aceite permanece aguardando caução; conflitos das duas equipes/local informado bloqueados; terceiro/solicitante não respondem indevidamente; clima exige concordância adversária; pagamento simulado é recusado online. |
| Migração | Cadastro válido preservado sem importar matches/mensagens fictícios; reaplicação testada; FK/CHECK rejeitam registros inválidos; cadastro incompleto mantém dados para edição até preencher a região. |
| Exportação Android/Hermes | Passou: 1.210 módulos, bundle de aproximadamente 2,8 MB. A exportação não produz APK instalável. |

Naquela etapa, resultado, avaliação compartilhada, arbitragem e caução ainda estavam bloqueados online; o fluxo acadêmico descrito acima substitui parte dessa limitação. O modo conectado consulta a cada 8 s em primeiro plano/retomada/manual, sem comprovar WebSocket/push ou desempenho sob carga. Agendamento verifica registros internos, sem reserva externa de campo.

Não houve novo APK, instalação/homologação em aparelho, execução Docker/PostgreSQL de produção, deploy HTTPS ou teste com gateway de pagamentos nesta revisão. O roteiro de aceite entre dispositivos está em `HOMOLOGACAO_ENTRE_CONTAS.md` e o comportamento das migrações em `MIGRACAO_ONLINE.md`.

## APK da etapa anterior — registro de continuidade

O histórico da conversa registra a conclusão do build Expo em **12/11/2026, às 12h33** e a disponibilização de um APK de teste:

- [Build Expo](https://expo.dev/accounts/luizzaim/projects/desafio-aceito-app/builds/78a695bb-70a9-4d1a-9a7e-e740b8a114af).
- [APK daquela versão](https://expo.dev/artifacts/eas/4ktfGPXKwZuaNR3SrXd_8X0Gr4MisGZ6vIlIkZ64k0I.apk).

Este registro corrige a pendência histórica de geração do primeiro APK. A URL e o conteúdo desse artefato não foram revalidados nesta revisão. Não há, neste registro, confirmação de instalação/homologação pelo usuário, publicação da API ou inclusão das alterações realizadas depois do build. Não usar esse link como distribuição automática da nova versão.

## Cadastro da própria equipe — 12/11/2026

| Verificação executada | Resultado |
|---|---|
| TypeScript e lint do aplicativo | Passaram. |
| `npm test` | 17 testes passaram: 15 de domínio e 2 dos adaptadores de persistência. |
| Persistência local | Adaptadores nativo e web testados: cadastro, reabertura, edição, sessão e separação da demonstração. O adaptador nativo executou seu SQL contra SQLite do Node; a ponte Expo não foi executada em aparelho. |
| API: compilação e integração HTTP/PGlite | Passaram, incluindo criação da equipe, rejeição de dados inválidos e cadastro duplicado, persistência após novo login e isolamento entre contas. |
| Exportação Android/Hermes | Passou: 1.208 módulos e bundle de cerca de 2,8 MB. Não gera APK. |

Esta atualização não teve homologação visual em aparelho/emulador, instalação de APK ou publicação de servidor. Os critérios de aceite e o roteiro manual estão em `CADASTRO_EQUIPE.md`.

## Validação anterior — 11/11/2026

| Verificação executada | Resultado |
|---|---|
| `npm run typecheck` | Passou, sem erro TypeScript no aplicativo. |
| `npx expo lint` | Passou, sem erros ou avisos após correções. |
| `npm test` | 13 testes de domínio passaram. |
| `npx expo-doctor` | 20 de 20 verificações passaram. |
| `npx expo export --platform android` | Bundle Android/Hermes gerado, 1.208 módulos, cerca de 2,7 MB. Não é um APK. |
| `cd api && npm run build` | API compilada sem erros TypeScript. |
| `cd api && npm test` | Suíte HTTP/PGlite passou: cadastro, login, JSON inválido, SQL injection, isolamento, persistência, conflito de versão e logout. |
| Inspeção visual e interação | Renderer de QA: entrada na demonstração, descoberta, interesse mútuo, lista de matches, mensagem e proposta aguardando caução na agenda. |
| Git ignore | `.env`, `api/.env`, dependências, dist e outputs confirmados como ignorados. |

O teste visual usa o renderer web do mesmo código React Native. **Não houve teste em aparelho ou emulador Android/iOS.** A evidência de bundle não comprova instalação, assinatura, splash de release, permissões ou funcionamento de SQLite/SecureStore em um dispositivo real. Essas etapas devem ser realizadas antes da apresentação final e da distribuição.

A API foi testada contra um PostgreSQL embutido em memória via PGlite, com a migração SQL de runtime e requisições HTTP locais. Docker Compose e banco de produção não foram executados neste ambiente.

A auditoria permanece com pendências explícitas em `AUDITORIA.md`; esta validação não afirma conformidade integral com a arquitetura e o DER do PDF.
