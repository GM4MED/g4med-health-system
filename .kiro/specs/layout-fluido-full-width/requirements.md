# Requirements Document

## Introduction

O GM4med é um sistema de gestão médica composto por mais de 20 módulos independentes, cada um com seus próprios arquivos HTML, CSS e JavaScript. Atualmente, vários módulos impõem restrições de largura máxima nos seus contêineres principais (por exemplo, `max-width: 1800px`, `max-width: 1560px`, `max-width: 1640px`, etc.), o que gera margens laterais excessivas e desperdiça espaço útil em monitores de alta resolução (Full HD, 4K, ultrawide).

Esta feature transforma o layout do sistema para **fluido e full-width (100%)**: eliminando as restrições de largura estática em todos os contêineres de estrutura de página, preservando o deslocamento da sidebar de 290px, mantendo espaçamento lateral responsivo para garantir usabilidade, e assegurando que nenhuma funcionalidade existente (JavaScript, IDs, eventos, modais, formulários, tabelas) seja quebrada.

O escopo abrange: `Menu-Principal` (raiz), e todos os módulos ativos — `Agenda-medica`, `Atendimento-do-paciente-na-recepcao`, `Atendimentos`, `Cadastro-de-categoria`, `Cadastro-exame`, `Cadastro-paciente`, `Cadastros-medicos`, `Catalogo`, `convenios`, `Especialidade-medica-utilitarios`, `financeiro`, `Grupo-de-atendimento`, `Grupo-de-exames`, `Grupo-de-procedimentos`, `Grupo-de-tipos-de-atendimento`, `Procedimento-médico`, `Relatorios`, `Siglas`, `Suporte`, `Utilitarios`, além dos arquivos em `estilizacao/`.

---

## Glossary

- **Sistema**: O sistema GM4med como um todo, incluindo todos os módulos.
- **Sidebar**: Barra de navegação lateral fixa de 290px de largura (`--sidebar-width: 290px`), definida em `Menu-Principal.html` e `Menu-Principal.css`.
- **Conteúdo_Principal**: Elemento `<main class="main-content">` ou `#mainContent` que ocupa o restante da largura da viewport após o deslocamento da sidebar.
- **Contêiner_Estrutural**: Elemento HTML de nível de página (`.app-container`, `.app`, `.page`, `.container`, `.container-full`, `.page-full`, `.content`, `#mainContent`) responsável pelo layout geral de um módulo.
- **Restrição_de_Largura**: Regra CSS que limita a largura máxima de um Contêiner_Estrutural a um valor fixo (ex.: `max-width: 1800px`, `width: min(100%, 1560px)`), impedindo o layout de usar toda a viewport.
- **Espaçamento_Lateral**: Padding horizontal aplicado ao Contêiner_Estrutural para evitar que o conteúdo cole nas bordas da tela (ex.: `padding-inline: 1.5rem`).
- **Viewport**: Área visível do navegador.
- **Módulo**: Diretório independente dentro do projeto que contém pelo menos um arquivo `.html`, `.css` e `.js`.
- **Breakpoint**: Valor de largura de viewport usado em media queries (`@media`).
- **Tailwind_CDN**: Biblioteca Tailwind CSS carregada via CDN no `Menu-Principal.html` e utilizada com classes utilitárias.
- **CSS_Customizado**: Arquivo `.css` local de cada módulo, com regras que podem sobrepor ou complementar o Tailwind.
- **Overflow_Horizontal**: Barra de rolagem horizontal indesejada que surge quando algum elemento ultrapassa a largura da viewport.
- **Modal**: Janela flutuante de sobreposição presente nos módulos para formulários, confirmações e detalhes.
- **Toast**: Notificação temporária posicionada de forma fixa (geralmente `position: fixed` no canto inferior ou superior direito).
- **Footer**: Rodapé fixo ou estático presente em alguns módulos.
- **KPI_Card**: Cartão de métrica/indicador exibido em grade, presente em módulos como `Relatorios` e `financeiro`.

---

## Requirements

---

### Requisito 1: Remoção de Restrições de Largura Máxima nos CSS Globais e de Módulos

**User Story:** Como desenvolvedor do GM4med, quero remover todas as restrições de `max-width` estático dos contêineres estruturais de cada módulo, para que o layout ocupe 100% da largura disponível da viewport em qualquer resolução.

