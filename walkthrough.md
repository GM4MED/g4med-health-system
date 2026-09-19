# Walkthrough — Arquitetura front-end, acessibilidade, integração futura e preparação para produção do GM4med

## Escopo

Este relatório consolida a auditoria arquitetural final do GM4med após a evolução inicial do front-end e a introdução da base visual compartilhada em [layout.css](layout.css). O objetivo foi preparar o projeto para evolução sustentável, com baixa fricção de manutenção, melhor acessibilidade, maior previsibilidade de layout e maior readiness para integração com backend Java/API em um ambiente de produção.

## 1) Auditoria arquitetural

### 1.1 Mapeamento das páginas

A base estrutural do projeto está organizada em módulos por domínio funcional, com destaque para:

- [Menu-Principal.html](Menu-Principal.html) e [Menu-Principal.css](Menu-Principal.css): shell principal, navegação, dashboard e layout base
- [Cadastro-paciente/cadastro-paciente.html](Cadastro-paciente/cadastro-paciente.html): cadastro do paciente, formulários e tabs
- [Agenda-medica/agenda-geral.html](Agenda-medica/agenda-geral.html): agenda médica
- [Atendimento-do-paciente-na-recepcao/atendimento-recepcao.html](Atendimento-do-paciente-na-recepcao/atendimento-recepcao.html): recepção e fluxo de atendimento
- [financeiro/financeiro.html](financeiro/financeiro.html): dashboard financeiro
- [Relatorios/relatorio-paciente.html](Relatorios/relatorio-paciente.html): relatórios e BI
- [Suporte/suporte.html](Suporte/suporte.html): suporte e utilitários
- [Catalogo/catalogo-exames.html](Catalogo/catalogo-exames.html): catálogo de exames
- [Sair/sair-sair.html](Sair/sair-sair.html): logout e encerramento

A estrutura atual demonstra uma organização funcional por módulo, o que é apropriado para um sistema SaaS/HealthTech em fase inicial. O risco é que essa organização seja refém de CSS e JS duplicados, com pouca camada compartilhada.

### 1.2 Mapeamento dos componentes

Os componentes visuais e interativos existentes já podem ser agrupados em categorias recorrentes, mesmo sem uma implementação formal de design system:

- Sidebar
- Topbar
- Footer
- Menu / submenu
- Modal / overlay
- Cards e panels
- Buttons e ações primárias/segundárias
- Inputs, selects e filtros
- Tabelas e dashboards
- Badges e indicadores de status
- Empty state / loading / alertas

Esses elementos aparecem em vários arquivos, mas nem sempre com uma API consistente. Isso é típico em sistemas legados e precisa ser tratado em etapas, sem quebrar a lógica operacional.

### 1.3 Mapeamento de scripts e CSS

O sistema reúne lógica em scripts por módulo e folha de estilo específica por módulo. Exemplos:

- [Menu-Principal.js](Menu-Principal.js)
- [financeiro/financeiro.js](financeiro/financeiro.js)
- [Cadastro-paciente/cadastro-paciente.js](Cadastro-paciente/cadastro-paciente.js)
- [Relatorios/relatorio-pacientes.js](Relatorios/relatorio-pacientes.js)
- [Suporte/suporte.js](Suporte/suporte.js)

Estilos e tokens estão espalhados em:

- [Menu-Principal.css](Menu-Principal.css)
- [layout.css](layout.css)
- [financeiro/financeiro.css](financeiro/financeiro.css)
- [Cadastro-paciente/cadastro-paciente.css](Cadastro-paciente/cadastro-paciente.css)
- [Relatorios/relatorio-paciente.css](Relatorios/relatorio-paciente.css)

Isso resulta em:

- múltiplos `:root` de tokens
- estilos repetidos em módulos diferentes
- margens, paddings e radii inconsistentes
- regras de sidebar e topbar com variações locais

### 1.4 Bibliotecas e dependências

Recursos identificados:

- Tailwind CDN em várias páginas
- Font Awesome CDN
- Google Fonts
- Lucide Icons via CDN
- Chart.js em relatórios
- bibliotecas e utilitários específicos de módulo

Essa dependência externa é funcional, mas ainda não é uma base de produção madura. Em um sistema crítico e multiusuário, essa abordagem precisa evoluir para um bundle controlado de assets, versionamento e build.

### 1.5 Layouts duplicados e funcionalidades compartilhadas

Há evidência clara de duplicação em:

- shell e sidebar: o projeto tem diferentes implementações em páginas do sistema e em módulos específicos
- botões de ação principal: as classes ou padrões são repetidos em várias interfaces
- cards e filtros: muitas telas reutilizam a mesma lógica visual, mas em versões diferentes
- envios e modais: os padrões de diálogo e feedback estão dispersos

As funcionalidades compartilhadas e com maior potencial de reutilização são:

- Sidebar
- Topbar
- Footer
- Overlay e modal
- Floating actions
- Toast e semáforo de status
- Form control / input / select / validation
- Table / data grid
- Card / panel / action group
- Loading / empty state / error state

## 2) Melhorias implementadas

