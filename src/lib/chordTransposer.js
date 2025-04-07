// src/lib/chordTransposer.js

// All possible chord roots in order of the circle of fifths
const CHORD_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Alternative representations (sharps/flats equivalence)
const NOTE_ALIASES = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
  'C#': 'C#',
  'D#': 'D#',
  'F#': 'F#',
  'G#': 'G#',
  'A#': 'A#'
};

/**
 * Transpose a single chord by the given number of semitones
 * @param {string} chord - Chord to transpose (e.g., C, Am, F#7)
 * @param {number} semitones - Number of semitones to transpose (positive or negative)
 * @returns {string} Transposed chord
 */
export const transposeChord = (chord, semitones) => {
  if (!chord || semitones === 0) return chord;
  
  // Regular expression to match chord pattern
  // Group 1: Root note (C, D#, etc.)
  // Group 2: Chord quality (m, 7, maj7, etc.)
  const chordPattern = /^([A-G][#b]?)(.*)$/;
  const match = chord.match(chordPattern);
  
  if (!match) return chord; // Not a recognizable chord
  
  const [_, root, quality] = match;
  
  // Normalize root note (convert aliases)
  let normalizedRoot = root;
  if (NOTE_ALIASES[root]) {
    normalizedRoot = NOTE_ALIASES[root];
  }
  
  // Find position in the array
  const noteIndex = CHORD_NOTES.indexOf(normalizedRoot);
  if (noteIndex === -1) return chord; // Unknown note
  
  // Calculate new index (handling wrap-around)
  const totalSemitones = (noteIndex + semitones) % 12;
  const newIndex = totalSemitones < 0 ? totalSemitones + 12 : totalSemitones;
  
  // Construct the new chord
  return CHORD_NOTES[newIndex] + quality;
};

/**
 * Calculate number of semitones between two keys
 * @param {string} fromKey - Origin key
 * @param {string} toKey - Destination key
 * @returns {number} Number of semitones to transpose
 */
export const getSemitonesBetweenKeys = (fromKey, toKey) => {
  // Extract root notes (remove 'm' for minor keys)
  const fromRoot = fromKey.replace('m', '');
  const toRoot = toKey.replace('m', '');
  
  // Normalize keys
  const normalizedFromKey = NOTE_ALIASES[fromRoot] || fromRoot;
  const normalizedToKey = NOTE_ALIASES[toRoot] || toRoot;
  
  // Find positions in the array
  const fromIndex = CHORD_NOTES.indexOf(normalizedFromKey);
  const toIndex = CHORD_NOTES.indexOf(normalizedToKey);
  
  if (fromIndex === -1 || toIndex === -1) return 0; // Unknown key
  
  return (toIndex - fromIndex + 12) % 12;
};

/**
 * Transpose a chord from one key to another
 * @param {string} chord - Chord to transpose
 * @param {string} fromKey - Original key
 * @param {string} toKey - Target key
 * @returns {string} Transposed chord
 */
export const transposeChordBetweenKeys = (chord, fromKey, toKey) => {
  const semitones = getSemitonesBetweenKeys(fromKey, toKey);
  return transposeChord(chord, semitones);
};

/**
 * Parse a line with chords and transpose each chord
 * @param {string} line - Line with chords
 * @param {string} fromKey - Original key
 * @param {string} toKey - Target key
 * @returns {string} Line with transposed chords
 */
export const transposeChordLine = (line, fromKey, toKey) => {
  if (!line || !fromKey || !toKey || fromKey === toKey) return line;
  
  // Find chords in the line using a regex pattern that matches common chord formats
  const chordPattern = /\b([A-G][#b]?(?:m|maj|min|aug|dim|sus|add|maj7|m7|7|9|11|13|6|5)?(?:\/[A-G][#b]?)?)\b/g;
  
  return line.replace(chordPattern, (match) => {
    return transposeChordBetweenKeys(match, fromKey, toKey);
  });
};

/**
 * Get a list of standard musical keys
 * @returns {string[]} Array of musical keys
 */
export const getMusicalKeys = () => {
  const majorKeys = CHORD_NOTES.map(note => note);
  const minorKeys = CHORD_NOTES.map(note => `${note}m`);
  
  // Combine major and minor keys
  return [...majorKeys, ...minorKeys];
};
