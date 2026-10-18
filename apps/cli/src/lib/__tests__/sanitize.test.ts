import { describe, expect, it } from 'vitest'
import { stripControlSequences } from '../sanitize.js'

describe('stripControlSequences', () => {
	it('keeps plain text, newlines, tabs and unicode', () => {
		const text = 'Line 1\n\tindented — ünïcode ✓\nLine 3'
		expect(stripControlSequences(text)).toBe(text)
	})

	it('strips OSC sequences terminated by BEL or ST', () => {
		expect(stripControlSequences('a\u001b]0;pwned title\u0007b')).toBe('ab')
		expect(stripControlSequences('a\u001b]8;;http://evil\u001b\\link\u001b]8;;\u001b\\b')).toBe(
			'alinkb',
		)
		expect(stripControlSequences('a\u009d0;title\u009cb')).toBe('ab')
	})

	it('strips an unterminated OSC through the end of the text', () => {
		expect(stripControlSequences('safe\u001b]52;c;ZXZpbA==')).toBe('safe')
	})

	it('strips CSI sequences (colors, cursor movement, erase)', () => {
		expect(stripControlSequences('\u001b[31mred\u001b[0m')).toBe('red')
		expect(stripControlSequences('x\u001b[2J\u001b[1;1Hy')).toBe('xy')
		expect(stripControlSequences('x\u009b2Ky')).toBe('xy')
	})

	it('strips DCS/APC/PM/SOS strings and other ESC sequences', () => {
		expect(stripControlSequences('a\u001bPq#0;2;0;0;0\u001b\\b')).toBe('ab')
		expect(stripControlSequences('a\u001b_Gf=100;AAAA\u001b\\b')).toBe('ab')
		expect(stripControlSequences('a\u001bcb\u001b7c')).toBe('abc')
	})

	it('strips BEL, backspace, carriage return, NUL, DEL and C1 controls', () => {
		expect(stripControlSequences('a\u0007b\u0008c\rd\u0000e\u007ff\u0085g')).toBe('abcdefg')
	})
})
