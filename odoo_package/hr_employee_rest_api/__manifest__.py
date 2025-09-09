{
    'name': 'HR Employee REST API',
    'version': '1.0.0',
    'category': 'Human Resources',
    'summary': 'REST API for HR Employee data access for RCC Security System',
    'description': """
        This module provides REST API endpoints for accessing HR Employee data.
        Specifically designed for integration with RCC Security Management System.
        
        Features:
        - Employee search by employee ID
        - CORS support for web applications
        - Secure authentication
        - Image support for employee photos
    """,
    'author': 'RCC Security System',
    'website': 'https://rccsecurity.vercel.app',
    'depends': ['base', 'hr', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'views/hr_employee_views.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': False,
    'license': 'LGPL-3',
}
