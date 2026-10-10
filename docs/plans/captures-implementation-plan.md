<!-- docs/plans/captures-implementation-plan.md -->

# Capturas: plano de implementação em etapas

## Resumo

Permitir enviar PDFs de exames pelo celular e usá-los no extrator avulso da web. O QR abre uma página web de captura sem login; o computador exibe os PDFs recebidos num painel na página do extrator. O arrasto leva apenas o identificador da captura, e a API lê o arquivo no servidor.

Escopo desta entrega: **somente PDF** e **somente o extrator avulso** (`/home/exams`). Imagens, Exames do paciente, painel global e demais destinos estão no backlog (`docs/plans/backlog.md`).

## Etapas

### 1. API, pareamento e armazenamento

Detalhada em `sonnda-api/docs/plans/captures-api-foundation-plan.md` (branch `capture`). **Concluída**, inclusive as subetapas 1.5.1–1.5.4. Resumo do que o frontend consome:

- Sessões e capturas temporárias no PostgreSQL e no bucket privado `captures` do Supabase Storage.
- O QR contém um código de uso único válido por 5 minutos. `POST /capture-sessions/claim` o troca por uma credencial opaca (`X-Capture-Token`), restrita a heartbeat do celular e upload, válida por até 12 horas. A API guarda só o hash.
- Criar nova sessão revoga a anterior da conta; `DELETE /capture-sessions/{sessionId}` revoga a sessão e invalida a credencial do celular na hora.
- O upload exige heartbeat do computador nos últimos 60 segundos.
- A API aceita PDF, JPEG e PNG de até 5 MiB. Nesta entrega o frontend só oferece PDF.
- Capturas expiram em 24 horas e podem ser excluídas manualmente.

### 2. Página móvel

Página pública em que o celular reivindica o QR e envia PDFs. Entregar nesta ordem; cada subetapa é uma revisão própria.

#### 2.1 — Rota pública fora da área autenticada

- Criar `src/routes/capture/+page.svelte`, fora de `(app)`, em `/capture`.
- Manter `/capture` fora de `isAuthManagedRoute`: visitante sem sessão permanece na página, e sessão autenticada não é desviada para `/home` nem `/onboarding`.
- Ler `code` da query. Sem código e sem credencial já guardada, orientar a abrir o QR de novo, sem chamar a API.
- Não usar o shell autenticado nem exigir onboarding.

**Aceite:** testes de roteamento cobrem `/capture` anônimo e autenticado, com e sem barra final; a página não entra no grupo `(app)`.

#### 2.2 — Reivindicação do código e credencial

- Separar cliente HTTP e estado em `src/lib/features/capture/`, no mesmo desenho das outras features: chamadas fora do módulo de runes.
- `POST /capture-sessions/claim` com `{ "code": "..." }`, sem Bearer do Supabase.
- Guardar somente `session_id`, `upload_token` e `expires_at` em `sessionStorage`. Não usar `localStorage` e não registrar o código nem o token.
- Depois do sucesso, tirar `code` da URL com `replaceState`. Recarregar restaura a credencial ainda válida. Um código novo na URL inicia outra reivindicação e substitui a credencial anterior.
- Falha de reivindicação — código inválido, expirado, já usado, sessão revogada ou computador ausente nesse momento — chega como a mesma resposta da API (`código de pareamento inválido ou expirado`). Mostrar um único pedido de novo QR. A API não distingue esses casos na reivindicação.

**Aceite:** o token não volta na URL nem no `localStorage`; recarregar não reivindica de novo o código já consumido; falha de claim não habilita o envio.

#### 2.3 — Heartbeat do celular e presença do computador

- Com credencial válida, `POST /capture-sessions/{sessionId}/mobile-heartbeat` enviando `X-Capture-Token` a cada 20 segundos enquanto `document.visibilityState` for `visible`.
- Pausar o timer com a página oculta e disparar um heartbeat imediato ao voltar ao primeiro plano (`visibilitychange`).
- Parar o timer ao sair da página. Não apagar a credencial só porque o componente desmontou.
- Usar `desktop_present` da resposta para o aviso de computador ausente. `connected` exige as duas presenças; ausência do computador não encerra a credencial.
- Heartbeat com credencial inválida ou expirada limpa o `sessionStorage` e pede um novo QR.

