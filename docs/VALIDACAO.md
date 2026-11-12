# Evidências de validação

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
