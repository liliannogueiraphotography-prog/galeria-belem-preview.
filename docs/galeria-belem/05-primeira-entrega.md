# Primeira entrega implementada — ambiente local

A arquitetura e a sequência foram aprovadas pela proprietária. O novo painel/backend está em `apps/studio`, na branch `feat/galeria-studio-stage-one`, derivada da branch de planejamento. Nenhuma alteração foi publicada ou mesclada em main.

## Entregue

- Painel responsivo com login, visão geral, ensaios/galerias, clientes/famílias, pacotes e configurações/senha.
- Cadastros editáveis, upload privado de originais com hash/nome, prévias e revisão manual.
- Publicação de aprovadas com link individual e revogação; vínculo com cliente e pacote obrigatório.
- Integração com o template frontend existente, mantendo seu arquivo, CSS e ativos aprovados intactos. Ajustes de comportamento são aplicados pelo adaptador somente no servidor local.
- Seleção persistente no servidor por IDs e revisão concorrente; recuperação em outro navegador; contador/filtro no painel.
- Autorização por estúdio e galeria; chaves compostas; duas contas de estúdios e imagens fictícias na demonstração.
- Estrutura de tabelas para curadoria futura; nenhuma IA, compra ou assinatura ativada.

## Implementação local versus arquitetura de produção

Sem uma conta Supabase/storage aprovada e configurada, a demonstração usa adaptador SQLite + objetos privados em disco. Não existe integração Supabase/RLS PostgreSQL entregue ou testada. O isolamento atual é realizado nas APIs e por chaves estrangeiras compostas no banco local; não afirmar que isso homologa uma implantação SaaS de produção.

Login local usa scrypt, salt, sessões opacas, expiração/revogação, cookies HttpOnly/SameSite e Secure quando APP_ORIGIN é HTTPS, validação Origin/CSRF e limites de tentativas. MFA, recuperação por e-mail e convites não fazem parte desta entrega; homologação de autenticação gerenciada permanece pendente.

IA externa, storage remoto, backups, hospedagem HTTPS, loja/checkout/e-mail e ZIP continuam nas próximas etapas. Não foi contratado serviço, enviado e-mail real nem efetuado pagamento. O frontend conectado registra escolhas, não pedido.

## Evidência e como testar

Siga [apps/studio/README.md](../../apps/studio/README.md). O painel usa a porta 3000 e a rota `/admin`; credenciais geradas ficam em arquivo privado no diretório de dados, nunca no código.

Os testes Node cobrem a lógica e SQLite em diretório temporário. Os testes Playwright usam outra base exclusivamente fictícia, exercitando endpoints reais e ações no navegador. Compilação/typecheck e smoke test do frontend compõem a verificação. Relatórios e capturas locais estão em `/workspace/belem-audit/stage-one/`.

A publicação do GitHub Pages foi protegida para incluir apenas os ativos estáticos aprovados; não disparar esse workflow. Nada nesta entrega autoriza publicação de produção ou contratação futura.
