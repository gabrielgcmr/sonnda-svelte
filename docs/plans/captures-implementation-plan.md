<!-- docs/plans/captures-implementation-plan.md -->

# Capturas: plano de implementação em etapas

## Resumo

Criar uma caixa de entrada temporária de imagens e PDFs capturados pelo celular. O QR abre uma página web de captura sem login; o computador exibe os arquivos em um painel à direita. O arrasto leva apenas o identificador da captura, e cada destino decide como processá-la.

A primeira entrega funcional terá dois destinos: **extração avulsa** e **Exames do paciente**. A opção “Utilizar em...” fica fora do plano.

## Etapas

### 1. API, pareamento e armazenamento

- Criar sessões de pareamento vinculadas à conta autenticada e capturas temporárias no PostgreSQL e no GCS privado.
- O QR contém um código de uso único válido por 5 minutos; sua troca concede ao celular uma credencial restrita a enviar arquivos, válida por até 12 horas.
- O envio exige presença recente da sessão no computador e cessa até 60 segundos após seu fechamento.
- Aceitar PDF, JPEG e PNG de até 10 MB, validar o conteúdo na API, permitir exclusão manual e remover arquivos e registros após 24 horas por uma rotina de limpeza idempotente.

### 2. Página móvel e painel global

- Criar uma rota móvel para fotografar ou selecionar imagens e PDFs sem escolher categoria clínica.
- No layout autenticado, integrar “Capturas” à barra direita existente, com painel que permanece aberto durante a navegação.
- Mostrar QR, estado da conexão e lista de arquivos de forma independente: uma desconexão não oculta capturas recebidas.
- Atualizar a lista por consulta periódica e limpar o estado local ao trocar de conta ou sair.

### 3. Arrasto para extração avulsa

- Usar o arrasto nativo para transmitir somente `captureId`.
- Adicionar `POST /lab-extractions/from-capture`, autenticado, com corpo `{ "capture_id": "..." }` e a mesma resposta da extração atual.
- A API verifica a propriedade e a validade da captura, lê o arquivo no servidor e amplia o extrator para JPEG/PNG.
- Preservar o envio direto de PDF já existente. O resultado avulso continua sem associação a paciente; a captura original permanece disponível até exclusão ou expiração.

### 4. Arrasto para Exames do paciente

- Adicionar `POST /patients/{patientId}/exam-documents/from-capture` com o mesmo corpo.
- A API verifica novamente o acesso ao paciente, processa o arquivo e cria um rascunho com cópia própria do documento, independente da expiração da captura.
- Substituir o placeholder de Exames pela conferência do resultado e pelas ações existentes de confirmar ou descartar.
- Soltar o arquivo nunca confirma dados clínicos automaticamente.

## Contratos e verificação

Publicar os novos endpoints no OpenAPI da API e regenerar os tipos do frontend, sem editar o arquivo gerado manualmente. Implementar cada etapa como entrega revisável, com testes de sessão expirada ou revogada, troca de conta, acesso negado, arquivo inválido, limpeza após 24 horas e reutilização da mesma captura. Verificar o fluxo completo em celular e desktop, inclusive perda de conexão durante o envio, navegação com o painel aberto e revisão antes da confirmação.

## Premissas

- “Conectado” indica presença recente do celular; os documentos continuam visíveis quando ele se desconecta.
- PDFs sem texto selecionável podem ser capturados, mas os destinos laboratoriais apresentarão uma mensagem de incompatibilidade e manterão o arquivo na caixa de entrada. OCR desses PDFs fica para uma etapa posterior.
- Medicações, laudos e evolução usarão a mesma infraestrutura de capturas, mas terão planos clínicos próprios.
