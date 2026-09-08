# Design Document

## Índice

1. [Overview](#overview)
2. [Data Models](#data-models)
3. [Components and Interfaces](#components-and-interfaces)
4. [Architecture](#architecture)
5. [Correctness Properties](#correctness-properties)
6. [Error Handling](#error-handling)
7. [Testing Strategy](#testing-strategy)

---

## Overview

### Resumo da Arquitetura

O **Painel Available** é um módulo frontend-only do sistema GM4med que consolida em uma única tela as três dimensões críticas do fluxo clínico diário: status dos agendamentos, fila de espera ativa e disponibilidade dos médicos.

A implementação segue os mesmos padrões arquiteturais dos demais módulos do GM4med:

- **HTML5 semântico** com ARIA landmarks e regiões live
- **CSS customizado** com variáveis do design system (prefixo `.painel__*` para BEM local)
- **JavaScript vanilla ES2020+** em `strict mode`, sem dependências externas além de Font Awesome (CDN)
- **`localStorage`** como camada de persistência, com leitura e escrita envolvidas em `try/catch`
- **Sem framework, sem bundler, sem build step**

### Estrutura de Arquivos

```
GM4med-health-system/
├── Painel-available/
│   ├── painel-available.html      ← página principal
│   ├── painel-available.css       ← estilos do módulo
│   └── painel-available.js        ← lógica do módulo
└── Menu-Principal.html            ← adicionar link de entrada para o painel
```

### Pontos de Integração com Módulos Existentes

| Módulo                    | Tipo           | Chave localStorage                | Operação          |
|--------------------------|----------------|-----------------------------------|-------------------|
| `Agenda-medica`          | Agendamentos   | `GM4med.agenda.agendamentos.v2`    | Leitura + Escrita |
| `Cadastros-medicos`      | Médicos ativos | `GM4med.cadastros.medicos.v1`      | Somente leitura   |
| `Painel-available` (novo)| Status médicos | `GM4med.status.medicos`            | Leitura + Escrita |
| `Painel-available` (novo)| Fila de espera | `GM4med.painel.chegadas`           | Leitura + Escrita |
| `Agenda-medica`          | Navegação      | URL param `?data=YYYY-MM-DD`      | Link de saída     |
| `Atendimento-recepcao`   | Navegação      | URL param `?pacienteId={id}`      | Link de saída     |
| `Cadastro-paciente`      | Navegação      | URL param `?pacienteId={id}`      | Link de saída     |

O painel emite o evento customizado `GM4med:painel-status-changed` no objeto `window` sempre que um status de agendamento ou médico é alterado, permitindo que outros módulos reajam às mudanças.

---

## Data Models

### 2.1 Registro de Agendamento (`GM4med.agenda.agendamentos.v2`)

Formato idêntico ao utilizado por `agenda-geral.js`. O Painel Available lê e escreve nesta mesma chave.

```js
/**
 * @typedef {Object} Agendamento
 * @property {string}  id           - UUID gerado por crypto.randomUUID()
 * @property {string}  paciente     - Nome completo do paciente
 * @property {string}  medicoId     - ID do médico (referência a Medico.id)
 * @property {string}  data         - Data no formato "YYYY-MM-DD"
 * @property {string}  hora         - Horário no formato "HH:MM"
 * @property {number}  duracao      - Duração em minutos (padrão: 30)
 * @property {string}  tipo         - "presencial"|"online"|"retorno"|"procedimento"
 * @property {string}  convenio     - Nome do convênio ou "particular"
 * @property {string}  status       - Ver tabela de status abaixo
 * @property {string}  observacoes  - Texto livre, pode ser vazio
 * @property {boolean} lembrete     - Flag de lembrete via WhatsApp
 * @property {string}  criadoEm    - ISO 8601 timestamp
 * @property {string}  [atualizadoEm] - ISO 8601 timestamp (presente após edição)
 */
```

**Mapeamento de status internos para rótulos no painel:**

| Valor interno (storage)  | Rótulo Agenda    | Rótulo Painel Available |
|--------------------------|------------------|-------------------------|
| `agendado`               | Agendado         | Agendado                |
| `confirmado`             | Confirmado       | Confirmado              |
| `espera`                 | Em Espera        | Em Atendimento          |
| `atendido`               | Atendido         | Concluído               |
| `cancelado`              | Cancelado        | Cancelado               |
| `nao-compareceu`         | Não Compareceu   | Faltou                  |

> Os valores persistidos em localStorage são sempre os valores internos para garantir compatibilidade entre módulos.

### 2.2 Registro de Médico (`GM4med.cadastros.medicos.v1`)

Somente leitura. O painel não escreve nesta chave.

```js
/**
 * @typedef {Object} Medico
 * @property {string|number} id           - Identificador único
 * @property {string}        nome         - Nome completo (ex: "Dr. Carlos Silva")
 * @property {string}        conselho     - CRM (ex: "CRM 12345-GO")
 * @property {string}        especialidade- Especialidade principal
 * @property {string}        status       - "Ativo" | "Inativo"
 */
```

> **Fallback:** O módulo `Cadastros-medicos` atual armazena médicos em memória sem persisti-los. O painel inclui `MEDICOS_FALLBACK` (lista estática compatível com `agenda-geral.js`) para ser usado quando a chave não existir.

### 2.3 Status dos Médicos (`GM4med.status.medicos`)

Chave própria do Painel Available. Objeto indexado por `medicoId`.

```js
/**
 * Estrutura: { [medicoId: string]: StatusMedico }
 *
 * Exemplo:
 * {
 *   "1": { status: "disponivel",  atualizadoEm: "2025-01-20T10:30:00.000Z" },
 *   "2": { status: "em-consulta", atualizadoEm: "2025-01-20T10:45:00.000Z" }
 * }
 *
 * @typedef {Object} StatusMedico
 * @property {"disponivel"|"em-consulta"|"em-pausa"|"ausente"} status
 * @property {string} atualizadoEm - ISO 8601 timestamp
 */
```

**Valores de status do médico:**

| Valor interno | Rótulo exibido | Variável CSS de cor   |
|--------------|----------------|-----------------------|
| `disponivel`  | Disponível     | `--painel-success`    |
| `em-consulta` | Em Consulta    | `--color-primary`     |
| `em-pausa`    | Em Pausa       | `--painel-warning`    |
| `ausente`     | Ausente        | `--painel-danger`     |

### 2.4 Registros de Chegada (`GM4med.painel.chegadas`)

Chave própria do Painel Available. Objeto indexado por `agendamentoId`.

```js
/**
 * Estrutura: { [agendamentoId: string]: RegistroChegada }
 *
 * Exemplo:
 * {
 *   "uuid-abc": {
 *     agendamentoId: "uuid-abc",
 *     pacienteNome:  "Maria da Silva",
 *     medicoId:      "1",
 *     especialidade: "Cardiologia",
 *     tipo:          "presencial",
 *     horaChegada:   "2025-01-20T10:30:00.000Z",
 *     horaAgendamento: "10:30",
 *     data:          "2025-01-20"
 *   }
 * }
 *
 * @typedef {Object} RegistroChegada
 * @property {string} agendamentoId      - ID do agendamento associado
 * @property {string} pacienteNome       - Nome do paciente (denormalizado)
 * @property {string} medicoId           - ID do médico
 * @property {string} especialidade      - Especialidade do médico
 * @property {string} tipo               - Tipo do atendimento
 * @property {string} horaChegada        - ISO 8601 timestamp
 * @property {string} horaAgendamento    - Horário original "HH:MM"
 * @property {string} data               - "YYYY-MM-DD" para filtro diário
 */
```

> Dados de paciente e médico são denormalizados para evitar junções durante a renderização da fila, mantendo performance nas atualizações a cada 60s.

### 2.5 Estado em Memória (`state`)

```js
const state = {
    dataAtual:         '',    // string "YYYY-MM-DD" (sempre hoje)
    agendamentos:      [],    // Agendamento[]
    medicos:           [],    // Medico[]
    statusMedicos:     {},    // { [medicoId]: StatusMedico }
    chegadas:          {},    // { [agendamentoId]: RegistroChegada }
    filtroBusca:       '',    // texto do campo de busca

    ultimoElementoFocado: null, // Element | null (para restaurar foco pós-modal)

    timerFila:    null,  // ID do setInterval da fila (60s)
    timerRelogio: null,  // ID do setInterval do relógio (1s)

    // Snapshots para rollback em caso de falha de escrita
    snapshots: {
        agendamentos:  null,  // JSON.stringify do estado anterior
        statusMedicos: null,
        chegadas:      null
    }
};
```

---

## Components and Interfaces

### 3.1 Estrutura Semântica Geral

```
┌─────────────────────────────────────────────────────────────┐
│  <header> Topbar (role="banner")                            │
│  [← Voltar] [Painel Available — Controle Operacional] [🕐]  │
├─────────────────────────────────────────────────────────────┤
│  <main> (role="main")                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  <section> Resumo Operacional (role="region")       │    │
│  │  [Total: 12] [Atendidos: 5] [Aguardando: 4] [Falt:3]│    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌──────────────┬──────────────┬──────────────────────┐     │
│  │ Agendamentos │ Fila Espera  │ Status Médicos       │     │
│  │ (role=region)│ (role=region)│ (role=region)        │     │
│  │              │              │                      │     │
│  │ [busca]      │ [2 aguard.]  │ [Dr. Carlos]         │     │
│  │ 08:30 João ↓ │ Maria 15min  │ ● Disponível         │     │
│  │ 09:00 Ana  ↓ │ Carlos 35min⚠│                      │     │
│  │ ...          │ ...          │ [Dra. Ana]           │     │
│  │              │              │ ● Em Consulta        │     │
│  └──────────────┴──────────────┴──────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  <div> Toast Container (posição fixa)                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Topbar

```html
<header class="painel__topbar" role="banner">
  <div class="painel__topbar-esquerda">
    <a href="../Menu-Principal.html"
       id="btn-voltar"
       class="painel__btn-voltar"
       aria-label="Voltar ao Menu Principal (Escape)">
      <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
      <span>Voltar</span>
    </a>
    <div class="painel__marca">
      <p class="painel__eyebrow">GM4med</p>
      <h1 class="painel__titulo-header">
        Painel Available — Controle Operacional
      </h1>
    </div>
  </div>
  <div class="painel__topbar-direita">
    <time id="painel-data"
          class="painel__data-atual"
          aria-label="Data atual"></time>
    <time id="painel-relogio"
          class="painel__relogio"
          aria-live="off"
          aria-label="Hora atual"></time>
  </div>
</header>
```

### 3.3 Resumo Operacional

```html
<section class="painel__resumo"
         role="region"
         aria-labelledby="resumo-titulo">
  <h2 id="resumo-titulo" class="sr-only">Resumo Operacional</h2>
  <div class="painel__resumo-grid">

    <article class="painel__metrica painel__metrica--total"
             id="card-total"
             aria-label="Total de agendamentos hoje: —">
      <div class="painel__metrica-icone" aria-hidden="true">
        <i class="fa-solid fa-calendar-check"></i>
      </div>
      <div class="painel__metrica-corpo">
        <span class="painel__metrica-rotulo">Total do Dia</span>
        <strong id="val-total"
                class="painel__metrica-valor"
                aria-live="polite"
                aria-atomic="true">—</strong>
      </div>
    </article>

    <article class="painel__metrica painel__metrica--atendidos"
             id="card-atendidos"
             aria-label="Atendidos hoje: —">
      <div class="painel__metrica-icone" aria-hidden="true">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <div class="painel__metrica-corpo">
        <span class="painel__metrica-rotulo">Atendidos</span>
        <strong id="val-atendidos"
                class="painel__metrica-valor"
                aria-live="polite"
                aria-atomic="true">—</strong>
      </div>
    </article>

    <article class="painel__metrica painel__metrica--aguardando"
             id="card-aguardando"
             aria-label="Aguardando hoje: —">
      <div class="painel__metrica-icone" aria-hidden="true">
        <i class="fa-solid fa-hourglass-half"></i>
      </div>
      <div class="painel__metrica-corpo">
        <span class="painel__metrica-rotulo">Aguardando</span>
        <strong id="val-aguardando"
                class="painel__metrica-valor"
                aria-live="polite"
                aria-atomic="true">—</strong>
      </div>
    </article>

    <article class="painel__metrica painel__metrica--faltou"
             id="card-faltou"
             aria-label="Faltou ou cancelado hoje: —">
      <div class="painel__metrica-icone" aria-hidden="true">
        <i class="fa-solid fa-circle-xmark"></i>
      </div>
      <div class="painel__metrica-corpo">
        <span class="painel__metrica-rotulo">Faltou/Cancelado</span>
        <strong id="val-faltou"
                class="painel__metrica-valor"
                aria-live="polite"
                aria-atomic="true">—</strong>
      </div>
    </article>

  </div>
</section>
```

### 3.4 Seção Agendamentos do Dia

A seção exibe estados mutuamente exclusivos: `loading`, `vazio`, `erro` ou a lista. O JavaScript ativa o atributo `hidden` nos estados não ativos.

```html
<section class="painel__secao painel__secao--agendamentos"
         role="region"
         aria-labelledby="agendamentos-titulo">

  <header class="painel__secao-cabecalho">
    <h2 id="agendamentos-titulo" class="painel__secao-titulo">
      Agendamentos do Dia
    </h2>
  </header>

  <div class="painel__busca">
    <label for="busca-agendamentos" class="sr-only">
      Buscar agendamento por nome do paciente ou médico
    </label>
    <div class="painel__busca-campo">
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <input type="search"
             id="busca-agendamentos"
             class="painel__busca-input"
             placeholder="Buscar paciente ou médico…"
             maxlength="100"
             autocomplete="off"
             title="Atalho: Alt + R">
    </div>
  </div>

  <!-- Estados da seção -->
  <div id="agendamentos-carregando" class="painel__estado painel__estado--loading"
       role="status" aria-busy="true" hidden>
    <div class="painel__spinner" aria-hidden="true"></div>
    <span>Carregando dados...</span>
  </div>

  <div id="agendamentos-vazio" class="painel__estado painel__estado--vazio" hidden>
    <i class="fa-solid fa-calendar-xmark painel__estado-icone" aria-hidden="true"></i>
    <p>Nenhum agendamento para hoje.</p>
    <a href="../Agenda-medica/agenda-geral.html"
       class="painel__btn painel__btn--primary">
      Abrir Agenda
    </a>
  </div>

  <div id="agendamentos-erro" class="painel__estado painel__estado--erro"
       role="alert" hidden>
    <i class="fa-solid fa-triangle-exclamation painel__estado-icone" aria-hidden="true"></i>
    <p>Não foi possível carregar os agendamentos.</p>
    <button type="button" id="btn-retry-agendamentos"
            class="painel__btn painel__btn--secondary">
      Tentar novamente
    </button>
  </div>

  <!-- Lista principal -->
  <ul id="lista-agendamentos"
      class="painel__lista-agendamentos"
      aria-label="Lista de agendamentos do dia"
      aria-live="polite"
      hidden>
    <!-- Itens injetados via JS -->
  </ul>

</section>
```

**Template de item de agendamento** (string gerada via JS):

```html
<li class="painel__agendamento painel__agendamento--{status}"
    data-agendamento-id="{id}">

  <div class="painel__agendamento-hora" aria-hidden="true">{HH:MM}</div>

  <div class="painel__agendamento-corpo">
    <strong class="painel__agendamento-paciente">{nome do paciente}</strong>
    <span class="painel__agendamento-detalhe">
      {nome do médico} · {especialidade}
    </span>
    <span class="painel__badge painel__badge--{status}"
          aria-label="Status: {rótulo}">{rótulo}</span>
  </div>

  <div class="painel__agendamento-acoes">
    <label for="sel-status-{id}" class="sr-only">
      Status de {nome do paciente}
    </label>
    <select id="sel-status-{id}"
            class="painel__status-select"
            data-agendamento-id="{id}"
            aria-label="Alterar status de {nome do paciente}">
      <option value="agendado">Agendado</option>
      <option value="confirmado">Confirmado</option>
      <option value="espera">Em Atendimento</option>
      <option value="atendido">Concluído</option>
      <option value="nao-compareceu">Faltou</option>
      <option value="cancelado">Cancelado</option>
    </select>

    <button type="button"
            class="painel__btn painel__btn--chegada"
            data-agendamento-id="{id}"
            aria-label="Registrar chegada de {nome do paciente}">
      <i class="fa-solid fa-person-walking-arrow-right" aria-hidden="true"></i>
      <span>Chegada</span>
    </button>

    <a href="../Agenda-medica/agenda-geral.html?data={YYYY-MM-DD}"
       class="painel__btn painel__btn--link"
       aria-label="Ver agendamento de {nome do paciente} na Agenda">
      <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
      <span class="sr-only">Ver na Agenda</span>
    </a>
  </div>
</li>
```

### 3.5 Fila de Espera

```html
<section class="painel__secao painel__secao--fila"
         role="region"
         aria-labelledby="fila-titulo">

  <header class="painel__secao-cabecalho">
    <h2 id="fila-titulo" class="painel__secao-titulo">Fila de Espera</h2>
    <span id="fila-contador"
          class="painel__contador"
          aria-live="polite"
          aria-atomic="true">0 paciente(s) aguardando</span>
  </header>

  <div id="fila-carregando" class="painel__estado painel__estado--loading"
       role="status" aria-busy="true" hidden>
    <div class="painel__spinner" aria-hidden="true"></div>
    <span>Carregando dados...</span>
  </div>

  <div id="fila-vazio" class="painel__estado painel__estado--vazio" hidden>
    <i class="fa-solid fa-couch painel__estado-icone" aria-hidden="true"></i>
    <p>Nenhum paciente na fila de espera no momento.</p>
  </div>

  <div id="fila-erro" class="painel__estado painel__estado--erro"
       role="alert" hidden>
    <i class="fa-solid fa-triangle-exclamation painel__estado-icone" aria-hidden="true"></i>
    <p>Não foi possível carregar a fila de espera.</p>
    <button type="button" id="btn-retry-fila"
            class="painel__btn painel__btn--secondary">
      Tentar novamente
    </button>
  </div>

  <ul id="lista-fila"
      class="painel__lista-fila"
      aria-label="Fila de espera"
      hidden>
    <!-- Cards injetados via JS -->
  </ul>

</section>
```

**Template de Cartão de Paciente na Fila** (string gerada via JS):

```html
<li class="painel__card-fila painel__card-fila--{urgencia}"
    data-agendamento-id="{id}"
    aria-label="{nome do paciente} — aguardando {N} minuto(s)">

  <div class="painel__card-fila-topo">
    <strong class="painel__card-fila-paciente">{nome do paciente}</strong>
    <span class="painel__card-fila-espera painel__card-fila-espera--{urgencia}"
          aria-label="Tempo de espera: {N} minutos">
      <i class="fa-regular fa-clock" aria-hidden="true"></i>
      {N} min
    </span>
  </div>

  <div class="painel__card-fila-info">
    <span>{nome do médico} · {especialidade}</span>
    <span>Chegou: <time datetime="{ISO}">{HH:MM}</time></span>
    <span class="painel__badge painel__badge--tipo">{tipo}</span>
  </div>

  <div class="painel__card-fila-acoes">
    <a href="../Atendimento-do-paciente-na-recepcao/atendimento-recepcao.html?pacienteId={id}"
       class="painel__btn painel__btn--sm"
       aria-label="Ver ficha de {nome do paciente}">
      <i class="fa-solid fa-file-medical" aria-hidden="true"></i>
      <span>Ficha</span>
    </a>
    <a href="../Cadastro-paciente/cadastro-paciente.html?pacienteId={id}"
       class="painel__btn painel__btn--sm painel__btn--secondary"
       aria-label="Ver cadastro de {nome do paciente}">
      <i class="fa-solid fa-user" aria-hidden="true"></i>
      <span>Cadastro</span>
    </a>
  </div>
</li>
```

### 3.6 Status dos Médicos

```html
<section class="painel__secao painel__secao--medicos"
         role="region"
         aria-labelledby="medicos-titulo">

  <header class="painel__secao-cabecalho">
    <h2 id="medicos-titulo" class="painel__secao-titulo">Status dos Médicos</h2>
  </header>

  <div id="medicos-carregando" class="painel__estado painel__estado--loading"
       role="status" aria-busy="true" hidden>
    <div class="painel__spinner" aria-hidden="true"></div>
    <span>Carregando dados...</span>
  </div>

  <div id="medicos-vazio" class="painel__estado painel__estado--vazio" hidden>
    <i class="fa-solid fa-user-doctor painel__estado-icone" aria-hidden="true"></i>
    <p>Nenhum médico ativo cadastrado.</p>
  </div>

  <div id="medicos-erro" class="painel__estado painel__estado--erro"
       role="alert" hidden>
    <i class="fa-solid fa-triangle-exclamation painel__estado-icone" aria-hidden="true"></i>
    <p>Não foi possível carregar os dados dos médicos.</p>
    <button type="button" id="btn-retry-medicos"
            class="painel__btn painel__btn--secondary">
      Tentar novamente
    </button>
  </div>

  <ul id="lista-medicos"
      class="painel__lista-medicos"
      aria-label="Status dos médicos"
      hidden>
    <!-- Cards injetados via JS -->
  </ul>

</section>
```

**Template de Cartão de Médico** (string gerada via JS):

```html
<li class="painel__card-medico"
    data-medico-id="{id}"
    aria-label="{nome do médico} — {rótulo do status}">

  <div class="painel__card-medico-topo">
    <div class="painel__card-medico-avatar" aria-hidden="true">
      <i class="fa-solid fa-user-doctor"></i>
    </div>
    <div class="painel__card-medico-info">
      <strong class="painel__card-medico-nome">{nome completo}</strong>
      <span class="painel__card-medico-esp">{especialidade}</span>
    </div>
    <span class="painel__badge painel__badge--status-medico painel__badge--{status-interno}"
          aria-label="Status: {rótulo}">{rótulo}</span>
  </div>

  <div class="painel__card-medico-proximo">
    <span class="painel__card-medico-proximo-rotulo">Próximo paciente</span>
    <span id="proximo-{id}" class="painel__card-medico-proximo-valor">
      {nome do paciente às HH:MM}
      <!-- ou "Sem próximos agendamentos hoje." -->
    </span>
  </div>

  <div class="painel__card-medico-controle">
    <label for="sel-medico-{id}" class="sr-only">
      Alterar status de {nome do médico}
    </label>
    <select id="sel-medico-{id}"
            class="painel__status-select painel__status-select--medico"
            data-medico-id="{id}"
            aria-label="Status de {nome do médico}">
      <option value="disponivel">Disponível</option>
      <option value="em-consulta">Em Consulta</option>
      <option value="em-pausa">Em Pausa</option>
      <option value="ausente">Ausente</option>
    </select>
  </div>
</li>
```

### 3.7 Sistema de Toast

```html
<!-- Inserido no final do <body> -->
<div id="toast-container"
     class="painel__toast-container"
     aria-label="Notificações do sistema">
  <!-- Toasts injetados dinamicamente via JS -->
</div>
```

**Template de Toast** (string gerada via JS):

```html
<div class="painel__toast painel__toast--{tipo}"
     role="{role}"
     aria-live="{politeness}"
     aria-atomic="true">
  <div class="painel__toast-icone" aria-hidden="true">
    <i class="fa-solid {icone-fa}"></i>
  </div>
  <span class="painel__toast-mensagem">{mensagem}</span>
  <button type="button"
          class="painel__toast-fechar"
          aria-label="Fechar notificação">
    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
  </button>
</div>
```

> `role="status"` para toasts de sucesso e info; `role="alert"` para toasts de erro e aviso.

### 3.8 Estados de Interface

Cada seção possui três estados adicionais gerenciados pelo atributo `hidden`:

| Estado       | Elemento                | Atributo         | Quando exibido                                |
|-------------|-------------------------|------------------|-----------------------------------------------|
| Carregando  | `.painel__estado--loading` | `aria-busy="true"` | Enquanto lê do localStorage (máx. 2s)       |
| Vazio       | `.painel__estado--vazio`   | —                 | Carregamento OK, mas sem dados para o dia    |
| Erro        | `.painel__estado--erro`    | `role="alert"`    | Exceção ao ler/escrever no localStorage      |

---

## Architecture

### 4. Arquitetura do Módulo JavaScript

### 4.1 CONFIG — Constantes de Configuração

```js
'use strict';

const CONFIG = {
    // Chaves do localStorage
    storageKeys: {
        agendamentos:  'GM4med.agenda.agendamentos.v2',
        medicos:       'GM4med.cadastros.medicos.v1',
        statusMedicos: 'GM4med.status.medicos',
        chegadas:      'GM4med.painel.chegadas'
    },

    // Intervalos de timer (em milissegundos)
    intervalos: {
        relogio:    1_000,   // atualiza relógio a cada 1s
        fila:      60_000,   // atualiza tempos de espera a cada 60s
        carregamento: 2_000  // timeout máximo de carregamento
    },

    // Limiares de urgência da fila (em minutos)
    limiares: {
        alerta:  30,   // > 30 min → âmbar
        critico: 60    // > 60 min → vermelho
    },

    // Toast
    toast: {
        limite:        5,
        duracaoSucesso: 4_000,
        duracaoInfo:    4_000,
        duracaoAviso:   6_000
        // erros: sem auto-dismiss (persistentes)
    },

    // Busca
    maxCaracteresBusca: 100
};
```

### 4.2 RÓTULOS — Constantes de Texto

```js
const ROTULOS_STATUS_AGENDAMENTO = {
    agendado:         'Agendado',
    confirmado:       'Confirmado',
    espera:           'Em Atendimento',
    atendido:         'Concluído',
    cancelado:        'Cancelado',
    'nao-compareceu': 'Faltou'
};

const ROTULOS_STATUS_MEDICO = {
    disponivel:  'Disponível',
    'em-consulta': 'Em Consulta',
    'em-pausa':  'Em Pausa',
    ausente:     'Ausente'
};

const ROTULOS_TIPO = {
    presencial:   'Presencial',
    online:       'Online',
    retorno:      'Retorno',
    procedimento: 'Procedimento'
};

// Médicos fallback — usados quando GM4med.cadastros.medicos.v1 não existe
const MEDICOS_FALLBACK = [
    { id: '1', nome: 'Dr. Carlos Silva',    especialidade: 'Cardiologia',              status: 'Ativo' },
    { id: '2', nome: 'Dra. Ana Paula',      especialidade: 'Dermatologia',             status: 'Ativo' },
    { id: '3', nome: 'Dr. Roberto Lima',    especialidade: 'Ortopedia e Traumatologia', status: 'Ativo' }
];
```

### 4.3 Assinaturas das Funções Principais

```js
/**
 * Bootstrap do módulo. Chamado em DOMContentLoaded.
 * Sequência: carregarDados() → renderizarTudo() → configurarEventos()
 *            → iniciarTimerFila() → iniciarRelogio()
 */
function inicializar() {}

/**
 * Lê todas as chaves do localStorage e popula state.*.
 * Usa carregarDoStorage() para cada chave.
 * Em caso de erro em qualquer chave, registra no console e
 * aciona exibirEstadoSecao(secao, 'erro').
 */
function carregarDados() {}

/**
 * Calcula e renderiza os 4 cards do resumo operacional.
 * Total = agendamentos do dia.
 * Atendidos = status 'atendido'.
 * Aguardando = status 'espera' + status 'confirmado' (com chegada registrada).
 * Faltou/Cancelado = status 'nao-compareceu' + 'cancelado'.
 * Invariante: Total === Atendidos + Aguardando + Faltou/Cancelado.
 * Atualiza aria-label de cada card.
 */
function renderizarResumo() {}

/**
 * Renderiza a lista de agendamentos do dia com filtro textual opcional.
 * @param {string} [filtro=''] - Texto a filtrar por paciente ou médico
 * Ordena por horário crescente.
 * Ativa estado vazio se nenhum resultado.
 */
function renderizarAgendamentos(filtro = '') {}

/**
 * Renderiza os cartões da fila de espera.
 * Filtra chegadas do dia atual.
 * Ordena por horaChegada crescente.
 * Calcula urgencia via calcularUrgencia(chegada).
 */
function renderizarFilaEspera() {}

/**
 * Renderiza os cartões de status dos médicos.
 * Usa apenas médicos com status 'Ativo'.
 * Para cada médico, busca próximo paciente via calcularProximoPaciente(medicoId).
 */
function renderizarStatusMedicos() {}

/**
 * Registra chegada de um paciente.
 * Pré-condição: agendamento.status === 'confirmado'.
 * Efeitos:
 *   1. Cria RegistroChegada em state.chegadas[id]
 *   2. Persiste chegadas no localStorage (com rollback em falha)
 *   3. Altera status do agendamento para 'espera' via atualizarStatusAgendamento()
 * @param {string} agendamentoId
 * @throws Exibe toast de erro se status !== 'confirmado'
 */
function registrarChegada(agendamentoId) {}

/**
 * Persiste alteração de status de agendamento.
 * Efeitos em cascata (ver seção 5).
 * Emite GM4med:painel-status-changed.
 * Atualiza snapshot antes de escrever (para rollback).
 * @param {string} agendamentoId
 * @param {string} novoStatus - Valor interno (ex: 'espera', 'atendido')
 */
function atualizarStatusAgendamento(agendamentoId, novoStatus) {}

/**
 * Persiste alteração de status de médico.
 * Atualiza state.statusMedicos[medicoId].
 * Emite GM4med:painel-status-changed.
 * @param {string} medicoId
 * @param {string} novoStatus - "disponivel"|"em-consulta"|"em-pausa"|"ausente"
 */
function atualizarStatusMedico(medicoId, novoStatus) {}

/**
 * Calcula o tempo de espera estimado em minutos inteiros não negativos.
 * @param {string} horaChegadaISO - Timestamp ISO 8601 da chegada
 * @param {Date}   [agora=new Date()] - Momento de referência (injetável para testes)
 * @returns {number} Math.floor((agora - chegada) / 60000), mínimo 0
 */
function calcularTempoEspera(horaChegadaISO, agora = new Date()) {}

/**
 * Retorna a classe de urgência para um tempo de espera.
 * @param {number} minutos
 * @returns {"normal"|"aviso"|"critico"}
 */
function calcularUrgencia(minutos) {}

/**
 * Determina o próximo paciente agendado para um médico.
 * Critério: menor horário com status 'agendado' ou 'confirmado',
 *           data === hoje, hora > hora atual.
 * @param {string} medicoId
 * @returns {Agendamento|null}
 */
function calcularProximoPaciente(medicoId) {}

/**
 * Inicia setInterval de 60s para atualizar tempos de espera.
 * Armazena o ID em state.timerFila para limpeza posterior.
 */
function iniciarTimerFila() {}

/**
 * Inicia setInterval de 1s para atualizar o relógio.
 * Armazena o ID em state.timerRelogio.
 */
function iniciarRelogio() {}

/**
 * Wrapper de leitura do localStorage com try/catch.
 * @param {string} chave
 * @param {*}      valorPadrao - Retornado em caso de erro ou chave ausente
 * @returns {*} Dado parseado ou valorPadrao
 */
function carregarDoStorage(chave, valorPadrao) {}

/**
 * Wrapper de escrita no localStorage com try/catch.
 * Em caso de exceção: exibe toast de erro e retorna false.
 * @param {string} chave
 * @param {*}      valor
 * @returns {boolean} true em sucesso, false em falha
 */
function salvarNoStorage(chave, valor) {}

/**
 * Exibe um toast de notificação.
 * Gerencia deduplicação e limite de CONFIG.toast.limite toasts simultâneos.
 * @param {string}  mensagem
 * @param {"success"|"error"|"warning"|"info"} tipo
 * @param {number}  [duracao] - Override da duração padrão; undefined = persistente
 */
function exibirToast(mensagem, tipo, duracao) {}

/**
 * Emite evento customizado GM4med:painel-status-changed no window.
 * @param {"agendamento"|"medico"} entityType
 * @param {string} entityId
 * @param {string} newStatus
 */
function emitirEventoStatusChanged(entityType, entityId, newStatus) {}

/**
 * Handler para document.visibilitychange.
 * Quando visibilityState === 'visible', chama carregarDados()
 * e re-renderiza todas as seções.
 */
function recarregarAoVoltar() {}

/**
 * Implementa focus trap dentro de um modal.
 * @param {KeyboardEvent} event
 * @param {HTMLElement}   modal
 */
function manterFocoNoModal(event, modal) {}

/**
 * Controla a visibilidade de estados de uma seção.
 * @param {"agendamentos"|"fila"|"medicos"} secao
 * @param {"carregando"|"vazio"|"erro"|"conteudo"} estado
 */
function exibirEstadoSecao(secao, estado) {}

/**
 * Formata data para exibição no formato dd/mm/aaaa.
 * @param {string} dataISO - "YYYY-MM-DD"
 * @returns {string} "dd/mm/aaaa"
 */
function formatarData(dataISO) {}

/**
 * Retorna a data atual no formato "YYYY-MM-DD" (fuso horário local).
 * @returns {string}
 */
function dataHoje() {}

/**
 * Escapa caracteres HTML especiais para prevenir XSS.
 * @param {*} valor
 * @returns {string}
 */
function escapeHTML(valor) {}
```

### 4.4 Fluxo de Inicialização

```
DOMContentLoaded
     │
     ▼
inicializar()
     │
     ├─► carregarDados()
     │        ├── carregarDoStorage(storageKeys.agendamentos, [])
     │        ├── carregarDoStorage(storageKeys.medicos, MEDICOS_FALLBACK)
     │        ├── carregarDoStorage(storageKeys.statusMedicos, {})
     │        └── carregarDoStorage(storageKeys.chegadas, {})
     │
     ├─► renderizarTudo()
     │        ├── renderizarResumo()
     │        ├── renderizarAgendamentos()
     │        ├── renderizarFilaEspera()
     │        └── renderizarStatusMedicos()
     │
     ├─► configurarEventos()
     │        ├── input#busca-agendamentos → renderizarAgendamentos(filtro)
     │        ├── select.painel__status-select → atualizarStatusAgendamento()
     │        ├── button.painel__btn--chegada → registrarChegada()
     │        ├── select.painel__status-select--medico → atualizarStatusMedico()
     │        ├── button#btn-retry-* → carregarDados() + re-render seção
     │        ├── keydown Escape → btn-voltar.click()
     │        ├── keydown Alt+R → busca-agendamentos.focus()
     │        └── document visibilitychange → recarregarAoVoltar()
     │
     ├─► iniciarTimerFila()      → setInterval(renderizarFilaEspera, 60_000)
     └─► iniciarRelogio()        → setInterval(atualizarRelogio, 1_000)
```

### 4.5 Fluxo de `registrarChegada(agendamentoId)`

```
registrarChegada(id)
  │
  ├─ Busca agendamento em state.agendamentos
  ├─ SE status !== 'confirmado': exibirToast(erro) e retorna
  │
  ├─ Cria RegistroChegada com horaChegada = new Date().toISOString()
  ├─ state.chegadas[id] = registro
  │
  ├─ salvarNoStorage(storageKeys.chegadas, state.chegadas)
  │     └─ SE falha: rollback de state.chegadas, exibirToast(erro), retorna
  │
  ├─ atualizarStatusAgendamento(id, 'espera')
  │     └─ (aciona cascata para status do médico — ver seção 5)
  │
  ├─ renderizarFilaEspera()
  ├─ renderizarResumo()
  └─ exibirToast('Chegada registrada para {paciente}.', 'success')
```

---

### 5. Regras de Transição de Estado

### 5.1 Máquina de Estados dos Agendamentos

```
                    ┌──────────┐
                    │ agendado │
                    └────┬─────┘
               confirmar │
                    ┌────▼──────┐
                    │ confirmado│◄──────────────────┐
                    └────┬──────┘                   │
          Registrar      │          cancelar         │
          Chegada        │      ┌────────────┐       │
                    ┌────▼──────►  cancelado │       │
                    │  espera  │             │       │
                    └────┬─────┘             │       │
               concluir  │                   │       │
                    ┌────▼──────┐            │       │
                    │  atendido │            │       │
                    └───────────┘            │       │
                                             │       │
             ┌───────────────┐               │       │
             │ nao-compareceu│               │       │
             └───────────────┘               └───────┘
```

### 5.2 Cascata de Status: Agendamento → Médico

| Evento no Agendamento                  | Status Médico Anterior | Novo Status Médico |
|----------------------------------------|------------------------|--------------------|
| Status → `espera` (Em Atendimento)     | `disponivel`           | `em-consulta`      |
| Status → `espera` (Em Atendimento)     | qualquer outro         | sem mudança        |
| Status → `atendido` (Concluído)        | qualquer               | `disponivel` ¹      |
| Status → `cancelado` ou `nao-compareceu` | qualquer             | sem mudança        |

¹ **Condição para `disponivel`:** o médico só volta para `disponivel` se **não houver outro agendamento com status `espera`** vinculado a ele na data atual. Se houver, o status do médico permanece `em-consulta`.

```js
// Pseudocódigo da lógica de cascata
function cascatarStatusMedico(agendamento, novoStatus) {
    const medicoId = agendamento.medicoId;
    const statusAtual = state.statusMedicos[medicoId]?.status ?? 'disponivel';

    if (novoStatus === 'espera' && statusAtual === 'disponivel') {
        atualizarStatusMedico(medicoId, 'em-consulta');
    }

    if (novoStatus === 'atendido') {
        const temOutroAtivo = state.agendamentos.some(a =>
            a.medicoId === medicoId &&
            a.id !== agendamento.id &&
            a.status === 'espera' &&
            a.data === dataHoje()
        );
        if (!temOutroAtivo) {
            atualizarStatusMedico(medicoId, 'disponivel');
        }
    }
}
```

### 5.3 Cores de Status do Médico

| Status        | Variável CSS            | Cor hex (fallback) |
|--------------|-------------------------|--------------------|
| `disponivel`  | `--painel-success`      | `#16A34A`          |
| `em-consulta` | `--color-primary`       | `#0D9488`          |
| `em-pausa`    | `--painel-warning`      | `#D97706`          |
| `ausente`     | `--painel-danger`       | `#DC2626`          |

### 5.4 Escalada de Cor na Fila de Espera

```
Tempo de espera T (minutos inteiros, sempre ≥ 0)
│
├─ 0 ≤ T ≤ 30   → urgência "normal"   → sem destaque especial
├─ 30 < T ≤ 60  → urgência "aviso"    → borda âmbar, ícone ⚠
└─ T > 60        → urgência "critico"  → borda vermelha, ícone ⛔
```

```js
function calcularUrgencia(minutos) {
    if (minutos > CONFIG.limiares.critico) return 'critico';
    if (minutos > CONFIG.limiares.alerta)  return 'aviso';
    return 'normal';
}
```

---

### 6. Arquitetura CSS

### 6.1 Convenção de Nomenclatura (BEM-like)

O módulo utiliza o prefixo `.painel__` para todos os seletores locais, evitando colisões com outros módulos:

```
.painel__[bloco]                   ← elemento raiz de um componente
.painel__[bloco]-[elemento]        ← parte interna de um componente
.painel__[bloco]--[modificador]    ← variação de um componente
```

Exemplos:
- `.painel__metrica` — card de métrica
- `.painel__metrica-valor` — o número grande dentro do card
- `.painel__metrica--total` — card de total (variação por cor)
- `.painel__badge--espera` — badge com cor de "Em Atendimento"

### 6.2 Novas Variáveis CSS (além do design system existente)

```css
:root {
    /* Cores semânticas locais */
    --painel-success:     #16A34A;
    --painel-success-bg:  #F0FDF4;
    --painel-warning:     #D97706;
    --painel-warning-bg:  #FFFBEB;
    --painel-danger:      #DC2626;
    --painel-danger-bg:   #FEF2F2;

    /* Layout do painel */
    --painel-topbar-height:   64px;
    --painel-resumo-height:   auto;
    --painel-col-min-width:   280px;
    --painel-gap:             var(--space-5);   /* 1.25rem */

    /* Animações */
    --painel-anim-saida:      200ms ease-out;
    --painel-anim-entrada:    200ms ease-in;

    /* Fila de espera */
    --painel-fila-aviso-cor:    var(--painel-warning);
    --painel-fila-critico-cor:  var(--painel-danger);
}
```

### 6.3 Estilos-Chave dos Componentes

**Topbar:**

```css
.painel__topbar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    height: var(--painel-topbar-height);
    background: linear-gradient(135deg, #134E4A 0%, #0F766E 100%);
    color: var(--color-white);
}
```

**Cards de Métrica:**

```css
.painel__resumo-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
}

.painel__metrica {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
}

.painel__metrica-valor {
    font-size: var(--font-xl);
    font-weight: 800;
    line-height: 1;
}

/* Modificadores de cor semântica */
.painel__metrica--total    .painel__metrica-icone { color: var(--color-primary); }
.painel__metrica--atendidos .painel__metrica-icone { color: var(--painel-success); }
.painel__metrica--aguardando .painel__metrica-icone { color: var(--painel-warning); }
.painel__metrica--faltou   .painel__metrica-icone { color: var(--painel-danger); }
```

**Grade Principal:**

```css
.painel__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(var(--painel-col-min-width), 1fr));
    gap: var(--painel-gap);
    padding: var(--painel-gap);
    align-items: start;
}
```

**Seções:**

```css
.painel__secao {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
}

.painel__secao-cabecalho {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border-light);
}

.painel__secao-titulo {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--color-text);
}
```

**Badges:**

```css
.painel__badge {
    display: inline-flex;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: var(--font-xs);
    font-weight: 700;
    white-space: nowrap;
}

.painel__badge--agendado       { color: var(--status-agendado);   background: var(--status-agendado-bg); }
.painel__badge--confirmado     { color: var(--status-confirmado); background: var(--status-confirmado-bg); }
.painel__badge--espera         { color: var(--status-espera);     background: var(--status-espera-bg); }
.painel__badge--atendido       { color: var(--status-atendido);   background: var(--status-atendido-bg); }
.painel__badge--cancelado      { color: var(--status-cancelado);  background: var(--status-cancelado-bg); }
.painel__badge--nao-compareceu { color: var(--status-nao-compareceu); background: var(--status-nao-compareceu-bg); }

/* Status do médico */
.painel__badge--disponivel  { color: var(--painel-success);  background: var(--painel-success-bg); }
.painel__badge--em-consulta { color: var(--color-primary);   background: var(--color-primary-bg); }
.painel__badge--em-pausa    { color: var(--painel-warning);  background: var(--painel-warning-bg); }
.painel__badge--ausente     { color: var(--painel-danger);   background: var(--painel-danger-bg); }
```

**Cards da Fila de Espera — Escalada de Cor:**

```css
.painel__card-fila {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius);
    border: 1px solid var(--color-border);
    margin-bottom: var(--space-2);
    transition: border-color var(--transition-base);
}

.painel__card-fila--aviso {
    border-color: var(--painel-fila-aviso-cor);
    border-left-width: 4px;
}

.painel__card-fila--critico {
    border-color: var(--painel-fila-critico-cor);
    border-left-width: 4px;
    background: var(--painel-danger-bg);
}

.painel__card-fila-espera--aviso   { color: var(--painel-warning); font-weight: 700; }
.painel__card-fila-espera--critico { color: var(--painel-danger);  font-weight: 800; }
```

### 6.4 Responsividade

```css
/* ≥ 1280px — 3 colunas */
@media (min-width: 1280px) {
    .painel__grid {
        grid-template-columns: repeat(3, minmax(var(--painel-col-min-width), 1fr));
    }
    .painel__resumo-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* 768px – 1279px — 2 colunas */
@media (min-width: 768px) and (max-width: 1279px) {
    .painel__grid {
        grid-template-columns: 1fr 1fr;
    }
    .painel__secao--agendamentos {
        grid-column: 1;
        grid-row: 1;
    }
    .painel__secao--fila {
        grid-column: 2;
        grid-row: 1;
    }
    .painel__secao--medicos {
        grid-column: 2;
        grid-row: 2;
    }
    .painel__resumo-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* < 768px — coluna única com acordeões */
@media (max-width: 767px) {
    .painel__grid {
        grid-template-columns: 1fr;
    }
    .painel__resumo-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    /* Acordeões: cabeçalho vira botão toggle */
    .painel__secao-cabecalho {
        cursor: pointer;
    }
    .painel__secao-corpo {
        overflow: hidden;
        transition: max-height var(--transition-slow);
    }
    .painel__secao[aria-expanded="false"] .painel__secao-corpo {
        max-height: 0;
    }
    .painel__secao[aria-expanded="true"] .painel__secao-corpo {
        max-height: 9999px; /* colapsado via JS com valor real */
    }
}
```

> Em mobile, o JavaScript controla `aria-expanded` nos elementos `<section>` e o CSS reage via seletor de atributo.

### 6.5 Animações

```css
/* Saída de card da fila (ao ser marcado como Concluído) */
@keyframes painel-card-sair {
    from {
        opacity: 1;
        transform: translateX(0);
        max-height: 200px;
    }
    to {
        opacity: 0;
        transform: translateX(40px);
        max-height: 0;
        margin-bottom: 0;
        padding-top: 0;
        padding-bottom: 0;
    }
}

.painel__card-fila--saindo {
    animation: painel-card-sair var(--painel-anim-saida) ease-out forwards;
}

/* Spinner de carregamento */
@keyframes painel-girar {
    to { transform: rotate(360deg); }
}

.painel__spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: painel-girar 0.8s linear infinite;
}

/* Toast de entrada */
@keyframes painel-toast-entrar {
    from { opacity: 0; transform: translateX(100%); }
    to   { opacity: 1; transform: translateX(0); }
}

.painel__toast {
    animation: painel-toast-entrar 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Redução de movimento */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

### 7. Implementação de Acessibilidade

### 7.1 ARIA Roles e Atributos por Componente

| Componente               | Role / Atributo                                                               |
|--------------------------|-------------------------------------------------------------------------------|
| `<header>` topbar        | `role="banner"`                                                               |
| `<main>`                 | `role="main"`, `id="main-content"`                                            |
| Seção Resumo             | `role="region"`, `aria-labelledby="resumo-titulo"`                            |
| Seção Agendamentos       | `role="region"`, `aria-labelledby="agendamentos-titulo"`                      |
| Seção Fila               | `role="region"`, `aria-labelledby="fila-titulo"`, `aria-live="polite"`        |
| Seção Médicos            | `role="region"`, `aria-labelledby="medicos-titulo"`                           |
| Cards de métrica         | `aria-label="[nome] hoje: [valor]"` atualizado a cada mudança                 |
| Valores das métricas     | `aria-live="polite"`, `aria-atomic="true"`                                    |
| Estado carregando        | `role="status"`, `aria-busy="true"`                                           |
| Estado erro              | `role="alert"`                                                                |
| Toast sucesso/info       | `role="status"`, `aria-live="polite"`, `aria-atomic="true"`                   |
| Toast erro/aviso         | `role="alert"`, `aria-live="assertive"`, `aria-atomic="true"`                 |
| Cartões de fila          | `aria-label="{paciente} — aguardando {N} minuto(s)"`                          |
| Cartões de médico        | `aria-label="{nome} — {status}"` atualizado a cada mudança                   |
| Seletor de status        | `aria-label="Alterar status de {paciente}"`, `aria-describedby` em erro       |
| Botão Registrar Chegada  | `aria-label="Registrar chegada de {paciente}"`                                |
| Contador da fila         | `aria-live="polite"`, `aria-atomic="true"`                                    |
| Acordeões mobile         | `aria-expanded="true|false"` na `<section>`, `aria-controls` no botão        |

### 7.2 Regiões Live — Configuração

```
aria-live="polite"  → Resumo Operacional, Fila de Espera, contador da fila,
                       valores dos cards de métrica
aria-live="off"     → Relógio (atualização a cada 1s não deve interromper leitura)
aria-live           → não necessário em seções que usam role="alert" (implícito assertive)
```

### 7.3 Gestão de Foco

**Ao registrar chegada / alterar status:**

```
Usuário aciona controle (select ou botão)
     │
     ▼
Operação concluída (ou falha)
     │
     ▼
Retornar foco ao controle que disparou a ação
(salvo em state.ultimoElementoFocado antes da operação)
     │
     ├─ Sucesso: foco no mesmo controle, toast via aria-live
     └─ Erro: foco no controle, mensagem de erro via aria-describedby
```

**Focus trap em modais (se utilizados):**

```js
function manterFocoNoModal(event, modal) {
    const seletorFocavel = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const focaveis = [...modal.querySelectorAll(seletorFocavel)]
        .filter(el => el.offsetParent !== null);

    if (!focaveis.length) return;

    const primeiro = focaveis[0];
    const ultimo   = focaveis[focaveis.length - 1];

    if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
    }
}
```

### 7.4 Atalhos de Teclado

| Tecla     | Ação                                                      |
|-----------|-----------------------------------------------------------|
| `Escape`  | Redireciona para Menu-Principal.html                      |
| `Alt + R` | Move o foco para o campo de busca de agendamentos         |
| `Tab`     | Navega entre todos os controles interativos               |
| `Enter`   | Aciona botão ou link focado                               |

```js
document.addEventListener('keydown', event => {
    // Atalho Alt + R
    if (event.altKey && event.key === 'r') {
        event.preventDefault();
        document.getElementById('busca-agendamentos')?.focus();
        return;
    }
    // Escape → voltar
    if (event.key === 'Escape') {
        document.getElementById('btn-voltar')?.click();
    }
});
```

### 7.5 Indicador de Foco

```css
/* Mínimo de 3px, razão de contraste ≥ 3:1 com fundo adjacente */
:focus-visible {
    outline: 3px solid rgb(13 148 136 / 55%);
    outline-offset: 2px;
    border-radius: 2px;
}

/* Para controles sobre fundo escuro (topbar) */
.painel__topbar :focus-visible {
    outline-color: rgb(204 251 241 / 80%);
}
```

### 7.6 Classe `.sr-only`

Rótulos e instruções visíveis apenas para tecnologias assistivas, seguindo o padrão do GM4med:

```css
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
```

---

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro para todas as execuções válidas do sistema — essencialmente, uma declaração formal sobre o que o sistema deve fazer. As propriedades abaixo servem como a ponte entre as especificações em linguagem natural e as garantias de correção verificáveis por testes automatizados.*

### Property 1: Invariante de Soma do Resumo Operacional

*Para qualquer* lista de agendamentos do dia, o valor do card **Total do Dia** é sempre igual à soma dos valores de **Atendidos** + **Aguardando** + **Faltou/Cancelado**.

Em outras palavras: nenhum agendamento pode ser contado em mais de uma categoria, e nenhum pode ser omitido das métricas.

**Validates: Requirements 2.2**

---

### Property 2: Tempo de Espera Sempre Não-Negativo

*Para qualquer* registro de chegada com `horaChegada` ≤ `agora`, o resultado de `calcularTempoEspera(horaChegada, agora)` é sempre um número inteiro ≥ 0, calculado como `Math.floor((agora - chegada) / 60_000)`.

Além disso, *para qualquer* par de timestamps onde `t2 ≥ t1`, `calcularTempoEspera(t1, t2) ≥ calcularTempoEspera(t1, t1)` — ou seja, o tempo de espera nunca decresce enquanto o paciente permanece na fila.

**Validates: Requirements 4.3**

---

### Property 3: Round-trip de Registro de Chegada

*Para qualquer* agendamento com status `confirmado`, após a invocação de `registrarChegada(agendamentoId)`, o agendamento deve aparecer na fila de espera com `Tempo_Espera_Estimado` inicial de 0 minutos, e o agendamento não deve mais aparecer em nenhuma outra posição da fila com um `id` diferente.

**Validates: Requirements 4.7**

---

### Property 4: Limiar de Urgência da Fila é Exclusivo e Exaustivo

*Para qualquer* valor inteiro não-negativo `T` (tempo de espera em minutos), `calcularUrgencia(T)` retorna exatamente um dos valores `"normal"`, `"aviso"` ou `"critico"` — nunca mais de um, nunca nenhum. A partição é:

- `T ≤ 30` → `"normal"`
- `30 < T ≤ 60` → `"aviso"`
- `T > 60` → `"critico"`

**Validates: Requirements 4.4, 4.5**

---

### Property 5: Registro de Chegada é Rejeitado para Status Não-Confirmado

*Para qualquer* agendamento cujo `status` seja diferente de `"confirmado"`, a invocação de `registrarChegada(agendamentoId)` **não deve** criar um `RegistroChegada`, não deve alterar o status do agendamento, e deve exibir uma mensagem de erro.

**Validates: Requirements 4.8**

---

### Property 6: Cascata de Status — Conclusão Libera Médico

*Para qualquer* médico, se após marcar um agendamento como `atendido` **não existir** nenhum outro agendamento com status `espera` para aquele médico na data atual, então o `Status_Medico` do médico deve ser `"disponivel"`.

Formalmente: `atualizarStatusAgendamento(id, 'atendido')` deve satisfazer:

```
SE count(agendamentos, a => a.medicoId = M AND a.status = 'espera' AND a.id ≠ id AND a.data = hoje) = 0
ENTÃO state.statusMedicos[M].status = 'disponivel'
```

**Validates: Requirements 5.8**

---

### Property 7: Cascata de Status — Atendimento Ocupa Médico Disponível

*Para qualquer* médico com `Status_Medico = "disponivel"`, após um de seus agendamentos ter o status alterado para `"espera"`, o `Status_Medico` do médico deve tornar-se `"em-consulta"`.

```
SE state.statusMedicos[M].status = 'disponivel'
   E atualizarStatusAgendamento(id, 'espera') onde agendamento.medicoId = M
ENTÃO state.statusMedicos[M].status = 'em-consulta'
```

**Validates: Requirements 5.7**

---

### Property 8: Round-trip de Persistência de Status

*Para qualquer* agendamento e qualquer valor de status válido `s`, após a invocação bem-sucedida de `atualizarStatusAgendamento(id, s)`, a leitura de `carregarDoStorage(storageKeys.agendamentos, [])` deve retornar o mesmo agendamento com `status === s`.

Da mesma forma, *para qualquer* médico e status válido `s`, após `atualizarStatusMedico(id, s)`, a leitura de `carregarDoStorage(storageKeys.statusMedicos, {})` deve retornar `statusMedicos[id].status === s`.

**Validates: Requirements 3.5, 5.5**

---

### Property 9: Limite de Toasts Simultâneos

*Para qualquer* sequência de N chamadas a `exibirToast()` onde N > `CONFIG.toast.limite` (5), o número de toasts presentes no DOM em qualquer instante é sempre ≤ 5. O toast descartado ao atingir o limite é sempre o mais antigo (FIFO).

**Validates: Requirements 10.3**

---

### Property 10: Emissão de Evento em Toda Mudança de Status

*Para qualquer* alteração de status (de agendamento ou de médico), o evento `GM4med:painel-status-changed` deve ser emitido no `window` com payload contendo exatamente os campos `entityType`, `entityId` e `newStatus` com os valores correspondentes à operação realizada.

```
PARA TODA alteração: atualizarStatusAgendamento(id, s) OU atualizarStatusMedico(id, s)
  evento = { entityType: "agendamento"|"medico", entityId: id, newStatus: s }
  DEVE SER emitido em window
```

**Validates: Requirements 6.7**

---

## Error Handling

### 9.1 Estratégia de Rollback

Antes de qualquer operação de escrita no `localStorage`, o sistema salva um snapshot serializado do estado atual:

```js
function salvarNoStorage(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
        return true;
    } catch (erro) {
        console.error(`[Painel Available] Falha ao salvar "${chave}":`, erro);
        exibirToast(
            'Armazenamento local indisponível. As alterações não foram salvas.',
            'error'
        );
        return false;
    }
}
```

Em `atualizarStatusAgendamento` e `registrarChegada`, o estado em memória só é confirmado se `salvarNoStorage` retornar `true`. Caso contrário, o estado é restaurado do snapshot.

### 9.2 Timeout de Carregamento

Se o carregamento de dados de uma seção não concluir em 2000ms, o estado de erro é exibido automaticamente:

```js
function carregarSecaoComTimeout(secao, carregarFn) {
    exibirEstadoSecao(secao, 'carregando');
    const timer = setTimeout(() => {
        exibirEstadoSecao(secao, 'erro');
        // mensagem: "carregamento demorou mais que o esperado"
    }, CONFIG.intervalos.carregamento);

    try {
        carregarFn();
        clearTimeout(timer);
        exibirEstadoSecao(secao, 'conteudo');
    } catch (e) {
        clearTimeout(timer);
        exibirEstadoSecao(secao, 'erro');
    }
}
```

### 9.3 Independência de Seções

O erro em uma seção não impede a renderização das demais. Cada seção tem seu próprio bloco `try/catch` e seu próprio estado visual (carregando / vazio / erro / conteúdo).

---

## Testing Strategy

### 10.1 Abordagem Dual

A estratégia combina testes de exemplo (unit tests) para comportamentos específicos e testes baseados em propriedades (property-based tests) para invariantes universais.

**Testes de exemplo** — focam em:
- Pontos de integração entre seções (ex: chegada → fila → resumo)
- Comportamentos de UI específicos (ex: 6 opções no seletor de status)
- Estados de erro e borda (ex: localStorage ausente, status inválido)

**Testes de propriedade** — validam as 10 propriedades listadas na seção 8, gerando centenas de inputs aleatórios para cada propriedade.

### 10.2 Bibliotecas de Teste

- **Framework de teste:** Jest (via CDN ou configuração mínima)
- **Property-based testing:** [fast-check](https://fast-check.dev/) — biblioteca JavaScript para PBT
- **Mocking de localStorage:** `jest-localstorage-mock` ou implementação manual com `Map`

### 10.3 Configuração dos Testes de Propriedade

Cada teste de propriedade deve rodar no mínimo **100 iterações** com inputs gerados aleatoriamente.

```js
// Exemplo de configuração com fast-check
import fc from 'fast-check';

// Tag format para rastreabilidade:
// Feature: painel-available, Property {N}: {texto da propriedade}

test('Feature: painel-available, Property 1: invariante de soma do resumo', () => {
    fc.assert(
        fc.property(
            fc.array(agendamentoArbitrary()),
            (agendamentos) => {
                const resultado = calcularMetricas(agendamentos, dataHoje());
                return resultado.total ===
                    resultado.atendidos +
                    resultado.aguardando +
                    resultado.faltou;
            }
        ),
        { numRuns: 100 }
    );
});
```

### 10.4 Cobertura Esperada

| Área                          | Tipo de teste       | Prioridade |
|-------------------------------|---------------------|------------|
| `calcularMetricas()`          | Propriedade (P1)    | Alta       |
| `calcularTempoEspera()`       | Propriedade (P2)    | Alta       |
| `registrarChegada()`          | Propriedade (P3,P5) | Alta       |
| `calcularUrgencia()`          | Propriedade (P4)    | Alta       |
| `cascatarStatusMedico()`      | Propriedade (P6,P7) | Alta       |
| `salvarNoStorage()`           | Exemplo (borda)     | Alta       |
| `exibirToast()` — limite      | Propriedade (P9)    | Média      |
| `emitirEventoStatusChanged()` | Propriedade (P10)   | Média      |
| Round-trip de persistência    | Propriedade (P8)    | Alta       |
| Renderização de estados UI    | Exemplo             | Média      |
| Navegação / atalhos           | Exemplo             | Baixa      |
