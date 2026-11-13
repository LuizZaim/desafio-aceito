# Rastreabilidade RF01–RF30

Referência: tabela de requisitos e casos de uso da documentação técnica revisada. A presença de uma tela não comprova integração online nem atendimento integral. A ordem de conclusão e os critérios de aceite estão em [PLANO_CONCLUSAO.md](PLANO_CONCLUSAO.md); evidências executadas, em [VALIDACAO.md](VALIDACAO.md).

| Requisito do PDF | Implementação entregue | Limitação |
|---|---|---|
| RF01 login | Tela `/` e API `/auth/login` | Depende de API configurada. |
| RF02 cadastro | `/cadastro`, `/auth/register` | Conta online exige API configurada e inicia sem equipe; o cadastro da equipe vem em seguida. |
| RF03 recuperação | `/recuperar` | Envio de e-mail pendente, informado na tela. |
| RF04 cadastrar equipe | `/editar`, ação `registerTeam`, tabela `teams` | Conta online publica equipe ativa para a descoberta dos demais usuários da mesma API. Cadastro local continua apenas no aparelho. API publicada e novo APK conectado ainda pendentes. |
| RF05 editar equipe | `/editar`, ação `profile` | Perfil próprio validado e persistido no servidor; os outros usuários obtêm os dados ao atualizar. Uma equipe por conta nesta etapa. |
| RF06 proximidade | Descoberta de equipes reais por região no modo online | Bairro/cidade/UF disponíveis; sem coordenadas ou distância calculada. Demonstração mantém distâncias fictícias. |
| RF07 raio | `/filtros` | Raio 5, 10, 15, 25 e 50 km somente na demonstração; modo online não apresenta distância desconhecida como medida real. Geolocalização pendente. |
| RF08 nível | `/filtros` | Amador, Várzea, Base, Semiprofissional. |
| RF09 categoria | Descoberta e filtros | Masculino, Feminino, Sub-15 e Veteranos. |
| RF10 match | Interesses direcionais e match relacional no servidor | Reciprocidade entre duas contas reais; par único e notificações internas. Requer a mesma API acessível. Demonstração permanece separada. |
| RF11 chat | `/matches` → `/chat`, mensagens relacionais | Remetente validado pela sessão; somente participantes do match ativo acessam. Atualização por consulta a cada 8 s em primeiro plano/manual; sem WebSocket ou push. |
| RF12 agendar | `/agendar`, propostas e resposta adversária no servidor | Proposta fica Aguardando adversário; somente o adversário aceita/recusa. Aceite passa a Aguardando caução. Confirmação final depende do gateway ainda não integrado. |
| RF13 mando/local | `/agendar`, `home_team_id` e `field_id` | Mando validado como participante; local informado pelo organizador e normalizado para conflito interno. Reserva externa/agenda do gestor pendente. |
| RF14 avaliação | `/avaliar` e regra `review` | Na demonstração, novas avaliações exigem notas 1–5 de nível técnico, fair play, pontualidade e organização (UC-R02–R06); bloqueia repetição e preserva registros antigos de dois critérios. Resultado/avaliação ainda não são liberados online; faltam conclusão e avaliações relacionais compartilhadas. |
| RF15 ranking | Aba Ranking | Demonstração calcula média fictícia + avaliações dos quatro critérios. Ranking online sem avaliação consolidada; resultados/avaliações reais pendentes. |
| RF16 caução | `/partida`; ação `pay` restrita à demonstração | Servidor online rejeita confirmação simulada; proposta aceita continua pendente e nenhum valor é cobrado. Gateway, webhook e conciliação pendentes. |
| RF17 cancelamento | `/partida`, ação `cancel` no servidor | Propostas online podem ser canceladas sem cobrança porque não há caução integrada. Cálculo/execução de penalidade real pendente; valores ilustrativos só na demonstração. |
| RF18 clima | Solicitação e concordância entre contas | Somente o outro organizador pode concordar; solicitante não aprova a própria exceção. Sem estorno financeiro real nesta versão. |
| RF19 árbitro | `/arbitragem`, troca de perfil e disponibilidade | Cadastro/verificação profissional pendentes. |
| RF20 contratar árbitro | Aceitar/recusar convite na demonstração | Não conecta profissional real. |
| RF21 disponibilidade de campo | Bloqueio transacional de conflito de 2h para as duas equipes e local informado | Valida somente registros do app, com local deduplicado por texto. Cadastro do campo, agenda externa e reserva real pendentes. |
| RF22 aviso de match | Notificações persistidas para os dois participantes | Preferência de notificações respeitada; atualização em primeiro plano. Push externo pendente. |
| RF23 aviso de mensagem | Mensagem e aviso persistidos para o destinatário | Consultados pelo outro dispositivo enquanto conectado. Push/entrega em segundo plano e rastreio de tentativas pendentes. |
| RF24 compartilhar | Compartilhamento nativo de resumo textual | Perfil público com URL compartilhável pendente. |
| RF25 excluir equipe | Desativação/restauração e trava de partidas ativas | Desativação não equivale à exclusão descrita no RF25; política de retenção e implementação da exclusão em produção pendentes. |
| RF26 denúncia | Motivo registrado em `team_reports` no servidor | Atendimento e central de moderação pendentes; app informa esse limite. |
| RF27 dados do jogo | Estados de proposta/cancelamento compartilhados; placar na demonstração | Registro de resultado e conciliação pós-jogo entre contas ainda bloqueados no servidor. |
| RF28 ver equipe | `/equipe`, `GET /teams/:id` autenticado | Perfil real ativo; adversário inativo só permanece acessível a participante com histórico de partida compartilhada. Terceiros não acessam esse perfil inativo. URL pública externa pendente. |
| RF29 histórico | Agenda e propostas/cancelamentos relacionais no modo online | Retomada entre sessões; histórico de jogos realizados depende de conclusão/resultado ainda pendentes. |
| RF30 cancelar match | `/equipe`, encerramento relacional para os dois participantes | Servidor impede encerramento com proposta/partida ativa; remove reciprocidade para exigir novo interesse mútuo. O encerramento oculta a conversa; se o mesmo par der novo match, o histórico anterior é preservado. |

