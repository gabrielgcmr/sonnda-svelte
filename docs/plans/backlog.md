<!-- docs/plans/backlog.md -->

# Backlog técnico

## Prioridades

### P0

#### Crítico — corrigir imediatamente

Vulnerabilidades exploráveis, perda de dados ou falhas graves de autenticação e autorização.

### P1

#### Alta — próxima oportunidade

Melhorias importantes de confiabilidade, arquitetura e manutenção.

### P2

#### Média — planejado**

Melhorias úteis, mas que não bloqueiam o desenvolvimento atual.

### P3

#### Baixa — futuro ou condicional**

Funcionalidades que dependem de uma decisão arquitetural futura.

## Itens

### P3 — Migrar a autenticação para sessão SSR com cookies

- **Justificativa:** a proteção atual de `/`, `/login` e `/home` ocorre no navegador após a hidratação. A API continua protegida pela validação do Bearer token, portanto não há vulnerabilidade conhecida, mas o SSR permitiria decidir redirecionamentos no servidor e evitar depender do estado de autenticação client-side.
- **Condições para implementação:** adotar a integração SSR do Supabase, definir cookies seguros e seu ciclo de renovação, disponibilizar a sessão aos loaders/hooks do SvelteKit e revisar os redirecionamentos e o cliente da API para funcionar no servidor e no navegador.

### P2 — Alinhar o projeto com o modo de aplicação do SvelteKit

- **Justificativa:** o projeto ainda usa a estrutura de pacote/biblioteca criada pelo template, então `bun run build` também executa `svelte-package` e avisa que imports específicos do SvelteKit não têm `@sveltejs/kit` declarado como dependência ou peer dependency. O build da aplicação conclui, mas a configuração mistura objetivos de aplicação e biblioteca.
- **Condições para implementação:** confirmar que o frontend não será publicado como biblioteca, remover o fluxo de empacotamento (`svelte-package`, `publint`, `exports` e `files`) e adotar um adapter de produção compatível com o ambiente de deploy; se houver publicação como biblioteca, declarar corretamente as dependências públicas em vez de remover o fluxo.
