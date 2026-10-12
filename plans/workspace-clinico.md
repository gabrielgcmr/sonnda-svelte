<!-- plans/workspace-clinico.md -->

# Implementação em etapas do workspace clínico

## Direção consolidada

A barra esquerda será global, com ferramentas clínicas e uma biblioteca temporária de capturas. O centro exibirá a rota atual; o painel direito aparecerá apenas no contexto de um paciente.

**A conexão iniciada continuará recebendo heartbeat enquanto o workspace estiver aberto, mesmo com Capturas recolhido.** A atualização da lista poderá parar quando o painel estiver fechado. A retenção dos arquivos continuará exclusivamente no backend.

## Etapa 1 — Estrutura do workspace e navegação

- Criar `WorkspaceLayout.svelte` em `src/lib/layout`, com composição simples para laterais e conteúdo central.
- Criar `ClinicalSidebar.svelte` na mesma pasta, reutilizando `UserNavigation`.
- Montar a barra no layout autenticado, abaixo do header global.
- Usar aproximadamente 300 px expandida e 56 px recolhida, com botão acessível. Preservar a expansão durante a navegação, em memória do layout.
- Substituir a navegação horizontal pelos links laterais existentes: pacientes, exames e calculadoras.
- Mostrar atestados, relatórios, LME e assistência ao diagnóstico como itens desabilitados “Em breve”.
- Remover limites de largura dos contêineres estruturais; manter `min-w-0 flex-1` no centro e limites internos para textos e formulários.
- Adaptar grades à largura disponível e preservar rolagem local das tabelas.

**Arquivos principais:** layout de `(app)`, layout de home, `AppHeader`, `UserNavigation` e páginas de exames, calculadoras e cadastro de paciente.

**Resultado:** navegação global recolhível e conteúdo central funcional, sem sobreposição ou overflow horizontal.

## Etapa 2 — Biblioteca de capturas e conexão independente do painel

Separar as duas responsabilidades hoje concentradas em `DesktopCaptureInbox`:

| Responsabilidade   | Local e duração                                                       |
| ------------------ | --------------------------------------------------------------------- |
| Conexão do celular | Controlador pertencente à instância do layout autenticado.            |
| Lista de capturas  | Estado temporário do painel, recuperado pelo backend a cada abertura. |

### Conexão

- Refatorar o módulo `desktopCapture.svelte.ts` para manter apenas sessão, QR, presença, heartbeat e encerramento.
- Criar a instância no layout autenticado e passá-la ao painel por props.
- Não criar singleton, contexto Svelte ou registro de ações.
- Abrir o workspace não cria uma sessão. A conexão é iniciada ao abrir Capturas.
- Após iniciar, manter heartbeat de 20 segundos independentemente da expansão da barra ou do painel.
- Navegar entre páginas autenticadas não reinicia a conexão.
- Ao retornar à aba, verificar imediatamente a conexão e retomar o acompanhamento.
- Encerrar explicitamente, sair da conta ou desmontar o workspace interrompe o heartbeat. Fechar o navegador não exige manter conexão.
- Remover a retomada baseada em `rememberedDesktopSession`; consultar a sessão existente no backend.

### Lista

- Ao abrir Capturas, consultar arquivos e conexão independentemente.
- Exibir QR/estado da conexão no topo e arquivos anteriores abaixo, inclusive com celular desconectado.
- Atualizar a lista a cada 5 segundos enquanto o painel estiver aberto e a aba visível.
- Fechar o painel interrompe somente a atualização da lista.
- Reabrir consulta novamente o backend, sem depender de arquivos mantidos em memória.
- Preservar a lista já carregada quando uma atualização falhar; erros da conexão não bloqueiam os arquivos.
- Usar a paginação existente com “Carregar mais”.
- Ao mudar de conta, limpar imediatamente a representação local e descartar respostas pendentes da conta anterior.

**Arquivos principais:** `CaptureInboxPanel.svelte`, `desktopCapture.svelte.ts`, `desktopCaptureApi.ts`, layout autenticado e consumidores do helper de logout. Remover o registro global da inbox e a persistência desktop que deixarem de ser usados.

**Resultado:** o médico pode conectar, recolher Capturas, navegar para o prontuário e continuar enviando documentos.

## Etapa 3 — Arrastar capturas para a extração de exames

- Tornar os itens arrastáveis com HTML Drag and Drop API nativo.
- Adicionar `captureDrag.ts` na feature `capture`, com contrato simples contendo ID, nome e MIME type. Não transportar bytes, credenciais ou URLs assinadas.
- Adaptar a área de envio de `/home/exams` para receber uma captura.
- Soltar um PDF **seleciona o documento**; clicar em **“Extrair dados”** inicia o processamento.
- Reutilizar `LabExtractionState.selectCapture` e o endpoint existente `/lab-extractions/from-capture`.
- Manter a captura na biblioteca após utilizá-la, sem renovar sua expiração.
- Informar que imagens ainda não são aceitas pelo extrator laboratorial.
- Preservar upload local e oferecer seleção de captura por teclado no formulário, consultando o backend sem iniciar conexão.
- Remover botões e regras de extração do painel global, tornando-o independente da ferramenta.
- Mover a formatação compartilhada de tamanho de arquivo para `src/lib/ui/formatFileSize.ts`.

**Resultado:** a biblioteca fornece documentos às ferramentas sem compartilhar estado clínico ou callbacks entre páginas.

## Etapa 4 — Painel contextual do paciente

- Criar `PatientContextPanel.svelte` em `src/lib/features/patient`.
- Montá-lo no layout `/patients/[patientId]`, com aproximadamente 280 px.
- Reutilizar `PatientIdentity` e `PatientNavigation`, adaptados à apresentação vertical.
- Mostrar dados existentes do paciente e acessos a problemas, medicamentos e exames, preservando os destinos atuais.
- Manter estados de carregamento, erro e “Em breve” onde ainda não há conteúdo clínico implementado.
- Ao navegar para ferramentas globais, retirar o painel direito: essas rotas continuam sem paciente associado.

**Resultado:** composição `[Ferramentas e capturas] [Workspace] [Paciente]`, sem implementar novas funcionalidades clínicas.

## Etapa 5 — Validação concentrada em quatro comportamentos

1. **Retorno após fechar o navegador:** um upload concluído continua disponível ao reabrir e autenticar na mesma conta, dentro das 24 horas, sem depender de sessão de captura anterior.
2. **QR e arquivos simultâneos:** sem celular conectado, apresentar QR no topo e capturas anteriores abaixo.
3. **Arrastar e confirmar:** soltar um PDF apenas seleciona; nenhuma extração é enviada antes do clique em “Extrair dados”.
4. **Isolamento entre contas:** mudar de conta remove os dados anteriores, inclusive quando há consultas pendentes.

Executar `bun run validate` e uma revisão visual desktop do layout. Aproveitar os testes existentes e concentrar novos testes nesses quatro comportamentos, sem criar uma matriz extensa.

## Infraestrutura e limites desta entrega

O código da API já oferece retenção independente da conexão, com expiração após 24 horas e limpeza física por job horário. Os testes de captura e limpeza passaram durante a investigação.

No Supabase configurado, faltam as tabelas e o agendador de capturas. **Ativar as migrations e o job existentes permanece uma etapa separada**, necessária para a validação integrada. Esta implementação não modifica o backend nem aplica migrations.

Manter o tema, os componentes existentes, as convenções de imports e os comentários de caminho. Registrar ferramentas futuras no backlog, sem implementá-las. Login, cadastro inicial e a página de envio pelo celular permanecem fora do workspace.