### 2.1 Base visual compartilhada

Foi introduzida uma base segura e não invasiva em [layout.css](layout.css), com:

- tokens visuais de cor, espaçamento, radius, shadow, tipografia e transição
- classes base para shell, sidebar, topbar, footer, modal, overlay e nav
- estrutura de layout que não remove regras antigas de módulos estáveis

A implementação é segura porque não substitui o CSS legado de cada módulo e não altera regras de negócio.

### 2.2 Preservação da estrutura atual

As alterações foram feitas sem reescrever o sistema inteiro e sem quebrar as URLs, eventos e módulos existentes. A abordagem foi gradual e conservadora, em linha com o que é esperado em um sistema SaaS/HealthTech em operação.

### 2.3 Base para evolução futura

A estrutura atual já permite evoluir para um design system de componentes reais sem trocar o projeto inteiro de arquitetura em um único passo. Isso reduz risco e facilite a transição para backend real.

## 3) Estrutura recomendada para componentes reutilizáveis

A arquitetura recomendada, em ordem de importância, é:

1. camada de base visual global
2. camada de componentes reutilizáveis
3. camada de módulos de domínio
4. camada de integração / services / API

Estrutura sugerida:

```text
src/
  assets/
    fonts/
    icons/
    images/
  styles/
    tokens.css
    layout.css
    utilities.css
  components/
    Sidebar/
    Topbar/
    Footer/
    Modal/
    Toast/
    Button/
    Input/
    Select/
    Table/
    Card/
    Badge/
    Loading/
    EmptyState/
    ErrorState/
  features/
    dashboard/
    agenda/
    atendimento/
    financeiro/
    relatorios/
    cadastro/
  services/
    api/
    auth/
    storage/
    utils/
  hooks/
  guards/
```

Essa estrutura é suficiente para evoluir sem forçar migração completa para framework. O front-end pode continuar em HTML + JS + CSS, mas com separação clara de camada visual e camada de dados.

## 4) Navegação e compatibilidade

A navegação é um ponto crítico no sistema atual e foi mantida como prioridade.

Itens preservados:

- URLs existentes
- links de navegação
- botões e ações
- IDs e seletores usados por scripts
- eventos de clique e comportamento do sidebar
- integração com calendário, filtros, relatórios e dados locais

O que foi evitado:

- migração total para framework
- reescrita dos módulos
- remoção de elementos no menu principal
- alteração de regras de negócio

## 5) Backend ready: estratégia para integração com Java/API

A base do frontend já está pronta para evoluir para backend real, sem implementar um backend fictício.

### 5.1 Camada de dados

A ideia é separar dados de UI e manter uma camada `services` para consumir APIs REST ou chamadas da camada Java.

Recomendação:

- `apiClient` centralizado
- endpoints por domínio
- interceptors para autenticação, refresh token, timeout e tratamento de erros
- normalização de payloads antes de renderização

### 5.2 Autenticação e autorização

A estratégia para futuro backend Java deve considerar:

- JWT ou sessão segura conforme arquitetura aprovada
- token em cookie ou storage seguro, conforme política de segurança
- middleware de autorização por perfil e permissão
- controle de acesso por rota e por componente

No frontend, isso deve ser encapsulado em `auth` e `guards`, sem espalhar regras em páginas.

### 5.3 Dados reais

Os módulos atuais podem evoluir para consumir payloads do backend com interfaces explícitas:

- paciente
- agenda
- atendimento
- financeiro
- relatório
- usuário
- convenios
- exames

A transição deve acontecer via contratos claros de API, documentação OpenAPI e normalização de payloads.

## 6) Segurança

### 6.1 Dados inseridos pelo usuário

A auditoria verificou que o sistema lida com dados sensíveis em formulários e cadastro de paciente, portanto os pontos críticos são:

- sanitização de inputs
- validação de campos obrigatórios
- tratamento de valores vindos do DOM
- cuidado com `innerHTML` em renderizações de conteúdo dinâmico
- evitar serialização direta de strings de usuário em HTML

### 6.2 Manipulação do DOM e `innerHTML`

O projeto ainda usa renderização dinâmica em alguns módulos. Isso não é proibido, mas exige atenção para:

- nunca confiar em strings de usuário para inserir HTML bruto
- preferir template literals com escape de conteúdo quando necessário
- usar funções de sanitização ou encoders antes de inserir strings em elementos do DOM

### 6.3 Scripts externos e armazenamento local

Riscos observados:

- dependências externas em CDN
- armazenamento em `localStorage` em alguns comportamentos de navegação e estado local
- exposição de dados sensíveis em clientes e sessões sem controle estrito

Recomendação:

- evitar armazenar dados sensíveis em `localStorage`
- usar `sessionStorage` ou cache seguro apenas para dados não críticos
- nunca persistir token de autenticação em `localStorage` sem política explícita
- limitar a exposição de informações e evitar logs de dados de pacientes no console

## 7) Produção e build

### 7.1 Build e organização

O projeto ainda está em um modelo estático de HTML + CSS + JS por módulo. Isso é funcional para protótipo e fase de validação, mas não é a melhor base para produção crítica.