#### Critérios de Aceitação

1. THE Sistema SHALL remover ou substituir a regra `width: min(100%, 1800px); margin: 0 auto;` da classe `.app-container` em `Menu-Principal.css` por `width: 100%; max-width: none; margin: 0;`.

2. THE Sistema SHALL remover ou substituir a regra `max-width: 1560px; margin: auto;` da classe `.app` em `Atendimento-do-paciente-na-recepcao/atendimento-recepcao.css` por `width: 100%; max-width: none; margin: 0;`.

3. THE Sistema SHALL remover ou substituir a regra `max-width: 1600px; margin: 0 auto;` da classe `.page` em `Utilitarios/utilitario-logs.css` por `width: 100%; max-width: none; margin: 0;`.

4. THE Sistema SHALL remover ou substituir a regra `max-width: 1640px; margin: 0 auto;` da classe `.page` em `Relatorios/relatorio-atendimentos.css` por `width: 100%; max-width: none; margin: 0;`.

5. THE Sistema SHALL remover ou substituir a regra `max-width: 1400px; margin: auto;` da classe `.container` em `estilizacao/cadastro-siglas.css`, incluindo sua variante `max-width: 1550px` dentro de qualquer bloco `@media`, por `width: 100%; max-width: none; margin: 0;`.

6. THE Sistema SHALL remover ou substituir a regra `max-width: 1400px; margin: 0 auto;` da classe `.content` em `estilizacao/cadastro-usuario.css` por `width: 100%; max-width: none; margin: 0;`.

7. THE Sistema SHALL remover ou substituir as declarações `max-width: 900px` e `margin: 20px auto` da classe `.container` em `estilizacao/agenda.css`, preservando intactas quaisquer outras declarações da mesma regra (como `padding`).

8. WHEN qualquer arquivo CSS de módulo contiver uma declaração `max-width` com valor fixo em pixels aplicada ao seletor raiz do Contêiner_Estrutural — definido como o único seletor de classe de nível de página que envolve todo o conteúdo renderizado pelo módulo e não está aninhado dentro de outro seletor de componente —, THE Sistema SHALL substituir essa declaração por `max-width: none` e remover a declaração `margin: auto` correspondente na mesma regra, inclusive em blocos `@media` que redefinam essa propriedade.

9. IF uma regra `max-width` for aplicada exclusivamente a componentes internos (incluindo, mas não se limitando a: Modais, campos de formulário, parágrafos descritivos e botões) e não ao Contêiner_Estrutural de nível de página, THEN THE Sistema SHALL manter essa regra inalterada.

10. IF um arquivo CSS listado nos critérios 1 a 7 não contiver a regra-alvo descrita no respectivo critério, THEN o critério correspondente SHALL ser considerado satisfeito sem necessidade de alteração nesse arquivo.

---

### Requisito 2: Preservação do Deslocamento da Sidebar no Conteúdo Principal

**User Story:** Como usuário do GM4med, quero que a sidebar de navegação continue ocupando exatamente 290px à esquerda em todos os módulos, sem sobreposição sobre o conteúdo principal.

#### Critérios de Aceitação

1. WHILE a Viewport tiver largura maior que 1024px, THE Conteúdo_Principal SHALL ter sua borda esquerda posicionada a exatamente 290px da borda esquerda da Viewport, sem sobreposição com a Sidebar.

2. WHILE a Viewport tiver largura maior que 1024px, THE Conteúdo_Principal SHALL ter largura computada igual a `largura da Viewport menos 290px`, ocupando toda a área disponível à direita da Sidebar.

3. WHEN a Viewport tiver largura igual ou inferior a 1024px, THE Sidebar SHALL estar invisível e não interativa para o usuário (sem receber eventos de clique nem ser percebida por tecnologias assistivas).

4. WHEN a Viewport tiver largura igual ou inferior a 1024px, THE Conteúdo_Principal SHALL ter largura computada igual a 100% da largura da Viewport, com a borda esquerda posicionada a 0px da borda esquerda da Viewport.

5. WHILE a Viewport tiver largura maior que 1024px, THE rodapé SHALL ter sua borda esquerda posicionada a exatamente 290px da borda esquerda da Viewport e largura computada igual a `largura da Viewport menos 290px`.

