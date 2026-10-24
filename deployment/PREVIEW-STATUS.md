# Prévia externa — bloqueada, sem URL publicada

A configuração de rede foi ativada pela proprietária e uma nova tentativa Cloudflare foi realizada. O DNS agora resolve, mas a conexão nativa HTTPS é recusada. Não repetir o mesmo comando sem alteração significativa da infraestrutura.

Nenhuma ferramenta de hospedagem/preview está conectada e não há credenciais Render/Supabase disponíveis no ambiente. Não extrair autenticação do proxy GitHub nem cadastrar contas de terceiros em nome da proprietária por suposição.

## Alternativas verificadas na documentação oficial

- Render gratuito executa backend, mas suspende após 15 minutos de inatividade e perde alterações de filesystem (SQLite e imagens) ao suspender/reiniciar/reimplantar. Não atende sozinho aos testes de persistência. https://render.com/docs/free
- A documentação atual de Spaces informa que criar compute Docker/Gradio exige plano pago; CPU Basic sem custo horário não significa direito de criar Docker sem plano. Não contratar. https://huggingface.co/docs/hub/spaces-overview
- Proposta para testes com persistência: serviço Render no plano gratuito e projeto Supabase exclusivo de testes para banco e armazenamento. Precisa de contas conectadas e de implementação/homologação do adaptador remoto. Não afirmar que esse adaptador já está pronto.

A hospedagem, quotas e eventuais exigências de cartão devem ser conferidas na conta antes de criar recursos. Recusar qualquer operação paga ou upgrade automático. Nenhuma assinatura foi criada e nenhum código foi enviado a serviço externo.

## Pacote preparado

`deployment/Dockerfile` mantém o frontend original intacto, usa Node 24, não executa como root e exclui credenciais/SQLite/uploads do contexto pelo `.dockerignore`. O entrypoint exige uma origem HTTPS exata antes de iniciar. A imagem não inclui conta/senha padrão nem cria contas públicas automaticamente.

Este pacote ainda usa o adaptador SQLite existente. Um host com volume privado persistente pode executá-lo; isso NÃO implica que o Render gratuito ofereça tal volume. Nenhum Blueprint com disco pago foi criado.

Antes de entregar o link: provisionar apenas dados fictícios, conectar armazenamento privado adequado, definir APP_ORIGIN, provisionar conta fictícia fora do código, entregar acesso por canal privado/convite temporário e verificar de fora do ambiente o fluxo completo no HTTPS real. A credencial privada local não deve ser exposta como arquivo de download público.

A entrega permanece pendente. O Dockerfile e o servidor local não são um endereço acessível no iPhone.
