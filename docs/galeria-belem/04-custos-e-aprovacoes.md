# 4. Custos externos e decisões para aprovação

## Definições já recebidas

Plano básico-alvo: **R$ 39,90 mensais por estúdio**. IA premium e armazenamento serão adicionais pagos. Não implementar cobrança de assinatura agora. Não contratar serviços nem usar dados reais. Nenhum preço de foto extra, produto, IA ou armazenamento foi definido nesta proposta.

## Custos a considerar

| Categoria | Unidade de custo | Proposta inicial / aprovação necessária |
|---|---|---|
| Banco/auth | Plano, compute, GB, backups, usuários e ambientes | Supabase é recomendação; confirmar conta/projeto, plano e teto. |
| Storage | GB-mês de originais/prévias/ZIPs/backups | Privado; definir franquia, retenção, preço adicional e teto. |
| Tráfego | GB de download/egress e operações | Medir; ZIP pode gerar leitura e transferência dos mesmos dados. Não presumir grátis. |
| Hosting/backend | Requests, CPU/memória, instâncias e logs | Host Node/Next.js a aprovar, incluindo homologação e exigência de plano comercial. |
| Worker | CPU/tempo, memória, fila, RAW e ZIP | Limites de arquivos e capacidade a aprovar. |
| IA premium | Imagens/tokens, modelo, retries e retenção | Só prévias, quotas rígidas e orçamento aprovado por lote. |
| E-mail | Mensagens/mês e domínio de envio | Resend é candidato; sandbox primeiro; confirmar domínio/provedor/teto. |
| Pagamentos dos pedidos | Pix/cartão, antecipação, estorno/disputa e contas conectadas | Investigar provedor existente; aprovar recebedor, taxas e liberação. |
| Domínio/monitoramento | Domínio, logs, métricas e alertas | Reutilizar domínio se aprovado; definir retenção. |
| Operação | Suporte, backups/restauração e conformidade | Definir política e responsável; não ativar serviço automaticamente. |

**Não há cotação atual verificada nesta entrega.** As páginas oficiais de preços abaixo retornaram bloqueio de proxy `403 Forbidden`. Não substituí isso por números de memória, não contratei e não alterei rede apenas para cotar. Antes de qualquer gasto, confirmar limites, preço vigente, moeda, impostos e condições comerciais:

- https://supabase.com/pricing
- https://resend.com/pricing
- https://openai.com/api/pricing/
- https://developers.cloudflare.com/r2/pricing/

Cloudflare R2 é alternativa a comparar se volume/egress justificar, não segundo storage já escolhido. Preços em dólar exigem câmbio efetivo e impostos, não paridade fixa. Eventual plano gratuito deve ser verificado quanto a limites, retenção e adequação de produção, sem prometer custo zero.

## Dimensionamento ilustrativo, não cotação

Exemplo ARBITRÁRIO: 20 sessões/mês × 200 fotos × 25 MB/original = cerca de **100 GB de novos originais/mês/estúdio** em unidades decimais. Retenção de 90 dias significa aproximadamente 300 GB estáveis de originais, antes de backups. Não prometer armazenamento ilimitado dentro de R$ 39,90.

Prévias de 0,4 MB para 4.000 fotos geram 1,6 GB/mês. Três carregamentos por foto representam 4,8 GB de tráfego. Exportar 30 originais por sessão representa cerca de 15 GB/mês para download, além de leituras internas e temporários. Compressão depende do formato.

Uma rodada de IA por foto nesse exemplo representa até 4.000 análises/mês, mais retries. Isso dimensiona, não precifica. Reaproveitar resultados por hash/modelo quando adequado e respeitar orçamento autorizado.

```text
receita = 39,90 × estúdios ativos + adicionais aprovados
custo = hosting + banco + worker + storage + backups + tráfego + IA + e-mail
        + taxas aplicáveis + impostos + suporte
margem = receita - custo
```

Custo fixo compartilhado e variável por estúdio precisam ser separados. Valores de pedidos das famílias não são receita de assinatura da plataforma. A margem não pode ser garantida sem franquias, retenção e preços adicionais.

## Decisões para aprovação

| ID | Decisão | Recomendação |
|---|---|---|
| D01 | Arquitetura | Frontend preservado + painel/backend Next.js/TypeScript + Supabase + worker. Sem provisionamento agora. |
| D02 | Recursos existentes | Confirmar conta/projeto exclusivo da galeria, se houver. Ambiente local/fakes até autorização de conexões. Não reutilizar bancos de campanha/Cérebro. |
| D03 | Storage | Definir JPEG/RAW/HEIC, tamanho máximo, GB incluídos, prazo de guarda de originais/prévias/backups e preço adicional. |
| D04 | IA básica/premium | Recomendo curadoria manual no básico e sugestões IA premium opt-in. Precisa aprovação: jornada cita IA, mas IA é adicional pago. Não executar IA paga em todo upload. |
| D05 | Provedor IA/dados | Só prévias, sem reconhecimento de identidade; aprovar provedor, privacidade, critérios e orçamento. |
| D06 | Comércio | Preço de extras/produtos, variações, estoque/frete, prazo e possibilidade de concluir sem fotos. Valores das fixtures não são preços propostos. |
| D07 | Todos os digitais | Recomendo todas as APROVADAS da versão publicada, nunca rejeitadas ou todo o upload. Confirmar se substitui cobrança de extras e expande seleção final/ZIP. |
| D08 | Pagamento | Provedor, conta recebedora, Pix/cartão, total zero, cancelamento/estorno. Outros fotógrafos devem receber em conta própria/conectada aprovada. |
| D09 | Link individual | Segredo revogável com expiração no mínimo; decidir PIN/OTP, validade e aparelho compartilhado. |
| D10 | Abertura/design | Autorizar vídeo e sua inserção. Não reutilizar automaticamente vídeo da campanha ou substituir abertura aprovada. |
| D11 | ZIP | Somente seleção final liberada; confirmar subpastas para nomes duplicados e efeito de reembolso/edição posterior. |
| D12 | SaaS/operacional | Franquias de R$ 39,90, adicionais, limites, backups, branding e cadastro manual inicial. Sem cobrança de assinatura nesta fase. |

## Limite da aprovação solicitada agora

A aprovação pode liberar implementação LOCAL da fundação com dados artificiais e provedores falsos. Não autoriza contratação/API paga, assinatura recorrente, imagens reais, pagamentos/e-mails reais, migração/implantação de produção, push/merge em main ou alteração visual.

Não é preciso decidir todos os itens agora. A decisão imediata é aprovar/ajustar arquitetura e sequência; detalhes específicos são resolvidos antes de sua etapa dependente, sem bloquear trabalho local independente depois da aprovação. **A implementação permanece aguardando aprovação expressa.**
