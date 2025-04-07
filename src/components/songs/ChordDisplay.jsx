// src/components/songs/ChordDisplay.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display chord charts with properly aligned chords above lyrics
 */
const ChordDisplay = ({ content, className = '' }) => {
  if (!content) return null;
  
  // Parse the content to identify chord lines and lyric lines
  const lines = content.split('\n');
  const formattedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
    
    // Try to detect if this is a chord line
    // Chord lines typically have scattered text with spaces between chords
    const isChordLine = isLikelyChordLine(currentLine);
    
    if (isChordLine && nextLine && !isLikelyChordLine(nextLine)) {
      // This is a chord line followed by lyrics
      formattedLines.push({
        type: 'chord-lyric-pair',
        chords: currentLine,
        lyrics: nextLine
      });
      i++; // Skip the next line since we've processed it
    } else {
      // This is just a regular line (section header, comment, etc.)
      formattedLines.push({
        type: 'text',
        content: currentLine
      });
    }
  }
  
  return (
    <div className={`font-mono text-sm ${className}`}>
      {formattedLines.map((line, index) => {
        if (line.type === 'chord-lyric-pair') {
          return (
            <div key={index} className="mb-1">
              <div className="text-blue-600 font-bold whitespace-pre">{line.chords}</div>
              <div className="whitespace-pre">{line.lyrics}</div>
            </div>
          );
        } else {
          // Handle section headers and other non-chord lines
          // Make section headers bold and add some margin
          if (line.content.trim().startsWith('[') && line.content.trim().endsWith(']')) {
            return (
              <div key={index} className="font-bold text-gray-700 mt-4 mb-2">
                {line.content}
              </div>
            );
          }
          // Handle empty lines
          if (line.content.trim() === '') {
            return <div key={index} className="h-4"></div>;
          }
          // Regular text
          return <div key={index} className="whitespace-pre mb-1">{line.content}</div>;
        }
      })}
    </div>
  );
};

/**
 * Helper function to detect if a line is likely a chord line
 */
function isLikelyChordLine(line) {
  if (!line || line.trim() === '') return false;
  
  // Chord lines usually have a lot of spaces between chords
  const spacingPattern = /\s{2,}/;
  if (!spacingPattern.test(line)) return false;
  
  // Common chord patterns (matches things like C, Am, F#m7, Gsus4, etc.)
  const chordPattern = /^[A-G][#b]?(m|maj|min|aug|dim|sus|add|2|4|5|6|7|9|11|13|-|\+|\/)*/;
  
  // Split by multiple spaces and check if chunks match chord patterns
  const chunks = line.split(/\s{2,}/);
  
  // The line is likely a chord line if at least half of the non-empty chunks match chord patterns
  const nonEmptyChunks = chunks.filter(chunk => chunk.trim() !== '');
  if (nonEmptyChunks.length === 0) return false;
  
  const chordMatches = nonEmptyChunks.filter(chunk => chordPattern.test(chunk.trim()));
  return chordMatches.length >= nonEmptyChunks.length / 2;
}

ChordDisplay.propTypes = {
  content: PropTypes.string,
  className: PropTypes.string
};

export default ChordDisplay;
