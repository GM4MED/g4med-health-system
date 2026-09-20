# RELATÓRIO DE PRÉ-INTEGRAÇÃO JAVA

## 1. O que já está preparado

### Estado observado no front-end atual
- A estrutura visual e funcional do sistema foi montada em HTML, CSS e JavaScript estáticos, com navegação por menus e páginas segmentadas por módulos.
- Há uma camada de serviços em JavaScript em [js/core/apiClient.js](js/core/apiClient.js) e [js/services/baseService.js](js/services/baseService.js) que prepara um cliente HTTP e um padrão de serviços por recurso.
- A base de serviços registra módulos como paciente, médico, exame, agenda, atendimento, financeiro, convênio, usuário e relatório em [js/services/serviceRegistry.js](js/services/serviceRegistry.js).
- O menu principal já possui lógica de navegação, colapso de sidebar, relógio em tempo real e cálculo de tempo de sessão em [Menu-Principal.js](Menu-Principal.js).
- Há um fluxo de logout visual em [Sair/sair-sair.js](Sair/sair-sair.js), com modal, loading e redirecionamento, mas ele ainda é apenas uma simulação front-end.
- Há suporte para fallback em mock data no serviço base, indicando que o front-end ainda não está conectado ao backend real.

### Evidência relevante
- O cliente HTTP foi parcialmente preparado para chamadas REST, mas ainda não há autenticação/autorizações no fluxo: [js/core/apiClient.js](js/core/apiClient.js)
- O serviço base usa `mockEnabled` por padrão, o que torna o sistema operacional em modo simulatório: [js/services/baseService.js](js/services/baseService.js)
- O menu principal exibe usuário fixo (`admin`) e cronômetro de sessão local, sem autenticação real: [Menu-Principal.html](Menu-Principal.html)
- O logout atual apenas simula uma ação de saída e redireciona para a tela principal, sem invalidar sessão no servidor: [Sair/sair-sair.js](Sair/sair-sair.js)

### Classificação
- CRÍTICO: ausência de fluxo de autenticação real no front-end.
- MÉDIO: camada de API preparada, mas sem contrato de autenticação implementado.
- BAIXO: interface de sessão e navegação já estruturada.

---

## 2. O que precisa ser ajustado

### 2.1 Login e autenticação
- Não foi localizado um formulário de login real no workspace atual.
- Não há validação de credenciais conectada ao backend.
- Não há tratamento de resposta 401/403/419.
- Não há guarda de rotas/proteção de páginas.
- Não há persistência ou leitura segura de token/sessão em um contrato definido pela aplicação Java.

### 2.2 Sessão e logout
- O gerenciamento de sessão atual é apenas visual (`sessionStorage` para tempo de uso) e não representa autenticação real: [Menu-Principal.js](Menu-Principal.js)
- O logout deve ser integrado ao endpoint Java de invalidação de sessão/cookie/token, e não apenas ao redirecionamento local.

### 2.3 Tratamento de erros e UX
- O front-end precisa definir um padrão de mensagens de erro para:
  - credenciais inválidas;
  - sessão expirada;
  - usuário bloqueado;
  - servidor indisponível;
  - timeout de requisição.
- Deve existir um estado de loading consistente em todos os formulários e botões de ação.

### 2.4 Estrutura de deploy
- A estrutura atual funciona como front-end estático e pode sofrer problemas com:
  - path raiz do aplicativo Java;
  - URLs relativas em páginas internas;
  - assets e CSS em subpastas;
  - uso de CDN e fontes externas;
  - deploy em WAR/JAR com contexto configurado.

### 2.5 Segurança do front-end
- O navegador não deve decidir sozinho se a sessão é válida; isso deve ser validado pelo backend.
- Não deve haver “autenticação falsa” por localStorage/sessionStorage sem confirmação do servidor.

### Classificação por impacto
- CRÍTICO: ausência de login real e autenticação no front-end.
- CRÍTICO: ausência de guarda de páginas protegidas.
- ALTO: logout e expiração de sessão não conectados ao backend.
- ALTO: uso de caminhos/URLs relativas que dependem do contexto da aplicação Java.
- MÉDIO: dependência de CDN (Font Awesome, Google Fonts, Tailwind CDN) no deploy Java.
- MÉDIO: recursos estáticos e assets sem garantia de resolução em ambiente de WAR/JAR.
- BAIXO: estrutura de serviços pronta para expansão.

---

## 3. O que depende do Back-end

Os itens abaixo dependem da implementação Java existente e devem ser definidos pela equipe backend:

- contrato do endpoint de login;
- formato da resposta de autenticação (cookie, token JWT, sessão HTTP, ou outro);
- nome dos campos de usuário e senha usados no backend;
- política de expiração de sessão;
- endpoint de logout e invalidation de token/cookie/sessão;
- mecanismo de proteção de páginas e rotas no servidor;
- status HTTP e payload de erro para credenciais inválidas;
- mecanismo de refresh/reautenticação, se houver;
- regra de redirecionamento após login e após sessão expirada;
- contexto de deploy e path base da aplicação Java;
- headers e políticas de CORS, se o front-end for servido separadamente.

Todos os pontos acima devem ser preenchidos com:

- DEPENDE DA IMPLEMENTAÇÃO JAVA EXISTENTE

---

## 4. O que NÃO deve ser alterado no Front-end

