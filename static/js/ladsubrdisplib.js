/**
 * ladsubrdisplib.js - Ladder Subroutine Display Library
 * Handles rendering ladder diagram rungs from program data
 */

const SubrDispControl = (function() {
    'use strict';

    // Current program data
    let currentProgram = null;
    let currentAddresses = [];

    // Cell dimensions for layout
    const CELL_WIDTH = 80;
    const CELL_HEIGHT = 60;
    const BLOCK_WIDTH = 140;

    /**
     * Set the current program data
     * @param {Object} programData - Program data from API
     */
    function setProgram(programData) {
        currentProgram = programData;
        if (programData && programData.addresses) {
            currentAddresses = programData.addresses;
        }
    }

    /**
     * Get all addresses that need monitoring
     * @returns {string[]} - Array of address strings
     */
    function getMonitorAddresses() {
        return currentAddresses;
    }

    /**
     * Create HTML for a single cell
     * @param {Object} cell - Cell data
     * @returns {string} - HTML string
     */
    function createCellHtml(cell) {
        const symbol = cell.symbol || 'il';
        const address = cell.addr || '';
        const addresses = cell.addrs || [];
        const opcode = cell.opcode || '';
        const params = cell.params || [];
        const cellType = cell.type || 'unknown';

        // Determine cell class
        let cellClass = 'ladder-cell';
        if (cellType === 'block' || isBlockSymbol(symbol)) {
            cellClass = 'ladder-block';
        }

        // Create unique ID for monitoring
        const cellId = `cell-${cell.row}-${cell.col}`;

        // Get SVG symbol
        const svgHtml = LadSymbols.getSymbol(symbol, 'MB_ladderoff');

        // Create address display
        const addressDisplay = address ?
            `<span class="cell-address">${escapeHtml(address)}</span>` : '';

        // For block types, show params
        let paramsDisplay = '';
        if (cellType === 'block' || isBlockSymbol(symbol)) {
            const displayParams = params.slice(0, 3).join(' ');
            paramsDisplay = `
                <span class="block-title">${escapeHtml(opcode)}</span>
                <span class="block-params">${escapeHtml(displayParams)}</span>
            `;
        }

        // Data attributes for monitoring
        const dataAttrs = addresses.map(a => `data-addr-${a.replace(/[^a-zA-Z0-9]/g, '_')}="true"`).join(' ');

        return `
            <div id="${cellId}" class="${cellClass} MB_ladderoff"
                 data-addresses="${escapeHtml(addresses.join(','))}"
                 data-opcode="${escapeHtml(opcode)}"
                 ${dataAttrs}>
                ${isBlockSymbol(symbol) ? '' : svgHtml}
                ${paramsDisplay}
                ${addressDisplay}
                <span class="cell-value" style="display:none;"></span>
            </div>
        `;
    }

    /**
     * Check if symbol represents a block instruction
     * @param {string} symbol - Symbol name
     * @returns {boolean}
     */
    function isBlockSymbol(symbol) {
        const blockSymbols = [
            'compare', 'tmr', 'tmra', 'tmroff',
            'cntu', 'cntd', 'udc',
            'copy', 'cpyblk', 'fill',
            'pack', 'unpack', 'shfrg',
            'findeq', 'mathdec', 'mathhex', 'sum',
            'call', 'rt', 'end', 'for', 'next'
        ];
        return blockSymbols.includes(symbol);
    }

    /**
     * Create HTML for a single rung
     * @param {Object} rung - Rung data
     * @returns {string} - HTML string
     */
    function createRungHtml(rung) {
        const rungNum = rung.rungnum;
        const cells = rung.cells || [];
        const comment = rung.comment || '';
        const rows = rung.rows || 1;

        // Create cells HTML
        let cellsHtml = '';

        // Group cells by row
        const cellsByRow = {};
        cells.forEach(cell => {
            const row = cell.row || 0;
            if (!cellsByRow[row]) {
                cellsByRow[row] = [];
            }
            cellsByRow[row].push(cell);
        });

        // Render each row
        for (let row = 0; row < rows; row++) {
            const rowCells = cellsByRow[row] || [];
            // Sort by column
            rowCells.sort((a, b) => (a.col || 0) - (b.col || 0));

            cellsHtml += `<div class="ladder-row" data-row="${row}">`;

            // Add power rail on left
            if (row === 0) {
                cellsHtml += '<div class="power-rail left"></div>';
            }

            // Render cells
            rowCells.forEach(cell => {
                cellsHtml += createCellHtml(cell);
            });

            // Add power rail on right (only for first row with coil)
            if (row === 0) {
                cellsHtml += '<div class="power-rail right"></div>';
            }

            cellsHtml += '</div>';
        }

        // Build complete rung HTML
        return `
            <div class="ladder-rung" id="rung-${rungNum}" data-rungnum="${rungNum}">
                <div class="rung-header">
                    <span class="rung-number">Network ${rungNum}</span>
                    ${comment ? `<span class="rung-comment">${escapeHtml(comment)}</span>` : ''}
                </div>
                <div class="ladder-grid">
                    ${cellsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Create the complete rung list from program data
     * @param {Object} programData - Program data from API
     * @returns {string} - HTML string for all rungs
     */
    function createRungList(programData) {
        setProgram(programData);

        if (!programData || !programData.subrdata) {
            return `
                <div class="no-program">
                    <h3>No Program Loaded</h3>
                    <p>Start the web server with a program:</p>
                    <code>(mblogic-cl-web:start-web-server :port 8080 :interpreter *interp*)</code>
                </div>
            `;
        }

        if (programData.error) {
            return `<div class="error-message">${escapeHtml(programData.error)}</div>`;
        }

        const rungs = programData.subrdata;
        if (!rungs || rungs.length === 0) {
            return '<div class="no-program"><p>No rungs in this subroutine</p></div>';
        }

        let html = '';
        rungs.forEach(rung => {
            html += createRungHtml(rung);
        });

        return html;
    }

    /**
     * Render the program to the display container
     * @param {string} containerId - ID of container element
     * @param {Object} programData - Program data from API
     */
    function renderToContainer(containerId, programData) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = createRungList(programData);
        }
    }

    /**
     * Update cell states based on data values
     * @param {Object} dataValues - Object mapping addresses to values
     */
    function updateCellStates(dataValues) {
        // Find all cells with monitored addresses
        document.querySelectorAll('.ladder-cell, .ladder-block').forEach(cell => {
            const addressesStr = cell.getAttribute('data-addresses');
            if (!addressesStr) return;

            const addresses = addressesStr.split(',').filter(a => a);
            if (addresses.length === 0) return;

            // Check if any address is "on"
            let isOn = false;
            let displayValue = null;

            addresses.forEach(addr => {
                if (addr in dataValues) {
                    const value = dataValues[addr];
                    if (typeof value === 'boolean') {
                        if (value) isOn = true;
                    } else if (typeof value === 'number') {
                        displayValue = value;
                        if (value !== 0) isOn = true;
                    } else if (value !== null && value !== undefined) {
                        displayValue = value;
                    }
                }
            });

            // Update CSS class
            cell.classList.remove('MB_ladderoff', 'MB_ladderon');
            cell.classList.add(isOn ? 'MB_ladderon' : 'MB_ladderoff');

            // Update SVG elements inside
            cell.querySelectorAll('.MB_ladderoff, .MB_ladderon').forEach(el => {
                el.classList.remove('MB_ladderoff', 'MB_ladderon');
                el.classList.add(isOn ? 'MB_ladderon' : 'MB_ladderoff');
            });

            // Update value display if applicable
            const valueEl = cell.querySelector('.cell-value');
            if (valueEl && displayValue !== null) {
                valueEl.textContent = formatValue(displayValue);
                valueEl.style.display = 'block';
            }
        });
    }

    /**
     * Format a value for display
     * @param {*} value - Value to format
     * @returns {string} - Formatted string
     */
    function formatValue(value) {
        if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                return value.toString();
            }
            return value.toFixed(2);
        }
        return String(value);
    }

    /**
     * Escape HTML special characters
     * @param {string} str - Input string
     * @returns {string} - Escaped string
     */
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Public API
    return {
        setProgram,
        getMonitorAddresses,
        createRungList,
        renderToContainer,
        updateCellStates
    };
})();
