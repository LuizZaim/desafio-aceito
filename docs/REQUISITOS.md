# Rastreabilidade RF01–RF30

| Requisito do PDF | Implementação entregue | Limitação |
|---|---|---|
| RF01 login | Tela `/` e API `/auth/login` | Depende de API configurada. |
| RF02 cadastro | `/cadastro`, `/auth/register` | Conta online abre espaço demonstrativo. |
| RF03 recuperação | `/recuperar` | Envio de e-mail pendente, informado na tela. |
| RF04 cadastrar equipe | Perfil inicial criado com a demonstração; `/editar` | Onboarding dedicado de equipe ainda pendente. |
| RF05 editar equipe | `/editar`, ação profile | Nome, bairro, categoria, nível e descrição. |
| RF06 proximidade | Descoberta por bairro/raio | Distâncias estáticas de teste. |
| RF07 raio | `/filtros` | 5, 10, 15, 25 e 50 km demonstrativos. |
| RF08 nível | `/filtros` | Amador, Várzea, Base, Semiprofissional. |
| RF09 categoria | Descoberta e filtros | Masculino, Feminino, Sub-15 e Veteranos. |
| RF10 match | Interesse + reciprocidade no domínio | Resposta adversária definida na massa fictícia. |
| RF11 chat | `/matches` → `/chat` | Restrito a match; sem envio entre contas reais. |
| RF12 agendar | `/agendar` | Proposta local, sem aceite real de outra conta. |
| RF13 mando/local | `/agendar` | Seletores validados. |
| RF14 avaliação | `/avaliar` | Uma por partida concluída; notas 1–5. |
| RF15 ranking | Aba Ranking | Média inicial fictícia + avaliações locais. |
| RF16 caução | `/partida`, ação pay | Aprovação simulada, sem gateway. |
| RF17 cancelamento | `/partida`, ação cancel | Taxas ilustrativas; sem cobrança real. |
| RF18 clima | Cancelamento aguarda acordo | Concordância adversária simulada explicitamente. |
| RF19 árbitro | `/arbitragem`, troca de perfil e disponibilidade | Cadastro/verificação profissional pendentes. |
| RF20 contratar árbitro | Aceitar/recusar convite na demonstração | Não conecta profissional real. |
| RF21 disponibilidade de campo | Bloqueio de conflito de 2h na própria agenda | Reserva e agenda externa pendentes. |
| RF22 aviso de match | Notificação interna | Push externo pendente. |
| RF23 aviso de mensagem | Histórico de mensagens | Mensagens recebidas e avisos entre dispositivos pendentes. |
| RF24 compartilhar | Compartilhamento nativo de resumo textual | Perfil público com URL compartilhável pendente. |
| RF25 excluir equipe | Desativação/restauração e trava de partidas ativas | Exclusão definitiva e retenção em produção pendentes. |
| RF26 denúncia | Registro de motivo | Central de moderação pendente. |
| RF27 dados do jogo | Placar após início; atualização de estado | Sem conciliação de resultados entre contas. |
| RF28 ver equipe | `/equipe` | Dados fictícios. |
| RF29 histórico | Agenda/Histórico + perfil | Persistido no aparelho ou na conta da API. |
| RF30 cancelar match | `/equipe` | Impede encerrar conexão com partida ativa. |
