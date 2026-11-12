# Validação contra a auditoria de 11/11/2026

Escopo: documento técnico fornecido + código desta entrega mobile. Os itens marcados como atendidos **no PDF** não são evidência de código. A validação abaixo é uma conferência técnica, não uma nota acadêmica ou certificação. Não houve acesso autenticado ao Figma, Miro ou Stitch.

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
| 32 | Loading, sucesso, erro e vazio | A no MVP | Provider, Busy/Empty, estados de formulário, alertas nativos e regras de negócio. |
| 33 | Validação e máscaras | A no MVP | E-mail, senhas, cadastro próprio da equipe (nome, bairro, cidade, UF, categoria e nível), notas, data DD/MM/AAAA e hora HH:MM; validação de domínio e API. |
| 34 | Separação MVC | A no MVP | View: componentes RN; Controller: `api/src/app.ts`; Model/Service: `api/src/service.ts`, domínio e banco. |
| 35 | API com status semânticos | A no MVP | 200/201/204/400/401/409; limita tentativas com 429 e trata erros inesperados. Suíte HTTP local. |
| 36 | Erros seguros | A no MVP | Filtro global sem stack trace; mensagens de domínio controladas. |
| 37 | Variáveis isoladas | A no MVP | `.env.example`, `api/.env.example`, `.gitignore` e ambiente no servidor; somente URL pública no bundle. |
| 38 | Tabelas rigorosamente iguais ao DER | F | Runtime usa SQLite/JSON local e usuários/sessões/workspaces JSONB na API. Faltam EQUIPE, MATCH, MENSAGEM, PARTIDA, CAMPO, CAUCAO, AVALIACAO e PARTIDA_ARBITRO normalizados. |
| 39 | PK/FK e integridade | P | PK/UNIQUE/FK em usuários, sessões e workspaces; versão não negativa. Integridades do DER completo continuam pendentes. |
| 40 | SQL protegido | A no MVP | Queries com placeholders no pg/SQLite; teste de tentativa de SQL injection no login. |
| 41 | Migração e dados de teste | A no MVP | `api/migrations/001_initial.sql`; `initialState()` cria a demonstração fictícia; `freshState()` inicia cadastros próprios sem equipe, matches ou partidas; migração testada em PGlite. |
| 42 | Git e .gitignore | A local | Repositório inicializado; dependências, `.env`, builds e chaves excluídos. |
| 43 | Commits e branches | A local | Histórico do projeto e branches de implementação/validação no bundle Git incluído. Remoto ainda não publicado. |
| 44 | README e setup | A | Instruções de celular, API, Docker, testes e geração de APK. Bundle Git permite clonar sem remoto. |
| 45 | Deploy funcional em nuvem | F | Código e perfis EAS preparados. API e binário mobile não publicados. Não foi entregue um site como substituto do app. |
| 46 | SSL e HTTPS obrigatório | F | Exige hospedagem da API e validação do certificado/redirecionamento. O servidor local de desenvolvimento não atende este item. |
| 47 | SPA e reload de rotas | N/A / P | O app usa navegação nativa e scheme `desafioaceito`. Links profundos precisam ser homologados no binário; critério SPA aplica-se ao renderer web opcional. |
| 48 | Testes de fluxo e exceção | A no escopo automatizado | Testes de domínio + integração HTTP/banco. Testes de aparelho, carga e integrações reais permanecem pendentes. |
| 49 | Revisão e domínio do código gerado | P | Revisão de regras, erros, isolamento e build realizada; o domínio dos integrantes deve ser demonstrado por cada um na apresentação. |
| 50 | Ensaio geral com dados consistentes | P | Navegação de descoberta → match → chat → proposta inspecionada na prévia; roteiro pronto. Falta ensaio da equipe em celular com APK ou Expo Go. |

## Pendências para sair do demonstrativo

1. Modelo relacional completo do DER e interação real entre duas contas de organizadores.
2. Backend hospedado com HTTPS e política de acesso por papel verificada no servidor.
3. Propostas com aceite explícito adversário e consulta real à disponibilidade dos campos.
4. Recuperação de senha com e-mail e identidade Google, sem respostas simuladas de envio.
5. Gateway de caução com idempotência, webhook autenticado e conciliação; tarifas definidas pelo grupo.
6. Mapas/PostGIS, push e comunicação entre dispositivos; WebSocket/Redis conforme necessidade.
7. Moderação de denúncias, retenção/exclusão e habilitação profissional da arbitragem.
8. Build Android assinado, instalação no aparelho, homologação de navegação/teclado/acessibilidade e ensaio completo.

Não somar itens A do PDF com os do código para alegar percentual de software em produção. O relatório original de 0/50 é uma lista de itens pendentes naquele levantamento, e não prova de ausência de todo o conteúdo documental.
