from odoo import models, fields

class DynamicForm(models.Model):
    _name = 'dynamic.form'
    _description = 'Dynamic Form with Editable Table'

    name = fields.Char(string='Form Name', required=True)
    description = fields.Html(string='Description', sanitize=False, sanitize_tags=False)
