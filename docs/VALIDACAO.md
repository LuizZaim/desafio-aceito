# Evidências de validação

## Rede de equipes e propostas compartilhadas — 13/11/2026

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

O modo online consulta mudanças a cada 8 s em primeiro plano, ao retornar ao app e por atualização manual. Esses testes não comprovam WebSocket, push, API hospedada ou desempenho sob carga. Agendamento verifica registros internos e não equivale à reserva de campo real. Resultado, avaliação compartilhada, arbitragem e caução financeira permanecem bloqueados online até integrações próprias.

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
