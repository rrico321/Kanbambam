// Comments are written by other people and agents, so strip anything a terminal would
// interpret before printing them: escape sequences, bell, and other control characters.
// Only newline and tab survive.

const ESC = '\\u001b'
const ST = `(?:\\u0007|${ESC}\\\\|\\u009c)` // BEL, ESC \, or 8-bit ST

// OSC / DCS / SOS / PM / APC strings run to a terminator; unterminated ones run to the end
const STRING_SEQUENCE = new RegExp(
	`(?:${ESC}[\\]PX^_]|[\\u009d\\u0090\\u0098\\u009e\\u009f])[\\s\\S]*?(?:${ST}|$)`,
	'g',
)
// CSI: ESC [ (or 8-bit CSI) params, intermediates, final byte
const CSI_SEQUENCE = new RegExp(`(?:${ESC}\\[|\\u009b)[0-?]*[ -/]*[@-~]?`, 'g')
// Any other ESC sequence (ESC, intermediates, final byte)
const ESC_SEQUENCE = new RegExp(`${ESC}[ -/]*[0-~]?`, 'g')
// Remaining C0 (except \n and \t), DEL, and C1 control characters
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the point
const CONTROL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g

export function stripControlSequences(text: string): string {
	return text
		.replace(STRING_SEQUENCE, '')
		.replace(CSI_SEQUENCE, '')
		.replace(ESC_SEQUENCE, '')
		.replace(CONTROL_CHARS, '')
}
