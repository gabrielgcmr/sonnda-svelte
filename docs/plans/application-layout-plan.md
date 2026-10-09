<!-- docs/plans/application-layout-plan.md -->

# Layout da aplicação e implementações posteriores

## Objetivo e decisões

Organizar o `sonnda-svelte` para trabalho em desktop. O usuário logado permanece identificado no header; selecionar um paciente apenas abre seu contexto clínico. Não existe seletor entre identidades de usuário e paciente.

O plano tem duas entregas independentes: primeiro o layout navegável; depois as integrações e funcionalidades. Concluir o layout não depende de implementar busca real, extração, cálculos ou módulos clínicos.

Reutilizar os componentes, tokens visuais e temas claro/escuro existentes. Manter as convenções de SvelteKit 3 descritas em `AGENTS.md`.

## Parte A — Layout

### A1 — Header compartilhado e navegação principal (Concluido)

- Header com Sonnda à esquerda e nome do usuário, tipo de cuidado, controle de tema e saída à direita.
- Usar os dados da conta já carregada: `profile.full_name` para o nome, “Cuidados básicos” para `basic_care` e “Profissional” para `professional`.
- Na área de ferramentas do usuário, apresentar abaixo do header uma barra horizontal: **Meus pacientes · Extrair exames · Cálculos clínicos**.
- “Meus pacientes” é a home padrão, substituindo os atuais cartões de detalhes da conta.
- Indicar a página ativa e preservar a identificação do usuário em todas as páginas.

**Aceite:** navegação, tema e saída funcionam; nome e tipo de cuidado aparecem no header.

### A2 — Páginas das ferramentas do usuário (Concluído)

- **Meus pacientes:** preparar campo de busca por nome, lista compacta com avatar ou iniciais, nome e ação “Abrir”. Preparar estados de carregamento, lista vazia, nenhum resultado e falha com opção de tentar novamente.
- **Extrair exames:** preparar layout em duas colunas, envio à esquerda e resultado à direita. Nesta entrega, apresentar “Em breve” e não habilitar envio à API.
- **Cálculos clínicos:** usar duas colunas, com os inputs da calculadora selecionada à esquerda e a lista de calculadoras à direita. Preparar a entrada para FIB-4 com indicação “Em breve” e listar TFG e IMC como opções futuras.
- Usar fixtures apenas em testes e revisão visual para conferir os estados da lista e a abertura do paciente. Na aplicação normal, informar quando a integração ainda não estiver disponível; não apresentar pacientes fictícios como dados reais.

**Aceite:** as três páginas são navegáveis e seus estados visuais podem ser revisados sem integração clínica.

### A3 — Layout do contexto do paciente (Concluído)

- Manter o header do usuário logado.
- Substituir a navegação horizontal pela identificação do paciente logo abaixo do header: nome, idade, data de nascimento e outros dados cadastrais disponíveis.
- Organizar os dados principais em uma faixa compacta e os complementares em uma seção expansível.
- Disponibilizar “Meus pacientes” no header para retornar à lista.
- Corpo com conteúdo central e barra vertical estreita à direita, aproximadamente 64 px, com ícones para **Problemas · Exames · Medicações**.
- Problemas é a seção inicial. Mostrar tooltip, nome acessível e destaque da seção ativa em cada ícone.
- As três seções são navegáveis e apresentam “Em breve”, sem carregamento de dados clínicos nesta entrega.
- Usar fixtures em testes e revisão visual; a abertura normal de um paciente real será conectada na etapa B1.

**Aceite:** a navegação clínica preserva a identificação do paciente; o retorno à lista mantém a identidade do usuário; o layout funciona em desktop nos dois temas.

### Rotas e verificação do layout

- `/home`: Meus pacientes.
- `/home/exams`: extração standalone.
- `/home/calculators`: cálculos clínicos, inicialmente FIB-4.
- `/patients/[patientId]`: contexto do paciente, com `tab=problems`, `tab=exams` ou `tab=medications`; ausência ou valor inválido abre Problemas.
- Estender a proteção existente de login e onboarding às novas rotas desde a entrega do layout.
- Verificar navegação por teclado, foco, rótulos dos ícones, estados vazios e aparência desktop em temas claro e escuro.
- Executar as verificações existentes de Bun e os testes pertinentes ao comportamento de navegação.

## Parte B — Integrações e funcionalidades

Estas etapas usam o layout concluído na Parte A. Cada uma deve poder ser entregue e verificada separadamente.

### B1 — Lista real e seleção de pacientes (Concluído)

