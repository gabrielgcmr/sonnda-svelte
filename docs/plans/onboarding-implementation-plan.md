<!-- docs/plans/onboarding-implementation-plan.md -->

# Fundação visual, arquitetura e onboarding

## 1. Resumo e objetivo

Organizar o frontend por feature, aplicar temas claro e escuro e implementar o onboarding em uma única tela. Nome e data de nascimento serão obrigatórios; CPF e telefone aparecerão como opcionais. A API existente será consumida por `PATCH /me`, sem mudanças no backend ou no banco.

---

## 2. Fundação visual

- [x] Mover o CSS global de `src/routes/layout.css` para `src/styles/app.css` e manter uma única importação no layout raiz.
- [x] Organizar as paletas em `src/styles/themes/` de acordo com seus seletores reais, pois os nomes atuais dos arquivos não correspondem integralmente ao conteúdo:
  - Usar a paleta que declara `.light` como tema claro ativo.
  - Usar a paleta que declara `.dark` como tema escuro ativo.
  - Manter as variantes de contraste em `src/styles/themes/variants/`, sem carregá-las como temas ativos nesta entrega.
- [x] Mapear os tokens `--md-sys-color-*` para tokens Tailwind semânticos com `@theme inline`, cobrindo marca, superfícies, textos, bordas, sucesso, alerta e erro.
- [x] Aplicar a classe `.light` ou `.dark` no elemento `<html>` antes da hidratação para evitar flash do tema incorreto.
- [x] Resolver o tema inicial nesta ordem:
  1. Preferência persistida em `localStorage` sob a chave `sonnda-theme`.
  2. Preferência do sistema via `prefers-color-scheme`.
  3. Tema claro como fallback.
- [x] Criar um estado reativo de tema com `light`, `dark` e `system`, persistindo apenas escolhas explícitas e acompanhando mudanças do sistema enquanto o modo for `system`.
- [x] Criar um `ThemeToggle` acessível, com rótulo e estado anunciados, disponível nas telas de autenticação e no cabeçalho autenticado.
- [x] Criar componentes compartilhados `Button`, `TextField`, `Alert`, `Card` e um shell de autenticação, usando exclusivamente tokens semânticos.
- [x] Migrar Login, Cadastro e Home para os componentes e tokens novos, preservando seus comportamentos atuais.

---

## 3. Arquitetura frontend

- [x] Organizar `src/lib` por responsabilidade:

  ```text
  src/lib/
  ├── api/
  │   └── client.ts
  ├── features/
  │   ├── auth/
  │   │   ├── auth.svelte.ts
  │   │   ├── routing.ts
  │   │   └── supabaseClient.ts
  │   └── account/
  │       ├── account.svelte.ts
  │       ├── accountApi.ts
  │       └── types.ts
  ├── generated/
  │   └── openapi.d.ts
  └── ui/
      ├── Alert.svelte
      ├── AuthShell.svelte
      ├── Button.svelte
      ├── Card.svelte
      ├── TextField.svelte
      └── ThemeToggle.svelte
  ```

- [x] Atualizar imports e testes após as movimentações, sem criar barrels que introduzam dependências circulares.
- [x] Manter o estado com runes do Svelte; não adicionar biblioteca externa de gerenciamento de estado.
- [x] Manter `src/lib/generated/openapi.d.ts` como código gerado e nunca editá-lo manualmente.
- [x] Separar chamadas HTTP da feature `account` do seu estado reativo.
- [x] Definir os tipos `Account`, `AccountProblem` e `UpdateAccountInput` a partir do contrato OpenAPI gerado.

---

## 4. Estado da Account

- [x] Evoluir o estado da conta para expor:
  - `status`: `idle | loading | ready | error`.
  - `account`: conta resolvida ou `null`.
  - `problem`: Problem Details seguro ou `null`.
  - `saving`: estado independente de atualização do perfil.
  - `load(accessToken)`, `updateProfile(accessToken, input)` e `clear()`.