6. WHILE a Viewport tiver largura igual ou inferior a 1024px, THE rodapé SHALL ter sua borda esquerda posicionada a 0px da borda esquerda da Viewport e largura computada igual a 100% da largura da Viewport.

---

### Requisito 3: Aplicação de Espaçamento Lateral Responsivo

**User Story:** Como usuário do GM4med, quero que o conteúdo não cole nas bordas da tela, mesmo em layouts full-width, para que a leitura e interação permaneçam confortáveis em qualquer resolução.

#### Critérios de Aceitação

1. THE Sistema SHALL garantir que o Contêiner_Estrutural de cada módulo possua `padding-inline` mínimo de `1rem` (16px) em qualquer largura de viewport.

2. WHILE a Viewport tiver largura entre 0 e 639px, THE Conteúdo_Principal SHALL aplicar `padding-inline: 1rem` (equivalente a `px-4` no Tailwind).

3. WHILE a Viewport tiver largura entre 640px e 1279px, THE Conteúdo_Principal SHALL aplicar `padding-inline: 1.5rem` (equivalente a `px-6` no Tailwind).

4. WHILE a Viewport tiver largura igual ou superior a 1280px, THE Conteúdo_Principal SHALL aplicar `padding-inline: 2rem` (equivalente a `px-8` no Tailwind).

5. THE Sistema SHALL manter `overflow-x: hidden` nos seletores `html` e `body` em todos os módulos para prevenir Overflow_Horizontal causado pela remoção das restrições de largura.

6. WHILE um Contêiner_Estrutural já utilizar layout full-width (identificado pela ausência de `max-width` fixo e `margin: auto`), THE Sistema SHALL preservar o `padding-inline` existente nesse contêiner, garantindo que seu valor resultante seja igual ou superior aos mínimos definidos nos critérios 2, 3 e 4 conforme a largura da viewport atual.

---

### Requisito 4: Atualização do Menu-Principal (Raiz)

**User Story:** Como usuário do GM4med, quero que a página inicial (home) do sistema use a largura total da tela, eliminando as margens laterais brancas que aparecem em monitores ultrawide.

#### Critérios de Aceitação

1. WHEN o módulo `Menu-Principal` for carregado em qualquer viewport, THE Conteúdo_Principal SHALL ocupar toda a largura disponível após a Sidebar (ou 100% da Viewport em mobile), sem `max-width` fixo e sem `margin: auto` reduzindo sua largura.

2. WHEN o módulo `Menu-Principal` for carregado, THE elemento `<main>` SHALL não apresentar nenhuma classe utilitária de limitação de largura máxima aplicada diretamente sobre ele.

3. WHEN o carrossel de imagens do dashboard estiver renderizado, THE carrossel SHALL ocupar toda a largura do Conteúdo_Principal, com borda esquerda e borda direita do carrossel coincidindo com as bordas internas (após padding) do Conteúdo_Principal.

4. WHEN o módulo `Menu-Principal` for redimensionado entre qualquer dois Breakpoints consecutivos definidos no Requisito 7, THE `topbar` SHALL permanecer sem Overflow_Horizontal, sem sobreposição entre seus elementos internos e sem barra de rolagem horizontal.

5. WHILE a Viewport tiver largura maior que 1024px, THE rodapé SHALL ter borda esquerda a 290px da borda esquerda da Viewport e largura computada igual a `largura da Viewport menos 290px`, sem deslocamento causado pela remoção de qualquer Restrição_de_Largura do contêiner pai.

---

### Requisito 5: Atualização dos Módulos com Restrições de Largura Identificadas

**User Story:** Como desenvolvedor do GM4med, quero que cada módulo com Restrição_de_Largura estática seja individualmente atualizado para remover essa restrição, garantindo consistência visual em todo o sistema.

#### Critérios de Aceitação

1. THE Sistema SHALL atualizar o módulo `Atendimento-do-paciente-na-recepcao` removendo `max-width: 1560px` e `margin: auto` da classe `.app` em `atendimento-recepcao.css`, resultando em `width: 100%; max-width: none; margin: 0;` nessa classe.

