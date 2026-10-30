# Ambiente persistente separado do site oficial

Estado: configuração preparada e validada; **não provisionada e não publicada**. Não existe ainda URL permanente. Não contratar servidor, configurar DNS, gerar certificado ou subir serviços sem confirmar a conta e o destino com a proprietária.

## Caminho de transição

1. Informar a hospedagem já contratada ou aprovar fornecedor e orçamento.
2. Reservar um endereço próprio para homologação do painel. Não alterar os registros do domínio/site oficial. Usar um servidor Linux com Docker Compose, disco persistente, portas 80/443 livres e DNS desse endereço apontando para ele. Serviços estáticos como GitHub Pages não executam este backend.
3. Publicar esta configuração somente nesse destino autorizado. O arquivo Compose usa a imagem da aplicação existente, HTTPS via Caddy e volume nomeado que preserva SQLite, produtos, escolhas, originais, prévias e chave de criptografia em reinícios e recriações do contêiner.
4. Criar a conta proprietária pela CLI privada. Validar login, cadastro de produto, imagem, escolha da cliente, persistência após reinício, backup e restauração em outro volume. Não usar convite fictício de três horas.
5. Antes de fotos ou dados reais: aprovar e implementar armazenamento definitivo de arquivos, backup externo/restauração e regras de retenção. A persistência do disco não protege contra perda do servidor, exclusão do volume ou conta suspensa.

A fase atual é uma instância única com SQLite. Não é a migração prevista para PostgreSQL e object storage privado, nem uma homologação para operação comercial. O servidor pode preservar cadastros enquanto se valida o produto; fotos pesadas e implantação multi-instância exigem a etapa seguinte. Os limites atuais de upload (JPEG/PNG/WebP, 20 MB) continuam valendo.

## Configuração para revisão

Copiar `.env.example` para `.env` privado e ajustar hostname e contato de certificado. Esses campos não são senhas. Não colocar senhas, chaves do Asaas ou credenciais de storage em arquivos versionados. Não preencher valores de exemplo como se fossem um domínio real.

Validação sem implantar:

```bash
docker compose --project-directory deployment/persistent -f deployment/persistent/compose.yml config --quiet
node --test deployment/persistent/entrypoint.test.mjs
sh -n deployment/persistent/backup.sh
```

O endpoint da aplicação não publica porta na máquina; só o proxy HTTPS recebe acesso externo. O volume deve ter monitoramento de espaço. **Não executar `docker compose down -v`**: remove os dados persistentes. Atualizações devem manter o mesmo projeto e volumes. Após troca de código, executar o conjunto de testes antes de atualizar o contêiner.

## Provisionamento de acesso

Depois de autorizar e iniciar o ambiente, executar no servidor:

```bash
docker compose --project-directory deployment/persistent -f deployment/persistent/compose.yml exec app npm run create-studio -- --name 'Estúdio Lilian Cristina' --email 'EMAIL_DA_PROPRIETARIA'
```

A CLI gera senha aleatória e grava arquivo `access-<studio>.json` com permissão 0600 no volume privado, sem imprimi-la no log. Entregar a credencial à proprietária por canal privado; ela deve trocar a senha no primeiro acesso. Não compartilhar a chave de criptografia, arquivos completos do banco ou backups como meio de acesso. O login não tem cadastro público.

## Backup e restauração

`backup.sh` pausa brevemente o aplicativo, copia todo o volume em arquivo privado e reinicia o aplicativo ao terminar, inclusive se o backup falhar. Rodar em janela de manutenção e somente no servidor destinado a este ambiente. É um backup frio para manter banco e arquivos coerentes. Não imprime conteúdo de arquivos.

```bash
sh deployment/persistent/backup.sh /CAMINHO_PRIVADO_EXISTENTE/belem-AAAA-MM-DD.tar.gz
```

O diretório de destino deve ser privado. **Esse arquivo contém dados sensíveis, originais e chave de criptografia**: não colocar em repositório, artefato público ou pasta servida pela web. Copiar para armazenamento externo com criptografia e controle de acesso após aprovar o provedor; o script não faz esse envio.

Restauração deve primeiro acontecer em servidor/volume isolado, com a aplicação parada. Extrair o volume completo preservando permissões, incluindo `link-encryption.key` e os arquivos SQLite/WAL. Iniciar a mesma versão, validar integridade do SQLite e conferir login, prévias, hashes dos originais, produtos, preços e escolhas. Nunca extrair por cima do volume ativo nem usar a galeria oficial nesse teste. Só substituir o destino após validação e autorização.

## Custos e pendências

Servidor, domínio/subdomínio se necessário, armazenamento de originais, tráfego, backup e processamento devem ser dimensionados e aprovados. Não prometer armazenamento pesado ilimitado gratuito. Checkout Asaas, IA e ZIP de entrega continuam separados; nada neste diretório gera cobranças ou publica o site oficial.
