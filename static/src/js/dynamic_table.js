/** @odoo-module **/
import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { HtmlField } from "@web/views/fields/html/html_field";

patch(HtmlField.prototype, "dynamic_table_patch", {
    mounted() {
        this._super(...arguments);

        // Enable formula calculation inside HTML tables
        this.el.querySelectorAll("table").forEach(table => {
            table.addEventListener("input", () => {
                table.querySelectorAll("td").forEach(cell => {
                    const text = cell.innerText.trim();
                    if (text.startsWith('=')) {
                        try {
                            const formula = text.slice(1);
                            const result = eval(formula);
                            cell.innerText = result;
                        } catch {
                            // Invalid formula, ignore
                        }
                    }
                });
            });
        });
    },
});