- Conectar Meus pacientes a `GET /me/patients`, usando o cliente OpenAPI existente e o token da sessão atual.
- Carregar páginas de até 100 registros. Como o contrato atual não oferece filtro por nome, filtrar no navegador ignorando maiúsculas e acentos.
- Indicar enquanto a lista estiver incompleta; não apresentar ausência de resultados como definitiva durante o carregamento.
- Ao abrir um paciente, carregar seu perfil por `GET /patients/{patientId}`. Permitir acesso direto e atualização da URL; a API determina a autorização.
- Preservar lista e busca em memória ao retornar do paciente.
- Tratar falhas, paciente indisponível e acesso negado. Impedir que respostas atrasadas restaurem dados de outro paciente ou outra conta.
- Limpar o estado ao sair ou trocar de conta. Não armazenar dados de pacientes em persistência do navegador.

**Aceite:** pacientes além da primeira página são encontrados; seleção e acesso direto carregam o perfil correto; troca de paciente e logout não deixam dados antigos visíveis.

### B1.1 — Cadastro de paciente (Concluído)

- Disponibilizar “Adicionar paciente” em Meus pacientes e abrir um formulário próprio em `/patients/new`.
- Coletar os campos exigidos por `POST /patients`: nome, nascimento, CPF, gênero, raça/cor e vínculo inicial. CNS e telefone permanecem opcionais.
- Validar formato, data e dígitos verificadores de CPF e CNS antes do envio, mantendo a API como autoridade final.
- Exigir a escolha explícita do vínculo inicial: próprio paciente, familiar, cuidador ou profissional.
- Após a criação, invalidar a lista em memória e abrir o contexto do novo paciente. Preservar a busca para o retorno e recarregar a lista pela API.
- Tratar conflito de CPF, falhas de validação, autorização e conexão sem expor detalhes internos.

**Aceite:** um paciente válido é criado e aberto; o cadastro aparece ao retornar para a lista; erros locais e da API são apresentados sem perder os dados digitados.

### B2 — Extração standalone de exames (Concluído)

- Conectar Extrair exames a `POST /lab-extractions`, usando o contrato OpenAPI atual.
- Aceitar um PDF de até 10 MB conforme o contrato existente; validar arquivo ausente, vazio, formato e tamanho antes do envio, mantendo a validação da API como autoridade final.
- Mostrar processamento, resultado, status e avisos retornados pela API, incluindo resultados parciais.
- Permitir copiar o resumo e iniciar outra extração.
- Informar que a operação é independente de paciente e não salva o documento ou resultado.
- Manter arquivo e resultado apenas em memória enquanto a página estiver aberta e limpar ao sair ou trocar de conta.

**Aceite:** envio válido funciona; validação, falhas e resultados parciais são apresentados corretamente; nenhuma associação com paciente ou persistência é criada.

### B3 — FIB-4

- Implementar FIB-4 como primeira ferramenta de Cálculos clínicos.
- Entrada manual de idade, AST/TGO, ALT/TGP e plaquetas, com unidades explícitas; apresentar o resultado junto ao formulário.
- Portar a lógica e os casos de teste existentes no `sonnda-web`, conferindo a referência clínica antes de implementar a interpretação.
- Executar o cálculo localmente, independente de paciente e sem persistência.
- Invalidar o resultado quando os valores usados no cálculo forem alterados, até recalcular.
- Preparar a organização por calculadora, sem implementar TFG ou IMC nesta etapa.

**Aceite:** resultados conferem com os casos de referência; entradas ausentes, inválidas ou não finitas são tratadas; o resultado corresponde aos valores atuais.

### Verificação das integrações

- Testes unitários com respostas simuladas da API para paginação, busca, seleção, falhas e respostas atrasadas.
- Testes da extração para montagem do multipart, validação do PDF, apresentação de status/avisos e cópia do resumo.
- Testes do FIB-4 para cálculo, validação e atualização do resultado.
- Revisão visual dos fluxos reais em desktop, temas claro e escuro, e execução das verificações existentes de Bun.

## Limites e premissas

- Apenas `sonnda-svelte`; adaptação para celular e mudanças nos outros clientes ficam para outra etapa.
- Nenhuma alteração de contrato da API está prevista. Os endpoints de lista, perfil e extração já existem.
- Problemas, Exames e Medicações recebem apenas navegação e placeholders neste plano; suas funcionalidades terão planos próprios.
- Evolução avulsa não faz parte desta versão do plano.
- O estado das ferramentas e dos pacientes fica em memória; não haverá persistência no navegador nem seleção automática de paciente ao entrar.
