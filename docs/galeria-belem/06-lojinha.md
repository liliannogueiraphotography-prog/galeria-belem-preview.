# Lojinha do estúdio — catálogo e carrinho

Implementação em `feat/studio-shop`, sem publicação no site oficial ou integração de cobrança.

## Disponível

- Painel: Lojinha → cadastro/edição de nome, descrição, categoria, preço em centavos e produto ativo/rascunho.
- Categorias: caneca, álbum, quadro, camiseta, ímã, todos os arquivos digitais e outros.
- Imagem opcional privada: JPEG/PNG/WebP estático até 5 MB e 40 megapixels; normalizada para JPEG, até 1200 pixels, sem metadados. Até 200 produtos por estúdio nesta etapa.
- Frontend: catálogo apenas do estúdio da galeria, produtos ativos, quantidades, remoção, imagem e preço.
- Carrinho persistido no servidor por galeria, com revisão otimista para impedir sobrescrita entre abas.
- Revisão: subtotal dos produtos, fotos extras além do pacote contratado e total estimado calculados no servidor.
- Todos os arquivos digitais é uma unidade por galeria e substitui o valor de fotos extras na estimativa. Não libera originais nem constitui licença/download nesta etapa.
- Produto desativado no carrinho é marcado como indisponível e pode ser removido pela cliente.
- Preços atuais são reconsultados na revisão. Ainda não há pedido, frete, estoque, variantes, prazo de entrega ou pagamento. Nenhum valor representa confirmação de cobrança.
- Seleção das fotografias continua independente, persistida e visível no filtro “Escolhidas pela cliente” no painel.

## Próximas etapas

1. Pedido com itens e preços congelados, vínculo à versão da seleção, dados de entrega, regras de frete e conferência de valores.
2. Asaas sandbox: segredo apenas no backend, criação idempotente, verificação da origem de webhooks e reconciliação de valor, beneficiário e status. Separar total do pedido e valor efetivamente recebido. Produção e cobranças reais exigem autorização.
3. Área de pedidos e recebimentos no painel. Download em ZIP dos originais selecionados, com autenticação e autorização do estúdio, em fluxo separado de pagamento.
4. Armazenamento e banco definitivos, backups e migração antes de qualquer acervo real.

## Arquivos e custos

A demonstração usa SQLite e arquivos privados no disco temporário do processo. Reiniciar o runner descarta a demonstração. Não é armazenamento definitivo.

Arquitetura prevista: PostgreSQL para metadados, escolhas e pedidos; object storage privado (por exemplo Cloudflare R2 ou Supabase Storage) para bytes dos originais e prévias. Chaves segregadas por estúdio/ensaio/foto, autorização por estúdio no servidor, sem URLs públicas dos originais. Prever upload direto assinado/multipart e processamento em fila para grandes lotes, cotas e política de retenção. A implementação atual aceita originais JPEG/PNG/WebP de até 20 MB; RAW/HEIC e arquivos maiores ainda não são suportados.

Exemplo de dimensionamento, sem estimativa de tarifa: 100 ensaios × 200 imagens × 25 MB = aproximadamente 500 GB de originais; prévias e backups são adicionais. Custos dependem de capacidade, retenção, tráfego/download e processamento. Escolha de fornecedor, limite e orçamento ainda precisam de aprovação; nenhum serviço foi contratado.

## Captura de tela

Navegadores não garantem bloqueio de screenshot, gravação de tela ou câmera externa. Não apresentar bloqueio de atalhos/contextmenu como proteção efetiva. Usar prévias reduzidas e marca-d'água gravada nos pixels, além de não expor originais. A marca atual é visual no frontend, não é uma marca gravada no arquivo; proteção adicional está pendente. Controles privados e expiração de link reduzem acesso indevido, sem promessa de impedir cópias.

## Validação

`npm test`: testes anteriores e cinco testes de catálogo, isolamento, revisão concorrente, preços, arquivos digitais, revogação e imagens.

`npm run build` e `npm run typecheck`.

`tests/shop_browser.py`: iniciar um servidor sobre uma pasta recém-criada com `npm run demo`, configurar `BELEM_SHOP_ORIGIN` e `BELEM_SHOP_ACCESS`, rodar Python com Playwright e Pillow. Valida cadastro real pela interface, upload artificial, catálogo responsivo em 320/390/768/1440, carrinho com quantidade, revisão, persistência em novo navegador, acesso anônimo, isolamento e retirada de produto indisponível.

`tests/browser.py`: regressão dos fluxos anteriores, apenas dados fictícios.
