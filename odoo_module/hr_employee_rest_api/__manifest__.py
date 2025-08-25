{
    'name': 'HR Employee REST API',
    'version': '1.0.0',
    'category': 'Human Resources',
    'summary': 'REST API for HR Employee data access',
    'description': """
        This module provides REST API endpoints for accessing HR Employee data.
        Compatible with external security management systems.
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': ['base', 'hr', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'views/hr_employee_views.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': False,
}
