/** @odoo-module **/
import { patch } from "@web/core/utils/patch";
import { HtmlField } from "@web/views/fields/html/html_field";

function getCellRef(row, col) {
    return String.fromCharCode(65 + col) + (row + 1);
}

function getCellByRef(table, ref) {
    const col = ref.charCodeAt(0) - 65;
    const row = parseInt(ref.slice(1)) - 1;
    return table.rows[row]?.cells[col];
}

function getRangeValues(table, startRef, endRef) {
    const startCol = startRef.charCodeAt(0) - 65;
    const startRow = parseInt(startRef.slice(1)) - 1;
    const endCol = endRef.charCodeAt(0) - 65;
    const endRow = parseInt(endRef.slice(1)) - 1;
    const values = [];
    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            const val = table.rows[r]?.cells[c]?.dataset?.value || table.rows[r]?.cells[c]?.innerText || "0";
            values.push(parseFloat(val) || 0);
        }
    }
    return values;
}

function parseFormula(table, formula) {
    if (!formula.startsWith("=")) return formula;
    const clean = formula.replace("=", "").trim().toUpperCase();

    try {
        // Handle SUM(A1:A3)
        if (clean.startsWith("SUM(")) {
            const range = clean.match(/\((.*)\)/)[1];
            const [start, end] = range.split(":");
            const values = getRangeValues(table, start, end);
            return values.reduce((a, b) => a + b, 0);
        }

        // Handle AVERAGE(A1:A3)
        if (clean.startsWith("AVERAGE(")) {
            const range = clean.match(/\((.*)\)/)[1];
            const [start, end] = range.split(":");
            const values = getRangeValues(table, start, end);
            return values.reduce((a, b) => a + b, 0) / values.length;
        }

        // Handle =A1+B1 style formulas
        const expression = clean.replace(/([A-Z]+\d+)/g, match => {
            const cell = getCellByRef(table, match);
            const val = cell?.dataset?.value || cell?.innerText || "0";
            return parseFloat(val) || 0;
        });
        // Evaluate the arithmetic expression safely
        return Function(`"use strict";return (${expression})`)();

    } catch (err) {
        console.warn("Formula error:", err);
        return "ERR";
    }
}

function recalcAll(table, dependencies) {
    for (const [ref, formulas] of Object.entries(dependencies)) {
        formulas.forEach(cell => {
            const formula = cell.dataset.formula;
            const result = parseFormula(table, formula);
            cell.innerText = isNaN(result) ? "ERR" : result;
            cell.dataset.value = result;
        });
    }
}

patch(HtmlField.prototype, "dynamic_excel_table_autorefresh", {
    mounted() {
        this._super(...arguments);

        this.el.querySelectorAll("table").forEach(table => {
            const dependencies = {};

            // Assign cell refs & set up listeners
            for (let r = 0; r < table.rows.length; r++) {
                for (let c = 0; c < table.rows[r].cells.length; c++) {
                    const cell = table.rows[r].cells[c];
                    const ref = getCellRef(r, c);
                    cell.dataset.ref = ref;
                    cell.contentEditable = "true";

                    cell.addEventListener("input", () => {
                        const text = cell.innerText.trim();
                        if (text.startsWith("=")) {
                            cell.dataset.formula = text;
                            const result = parseFormula(table, text);
                            cell.innerText = isNaN(result) ? "ERR" : result;
                            cell.dataset.value = result;

                            // Track dependencies
                            const matches = text.toUpperCase().match(/[A-Z]+\d+/g) || [];
                            matches.forEach(depRef => {
                                if (!dependencies[depRef]) dependencies[depRef] = [];
                                if (!dependencies[depRef].includes(cell))
                                    dependencies[depRef].push(cell);
                            });
                        } else {
                            cell.dataset.value = text;
                            // Recalculate dependent formulas
                            if (dependencies[cell.dataset.ref]) {
                                recalcAll(table, dependencies);
                            }
                        }
                    });
                }
            }
        });
    },
});
