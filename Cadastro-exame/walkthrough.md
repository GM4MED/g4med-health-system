# Walkthrough — Janela de Cadastro de Exames (GM4Med)

## Visão Geral
A **Janela de Cadastro de Exames** do sistema GM4Med foi completamente revisada, refatorada e homologada. A interface foi desenvolvida seguindo o Design System oficial do GM4Med (paleta Healthcare Teal `#0D9488`), atendendo às diretrizes de **acessibilidade WCAG 2.2 AA**, responsividade avançada (320px–1920px), validações rigorosas de dados de saúde e arquitetura pronta para integração com o **Prontuário Eletrônico do Paciente (PEP)**.

---

## Principais Recursos Implementados

### 1. Estrutura por Abas Semânticas & WAI-ARIA
- **Aba 1 — Dados do Exame**: Código ID (automático `EXA-XXXXX`), Nome do Exame, Categoria Médica (15 opções pré-cadastradas), Tipo de Exame (13 categorias clínicas), Convênio Padrão Vinculado, Status no Sistema (Ativo/Inativo) e Orientações de Preparo/Notas Clínicas.
- **Aba 2 — Convênios & Financeiro**: Vinculação com operadoras de saúde (Unimed, Bradesco, Amil, SulAmérica, Postal Saúde), CNPJ com validação matemática de 14 dígitos, Registro ANS, E-mail Operacional, Telefone de Contato, Tabela de Preços Monetária BRL (`Valor Particular`, `Valor Repasse Convênio`, `Custo Interno Operacional`) e Registro de Auditoria.
- **Navegação por Teclado**: Suporte completo às setas `Left`/`Right` no `tablist`, com indicadores visuais `:focus-visible`.

### 2. Máquina de Estados & Toolbar de Ações
- Estados controlados: `NAVEGACAO`, `NOVO`, `EDICAO`.
- Ações com ativação/desativação condicional de botões em tempo real:
  - **Novo Exame** (`#btnNovo`): Habilita edição, limpa formulário, gera ID sequencial e preenche data/hora de criação.
  - **Gravar** (`#btnSalvar`): Executa validação de campos obrigatórios, salva no estado/memória e emite evento `gm4med:exame-saved`.
  - **Editar** (`#btnEditar`): Habilita alteração dos dados do exame selecionado.
  - **Excluir** (`#btnExcluir`): Dispara modal com confirmação de exclusão acessível.
  - **Navegação** (`#btnAnterior` / `#btnProximo`): Percorre os registros cadastrados com feedback acessível.
  - **Buscar** (`#btnBuscar`): Abre modal de busca rápida e avançada.

### 3. Validações e Regras de Negócio
- **Validação de CNPJ**: Algoritmo matemático oficial calculando os 2 dígitos verificadores do CNPJ.
- **Formatação Monetária BRL**: Máscara em tempo real para valores em Reais (ex: `R$ 45,00`).
- **Campos Obrigatórios**: Feedback inline acessível em tempo real (`.is-invalid`, `.field-feedback.error`).

### 4. Integração Pronta para o Backend & PEP
- **Namespace Global**: `window.GM4MedExame` expõe:
  - `getExames()`
  - `getExamePorId(id)`
  - `salvarExame(dados)`
  - `excluirExame(id)`
- **Evento Customizado**: Disparo do evento `gm4med:exame-saved` na `window` com o objeto completo do exame em `event.detail`.

---

## Arquivos Atualizados
1. `c:\Users\DELL\Desktop\g4med-health-system\Cadastro-exame\cadastro-exames.html`
2. `c:\Users\DELL\Desktop\g4med-health-system\Cadastro-exame\cadastro-exames.css`
3. `c:\Users\DELL\Desktop\g4med-health-system\Cadastro-exame\cadastro-exames.js`
4. `c:\Users\DELL\Desktop\g4med-health-system\Cadastro-exame\walkthrough.md`

---

## Validação de Sintaxe e Qualidade
- `node --check cadastro-exames.js`: **0 erros** (Sintaxe validada com sucesso).
- HTML semântico com marcações WAI-ARIA completas.
- CSS desacoplado, limpo, responsivo e sem dependências pesadas de JS de terceiros.
