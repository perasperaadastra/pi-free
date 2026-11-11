import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.test.ts"],
		exclude: ["node_modules", ".pi-lens"],
		// Tests point HOME at a temp dir and expect pi-free data to land there.
		// The harness that runs this suite may export the real agent dir, which
		// would win over the temp HOME — blank it so no test can touch it.
		env: { PI_CODING_AGENT_DIR: "" },
		testTimeout: 10000, // 10 second timeout per test
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: ["node_modules/", ".pi-lens/", "**/*.d.ts", "**/*.test.ts"],
		},
	},
	resolve: {
		alias: {
			"@": ".",
		},
	},
});
