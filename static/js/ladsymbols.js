/**
 * ladsymbols.js - Ladder Diagram SVG Symbol Definitions
 * Provides SVG template strings for all ladder diagram symbols
 */

const LadSymbols = (function() {
    'use strict';

    // Symbol dimensions
    const WIDTH = 60;
    const HEIGHT = 40;
    const CENTER_Y = HEIGHT / 2;

    /**
     * Create an SVG wrapper with the given content
     * @param {string} content - SVG content
     * @param {string} stateClass - State class (MB_ladderoff or MB_ladderon)
     * @returns {string} - Complete SVG element string
     */
    function wrapSvg(content, stateClass = 'MB_ladderoff') {
        return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" class="ladder-symbol ${stateClass}">
            ${content}
        </svg>`;
    }

    // Symbol definitions
    const symbols = {
        /**
         * Normally Open Contact (NO)
         * --| |--
         */
        noc: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="15" y2="${CENTER_Y}" class="${stateClass}"/>
            <line x1="15" y1="8" x2="15" y2="32" class="${stateClass}"/>
            <line x1="45" y1="8" x2="45" y2="32" class="${stateClass}"/>
            <line x1="45" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * Normally Closed Contact (NC)
         * --|/|--
         */
        ncc: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="15" y2="${CENTER_Y}" class="${stateClass}"/>
            <line x1="15" y1="8" x2="15" y2="32" class="${stateClass}"/>
            <line x1="45" y1="8" x2="45" y2="32" class="${stateClass}"/>
            <line x1="18" y1="30" x2="42" y2="10" class="${stateClass}"/>
            <line x1="45" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * Positive Differential Contact (Rising Edge)
         * --|P|--
         */
        nocpd: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="15" y2="${CENTER_Y}" class="${stateClass}"/>
            <line x1="15" y1="8" x2="15" y2="32" class="${stateClass}"/>
            <line x1="45" y1="8" x2="45" y2="32" class="${stateClass}"/>
            <text x="30" y="24" text-anchor="middle" font-size="12" font-weight="bold" class="${stateClass}">P</text>
            <line x1="45" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * Negative Differential Contact (Falling Edge)
         * --|N|--
         */
        nocnd: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="15" y2="${CENTER_Y}" class="${stateClass}"/>
            <line x1="15" y1="8" x2="15" y2="32" class="${stateClass}"/>
            <line x1="45" y1="8" x2="45" y2="32" class="${stateClass}"/>
            <text x="30" y="24" text-anchor="middle" font-size="12" font-weight="bold" class="${stateClass}">N</text>
            <line x1="45" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * Output Coil
         * --( )--
         */
        out: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="15" y2="${CENTER_Y}" class="${stateClass}"/>
            <circle cx="30" cy="${CENTER_Y}" r="12" class="${stateClass}"/>
            <line x1="45" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * Set (Latch) Coil
         * --(S)--
         */
        set: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="15" y2="${CENTER_Y}" class="${stateClass}"/>
            <circle cx="30" cy="${CENTER_Y}" r="12" class="${stateClass}"/>
            <text x="30" y="24" text-anchor="middle" font-size="10" font-weight="bold" class="${stateClass}">S</text>
            <line x1="45" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * Reset (Unlatch) Coil
         * --(R)--
         */
        rst: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="15" y2="${CENTER_Y}" class="${stateClass}"/>
            <circle cx="30" cy="${CENTER_Y}" r="12" class="${stateClass}"/>
            <text x="30" y="24" text-anchor="middle" font-size="10" font-weight="bold" class="${stateClass}">R</text>
            <line x1="45" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * Pulse/Differentiate Coil
         * --(P)--
         */
        pd: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="15" y2="${CENTER_Y}" class="${stateClass}"/>
            <circle cx="30" cy="${CENTER_Y}" r="12" class="${stateClass}"/>
            <text x="30" y="24" text-anchor="middle" font-size="10" font-weight="bold" class="${stateClass}">P</text>
            <line x1="45" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * Comparison Block
         * --[CMP]--
         */
        compare: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="10" y2="${CENTER_Y}" class="${stateClass}"/>
            <rect x="10" y="5" width="40" height="30" class="${stateClass}" fill="none"/>
            <text x="30" y="24" text-anchor="middle" font-size="8" class="${stateClass}">CMP</text>
            <line x1="50" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * Horizontal line (for spacing/continuation)
         */
        hline: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * Empty cell (just horizontal line)
         */
        empty: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass),

        /**
         * IL instruction fallback display
         */
        il: (stateClass) => wrapSvg(`
            <line x1="0" y1="${CENTER_Y}" x2="5" y2="${CENTER_Y}" class="${stateClass}"/>
            <rect x="5" y="5" width="50" height="30" class="${stateClass}" fill="none" stroke-dasharray="3,2"/>
            <text x="30" y="24" text-anchor="middle" font-size="8" class="${stateClass}">IL</text>
            <line x1="55" y1="${CENTER_Y}" x2="${WIDTH}" y2="${CENTER_Y}" class="${stateClass}"/>
        `, stateClass)
    };

    // Timer symbols (as blocks with different labels)
    symbols.tmr = symbols.compare;
    symbols.tmra = symbols.compare;
    symbols.tmroff = symbols.compare;

    // Counter symbols
    symbols.cntu = symbols.compare;
    symbols.cntd = symbols.compare;
    symbols.udc = symbols.compare;

    // Other block symbols
    symbols.copy = symbols.compare;
    symbols.cpyblk = symbols.compare;
    symbols.fill = symbols.compare;
    symbols.pack = symbols.compare;
    symbols.unpack = symbols.compare;
    symbols.shfrg = symbols.compare;
    symbols.findeq = symbols.compare;
    symbols.mathdec = symbols.compare;
    symbols.mathhex = symbols.compare;
    symbols.sum = symbols.compare;
    symbols.call = symbols.compare;
    symbols.rt = symbols.compare;
    symbols.end = symbols.compare;
    symbols.for = symbols.compare;
    symbols.next = symbols.compare;

    /**
     * Get SVG for a symbol
     * @param {string} symbolName - Symbol name
     * @param {string} stateClass - State class (MB_ladderoff or MB_ladderon)
     * @returns {string} - SVG element string
     */
    function getSymbol(symbolName, stateClass = 'MB_ladderoff') {
        const symbolFn = symbols[symbolName] || symbols.il;
        return symbolFn(stateClass);
    }

    /**
     * Get list of all symbol names
     * @returns {string[]} - Array of symbol names
     */
    function getSymbolNames() {
        return Object.keys(symbols);
    }

    // Public API
    return {
        getSymbol,
        getSymbolNames,
        WIDTH,
        HEIGHT
    };
})();