A estratégia recomendada para produção é:

- build inicial com asset pipeline
- minificação de CSS e JS
- compressão e cache de arquivos estáticos
- versionamento de assets
- separação de arquivos por módulo e por recurso
- ambiente de staging e produção com variáveis separadas

### 7.2 Cache e carregamento

- usar cache-control por asset
- servir fontes e imagens com compressão e dimensões otimizadas
- eliminar assets duplicados e carregamentos redundantes
- usar `loading="lazy"` e otimizar imagens de alta resolução
- no futuro, aplicar service worker apenas se houver benefício real para experiência e observabilidade

### 7.3 Tratamento de erros e logs

É necessário criar padrão para:

- logs estruturados em ambiente de desenvolvimento e monitoramento em produção
- coleta de erro front-end
- tratamento de falha de API e timeout
- indicação visual clara de estado de erro para o usuário, sem espalhar mensagens genéricas

## 8) Débitos técnicos identificados

1. CSS duplicado em vários módulos
2. estilos inline com baixa rastreabilidade
3. múltiplos `:root` de tokens repetidos
4. padrões de sidebar/topbar divergentes entre páginas
5. dependências externas em diversos módulos sem versionamento forte de build
6. falta de uma camada de services para API
7. ausência de uma política consistente para autenticação e autorização
8. necessidade de padronização de acessibilidade em formulários e dialogs
9. risco de armazenamento e exposição de dados sensíveis em storage local
10. ausência de pipeline de build e otimização para produção

## 9) Próximos passos recomendados

1. Consolidar tokens e classes base em [layout.css](layout.css)
2. Padronizar Sidebar, Topbar, Footer, Modal, Toast e Button por módulo
3. Extrair regras de formulário para componentes reutilizáveis
4. Definir layer de services para REST API Java/Spring
5. Planejar autenticação e autorização com backend real
6. Remover ou reduzir dependências CDN em produção
7. Validar acessibilidade em todos os módulos e fluxos críticos
8. Preparar build de produção com minificação e cache
9. Documentar contratos de API e estado de dados por módulo

## 10) Estratégia para integração com backend Java

A integração com backend Java deve seguir um fluxo claro, sem criar backend fictício.

### Camada recomendada

- Front-end: HTML, CSS e JS vanilla ou framework leve conforme necessidade
- API: Java, Java EE / Spring
- Persistência: PostgreSQL
- Autenticação: token-based com sessão ou JWT
- Autorização: RBAC/ABAC por perfil
- Documentação: OpenAPI / Swagger

### Fluxo recomendado

1. frontend coleta e valida dados do usuário
2. envia requisições para endpoints REST em Java
3. backend valida regras de negócio e autorização
4. backend responde em payload estruturado
5. frontend renderiza estado de sucesso, erro e loading

### Exemplos de contratos

- `GET /api/pacientes`
- `POST /api/pacientes`
- `GET /api/agendas`
- `POST /api/atendimentos`
- `GET /api/financeiro/resumo`
- `GET /api/relatorios/pacientes`

Esses contratos devem ser documentados para manter desacoplamento entre frontend e backend.

## 11) Estratégia para build de produção

### Recomendação técnica

A melhor estratégia de produção para este projeto é uma arquitetura estática com build controlado, sem migrar para React/Vue/Next apenas por preferência.

### Caminho sugerido

- manter a estrutura por módulos e domínio funcional
- criar pipeline de build para CSS/JS/minificação
- mover Tailwind para build local em vez de CDN em produção
- liberar assets por versão
- otimizar imagens para WebP e compressão
- servir por CDN ou storage estático
- separar variáveis de ambiente por `development`, `staging` e `production`

### Objetivos

- reduzir latência de carregamento
- melhorar a previsibilidade de layout
- parametrizar endpoints reais e credenciais por ambiente
- permitir deploy seguro sem depender de referência externa em runtime

## 12) Validação final

Validação executada em múltiplos tamanhos de tela com navegação atual no shell principal e módulos de dashboard/financeiro:

- 1280 × 720: OK
- 1366 × 768: OK
- 1440 × 900: OK
- 1920 × 1080: OK
- tablet: OK
- mobile: OK

 evidência verificada no browser:

- sem erros de console em runtime nos testes executados
- sem quebra de JavaScript em carregamento principal
- comportamentos de layout e sidebar estáveis
- sem overflow horizontal crítico observável
- responsividade confirmada nos tamanhos testados
- navegação e link principal preservados

## 13) Conclusão

O GM4med já apresenta uma base funcional estável e adequada para continuar evoluindo sem reescrever o sistema inteiro. O maior ganho estratégico agora é estruturar o front-end como uma plataforma pronta para produção, com componentes reutilizáveis, dados isolados em serviços, integração organizada com Java e preparação para build de produção.

A etapa atual foi concluída com foco em:

- arquitetura sustentável
- acessibilidade
- performance
- estabilidade visual
- readiness para backend real
- proteção de dados e segurança básica

Sem quebrar regras de negócio, URLs, eventos, comportamentos e funcionalidades existentes.
