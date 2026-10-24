# Belém Studio — primeira etapa funcional

Painel Next.js/TypeScript e backend Node 24. O frontend aprovado na raiz e os dois MP3 permanecem intactos. A integração ocorre por renderização do template e um adaptador de comportamento, somente na aplicação local. O GitHub Pages publicado não foi alterado.

## Executar a demonstração

A partir da raiz do repositório:

```bash
npm --cache /tmp/belem-npm --prefix apps/studio ci --no-audit --no-fund
npm --prefix apps/studio run demo
npm --prefix apps/studio run build
npm --prefix apps/studio start
```

Node 24 é obrigatório (`node:sqlite`). Para desenvolvimento com atualização automática, use `npm --prefix apps/studio run dev` em lugar de `build/start`. Não execute dois servidores na mesma porta.

O servidor abre a porta **3000**; a rota do painel é **`/admin`**. Abra essa porta no navegador/encaminhamento local do seu ambiente. Não há URL pública de implantação nesta entrega.

O seed cria dois estúdios e famílias inteiramente fictícios, com imagens geométricas. Credenciais aleatórias são gravadas em **`/workspace/.belem-runtime/demo-access.json`**, com permissão restrita. Consulte esse arquivo PRIVADAMENTE no ambiente; use a primeira conta para o Estúdio Lilian Cristina e a segunda para conferir a separação. Não publicar esse arquivo ou seus valores. Não existe senha padrão no código, botão de bypass ou cadastro público de administradoras.

O seed preserva bancos existentes e não reseta senhas/dados ao repetir o comando. A senha pode ser alterada em “Meu estúdio”. A saída do comando informa o caminho do arquivo de acesso, sem imprimir a senha.

### Configuração local

`apps/studio/.env.example` contém apenas configurações não secretas. Opcionalmente copie para `.env.local` (ignorado pelo Git) antes de usar os comandos. `demo`, `create-studio` e Next carregam esse arquivo. Os testes unitários sempre usam diretório temporário isolado.

- `APP_ORIGIN`: origem exata usada no navegador. Padrão `http://localhost:3000`. Se houver encaminhamento HTTPS por outro host, configurar a origem correspondente e reiniciar; isso é necessário para CSRF, cookies Secure e links. Não aceitar qualquer origem como solução.
- `BELEM_DATA_DIR`: diretório privado PERSISTENTE fora de qualquer pasta pública. Padrão `/workspace/.belem-runtime`. Em outra máquina, definir um caminho absoluto disponível. Nunca apontar para `public`, `_site` ou pasta publicada.
- `BELEM_REPOSITORY_DIR`: opcional, caminho do checkout que contém o template aprovado se o servidor não for iniciado dentro dele.
- `NEXT_TELEMETRY_DISABLED=1`: recomendado no ambiente local.

Não é necessária chave Supabase, IA, pagamento ou e-mail para esta demonstração. Não configure credenciais de produção para testar.

## Percurso de teste pelo painel

1. Entre com uma das contas fictícias e abra **Ensaios e galerias**.
2. Crie um ensaio em rascunho; cliente e pacote podem ser associados depois da revisão.
3. Envie fotografias ARTIFICIAIS em JPEG, PNG ou WebP. Há prévias no ensaio demonstrativo já criado.
4. Marque cartões, amplie as prévias e use **Aprovar**, **Não publicar** ou **Revisar depois**.
5. Em **Clientes e famílias**, cadastre/edite uma família e uma cliente. Em **Pacotes**, defina quantidade e preço de adicional de TESTE.
6. Associe cliente/pacote em **Dados do ensaio** e use **Publicar galeria**. Isso publica apenas no backend local; não executa GitHub Actions nem altera o site atual.
7. Abra o link individual em outro navegador/contexto. Somente aprovadas aparecem. Escolha fotografias e aguarde “Escolhas salvas”.
8. Feche/reabra o navegador pelo mesmo link: as escolhas são recuperadas do banco, inclusive sem localStorage.
9. No painel, abra o ensaio e use “Atualizar escolhas da cliente”; veja o contador e o filtro de escolhidas.
10. Revogue o link para impedir novos acessos. Republicar renova o segredo, revoga sessões antigas e preserva escolhas de fotos ainda aprovadas.

Retirar aprovação de uma foto já publicada revoga a galeria inteira, por segurança, até nova publicação. Alterar um ensaio publicado exige revogar o link antes. Editar um pacote não modifica contratos já associados: a quantidade/preço são snapshots do ensaio.

## O que funciona

- Login com scrypt e salt, sessão opaca revogável, cookie HttpOnly/SameSite, limite persistente de tentativas e validação de origem para escritas.
- Cadastro/edição de famílias, clientes, pacotes e ensaios. Quantidades e dinheiro validados, em centavos.
- Upload e conservação dos bytes originais; nomes e SHA-256 registrados; prévias JPEG orientadas e sem metadados de GPS.
- Revisão humana e estrutura de dados para futuras sugestões de IA, sem execução nem cobrança de IA.
- Publicação só de aprovadas, link individual com alta entropia, expiração em 30 dias e revogação. Segredo armazenado como hash e cópia cifrada para a proprietária recuperar o link.
- Sessão de família limitada à galeria por até sete dias, sem acesso administrativo ou aos originais.
- Seleção por ID estável, persistida no servidor, com revisão para detectar conflitos entre abas/dispositivos e feedback de erro/salvamento.
- Backend delimitado por estúdio e família; chaves estrangeiras compostas impedem vínculos cruzados. Testes exercitam acessos indevidos reais por HTTP.