2. THE Sistema SHALL atualizar o módulo `Utilitarios` (submódulo `utilitario-logs`) removendo `max-width: 1600px` e `margin: 0 auto` da classe `.page` em `utilitario-logs.css`, resultando em `width: 100%; max-width: none; margin: 0;` nessa classe.

3. THE Sistema SHALL atualizar o módulo `Relatorios` removendo `max-width: 1640px` e `margin: 0 auto` da classe `.page` em `relatorio-atendimentos.css`, resultando em `width: 100%; max-width: none; margin: 0;` nessa classe.

4. THE Sistema SHALL atualizar o arquivo `estilizacao/cadastro-siglas.css` removendo `max-width: 1400px`, `max-width: 1550px` e `margin: auto` da classe `.container` em todos os blocos (incluindo `@media`), resultando em `width: 100%; max-width: none; margin: 0;` em todas as ocorrências.

5. THE Sistema SHALL atualizar o arquivo `estilizacao/cadastro-usuario.css` removendo `max-width: 1400px` e `margin: 0 auto` da classe `.content`, resultando em `width: 100%; max-width: none; margin: 0;` nessa classe.

6. THE Sistema SHALL atualizar o arquivo `estilizacao/agenda.css` removendo `max-width: 900px` e `margin: 20px auto` da classe `.container`, mantendo intactas quaisquer outras declarações existentes (como `padding`) nessa regra.

7. THE Sistema SHALL verificar que, nos módulos `Grupo-de-procedimentos`, `Grupo-de-tipos-de-atendimento`, `Grupo-de-atendimento`, `convenios`, `Especialidade-medica-utilitarios`, `Siglas` e `Utilitarios/usuarios`, o elemento raiz de estrutura de página não possui nenhuma das seguintes classes Tailwind aplicadas diretamente: `max-w-xs`, `max-w-sm`, `max-w-md`, `max-w-lg`, `max-w-xl`, `max-w-2xl`, `max-w-3xl`, `max-w-4xl`, `max-w-5xl`, `max-w-6xl`, `max-w-7xl`, `max-w-screen-sm`, `max-w-screen-md`, `max-w-screen-lg`, `max-w-screen-xl`, `max-w-screen-2xl`, `container`, `mx-auto`. Caso alguma dessas classes seja encontrada no elemento raiz de estrutura de página, THE Sistema SHALL removê-la.

8. WHEN um módulo não apresentar nenhuma das classes Tailwind listadas no critério 7 nem nenhuma declaração `max-width` com valor em pixels em seu Contêiner_Estrutural, THE Sistema SHALL manter esse módulo sem nenhuma alteração no elemento raiz de estrutura de página.

---

### Requisito 6: Preservação da Integridade do JavaScript e do DOM

**User Story:** Como desenvolvedor do GM4med, quero garantir que nenhuma alteração de CSS ou HTML quebre o JavaScript existente, incluindo seletores de ID, event listeners e manipulação do DOM.

#### Critérios de Aceitação

1. THE Sistema SHALL manter todos os atributos `id` existentes nos elementos HTML inalterados durante qualquer modificação de layout.

2. WHEN uma Restrição_de_Largura for removida de um arquivo CSS, THE estrutura hierárquica do DOM (relações pai-filho entre elementos) SHALL permanecer inalterada.

3. THE Sistema SHALL manter todos os atributos `aria-*`, `data-*` e `role` existentes inalterados em todos os elementos HTML modificados.

4. IF uma alteração de CSS exigir a adição ou remoção de um elemento HTML envolvente (wrapper), THEN THE Sistema SHALL verificar que nenhum seletor JavaScript (`getElementById`, `querySelector`, `querySelectorAll`, `getElementsByClassName`) faz referência ao elemento alterado; IF tal referência for encontrada, THEN THE Sistema SHALL cancelar a adição/remoção do wrapper e registrar um erro identificando o elemento conflitante antes de proceder de outra forma.

5. WHEN um item de submenu da sidebar for clicado, THE atributo `aria-expanded` do botão correspondente SHALL alternar entre os valores `"true"` e `"false"`, e a classe `is-open` SHALL ser adicionada ou removida do elemento de submenu associado conforme o estado esperado.

6. WHEN uma função de navegação do carrossel do dashboard for invocada, THE índice do slide exibido SHALL ser atualizado para o valor esperado e o slide correspondente SHALL estar visível na área de exibição do carrossel.

