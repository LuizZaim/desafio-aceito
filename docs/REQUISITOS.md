# Rastreabilidade RF01–RF30

Referência: tabela de requisitos e casos de uso da documentação técnica revisada. A presença de uma tela não comprova integração online nem atendimento integral. A ordem de conclusão e os critérios de aceite estão em [PLANO_CONCLUSAO.md](PLANO_CONCLUSAO.md); evidências executadas, em [VALIDACAO.md](VALIDACAO.md).

**Escopo acadêmico:** o modo local cadastra a equipe no aparelho e simula adversários, conversa e finanças sem servidor. O modo conectado permite o fluxo esportivo entre contas de teste com API/banco compartilhados, mantendo caução/penalidade/estorno simulados. Não há cobrança, gateway, cartão ou transferência real em nenhum modo. O aceite do checklist de código inclui API/banco hospedados e HTTPS comprovados; o modo local é uma alternativa e não os substitui. Serviços externos não comprovados continuam identificados abaixo.

| Requisito do PDF | Implementação entregue | Limitação |
|---|---|---|
| RF01 login | Tela `/` e API `/auth/login` | Depende de API configurada. |
| RF02 cadastro | `/cadastro`, `/auth/register` | Conta online exige API configurada e inicia sem equipe; o cadastro da equipe vem em seguida. |
| RF03 recuperação | `/recuperar` | Envio de e-mail pendente, informado na tela. |
| RF04 cadastrar equipe | `/editar`, ação `registerTeam`, tabela `teams` no modo conectado | Cadastro local persiste no aparelho e funciona sem API; começa sem matches/partidas antigos e usa adversários fictícios identificados. Conta conectada publica equipe aos demais usuários da mesma API. Novo APK e instalação ainda precisam ser verificados. |
| RF05 editar equipe | `/editar`, ação `profile` | Perfil próprio validado e persistido no servidor; os outros usuários obtêm os dados ao atualizar. Uma equipe por conta nesta etapa. |
| RF06 proximidade | Descoberta por região; adversários fictícios nos modos locais | Bairro/cidade/UF disponíveis no modo conectado; sem coordenadas ou distância calculada. Modos locais usam distâncias de teste. |
| RF07 raio | `/filtros` | Raio 5, 10, 15, 25 e 50 km sobre a massa fictícia nos modos locais; modo conectado não apresenta distância desconhecida como medida real. Geolocalização externa não incluída. |
| RF08 nível | `/filtros` | Amador, Várzea, Base, Semiprofissional. |
| RF09 categoria | Descoberta e filtros | Masculino, Feminino, Sub-15 e Veteranos. |
| RF10 match | Interesse/reciprocidade de teste local; interesses direcionais relacionais no servidor | Local usa reciprocidade definida nos adversários fictícios; conectado exige duas contas, par único e notificação interna. |
| RF11 chat | `/matches` → `/chat`, persistência local ou mensagens relacionais | Local salva conversa simulada sem destinatário real. Conectado valida remetente/participantes, consulta atualizações a cada 8 s em primeiro plano/manual; sem WebSocket ou push. |
| RF12 agendar | `/agendar`, proposta local ou compartilhada | Conectado: somente adversário aceita/recusa e o aceite passa a Aguardando caução. Local: negociação/aceite são simulados. A confirmação nos dois caminhos usa caução explicitamente simulada. |
| RF13 mando/local | `/agendar`, `home_team_id` e `field_id` | Mando validado como participante; local informado pelo organizador e normalizado para conflito interno. Reserva externa/agenda do gestor pendente. |
| RF14 avaliação | `/avaliar`, regra `review` e `game_reviews` | Quatro notas inteiras de 1–5: nível técnico, fair play, pontualidade e organização. Somente partida concluída e uma avaliação por participante; conectado persiste no banco. Registros locais antigos de dois critérios são preservados. |
| RF15 ranking | Aba Ranking e consolidação da API | Local combina massa fictícia e avaliações locais. Conectado usa médias recebidas dos quatro critérios, contagem de avaliações e partidas concluídas, sem dupla contagem no cliente. São dados de uma atividade demonstrativa. |
| RF16 caução | `/partida`, ação `pay` e `simulated_deposits` | Simulação acadêmica: participante aprova após aceite bilateral, apenas para jogo futuro; servidor fixa valor ilustrativo e rejeita pagamento duplicado. Não cobra nem processa cartão/gateway. RF financeiro real não é declarado integralmente atendido. |
| RF17 cancelamento | `/partida`, ação `cancel` | Penalidade ilustrativa de R$ 10 antecipada ou R$ 30 no dia (São Paulo), com registro de estorno simulado quando houve caução simulada; sem movimentação financeira. Valores não são fixados pelo PDF. |
| RF18 clima | Solicitação e concordância | Local simula o aceite adversário de forma explícita; conectado exige o outro organizador. Acordo cancela sem penalidade e registra eventual estorno simulado. |
| RF19 árbitro | `/arbitragem`, perfil conectado em `referees` | Conta cadastra perfil autodeclarado de árbitro/bandeirinha, região e disponibilidade. Perfil profissional é independente da própria equipe; não há comprovação de habilitação externa. Modo local mantém simulação. |
| RF20 contratar árbitro | Convite privado em `game_referees` | Organizador participante convida em jogo futuro confirmado por caução simulada; só profissional designado aceita/recusa. Valida tipo, disponibilidade, vaga, conflito de 2 h e vínculo com equipe participante. Não há pagamento/contrato profissional real. |
| RF21 disponibilidade de campo | Bloqueio transacional de conflito de 2h para as duas equipes e local informado | Valida somente registros do app, com local deduplicado por texto. Cadastro do campo, agenda externa e reserva real pendentes. |
| RF22 aviso de match | Notificações persistidas para os dois participantes | Preferência de notificações respeitada; atualização em primeiro plano. Push externo pendente. |
| RF23 aviso de mensagem | Mensagem e aviso persistidos para o destinatário | Consultados pelo outro dispositivo enquanto conectado. Push/entrega em segundo plano e rastreio de tentativas pendentes. |
| RF24 compartilhar | Compartilhamento nativo de resumo textual | Perfil público com URL compartilhável pendente. |
| RF25 excluir equipe | Desativação/restauração e trava de partidas ativas | Desativação não equivale à exclusão descrita no RF25; política de retenção e implementação da exclusão em produção pendentes. |
| RF26 denúncia | Motivo registrado em `team_reports` no servidor | Atendimento e central de moderação pendentes; app informa esse limite. |
| RF27 dados do jogo | Estados e placar persistidos localmente ou compartilhados | Resultado somente após horário de início de partida confirmada; conectado valida participação e projeta placar na perspectiva de cada equipe. Conciliação bilateral de resultado não está implementada. |
| RF28 ver equipe | `/equipe`, `GET /teams/:id` autenticado | Perfil real ativo; adversário inativo só permanece acessível a participante com histórico de partida compartilhada. Terceiros não acessam esse perfil inativo. URL pública externa pendente. |
| RF29 histórico | Agenda/histórico persistidos localmente ou em `games` | Retomada entre sessões de propostas, cancelamentos e partidas concluídas; dados esportivos e financeiros usados para a atividade. |
| RF30 cancelar match | `/equipe`, encerramento relacional para os dois participantes | Servidor impede encerramento com proposta/partida ativa; remove reciprocidade para exigir novo interesse mútuo. O encerramento oculta a conversa; se o mesmo par der novo match, o histórico anterior é preservado. |

