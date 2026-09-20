# GM4Med — Preparação para integração REST Java

## Visão geral

A aplicação atual é um front-end estático em HTML, CSS e JavaScript, com dados simulados em memória e em `localStorage` em vários módulos. Esse padrão é adequado para prototipagem e homologação visual, mas não define a API final do backend Java.

A arquitetura pretendida é:

UI -> JavaScript -> Services -> REST API -> Java / Java EE -> PostgreSQL

## Principio da separação

- UI: manipula DOM e eventos
- JavaScript: coordena regras de negócio e fluxo
- Services: encapsulam acesso a dados e padronizam integração futura
- REST API: será implementada no backend Java
- PostgreSQL: banco de dados definitivo

## Camada de serviços criada

A pasta `js/` foi preparada como base para uma camada de serviços, sem quebrar o comportamento atual.

Arquivos principais:

- `js/core/apiClient.js` — cliente HTTP base para futuras requisições REST
- `js/services/baseService.js` — abstração reutilizável para CRUD
- `js/services/serviceRegistry.js` — registro dos serviços

## Exemplo de contrato

Os serviços abaixo são propostos como contratos de integração e não representam endpoints reais implementados no backend:

- PacienteService
- MedicoService
- ExameService
- AgendaService
- AtendimentoService
- FinanceiroService
- ConvenioService
- UsuarioService
- RelatorioService

## Regras de integração

- manter mocks funcionando enquanto a API não existir
- usar `mockEnabled` para alternar entre dados locais e backend
- conservar o comportamento atual sem quebrar a aplicação
- não definir contrato definitivo para Java ainda

## Observação importante

A integração com o backend deve definir, em conjunto com o time Java, os nomes exatos de campos, endpoints, autenticação e regras de consentimento.

Este arquivo prepara o front-end para receber esse contrato com menor custo de refatoração.