7. THE Sistema SHALL garantir que os contêineres de Toast (elementos com classe `.toast`, `.toast-container` e `#toast-container`) mantenham `position: fixed` computado e permaneçam posicionados nas mesmas coordenadas de viewport que apresentavam antes das alterações CSS de full-width.

---

### Requisito 7: Comportamento Responsivo em Múltiplas Resoluções

**User Story:** Como usuário do GM4med, quero que o layout full-width seja usável em qualquer dispositivo ou monitor, desde smartphones (320px) até monitores ultrawide (2560px+), sem quebras visuais ou funcionais.

#### Critérios de Aceitação

1. WHILE a Viewport tiver largura entre 320px e 767px, THE Sistema SHALL exibir o Conteúdo_Principal com largura de 100% da Viewport, sem Overflow_Horizontal (ausência de barra de rolagem horizontal), com espaçamento interno lateral mínimo de 16px em cada lado.

2. WHILE a Viewport tiver largura entre 768px e 1279px, THE Sistema SHALL exibir o Conteúdo_Principal com largura de 100% da Viewport, com a Sidebar não visível e sem espaçamento lateral superior a 16px entre o Conteúdo_Principal e as bordas da Viewport.

3. WHILE a Viewport tiver largura entre 1280px e 1919px, THE Sistema SHALL exibir o Conteúdo_Principal ocupando toda a largura disponível da Viewport excluindo a largura da Sidebar (290px), sem espaço branco não utilizado à direita do Conteúdo_Principal e sem Overflow_Horizontal.

4. WHILE a Viewport tiver largura entre 1920px e 2559px, THE Sistema SHALL exibir o Conteúdo_Principal ocupando toda a largura disponível da Viewport excluindo a largura da Sidebar (290px), sem margens laterais automáticas que reduzam a largura visível do Conteúdo_Principal abaixo desse valor.

5. WHILE a Viewport tiver largura de 2560px ou maior, THE Sistema SHALL exibir o Conteúdo_Principal ocupando toda a largura disponível da Viewport excluindo a largura da Sidebar (290px), sem nenhum limite de largura estático aplicado pelo Contêiner_Estrutural que restrinja o Conteúdo_Principal abaixo dessa largura.

6. THE Sistema SHALL manter o comportamento responsivo de cada módulo em cada Breakpoint existente, de modo que os elementos internos dos módulos continuem a se reorganizar e redimensionar conforme definido nas regras responsivas originais desses módulos, mesmo após ajustes de layout no Contêiner_Estrutural.

7. WHEN o layout full-width for aplicado, THE Sistema SHALL preservar o dimensionamento e o posicionamento de componentes internos (cartões, formulários e modais), de modo que esses componentes não excedam sua largura máxima definida e não se estiquem para preencher a largura total do Conteúdo_Principal.

---

### Requisito 8: Integridade Visual de Componentes Internos

**User Story:** Como usuário do GM4med, quero que tabelas, formulários, cartões, modais, toasts, estados vazios e rodapés continuem funcionando visualmente após a expansão para full-width, sem distorções ou quebras de layout.

#### Critérios de Aceitação

1. WHEN o layout for expandido para full-width em qualquer módulo, THE tabelas SHALL manter `min-width` computado de no mínimo 600px, com cada coluna tendo largura mínima de 80px, e SHALL exibir barra de rolagem horizontal interna quando o conteúdo ultrapassar a largura do contêiner.

2. WHEN o layout for expandido para full-width, THE campos de formulário em grade SHALL permanecer dentro dos limites do contêiner pai, sem que nenhum campo apresente `offsetWidth` maior que o `clientWidth` do contêiner pai.

3. WHEN o layout for expandido para full-width, THE KPI_Cards SHALL ocupar toda a largura do Conteúdo_Principal em grade responsiva, com nenhum card apresentando `offsetWidth` inferior a 200px em viewports de 1280px ou superior.

4. THE Sistema SHALL garantir que os Modais mantenham `max-width` computado entre 400px e 900px, independentemente da largura do Conteúdo_Principal.

5. THE Sistema SHALL garantir que os contêineres de Toast mantenham `position: fixed` computado e que a distância computada entre o toast e a borda inferior direita da Viewport não exceda 24px em nenhuma direção.

