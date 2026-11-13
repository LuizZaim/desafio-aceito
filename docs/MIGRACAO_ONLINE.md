# Evolução da base online

A rede entre equipes usa a API e o PostgreSQL. O armazenamento local do aparelho e a demonstração não são publicados nem enviados ao banco por esta migração.

Essa rede pode executar em servidor local para testes; a entrega final do checklist 29–50 também exige sua publicação/HTTPS comprovados. O modo local do APK é uma alternativa que funciona sem API. Cauções, penalidades e estornos desta versão são simulados mesmo no banco compartilhado; não há cartão, gateway ou movimentação financeira.

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
| PARTIDA / CAMPO | `games` e `fields`, migrações 003/004/006 | Proposta, resposta adversária, caução simulada, cancelamento e resultado. Conflito de 2 h para ambas as equipes/local informado, sem reserva externa. Endereço e latitude/longitude opcionais adicionados na 006; par de coordenadas validado quando informado, legado permanece NULL. Placar só após início e por participante. |
| CAUCAO | `simulated_deposits`, migrações 004/006 | PK própria `id` e `game_id` único, valor ilustrativo do servidor, estados/penalidades simulados. Campo opcional único `external_transaction_id` mapeia o DER, mas permanece NULL nas simulações. Não há processamento financeiro. |
| AVALIACAO | `game_reviews`, migrações 004/006 | PK própria `id` e par partida/avaliador único; FK de equipes e quatro notas inteiras de 1–5. Serviço verifica conclusão/participação e define adversário; catálogo consolida médias recebidas. |
| ARBITRO / PARTIDA_ARBITRO | `referees` e `game_referees`, migração `005_referee_assignments.sql` | Perfil por usuário, disponibilidade/região/tipo; convite privado por partida/vaga/profissional, aceite/recusa e histórico. FK e índices únicos impedem duas alocações ativas na mesma vaga ou do mesmo profissional na partida. Serviço exige participante/convocado e evita conflito de 2 h. Perfil é autodeclarado para a atividade, sem verificação externa. |

O workspace JSONB guarda preferências, equipes puladas e rascunho quando necessário; não concede propriedade, match ou conversa. A Figura 18 (página física 36/impressa 35 do PDF) foi inspecionada visualmente. A migração `006_der_entity_identifiers.sql` cobre os atributos de campo e identificadores próprios de caução/avaliação nela representados, preservando unicidade e dados anteriores. A figura não explicita marcadores de cardinalidade; não foram inferidos requisitos a partir de conectores sem marcação. Campos opcionais sem informação real permanecem NULL.

Na base hospedada do Neon foram verificados `schema_migrations` com 001–006, colunas de endereço/coordenadas, PKs próprias e restrições únicas de cauções/avaliações. A API Railway voltou a responder `/health` com versão 1.2.0 após a atualização. O teste de fumaça completo anterior foi preservado; após a migração aditiva foram verificadas implantação, saúde e estrutura, sem repetir desnecessariamente todas as mutações.

Os resultados efetivamente executados de migração e integração são registrados em `VALIDACAO.md`. Este documento descreve o desenho e a operação; não comprova execução em banco de produção.
