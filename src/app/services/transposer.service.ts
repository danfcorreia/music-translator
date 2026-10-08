import { Injectable } from '@angular/core';

export const NOTES: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const NOTE_DISPLAY: string[] = [
  'C',
  'C# / D♭',
  'D',
  'D# / E♭',
  'E',
  'F',
  'F# / G♭',
  'G',
  'G# / A♭',
  'A',
  'A# / B♭',
  'B',
];

@Injectable({ providedIn: 'root' })
export class TransposerService {

  /**
   * Returns the number of semitones to shift from fromNote to toNote.
   */
  getSemitones(from: string, to: string): number {
    const fromIdx = NOTES.indexOf(from);
    const toIdx = NOTES.indexOf(to);
    if (fromIdx === -1 || toIdx === -1) return 0;
    return (toIdx - fromIdx + 12) % 12;
  }

  /**
   * Transposes a single root note letter by n semitones.
   * Returns the canonical sharp notation.
   */
  transposeNote(note: string, semitones: number): string {
    // Normalize flats to sharps
    const normalized = this.normalizeNote(note);
    const idx = NOTES.indexOf(normalized);
    if (idx === -1) return note;
    return NOTES[(idx + semitones + 12) % 12];
  }

  private normalizeNote(note: string): string {
    const flatMap: Record<string, string> = {
      'Cb': 'B', 'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
    };
    return flatMap[note] || note;
  }

  /**
   * Transposes all chords in a block of text by the given semitones.
   * Only transposes lines that appear to be chord lines (contain recognized chord tokens).
   */
  transposeText(text: string, semitones: number): string {
    if (semitones === 0) return text;

    const lines = text.split('\n');
    return lines.map(line => this.transposeLine(line, semitones)).join('\n');
  }

  private isChordLine(line: string): boolean {
    // A chord line is predominantly chord tokens (not prose)
    const chordPattern = /\b[A-G][b#]?(?:m|maj|min|aug|dim|sus|add|dom|M)?\d*(?:[b#]\d+)*(?:\/[A-G][b#]?)?\b/g;
    const words = line.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return false;

    const chordCount = (line.match(chordPattern) || []).length;
    // If more than half the tokens look like chords, treat as chord line
    return chordCount > 0 && chordCount >= words.length * 0.4;
  }

  private transposeLine(line: string, semitones: number): string {
    if (!this.isChordLine(line)) return line;

    // Match chord tokens: root + optional modifier + optional bass note
    // Only the root note letters (and bass note) get transposed
    return line.replace(
      /\b([A-G][b#]?)((?:m|maj|min|aug|dim|sus|add|dom|M)?(?:\d+)?(?:[b#]\d+)*(?:\/[A-G][b#]?)?)\b/g,
      (match, root, suffix) => {
        const newRoot = this.transposeNote(root, semitones);
        // Handle slash chords bass note
        const newSuffix = suffix.replace(/\/([A-G][b#]?)/, (_: string, bassNote: string) => {
          return '/' + this.transposeNote(bassNote, semitones);
        });
        return newRoot + newSuffix;
      }
    );
  }
}