6. WHEN um módulo exibir estado vazio, THE elemento de estado vazio SHALL apresentar `margin-left` e `margin-right` computados iguais a 0px e `width` computado igual a 100% do elemento pai imediato.

7. WHILE a Viewport tiver largura maior que 1024px, THE rodapé com `position: fixed` SHALL ter `left` computado igual a 290px e `width` computado igual a `largura da Viewport menos 290px`.

8. WHILE a Viewport tiver largura igual ou inferior a 1024px, THE rodapé com `position: fixed` SHALL ter `left` computado igual a 0px e `width` computado igual a 100% da largura da Viewport.

9. THE Sistema SHALL garantir que o módulo `financeiro`, que possui layout próprio com grid interno controlado por variável CSS própria, não seja afetado pelas alterações de full-width aplicadas à sidebar global do GM4med.

---

### Requisito 9: Verificação e Critérios de Conclusão por Módulo

**User Story:** Como desenvolvedor do GM4med, quero critérios objetivos de verificação para cada módulo afetado, para que eu possa confirmar que o layout full-width foi aplicado corretamente sem regressões.

#### Critérios de Aceitação

1. WHEN as alterações forem aplicadas ao módulo `Menu-Principal`, THE Sistema SHALL verificar que, nos viewports de 1920px e 2560px de largura, os elementos container do módulo apresentam `margin-left` e `margin-right` computados iguais a 0px e `width` computado igual a 100% do viewport.

2. WHEN as alterações forem aplicadas ao módulo `Atendimento-do-paciente-na-recepcao`, THE Sistema SHALL verificar que a tabela de fila de pacientes e o painel de formulário apresentam `width` computado igual a 100% do `Conteúdo_Principal` e `margin-left` e `margin-right` computados iguais a 0px.

3. WHEN as alterações forem aplicadas ao módulo `Relatorios`, THE Sistema SHALL verificar que os `KPI_Cards` e as tabelas de atendimentos apresentam `width` computado igual a 100% do `Conteúdo_Principal` no viewport de 1920px.

4. WHEN as alterações forem aplicadas ao módulo `Utilitarios` (logs e usuários), THE Sistema SHALL verificar que as listas e tabelas apresentam `max-width` computado diferente de 1600px e `width` computado igual a 100% do elemento pai imediato.

5. THE Sistema SHALL verificar que todos os módulos que já usavam padrão full-width (`Grupo-de-procedimentos`, `Grupo-de-tipos-de-atendimento`, `Grupo-de-atendimento`, `convenios`, `Especialidade-medica-utilitarios`, `Siglas`) apresentam `width` computado igual a 100% do `Conteúdo_Principal`, `margin-left` e `margin-right` computados iguais a 0px, e ausência de `Overflow_Horizontal` após as alterações.

6. THE Sistema SHALL verificar que, em viewport de 320px de largura, nenhum módulo exibe `Overflow_Horizontal`, definido como `scrollWidth` do elemento body maior que `clientWidth` do viewport.

7. WHEN qualquer funcionalidade interativa (agendar consulta, cadastrar paciente, abrir modal, filtrar tabela, enviar formulário) for executada após as alterações, THE Sistema SHALL completar a ação solicitada e manter zero entradas de nível error no console do navegador.

8. WHEN as alterações no HTML e CSS do `Menu-Principal` forem aplicadas, THE Sistema SHALL verificar que a animação do ícone de estetoscópio (`.medical-icon`) executa suas keyframes CSS sem interrupção e que os ícones Lucide renderizam elementos SVG visíveis no DOM da sidebar.

9. WHEN o arquivo `estilizacao/cadastro-siglas.css` for atualizado, THE Sistema SHALL verificar que todos os módulos que importam ou referenciam esse arquivo (como o módulo `Siglas`) apresentam `width` computado igual a 100% do `Conteúdo_Principal` e ausência de `Overflow_Horizontal`.

10. WHEN o arquivo `estilizacao/agenda.css` for atualizado, THE Sistema SHALL verificar que o calendário do módulo `Agenda-medica` renderiza a grade de slots visível no DOM e que a interação de seleção de slots não gera entradas de nível error no console do navegador.