- Não criar novo sistema de login no front-end.
- Não criar autenticação falsa por localStorage/sessionStorage como solução de produção.
- Não substituir a autenticação existente do Java.
- Não alterar o banco.
- Não forçar “admin” estático como usuário autenticado.
- Não inserir lógica de sessão inventada para contornar o backend.
- Não hardcodear regras de autorização que não forem definidas no Java.
- Não misturar regras de negócio de autenticação com UI do front-end.

---

## 5. Riscos de migração

### Riscos principais
1. CRÍTICO — Contexto da aplicação Java
   - O front-end usa URLs relativas e caminhos de arquivo compatíveis com servidor estático local, mas o deploy em Java/Servlet/AppServer pode exigir `context path` diferente.

2. CRÍTICO — Ausência de contrato de autenticação
   - Sem endpoint e payload definidos, o front-end não consegue garantir segurança ou fluxo funcional correto.

3. ALTO — sessões e tokens
   - A sessão atual em navegador é apenas um cronômetro; sem backend, a aplicação não sabe se o usuário ainda está autenticado.

4. ALTO — logout e redirecionamento
   - O atual redirecionamento local não é invalidado no servidor, então o comportamento real de logout pode ficar inconsistente.

5. MÉDIO — assets e bibliotecas externas
   - Uso de Tailwind CDN, Font Awesome CDN e Google Fonts pode falhar em ambiente restritivo, proxy, rede interna ou deploy sem internet.

6. MÉDIO — CSS/JS em páginas isoladas
   - Algumas páginas possuem dependência de caminhos relativos e arquivos específicos; isso pode quebrar ao mover para um ambiente Java com estrutura diferente.

7. BAIXO — loading e mensagens
   - Sem padrão centralizado, pode haver inconsistência visual e UX ao integrar com o backend real.

---

## 6. Checklist para IntelliJ

### Estrutura e build
- [ ] Confirmar a pasta de recursos estáticos do projeto Java.
- [ ] Verificar se o front-end será servido como estático ou embutido em JSP/Thymeleaf/Servlet.
- [ ] Validar se caminhos relativos continuam funcionando após deploy.
- [ ] Confirmar se o contexto da aplicação é `/` ou um subpath como `/gm4med`.
- [ ] Validar se os links de navegação e redirects respeitam o path base do app.

### Assets e CSS
- [ ] Revisar todos os `href` e `src` de CSS/JS/imagens.
- [ ] Garantir que os arquivos de CSS e JS consigam ser resolvidos em produção Java.
- [ ] Testar fora do ambiente local do VS Code.
- [ ] Substituir CDNs críticas por versões locais, se necessário.
- [ ] Verificar fontes e ícones para garantir funcionamento offline ou em rede restrita.

### JavaScript
- [ ] Validar execução em ambiente Java com contexto de página e servidor real.
- [ ] Revisar `fetch` e endpoints para que usem base URL correta.
- [ ] Garantir que o `ApiClient` consiga receber headers de autenticação do backend.
- [ ] Confirmar que `401`, `403` e `419` acionam comportamento correto de sessão inválida.
- [ ] verificar se o código usa `localStorage`/`sessionStorage` apenas para dados não sensíveis e definidos no contrato.

### Sessão e login
- [ ] Definir o mecanismo real de autenticação do Java.
- [ ] Mapear o endpoint de login, logout e validação de sessão.
- [ ] Definir como o front-end receberá o estado do usuário autenticado.
- [ ] Definir o redirecionamento para login e a página inicial pós-login.
- [ ] Definir fluxo para sessão expirada.
- [ ] Definir tratamento para usuário sem permissão.

### CORS e integração HTTP
- [ ] Verificar se front-end e back-end serão servidos no mesmo domínio ou em domínios diferentes.
- [ ] Definir regra de CORS no Java, se necessário.
- [ ] Confirmar se cookies/sessões exigem `SameSite`, `Secure` e origem correta.

### Encoding / JSON / downloads
- [ ] Validar `charset` e `UTF-8` para textos em português.
- [ ] Verificar payload JSON e resposta do backend.
- [ ] Validar se páginas com relatórios, downloads e impressão continuam funcionando após integração.

### Rodas e proteção de telas
- [ ] Definir lista de páginas públicas e privadas.
- [ ] Definir regra de redirecionamento para acesso sem autenticação.
- [ ] Definir como o sistema deve reagir quando a sessão expirar.

---

## 7. Status da fase

### Status atual
- FASE: análise e preparação de integração.
- SITUAÇÃO: front-end preparado estruturalmente para receber integração, mas ainda não pronto para autenticação real.
- PRINCIPAL BLOQUEADOR: ausência de contrato e implementação de autenticação no backend Java.

### Conclusão
- O front-end está em etapa de preparação para integração, mas não deve ser “ligado” ao Java de forma automática sem a definição do mecanismo real de autenticação.
- A integração precisa seguir o contrato do backend Java e respeitar o modelo de sessão já implementado no IntelliJ.

---

## Resumo executivo

O projeto front-end ainda funciona como aplicação estática com mock data e sem autenticação real. A camada de serviços e a estrutura visual já apontam para um ambiente de integração, mas há necessidade de definir o contrato real com o backend Java para login, sessão, logout, proteção de rotas e tratamento de expiração.