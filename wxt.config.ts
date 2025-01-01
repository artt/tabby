import { defineConfig } from 'wxt';
import path from "path"

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    action: {},
    name: "Tabby",
    permissions: [
      "tabs",
      "tabGroups",
      "sidePanel",
      "favicon",
    ],
  },
  vite: () => ({
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
});
