# Requirements Document

## Introduction

O **Painel Available** (Painel de Disponibilidade Operacional) é uma funcionalidade do sistema GM4med destinada a oferecer, em uma única tela, visibilidade em tempo real das três dimensões críticas do fluxo clínico diário: o **status dos agendamentos do dia**, a **fila de espera ativa** e a **disponibilidade dos médicos**. O painel serve como central de controle operacional para recepcionistas, gestores clínicos e, em modo somente leitura, para os próprios médicos.

O módulo é implementado como página independente (`Painel-available/painel-available.html`) acessível a partir do Menu Principal (`Menu-Principal.html`), seguindo os padrões arquiteturais e de design já estabelecidos no GM4med: HTML semântico, CSS customizado com variáveis teal-600 do sistema de design e JavaScript vanilla com persistência em `localStorage`.

---

## Glossary

- **Painel_Available**: Módulo de disponibilidade operacional descrito neste documento.
- **Agendamento**: Registro de consulta ou procedimento marcado para um paciente com um médico em data e horário específicos.
- **Status_Agendamento**: Situação atual de um agendamento. Valores possíveis: `Agendado`, `Confirmado`, `Em Atendimento`, `Concluído`, `Faltou`, `Cancelado`.
- **Fila_Espera**: Lista ordenada de pacientes com chegada confirmada que aguardam ser chamados pelo médico.
- **Status_Medico**: Situação operacional atual de um médico. Valores possíveis: `Disponível`, `Em Consulta`, `Em Pausa`, `Ausente`.
- **Recepcionista**: Perfil de usuário primário do Painel_Available; pode visualizar e atualizar todos os dados operacionais.
- **Gestor_Clinico**: Perfil de usuário secundário; possui acesso a métricas de desempenho e pode exportar resumos.
- **Medico**: Perfil de usuário terciário; possui acesso somente leitura ao próprio status e à fila vinculada.
- **Resumo_Operacional**: Bloco de métricas rápidas exibido no topo do painel (total de agendamentos, atendidos, aguardando, ausentes).
- **Cartao_Medico**: Componente visual que representa um médico, seu status atual e o próximo paciente previsto.
- **Cartao_Paciente_Fila**: Componente visual que representa um paciente na fila de espera com hora de chegada, tempo estimado de espera e médico vinculado.
- **Tempo_Espera_Estimado**: Valor calculado em minutos a partir da hora de chegada do paciente até o momento presente.
- **Slot_Horario**: Intervalo de tempo da grade da agenda (padrão: 30 minutos) associado a um agendamento.
- **localStorage**: Mecanismo de persistência do navegador utilizado pelo GM4med na ausência de backend.
- **Toast**: Notificação temporária, não bloqueante, exibida ao usuário após ações ou eventos do sistema.
- **Estado_Vazio**: Estado visual exibido quando uma seção não possui dados a apresentar.
- **Estado_Carregando**: Estado visual exibido enquanto dados estão sendo lidos do `localStorage` ou calculados.
- **Estado_Erro**: Estado visual exibido quando ocorre falha ao ler ou processar dados persistidos.

---

## Requirements

---

### Requisito 1 — Acesso e Navegação ao Painel

**História de Usuário:** Como recepcionista, quero acessar o Painel Available diretamente do Menu Principal, para ter acesso rápido à central de controle operacional do dia sem percorrer múltiplos menus.

#### Critérios de Aceitação

