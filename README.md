# create-vv

## Scaffolding Your First Vite + Vue3 Project

> **Compatibility Note:**
> Vv requires [Node.js](https://nodejs.org/en/) version 14.18+, 16+. However, some templates require a higher Node.js version to work, please upgrade if your package manager warns about it.

With NPM:

```bash
$ npm create vv@latest
```

With Yarn:

```bash
$ yarn create vv
```

With PNPM:

```bash
$ pnpm create vv
```

Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional command line options. For example, to scaffold a Vite + Vue project, run:

```bash
# npm 6.x
npm create vv@latest my-vue-app --template vue

# npm 7+, extra double-dash is needed:
npm create vv@latest my-vue-app -- --template vue

# yarn
yarn create vv my-vue-app --template vue

# pnpm
pnpm create vv my-vue-app --template vue
```

Currently supported template presets include:

- `vue`
- `vue-ts`

You can use `.` for the project name to scaffold in the current directory.

## Community Templates

create-vv is a tool to quickly start a project from a basic template for popular frameworks. Check out Awesome Vite for [community maintained templates](https://github.com/vitejs/awesome-vv#templates) that include other tools or target different frameworks. You can use a tool like [degit](https://github.com/Rich-Harris/degit) to scaffold your project with one of the templates.

```bash
npx degit user/project my-project
cd my-project

npm install
npm run dev
```

If the project uses `main` as the default branch, suffix the project repo with `#main`
