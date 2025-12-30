/**
 * Variable Injection Engine
 * 
 * Detects {{variable}} patterns in prompt content and provides
 * utilities for extraction, validation, and substitution.
 */

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Extract all unique variable names from prompt content
 */
export function extractVariables(content: string): string[] {
	const matches = content.matchAll(VARIABLE_PATTERN);
	const variables = [...matches].map((match) => match[1]);
	// Return unique variables in order of first appearance
	return [...new Set(variables)];
}

/**
 * Check if content has any variables
 */
export function hasVariables(content: string): boolean {
	return VARIABLE_PATTERN.test(content);
}

/**
 * Resolve template by substituting variable values
 * Unfilled variables remain as {{variableName}}
 */
export function resolveTemplate(
	content: string,
	values: Record<string, string>
): string {
	return content.replace(VARIABLE_PATTERN, (match, name) => {
		const value = values[name];
		return value !== undefined && value !== "" ? value : match;
	});
}

/**
 * Validate that all variables have been filled
 */
export function validateVariables(
	content: string,
	values: Record<string, string>
): { valid: boolean; missing: string[] } {
	const variables = extractVariables(content);
	const missing = variables.filter(
		(name) => !values[name] || values[name].trim() === ""
	);

	return {
		valid: missing.length === 0,
		missing,
	};
}

/**
 * Get variable metadata (position, line number)
 */
export function getVariablePositions(
	content: string
): Array<{ name: string; start: number; end: number; line: number }> {
	const positions: Array<{ name: string; start: number; end: number; line: number }> = [];
	let match: RegExpExecArray | null;
	
	const regex = new RegExp(VARIABLE_PATTERN);
	
	while ((match = regex.exec(content)) !== null) {
		const start = match.index;
		const end = start + match[0].length;
		const line = content.slice(0, start).split("\n").length;
		
		positions.push({
			name: match[1],
			start,
			end,
			line,
		});
	}
	
	return positions;
}

/**
 * Count total variable occurrences (including duplicates)
 */
export function countVariableOccurrences(content: string): number {
	const matches = content.match(VARIABLE_PATTERN);
	return matches ? matches.length : 0;
}

/**
 * Create a variable form schema based on extracted variables
 */
export function createVariableSchema(content: string): Array<{
	name: string;
	label: string;
	required: boolean;
}> {
	const variables = extractVariables(content);
	
	return variables.map((name) => ({
		name,
		label: formatVariableLabel(name),
		required: true,
	}));
}

/**
 * Format variable name as human-readable label
 * e.g., "user_name" -> "User Name", "firstName" -> "First Name"
 */
function formatVariableLabel(name: string): string {
	return name
		// Handle snake_case
		.replace(/_/g, " ")
		// Handle camelCase
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		// Capitalize first letter of each word
		.replace(/\b\w/g, (char) => char.toUpperCase());
}
