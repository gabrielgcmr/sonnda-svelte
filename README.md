# Svelte library

Everything you need to build a Svelte library, powered by [`sv`](https://npmjs.com/package/sv).

Read more about creating a library [in the docs](https://svelte.dev/docs/kit/packaging).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
bun x sv create --install bun

# create a new project in my-app
bun x sv create --install bun my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@1.1.0 create --template library --types ts --add prettier eslint vitest="usages:unit,component" tailwindcss="plugins:none" --install bun sonnda-svelte
```

## Adding features

Add features to your project with `sv add`:

```sh
bun x sv add
```

For example, to add Tailwind CSS:

```sh
bun x sv add tailwindcss
```

## Developing

This project uses [Bun](https://bun.sh) to install dependencies and run scripts. Install the dependencies first:

```sh
bun install
```

Then start a development server:

```sh
bun run dev

# or start the server and open the app in a new browser tab
bun run dev --open
```

Everything inside `src/lib` is part of your library, everything inside `src/routes` can be used as a showcase or preview app.

## Building

To build your library:

```sh
bun pm pack
```

To create a production version of your showcase app:

```sh
bun run build
```

You can preview the production build with `bun run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Publishing

Go into the `package.json` and give your package the desired name through the `"name"` option. Also consider adding a `"license"` field and point it to a `LICENSE` file which you can create from a template (one popular option is the [MIT license](https://opensource.org/license/mit/)).

To publish your library to [npm](https://www.npmjs.com):

```sh
bun publish
```
