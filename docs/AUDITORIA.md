# Validação contra a auditoria de 11/11/2026

Escopo: documento técnico fornecido + código desta entrega mobile. Revisão do planejamento em 13/11/2026. Os itens marcados como atendidos **no PDF** não são evidência de código. A validação abaixo é uma conferência técnica, não uma nota acadêmica ou certificação. Não houve acesso autenticado ao Figma, Miro ou Stitch. O [plano de conclusão](PLANO_CONCLUSAO.md) organiza as próximas entregas e os critérios de aceite.

**Escopo da entrega:** aplicativo demonstrativo da faculdade, com operações financeiras simuladas e identificadas. O usuário solicitou o atendimento dos critérios de código 29–50 com API/banco hospedados e persistência compartilhada. API Railway/banco Neon e HTTPS foram verificados conforme `VALIDACAO.md`; novo APK, teste físico e ensaio permanecem separados. O modo local sem API é uma alternativa com adversários fictícios. Gateway real/cobranças não fazem parte da simulação. O PDF original não foi reescrito.

Legenda: **A** = evidência encontrada no escopo indicado; **P** = parcial ou exige evidência adicional; **F** = falta implementar/verificar; **N/A** = critério de web que deve ser adaptado ao mobile.

| # | Critério | Situação | Evidência / falta |
|---|---|---|---|
| 1 | Introdução da produção técnica | A no PDF | Capítulo Produção Técnica, página impressa 3. |
| 2 | Introdução da modelagem do produto | A no PDF | Página impressa 3. |
| 3 | Sitemap, link e prints das partes | P | Figuras 1/1A presentes; o próprio PDF ressalva a URL direta do mapa. |
| 4 | Wireframes, descrição e tabela | A no PDF | W01–W11 e tabela, páginas 5–7. |
| 5 | Figma, prints de funcionamento e explicação | P | Referência e esquemas presentes; faltam prints autenticados da execução do Figma/Stitch. |
| 6 | Introdução da arquitetura | A no PDF | Página 9. |
| 7 | Arquitetura funcional | A no PDF | Figura 3 e tabela. |
| 8 | Arquitetura técnica | A no PDF | Figura 4 e tabela. A implementação efetiva é menor que a especificação. |
| 9 | MVC e hospedagem | A no PDF | Figura 5 e descrição; implementação/API hospedada têm evidência nos itens 34/45/46. Novo APK e homologação física permanecem separados. |
| 10 | Introdução de requisitos | A no PDF | Capítulo Engenharia de Requisitos. |
| 11 | Requisitos funcionais em tabela | A no PDF | RF01–RF30. |
| 12 | Requisitos não funcionais | A no PDF | Tabela do capítulo. |
| 13 | Requisitos associados | A no PDF | Tabela do capítulo. |
| 14 | Projeto linear | A no PDF | Tabela de realização. |
| 15 | Introdução de processos | A no PDF | Seção Modelagem de Processos e Fluxos. |
| 16 | Macroprocesso | A no PDF | Mapa e explicação. |
| 17 | Fluxograma | A no PDF | Mapa e explicação. |
| 18 | BPMN | A no PDF | Processo principal e suporte/cancelamento. |
| 19 | Introdução de diagramas | A no PDF | Seção Diagramas e Modelagem de Software. |
| 20 | Casos de uso por tela | A no PDF | Figuras e tabelas, com anexos originais. |
| 21 | Classes | A no PDF | Figura 17. |
| 22 | DER | A no PDF | Figura 18 e integridades. A implementação completa do DER ainda falta. |
| 23 | Máquina de estados | A no PDF | Estados e transições de partida. |
| 24 | Operação | A no PDF | Desenho e explicação. |
| 25 | DFD com níveis | P | O próprio PDF informa que contexto/nível 0 e decomposição nível 1 não estão explicitamente separados. |
| 26 | Processos de telas | A no PDF | Figura 22 e explicação. |
| 27 | CASE com evidência | P | Modelos presentes; falta captura autenticada do Miro com identificação do quadro. |
| 28 | Contexto e integrações | A no PDF | Figura 24 e tabela. |
| 29 | Navegação espelha sitemap | P | Rotas nativas de acesso, descoberta, filtros, matches, chat, agenda, ranking, equipe, árbitro e configurações. Google, recuperação e serviços financeiros reais pendentes. |
| 30 | Componentes e formulários | P | Telas implementadas a partir dos wireframes. Não foi comprovada identidade visual com o Figma vivo. |
| 31 | Desktop, tablet e mobile testados | P | Layout usa flex e largura máxima; prévia web foi inspecionada. Faltam homologação em telefone/tablet e matriz de tamanhos. Exportação Android não comprova teste em aparelho. |
| 32 | Loading, sucesso, erro e vazio | A no MVP | Provider, Busy/Empty, estados de formulário, alertas e regras de negócio. Sincronização online preserva a última leitura válida na falha, mostra erro e permite atualizar; sessão expirada retorna ao acesso. Homologação em aparelho permanece pendente. |
| 33 | Validação e máscaras | A no MVP | E-mail, senhas, cadastro próprio da equipe (nome, bairro, cidade, UF, categoria e nível), notas, data DD/MM/AAAA e hora HH:MM; validação de domínio e API. |
| 34 | Separação MVC | A no MVP | View: componentes RN; Controller: `api/src/app.ts`; Model/Service: `api/src/service.ts`, `api/src/network.ts`, domínio e banco. |
| 35 | API com status semânticos | A no MVP | 200/201/204/400/401/403/404/409; limita tentativas com 429 e trata erros inesperados. Suíte HTTP local cobre autenticação, propriedade de equipe, chat privado e respostas a propostas. |
| 36 | Erros seguros | A no MVP | Filtro global sem stack trace; mensagens de domínio controladas. |
| 37 | Variáveis isoladas | A no MVP | `.env.example`, `api/.env.example`, `.gitignore` e ambiente no servidor; somente URL pública no bundle. |
| 38 | Tabelas e campos alinhados ao DER | A para o DER lógico representado | Comparação visual da Figura 18 (PDF física 36/impressa 35) e esquema hospedado: entidades/FKs mapeadas; migração 006 acrescenta endereço/coordenadas de campo, PK própria e transação externa opcional da caução e PK própria da avaliação. `game_id` e partida/avaliador continuam únicos. Localização legada e transação externa simulada permanecem NULL, sem dados inventados. Isso não declara gateway/mapa reais. |
| 39 | PK/FK e integridade | A no escopo acadêmico testado | PK/FK/UNIQUE/CHECK, transações/travas e autorização; caução única por partida, avaliação única por participante/partida, vaga/profissional sem alocação ativa duplicada. Testes cobrem acessos indevidos, conflitos e cancelamento da arbitragem; esquema hospedado também consultado. Não há operação financeira real. |
| 40 | SQL protegido | A no MVP | Queries com placeholders no pg/SQLite; teste de tentativa de SQL injection no login. |
| 41 | Migração e dados de teste | A no MVP | Migrações 001–006 e aplicador versionado/transacional, com registro de aplicação verificado no Neon. Cadastros antigos válidos preservados; incompletos mantêm rascunho; nenhuma relação fictícia importada. Integração inclui reaplicação, restrições e preservação de cauções/avaliações na 006. No aparelho, equipe própria inicia sem histórico e usa dados separados da demonstração pronta. |
| 42 | Git e .gitignore | A local | Repositório inicializado; dependências, `.env`, builds e chaves excluídos. |
| 43 | Commits e branches | A local | Histórico do projeto e branches de implementação/validação no bundle Git incluído. Remoto ainda não publicado. |
| 44 | README e setup | A | Instruções de celular, API, Docker, testes e geração de APK. Bundle Git permite clonar sem remoto. |
| 45 | Deploy funcional em nuvem | A para API/banco | API Railway e PostgreSQL Neon publicados; `/health` 200, base consultada e teste de fumaça entre contas aprovado. [Endpoint verificado](https://desafio-aceito-api-production.up.railway.app/health). APK 1.2.0 gerado e assinado pelo EAS; não confundir deploy da API com instalação móvel. |
| 46 | SSL e HTTPS obrigatório | A no endpoint verificado | Acesso HTTPS concluído e HTTP redirecionado para HTTPS com status 301 no domínio da API. Evidência em `VALIDACAO.md`; não é certificação de segurança completa. |
| 47 | SPA e reload de rotas | N/A / P | O app usa navegação nativa e scheme `desafioaceito`. Links profundos precisam ser homologados no binário; critério SPA aplica-se ao renderer web opcional. |
| 48 | Testes de fluxo e exceção | A no escopo automatizado | Domínio, persistência e integração: cadastro local → match fictício → conversa → partida → caução simulada; contas independentes, propostas bilaterais, conflitos, caução/estorno simulados, resultado, avaliações dos quatro critérios, ranking e convites privados de arbitragem. Comandos/resultados em `VALIDACAO.md`. Aparelho e integrações externas não foram comprovados. |
| 49 | Revisão e domínio do código gerado | P | Revisão de regras, erros, isolamento e build realizada; o domínio dos integrantes deve ser demonstrado por cada um na apresentação. |
| 50 | Ensaio geral com dados consistentes | P | Navegação de descoberta → match → chat → proposta inspecionada na prévia; roteiro pronto. Falta ensaio da equipe em celular com APK ou Expo Go. |

## Para concluir a entrega e o checklist de código

1. Manter API/banco publicados e migrações atualizadas; o teste de fumaça e HTTPS já foram executados. Repetir o fluxo no APK atualizado para comprovar o cliente móvel com a base hospedada.
2. Gerar/instalar APK atualizado; executar cadastro → reciprocidade → chat → proposta/aceite → caução simulada → resultado após o início → avaliação dos quatro critérios → histórico/ranking, além de cancelamento e arbitragem conforme escopo implementado.
3. Confirmar reabertura, mensagens de erro, legibilidade e separação dos modos. O modo local com adversários fictícios também deve funcionar e não substitui o teste conectado.
4. Registrar ensaio/explicação do código pelos integrantes. O roteiro não é prova de execução e o APK antigo não comprova as alterações novas. Evidências documentais originais permanecem sob os itens 1–28, sem fabricar prints.

## Limites preservados

Integrações reais de pagamento, campos, mapas, push, e-mail/Google, habilitação profissional de árbitros e operação de moderação não são comprovadas. O recorte financeiro é simulado por definição acadêmica, sem pretensão de cobrança real. Os demais RFs/itens que exigem serviços não implementados continuam parciais. A disponibilidade de campos se refere aos registros do app, sem reserva externa. A atualização entre contas usa consulta a cada 8 s em primeiro plano/retomada/manual, sem garantia de entrega em segundo plano. Publicação/HTTPS possuem evidência de API; instalação, acessibilidade em aparelho e ensaio de apresentação ainda não.

GitHub/release para o professor baixar o APK fica para uma etapa posterior solicitada pelo usuário; nenhum remoto deve ser publicado agora.

Não somar itens A do PDF com os do código para alegar percentual de software em produção. O relatório original de 0/50 é uma lista de itens pendentes naquele levantamento, e não prova de ausência de todo o conteúdo documental.
