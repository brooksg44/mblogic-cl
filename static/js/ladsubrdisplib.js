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
    const BLOCK_CELL_WIDTH = 140;
    const BLOCK_CELL_HEIGHT = 80;

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
     * Check if symbol represents a block instruction
     * @param {string} symbol - Symbol name
     * @returns {boolean}
     */
    function isBlockSymbol(symbol) {
        return LadSymbols.isBlockSymbol(symbol);
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
        const isBlock = isBlockSymbol(symbol) || cellType === 'block';

        // Create unique ID for monitoring
        const cellId = `cell-${cell.row}-${cell.col}`;

        // Determine cell class and dimensions
        const cellClass = isBlock ? 'ladder-cell ladder-block-cell' : 'ladder-cell';
        const cellStyle = isBlock ? `width: ${BLOCK_CELL_WIDTH}px; height: ${BLOCK_CELL_HEIGHT}px;` : '';

        // Get SVG symbol
        const svgHtml = LadSymbols.getSymbol(symbol, 'MB_ladderoff');

        // Create address display
        let addressDisplay = '';
        if (address) {
            addressDisplay = `<span class="cell-address">${escapeHtml(address)}</span>`;
        } else if (addresses.length > 0) {
            addressDisplay = `<span class="cell-address">${escapeHtml(addresses[0])}</span>`;
        }

        // For block types, show parameters below the symbol
        let paramsDisplay = '';
        if (isBlock && params.length > 0) {
            const displayParams = params.slice(0, 4).join(' ');
            paramsDisplay = `<span class="block-params">${escapeHtml(displayParams)}</span>`;
        }

        // Data attributes for monitoring
        const dataAttrs = addresses.length > 0
            ? `data-addresses="${escapeHtml(addresses.join(','))}"`
            : '';

        return `
            <div id="${cellId}" class="${cellClass} MB_ladderoff"
                 ${dataAttrs}
                 data-opcode="${escapeHtml(opcode)}"
                 data-symbol="${escapeHtml(symbol)}"
                 style="${cellStyle}">
                <div class="cell-symbol">
                    ${svgHtml}
                </div>
                ${paramsDisplay}
                ${addressDisplay}
                <span class="cell-value"></span>
            </div>
        `;
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

            const rowClass = row === 0 ? 'ladder-row ladder-row-main' : 'ladder-row ladder-row-branch';
            cellsHtml += `<div class="${rowClass}" data-row="${row}">`;

            // Render cells
            rowCells.forEach(cell => {
                cellsHtml += createCellHtml(cell);
            });

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
                    <div class="power-rail left"></div>
                    ${cellsHtml}
                    <div class="power-rail right"></div>
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
                    <code>(mblogic-cl-web:quick-start "test/plcprog.txt" :port 8080)</code>
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
        document.querySelectorAll('.ladder-cell').forEach(cell => {
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

            // Update CSS class on the cell
            cell.classList.remove('MB_ladderoff', 'MB_ladderon');
            cell.classList.add(isOn ? 'MB_ladderon' : 'MB_ladderoff');

            // Update SVG elements inside - find the svg and update all elements with state classes
            const svg = cell.querySelector('svg');
            if (svg) {
                svg.classList.remove('MB_ladderoff', 'MB_ladderon');
                svg.classList.add(isOn ? 'MB_ladderon' : 'MB_ladderoff');

                // Update all child elements (lines, circles, rects, text)
                svg.querySelectorAll('line, circle, rect, text').forEach(el => {
                    el.classList.remove('MB_ladderoff', 'MB_ladderon');
                    el.classList.add(isOn ? 'MB_ladderon' : 'MB_ladderoff');
                });
            }

            // Update value display if applicable
            const valueEl = cell.querySelector('.cell-value');
            if (valueEl) {
                if (displayValue !== null) {
                    valueEl.textContent = formatValue(displayValue);
                    valueEl.style.display = 'block';
                } else {
                    valueEl.style.display = 'none';
                }
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
        updateCellStates,
        isBlockSymbol
    };
})();
