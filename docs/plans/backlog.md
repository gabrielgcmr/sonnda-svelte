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

### P2 — Definir o adapter de produção do SvelteKit

- **Justificativa:** a aplicação ainda usa `@sveltejs/adapter-auto`, adequado enquanto o destino de hospedagem não foi escolhido, mas o build não consegue confirmar antecipadamente o runtime de produção.
- **Condições para implementação:** escolher o provedor de hospedagem e substituir o adapter automático pelo adapter oficial correspondente, validando variáveis de ambiente, SSR e o comando de inicialização no ambiente final.