O painel oferece login e dados protegidos por API; o shell de login em si pode ser servido publicamente, sem dados privados embutidos. Originais não possuem rota pública nem endpoint de download nesta etapa.

## Persistência e limites desta entrega

O adaptador local usa **SQLite em disco e objetos privados no filesystem**, não Supabase conectado. Esse é um backend funcional para demonstração em um servidor, não uma garantia de infraestrutura de produção multi-instância, HA, RLS PostgreSQL ou backup automático.

Fechar o navegador e reiniciar o processo não apaga o banco/arquivos; excluir ou perder o disco apaga os dados. Para backup/restauração, preservar banco de forma consistente, objetos E `link-encryption.key`. Não copiar só o arquivo SQLite enquanto houver escritas em WAL; usar backup SQLite apropriado ou parar o serviço. Não há rotina de backup remoto contratada.

Limites locais: 20 MB por fotografia; JPEG, PNG ou WebP estático; 80 megapixels; até 10 por envio e 64 MiB no corpo multipart inteiro; 2 GiB/5.000 fotos por estúdio. RAW/HEIC/TIFF, processamento em worker, upload retomável e varredura antimalware dedicada ainda não estão implementados. Arquivos ativos como SVG são rejeitados no upload.

O servidor precisa de HTTPS e domínio/origem corretos antes de uso externo. Recuperação de senha por e-mail, MFA e convite de equipe dependem da próxima camada de autenticação/provedor. Nenhum endpoint público cria novas contas de estúdio. Para provisionamento local controlado, sem assinatura:

```bash
npm --prefix apps/studio run create-studio -- --name "Estúdio fictício C" --email "admin-c@example.invalid"
```

A nova credencial fica em um arquivo privado separado no diretório de dados. Não há coleta de cartão, criação de assinatura ou cobrança.

## Etapas futuras / serviços externos

Supabase/PostgreSQL com políticas RLS e storage remoto privado, hospedagem persistente HTTPS, backups e autenticação gerenciada precisam ser configurados/homologados antes de produção. Nenhum serviço foi contratado ou conectado por suposição.

IA, loja conectada, cálculo de pedido, checkout, e-mails e ZIP dos originais ficam para as próximas etapas. O frontend mantém seus avisos demonstrativos da loja; a tela final da galeria conectada confirma SOMENTE a seleção de fotografias, nunca pedido ou pagamento. Nenhum original deve ser fornecido à cliente por meio dessa demonstração.

O vídeo de abertura não foi fornecido/integrado; a abertura visual aprovada foi preservada. Não foi usado o vídeo da campanha por suposição.

## Testes executáveis

```bash
npm --prefix apps/studio run typecheck
npm --prefix apps/studio test
npm --prefix apps/studio run build
node .github/scripts/gallery-smoke.mjs
```

O teste Node usa banco/diretório temporários e 17 cenários reais do domínio, autenticação, upload, seleção e isolamento. Não usa dados/segredos externos.

A suíte Python/Playwright exige Python com `playwright` e `Pillow` e Chromium (disponíveis no ambiente de onboarding). Ela DEVE usar outro diretório sem dados reais. Exemplo em terminais separados:

```bash
BELEM_DATA_DIR=/tmp/belem-stage-one-e2e npm --prefix apps/studio run demo
```

Dentro de `apps/studio`, iniciar a aplicação de teste na porta 3200:

```bash
BELEM_DATA_DIR=/tmp/belem-stage-one-e2e APP_ORIGIN=http://localhost:3200 NEXT_TELEMETRY_DISABLED=1 npx next start --hostname 127.0.0.1 --port 3200
```

Na raiz do checkout:

```bash
BELEM_E2E_ORIGIN=http://localhost:3200 BELEM_E2E_ACCESS=/tmp/belem-stage-one-e2e/demo-access.json python3 apps/studio/tests/browser.py
```

Nove cenários abrangem cadastros via UI, upload/revisão, publicação, seleção em novo contexto sem localStorage, APIs/isolamento, revogação, CSRF, logout, áudio, histórico, contratos, troca de senha/revogação de sessões e quatro viewports. A suíte inclui casos negativos que devem retornar 400/401/403/404/409. Isso não é homologação Safari/iOS nem auditoria independente de produção.

## Proteção da publicação existente

`index.html`, MP3 e smoke test raiz continuam iguais. O workflow foi restringido a copiar/publicar SOMENTE os três ativos estáticos aprovados em `_site`, evitando que um futuro merge exponha backend, documentos ou testes como arquivos do GitHub Pages. O workflow não foi executado, e main não foi alterada.
