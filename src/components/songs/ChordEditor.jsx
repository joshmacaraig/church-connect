// src/components/songs/ChordEditor.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPlus, FaQuestionCircle } from 'react-icons/fa';

/**
 * Chord Editor component to help with entering and formatting chord charts
 */
const ChordEditor = ({ value, onChange, rows = 10 }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Common chords for quick insertion
  const commonChords = [
    'C', 'G', 'D', 'A', 'E', 'F', 'Am', 'Em', 'Dm',
    'G7', 'C7', 'D7', 'Cmaj7', 'Fmaj7', 'Gsus4'
  ];

  // Example chord chart for users to see proper formatting
  const exampleChart = `[Verse 1]
C        G        Am       F
Here are some example chords above lyrics
C             G              Am  F
Words should be aligned with the chords above

[Chorus]
F         G       C
This is how a chorus might look
F         G       Am      G
With more chords and lyrics here

[Bridge]
Am   G   F   C
Simple progression
`;

  const handleInsertChord = (chord) => {
    if (!value) {
      onChange(chord + '  ');
    } else {
      const cursorPosition = document.getElementById('chord-editor').selectionStart;
      const textBefore = value.substring(0, cursorPosition);
      const textAfter = value.substring(cursorPosition);
      onChange(textBefore + chord + '  ' + textAfter);
      setHasInteracted(true);
    }
  };

  const handleInsertSection = (section) => {
    const sectionText = `\n[${section}]\n`;
    if (!value) {
      onChange(sectionText);
    } else {
      const cursorPosition = document.getElementById('chord-editor').selectionStart;
      const textBefore = value.substring(0, cursorPosition);
      const textAfter = value.substring(cursorPosition);
      onChange(textBefore + sectionText + textAfter);
    }
    setHasInteracted(true);
  };

  const handleEditorChange = (e) => {
    onChange(e.target.value);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  // Show a sample/hint if the editor is empty and user hasn't interacted yet
  useEffect(() => {
    if (!value && !hasInteracted) {
      // Consider showing a placeholder or hint
    }
  }, [value, hasInteracted]);

  return (
    <div className="chord-editor-container">
      {/* Quick insert buttons for common chords */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Quick Insert Chords:</span>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <FaQuestionCircle className="mr-1" />
            {showHelp ? 'Hide Help' : 'Show Help'}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {commonChords.map((chord) => (
            <button
              key={chord}
              type="button"
              onClick={() => handleInsertChord(chord)}
              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {chord}
            </button>
          ))}
        </div>
      </div>

      {/* Section labels */}
      <div className="mb-3">
        <span className="text-sm text-gray-600">Add Section:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {['Verse', 'Chorus', 'Bridge', 'Intro', 'Outro', 'Pre-Chorus'].map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => handleInsertSection(section)}
              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <FaPlus className="mr-1 h-3 w-3" />
              {section}
            </button>
          ))}
        </div>
      </div>

      {/* Help section */}
      {showHelp && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Chord Chart Formatting Help</h4>
          <p className="text-xs text-blue-700 mb-2">
            Format your chord chart by placing chords above lyrics with spaces between them.
            Use section markers like [Verse] or [Chorus] to organize your song.
          </p>
          <div className="bg-white p-2 rounded text-xs font-mono">
            <pre className="whitespace-pre-wrap">{exampleChart}</pre>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Tip: Make sure to keep chord names short (C, G, Am, etc.) and use spaces to align them with lyrics.
          </p>
        </div>
      )}

      {/* The textarea for chord input */}
      <textarea
        id="chord-editor"
        value={value}
        onChange={handleEditorChange}
        rows={rows}
        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
        placeholder="Enter chords here..."
      />
      
      <div className="mt-1 text-xs text-gray-500">
        Use monospaced formatting for chords. Press Tab for indentation.
      </div>
    </div>
  );
};

ChordEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  rows: PropTypes.number
};

export default ChordEditor;