1. THE Painel_Available SHALL ser acessível a partir de um link dedicado na barra de navegação lateral do `Menu-Principal.html`, visível para todos os usuários autenticados com permissão de acesso ao módulo.
2. WHEN o usuário navega para o Painel_Available em uma conexão de rede local, THE Painel_Available SHALL carregar e renderizar todos os seus painéis em no máximo 800 ms a partir do evento `DOMContentLoaded`.
3. THE Painel_Available SHALL exibir, na barra superior (topbar), o título "Painel Available — Controle Operacional", a data atual formatada em `dd/mm/aaaa` e o relógio em tempo real atualizado a cada 1 segundo.
4. WHEN o usuário pressiona a tecla `Escape` ou aciona o botão "Voltar", THE Painel_Available SHALL redirecionar o usuário para `Menu-Principal.html`, preservando quaisquer dados já persistidos no `localStorage` durante a sessão do painel.
5. IF ocorrer um erro de navegação ao tentar redirecionar para `Menu-Principal.html`, THEN THE Painel_Available SHALL exibir mensagem de erro indicando a falha e oferecer ao usuário a opção de tentar novamente.
6. THE Painel_Available SHALL seguir o design system do GM4med: variáveis CSS `--primary` teal-600, fonte Plus Jakarta Sans, bordas arredondadas `--radius`, sombras `--shadow-sm` e `--shadow`, e esquema de cores consistente com os demais módulos.
7. THE Painel_Available SHALL garantir que todos os elementos interativos sejam acessíveis por Tab com indicador `focus-visible` visível em todos os componentes interativos, com tooltips de atalhos ativados por foco ou hover.
8. WHERE o dispositivo tiver largura de tela inferior a 768 px, THE Painel_Available SHALL reorganizar os painéis em layout de coluna única, mantendo todos os controles acessíveis e operáveis.

---

### Requisito 2 — Resumo Operacional (Métricas Rápidas)

**História de Usuário:** Como gestor clínico, quero visualizar imediatamente as métricas do dia (total de agendamentos, atendidos, aguardando, faltou/cancelado), para avaliar a eficiência operacional sem precisar consultar tabelas detalhadas.

#### Critérios de Aceitação

1. WHILE o Painel_Available está visível, THE Resumo_Operacional SHALL exibir um bloco composto por exatamente quatro cards de métrica: **Total do Dia**, **Atendidos**, **Aguardando** e **Faltou/Cancelado**.
2. WHEN os dados de agendamento do dia são carregados, THE Resumo_Operacional SHALL calcular e exibir os valores de cada card com base nos registros lidos do `localStorage` cuja chave `data` seja igual à data atual segundo o fuso horário local do dispositivo no formato `YYYY-MM-DD`, onde: **Total do Dia** exibe a contagem total de registros do dia; **Atendidos**, **Aguardando** e **Faltou/Cancelado** exibem as contagens dos respectivos status; e o valor de **Total do Dia** é igual à soma dos outros três cards.
3. WHEN o status de qualquer agendamento é alterado pelo usuário, THE Resumo_Operacional SHALL atualizar os valores dos quatro cards em no máximo 300 ms sem recarregar a página.
4. WHILE o Resumo_Operacional está visível, THE Resumo_Operacional SHALL distinguir visualmente cada card por cor semântica associada ao seu significado: Total (cor primária), Atendidos (cor de sucesso), Aguardando (cor de alerta), Faltou/Cancelado (cor de erro).
5. IF os dados do `localStorage` não puderem ser lidos ou contiverem registros com campos obrigatórios ausentes, com tipo de valor incorreto ou com valor de `data` em formato diferente de `YYYY-MM-DD`, THEN THE Resumo_Operacional SHALL exibir o valor "—" em cada card e apresentar uma mensagem de Estado_Erro não bloqueante via Toast com texto indicando que não foi possível carregar os dados operacionais.
6. THE Resumo_Operacional SHALL incluir em cada card um `aria-label` com o padrão "[Nome do card] hoje: [valor numérico]" (exemplo: "Total de agendamentos hoje: 12"), atualizado automaticamente via região ARIA live sempre que o valor do card for alterado.
7. WHEN os dados de agendamento do dia estão sendo carregados e ainda não estão disponíveis para exibição, THE Resumo_Operacional SHALL exibir um indicador de carregamento em cada card no lugar do valor numérico, por no máximo 5 segundos, após os quais, se os dados ainda não estiverem disponíveis, o comportamento do critério 5 SHALL ser aplicado.

---

### Requisito 3 — Painel de Status dos Agendamentos

**História de Usuário:** Como recepcionista, quero visualizar todos os agendamentos do dia com seus status atuais e poder atualizá-los diretamente no painel, para controlar o fluxo de consultas sem precisar abrir o módulo de Agenda.

#### Critérios de Aceitação

