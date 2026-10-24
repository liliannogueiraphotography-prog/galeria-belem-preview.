# Desenvolvimento — preparação para aprovação

Estado: documentação e fixtures. Aplicações novas NÃO implementadas.

- Repositório: `liliannogueiraphotography-prog/galeria-belem-preview.`.
- Branch: `plan/galeria-belem-platform`; main e frontend preservados.
- Usar checkout existente em tarefas isoladas; não criar worktree sem solicitação explícita.
- Não disparar workflow/push/merge/publicação, pagamentos reais ou contratar.

## Workflow existente

Na raiz do checkout:

```bash
node .github/scripts/gallery-smoke.mjs
python3 -m http.server 8000 --bind 127.0.0.1
```

O primeiro é o teste estrutural existente, executado com sucesso nesta etapa. O segundo serve APENAS a demonstração, não painel/backend. Não exige instalar pacotes. O servidor estático não é storage seguro para originais; não gerar links públicos de preview de localhost no onboarding.

## Estrutura preparada

- `docs/galeria-belem/`: diagnóstico, arquitetura, etapas, custos e aprovações.
- `tests/galeria/README.md`: estratégia e limites da validação futura.
- `tests/galeria/fixtures/scenarios.json`: entidades e valores artificiais.
- `tests/galeria/fixtures/original-a.svg`, `original-b.svg`: geometria artificial sem pessoas.
- `tests/galeria/fixtures/checksums.json`: hashes desses SVGs; não implica ZIP testado.

## Após aprovação, ainda a implementar

1. Pinar Node LTS e gerenciador compatíveis, com lockfile e instalação reproduzível.
2. Preparar banco/storage locais; verificar Docker/CLI, sem presumir serviços ativos.
3. Implementar painel/backend e worker, separação de ambientes e segredos só no servidor.
4. Provedores falsos de IA/pagamento/e-mail por padrão; sandboxes externas só autorizadas.
5. Runners/CI de testes antes das funcionalidades. CI de teste não publica.
6. Navegadores E2E com TLS/checksums ativos; iOS/Android físicos antes de produção.

Nenhum package.json/lockfile, `.env` ou segredo novo nesta entrega. Quando necessários, declarar requisitos em configuração segura; não preencher chaves em chat/commits. Não inventar projeto/bucket de produção.

O workflow atual publica a raiz inteira: será necessário limitar o artefato público antes de qualquer implantação futura. Documentação/fixtures não contêm clientes/segredos, mas não devem integrar o futuro artefato público. Não alterar o workflow nesta fase de aprovação.
