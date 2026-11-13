# Validação contra a auditoria de 11/11/2026

Escopo: documento técnico fornecido + código desta entrega mobile. Revisão do planejamento em 13/11/2026. Os itens marcados como atendidos **no PDF** não são evidência de código. A validação abaixo é uma conferência técnica, não uma nota acadêmica ou certificação. Não houve acesso autenticado ao Figma, Miro ou Stitch. O [plano de conclusão](PLANO_CONCLUSAO.md) organiza as próximas entregas e os critérios de aceite.

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
| 9 | MVC e hospedagem | A no PDF | Figura 5 e descrição; deploy do app/API não comprovado. |
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
| 38 | Tabelas rigorosamente iguais ao DER | P | Equipes, interesses, matches, mensagens, campos e propostas de partidas normalizados, além de notificações/denúncias. Migrações 002/003. Faltam CAUCAO, AVALIACAO e PARTIDA_ARBITRO; CAMPO ainda é local textual sem agenda do gestor/coordenadas. O DER completo não está atendido. |
| 39 | PK/FK e integridade | P | PK/FK/UNIQUE/CHECK nas novas relações, transações/travas para reciprocidade e conflito de agenda; acesso validado pelo servidor. Fluxos financeiros, avaliações, arbitragem e integridades do DER completo permanecem pendentes. |
| 40 | SQL protegido | A no MVP | Queries com placeholders no pg/SQLite; teste de tentativa de SQL injection no login. |
| 41 | Migração e dados de teste | A no MVP | Migrações 001–003 e aplicador versionado/transacional. Cadastros antigos válidos são promovidos a equipes; incompletos mantêm rascunho editável; nenhum match/mensagem fictício é importado. Integração PGlite inclui migração/reaplicação e restrições. Demonstração e cadastro local seguem separados. |
| 42 | Git e .gitignore | A local | Repositório inicializado; dependências, `.env`, builds e chaves excluídos. |
| 43 | Commits e branches | A local | Histórico do projeto e branches de implementação/validação no bundle Git incluído. Remoto ainda não publicado. |
| 44 | README e setup | A | Instruções de celular, API, Docker, testes e geração de APK. Bundle Git permite clonar sem remoto. |
| 45 | Deploy funcional em nuvem | P | APK de teste da versão anterior gerado no Expo; link e registro constam em `VALIDACAO.md`. API/banco online, configuração HTTPS e nova distribuição das alterações posteriores continuam pendentes. APK disponível não comprova backend publicado ou instalação em aparelho. |
| 46 | SSL e HTTPS obrigatório | F | Exige hospedagem da API e validação do certificado/redirecionamento. O servidor local de desenvolvimento não atende este item. |
| 47 | SPA e reload de rotas | N/A / P | O app usa navegação nativa e scheme `desafioaceito`. Links profundos precisam ser homologados no binário; critério SPA aplica-se ao renderer web opcional. |
| 48 | Testes de fluxo e exceção | A no escopo automatizado | Domínio, persistência, transporte/sincronização e integração HTTP/banco: contas independentes, reciprocidade/chat privado, propostas bilaterais, conflitos e clima. Comandos/resultados em `VALIDACAO.md`. Aparelho, carga e integrações externas permanecem pendentes. |
| 49 | Revisão e domínio do código gerado | P | Revisão de regras, erros, isolamento e build realizada; o domínio dos integrantes deve ser demonstrado por cada um na apresentação. |
| 50 | Ensaio geral com dados consistentes | P | Navegação de descoberta → match → chat → proposta inspecionada na prévia; roteiro pronto. Falta ensaio da equipe em celular com APK ou Expo Go. |

## Pendências para sair do demonstrativo

1. Completar o DER com cauções, avaliações e arbitragem; resultados e ranking compartilhados ainda não estão disponíveis. Equipes, match, chat e propostas entre contas já têm implementação e testes locais, mas dependem de publicação da API para distribuição conectada.
2. Backend hospedado com HTTPS e política de acesso por papel verificada no servidor.
3. Integrar cadastro/agenda de gestores de campos. O aceite adversário já é explícito e os conflitos das duas equipes e do local informado são verificados nos registros do app; isso não é reserva externa nem disponibilidade real do campo.
4. Recuperação de senha com e-mail e identidade Google, sem respostas simuladas de envio.
5. Gateway de caução com idempotência, webhook autenticado e conciliação; tarifas definidas pelo grupo.
6. Mapas/PostGIS e push. A atualização entre contas usa consulta a cada 8 s em primeiro plano, retomada e atualização manual; WebSocket/Redis e entrega em segundo plano permanecem pendentes.
7. Moderação de denúncias, retenção/exclusão e habilitação profissional da arbitragem.
8. Gerar novo APK com as alterações desta revisão e API configurada; instalar no aparelho, homologar navegação/teclado/acessibilidade e realizar ensaio completo. O APK da etapa anterior não comprova essas verificações.

Não somar itens A do PDF com os do código para alegar percentual de software em produção. O relatório original de 0/50 é uma lista de itens pendentes naquele levantamento, e não prova de ausência de todo o conteúdo documental.
