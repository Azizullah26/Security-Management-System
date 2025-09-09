import json
import base64
from odoo import http
from odoo.http import request
from odoo.exceptions import AccessError, ValidationError

class HrEmployeeAPI(http.Controller):
    
    def _set_cors_headers(self, response, origin=None):
        """Set CORS headers for RCC Security System"""
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
    
    @http.route('/api/hr/employee/search', type='http', auth='user', methods=['POST'], csrf=False, cors='*')
    def search_employee(self, **kwargs):
        """Search employee by employee ID for RCC Security System"""
        try:
            origin = request.httprequest.headers.get('Origin')
            
            # Get employee_id from POST data
            employee_id = kwargs.get('employee_id') or request.httprequest.form.get('employee_id')
            
            if not employee_id:
                response = request.make_response(json.dumps({
                    'success': False,
                    'error': 'Employee ID is required'
                }), headers={'Content-Type': 'application/json'})
                return self._set_cors_headers(response, origin)
            
            # Search for employee
            employee_data = request.env['hr.employee'].search_by_employee_id(employee_id)
            
            if not employee_data:
                response = request.make_response(json.dumps({
                    'success': False,
                    'error': 'Employee not found'
                }), headers={'Content-Type': 'application/json'})
                return self._set_cors_headers(response, origin)
            
            response = request.make_response(json.dumps({
                'success': True,
                'data': employee_data
            }), headers={'Content-Type': 'application/json'})
            return self._set_cors_headers(response, origin)
            
        except AccessError:
            response = request.make_response(json.dumps({
                'success': False,
                'error': 'Access denied'
            }), headers={'Content-Type': 'application/json'})
            return self._set_cors_headers(response, origin)
        except Exception as e:
            response = request.make_response(json.dumps({
                'success': False,
                'error': str(e)
            }), headers={'Content-Type': 'application/json'})
            return self._set_cors_headers(response, origin)
    
    @http.route('/api/hr/employee/search', type='http', auth='none', methods=['OPTIONS'], csrf=False, cors='*')
    def search_employee_options(self):
        """Handle CORS preflight for search endpoint"""
        origin = request.httprequest.headers.get('Origin')
        response = request.make_response('', headers={'Content-Type': 'application/json'})
        return self._set_cors_headers(response, origin)
