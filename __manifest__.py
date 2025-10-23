{
    'name': 'Dynamic Form Builder',
    'version': '1.0',
    'summary': 'Form with Excel-like dynamic description field',
    'category': 'Tools',
    'author': 'Your Name',
    'depends': ['base', 'web_editor'],
    'data': [
        'security/ir.model.access.csv',
        'views/dynamic_form_view.xml',
    ],
    'installable': True,
    'application': True,
   'assets': {
    'web.assets_backend': [
        'dynamic_form_builder/static/src/js/dynamic_table_excel.js',
    ],
}
