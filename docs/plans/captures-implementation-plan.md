<!-- docs/plans/captures-implementation-plan.md -->

# Capturas: plano de implementação em etapas

## Resumo

Permitir enviar PDFs de exames pelo celular e usá-los no extrator avulso da web. O QR abre uma página web de captura sem login; o computador exibe os PDFs recebidos num painel na página do extrator. O arrasto leva apenas o identificador da captura, e a API lê o arquivo no servidor.

Escopo desta entrega: **somente PDF** e **somente o extrator avulso** (`/home/exams`). Imagens, Exames do paciente, painel global e demais destinos estão no backlog (`docs/plans/backlog.md`).

## Etapas

### 1. API, pareamento e armazenamento

Detalhada em `sonnda-api/docs/plans/captures-api-foundation-plan.md` (branch `capture`). Subetapas 1.1–1.4 concluídas; 1.5.1–1.5.4 pendentes. Resumo do que o frontend consome:

- Sessões e capturas temporárias no PostgreSQL e no bucket privado `captures` do Supabase Storage.
- O QR contém um código de uso único válido por 5 minutos. `POST /capture-sessions/claim` o troca por uma credencial opaca (`X-Capture-Token`), restrita a heartbeat do celular e upload, válida por até 12 horas. A API guarda só o hash.
- Criar nova sessão revoga a anterior da conta; `DELETE /capture-sessions/{sessionId}` revoga a sessão e invalida a credencial do celular na hora.
- O upload exige heartbeat do computador nos últimos 60 segundos.
- A API aceita PDF, JPEG e PNG de até 5 MiB. Nesta entrega o frontend só oferece PDF.
- Capturas expiram em 24 horas e podem ser excluídas manualmente.

### 2. Página móvel

- Rota pública `/capture?code=...`, fora do grupo autenticado, que reivindica o código e guarda a credencial apenas em `sessionStorage`.
- Seletor de arquivo com `accept="application/pdf"`, validação de tipo e de 5 MiB antes do envio, progresso e lista do que foi enviado nesta sessão.
- Heartbeat do celular a cada 20 segundos enquanto a página estiver visível.
- Mensagens distintas para QR expirado ou já usado, sessão encerrada no computador (credencial revogada ou vencida: pedir novo QR) e computador ausente (pedir para abrir o Sonnda no computador e tentar de novo, sem descartar o arquivo selecionado).

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

Publicar os novos endpoints no OpenAPI da API e regenerar os tipos do frontend, sem editar o arquivo gerado manualmente. Implementar cada etapa como entrega revisável, com testes de QR expirado ou reutilizado, sessão revogada, troca de conta, logout, acesso a captura de outra conta, arquivo inválido ou acima de 5 MiB, captura expirada e reutilização da mesma captura. Verificar o fluxo completo em celular e desktop, inclusive perda de conexão durante o envio, aba do computador em segundo plano e computador ausente no momento do upload.

## Premissas

- “Conectado” indica presença recente do celular e do computador; os documentos continuam visíveis quando o celular se desconecta.
- PDFs sem texto selecionável podem ser capturados, mas o extrator apresentará uma mensagem de incompatibilidade e manterá o arquivo na caixa de entrada.
- O arrasto nativo não funciona em telas de toque; o botão “Extrair” cobre esse caso.