1. THE Painel_Available SHALL exibir uma seção "Agendamentos do Dia" listando todos os agendamentos com `data` igual à data atual, lidos da chave `GM4med.agenda.agendamentos.v2` do `localStorage`.
2. THE Painel_Available SHALL exibir para cada agendamento: o horário do agendamento, o nome do paciente, o nome do médico, a especialidade, o tipo de atendimento e o status atual com badge colorido conforme a convenção do módulo Agenda-medica.
3. THE Painel_Available SHALL ordenar os agendamentos por horário crescente como ordem padrão.
4. WHEN o usuário aciona o seletor de status de um agendamento, THE Painel_Available SHALL exibir as opções: `Agendado`, `Confirmado`, `Em Atendimento`, `Concluído`, `Faltou`, `Cancelado`.
5. WHEN o usuário seleciona um novo status para um agendamento, THE Painel_Available SHALL persistir a alteração na chave `GM4med.agenda.agendamentos.v2` do `localStorage`, atualizar o Resumo_Operacional e exibir Toast de sucesso "Status atualizado com sucesso." em no máximo 300 ms após a confirmação da persistência.
6. IF a persistência no `localStorage` falhar, THEN THE Painel_Available SHALL reverter o status exibido para o valor anterior, exibir Toast de erro "Não foi possível salvar a alteração." e manter o estado anterior do Resumo_Operacional.
7. IF a chave `GM4med.agenda.agendamentos.v2` não existir no `localStorage` ou não contiver registros com `data` igual à data atual, THEN THE Painel_Available SHALL exibir Estado_Vazio "Nenhum agendamento para hoje." dentro da seção.
8. WHEN a leitura dos dados da seção de Agendamentos se inicia, THE Painel_Available SHALL exibir Estado_Carregando com spinner acessível (`aria-busy="true"`) até que a leitura seja concluída ou resulte em falha.
9. IF a leitura da chave `GM4med.agenda.agendamentos.v2` do `localStorage` lançar uma exceção, THEN THE Painel_Available SHALL exibir Estado_Erro "Não foi possível carregar os agendamentos." com botão "Tentar novamente" que reexecuta a leitura.
10. WHERE o usuário for do perfil Medico, THE Painel_Available SHALL exibir a lista de agendamentos em modo somente leitura, sem o seletor de status ativo.
11. THE Painel_Available SHALL fornecer um campo de busca textual com limite de 100 caracteres que filtra os agendamentos em tempo real pelo nome do paciente ou nome do médico, sem recarregar a seção.
12. WHEN o campo de busca recebe entrada e o resultado do filtro retornar zero registros, THE Painel_Available SHALL exibir Estado_Vazio "Nenhum agendamento encontrado para o termo pesquisado." dentro da seção.
13. THE Painel_Available SHALL incluir link "Ver na Agenda" para cada agendamento, que abre o módulo `Agenda-medica/agenda-geral.html` com o parâmetro de data correspondente.

---

### Requisito 4 — Fila de Espera em Tempo Real

**História de Usuário:** Como recepcionista, quero visualizar a fila de espera com os pacientes que já chegaram, sua hora de chegada e o tempo que estão aguardando, para gerenciar o fluxo e comunicar previsões de atendimento de forma eficiente.

#### Critérios de Aceitação

