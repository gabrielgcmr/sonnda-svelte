<!-- docs/plans/authentication-implementation-plan.md -->

# Plano de Implementação: Autenticação com Supabase no Sonnda Svelte

## 1. Resumo e Objetivo

Implementar o fluxo de autenticação na aplicação `sonnda-svelte` utilizando o SDK oficial do Supabase (`@supabase/supabase-js`) e resolver a conta de domínio do Sonnda pela API. O fluxo contempla cadastro e login com e-mail e senha, carregamento da conta atual, redirecionamento para uma página Home protegida e opção de logout.

---

## 2. Stack e Dependências

- **Framework**: SvelteKit 3 / Svelte 5 (com Runes `$state`, `$derived`, `$effect`, `$props`)
- **Estilização**: Tailwind CSS v4
- **Auth Provider**: `@supabase/supabase-js` v2
- **Runtime / Package Manager**: Bun

---

## 3. Estrutura de Arquivos

```text
sonnda-svelte/
├── .env                                # Variáveis de ambiente locais (API e Supabase)
├── src/
│   ├── env.ts                          # Declaração tipada das variáveis públicas
│   ├── lib/
│   │   ├── apiClient.ts                # Cliente HTTP tipado pelo contrato OpenAPI
│   │   ├── account.svelte.ts           # Estado reativo da Account de domínio
│   │   ├── supabaseClient.ts           # Inicialização do cliente Supabase (já existente)
│   │   └── auth.svelte.ts              # Estado reativo da Session/User do Supabase
│   └── routes/
│       ├── +layout.svelte              # Layout global com listener de sessão
│       ├── +page.svelte                # Redirecionamento da raiz (-> /home ou /login)
│       ├── login/
│       │   └── +page.svelte            # Tela de login (email e senha)
│       ├── register/
│       │   └── +page.svelte            # Tela de cadastro (email e senha)
│       └── home/
│           └── +page.svelte            # Tela protegida com boas-vindas e botão de logout
```

---

## 4. Etapas de Implementação

### Etapa 1: Configuração do Ambiente (.env)

- [x] Criar o arquivo `.env` na raiz de `sonnda-svelte` baseado no `.env.example`:

  ```env
  PUBLIC_API_URL=http://localhost:8080
  PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
  PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
  ```

- [x] Validar importação em `src/lib/supabaseClient.ts` garantindo que o cliente é instanciado sem erros.

### Etapa 2: Gerenciamento do Estado da Sessão (Runes Svelte 5)

- [x] Criar `src/lib/auth.svelte.ts` para encapsular a autenticação do Supabase:
  - Armazenar a `session` com `$state` e derivar o `user` autenticado com `$derived`.
  - Expor métodos auxiliares: `signIn(email, password)`, `signOut()` e inicialização do listener `supabase.auth.onAuthStateChange`.
- [x] Criar `src/lib/account.svelte.ts` para manter a `Account` de domínio separada do `User` do Supabase:
  - Após obter uma sessão, chamar `GET /me` com o access token e armazenar a conta retornada.
  - Limpar a conta no logout e ignorar respostas obsoletas de requisições concorrentes.
- [x] Conectar o listener no ciclo de vida global em `src/routes/+layout.svelte` via `onMount`.

### Etapa 3: Página de Login (`/login`)

- [x] Criar a rota `src/routes/login/+page.svelte`:
  - Formulário com campos de E-mail e Senha estilizados com Tailwind CSS.
  - Indicador de carregamento (_loading state_) durante o submit.
  - Exibição de mensagens de erro claras (ex.: credenciais inválidas, campos vazios).
  - Chamada à autenticação via Supabase SDK.
  - Redirecionamento para `/home` após login bem-sucedido via `goto('/home')`.

### Etapa 4: Cadastro de Usuário (`/register`)

- [x] Adicionar `signUp(email, password)` em `src/lib/auth.svelte.ts` usando `supabase.auth.signUp`.
- [x] Criar a rota `src/routes/register/+page.svelte`:
  - Formulário com campos de e-mail, senha e confirmação de senha.
  - Validação de campos obrigatórios, formato do e-mail e confirmação correspondente; a política de força da senha é validada pelo Supabase.
  - Indicador de carregamento durante o envio e mensagens seguras baseadas nos códigos de erro do Supabase.
  - Link de retorno para `/login` e link de acesso ao cadastro na tela de login.
- [x] Tratar os resultados possíveis do Supabase:
  - Com confirmação de e-mail habilitada, informar que o usuário deve confirmar o endereço antes de entrar.
  - Com sessão criada imediatamente, carregar/provisionar a `Account` por `GET /me` e redirecionar para `/home`.
- [x] Não criar a `Account` diretamente pelo frontend; manter o provisionamento na API após a primeira sessão autenticada.

### Etapa 5: Página Home com Boas-Vindas (`/home`)

- [x] Criar a rota `src/routes/home/+page.svelte`:
  - Mensagem de recepção usando `account.profile.full_name`, com `user.email` como fallback.
  - Exibição de detalhes da conta caso disponíveis (ex.: ID ou data de criação).
  - Botão de ação para **Sair (Logout)** que executa `signOut()` e redireciona para `/login`.

### Etapa 6: Proteção de Rotas e Redirecionamentos

- [x] Configurar controle de acesso nas rotas:
  - [x] Redirecionar usuários **não autenticados** de `/home` para `/login`.
  - [x] Redirecionar usuários **já autenticados** de `/login` para `/home`.
  - [x] Redirecionar usuários **já autenticados** de `/register` para `/home`.
  - [x] Na rota raiz `/`, redirecionar automaticamente para `/home` (se logado) ou `/login` (se deslogado).

---

## 5. Validação e Testes

- [x] Iniciar o servidor local com `bun run dev`.
- [ ] Testar cadastro com campos vazios, e-mail inválido, senha fraca e confirmação diferente.
- [ ] Testar cadastro com e-mail já registrado.
- [ ] Testar cadastro bem-sucedido com confirmação de e-mail habilitada e desabilitada.
- [ ] Confirmar que a `Account` é provisionada pela API somente após existir uma sessão autenticada.
- [ ] Testar tentativa de login com credenciais incorretas (validação de mensagem de erro).
- [ ] Testar login bem-sucedido e conferir redirecionamento para `/home`.
- [ ] Validar exibição do e-mail na página Home.
- [ ] Testar clique no botão de logout e redirecionamento para `/login`.
- [ ] Tentar acessar `/home` em uma aba anônima (confirmar bloqueio e redirecionamento para `/login`).