## Casos de uso que complementam a tabela de RFs

| Caso de uso do PDF | Situação que ainda precisa ser concluída |
|---|---|
| UC-L02 / UC-L04 | Recuperar acesso por código de uso único e alterar a senha. |
| UC-E05 | Alteração de e-mail e senha com verificação de identidade e política de sessões. |
| UC-R03 / UC-R05 | Pontualidade e organização no formulário, domínio e avaliação compartilhada; homologação em aparelho ainda pendente. |
| UC-C02 / UC-C03 / UC-C04 | Pagamentos da atividade simulados; gestão real de cartões/assinaturas não incluída. Não é necessário gateway para apresentar o fluxo acadêmico. |
| UC-D05 | Interesse prioritário precisa de regra de elegibilidade/destaque definida. A prioridade nunca dispensa reciprocidade. |

## Limites de validação dos requisitos não funcionais

As checagens de domínio/API sustentam parte de RNF07/08/12/15/21, dentro dos caminhos exercitados. Publicação, HTTPS/redirecionamento e persistência compartilhada têm evidência adicional no ambiente hospedado. Não foram comprovados disponibilidade mensal de 99,5% (RNF01), P95 em até 2 s sob carga nominal (RNF02), escalabilidade (RNF03), matriz Android/iOS (RNF04), acessibilidade no aparelho (RNF06), operação financeira (RNF09/20), política LGPD/retenção (RNF10/22), configuração integral de criptografia em repouso (RNF11), restauração de backup (RNF13/14), observabilidade completa (RNF16), push entregue (RNF18) ou distâncias reais (RNF19). Não inferir aprovação dessas metas a partir do build.

Essas metas permanecem como especificação/possível evolução sem exigir uma operação comercial para simular pagamentos. Publicação/HTTPS e persistência compartilhada foram verificadas; instalação e execução do roteiro no celular ainda precisam de evidência para encerrar a entrega. Testes locais não substituem essas verificações.
