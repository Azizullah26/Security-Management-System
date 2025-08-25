import json
import base64
from odoo import http
from odoo.http import request
from odoo.exceptions import AccessError, ValidationError

class HrEmployeeAPI(http.Controller):
    
    def _set_cors_headers(self, response, origin=None):
        """Set CORS headers for cross-origin requests"""
        allowed_origins = [
            'https://rccsecurity.vercel.app',
            'http://localhost:3000',
            'https://localhost:3000'
        ]
        
        if origin and origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            response.headers['Access-Control-Allow-Origin'] = 'https://rccsecurity.vercel.app'
            
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    @http.route('/api/hr/employee/search', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def search_employee(self, employee_id=None):
        """Search employee by employee ID"""
        try:
            origin = request.httprequest.headers.get('Origin')
            
            if not employee_id:
                response = request.make_response(json.dumps({
                    'success': False,
                    'error': 'Employee ID is required'
                }))
                return self._set_cors_headers(response, origin)
            
            # Search for employee
            employee_data = request.env['hr.employee'].search_by_employee_id(employee_id)
            
            if not employee_data:
                response = request.make_response(json.dumps({
                    'success': False,
                    'error': 'Employee not found'
                }))
                return self._set_cors_headers(response, origin)
            
            response = request.make_response(json.dumps({
                'success': True,
                'data': employee_data
            }))
            return self._set_cors_headers(response, origin)
            
        except AccessError:
            response = request.make_response(json.dumps({
                'success': False,
                'error': 'Access denied'
            }))
            return self._set_cors_headers(response, origin)
        except Exception as e:
            response = request.make_response(json.dumps({
                'success': False,
                'error': str(e)
            }))
            return self._set_cors_headers(response, origin)
    
    @http.route('/api/hr/employee/search', type='http', auth='none', methods=['OPTIONS'], csrf=False, cors='*')
    def search_employee_options(self):
        """Handle CORS preflight for search endpoint"""
        origin = request.httprequest.headers.get('Origin')
        response = request.make_response('')
        return self._set_cors_headers(response, origin)
    
    @http.route('/api/hr/employee/<int:employee_id>', type='json', auth='user', methods=['GET'], csrf=False, cors='*')
    def get_employee(self, employee_id):
        """Get employee by ID"""
        try:
            employee = request.env['hr.employee'].browse(employee_id)
            if not employee.exists():
                response = request.make_response(json.dumps({
                    'success': False,
                    'error': 'Employee not found'
                }))
                return self._set_cors_headers(response)
            
            response = request.make_response(json.dumps({
                'success': True,
                'data': {
                    'id': employee.id,
                    'name': employee.name,
                    'work_email': employee.work_email or '',
                    'work_phone': employee.work_phone or '',
                    'department_id': [employee.department_id.id, employee.department_id.name] if employee.department_id else [False, ''],
                    'company_id': [employee.company_id.id, employee.company_id.name] if employee.company_id else [False, ''],
                    'image_1920': employee.image_1920 or False,
                    'employee_id': employee.employee_id,
                }
            }))
            return self._set_cors_headers(response)
            
        except Exception as e:
            response = request.make_response(json.dumps({
                'success': False,
                'error': str(e)
            }))
            return self._set_cors_headers(response)
