<!-- plans/extracao-multimodal.md -->

# Extração multimodal de exames laboratoriais e laudos de imagem

## Progresso

- [x] Etapa 1 — Infraestrutura multimodal compartilhada
- [x] Etapa 2 — Exames laboratoriais em JPEG e PNG
- [ ] Etapa 3 — Extrator de laudos de imagem
- [ ] Etapa 4 — Interface unificada
- [ ] Etapa 5 — Contratos e validação

## Direção consolidada

O Sonnda terá dois fluxos independentes em `/home/exams`: extração de exames laboratoriais e extração de laudos escritos de exames de imagem. Ambos aceitarão PDF, JPEG e PNG por upload local ou captura do celular.

JPEG e PNG serão enviados diretamente ao Gemini multimodal. PDFs com texto continuarão usando `pdftotext`; PDFs escaneados usarão o Gemini multimodal como fallback. A primeira versão não utilizará OCR externo, não interpretará imagens radiológicas ou DICOM e não salvará resultados no prontuário.

## Etapa 1 — Infraestrutura multimodal compartilhada

- Generalizar o cliente Gemini para aceitar texto ou um arquivo inline com MIME type.
- Manter um limite separado para texto/schema e adicionar `GEMINI_MAX_MEDIA_BYTES`, com padrão de 10 MiB.
- Aceitar somente PDF, JPEG e PNG e validar a assinatura real do conteúdo.
- Generalizar a abertura interna de capturas para retornar conteúdo, nome, MIME type e tamanho, preservando autorização, disponibilidade e expiração.
- Manter 10 MiB para uploads locais e 5 MiB para capturas.
- Preservar o endpoint laboratorial atual até a Etapa 2.

## Etapa 2 — Exames laboratoriais em JPEG e PNG

- Evoluir o contrato laboratorial para receber texto ou documento multimodal sem alterar a resposta pública atual.
- Expandir `POST /lab-extractions` e `POST /lab-extractions/from-capture` para PDF, JPEG e PNG.
- Usar `pdftotext` para PDF textual, Gemini para PDF escaneado e Gemini direto para JPEG/PNG.
- Acionar fallback somente para documento sem texto utilizável; falhas técnicas do extrator local continuam sendo erros.
- Manter as regras atuais para resultados, valores, unidades e documentos incompatíveis.

## Etapa 3 — Extrator de laudos de imagem

- Criar `internal/features/documentprocessing/imagingextraction`, separado de `labextraction`.
- Adicionar `POST /imaging-report-extractions` e `POST /imaging-report-extractions/from-capture`.
- Extrair modalidade, nome do exame, região anatômica, data, técnica, achados, conclusão, classificações e medidas.
- Preservar texto-fonte de classificações e medidas para revisão.
- Não calcular classificações nem inferir diagnósticos ausentes.
- Retornar `needs_review` para modalidade desconhecida ou documento parcialmente legível.
- Rejeitar documento ilegível, incompatível, imagem radiológica isolada ou arquivo com múltiplos laudos.
- Gerar o resumo copiável deterministicamente no Go.

## Etapa 4 — Interface unificada

- Manter `/home/exams` e adicionar um seletor entre **Laboratorial** e **Laudo de imagem**.
- Limpar seleção, resultado e requisições pendentes ao trocar de modo ou conta.
- Reutilizar upload, drag-and-drop e seleção de capturas para PDF, JPEG e PNG.
- Exigir o clique em **Extrair dados** após selecionar o documento.
- Criar estado, cliente de API e apresentação próprios para laudos de imagem.
- Mostrar resultado temporário e copiável, sem edição ou persistência.

## Etapa 5 — Contratos e validação

- Atualizar o OpenAPI e regenerar os tipos do SvelteKit.
- Cobrir os caminhos de PDF textual, PDF escaneado, JPEG e PNG.
- Testar preservação de percentuais, lateralidade, negações, medidas e classificações explícitas.
- Testar MIME falso, arquivo ilegível, documento incompatível, múltiplos laudos, timeout e resposta inválida do provedor.
- Preservar o isolamento por conta no processamento de capturas.
- Executar `go test ./...` e `bun run validate`.

## Contrato inicial do laudo de imagem

O resultado terá `status`, `warnings`, `report` e `summary_text`. O relatório terá:

- `modality`: `ultrasound`, `ct`, `mri`, `mammography`, `xray`, `other` ou `unknown`.
- `exam_name`, `body_region`, `exam_date`, `technique_text`, `findings_text` e `impression_text` anuláveis.
- `classifications`: sistema, valor e trecho de origem.
- `measurements`: nome, localização, valores textuais, unidade e trecho de origem.

Campos ausentes ficam `null`; coleções ausentes ficam vazias. A V1 aceita um laudo por arquivo e utiliza o mesmo `GEMINI_MODEL` nos dois extratores.
