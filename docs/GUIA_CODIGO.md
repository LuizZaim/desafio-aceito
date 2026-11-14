# Leitura do código para a apresentação

Este guia ajuda os integrantes a revisar a implementação. Não comprova que alguém já domina o código e não substitui o ensaio da equipe exigido nos itens 49/50.

| Parte | Arquivos de entrada | O que explicar ao professor |
|---|---|---|
| Telas/navegação | `src/app/_layout.tsx`, `src/core/navigation.ts` | Rotas públicas/protegidas, cadastro antes de acessar a equipe, perfil de arbitragem separado e retomada segura de destino após login. Links externos e IDs duplicados são recusados; entrega do link pelo Android ainda precisa de teste físico. |
| Modos e persistência | `src/core/store.tsx`, `src/storage/database.ts`, `src/core/workspace-session.ts` | Equipe local, demonstração pronta e conta conectada usam dados separados. No aparelho, SQLite; conta conectada, API. Leitura/escrita são serializadas para polling não apagar uma alteração recente. |
| Cadastro e regras locais | `src/app/editar.tsx`, `src/core/domain.ts` | Formulário valida os campos e o domínio repete as regras. Time novo começa sem partidas/matches antigos. A demonstração usa adversários fictícios identificados. |
| API e relações | `api/src/app.ts`, `api/src/service.ts`, `api/src/network.ts` | Controller recebe HTTP; serviço autentica; regras/banco autorizam pela sessão. A API verifica reciprocidade, participação no chat e agenda. Dados de propriedade enviados pelo cliente não concedem acesso. |
| Partida/reputação | `api/src/network.ts`, `api/migrations/003_shared_proposals.sql` até `006_der_entity_identifiers.sql` | Proposta exige resposta adversária; caução é simulada; resultado respeita estado/horário; avaliação exige conclusão e é única por participante. Explicar FK, transação e restrição UNIQUE com esses exemplos. |
| Arbitragem | `api/src/arbitration.ts`, `src/components/connected-referee.tsx` | Perfil profissional é autodeclarado e separado da equipe. Somente convocado responde; servidor bloqueia vaga ocupada, conflito de horário e atuação na própria equipe. |
| Segurança da conta | `api/src/account-security.ts`, `api/src/mail.ts`, `src/app/conta.tsx` | Senha atual autoriza troca/geração de códigos; códigos são exibidos uma vez e só hashes ficam no banco. Recuperação/troca revogam sessões. SMTP sem credenciais fica indisponível; teste com adaptador de e-mail não prova entrega externa. |
| Complementos acadêmicos | `src/core/academic.ts`, `api/src/academic-extras.ts` | Elenco/campo preferido persistem. Cartões são apenas identificadores fictícios de quatro dígitos; planos/créditos são demonstrativos. Interesse prioritário nunca dispensa reciprocidade. Quantidades/limites foram escolhas da implementação, não valores definidos pelo PDF. |

## Ensaio curto de domínio

Cada integrante deve conseguir executar uma parte e responder, apontando o trecho relevante:

1. De onde vêm os dados da equipe e onde eles ficam salvos em cada modo?
2. Qual regra impede conversar sem match ou ler a conversa de outra equipe?
3. Por que aceitar proposta não equivale a cobrança e como a caução simulada confirma o jogo?
4. O que impede duplicar avaliação ou aceitar dois convites de arbitragem no mesmo horário?
5. O que acontece com as sessões ao recuperar a conta, e por que os códigos devem ser guardados antes de perder o acesso?
6. Quais resultados foram testados localmente, quais foram verificados no servidor hospedado e quais ainda precisam de celular/Figma/ensaio humano?

Use `VALIDACAO.md` para citar evidências realmente executadas e `AUDITORIA.md` para declarar limites. Não apresentar integração Google, entrega de e-mail, pagamento real ou teste físico como concluídos sem evidência.
