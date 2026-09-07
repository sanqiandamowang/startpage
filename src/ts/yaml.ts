/**
 * Minimal dependency-free YAML serializer/parser.
 *
 * Scope: covers what the startpage needs — nested mappings (objects), ordered
 * sequences (arrays), and scalar values (string/number/boolean/null). This
 * intentionally avoids pulling in a full YAML library while remaining a
 * well-defined, reversible format for export/import.
 */

export type YamlValue = string | number | boolean | null | YamlMap | YamlValue[];
export interface YamlMap {
	[key: string]: YamlValue;
}

const INDENT_UNIT = '  ';

function isYamlMap(value: unknown): value is YamlMap {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isYamlSequence(value: unknown): value is YamlValue[] {
	return Array.isArray(value);
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
	if (typeof value !== 'string') throw new Error('Cannot serialize a mapping or sequence as a scalar value.');
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
		} else if (isYamlSequence(value)) {
			lines.push(`${indent}${key}:`);
			lines.push(serializeSequence(value, depth + 1));
		} else {
			lines.push(`${indent}${key}: ${formatScalar(value)}`);
		}
	}
	return lines.join('\n');
}

/**
 * Serialize a sequence at the given indent depth.
 */
function serializeSequence(seq: YamlValue[], depth: number): string {
	const indent = INDENT_UNIT.repeat(depth);
	const lines: string[] = [];
	for (const item of seq) {
		if (isYamlMap(item)) {
			lines.push(serializeSequenceMapping(item, depth));
		} else if (isYamlSequence(item)) {
			lines.push(`${indent}-`);
			lines.push(serializeSequence(item, depth + 1));
		} else {
			lines.push(`${indent}- ${formatScalar(item)}`);
		}
	}
	return lines.join('\n');
}

/**
 * Serialize a mapping that is itself a sequence item.
 */
function serializeSequenceMapping(map: YamlMap, depth: number): string {
	const indent = INDENT_UNIT.repeat(depth);
	const childIndent = INDENT_UNIT.repeat(depth + 1);
	const keys = Object.keys(map);
	const lines: string[] = [];

	keys.forEach((key, index) => {
		const value = map[key];
		const prefix = index === 0 ? `${indent}- ` : childIndent;

		if (isYamlMap(value)) {
			lines.push(`${prefix}${key}:`);
			lines.push(serializeMapping(value, depth + 2));
		} else if (isYamlSequence(value)) {
			lines.push(`${prefix}${key}:`);
			lines.push(serializeSequence(value, depth + 2));
		} else {
			lines.push(`${prefix}${key}: ${formatScalar(value)}`);
		}
	});

	return lines.join('\n');
}

export function stringifyYaml(data: YamlMap): string {
	return serializeMapping(data, 0) + '\n';
}

interface StackFrame {
	indent: number;
	kind: 'map' | 'seq' | 'seq-item';
	map: YamlMap | null;
	sequence: YamlValue[] | null;
}

function findColon(text: string): number {
	let inQuotes = false;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch === '"') inQuotes = !inQuotes;
		else if (ch === ':' && !inQuotes) return i;
	}
	return -1;
}

function currentMap(stack: StackFrame[]): YamlMap {
	for (let i = stack.length - 1; i >= 0; i--) {
		if (stack[i].map) return stack[i].map!;
	}
	throw new Error('YAML parse error: no active mapping on the stack.');
}

function pushSequenceItemFrame(stack: StackFrame[], indent: number): StackFrame {
	while (stack.length > 1) {
		const top = stack[stack.length - 1];
		if (top.kind === 'seq' && indent === top.indent) break;
		if (top.kind === 'seq-item' && indent > top.indent) break;
		if (top.kind === 'map' && indent > top.indent) break;
		stack.pop();
	}

	const seqFrame = stack[stack.length - 1];
	if (!seqFrame.sequence) {
		throw new Error(`YAML parse error: sequence dash at indent ${indent} with no active sequence.`);
	}
	const itemMap: YamlMap = {};
	seqFrame.sequence.push(itemMap);
	const itemFrame: StackFrame = {
		indent: indent + 2,
		kind: 'seq-item',
		map: itemMap,
		sequence: null
	};
	stack.push(itemFrame);
	return itemFrame;
}

function nextNonEmptyIndent(lines: string[], fromIndex: number): { index: number; indent: number } | null {
	for (let i = fromIndex + 1; i < lines.length; i++) {
		const trimmed = lines[i].trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const indent = lines[i].length - lines[i].trimStart().length;
		return { index: i, indent };
	}
	return null;
}

function parseScalar(raw: string): YamlValue {
	if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) {
		return unquoteScalar(raw);
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

/**
 * Parse a bounded subset of YAML produced by `stringifyYaml`.
 */
export function parseYaml(text: string): YamlMap {
	const root: YamlMap = {};
	const stack: StackFrame[] = [{ indent: -1, kind: 'map', map: root, sequence: null }];
	const lines = text.split(/\r?\n/);

	for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
		const rawLine = lines[lineIdx];
		const trimmed = rawLine.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const indent = rawLine.length - rawLine.trimStart().length;

		if (trimmed.startsWith('- ')) {
			const afterDash = trimmed.slice(2).trim();
			const frame = pushSequenceItemFrame(stack, indent);
			if (afterDash === '') continue;

			const colonIndex = findColon(afterDash);
			if (colonIndex === -1) {
				const val = parseScalar(afterDash);
				const seq = stack[stack.length - 2].sequence!;
				seq[seq.length - 1] = val;
				stack.pop();
			} else {
				const rawKey = afterDash.slice(0, colonIndex).trim();
				const rawValue = afterDash.slice(colonIndex + 1).trim();
				const key = unquoteScalar(rawKey);
				if (rawValue === '') {
					const child: YamlMap = {};
					frame.map![key] = child;
					stack.push({ indent: indent + 2, kind: 'map', map: child, sequence: null });
				} else {
					frame.map![key] = parseScalar(rawValue);
				}
			}
			continue;
		}

		if (trimmed === '-') {
			pushSequenceItemFrame(stack, indent);
			continue;
		}

		const colonIndex = findColon(trimmed);
		if (colonIndex === -1) {
			throw new Error(`Malformed YAML line (missing colon): "${rawLine}"`);
		}

		const rawKey = trimmed.slice(0, colonIndex).trim();
		const rawValue = trimmed.slice(colonIndex + 1).trim();
		if (!rawKey) throw new Error(`Malformed YAML line (empty key): "${rawLine}"`);

		while (stack.length > 1) {
			const top = stack[stack.length - 1];
			if (top.kind === 'map' && indent > top.indent) break;
			if (top.kind === 'seq-item' && indent === top.indent) break;
			stack.pop();
		}

		const key = unquoteScalar(rawKey);
		if (rawValue === '') {
			const lookahead = nextNonEmptyIndent(lines, lineIdx);
			if (lookahead !== null) {
				const nextLine = lines[lookahead.index].trim();
				if (nextLine.startsWith('-') && lookahead.indent >= indent) {
					const seq: YamlValue[] = [];
					const parentMap = currentMap(stack);
					parentMap[key] = seq;
					stack.push({ indent: lookahead.indent, kind: 'seq', map: null, sequence: seq });
					continue;
				}
			}
			const child: YamlMap = {};
			const parentMap = currentMap(stack);
			parentMap[key] = child;
			stack.push({ indent, kind: 'map', map: child, sequence: null });
		} else {
			currentMap(stack)[key] = parseScalar(rawValue);
		}
	}

	return root;
}
