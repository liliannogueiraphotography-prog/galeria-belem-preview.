# 1. Diagnóstico e reaproveitamento

## Frontend aprovado

Repositório confirmado: `liliannogueiraphotography-prog/galeria-belem-preview.`. O ponto final pertence ao nome. Produção automática: `main`, conforme `.github/workflows/pages.yml`. A implementação está em `index.html`, com CSS/JavaScript embutidos e dois MP3.

| Recurso | Estado observado | Reaproveitamento |
|---|---|---|
| Identidade visual, abertura e estrela | Implementados | Preservar composição, cores, fontes e componentes aprovados. |
| Vídeo de abertura | Ausente; abertura atual usa animação, fotos e áudio | Acrescentar suporte apenas após aprovação do arquivo e da inserção no fluxo, sem substituir a abertura aprovada por suposição. |
| Apresentação | Implementada; seis fotos de demonstração, 3 s por slide, áudio e controles | Corrigir defeitos e alimentar com prévias aprovadas da sessão. |
| Seleção e contadores | Implementados | Preservar controles; adicionar IDs estáveis e informação do pacote. |
| Filtros e ampliação | Implementados | Corrigir foco, semântica e recuperação de falhas. |
| Persistência | Somente memória/localStorage | Reutilizar como rascunho auxiliar; confirmação definitiva no servidor. |
| Loja | Demonstração: álbum, impressas e quadro | Conectar catálogo administrável; acrescentar produtos previstos mantendo o padrão visual. |
| Revisão | Implementada depois da loja | Reutilizar componentes para revisar fotos também antes da loja, conforme jornada obrigatória. |
| Checkout e pagamento | Ausentes | Implementar backend, totais e sandbox após definição do provedor. |
| Conclusão | Demonstrativa; avisa que nada é enviado | Substituir a lógica por confirmação real somente após contrato transacional testado. |
| Upload, IA, painel e ZIP | Ausentes neste checkout | Novos módulos propostos nesta arquitetura. |

A auditoria anterior executou 31 cenários de navegador, com SVGs fictícios, além de smoke test e HTTP. Fluxo normal validado em Chromium, inclusive toque em cinco viewports; não certifica Safari ou aparelhos físicos. Esses testes pertencem ao commit-base. Nesta etapa documental foi executado novamente apenas o smoke test existente, que passou; não é alegação de que os defeitos foram corrigidos.

## Treze problemas que entram no backlog

| ID | Problema confirmado | Prioridade |
|---|---|---|
| A01 | Links diretos deixam telas vazias ou apresentação presa | Antes da integração |
| A02 | Falha de gravação local perde escolhas sem aviso | Antes da integração |
| A03 | Fotos fornecidas sem ID desativam persistência | Contrato de dados |
| A04 | Reordenação troca a identidade da fotografia selecionada | Contrato de dados |
| A05 | URL concatenada em innerHTML permite injeção, se a origem futura não for confiável | Antes de aceitar dados externos |
| A06 | Foto relativa de carregamento lento pode não aparecer no slide | Antes de conectar storage |
| A07 | Duas abas sobrescrevem escolhas | Persistência versionada |
| A08 | Modal/foco e estados de seleção não são acessíveis adequadamente | Regressão de frontend |
| A09 | Falhas de mídia não oferecem recuperação clara | Regressão de frontend |
| A10 | Movimento reduzido respeitado parcialmente | Regressão de frontend |
| A11 | Histórico/reload não preserva a etapa | Junto de A01 |
| A12 | Voltar reativa áudio que foi pausado pela usuária | Regressão de frontend |
| A13 | Coerção de tipos no estado local cria escolhas indevidas | Validação e migração |

Os resultados brutos e o relatório detalhado anterior permanecem em `/workspace/belem-audit/`. Não são testes de backend: o backend ainda não foi construído.

## Banco e armazenamento que podemos aproveitar

**Nenhum recurso de banco/storage da galeria foi confirmado como disponível.** A configuração do ambiente não declara conexões/segredos e não foram encontradas variáveis relevantes de banco/IA/pagamento por inspeção de nomes. Nenhum valor secreto foi lido ou exibido e nenhum banco foi acessado. Ausência dessas evidências não prova que a proprietária não tenha uma conta ou projeto em outro ambiente.

| Recurso encontrado | Evidência | Decisão proposta |
|---|---|---|
| GitHub e frontend | Checkout existente; autenticação de leitura funciona | Reutilizar repositório e histórico. Não solicitar PAT por ausência de variável de token. |
| `belem-siga-a-estrela.-` | Snapshot público `6482e714bcae9707be9b26c5aa76860b2c042a02` | Projeto de campanha/cupons. Não converter em painel da galeria. |
| SQL Supabase da campanha | Tabelas e função de prêmios; instrução expressa de banco exclusivo da campanha | Reaproveitar aprendizado, não banco/tabelas de campanha como dados fotográficos. Aplicação dessas migrations não foi confirmada. |
| `Cerebro-Lilian` | README/package.json: React/Vite, Netlify Functions, Supabase para memória e agentes | Outro domínio de dados. Não usar seu banco para clientes/originais da galeria por inferência. |
| Lovable/checkout de reservas | Referências a `m-master-view.lovable.app` e `natal.estudioliliancristina.com.br` no projeto de campanha | Não há integração encontrada com a galeria. Investigar reaproveitamento do provedor de pagamento se houver documentação e sandbox, sem reaproveitar credenciais por suposição. |
| Fotografias e músicas do frontend | JPEGs demonstrativos embutidos e dois MP3 | Preservar ativos aprovados. Não são storage de originais nem acervo de teste. |

Acesso direto aos aplicativos externos esteve bloqueado pelo proxy na investigação anterior. Não há autorização para consultar clientes/pedidos reais para verificar integração. A confirmação atual de que o painel será novo elimina essa dependência para projetar sua arquitetura.

**Recomendação:** aproveitar eventual organização/conta Supabase da proprietária, caso exista e seja confirmada, mas usar projeto lógico próprio da Galeria Belém com desenvolvimento separado de produção. A separação multiestúdio ocorre dentro desse produto, por tenant e políticas; campanha e memória pessoal permanecem fora dele. A seleção/contratação do recurso depende de aprovação.
