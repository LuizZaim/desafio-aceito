# Aceite do código — auditoria 29–50

Referências: PDF técnico e auditoria de 11/11/2026. A documentação acadêmica original permanece como fonte; este arquivo acompanha apenas implementação, evidências e entrega do app.

**Objetivo final:** demonstrar o aplicativo da faculdade e atender aos critérios de código 29–50, incluindo contas e dados persistidos em API/banco hospedados e acesso HTTPS comprovado. A simulação financeira é intencional: nenhum cartão, gateway ou dinheiro real é necessário para a atividade. O modo local sem servidor é uma alternativa de teste com adversários fictícios, não substitui a evidência de hospedagem e persistência compartilhada solicitada.

| Critérios | Aceite para fechar | Evidência / pendência |
|---|---|---|
| 29–33 — Interface | Navegação do sitemap, telas/formulários, loading/sucesso/erro/vazio, validação e uso no celular. | Rotas e regras implementadas; registrar instalação, teclado/Voltar, fonte/legibilidade e matriz de tamanhos. A comparação com o Figma não deve usar prints inventados. |
| 34–37 — API | Controllers/serviços separados, status semânticos, erros seguros e configuração fora do código. | Testes HTTP e revisão, API Railway publicada e fluxo entre contas verificado sem expor segredos. |
| 38–41 — Banco | Migrações relacionais, PK/FK/restrições e consultas parametrizadas para entidades do fluxo do PDF. | Entidades do DER lógico mapeadas, migrações 001–006 testadas e verificadas no Neon, fluxo compartilhado aprovado. Localização sem informação e transação externa simulada permanecem NULL. |
| 42–44 — Git/setup | Histórico organizado, ignore funcional e README reproduzível com código disponibilizado na entrega. | Repositório local/bundle preservam o histórico. O usuário quer GitHub para compartilhar o APK posteriormente; não publicar remoto/release nesta etapa. |
| 45–47 — Publicação | API e banco realmente disponíveis, HTTPS/certificado verificados; navegação/links nativos homologados. | API Railway/banco Neon, `/health` 200/1.2.0, fluxo compartilhado e HTTP→HTTPS 301 verificados. Novo APK e links nativos ainda precisam de homologação. Critério SPA adaptado à entrega nativa. |
| 48–50 — Validação final | Testes das regras e exceções passam; integrantes explicam o código e executam o fluxo no APK com dados consistentes. | Resultados executados em `VALIDACAO.md`; APK atualizado, teste físico e ensaio final continuam necessários. Bundle Android não é instalação. |

## Roteiro mínimo da entrega

1. Cadastrar a própria equipe, validar campos, editar e recuperar os dados após fechar/reabrir.
2. No modo conectado à API hospedada, usar duas contas: descobrir equipes, registrar reciprocidade, conversar e enviar proposta; somente adversário responde.
3. Simular caução com rótulo explícito e sem cobrança; demonstrar cancelamento comum/climático, proteção contra duplicidade e acesso de terceiro.
4. Após o horário de início, registrar resultado, avaliar nível técnico/fair play/pontualidade/organização e consultar histórico/ranking compartilhados. Para ensaio, agendar alguns minutos à frente, respeitando a regra de horário.
5. Mostrar o fluxo de arbitragem disponível e registrar suas limitações conforme a matriz; confirmar estados e persistência no banco.
6. Testar também o modo local: equipe própria sem matches/partidas antigos, adversários e finanças fictícios identificados, histórico salvo separado da demonstração pronta.
7. Gerar APK atualizado, instalar e repetir o roteiro escolhido para apresentação. Registrar versão, ambiente, resultado e eventuais falhas; disponibilização pelo GitHub fica para etapa posterior.

## Regras de encerramento

- Marcar como atendido somente o que possui evidência: testes locais, configuração, deploy e teste físico são evidências distintas.
- Os critérios 45/46 possuem evidência de API/banco publicados e HTTPS; isso não comprova novo APK instalado ou links nativos homologados. Não substituir essas evidências entre si.
- Não exigir serviços comerciais de pagamentos para uma simulação acadêmica; declarar esse recorte nos requisitos e na auditoria.
- Não reescrever o PDF acadêmico, inventar capturas de Figma/CASE ou declarar 100% por existir código/telas. A auditoria de implementação é `AUDITORIA.md`; testes são `VALIDACAO.md`.