**Aceite:** aba oculta não mantém o intervalo de 20 segundos; ao voltar, a presença é atualizada na hora; `desktop_present: false` não encerra a credencial.

#### 2.4 — Seleção, validação, envio e lista desta sessão

- Seletor com `accept="application/pdf"`. Validar no cliente, antes do `POST /captures`, conteúdo `%PDF-` e no máximo 5 MiB. Não reutilizar o limite de 10 MB do extrator.
- Enviar um único arquivo em `multipart` no campo `file`, com `X-Capture-Token`. Mostrar progresso e, ao concluir, o nome na lista do que esta página enviou. A credencial do celular não lista `GET /captures`; a lista é só local.
- Se `desktop_present` for falso, não enviar: pedir para abrir o Sonnda no computador e tentar de novo, mantendo o arquivo selecionado.
- Se o upload responder credencial inválida, consultar o heartbeat. Heartbeat ainda válido indica computador ausente: manter o arquivo. Heartbeat com credencial inválida indica sessão encerrada: limpar a credencial e pedir novo QR.
- Falha de rede ou erro transitório mantém o arquivo e permite tentar de novo. Arquivo vazio, acima de 5 MiB ou que não seja PDF fica só na validação local, sem request.

**Aceite:** PDF válido dentro do limite segue para o upload; JPEG, PNG e arquivo maior não saem do celular; computador ausente e sessão encerrada produzem as duas mensagens acima, e só a segunda apaga a credencial.

### 3. Painel de capturas no extrator avulso

- Em `/home/exams`, painel lateral com QR, estado da conexão e lista de PDFs recebidos. Uma desconexão não oculta capturas já recebidas.
- A sessão só é criada quando o usuário abre o painel, não ao entrar na área autenticada.
- Heartbeat do computador:
  - a cada 20 segundos enquanto existir sessão ativa e a página estiver montada;
  - envio imediato ao voltar a aba para primeiro plano (`visibilitychange`), porque navegadores reduzem timers em abas ocultas e a presença pode cair após 60 segundos;
  - o heartbeat para ao sair da página; a sessão não é revogada ao trocar de rota, para não invalidar o celular por navegação acidental.
- Revogar explicitamente a sessão (`DELETE`) em “Encerrar conexão”, no logout e na troca de conta, antes de limpar o estado local.
- Atualizar a lista por consulta periódica enquanto o painel estiver aberto.

### 4. Arrasto para extração avulsa

- Usar o arrasto nativo para transmitir somente `captureId`; oferecer também um botão “Extrair” em cada item, para teclado e telas sem arrasto.
- Adicionar na API `POST /lab-extractions/from-capture`, autenticado, com corpo `{ "capture_id": "..." }` e a mesma resposta da extração atual.
- A API verifica propriedade, estado `available` e validade da captura, recusa MIME diferente de PDF e lê o arquivo no servidor.
- Preservar o envio direto de PDF já existente. O resultado continua sem associação a paciente; a captura original permanece disponível até exclusão ou expiração.

## Contratos e verificação

Publicar os novos endpoints no OpenAPI da API e regenerar os tipos do frontend, sem editar o arquivo gerado manualmente. Implementar cada etapa, e cada subetapa da etapa 2, como entrega revisável, com testes de QR expirado ou reutilizado, sessão revogada, troca de conta, logout, acesso a captura de outra conta, arquivo inválido ou acima de 5 MiB, captura expirada e reutilização da mesma captura. Verificar o fluxo completo em celular e desktop, inclusive perda de conexão durante o envio, aba do computador em segundo plano e computador ausente no momento do upload.

## Premissas

- “Conectado” indica presença recente do celular e do computador; os documentos continuam visíveis quando o celular se desconecta.
- PDFs sem texto selecionável podem ser capturados, mas o extrator apresentará uma mensagem de incompatibilidade e manterá o arquivo na caixa de entrada.
- O arrasto nativo não funciona em telas de toque; o botão “Extrair” cobre esse caso.
