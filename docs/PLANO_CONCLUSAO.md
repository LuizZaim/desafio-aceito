# Aceite do código — auditoria 29–50

Referências: PDF técnico e auditoria de 11/11/2026. A documentação acadêmica original permanece como fonte; este arquivo acompanha apenas implementação, evidências e entrega do app.

**Objetivo final:** demonstrar o aplicativo da faculdade e atender aos critérios de código 29–50, incluindo contas e dados persistidos em API/banco hospedados e acesso HTTPS comprovado. A simulação financeira é intencional: nenhum cartão, gateway ou dinheiro real é necessário para a atividade. O modo local sem servidor é uma alternativa de teste com adversários fictícios, não substitui a evidência de hospedagem e persistência compartilhada solicitada.

| Critérios | Aceite para fechar | Evidência / pendência |
|---|---|---|
| 29–33 — Interface | Navegação do sitemap, formulários/estados/validação e uso no celular. | Destinos do sitemap implementados, incluindo Google com SDK/verificação. Falta configuração real do Google e SMTP externo; Figma sem permissão suficiente e matriz visual ainda não executada. |
| 34–37 — API | Controllers/serviços separados, status semânticos, erros seguros e configuração fora do código. | Testes HTTP e revisão, API Railway publicada e fluxo entre contas verificado sem expor segredos. |
| 38–41 — Banco | Migrações relacionais, PK/FK/restrições e consultas parametrizadas do fluxo do PDF. | 001–008/24 tabelas verificadas na base principal; 009 Google testada em branch isolada/25 tabelas, aguardando publicação. Dados geográficos desconhecidos/transação externa simulada permanecem NULL. |
| 42–44 — Git/setup | Histórico organizado, ignore funcional e README reproduzível com código disponibilizado na entrega. | Repositório local/bundle preservam o histórico. O usuário quer GitHub para compartilhar o APK posteriormente; não publicar remoto/release nesta etapa. |
| 45–47 — Publicação | API/banco/HTTPS verificados; navegação e links homologados. | API 1.4.0 publicada e verificada; ledger principal 001–009 confirmado. Código de links/retomada testado; entrega pelo Android não homologada. Não gerar APK nesta etapa; 1.2.0 não comprova as alterações novas. |
| 48–50 — Validação final | Testes passam; integrantes explicam e ensaiam o fluxo. | 44 testes mobile, 21 cenários API, tipos/lint e compilação passaram. SMTP TLS local verificado, sem e-mail externo. Matriz visual, teste físico e ensaio humano continuam pendentes; guia não certifica compreensão. |

## Roteiro mínimo da entrega

1. Cadastrar a própria equipe, validar campos, editar e recuperar os dados após fechar/reabrir.
2. No modo conectado à API hospedada, usar duas contas: descobrir equipes, registrar reciprocidade, conversar e enviar proposta; somente adversário responde.
3. Simular caução com rótulo explícito e sem cobrança; demonstrar cancelamento comum/climático, proteção contra duplicidade e acesso de terceiro.
4. Após o horário de início, registrar resultado, avaliar nível técnico/fair play/pontualidade/organização e consultar histórico/ranking compartilhados. Para ensaio, agendar alguns minutos à frente, respeitando a regra de horário.
5. Mostrar o fluxo de arbitragem disponível e registrar suas limitações conforme a matriz; confirmar estados e persistência no banco.
6. Testar também o modo local: equipe própria sem matches/partidas antigos, adversários e finanças fictícios identificados, histórico salvo separado da demonstração pronta.
7. Não gerar APK nesta etapa. Após concluir o que for possível antes do binário e receber instrução futura, instalar uma versão atualizada e registrar homologação/links Android. GitHub continua para depois.

## O que ainda impede marcar tudo como atendido

- **29:** Google implementado/testado, mas depende de cadastro/configuração real de clientes OAuth e login nativo externo. SMTP implementado e testado com TLS local, mas falta configuração/entrega em provedor externo. Setup em `CONFIGURAR_GOOGLE_EMAIL.md`; códigos previamente salvos/troca de senha funcionam sem SMTP.
- **30/31:** arquivo Figma sem acesso suficiente nas operações disponíveis e renderer local inacessível nos navegadores; nenhuma nova fidelidade/matriz visual foi comprovada.
- **47:** código de deep links testado, mas abertura fria/retomada pelo sistema Android ainda precisa do APK atualizado e homologação.
- **49/50:** leitura guiada e testes não comprovam domínio dos integrantes nem ensaio no aparelho. Esses resultados devem ser registrados quando efetivamente executados.

Essas pendências são distintas de cobrança real: a simulação financeira da atividade está implementada e não exige contratar gateway.

## Regras de encerramento

- Marcar como atendido somente o que possui evidência: testes locais, configuração, deploy e teste físico são evidências distintas.
- Os critérios 45/46 possuem evidência de API/banco publicados e HTTPS; isso não comprova novo APK instalado ou links nativos homologados. Não substituir essas evidências entre si.
- Não exigir serviços comerciais de pagamentos para uma simulação acadêmica; declarar esse recorte nos requisitos e na auditoria.
- Não reescrever o PDF acadêmico, inventar capturas de Figma/CASE ou declarar 100% por existir código/telas. A auditoria de implementação é `AUDITORIA.md`; testes são `VALIDACAO.md`.
