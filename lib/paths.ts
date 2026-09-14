/**
 * Centralized path resolution for data files under a safe base directory.
 *
 * These helpers constrain file paths to a given base directory (normally
 * the user's pi data directory) to prevent arbitrary-file-write
 * vulnerabilities from attacker-controlled environment variables. All
 * env-var file overrides must resolve to a path inside the base directory
 * or be rejected.
 */

import { existsSync, mkdirSync } from "node:fs";
import { homedir as _nodeHomedir } from "node:os";
import { basename, join, resolve, sep } from "node:path";

/**
 * The user's home directory.
 *
 * On POSIX, `node:os.homedir()` already respects the `HOME` env var.
 * On Windows, it uses `USERPROFILE` and ignores `HOME`. We prefer `HOME`
 * (set by tests and various cross-platform tooling) and fall back to
 * `USERPROFILE` and then to `node:os.homedir()`.
 */
function resolveHomeDir(): string {
	if (process.env.HOME) return process.env.HOME;
	if (process.env.USERPROFILE) return process.env.USERPROFILE;
	return _nodeHomedir();
}

/** The user's pi data directory (~/.pi). */
export const PI_DATA_DIR = join(resolveHomeDir(), ".pi");

/**
 * Pi's agent directory (default: ~/.pi/agent).
 *
 * Pi defines its agent dir via the PI_CODING_AGENT_DIR environment
 * variable; if unset, it defaults to `.pi/agent` in the user's home
 * directory.
 */
export function getPiAgentDir(): string {
	return (
		process.env.PI_CODING_AGENT_DIR || join(resolveHomeDir(), ".pi", "agent")
	);
}

/** Maximum basename length for override env vars. */
const MAX_BASENAME_LENGTH = 128;

/** Characters that are not allowed in a basename. */
const FORBIDDEN_CHARS_RE = /[/\\\0]/;

/**
 * Ensure a directory exists, creating it (and parents) if missing.
 * Idempotent — safe to call repeatedly.
 */
export function ensureDir(dir: string): void {
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
}

/**
 * Resolve a file path from an env-var override, constrained to `baseDir`.
 *
 * The env var may override only the *filename* (not the directory).
 * If the env var is unset or empty, returns the default path.
 * If the env var contains a path separator or null byte, the override
 * is rejected and the default path is used.
 *
 * @param envValue - Raw env var value (may be undefined/empty)
 * @param baseDir - Directory the result must stay inside
 * @param defaultFilename - Default filename inside `baseDir`
 * @returns A path string that is guaranteed to be inside `baseDir`
 */
export function resolveSafeDataFile(
	envValue: string | undefined,
	baseDir: string,
	defaultFilename: string,
): string {
	if (!envValue) {
		return join(baseDir, defaultFilename);
	}

	// Reject any path separator — only allow bare filenames
	if (FORBIDDEN_CHARS_RE.test(envValue)) {
		return join(baseDir, defaultFilename);
	}

	// Reject empty after trim, overly long, or suspicious filenames
	const trimmed = envValue.trim();
	if (
		!trimmed ||
		trimmed === "." ||
		trimmed === ".." ||
		trimmed.length > MAX_BASENAME_LENGTH
	) {
		return join(baseDir, defaultFilename);
	}

	// Final safety check: resolve and verify the result is still inside baseDir
	const candidate = resolve(join(baseDir, basename(trimmed)));
	if (candidate !== baseDir && !candidate.startsWith(baseDir + sep)) {
		return join(baseDir, defaultFilename);
	}

	return candidate;
}
