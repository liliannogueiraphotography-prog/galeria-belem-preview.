# Prévia temporária de aceitação no iPhone

Alternativa ao túnel bloqueado no ambiente local: executar testes/servidor fictício em runner padrão Ubuntu do GitHub Actions do repositório público e expor somente esse servidor por túnel HTTPS temporário. Não é GitHub Pages, não altera main e não utiliza plano pago de hospedagem. A sessão dura no máximo três horas e o job tem limite de 185 minutos. Não é hospedagem permanente.

Referências verificadas:
- https://docs.github.com/en/billing/concepts/product-billing/github-actions — runners padrão gratuitos para repositórios públicos.
- https://docs.github.com/en/actions/reference/limits — máximo de seis horas por job; esta prévia usa no máximo três horas de sessão.

O workflow `.github/workflows/iphone-preview.yml` é acionado SOMENTE pela branch `preview/iphone-temporary`; não aciona o workflow de Pages que escuta main. Não usar esta abordagem para produção, disponibilizar serviço permanente ou dados reais.

## Acesso privado

O runner cria apenas contas/fotos fictícias. As senhas iniciais são aleatórias e ficam no filesystem privado do runner, sem logs ou commits. Um convite temporário de uso único permite que a proprietária defina sua própria senha via HTTPS.

O convite tem segredo de 256 bits. Só o hash fica no banco; o link usa fragmento, removido da barra de endereço antes do envio por POST. A página exige confirmação da senha e usa CSP com nonce. O endpoint está desabilitado por padrão e somente funciona com `BELEM_TEMPORARY_PREVIEW=1`, para contas fictícias @belem.test.

Os convites de teste e de usuária são cifrados com RSA-OAEP/SHA-256 e a chave pública em `deployment/preview-public.pem`. O resultado cifrado pode voltar pela branch sem publicar segredo utilizável. A chave privada está fora do checkout, em arquivo privado do ambiente de trabalho; não commitá-la, publicá-la ou incluí-la no container. Não registrar o link decifrado em logs públicos.

Não consumir o convite da usuária durante validação: existe um convite separado para a segunda conta de teste. Depois de definir a senha, a usuária pode entrar normalmente por /admin durante a validade da prévia.

## Dados e duração

SQLite e originais ficam no filesystem privado do runner e continuam salvos ao fechar/reabrir o navegador enquanto a sessão está ativa. Ao terminar o job, dados e links são descartados. Nada é transferido ao site oficial. Não há persistência de produção, backups externos, pagamentos, IA paga ou e-mails reais.

Antes de entregar qualquer endereço, verificar a URL HTTPS real externamente, login, proteção de cookie, cadastro, upload, aprovação/publicação e recuperação das escolhas. Um workflow iniciado não prova que a prévia está funcionando.
