# Evolução da base online

A rede entre equipes usa a API e o PostgreSQL. O armazenamento local do aparelho e a demonstração não são publicados nem enviados ao banco por esta migração.

## Aplicação das migrações

O comando `cd api && npm run migrate` aplica os arquivos numerados de `api/migrations` em ordem, registra os nomes em `schema_migrations` e executa a migração em transação. O processo usa trava do PostgreSQL para evitar dois aplicadores simultâneos. Não editar uma migração já aplicada para alterar a base existente; mudanças posteriores devem entrar em um novo arquivo numerado.

No fluxo Docker, o serviço da API executa a migração antes de iniciar. Isso permite atualizar também um banco que já tenha volume criado, sem depender apenas dos scripts de inicialização de um volume vazio. Antes de usar com dados de produção, é necessário fazer backup e verificar restauração; os testes locais não substituem essa operação.

## Origem e destino dos dados

| Dado anterior | Tratamento da migração `002_shared_teams.sql` |
|---|---|
| Conta de usuário e sessão | Continuam nas tabelas `users` e `sessions`; credenciais não são expostas na descoberta. |
| Equipe cadastrada no workspace online, com campos válidos | Inserida em `teams`, preservando o vínculo do organizador. Cadastros antigos recebem identidade `team-` seguida do identificador do usuário. |
| Equipe antiga desativada | Mantém `active = false`; não entra como adversário disponível. Perfil histórico só é exposto a participante com partida compartilhada, sem disponibilizá-lo à descoberta de terceiros. |
| Nome, bairro, cidade, UF, categoria ou nível ausentes/inválidos | Não são promovidos automaticamente a equipe pública. O perfil anterior permanece como rascunho editável para concluir/corrigir os campos; não criar dados inventados para passar as restrições. |
| Interesses, matches e mensagens fictícios da versão anterior | Não são importados para relações reais. Um match online exige interesse recíproco de duas equipes cadastradas. |
| Equipe salva apenas no aparelho ou dados da demonstração | Permanecem no modo local, separados da conta online. Criar uma conta não é uma migração automática desses dados. |

## Aderência ao DER do PDF

| Entidade conceitual | Persistência nesta evolução | Limite |
|---|---|---|
| USUARIO | `users` e `sessions` | Uma equipe por organizador nesta etapa; múltiplas equipes/permissões ainda precisam de desenho próprio. |
| EQUIPE | `teams` | Campos obrigatórios, FK de organizador, identidade e estado ativo. Busca por bairro/cidade não equivale a PostGIS ou raio real. |
| Interesse | `team_interests` | Par único direcional; não aceita interesse na própria equipe. |
| MATCH | `team_matches` | Par ordenado único e estado ativo; acesso depende da participação. Encerrar oculta a conversa sem apagá-la; novo interesse mútuo do mesmo par reativa a relação/histórico. |
| MENSAGEM | `messages` | FK de match/remetente e texto limitado; validação do remetente é responsabilidade do serviço autenticado. |
| Notificação / denúncia | `notifications` e `team_reports` | Registro interno persistente não comprova entrega de push ou operação de moderação. |
| PARTIDA / CAMPO | `games` e `fields`, migração `003_shared_proposals.sql` | Proposta, aceite adversário e cancelamento compartilhados. Conflitos de 2 h verificados para ambas as equipes e local informado. Campo é deduplicado por texto, sem agenda do gestor ou coordenadas; a proposta aceita ainda aguarda caução. |
| CAUCAO / AVALIACAO / PARTIDA_ARBITRO | Evolução separada ainda necessária | Pagamentos, resultados, avaliações e arbitragem não estão liberados no servidor online. O DER e o ciclo completo da partida não estão concluídos. |

O workspace JSONB guarda preferências, equipes puladas e rascunho quando necessário; não concede propriedade, match ou conversa e não é evidência de conclusão das entidades relacionais pendentes. A auditoria 38/39 permanece parcial enquanto o fluxo completo e suas integridades não forem implementados e testados.

Os resultados efetivamente executados de migração e integração são registrados em `VALIDACAO.md`. Este documento descreve o desenho e a operação; não comprova execução em banco de produção.
