# 3. Etapas de desenvolvimento e validação

**Nenhuma implementação começa antes da aprovação desta proposta.** A ordem de negócio é upload → IA → revisão humana → cliente/pacote → publicação → experiência da família → loja/checkout → confirmação → ZIP. Infraestrutura é pré-requisito técnico, não uma mudança na jornada.

| Etapa | Entrega após aprovação | Critério de saída |
|---|---|---|
| 0 — Fundação | Painel/backend, schema de tenants, membros, auth, RLS/storage e worker | Dois estúdios fictícios isolados em banco, objetos, jobs e cache. |
| 1 — Upload | Sessão rascunho, upload privado retomável, IDs/nomes/hashes, prévias | Original artificial recuperado idêntico; upload parcial/duplicado tratado; nenhum original exposto à família. |
| 2 — IA | Sugestões do provedor aprovado, quotas e rastreabilidade | Somente prévias autorizadas; falha/repetição não publica nem apaga revisão humana. Sem API paga antes de autorização. |
| 3 — Revisão humana | Aprovar/rejeitar sugestões e comparar fotos | Foto rejeitada nunca publicada; decisão da proprietária auditada. |
| 4 — Cliente/pacote | Cadastro mínimo, sessão, fotos contratadas e preço adicional | Vínculos válidos no tenant; preços tipados em centavos. |
| 5 — Publicação | Versão só de aprovadas e link individual revogável | Família só vê sua galeria; copiar link sem enviar mensagens automaticamente. |
| 6 — Galeria conectada | Adaptador API no frontend aprovado, vídeo autorizado, apresentação, seleção/filtros/revisão e contadores do pacote | Corrigir A01–A13, manter design, confirmar salvamento no servidor e recuperação em outro navegador. |
| 7 — Loja | Catálogo administrável, variações, seis categorias e resumo | Produto inativo/preço adulterado não entra em pedido; regra de todos os digitais aprovada. |
| 8 — Checkout | Quote no servidor, snapshot, pedido idempotente e checkout sandbox | Webhooks inválidos/duplicados não liberam pedido; nenhum pagamento real. |
| 9 — Confirmação/e-mail | Pedido liberado, confirmação e outbox | E-mail só após confirmação confiável; testes em caixa sandbox. |
| 10 — ZIP | Exportação privada da seleção final liberada | Nomes/hashes dos originais conferem; acesso negado a outro tenant/família ou pedido não liberado. |
| 11 — Homologação | E2E, acessibilidade, restauração, dispositivos e limites | Evidências para revisão; sem merge/deploy automático. |

## Estratégia de testes proposta

- Unidade: dinheiro em centavos, quantidade incluída, extras, total zero, estados e cotas. Fuso do estúdio explícito; fixtures não definem preços comerciais.
- Banco/storage: PostgreSQL/Supabase local, dois estúdios e duas famílias no mesmo estúdio. RLS com papéis da aplicação, constraints compostas e políticas de objetos. Caminhos de worker/servidor privilegiados testados separadamente.
- Integração: upload interrompido, hash, prévia, IA falsa, revisão concorrente, retries/outbox, checkout fake/sandbox e ZIP extraído. Mocks não homologam um provedor.
- E2E: Playwright Chromium/WebKit, desktop e móvel, teclado/foco, preferências de áudio/movimento, rede lenta e mídia ausente. iOS/Android físicos antes de produção. Comparação visual somente com referências aprovadas e fotografias artificiais.
- Operação: restauração conjunta de banco E arquivos, limpeza de temporários, limites de jobs e logs sem segredos.

O smoke test atual `node .github/scripts/gallery-smoke.mjs` foi executado com sucesso nesta etapa. É estrutural: não demonstra isolamento, pagamento ou ZIP. Os novos runners/SDKs e CI NÃO foram implementados/instalados nesta fase.

## Matriz de aceitação futura

Todos os itens abaixo estão **PLANEJADOS / NÃO EXECUTADOS no novo backend**.

| ID | Cenário | Resultado esperado |
|---|---|---|
| MT01 | Estúdio A fornece sessão do B | Banco/API/storage negam, sem revelar dados. |
| MT02 | Família A fornece foto de outra família do mesmo estúdio | Negado por escopo de galeria, não só studio_id. |
| MT03 | Worker A recebe objeto do B | Job rejeitado e auditado. |
| MT04 | Família tenta enumerar originais | Negado; segredo privilegiado nunca entregue ao browser. |
| UP01 | Original artificial convertido em prévia | Original imutável/hash preservado e vínculo explícito. |
| UP02 | Upload parcial, MIME falso ou arquivo enorme | Sem publicação; limites, falha clara e retomada segura. |
| AI01 | IA indisponível ou quota esgotada | Sem excedente cobrado/publicação automática. |
| AI02 | Proprietária discorda da IA | Decisão humana prevalece. |
| GA01 | Link inválido/expirado/revogado | Nenhum dado privado, sem enumeração de clientes. |
| GA02 | Reordenar fotos após salvar | IDs selecionados preservados; versões reconciliadas. |
| GA03 | Duas abas/dispositivos salvam | Revisão/conflito explícito; nenhuma perda silenciosa. |
| GA04 | Offline/localStorage bloqueado/servidor falha | Sem falsa confirmação; rascunho distinto de salvo. |
| UI01 | Entradas diretas, fechar/pular, histórico | Uma tela coerente, sem overlay preso. |
| UI02 | Viewer/teclado/silêncio/movimento reduzido | Foco e preferências respeitados; estado anunciado. |
| OR01 | Adulterar total no navegador | Backend recalcula e rejeita inconsistência. |
| OR02 | Concluir repetidamente | Um pedido efetivo por chave de idempotência. |
| OR03 | Produto inativo/preço muda | Quote revisado com consentimento; pedido pago não muda. |
| PA01 | URL de sucesso sem webhook | Pedido pendente, sem ZIP/e-mail de pagamento confirmado. |
| PA02 | Webhook inválido/duplicado/fora de ordem | Estado correto; sem liberação/notificação duplicada. |
| PA03 | Total zero | Regra aprovada, sem inventar evento de pagamento. |
| ZIP01 | Exportar seleção liberada | Somente originais corretos, nomes e SHA-256 iguais. |
| ZIP02 | Mesmo nome em fotos distintas | Nenhuma sobrescrita; subpastas estáveis, se aprovadas. |
| ZIP03 | Original ausente/expiração/job interrompido | Falha/retomada clara; sem ZIP parcial como sucesso. |
| ZIP04 | Pedido pendente/estornado ou tenant adulterado | Geração/entrega negada conforme regra aprovada. |
| EM01 | Confirmação válida e repetida | Notificação lógica única; caixa sandbox. |
| OP01 | Restaurar banco E arquivos | Seleção, vínculos e hashes artificiais recuperados. |
| OP02 | Limite de storage/IA | Bloquear/exigir autorização, sem contratar/cobrar automaticamente. |

## CI e publicação

O workflow atual publica a raiz em `main` e admite execução manual: não dispará-lo. Planejar CI de teste separada de deploy e artefato público limitado. Nenhuma alteração desse workflow nesta entrega.

Aprovar arquitetura permite iniciar o desenvolvimento acordado, não contratar, publicar ou cobrar. Backend e integrações descritos são propostas, não recursos entregues.
