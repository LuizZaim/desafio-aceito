# Homologação entre duas contas

Roteiro de aceite para executar com o aplicativo conectado à mesma API e ao mesmo banco. Estes passos são instruções de verificação; não constituem evidência de execução em aparelho. Resultados efetivamente observados devem ser registrados em `VALIDACAO.md`, com versão do APK e ambiente.

Use duas sessões independentes, A e B, e uma terceira conta C para verificar acesso indevido. Não reutilize o perfil local ou a demonstração como se fossem contas online. Se a API ainda não estiver publicada, execute o servidor de desenvolvimento e use o endereço da rede acessível pelos aparelhos.

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
| 14 | B aceita; A atualiza a agenda. | Ambos veem **Aguardando caução**. Nenhum botão online simula aprovação, e chamada direta de pagamento é recusada. |
| 15 | Tente propor outro jogo com uma das equipes no mesmo horário ou em intervalo menor que 2 horas; repita com outras equipes no mesmo local textual. | API bloqueia o conflito interno; não promete reserva real do campo. |
| 16 | A solicita cancelamento climático e tenta concordar com o próprio pedido. Depois B concorda. | A não pode aprovar; com o acordo de B, ambos veem a partida cancelada sem cobrança. |
| 17 | Crie uma segunda proposta e B a recusa. | Ambos veem a proposta cancelada e o horário interno é liberado. |
| 18 | Com uma proposta ativa, tente encerrar o match ou desativar equipe. | API impede até cancelar a proposta/partida ativa. |

## O que este roteiro ainda não encerra

A proposta aceita não basta para homologar o ciclo completo. Ainda faltam disponibilidade/reserva externa do campo, caução confirmada pelo gateway, conclusão e avaliações compartilhadas dos quatro critérios. Não simular confirmação financeira no fluxo online para marcar esses itens como prontos. O acordo climático desta revisão não testa estorno, pois não houve cobrança.

Valide também teclado, botão Voltar, tamanho de fonte, contraste e carregamento em aparelhos reais. Testes HTTP locais não substituem essa etapa.
