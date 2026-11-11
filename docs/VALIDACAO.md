# Evidências de validação — 11/11/2026

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
