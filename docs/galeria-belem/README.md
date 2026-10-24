# Galeria Belém 2026 — proposta para aprovação

**Estado atual: arquitetura aprovada; primeira etapa implementada localmente em `apps/studio`.**

[Entrega funcional, instruções e limitações](05-primeira-entrega.md). Os documentos 01–04 preservam a proposta aprovada como histórico; trechos que dizem “ainda não implementado” descrevem o momento do planejamento, não o estado da entrega atual.

A missão vigente confirma que o painel administrativo ainda não existe e autoriza sua criação APÓS aprovação do diagnóstico e da arquitetura. Essa confirmação substitui a pendência anterior de localizar um painel já construído. Não é necessário continuar procurando esse painel como pré-requisito.

- [Diagnóstico e reaproveitamento](01-diagnostico.md)
- [Arquitetura e isolamento entre estúdios](02-arquitetura.md)
- [Etapas, critérios de conclusão e testes](03-etapas-e-testes.md)
- [Custos externos e decisões para aprovação](04-custos-e-aprovacoes.md)
- [Ambiente de desenvolvimento](../../development/README.md)
- [Estrutura de testes e fixtures artificiais](../../tests/galeria/README.md)

Branch de planejamento: `plan/galeria-belem-platform`; implementação local: `feat/galeria-studio-stage-one`. Base: `f186295b902f2b2b481a53a764abe58f19eee142`, o commit observado em `origin/main` na auditoria. Nenhum push, merge, publicação, contratação, migração ou acesso a dados de clientes faz parte desta entrega.

O frontend aprovado, seus áudios e o smoke test existentes permanecem byte a byte iguais. Na implementação, o workflow foi restringido aos três ativos públicos para não expor código privado, sem executá-lo. Os documentos definem o sistema proposto; tabelas, APIs, telas, workers e integrações descritos NÃO foram implementados.
