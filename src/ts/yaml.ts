/**
 * Minimal dependency-free YAML serializer/parser.
 *
 * Scope: covers exactly what the startpage settings need — nested mappings
 * (objects) whose values are either scalars (string/number/boolean/null) or
 * further mappings. This intentionally avoids pulling in a full YAML library
 * while remaining a well-defined, reversible format for export/import.
 */

export type YamlValue = string | number | boolean | null | YamlMap;
export interface YamlMap {
	[key: string]: YamlValue;
}

const INDENT_UNIT = '  ';

function isYamlMap(value: unknown): value is YamlMap {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function needsQuoting(raw: string): boolean {
	if (raw === '') return true;
	// Reserve characters that would otherwise change YAML structure.
	if (/[:#\-?\[\]{},&*!|>'"%@`]/.test(raw)) return true;
	// Leading/trailing whitespace is meaningful and lossy without quotes.
	if (raw !== raw.trim()) return true;
	// Booleans, null and numbers must be quoted to preserve their string form.
	const lower = raw.toLowerCase();
	if (lower === 'true' || lower === 'false' || lower === 'null' || lower === 'yes' || lower === 'no') return true;
	if (raw !== '' && !isNaN(Number(raw))) return true;
	return false;
}

function quoteString(raw: string): string {
	// Escape backslashes and double quotes, then wrap in double quotes.
	const escaped = raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
	return `"${escaped}"`;
}

function formatScalar(value: YamlValue): string {
	if (value === null) return 'null';
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return String(value);
	if (typeof value !== 'string') throw new Error('Cannot serialize a mapping as a scalar value.');
	return needsQuoting(value) ? quoteString(value) : value;
}

function serializeMapping(map: YamlMap, depth: number): string {
	const indent = INDENT_UNIT.repeat(depth);
	const lines: string[] = [];
	for (const key of Object.keys(map)) {
		const value = map[key];
		if (isYamlMap(value)) {
			lines.push(`${indent}${key}:`);
			lines.push(serializeMapping(value, depth + 1));
		} else {
			lines.push(`${indent}${key}: ${formatScalar(value as YamlValue)}`);
		}
	}
	return lines.join('\n');
}

export function stringifyYaml(data: YamlMap): string {
	return serializeMapping(data, 0) + '\n';
}

/**
 * Parse a bounded subset of YAML produced by `stringifyYaml`.
 *
 * Supports: nested mappings, 2-space indentation, scalar values, and
 * double-quoted strings (with \\n / \\" / \\\\ escapes). Lines starting
 * with `#` are treated as comments and skipped.
 */
export function parseYaml(text: string): YamlMap {
	const root: YamlMap = {};
	const stack: { indent: number; map: YamlMap }[] = [{ indent: -1, map: root }];

	const lines = text.split(/\r?\n/);

	for (const rawLine of lines) {
		const trimmed = rawLine.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const indent = rawLine.length - rawLine.trimStart().length;
		const colonIndex = trimmed.indexOf(':');
		if (colonIndex === -1) {
			throw new Error(`Malformed YAML line (missing colon): "${rawLine}"`);
		}

		const rawKey = trimmed.slice(0, colonIndex).trim();
		const rawValue = trimmed.slice(colonIndex + 1).trim();
		if (!rawKey) throw new Error(`Malformed YAML line (empty key): "${rawLine}"`);

		// Pop the stack until we find the parent whose indent is smaller than ours.
		while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
			stack.pop();
		}
		const parent = stack[stack.length - 1].map;

		const key = unquoteScalar(rawKey);
		const value: YamlValue = rawValue === '' ? parseNestedValue(stack, indent, key) : parseScalar(rawValue);

		parent[key] = value;
	}

	return root;
}

function parseNestedValue(
	stack: { indent: number; map: YamlMap }[],
	indent: number,
	_key: string
): YamlMap {
	const child: YamlMap = {};
	stack.push({ indent, map: child });
	return child;
}

function parseScalar(raw: string): YamlValue {
	if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) {
		return raw
			.slice(1, -1)
			.replace(/\\n/g, '\n')
			.replace(/\\"/g, '"')
			.replace(/\\\\/g, '\\');
	}

	const lower = raw.toLowerCase();
	if (lower === 'null' || raw === '~') return null;
	if (lower === 'true') return true;
	if (lower === 'false') return false;

	if (raw !== '' && !isNaN(Number(raw))) return Number(raw);

	return raw;
}

function unquoteScalar(raw: string): string {
	if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) {
		return raw
			.slice(1, -1)
			.replace(/\\n/g, '\n')
			.replace(/\\"/g, '"')
			.replace(/\\\\/g, '\\');
	}
	return raw;
}