1. THE Painel_Available SHALL exibir uma seção "Fila de Espera" listando os pacientes cujo agendamento do dia está com status `Confirmado` e cuja hora de chegada tenha sido registrada pelo módulo de Atendimento_Recepcao ou pelo próprio Painel_Available.
2. THE Painel_Available SHALL exibir para cada Cartao_Paciente_Fila: o nome do paciente (máximo 80 caracteres), o médico vinculado, a especialidade, a hora de chegada no formato `HH:MM`, o Tempo_Espera_Estimado em minutos inteiros não negativos e o tipo de atendimento.
3. THE Painel_Available SHALL atualizar o Tempo_Espera_Estimado de todos os Cartao_Paciente_Fila a cada 60 segundos sem recarregar a página, calculando o valor como a diferença em minutos entre a hora atual e a hora de chegada registrada, arredondada para baixo.
4. WHEN o Tempo_Espera_Estimado de um paciente exceder 30 minutos e for menor ou igual a 60 minutos, THE Painel_Available SHALL destacar visualmente o Cartao_Paciente_Fila com borda e ícone de alerta âmbar (`--warning`) e incluir `aria-label` indicando a espera prolongada.
5. WHEN o Tempo_Espera_Estimado de um paciente exceder 60 minutos, THE Painel_Available SHALL aplicar destaque vermelho (`--danger`) ao Cartao_Paciente_Fila, substituindo qualquer destaque âmbar previamente aplicado, e incluir `aria-label` indicando espera crítica.
6. THE Painel_Available SHALL ordenar a Fila_Espera por hora de chegada crescente como ordem padrão, exibindo primeiro o paciente com chegada mais antiga.
7. WHEN a recepcionista aciona o botão "Registrar Chegada" em um agendamento com status `Confirmado` no Painel_Available, THE Painel_Available SHALL registrar a hora atual do sistema como hora de chegada, alterar o status do agendamento para `Em Atendimento`, atualizar o Resumo_Operacional e inserir o Cartao_Paciente_Fila na Fila_Espera com Tempo_Espera_Estimado inicial de 0 minutos.
8. IF o botão "Registrar Chegada" for acionado em um agendamento cujo status não seja `Confirmado`, THEN THE Painel_Available SHALL exibir mensagem de erro indicando que o registro de chegada não é permitido para o status atual e manter o agendamento inalterado.
9. WHEN um agendamento é marcado com status `Concluído` pelo usuário, THE Painel_Available SHALL remover o Cartao_Paciente_Fila correspondente da Fila_Espera com animação de saída de 200 ms e atualizar o contador dinâmico do cabeçalho imediatamente após a remoção.
10. THE Painel_Available SHALL exibir Estado_Vazio com a mensagem "Nenhum paciente na fila de espera no momento." quando a Fila_Espera não contiver nenhum Cartao_Paciente_Fila.
11. THE Painel_Available SHALL exibir no cabeçalho da seção o contador dinâmico "X paciente(s) aguardando", onde X é o número inteiro de Cartao_Paciente_Fila presentes na Fila_Espera, atualizado imediatamente a cada inserção ou remoção de card.
12. IF os dados de chegada não puderem ser lidos do `localStorage`, THEN THE Painel_Available SHALL exibir Estado_Erro com a mensagem "Não foi possível carregar a fila de espera.", ocultar a listagem da Fila_Espera e oferecer botão "Tentar novamente" que reexecuta a leitura do `localStorage` e restaura a listagem em caso de sucesso.
13. IF a leitura do `localStorage` reexecutada pelo botão "Tentar novamente" falhar novamente, THEN THE Painel_Available SHALL manter o Estado_Erro exibido e reabilitar o botão "Tentar novamente" para nova tentativa.
14. WHERE o usuário for do perfil Medico, THE Painel_Available SHALL exibir somente os Cartao_Paciente_Fila vinculados ao médico logado, em modo somente leitura, ocultando o botão "Registrar Chegada" e quaisquer controles de alteração de status.

---

### Requisito 5 — Painel de Status dos Médicos

**História de Usuário:** Como recepcionista, quero visualizar o status atual de cada médico (Disponível, Em Consulta, Em Pausa, Ausente) e saber quem é o próximo paciente de cada um, para coordenar a chamada de pacientes e responder perguntas da sala de espera com precisão.

#### Critérios de Aceitação

