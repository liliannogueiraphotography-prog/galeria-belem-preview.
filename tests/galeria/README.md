# Testes implementados

A suíte funcional atual está em `apps/studio/tests/`: testes Node em SQLite temporário e nove cenários Playwright/API com dados artificiais. Veja [como executar](../../apps/studio/README.md). O plano e as fixtures iniciais abaixo permanecem como histórico.

# Testes da plataforma — estrutura inicial

**Fixtures e plano de aceitação. Backend e novos testes executáveis ainda não implementados.**

O teste existente é `.github/scripts/gallery-smoke.mjs` e passou nesta preparação. A auditoria anterior não equivale a validação de banco/pagamento/ZIP. A matriz futura está em `docs/galeria-belem/03-etapas-e-testes.md`.

## Dados artificiais

`fixtures/scenarios.json`: dois estúdios e três famílias fictícias. Duas famílias no mesmo estúdio verificam escopo além do tenant. UUIDs não representam recursos reais e e-mails `.invalid` não devem receber envios.

Valores são só testes: BRL em centavos, pacote de duas fotos e adicional de 1.000 centavos. NÃO são preços comerciais aprovados. O plano-alvo SaaS não é checkout ativo.

Os SVGs contêm apenas geometria/texto. Seus hashes permitirão verificar se o ZIP usa o original correto, não a prévia. As fixtures, sozinhas, não validam isolamento nem ZIP.

## Casos prioritários após aprovação

- Isolamento de tenants/famílias no banco, arquivos, workers, cache e pagamentos.
- Seleção por ID após reordenação e conflitos entre abas/dispositivos.
- Rede/mídia/storage local indisponíveis e os 13 problemas auditados.
- Totais no servidor, catálogo versionado, extras/total zero.
- Checkout fake/sandbox, assinatura de webhook e idempotência.
- ZIP só de originais selecionados/liberados, nomes e hashes exatos.
- Nomes duplicados/inseguros, original ausente e retry de job.
- Notificação simulada após confirmação válida.

Não enviar e-mail real, cobrar, usar IA paga ou publicar por teste. E2E deve substituir fotografias por fixtures no contexto de teste, sem reescrever o frontend aprovado.