- [x] Implementar `GET /me` e `PATCH /me` no módulo `accountApi.ts`, enviando `Authorization: Bearer <access_token>`.
- [x] Em atualização bem-sucedida, substituir a `Account` local pela resposta da API.
- [x] Em falha de atualização, preservar a conta anterior e disponibilizar o Problem Details para a interface.
- [x] Normalizar falhas de rede para uma mensagem segura, sem exibir exceções internas.
- [x] Continuar invalidando respostas antigas quando logout, troca de sessão ou uma requisição mais recente tornar a operação obsoleta.

---

## 5. Onboarding (`/onboarding`)

- [x] Criar uma única tela com:
  - Nome completo obrigatório, normalizado com `trim`, entre 2 e 120 caracteres.
  - Data de nascimento obrigatória, no formato de data e não futura.
  - CPF opcional; remover pontuação e aceitar exatamente 11 dígitos quando preenchido.
  - Telefone opcional; remover espaços e pontuação, preservar `+` inicial e aceitar entre 10 e 15 dígitos.
- [x] Inicializar o formulário com valores já presentes em `account.profile`, permitindo retomada do onboarding.
- [x] Omitir CPF e telefone vazios do payload; não enviar `null` durante o onboarding.
- [x] Exibir validações locais junto aos campos e Problem Details da API em um alerta geral.
- [x] Bloquear submissões duplicadas e apresentar loading durante `PATCH /me`.
- [x] Quando a resposta retornar `onboarding_completed: true`, atualizar o estado e navegar para `/home`.
- [x] Se a resposta for aceita mas continuar incompleta, permanecer na tela e destacar nome ou nascimento pendentes.
- [x] Oferecer logout na tela para que o usuário possa trocar de conta.

---

## 6. Navegação e proteção

- [x] Expandir a regra centralizada para considerar autenticação, resolução da Account e `onboarding_completed`.
- [x] Aplicar a matriz:
  - Sem sessão: `/home` e `/onboarding` redirecionam para `/login`.
  - Com sessão e Account incompleta: `/`, `/login`, `/register` e `/home` redirecionam para `/onboarding`.
  - Com sessão e Account completa: `/`, `/login`, `/register` e `/onboarding` redirecionam para `/home`.
- [x] Não decidir o destino enquanto a Account estiver em `idle` ou `loading`.
- [x] Em falha ao resolver a Account, exibir um estado recuperável com **Tentar novamente**, sem redirecionamento em ciclo.
- [x] Preservar `replaceState` nos redirecionamentos automáticos.

---

## 7. Interfaces afetadas

- Nenhuma mudança no contrato da API ou no banco.
- O frontend passa a consumir `PATCH /me` com `UpdateAccountRequest`.
- O estado público da Account passa a expor status de resolução, `saving`, `problem`, `load`, `updateProfile` e `clear`.
- A resolução de rotas passa a receber estado de autenticação, resolução da conta e conclusão do onboarding.
- O tema público passa a aceitar `light`, `dark` e `system`, persistindo a escolha explícita do usuário.

---

## 8. Testes e critérios de aceite

- [x] Testar seleção inicial, persistência, alternância e ausência de flash dos temas claro e escuro.
- [x] Verificar contraste, foco visível e legibilidade dos componentes nos dois temas.
- [x] Testar `PATCH /me`: payload normalizado, sucesso, 400/403/409/422/500, falha de rede e resposta obsoleta.
- [x] Testar validações de nome, nascimento futuro, CPF e telefone.
- [x] Cobrir a matriz de rotas para usuário anônimo, Account incompleta, Account completa, carregamento e erro.
- [x] Testar que cadastro com sessão imediata direciona ao onboarding quando a Account nasce incompleta.
- [x] Testar que login após confirmação de e-mail também direciona ao onboarding.
- [x] Testar retomada e conclusão do onboarding, atualização do estado e redirecionamento para a Home.
- [x] Executar `svelte-check`, testes unitários, ESLint e build.
- [x] Fazer regressão manual de Login, Cadastro, Home, Logout e alternância de tema em viewport móvel e desktop.

---

## 9. Premissas

- O onboarding MVP será uma única tela.
- CPF e telefone serão opcionais na mesma tela.
- Nome e nascimento são a única regra de conclusão, conforme a API.
- A autenticação permanece client-side; a migração para cookies SSR continua no backlog.
- Apenas os temas claro e escuro padrão serão ativados; variantes de médio e alto contraste exigem revisão própria antes de serem expostas.