1. THE Painel_Available SHALL exibir uma seção "Status dos Médicos" contendo um Cartao_Medico para cada médico cadastrado na chave `GM4med.medicos` do `localStorage` com status ativo.
2. THE Painel_Available SHALL exibir em cada Cartao_Medico: o nome completo do médico, a especialidade principal, o Status_Medico atual com badge colorido, e o nome e horário do próximo paciente agendado.
3. THE Painel_Available SHALL adotar o seguinte esquema de cores para o badge de Status_Medico: `Disponível` (variável `--success`), `Em Consulta` (variável `--primary`), `Em Pausa` (variável `--warning`), `Ausente` (variável `--danger`).
4. WHEN a recepcionista ou o gestor aciona o seletor de status em um Cartao_Medico, THE Painel_Available SHALL exibir as opções `Disponível`, `Em Consulta`, `Em Pausa` e `Ausente`.
5. WHEN um novo Status_Medico é selecionado, THE Painel_Available SHALL persistir a alteração na chave `GM4med.status.medicos` do `localStorage` e atualizar o badge e o Cartao_Medico em no máximo 300 ms após a seleção.
6. IF a escrita na chave `GM4med.status.medicos` do `localStorage` falhar ao persistir a alteração de Status_Medico, THEN THE Painel_Available SHALL manter o status anterior no Cartao_Medico e exibir mensagem de erro indicando falha ao salvar o status.
7. WHEN o status de um agendamento é alterado para `Em Atendimento`, THE Painel_Available SHALL atualizar automaticamente o Status_Medico do médico vinculado para `Em Consulta` caso o médico esteja com status `Disponível`, em no máximo 300 ms após a alteração do agendamento.
8. WHEN o status de um agendamento é alterado para `Concluído`, THE Painel_Available SHALL atualizar automaticamente o Status_Medico do médico vinculado para `Disponível` caso não haja outro agendamento `Em Atendimento` vinculado ao mesmo médico, em no máximo 300 ms após a alteração do agendamento.
9. THE Painel_Available SHALL calcular e exibir no Cartao_Medico o "próximo paciente" como o agendamento de menor horário com status `Agendado` ou `Confirmado` para o dia atual vinculado àquele médico, considerando apenas agendamentos com horário posterior ao momento atual.
10. IF não houver próximo paciente para um médico, THE Painel_Available SHALL exibir no campo correspondente do Cartao_Medico o texto "Sem próximos agendamentos hoje.".
11. WHERE o usuário for do perfil Medico, THE Painel_Available SHALL exibir apenas o Cartao_Medico correspondente ao médico logado, sem o seletor de status, em modo somente leitura.
12. IF os dados de médicos não puderem ser lidos do `localStorage`, THEN THE Painel_Available SHALL exibir Estado_Erro com mensagem indicando falha ao carregar os dados dos médicos e botão "Tentar novamente" que reexecuta a leitura da chave `GM4med.medicos`.
13. THE Painel_Available SHALL exibir Estado_Vazio "Nenhum médico ativo cadastrado." caso não existam registros médicos ativos.
14. WHEN a recepcionista aciona o botão "Tentar novamente" no Estado_Erro, THE Painel_Available SHALL reexecutar a leitura da chave `GM4med.medicos` do `localStorage` e, se bem-sucedida, substituir o Estado_Erro pela seção "Status dos Médicos" em no máximo 300 ms.

---

### Requisito 6 — Integração com Módulos Existentes

**História de Usuário:** Como recepcionista, quero poder navegar rapidamente do Painel Available para os módulos de Agenda, Atendimentos e Cadastro de Pacientes sem perder o contexto, para completar ações detalhadas sem retrabalho.

#### Critérios de Aceitação

1. THE Painel_Available SHALL ler os agendamentos do dia exclusivamente da chave `GM4med.agenda.agendamentos.v2` do `localStorage`, que é a mesma chave utilizada pelo módulo `Agenda-medica/agenda-geral.js`, garantindo consistência de dados.
2. WHEN o usuário aciona "Ver na Agenda" em um agendamento do Painel_Available, THE Painel_Available SHALL redirecionar para `Agenda-medica/agenda-geral.html?data=YYYY-MM-DD` com a data do agendamento no parâmetro `data`.
3. WHEN o usuário aciona "Ver ficha" em um Cartao_Paciente_Fila, THE Painel_Available SHALL redirecionar para `Atendimento-do-paciente-na-recepcao/atendimento-recepcao.html?pacienteId={id}` com o identificador do paciente.
4. WHEN o usuário aciona "Ver cadastro" em um Cartao_Paciente_Fila, THE Painel_Available SHALL redirecionar para `Cadastro-paciente/cadastro-paciente.html?pacienteId={id}` com o identificador do paciente.
5. THE Painel_Available SHALL ler os dados de médicos ativos da chave `GM4med.cadastros.medicos.v1` do `localStorage`, que é a mesma chave utilizada pelo módulo `Cadastros-medicos`.
6. WHEN o evento `visibilitychange` é disparado e `document.visibilityState` é `"visible"`, THE Painel_Available SHALL recarregar os dados de todas as seções do `localStorage` para refletir alterações feitas em outros módulos durante a ausência.
7. WHEN um Status_Agendamento ou Status_Medico é alterado, THE Painel_Available SHALL emitir o evento customizado `GM4med:painel-status-changed` no `window` com payload contendo: `entityType` (valor: `"agendamento"` ou `"medico"`), `entityId` (identificador do registro alterado) e `newStatus` (novo valor de status).

---

