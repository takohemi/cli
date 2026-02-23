import type { TakohemiPlugin } from "../../core/types.js";

const nextjsPlugin: TakohemiPlugin = {
  name: "takohemi-plugin-nextjs",
  version: "0.1.0",

  stacks: [
    {
      id: "nextjs",
      name: "Next.js (App Router)",
      description: "Next.js 15 with App Router, TypeScript, and server components",
      category: "frontend",

      templateSource: {
        type: "local",
        path: "nextjs/base",
      },

      variables: [
        {
          name: "styling",
          label: "Styling solution",
          type: "select",
          choices: [
            { title: "Tailwind CSS", value: "tailwind" },
            { title: "CSS Modules", value: "css-modules" },
            { title: "None (plain CSS)", value: "none" },
          ],
          defaultValue: "tailwind",
        },
        {
          name: "database",
          label: "Database",
          type: "select",
          choices: [
            { title: "MongoDB (Mongoose)", value: "mongodb" },
            { title: "PostgreSQL (Prisma)", value: "prisma" },
            { title: "SQLite (Drizzle)", value: "drizzle" },
            { title: "None", value: "none" },
          ],
          defaultValue: "none",
        },
        {
          name: "auth",
          label: "Authentication",
          type: "select",
          choices: [
            { title: "NextAuth.js (Auth.js)", value: "nextauth" },
            { title: "Clerk", value: "clerk" },
            { title: "None", value: "none" },
          ],
          defaultValue: "none",
        },
        {
          name: "stateManagement",
          label: "Client state management",
          type: "select",
          choices: [
            { title: "Zustand", value: "zustand" },
            { title: "None (React state + server components)", value: "none" },
          ],
          defaultValue: "none",
        },
      ],

      extras: [
        {
          id: "testing",
          name: "Testing (Vitest + Playwright)",
          description: "Unit testing with Vitest and E2E with Playwright",
          templateSource: { type: "local", path: "nextjs/extras/testing" },
        },
        {
          id: "eslint-prettier",
          name: "ESLint + Prettier",
          description: "Opinionated linting and formatting config",
          templateSource: { type: "local", path: "nextjs/extras/eslint-prettier" },
        },
        {
          id: "husky",
          name: "Husky + Commitlint",
          description: "Git hooks with commit message validation",
          templateSource: { type: "local", path: "nextjs/extras/husky" },
          dependsOn: ["eslint-prettier"],
        },
        {
          id: "docker",
          name: "Docker",
          description: "Optimized multi-stage Dockerfile for Next.js standalone output",
          templateSource: { type: "local", path: "nextjs/extras/docker" },
        },
        {
          id: "ci-github",
          name: "GitHub Actions CI/CD",
          description: "CI pipeline with lint, test, build, and deploy stages",
          templateSource: { type: "local", path: "nextjs/extras/ci-github" },
        },
        {
          id: "cloudflare",
          name: "Cloudflare Workers",
          description: "Deploy to Cloudflare Workers via OpenNext adapter",
          templateSource: { type: "local", path: "nextjs/extras/cloudflare" },
        },
        {
          id: "seo",
          name: "SEO + Sitemap",
          description: "Metadata helpers, sitemap generation, and robots.txt",
          templateSource: { type: "local", path: "nextjs/extras/seo" },
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
          if (ctx.variables.database !== "none") {
            ctx.log.warn("Don't forget to set up your .env with database credentials.");
          }
        },
      },
    },
  ],
};

export default nextjsPlugin;
