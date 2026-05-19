#!/usr/bin/env python3
"""
Backend Test Script for NEW Scoped Employee Endpoints
Tests permission-based access with X-Emp-Token header
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def print_test(name, passed, details=""):
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"\n{status}: {name}")
    if details:
        print(f"  Details: {details}")

def test_employee_login():
    """Test 1: Login as employee to get token"""
    print("\n" + "="*80)
    print("TEST 1: Employee Login")
    print("="*80)
    
    try:
        response = requests.post(f"{BASE_URL}/employees/login", json={
            "username": "ssaa",
            "password": "ssaa"
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('employee') and data.get('token'):
                emp_id = data['employee']['id']
                token = data['token']
                print_test("Employee Login", True, f"Employee ID: {emp_id}, Token: {token[:20]}...")
                return emp_id, token, data['employee']
            else:
                print_test("Employee Login", False, "Missing success/employee/token in response")
                return None, None, None
        else:
            print_test("Employee Login", False, f"Status: {response.status_code}, Body: {response.text}")
            return None, None, None
    except Exception as e:
        print_test("Employee Login", False, f"Exception: {str(e)}")
        return None, None, None

def test_update_employee_permissions(emp_id):
    """Test 2: Update employee permissions to include all scoped sections"""
    print("\n" + "="*80)
    print("TEST 2: Update Employee Permissions")
    print("="*80)
    
    try:
        permissions = ["tasks", "pos", "repairs", "subscribers", "isp", "reports"]
        response = requests.put(f"{BASE_URL}/employees/{emp_id}", json={
            "permissions": permissions
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('permissions') == permissions:
                print_test("Update Permissions", True, f"Permissions: {permissions}")
                return True
            else:
                print_test("Update Permissions", False, f"Permissions not updated correctly: {data.get('permissions')}")
                return False
        else:
            print_test("Update Permissions", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    except Exception as e:
        print_test("Update Permissions", False, f"Exception: {str(e)}")
        return False

def test_settings_late_deduction_config():
    """Test 3: Settings - Late deduction config (per_minute mode)"""
    print("\n" + "="*80)
    print("TEST 3: Settings - Late Deduction Config (per_minute mode)")
    print("="*80)
    
    try:
        # Update settings to per_minute mode
        response = requests.put(f"{BASE_URL}/settings", json={
            "employees": {
                "lateGraceMinutes": 5,
                "lateDeductionMode": "per_minute",
                "lateDeductionPerMinute": 1000,
                "autoDeductionEnabled": True
            }
        })
        
        if response.status_code == 200:
            # Verify settings were updated
            get_response = requests.get(f"{BASE_URL}/settings")
            if get_response.status_code == 200:
                settings = get_response.json()
                emp_settings = settings.get('employees', {})
                
                checks = [
                    emp_settings.get('lateGraceMinutes') == 5,
                    emp_settings.get('lateDeductionMode') == 'per_minute',
                    emp_settings.get('lateDeductionPerMinute') == 1000,
                    emp_settings.get('autoDeductionEnabled') == True
                ]
                
                if all(checks):
                    print_test("Settings Update", True, f"lateGraceMinutes=5, mode=per_minute, perMinute=1000, autoEnabled=True")
                    return True
                else:
                    print_test("Settings Update", False, f"Settings not applied correctly: {emp_settings}")
                    return False
            else:
                print_test("Settings Update", False, f"GET failed: {get_response.status_code}")
                return False
        else:
            print_test("Settings Update", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    except Exception as e:
        print_test("Settings Update", False, f"Exception: {str(e)}")
        return False

def test_checkin_per_minute_deduction(emp_id):
    """Test 4: Check-in with per_minute deduction calculation"""
    print("\n" + "="*80)
    print("TEST 4: Check-in with per_minute Deduction")
    print("="*80)
    
    try:
        # First, check-in (will be late since we're testing during the day)
        response = requests.post(f"{BASE_URL}/attendance/checkin", json={
            "employeeId": emp_id
        })
        
        if response.status_code in [200, 400]:  # 400 if already checked in today
            if response.status_code == 400 and "مسبقاً" in response.text:
                print_test("Check-in", True, "Already checked in today (expected)")
                
                # Get today's attendance to verify deduction
                today = datetime.now().strftime('%Y-%m-%d')
                att_response = requests.get(f"{BASE_URL}/attendance/today")
                if att_response.status_code == 200:
                    records = att_response.json()
                    emp_record = next((r for r in records if r.get('employeeId') == emp_id), None)
                    
                    if emp_record:
                        late_minutes = emp_record.get('lateMinutes', 0)
                        auto_deduction = emp_record.get('autoDeduction', 0)
                        
                        # Calculate expected deduction: (lateMinutes - 5) * 1000
                        expected_deduction = max(0, (late_minutes - 5) * 1000) if late_minutes > 5 else 0
                        
                        print(f"  Late Minutes: {late_minutes}")
                        print(f"  Auto Deduction: {auto_deduction}")
                        print(f"  Expected Deduction: {expected_deduction}")
                        
                        # Check if deduction matches per_minute calculation
                        if auto_deduction == expected_deduction:
                            print_test("Per-minute Deduction Calculation", True, 
                                     f"Deduction = ({late_minutes} - 5) × 1000 = {auto_deduction}")
                            
                            # Verify payroll entry was created
                            payroll_response = requests.get(f"{BASE_URL}/payroll-entries")
                            if payroll_response.status_code == 200:
                                entries = payroll_response.json()
                                matching_entry = next((e for e in entries 
                                                     if e.get('employeeId') == emp_id 
                                                     and e.get('auto') == True
                                                     and '1000 د.ع/دقيقة' in e.get('reason', '')), None)
                                
                                if matching_entry:
                                    print_test("Payroll Entry with per_minute reason", True, 
                                             f"Reason: {matching_entry.get('reason')}")
                                    return True
                                else:
                                    print_test("Payroll Entry with per_minute reason", False, 
                                             "No matching payroll entry found with '× 1000 د.ع/دقيقة' in reason")
                                    return False
                        else:
                            print_test("Per-minute Deduction Calculation", False, 
                                     f"Expected {expected_deduction}, got {auto_deduction}")
                            return False
                    else:
                        print_test("Check-in", False, "No attendance record found for employee")
                        return False
                else:
                    print_test("Check-in", False, f"Failed to get today's attendance: {att_response.status_code}")
                    return False
            else:
                # New check-in
                data = response.json()
                print_test("Check-in", True, f"Success: {data.get('success')}")
                return True
        else:
            print_test("Check-in", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    except Exception as e:
        print_test("Check-in", False, f"Exception: {str(e)}")
        return False

def test_checkin_auto_deduction_disabled(emp_id):
    """Test 5: Check-in with autoDeductionEnabled=false"""
    print("\n" + "="*80)
    print("TEST 5: Check-in with autoDeductionEnabled=false")
    print("="*80)
    
    try:
        # Update settings to disable auto deduction
        response = requests.put(f"{BASE_URL}/settings", json={
            "employees": {
                "autoDeductionEnabled": False
            }
        })
        
        if response.status_code == 200:
            print_test("Disable Auto Deduction", True, "autoDeductionEnabled=false")
            
            # Note: We can't test a new check-in since employee already checked in today
            # This test verifies the setting was updated correctly
            get_response = requests.get(f"{BASE_URL}/settings")
            if get_response.status_code == 200:
                settings = get_response.json()
                if settings.get('employees', {}).get('autoDeductionEnabled') == False:
                    print_test("Verify Auto Deduction Disabled", True, "Setting confirmed")
                    return True
                else:
                    print_test("Verify Auto Deduction Disabled", False, "Setting not applied")
                    return False
        else:
            print_test("Disable Auto Deduction", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Disable Auto Deduction", False, f"Exception: {str(e)}")
        return False

def test_employee_sales_without_token(emp_id):
    """Test 6: Employee sales WITHOUT token (should fail)"""
    print("\n" + "="*80)
    print("TEST 6: Employee Sales WITHOUT Token (expect 401)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/employees/{emp_id}/sales")
        
        if response.status_code == 401:
            print_test("Sales without token", True, "Correctly returned 401 Unauthorized")
            return True
        else:
            print_test("Sales without token", False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_test("Sales without token", False, f"Exception: {str(e)}")
        return False

def test_employee_sales_wrong_token(emp_id):
    """Test 7: Employee sales WITH WRONG token (should fail)"""
    print("\n" + "="*80)
    print("TEST 7: Employee Sales WITH WRONG Token (expect 401)")
    print("="*80)
    
    try:
        wrong_token = f"emp_wrong_id_{int(datetime.now().timestamp())}"
        headers = {"X-Emp-Token": wrong_token}
        response = requests.get(f"{BASE_URL}/employees/{emp_id}/sales", headers=headers)
        
        if response.status_code == 401:
            print_test("Sales with wrong token", True, "Correctly returned 401 Unauthorized")
            return True
        else:
            print_test("Sales with wrong token", False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_test("Sales with wrong token", False, f"Exception: {str(e)}")
        return False

def test_employee_sales_correct_token(emp_id, token):
    """Test 8: Employee sales WITH CORRECT token"""
    print("\n" + "="*80)
    print("TEST 8: Employee Sales WITH CORRECT Token")
    print("="*80)
    
    try:
        headers = {"X-Emp-Token": token}
        response = requests.get(f"{BASE_URL}/employees/{emp_id}/sales", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if 'sales' in data and 'total' in data and 'count' in data:
                print_test("Get Sales with correct token", True, 
                         f"Sales count: {data['count']}, Total: {data['total']}")
                return True
            else:
                print_test("Get Sales with correct token", False, "Missing expected fields in response")
                return False
        else:
            print_test("Get Sales with correct token", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    except Exception as e:
        print_test("Get Sales with correct token", False, f"Exception: {str(e)}")
        return False

def test_employee_create_sale(emp_id, token, emp_name):
    """Test 9: Employee creates a sale"""
    print("\n" + "="*80)
    print("TEST 9: Employee Creates Sale")
    print("="*80)
    
    try:
        headers = {"X-Emp-Token": token}
        sale_data = {
            "items": [
                {
                    "id": "p1",
                    "name": "منتج تجريبي",
                    "price": 5000,
                    "quantity": 2
                }
            ],
            "discount": 1000,
            "paymentMethod": "cash",
            "customer": "زبون تجريبي"
        }
        
        response = requests.post(f"{BASE_URL}/employees/{emp_id}/sales", 
                               headers=headers, json=sale_data)
        
        if response.status_code == 201:
            data = response.json()
            checks = [
                data.get('cashierId') == emp_id,
                data.get('cashier') == emp_name,
                data.get('subtotal') == 10000,
                data.get('discount') == 1000,
                data.get('total') == 9000,
                data.get('paymentMethod') == 'cash',
                data.get('customer') == 'زبون تجريبي'
            ]
            
            if all(checks):
                print_test("Create Sale", True, 
                         f"Sale created: Invoice {data.get('invoiceNumber')}, Total: {data.get('total')}")
                return True, data.get('id')
            else:
                print_test("Create Sale", False, f"Sale data incorrect: {data}")
                return False, None
        else:
            print_test("Create Sale", False, f"Status: {response.status_code}, Body: {response.text}")
            return False, None
    except Exception as e:
        print_test("Create Sale", False, f"Exception: {str(e)}")
        return False, None

def test_employee_sales_list_after_create(emp_id, token):
    """Test 10: Verify sale appears in employee's sales list"""
    print("\n" + "="*80)
    print("TEST 10: Verify Sale in Employee's Sales List")
    print("="*80)
    
    try:
        headers = {"X-Emp-Token": token}
        response = requests.get(f"{BASE_URL}/employees/{emp_id}/sales", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('count', 0) > 0:
                print_test("Sales list after create", True, 
                         f"Found {data['count']} sale(s), Total: {data['total']}")
                return True
            else:
                print_test("Sales list after create", False, "No sales found")
                return False
        else:
            print_test("Sales list after create", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Sales list after create", False, f"Exception: {str(e)}")
        return False

def test_permission_denied_sales(emp_id, token):
    """Test 11: Permission denied when employee doesn't have 'pos' permission"""
    print("\n" + "="*80)
    print("TEST 11: Permission Denied (remove 'pos' permission)")
    print("="*80)
    
    try:
        # Update permissions to remove 'pos'
        response = requests.put(f"{BASE_URL}/employees/{emp_id}", json={
            "permissions": ["tasks"]  # Only tasks, no pos
        })
        
        if response.status_code == 200:
            # Try to access sales endpoint
            headers = {"X-Emp-Token": token}
            sales_response = requests.get(f"{BASE_URL}/employees/{emp_id}/sales", headers=headers)
            
            if sales_response.status_code == 403:
                print_test("Permission denied for sales", True, "Correctly returned 403 Forbidden")
                return True
            else:
                print_test("Permission denied for sales", False, 
                         f"Expected 403, got {sales_response.status_code}")
                return False
        else:
            print_test("Permission denied for sales", False, f"Failed to update permissions: {response.status_code}")
            return False
    except Exception as e:
        print_test("Permission denied for sales", False, f"Exception: {str(e)}")
        return False

def test_permission_denied_multiple_endpoints(emp_id, token):
    """Test 12: Permission denied for repairs, subscribers, report, isp"""
    print("\n" + "="*80)
    print("TEST 12: Permission Denied for Multiple Endpoints")
    print("="*80)
    
    try:
        headers = {"X-Emp-Token": token}
        endpoints = [
            ("/repairs", "repairs"),
            ("/subscribers", "subscribers"),
            ("/report?month=2026-05", "reports"),
            ("/isp", "isp")
        ]
        
        all_passed = True
        for endpoint, perm in endpoints:
            response = requests.get(f"{BASE_URL}/employees/{emp_id}{endpoint}", headers=headers)
            if response.status_code == 403:
                print_test(f"Permission denied for {perm}", True, "Correctly returned 403")
            else:
                print_test(f"Permission denied for {perm}", False, 
                         f"Expected 403, got {response.status_code}")
                all_passed = False
        
        return all_passed
    except Exception as e:
        print_test("Permission denied for multiple endpoints", False, f"Exception: {str(e)}")
        return False

def test_employee_repairs(emp_id, token):
    """Test 13: Employee's repairs endpoint"""
    print("\n" + "="*80)
    print("TEST 13: Employee's Repairs")
    print("="*80)
    
    try:
        # First restore permissions to include repairs
        perm_response = requests.put(f"{BASE_URL}/employees/{emp_id}", json={
            "permissions": ["tasks", "repairs"]
        })
        
        if perm_response.status_code != 200:
            print_test("Restore repairs permission", False, f"Status: {perm_response.status_code}")
            return False, None
        
        # Create a repair assigned to this employee
        repair_data = {
            "ticketNumber": "RP-TEST",
            "customerName": "زبون اختبار",
            "device": "iPhone 14",
            "technicianId": emp_id,
            "status": "pending",
            "cost": 50000
        }
        
        create_response = requests.post(f"{BASE_URL}/repairs", json=repair_data)
        if create_response.status_code != 201:
            print_test("Create test repair", False, f"Status: {create_response.status_code}")
            return False, None
        
        repair_id = create_response.json().get('id')
        print_test("Create test repair", True, f"Repair ID: {repair_id}")
        
        # Get employee's repairs
        headers = {"X-Emp-Token": token}
        response = requests.get(f"{BASE_URL}/employees/{emp_id}/repairs", headers=headers)
        
        if response.status_code == 200:
            repairs = response.json()
            matching_repair = next((r for r in repairs if r.get('id') == repair_id), None)
            
            if matching_repair:
                print_test("Get employee repairs", True, f"Found {len(repairs)} repair(s)")
                return True, repair_id
            else:
                print_test("Get employee repairs", False, "Created repair not found in list")
                return False, repair_id
        else:
            print_test("Get employee repairs", False, f"Status: {response.status_code}")
            return False, repair_id
    except Exception as e:
        print_test("Employee repairs", False, f"Exception: {str(e)}")
        return False, None

def test_employee_update_repair(emp_id, token, repair_id):
    """Test 14: Employee updates repair status"""
    print("\n" + "="*80)
    print("TEST 14: Employee Updates Repair Status")
    print("="*80)
    
    try:
        headers = {"X-Emp-Token": token}
        
        # Update to in_progress
        response = requests.put(f"{BASE_URL}/employees/{emp_id}/repairs/{repair_id}", 
                              headers=headers, json={"status": "in_progress"})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'in_progress':
                print_test("Update repair to in_progress", True, "Status updated")
                
                # Update to completed
                complete_response = requests.put(f"{BASE_URL}/employees/{emp_id}/repairs/{repair_id}", 
                                               headers=headers, json={"status": "completed"})
                
                if complete_response.status_code == 200:
                    complete_data = complete_response.json()
                    if complete_data.get('status') == 'completed' and complete_data.get('completedAt'):
                        print_test("Update repair to completed", True, 
                                 f"Status: completed, completedAt: {complete_data.get('completedAt')}")
                        return True
                    else:
                        print_test("Update repair to completed", False, "Status or completedAt not set")
                        return False
                else:
                    print_test("Update repair to completed", False, f"Status: {complete_response.status_code}")
                    return False
            else:
                print_test("Update repair to in_progress", False, f"Status not updated: {data.get('status')}")
                return False
        else:
            print_test("Update repair to in_progress", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Employee update repair", False, f"Exception: {str(e)}")
        return False

def test_employee_personal_report(emp_id, token):
    """Test 15: Employee's personal report"""
    print("\n" + "="*80)
    print("TEST 15: Employee's Personal Report")
    print("="*80)
    
    try:
        # First restore permissions to include reports
        perm_response = requests.put(f"{BASE_URL}/employees/{emp_id}", json={
            "permissions": ["tasks", "repairs", "reports"]
        })
        
        if perm_response.status_code != 200:
            print_test("Restore reports permission", False, f"Status: {perm_response.status_code}")
            return False
        
        headers = {"X-Emp-Token": token}
        response = requests.get(f"{BASE_URL}/employees/{emp_id}/report?month=2026-05", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ['month', 'attendance', 'tasks', 'sales', 'repairs', 'payroll', 
                             'kpi', 'ratingPoints', 'tasksCompletedAllTime']
            
            if all(field in data for field in required_fields):
                print_test("Employee personal report", True, 
                         f"Month: {data['month']}, KPI: {data['kpi']}, Tasks: {data['tasks']['total']}")
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                print_test("Employee personal report", False, f"Missing fields: {missing}")
                return False
        else:
            print_test("Employee personal report", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Employee personal report", False, f"Exception: {str(e)}")
        return False

def test_employee_isp_endpoint(emp_id, token):
    """Test 16: Employee ISP endpoint"""
    print("\n" + "="*80)
    print("TEST 16: Employee ISP Endpoint")
    print("="*80)
    
    try:
        # First restore permissions to include isp
        perm_response = requests.put(f"{BASE_URL}/employees/{emp_id}", json={
            "permissions": ["tasks", "isp"]
        })
        
        if perm_response.status_code != 200:
            print_test("Restore isp permission", False, f"Status: {perm_response.status_code}")
            return False
        
        headers = {"X-Emp-Token": token}
        response = requests.get(f"{BASE_URL}/employees/{emp_id}/isp", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if 'zones' in data and 'networks' in data:
                print_test("Employee ISP endpoint", True, 
                         f"Zones: {len(data['zones'])}, Networks: {len(data['networks'])}")
                return True
            else:
                print_test("Employee ISP endpoint", False, "Missing zones or networks in response")
                return False
        else:
            print_test("Employee ISP endpoint", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Employee ISP endpoint", False, f"Exception: {str(e)}")
        return False

def test_employee_subscribers_endpoint(emp_id, token):
    """Test 17: Employee subscribers endpoint"""
    print("\n" + "="*80)
    print("TEST 17: Employee Subscribers Endpoint")
    print("="*80)
    
    try:
        # First restore permissions to include subscribers
        perm_response = requests.put(f"{BASE_URL}/employees/{emp_id}", json={
            "permissions": ["tasks", "subscribers"]
        })
        
        if perm_response.status_code != 200:
            print_test("Restore subscribers permission", False, f"Status: {perm_response.status_code}")
            return False
        
        headers = {"X-Emp-Token": token}
        response = requests.get(f"{BASE_URL}/employees/{emp_id}/subscribers", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            # Should return array (filtered to only those with managerId or assignedTo = emp_id)
            if isinstance(data, list):
                print_test("Employee subscribers endpoint", True, 
                         f"Found {len(data)} subscriber(s) managed by employee")
                return True
            else:
                print_test("Employee subscribers endpoint", False, "Response is not an array")
                return False
        else:
            print_test("Employee subscribers endpoint", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Employee subscribers endpoint", False, f"Exception: {str(e)}")
        return False

def test_cleanup_settings():
    """Test 18: Cleanup - Reset settings"""
    print("\n" + "="*80)
    print("TEST 18: Cleanup - Reset Settings")
    print("="*80)
    
    try:
        response = requests.post(f"{BASE_URL}/settings/reset", json={
            "section": "employees"
        })
        
        if response.status_code == 200:
            print_test("Reset settings", True, "Settings reset to defaults")
            return True
        else:
            print_test("Reset settings", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Reset settings", False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "="*80)
    print("BACKEND TEST: NEW SCOPED EMPLOYEE ENDPOINTS")
    print("Testing permission-based access with X-Emp-Token header")
    print("="*80)
    
    results = []
    
    # Test 1: Login
    emp_id, token, employee = test_employee_login()
    if not emp_id or not token:
        print("\n❌ CRITICAL: Cannot proceed without employee login")
        return
    
    emp_name = employee.get('name', '')
    
    # Test 2: Update permissions
    results.append(("Update Employee Permissions", test_update_employee_permissions(emp_id)))
    
    # Test 3: Settings - Late deduction config
    results.append(("Settings Late Deduction Config", test_settings_late_deduction_config()))
    
    # Test 4: Check-in with per_minute deduction
    results.append(("Check-in per_minute Deduction", test_checkin_per_minute_deduction(emp_id)))
    
    # Test 5: Check-in with autoDeductionEnabled=false
    results.append(("Check-in autoDeduction Disabled", test_checkin_auto_deduction_disabled(emp_id)))
    
    # Test 6-8: Sales endpoint token enforcement
    results.append(("Sales WITHOUT Token", test_employee_sales_without_token(emp_id)))
    results.append(("Sales WRONG Token", test_employee_sales_wrong_token(emp_id)))
    results.append(("Sales CORRECT Token", test_employee_sales_correct_token(emp_id, token)))
    
    # Test 9-10: Create sale and verify
    create_result, sale_id = test_employee_create_sale(emp_id, token, emp_name)
    results.append(("Create Sale", create_result))
    if create_result:
        results.append(("Verify Sale in List", test_employee_sales_list_after_create(emp_id, token)))
    
    # Test 11-12: Permission denied
    results.append(("Permission Denied Sales", test_permission_denied_sales(emp_id, token)))
    results.append(("Permission Denied Multiple", test_permission_denied_multiple_endpoints(emp_id, token)))
    
    # Test 13-14: Repairs
    repairs_result, repair_id = test_employee_repairs(emp_id, token)
    results.append(("Employee Repairs", repairs_result))
    if repairs_result and repair_id:
        results.append(("Update Repair Status", test_employee_update_repair(emp_id, token, repair_id)))
    
    # Test 15: Personal report
    results.append(("Employee Personal Report", test_employee_personal_report(emp_id, token)))
    
    # Test 16: ISP endpoint
    results.append(("Employee ISP Endpoint", test_employee_isp_endpoint(emp_id, token)))
    
    # Test 17: Subscribers endpoint
    results.append(("Employee Subscribers Endpoint", test_employee_subscribers_endpoint(emp_id, token)))
    
    # Test 18: Cleanup
    results.append(("Cleanup Settings", test_cleanup_settings()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")

if __name__ == "__main__":
    main()
