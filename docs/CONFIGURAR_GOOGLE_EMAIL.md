# Ativar Google e entrega de e-mail

O código 1.4.0 contém as integrações, mas elas não estão ativadas por configurações fictícias. Este roteiro não comprova cadastro de clientes Google, login nativo ou entrega de e-mail externo. Conforme a instrução atual, **não gerar APK nem iniciar autenticação EAS nesta etapa**.

## Google

1. No projeto Google do grupo, registrar um cliente OAuth **Web** para a audiência do ID token e um cliente **Android** para o aplicativo. Usar IDs reais do mesmo projeto; não criar valores de exemplo como se fossem credenciais válidas.
2. Cliente Android: pacote `com.futtech.desafioaceito`. O certificado verificado do APK 1.2.0 usa SHA-1 `61:F5:A3:31:65:0D:CE:77:DB:6B:5B:8D:3E:48:77:7C:58:37:66:65`. É um identificador público, não a chave privada. Se uma distribuição futura usar outra assinatura, atualizar o cadastro com o certificado correto.
3. Configurar `GOOGLE_WEB_CLIENT_ID` no servidor com o ID Web real. A API valida audiência, emissor, assinatura, validade e e-mail verificado com a biblioteca oficial. O ID é público; nenhum client secret entra no app. Sem ele, as capacidades Google permanecem desativadas.
4. Android usa o módulo nativo `@react-native-google-signin/google-signin` já incluído e autolinking; não exige Firebase ou arquivo `google-services.json` neste fluxo. Expo Go e renderer web são protegidos por indisponibilidade explícita: não substituem um build nativo com o módulo. iOS é opcional e recebe `GOOGLE_IOS_CLIENT_ID` real durante a configuração; `app.config.js` só adiciona seu plugin/URL scheme quando esse ID existe.
5. Depois da configuração e quando a geração de binário for autorizada em outra etapa, testar login numa instalação nativa assinada. No primeiro vínculo, confirmar a senha **do Desafio Aceito**; conta nova cria uma senha do app. Não informar senha Google no formulário. A API não vincula uma conta existente apenas por igualdade de e-mail.

Os testes verificaram tokens RSA assinados, expiração/audiência e a validação oficial, além do fluxo HTTP. Não houve login em conta Google externa por um celular. As identidades vinculadas preservam o `sub` do provedor, sem sobrescrever os dados de acesso da conta do aplicativo.

## E-mail

Configurar somente no ambiente privado do servidor: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM`. Usar remetente autorizado pelo provedor. Não inserir senha SMTP em `.env` móvel, README, APK ou repositório.

- Porta 465: `SMTP_SECURE=true`, TLS desde a conexão.
- Porta 587: `SMTP_SECURE=false`, com STARTTLS obrigatório no adaptador. Certificados são verificados; não desativar essa verificação.
- Links padrão: `PASSWORD_RESET_URL=desafioaceito://recuperar` e `EMAIL_CONFIRMATION_URL=desafioaceito://confirmar-email`.

Após configurar, verificar capacidades da API e executar recuperação/alteração para uma caixa controlada pelo grupo. Confirmar recebimento, token de uso único (20 minutos), expiração e revogação de sessões. Até essa evidência existir, não declarar envio externo funcionando.

O teste de transporte real usa um servidor SMTP **TLS local**, aceita o certificado de teste explicitamente confiável e rejeita certificado não confiável; não envia e-mail à internet. Para executar a suíte completa da API, instalar também o comando `openssl`, usado para gerar o certificado temporário desse teste. O teste não requer credenciais SMTP de produção.

Enquanto SMTP estiver indisponível, troca de senha e códigos de recuperação previamente guardados continuam disponíveis. Códigos precisam ser gerados dentro da conta antes de perder o acesso; são exibidos uma vez e não substituem retroativamente um e-mail que nunca foi entregue.
