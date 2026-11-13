# Homologação entre duas contas

Roteiro de aceite para executar com o aplicativo conectado à mesma API e ao mesmo banco. Estes passos são instruções de verificação; não constituem evidência de execução em aparelho. Resultados efetivamente observados devem ser registrados em `VALIDACAO.md`, com versão do APK e ambiente.

Use duas sessões independentes, A e B, e uma terceira conta C para verificar acesso indevido. Não reutilize o perfil local ou a demonstração como se fossem contas online. A API publicada está em `https://desafio-aceito-api-production.up.railway.app`; um servidor de desenvolvimento acessível na rede também pode ser usado para testes locais.

Os critérios 45/46 e um teste de fumaça entre contas já possuem evidência de API/banco/HTTPS em `VALIDACAO.md`; repita este roteiro no APK atualizado para comprovar o cliente móvel. Execução apenas local não comprova implantação. Caução, penalidade e estorno são simulações acadêmicas, sem dinheiro real.

O cliente conectado consulta atualizações a cada 8 segundos enquanto o app está em primeiro plano, ao voltar ao primeiro plano e por atualização manual. Essa consulta periódica permite observar mudanças entre contas; não representa WebSocket nem garante push quando o app estiver fechado. Uma falha de rede preserva a última tela carregada e apresenta o estado de sincronização.

| Passo | Ação | Resultado esperado |
|---|---|---|
| 1 | A e B criam contas e cadastram nomes diferentes de equipes. | Cada organizador vê sua própria equipe, sem partidas ou matches fictícios. |
| 2 | Ambos abrem Descobrir e ajustam categoria, nível e região compatíveis. | A encontra B e B encontra A. A própria equipe não aparece como adversária. Distância não calculada não é apresentada como medida real. |
| 3 | A registra interesse em B. | A recebe confirmação do interesse; a conversa ainda não é liberada. Repetir a requisição não cria duplicação de interesse/match. |
| 4 | B atualiza a descoberta e registra interesse em A. | O match passa a existir para ambos; cada lado vê o nome correto do adversário. |
| 5 | A atualiza Matches e abre a conversa com B. | A conexão aparece e o histórico começa sem mensagens inventadas. |
| 6 | A envia uma mensagem; B atualiza/abre a conversa e responde. | B vê a mensagem de A como recebida e sua resposta como própria. A vê a resposta de B após atualizar. Texto não se perde após novo login. |
| 7 | C tenta consultar ou enviar usando o identificador da conversa de A/B. | API recusa o acesso sem revelar mensagens; C não ganha um match por informar o identificador. |
| 8 | A edita nome/apresentação da equipe; B recarrega os dados. | Perfil público e conversa usam os dados atuais; a edição não muda o dono nem apaga o histórico. |
| 9 | A e B fecham e reabrem o aplicativo. | Após retomada/autenticação e atualização, o match e as mensagens persistem. |
| 10 | Interrompa a rede antes de uma atualização/envio. | O app informa a falha e permite tentar novamente; não apresenta sucesso de envio não confirmado. O texto digitado deve permanecer disponível para nova tentativa. |
| 11 | A sai da conta online e abre o cadastro local/demonstração. | Sessões e dados dos modos permanecem separados; mensagens online não são tratadas como envio local nem dados fictícios como contatos reais. |

## Proposta e resposta adversária

