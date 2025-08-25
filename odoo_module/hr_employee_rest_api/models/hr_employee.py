from odoo import models, fields, api
from odoo.exceptions import ValidationError

class HrEmployee(models.Model):
    _inherit = 'hr.employee'
    
    # Add employee_id field if it doesn't exist
    employee_id = fields.Char(
        string='Employee ID',
        required=True,
        unique=True,
        help='Unique employee identification number'
    )
    
    @api.model
    def search_by_employee_id(self, employee_id):
        """Search employee by employee ID and return formatted data"""
        employee = self.search([('employee_id', '=', employee_id)], limit=1)
        if not employee:
            return False
            
        return {
            'id': employee.id,
            'name': employee.name,
            'work_email': employee.work_email or '',
            'work_phone': employee.work_phone or '',
            'department_id': [employee.department_id.id, employee.department_id.name] if employee.department_id else [False, ''],
            'company_id': [employee.company_id.id, employee.company_id.name] if employee.company_id else [False, ''],
            'image_1920': employee.image_1920 or False,
            'employee_id': employee.employee_id,
        }
