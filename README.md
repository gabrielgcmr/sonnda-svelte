<!-- README.md -->

# Sonnda Web

Aplicação web do Sonnda construída com SvelteKit 3, Svelte 5, TypeScript e Tailwind CSS.

## Desenvolvimento

Instale as dependências e configure as variáveis descritas em `.env.example`:

```sh
bun install
bun run dev
```

## Comandos

- `bun run dev`: inicia o servidor de desenvolvimento.
- `bun run check`: valida TypeScript e componentes Svelte.
- `bun run test`: executa todos os testes uma vez.
- `bun run test:server`: executa apenas os testes no ambiente Node.
- `bun run test:browser`: executa apenas os testes de componentes no Firefox.
- `bun run test:watch`: executa os testes em modo interativo.
- `bun run lint`: verifica formatação e lint.
- `bun run build`: gera o build de produção da aplicação.
- `bun run preview`: executa localmente o build gerado.
- `bun run validate`: executa lint, check, todos os testes e build na mesma ordem usada pelo CI.

## Organização

- `src/routes`: páginas e layouts da aplicação.
- `src/lib/features`: estado, regras e integrações organizados por feature.
- `src/lib/api`: infraestrutura compartilhada do cliente HTTP.
- `src/lib/ui`: componentes visuais compartilhados.
- `src/lib/generated`: tipos gerados a partir do contrato OpenAPI; não editar manualmente.
- `src/styles`: estilos globais, tokens semânticos e temas.

Imports compartilhados usam o alias `#lib/*`, conforme o padrão de subpath imports do SvelteKit 3.
