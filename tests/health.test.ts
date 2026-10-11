import { afterEach, afterAll, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempHome = mkdtempSync(join(tmpdir(), "pi-free-health-test-"));

beforeEach(async () => {
	process.env.HOME = tempHome;
	process.env.USERPROFILE = tempHome;
	const { beginStartup } = await import("../lib/startup-timing.ts");
	beginStartup();
});

afterEach(() => {
	delete process.env.HOME;
	delete process.env.USERPROFILE;
});

afterAll(() => {
	rmSync(tempHome, { recursive: true, force: true });
});

describe("health report", () => {
	it("shows status, startup details, and the diagnostic log path", async () => {
		const { formatHealthReport } = await import("../lib/health.ts");
		const report = formatHealthReport();

		expect(report).toContain("Pi-Free health:");
		expect(report).toContain("Registered providers:");
		expect(report).toContain("Log file:");
		expect(report).toContain("Pi-Free Startup:");
	});
});