## Casos de uso que complementam a tabela de RFs

| Caso de uso do PDF | Situação que ainda precisa ser concluída |
|---|---|
| UC-L02 / UC-L04 | Login e cadastro por Google com validação do provedor e vínculo de conta no servidor. |
| UC-E05 | Alteração de e-mail e senha com verificação de identidade e política de sessões. |
| UC-R03 / UC-R05 | Pontualidade e organização acrescentadas ao domínio e formulário; a homologação em aparelho e a reputação compartilhada entre contas permanecem pendentes. |
| UC-C02 / UC-C03 / UC-C04 | Pagamentos, métodos tokenizados e assinaturas reais; dependem da definição do gateway e dos planos. |
| UC-D05 | Interesse prioritário precisa de regra de elegibilidade/destaque definida. A prioridade nunca dispensa reciprocidade. |

## Limites de validação dos requisitos não funcionais

As checagens locais de domínio/API sustentam parte de RNF07/08/12/15/21, dentro dos caminhos exercitados. Não comprovam disponibilidade mensal de 99,5% (RNF01), P95 em até 2 s sob carga nominal (RNF02), escalabilidade (RNF03), matriz Android/iOS (RNF04), acessibilidade no aparelho (RNF06), operação financeira (RNF09/20), política LGPD/retenção (RNF10/22), TLS de produção (RNF11), restauração de backup (RNF13/14), observabilidade em nuvem (RNF16), push entregue (RNF18) ou distâncias geográficas reais (RNF19). Cada ponto exige a evidência indicada no plano, sem inferir aprovação a partir do build.
