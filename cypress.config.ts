import { defineConfig } from "cypress";

export default defineConfig({
  defaultCommandTimeout: 30000,
  pageLoadTimeout: 300000,
  video: false,
  videoUploadOnPasses: false,
  watchForFileChanges: false,
  retries: 1,
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