### Requisito 7 — Acessibilidade e Experiência de Teclado

**História de Usuário:** Como recepcionista com necessidades de acessibilidade, quero operar o Painel Available integralmente por teclado e com leitor de tela, para que a ferramenta seja inclusiva e utilizável em condições de trabalho diversas.

#### Critérios de Aceitação

1. THE Painel_Available SHALL atribuir `role="region"` com `aria-labelledby` referenciando o título de cada seção principal (Resumo Operacional, Agendamentos do Dia, Fila de Espera, Status dos Médicos).
2. THE Painel_Available SHALL garantir que todos os controles interativos (botões, seletores de status, campo de busca) sejam acessíveis por Tab com indicador `focus-visible` visível de no mínimo 3 px de borda contrastante e razão de contraste mínima de 3:1 entre o indicador de foco e o fundo adjacente, conforme WCAG 2.1 AA critério 1.4.11.
3. THE Painel_Available SHALL implementar `aria-live="polite"` nas regiões que se atualizam dinamicamente (Resumo_Operacional, Fila_Espera, contadores), de forma que cada atualização gere no máximo um anúncio por evento de mudança de dado sem interromper a leitura em curso.
4. THE Painel_Available SHALL atribuir `aria-label` descritivo a cada Cartao_Medico e Cartao_Paciente_Fila incluindo nome e status atual (exemplo: "Dr. Carlos Silva — Em Consulta"), atualizando o valor do `aria-label` automaticamente sempre que o status do cartão for alterado.
5. THE Painel_Available SHALL implementar o padrão de trap de foco em qualquer modal ou painel de ação que se abra sobre o conteúdo principal, de modo que a tecla Tab cicle apenas entre os elementos focáveis do modal e a tecla Escape feche o modal e retorne o foco ao elemento que o abriu.
6. THE Painel_Available SHALL manter razão de contraste mínima de 4,5:1 entre texto e fundo em todos os estados visuais (normal, hover, focus, disabled), em conformidade com WCAG 2.1 AA, exceto para texto com tamanho igual ou superior a 18 pt (ou 14 pt negrito), para o qual a razão mínima aceitável é 3:1.
7. THE Painel_Available SHALL suportar o atalho de teclado `Alt + R` para mover o foco ao campo de busca de agendamentos a partir de qualquer posição de foco no painel, sem recarregar a página ou redefinir filtros ativos.
8. THE Painel_Available SHALL incluir a classe `.sr-only` para rótulos e instruções visíveis apenas a tecnologias assistivas, seguindo o padrão já adotado nos módulos existentes do GM4med.
9. WHEN uma ação de atualização de status é concluída com sucesso, THE Painel_Available SHALL mover o foco de volta ao controle que desencadeou a ação, mantendo o controle visível na área de rolagem e preservando o estado de navegação da lista ou grade em que o controle se encontra.
10. IF uma ação de atualização de status falhar, THEN THE Painel_Available SHALL mover o foco ao controle que desencadeou a ação e expor uma mensagem de erro acessível via `aria-describedby` ou `role="alert"` associada àquele controle, sem alterar a posição de rolagem da página.

---

### Requisito 8 — Responsividade

**História de Usuário:** Como recepcionista usando um tablet na bancada de recepção, quero que o painel se adapte ao tamanho da tela sem perda de funcionalidade, para trabalhar com conforto em diferentes dispositivos.

#### Critérios de Aceitação

1. WHILE a largura da janela for igual ou superior a 1280 px, THE Painel_Available SHALL utilizar layout em grade de três colunas (Agendamentos | Fila de Espera | Status dos Médicos), com largura mínima de coluna de 280 px.
2. WHILE a largura da janela for inferior a 1280 px e igual ou superior a 768 px, THE Painel_Available SHALL reorganizar o layout para duas colunas (Agendamentos | Fila de Espera + Status dos Médicos empilhados).
3. WHILE a largura da janela for inferior a 768 px, THE Painel_Available SHALL exibir os três painéis em coluna única com acordeões expansíveis para cada seção, tendo o Resumo_Operacional sempre fixo no topo, com o estado padrão dos acordeões sendo expandido.
4. THE Painel_Available SHALL usar unidades relativas (rem, %, vw, min()) e variáveis CSS para espaçamentos, de forma que o layout se adapte sem overflow horizontal em qualquer largura entre 320 px e 3840 px.
5. THE Painel_Available SHALL garantir que todos os elementos touch (botões, seletores, controles de acordeão) tenham área de toque mínima de 44 × 44 px em conformidade com WCAG 2.5.5.
6. WHEN a janela é redimensionada ou o dispositivo rotacionado, THE Painel_Available SHALL adaptar o layout ao novo breakpoint em no máximo 300 ms, preservando o estado de expansão de acordeões e filtros ativos.
7. IF um painel não puder ser renderizado devido a erro de dados, THEN THE Painel_Available SHALL exibir o Estado_Erro apenas naquele painel e continuar renderizando os demais painéis normalmente em qualquer tamanho de tela.

