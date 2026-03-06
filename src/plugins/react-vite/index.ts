import type { TakohemiPlugin } from "../../core/types.js";

const reactVitePlugin: TakohemiPlugin = {
  name: "takohemi-plugin-react-vite",
  version: "0.1.0",

  stacks: [
    {
      id: "react-vite",
      name: "React + Vite",
      description: "React 19 with Vite, TypeScript, and modern tooling",
      category: "frontend",

      templateSource: {
        type: "local",
        path: "react-vite/base",
      },

      variables: [
        {
          name: "styling",
          label: "Styling solution",
          type: "select",
          choices: [
            { title: "Tailwind CSS", value: "tailwind" },
            { title: "CSS Modules", value: "css-modules" },
            { title: "Styled Components", value: "styled-components" },
            { title: "None (plain CSS)", value: "none" },
          ],
          defaultValue: "tailwind",
        },
        {
          name: "stateManagement",
          label: "State management",
          type: "select",
          choices: [
            { title: "Zustand", value: "zustand" },
            { title: "Redux Toolkit", value: "redux" },
            { title: "Jotai", value: "jotai" },
            { title: "None (React state only)", value: "none" },
          ],
          defaultValue: "zustand",
        },
        {
          name: "router",
          label: "Routing",
          type: "select",
          choices: [
            { title: "React Router v7", value: "react-router" },
            { title: "TanStack Router", value: "tanstack-router" },
            { title: "None (SPA, no routing)", value: "none" },
          ],
          defaultValue: "react-router",
        },
      ],

      extras: [
        {
          id: "testing",
          name: "Testing (Vitest + Testing Library)",
          description: "Unit & integration testing with Vitest and React Testing Library",
          templateSource: { type: "local", path: "react-vite/extras/testing" },
        },
        {
          id: "storybook",
          name: "Storybook",
          description: "Component documentation and visual testing with Storybook",
          templateSource: { type: "local", path: "react-vite/extras/storybook" },
        },
        {
          id: "eslint-prettier",
          name: "ESLint + Prettier",
          description: "Opinionated linting and formatting config",
          templateSource: { type: "local", path: "react-vite/extras/eslint-prettier" },
        },
        {
          id: "husky",
          name: "Husky + Commitlint",
          description: "Git hooks with commit message validation",
          templateSource: { type: "local", path: "react-vite/extras/husky" },
          dependsOn: ["eslint-prettier"],
        },
        {
          id: "docker",
          name: "Docker",
          description: "Multi-stage Dockerfile + docker-compose for dev & prod",
          templateSource: { type: "local", path: "react-vite/extras/docker" },
        },
        {
          id: "ci-github",
          name: "GitHub Actions CI/CD",
          description: "CI pipeline with lint, test, build, and deploy stages",
          templateSource: { type: "local", path: "react-vite/extras/ci-github" },
        },
      ],

      hooks: {
        async afterSetup(ctx) {
          ctx.log.info("");
          ctx.log.success(`Project "${ctx.projectName}" is ready!`);
          ctx.log.info("");
          ctx.log.info(`  cd ${ctx.projectName}`);
          ctx.log.info("  npm run dev");
          ctx.log.info("");
        },
      },

      // Code generators
      generators: [
        {
          id: "component",
          name: "Component",
          description: "React component with CSS Modules",
          subDir: "src/components",
          options: [
            {
              name: "withProps",
              label: "Include props interface?",
              type: "confirm",
              defaultValue: "true",
            },
          ],
          templateSource: { type: "local", path: "react-vite/generators/component" },
        },
        {
          id: "page",
          name: "Page",
          description: "Page component with React Router",
          subDir: "src/pages",
          templateSource: { type: "local", path: "react-vite/generators/page" },
        },
        {
          id: "hook",
          name: "Hook",
          description: "Custom React hook",
          subDir: "src/hooks",
          templateSource: { type: "local", path: "react-vite/generators/hook" },
        },
        {
          id: "store",
          name: "Store",
          description: "Zustand state store",
          subDir: "src/stores",
          templateSource: { type: "local", path: "react-vite/generators/store" },
        },
      ],
    },
  ],
};

export default reactVitePlugin;
