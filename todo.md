<!-- todo.md -->
# Plano de Implementação: Autenticação com Supabase no Sonnda Svelte

## 1. Resumo e Objetivo

Implementar o fluxo de autenticação do usuário na aplicação `sonnda-svelte` utilizando o SDK oficial do Supabase (`@supabase/supabase-js`). O fluxo contempla login com e-mail e senha, redirecionamento para uma página Home protegida exibindo mensagem de boas-vindas com o e-mail do usuário autenticado e opção de logout.

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
├── .env                                # Variáveis de ambiente locais (PUBLIC_SUPABASE_*)
├── src/
│   ├── lib/
│   │   ├── supabaseClient.ts           # Inicialização do cliente Supabase (já existente)
│   │   └── auth.svelte.ts              # Gerenciamento de estado reativo da sessão/usuário
│   └── routes/
│       ├── +layout.svelte              # Layout global com listener de sessão
│       ├── +page.svelte                # Redirecionamento da raiz (-> /home ou /login)
│       ├── login/
│       │   └── +page.svelte            # Tela de login (email e senha)
│       └── home/
│           └── +page.svelte            # Tela protegida com boas-vindas e botão de logout
```

---

## 4. Etapas de Implementação

### Etapa 1: Configuração do Ambiente (.env)
- [ ] Criar o arquivo `.env` na raiz de `sonnda-svelte` baseado no `.env.example`:
  ```env
  PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
  PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
  ```
- [ ] Validar importação em `src/lib/supabaseClient.ts` garantindo que o cliente é instanciado sem erros.

### Etapa 2: Gerenciamento do Estado da Sessão (Runes Svelte 5)
- [ ] Criar `src/lib/auth.svelte.ts` para encapsular a sessão reativa:
  - Armazenar o `user` e a `session` atual utilizando `$state`.
  - Expor métodos auxiliares: `signIn(email, password)`, `signOut()` e inicialização do listener `supabase.auth.onAuthStateChange`.
- [ ] Conectar o listener no ciclo de vida global em `src/routes/+layout.svelte` via `$effect` ou `onMount`.

### Etapa 3: Página de Login (`/login`)
- [ ] Criar a rota `src/routes/login/+page.svelte`:
  - Formulário com campos de E-mail e Senha estilizados com Tailwind CSS.
  - Indicador de carregamento (*loading state*) durante o submit.
  - Exibição de mensagens de erro claras (ex.: credenciais inválidas, campos vazios).
  - Chamada à autenticação via Supabase SDK.
  - Redirecionamento para `/home` após login bem-sucedido via `goto('/home')`.

### Etapa 4: Página Home com Boas-Vindas (`/home`)
- [ ] Criar a rota `src/routes/home/+page.svelte`:
  - Mensagem de recepção: *"Bem-vindo, {user.email}!"*.
  - Exibição de detalhes da conta caso disponíveis (ex.: ID ou data de criação).
  - Botão de ação para **Sair (Logout)** que executa `signOut()` e redireciona para `/login`.

### Etapa 5: Proteção de Rotas e Redirecionamentos
- [ ] Configurar controle de acesso nas rotas:
  - Redirecionar usuários **não autenticados** de `/home` para `/login`.
  - Redirecionar usuários **já autenticados** de `/login` para `/home`.
  - Na rota raiz `/`, redirecionar automaticamente para `/home` (se logado) ou `/login` (se deslogado).

---

## 5. Validação e Testes

- [ ] Iniciar o servidor local com `bun run dev`.
- [ ] Testar tentativa de login com credenciais incorretas (validação de mensagem de erro).
- [ ] Testar login bem-sucedido e conferir redirecionamento para `/home`.
- [ ] Validar exibição do e-mail na página Home.
- [ ] Testar clique no botão de logout e redirecionamento para `/login`.
- [ ] Tentar acessar `/home` em uma aba anônima (confirmar bloqueio e redirecionamento para `/login`).