---

### Requisito 9 — Estados de Interface: Vazio, Carregando e Erro

**História de Usuário:** Como recepcionista, quero que o painel comunique claramente quando está carregando dados, quando não há dados disponíveis e quando ocorre um erro, para que eu saiba o estado do sistema sem fazer suposições.

#### Critérios de Aceitação

1. WHILE os dados de uma seção estão sendo lidos do `localStorage`, THE Painel_Available SHALL exibir o Estado_Carregando nessa seção individualmente, com spinner animado, texto "Carregando dados..." e atributo `aria-busy="true"` no contêiner da seção.
2. WHEN o carregamento de dados de uma seção exceder 2000 ms, THE Painel_Available SHALL substituir o Estado_Carregando pelo Estado_Erro com mensagem indicando que o carregamento demorou mais que o esperado e botão "Tentar novamente" que, quando acionado, reinicia a leitura dos dados da seção e retorna ao Estado_Carregando.
3. IF uma seção não contiver nenhum registro a exibir após a conclusão do carregamento, THEN THE Painel_Available SHALL exibir o Estado_Vazio nessa seção com ícone ilustrativo e texto identificando o tipo de dado ausente naquela seção; IF a seção possuir uma ação de criação ou navegação diretamente relacionada ao seu conteúdo, THEN THE Painel_Available SHALL exibir um botão de ação primária conduzindo o usuário à tela correspondente.
4. IF uma operação de escrita no `localStorage` lançar uma exceção, THEN THE Painel_Available SHALL exibir Toast de erro indicando que o armazenamento local está indisponível e que as alterações não foram salvas, e SHALL reverter o estado visual da seção afetada para o último estado exibido com sucesso antes da operação falha.
5. THE Painel_Available SHALL garantir que Estado_Vazio ou Estado_Erro em uma seção não impeça a renderização nem a interação com as demais seções do painel, de modo que cada seção exiba seu próprio estado independentemente do estado das outras seções.

---

### Requisito 10 — Notificações e Feedback de Ação

**História de Usuário:** Como recepcionista, quero receber confirmação visual imediata de cada ação que realizo no painel, para ter certeza de que as atualizações foram aplicadas sem precisar verificar manualmente.

#### Critérios de Aceitação

1. WHEN uma operação de escrita no `localStorage` é concluída com sucesso, THE Painel_Available SHALL exibir um Toast de sucesso por no máximo 4000 ms, com ícone de check e mensagem que identifica o tipo de ação realizada e o registro afetado (exemplo: "Status do agendamento de João Silva atualizado para Confirmado.").
2. IF uma operação de escrita no `localStorage` falhar, THEN THE Painel_Available SHALL exibir um Toast de erro persistente sem auto-dismiss, com ícone de alerta, mensagem indicando qual operação falhou e qual dado não foi salvo, e botão de fechamento manual acessível por teclado.
3. WHEN o número de Toasts simultaneamente exibidos atinge 5 (incluindo Toasts de sucesso, erro e aviso), THE Painel_Available SHALL descartar automaticamente o Toast mais antigo para dar lugar ao novo.
4. WHEN o usuário altera o Status_Medico de `Disponível` para `Em Pausa` ou `Ausente`, THE Painel_Available SHALL exibir Toast de aviso âmbar com mensagem identificando o nome do médico, o novo status e a informação de que nenhum chamado automático será feito para esse profissional.
5. THE Painel_Available SHALL garantir que os Toasts sejam anunciados por leitores de tela através de `role="alert"` para Toasts de erro e `role="status"` para Toasts de sucesso e informação.
