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
        const row = cell.row || 0;
        const col = cell.col || 0;

        // Create unique ID for monitoring
        const cellId = `cell-${row}-${col}`;

        // Determine cell class and dimensions
        const cellClass = isBlock ? 'ladder-cell ladder-block-cell' : 'ladder-cell';

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
                 data-row="${row}"
                 data-col="${col}">
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
     * Create an empty spacer cell for alignment
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {string} - HTML string
     */
    function createSpacerHtml(row, col) {
        return `<div class="ladder-spacer" data-row="${row}" data-col="${col}">
            ${LadSymbols.getSymbol('hline', 'MB_ladderoff')}
        </div>`;
    }

    /**
     * Create a vertical branch connector
     * @param {number} col - Column where branch connects
     * @param {number} startRow - Start row (usually 0)
     * @param {number} endRow - End row
     * @returns {string} - HTML string
     */
    function createBranchConnector(col, startRow, endRow) {
        return `<div class="branch-connector"
                     data-col="${col}"
                     data-start-row="${startRow}"
                     data-end-row="${endRow}"
                     style="--col: ${col}; --start-row: ${startRow}; --end-row: ${endRow};"></div>`;
    }

    /**
     * Create HTML for a single rung with proper branch handling
     * @param {Object} rung - Rung data
     * @returns {string} - HTML string
     */
    function createRungHtml(rung) {
        const rungNum = rung.rungnum;
        const cells = rung.cells || [];
        const comment = rung.comment || '';
        const rows = rung.rows || 1;
        const cols = rung.cols || 1;

        // Build a 2D grid of cells
        const grid = [];
        for (let r = 0; r < rows; r++) {
            grid[r] = new Array(cols).fill(null);
        }

        // Place cells in grid and track branch points
        const branchCols = new Set();
        cells.forEach(cell => {
            const row = cell.row || 0;
            const col = cell.col || 0;
            if (row < rows && col < cols) {
                grid[row][col] = cell;
                // Track columns where branches occur (non-zero rows)
                if (row > 0) {
                    branchCols.add(col);
                }
            }
        });

        // Render rows
        let rowsHtml = '';
        for (let r = 0; r < rows; r++) {
            const rowClass = r === 0 ? 'ladder-row ladder-row-main' : 'ladder-row ladder-row-branch';
            let rowCellsHtml = '';

            for (let c = 0; c < cols; c++) {
                const cell = grid[r][c];
                if (cell) {
                    rowCellsHtml += createCellHtml(cell);
                } else if (r === 0) {
                    // Main row: empty cells get horizontal lines
                    rowCellsHtml += createSpacerHtml(r, c);
                } else {
                    // Branch row: only show spacer if there's content later in this row
                    // or if this column has a branch that needs vertical connection
                    let hasLaterContent = false;
                    for (let cc = c + 1; cc < cols; cc++) {
                        if (grid[r][cc]) {
                            hasLaterContent = true;
                            break;
                        }
                    }
                    if (hasLaterContent || branchCols.has(c)) {
                        rowCellsHtml += createSpacerHtml(r, c);
                    } else {
                        // Empty placeholder to maintain grid
                        rowCellsHtml += `<div class="ladder-empty" data-row="${r}" data-col="${c}"></div>`;
                    }
                }
            }

            rowsHtml += `<div class="${rowClass}" data-row="${r}">${rowCellsHtml}</div>`;
        }

        // Create branch connectors (vertical lines)
        let connectorsHtml = '';
        branchCols.forEach(col => {
            // Find the range of rows that have cells at this column
            let minRow = 0;
            let maxRow = 0;
            for (let r = 0; r < rows; r++) {
                if (grid[r][col]) {
                    maxRow = r;
                }
            }
            if (maxRow > minRow) {
                connectorsHtml += createBranchConnector(col, minRow, maxRow);
            }
        });

        // Build complete rung HTML
        return `
            <div class="ladder-rung" id="rung-${rungNum}" data-rungnum="${rungNum}" data-rows="${rows}" data-cols="${cols}">
                <div class="rung-header">
                    <span class="rung-number">Network ${rungNum}</span>
                    ${comment ? `<span class="rung-comment">${escapeHtml(comment)}</span>` : ''}
                </div>
                <div class="ladder-grid" style="--cols: ${cols}; --rows: ${rows};">
                    <div class="power-rail left"></div>
                    <div class="ladder-content">
                        ${rowsHtml}
                        ${connectorsHtml}
                    </div>
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
