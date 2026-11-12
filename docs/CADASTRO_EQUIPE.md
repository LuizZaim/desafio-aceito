# Cadastro da própria equipe — escopo da versão

Esta evolução atende ao RF04: criar a própria equipe, em vez de apenas editar o perfil fictício da demonstração. O cadastro da equipe é separado da criação de uma conta de organizador.

## Critérios de aceite

| Cenário | Resultado esperado |
|---|---|
| Primeiro acesso para criar equipe | Formulário sem o nome e a descrição da FutTech FC; sem matches ou partidas já pertencentes ao usuário. |
| Nome, bairro ou cidade ausentes/inválidos | Cadastro recusado com mensagem compreensível; dados preenchidos continuam disponíveis para correção. |
| Categoria, nível ou UF fora das opções | Cadastro recusado pelo domínio e pela API, mesmo que a interface seja contornada. |
| Formulário válido | Equipe salva; usuário recebe confirmação e pode seguir para o aplicativo. |
| Toques repetidos durante gravação | Operação fica bloqueada enquanto há salvamento em andamento. |
| Fechar e reabrir | Dados salvos continuam disponíveis no mesmo aparelho; contas online recuperam o estado da própria conta. |
| Editar depois do cadastro | Alteração preserva a identidade e o restante do estado da equipe. |
| Tentar interagir sem cadastrar equipe | Interesse e agendamento são bloqueados até concluir o cadastro. |
| Duas contas online | Os dados de uma equipe não substituem nem aparecem como equipe própria da outra conta. |
| Explorar demonstração | Os dados fictícios continuam identificados e separados do cadastro da própria equipe. |
| Falha de gravação ou rede | Sem confirmação de sucesso; usuário pode corrigir ou tentar novamente. |

## Limites do produto

Salvar um time no aparelho não cria uma conta autenticada, não publica a equipe para outras pessoas e não sincroniza outro celular. Contas online dependem de uma API configurada e acessível. Mesmo com a API, esta versão ainda usa adversários fictícios e não permite conversa ou negociação entre duas contas reais.

O ZIP contém o projeto mobile. Ele não substitui um APK assinado e instalado. Publicação da API, geração e instalação do APK, teste físico, equipes públicas, localização real, notificações externas e pagamentos reais seguem como etapas separadas.

## Roteiro de homologação

1. Na tela inicial, toque em **Cadastrar ou abrir meu time neste aparelho**. Na tela **Cadastre seu time.** (`/editar`), preencha o nome e deixe o bairro vazio. Confirme que o salvamento é recusado.
2. Preencha o bairro e a cidade, escolha a UF, a categoria e o nível, adicione uma descrição opcional e salve.
3. Após a confirmação **Seu time está cadastrado!**, toque em **Ver minha equipe** e verifique o nome e os demais campos no perfil. Não devem existir matches ou partidas antigas atribuídas à nova equipe.
4. Feche e reabra o app; retome a própria equipe e confirme os campos salvos.
5. Edite a descrição, salve e confirme a alteração após reabrir.
6. Entre na demonstração e confirme que ela mantém a equipe fictícia separada.
7. Se a API estiver configurada, repita com duas contas diferentes e confirme o isolamento.

A lista acima é um roteiro de aceite. Não é uma afirmação de que todas as etapas foram executadas em um aparelho Android; as evidências de execução estão em `VALIDACAO.md`.