| Passo | Ação | Resultado esperado |
|---|---|---|
| 12 | Após o match, A propõe amistoso para data futura, informa o local e escolhe mandante. | Ambos veem a mesma proposta como **Aguardando adversário**; nenhum pagamento ou confirmação é registrado. |
| 13 | A tenta aceitar a própria proposta; C tenta responder por ela. | Servidor recusa ambas as ações. Só B pode aceitar/recusar. |
| 14 | B aceita; A atualiza a agenda. | Ambos veem **Aguardando caução**. A simulação de pagamento só fica disponível após esse aceite. |
| 15 | Tente propor outro jogo com uma das equipes no mesmo horário ou em intervalo menor que 2 horas; repita com outras equipes no mesmo local textual. | API bloqueia o conflito interno; não promete reserva real do campo. |
| 16 | A solicita cancelamento climático e tenta concordar com o próprio pedido. Depois B concorda. | A não pode aprovar; com o acordo de B, ambos veem a partida cancelada sem penalidade e eventual estorno explicitamente simulado. |
| 17 | Crie uma segunda proposta e B a recusa. | Ambos veem a proposta cancelada e o horário interno é liberado. |
| 18 | Com uma proposta ativa, tente encerrar o match ou desativar equipe. | API impede até cancelar a proposta/partida ativa. |

## Caução simulada e pós-jogo

| Passo | Ação | Resultado esperado |
|---|---|---|
| 19 | Em nova proposta aceita, participante simula a caução. C tenta simular; repita como participante depois da aprovação. | Somente participante aprova uma vez; jogo aparece Confirmada com pagamento **Simulada**. Repetição não duplica caução. Nenhum valor é cobrado e o cliente não escolhe o valor registrado pelo servidor. |
| 20 | Antes do início, tente registrar placar. Depois do horário, registre com uma das equipes. | Antes é recusado; depois aceita placar inteiro válido e mostra Concluída para ambos. Cada lado vê seu próprio placar e o do adversário na perspectiva correta. |
| 21 | A avalia nível técnico, fair play, pontualidade e organização; tente omitir nota ou avaliar novamente. Depois B avalia. | Somente notas inteiras de 1–5, uma avaliação por equipe/partida. A e B avaliam o adversário; C não pode avaliar. |
| 22 | Reabra Ranking e Histórico nas duas contas. | Partida, avaliação própria e notas recebidas persistem. Média do servidor usa os quatro critérios e não é somada novamente no cliente. |
| 23 | Em outro amistoso com caução simulada, cancele antecipadamente; repita em jogo no mesmo dia. | Penalidade ilustrativa antecipada R$ 10 e no dia R$ 30, com estorno simulado; os valores são exemplos acadêmicos. |
| 24 | Feche/reabra o app e entre novamente. | Partidas, caução simulada e avaliações são recuperadas da mesma base; não há cobrança real ou pedido de dados de cartão. |

## Arbitragem conectada

| Passo | Ação | Resultado esperado |
|---|---|---|
| 25 | Em outra conta R, cadastrar perfil autodeclarado de árbitro ou bandeirinha, região e disponibilidade. | Perfil salvo pela própria conta; não recebe autoridade de organizador sobre outra equipe. Não há alegação de habilitação profissional externa. |
| 26 | A/B convidam R para uma vaga compatível em jogo futuro confirmado com caução simulada. | Convite fica pendente e só R o recebe; participante alheio não pode criar/aceitar o convite. |
| 27 | R aceita; repetir aceite ou tentar a mesma vaga/profissional novamente. | Primeiro aceite associa R ao jogo; repetição, vaga ocupada e profissional duplicado são recusados. |
| 28 | Convide R para outro jogo em intervalo menor que 2 h e tente aceitar; teste disponibilidade desligada e vínculo com equipe participante. | Sistema bloqueia conflito, indisponibilidade e atuação na própria equipe. |
| 29 | Cancele o jogo ou conclua acordo climático; R atualiza seus convites. | Alocação pendente/aceita passa a Cancelado; histórico é preservado. Recusar convite também permite que outro profissional ocupe a vaga depois. |

## Limites do roteiro

Não há gateway, reserva externa do campo ou movimentação financeira. A disponibilidade vale para registros internos do app. Esses limites são parte da simulação acadêmica; não se deve apresentar os registros como pagamento/estorno reais. Os testes automatizados não comprovam que este roteiro foi executado no celular.

Valide também teclado, botão Voltar, tamanho de fonte, contraste e carregamento em aparelhos reais. Testes HTTP locais não substituem essa etapa.
