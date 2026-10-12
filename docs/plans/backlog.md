<!-- docs/plans/backlog.md -->

# Backlog técnico

## Prioridades

### P0

#### Crítico — corrigir imediatamente

Vulnerabilidades exploráveis, perda de dados ou falhas graves de autenticação e autorização.

### P1

#### Alta — próxima oportunidade

Melhorias importantes de confiabilidade, arquitetura e manutenção.

#### Retirar o cache temporário de dependências do repositório

- **Justificativa:** 488 arquivos sob `.tmp/` estão versionados. O `prettier --check .` tenta formatar dependências extraídas ali e falha, impedindo `bun run validate` mesmo quando o código da aplicação está correto.
- **Condições para implementação:** confirmar que não há conteúdo de projeto em `.tmp/`, retirar somente esses arquivos do Git, ignorar o diretório e repetir `bun run validate` com uma instalação limpa.

#### Extrair imagens na extração avulsa

- **Justificativa:** o celular já envia JPEG e PNG para a caixa de capturas, mas o extrator avulso só aceita PDF. `POST /lab-extractions/from-capture` recusa uma captura que não seja PDF, e o painel não oferece "Extrair" para imagens.
- **Condições para implementação:** aceitar JPEG e PNG na extração avulsa, no envio direto e a partir da captura; extrair o conteúdo da imagem; habilitar "Extrair" para esses arquivos no painel de `/home/exams`.

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

### P3 — Ampliar as ferramentas clínicas da barra global

- **Justificativa:** a barra apresenta extração de atestados, extração de relatórios médicos, LME e assistência ao diagnóstico como recursos “Em breve”. Cada recurso precisa de um fluxo e contrato próprios antes de se tornar navegável.
- **Condições para implementação:** definir entradas, resultados e vínculo com o paciente de cada ferramenta; implementar suas rotas e integrações; habilitar os itens individualmente quando estiverem funcionais. Para assistência ao diagnóstico, definir também revisão pelo profissional e limites de uso. Não ampliar automaticamente a extração laboratorial para esses documentos.
- **Plano relacionado:** `plans/workspace-clinico.md`.

### P2 — Isolar a URL da API nos testes de captura

- **Justificativa:** três testes de `captureApi.test.ts` pressupõem `http://localhost:8080`, mas o módulo lê `PUBLIC_API_URL` do ambiente. Uma configuração local diferente faz a validação falhar sem mudança de comportamento.
- **Condições para implementação:** fornecer configuração determinística no ambiente de teste ou simular o módulo de configuração. A suíte deve passar independentemente do endereço da API no `.env`, sem alterar a configuração de desenvolvimento.
