# Evidências de validação

## Fluxo acadêmico completo — 13/11/2026

Código-fonte **1.2.0**. Esta seção atualiza o comportamento da etapa anterior: caução, penalidade e estorno passaram a ser simulados também no modo conectado, permitindo concluir o fluxo esportivo sem gateway. Nenhum dinheiro real é cobrado. A API/banco hospedados foram verificados pelos testes de fumaça abaixo; instalação em aparelho e novo APK ainda não estão comprovados.

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

Os testes de integração automatizados usam PostgreSQL/PGlite local; o teste de fumaça adicional acima executou contra a API e o banco realmente hospedados. O modo local continua disponível sem servidor e com dados fictícios identificados. Não houve teste de gateway financeiro, Docker local, carga, instalação em aparelho ou ensaio do grupo. O APK antigo não inclui automaticamente o código 1.2.0; um novo APK permanece pendente.

**Pendência do APK 1.2.0:** a tentativa de iniciar a compilação foi bloqueada pela revisão automática de aprovação, que exigiu autorização explícita para enviar o código-fonte privado ao Expo/EAS. A autenticação da conta não supriu essa exigência. Não há novo APK concluído nesta etapa; o link histórico abaixo é da versão anterior.

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
