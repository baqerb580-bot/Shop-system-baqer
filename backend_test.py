#!/usr/bin/env python3
"""
Backend Test: Employee Repairs Update Endpoint
Testing the fix for route ordering bug in PUT /api/employees/:id/repairs/:repairId
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def print_section(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def test_employee_repairs_update():
    """
    Test the previously failing endpoint: PUT /api/employees/:id/repairs/:repairId
    
    Steps:
    1. Login as ssaa/ssaa and get employee id + token
    2. Ensure employee has 'repairs' permission
    3. Create a repair assigned to this employee
    4. Update repair status to 'in_progress' via employee endpoint
    5. Verify response is repair object (not employee)
    6. Update repair status to 'completed'
    7. Verify completedAt is set
    8. Verify employee record was NOT modified
    9. Verify normal PUT /api/employees/:id still works
    """
    
    print_section("TEST: Employee Repairs Update Endpoint (Route Ordering Fix)")
    
    # Step 1: Login as employee
    print("Step 1: Login as employee (ssaa/ssaa)...")
    login_response = requests.post(
        f"{BASE_URL}/employees/login",
        json={"username": "ssaa", "password": "ssaa"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return False
    
    login_data = login_response.json()
    if not login_data.get('success'):
        print(f"❌ Login unsuccessful: {login_data}")
        return False
    
    employee = login_data['employee']
    token = login_data['token']
    emp_id = employee['id']
    
    print(f"✅ Login successful")
    print(f"   Employee ID: {emp_id}")
    print(f"   Employee Name: {employee['name']}")
    print(f"   Token: {token[:20]}...")
    print(f"   Current Permissions: {employee.get('permissions', [])}")
    
    # Step 2: Ensure employee has 'repairs' permission
    print("\nStep 2: Ensure employee has 'repairs' permission...")
    required_permissions = ['tasks', 'repairs', 'pos', 'subscribers', 'isp', 'reports']
    
    if 'repairs' not in employee.get('permissions', []):
        print(f"   Adding 'repairs' permission to employee...")
        update_response = requests.put(
            f"{BASE_URL}/employees/{emp_id}",
            json={"permissions": required_permissions}
        )
        
        if update_response.status_code != 200:
            print(f"❌ Failed to update permissions: {update_response.status_code}")
            return False
        
        updated_emp = update_response.json()
        print(f"✅ Permissions updated: {updated_emp.get('permissions', [])}")
    else:
        print(f"✅ Employee already has 'repairs' permission")
    
    # Store original employee state for verification later
    original_emp_response = requests.get(f"{BASE_URL}/employees/{emp_id}")
    original_employee = original_emp_response.json()
    original_status = original_employee.get('status')
    original_kpi = original_employee.get('kpi')
    
    print(f"   Original employee status: {original_status}")
    print(f"   Original employee KPI: {original_kpi}")
    
    # Step 3: Create a repair assigned to this employee
    print("\nStep 3: Create a repair assigned to this employee...")
    repair_data = {
        "ticketNumber": "RP-TEST2",
        "customerName": "اختبار العميل",
        "phone": "07901234567",
        "device": "iPhone 14 Pro",
        "technicianId": emp_id,
        "technician": employee['name'],
        "status": "pending",
        "cost": 50000,
        "partsCost": 20000,
        "notes": "اختبار تحديث حالة الإصلاح"
    }
    
    create_response = requests.post(
        f"{BASE_URL}/repairs",
        json=repair_data
    )
    
    if create_response.status_code != 201:
        print(f"❌ Failed to create repair: {create_response.status_code}")
        print(f"Response: {create_response.text}")
        return False
    
    repair = create_response.json()
    repair_id = repair['id']
    
    print(f"✅ Repair created successfully")
    print(f"   Repair ID: {repair_id}")
    print(f"   Ticket Number: {repair['ticketNumber']}")
    print(f"   Status: {repair['status']}")
    print(f"   Technician: {repair['technician']}")
    
    # Step 4: Update repair status to 'in_progress' via employee endpoint
    print("\nStep 4: Update repair status to 'in_progress' via employee endpoint...")
    print(f"   Endpoint: PUT /api/employees/{emp_id}/repairs/{repair_id}")
    
    update1_response = requests.put(
        f"{BASE_URL}/employees/{emp_id}/repairs/{repair_id}",
        headers={"X-Emp-Token": token},
        json={"status": "in_progress"}
    )
    
    if update1_response.status_code != 200:
        print(f"❌ Failed to update repair: {update1_response.status_code}")
        print(f"Response: {update1_response.text}")
        return False
    
    updated_repair1 = update1_response.json()
    
    # Step 5: Verify response is repair object (not employee)
    print("\nStep 5: Verify response is REPAIR object (not employee)...")
    
    # Check if response has repair-specific fields
    has_ticket_number = 'ticketNumber' in updated_repair1
    has_device = 'device' in updated_repair1
    has_customer_name = 'customerName' in updated_repair1
    
    # Check if response does NOT have employee-specific fields
    has_employee_id = 'employeeId' in updated_repair1
    has_shift_start = 'shiftStart' in updated_repair1
    
    if has_ticket_number and has_device and has_customer_name and not has_employee_id:
        print(f"✅ Response is REPAIR object (correct!)")
        print(f"   Ticket Number: {updated_repair1.get('ticketNumber')}")
        print(f"   Device: {updated_repair1.get('device')}")
        print(f"   Customer: {updated_repair1.get('customerName')}")
        print(f"   Status: {updated_repair1.get('status')}")
    else:
        print(f"❌ Response appears to be EMPLOYEE object (bug not fixed!)")
        print(f"   Has ticketNumber: {has_ticket_number}")
        print(f"   Has device: {has_device}")
        print(f"   Has employeeId: {has_employee_id}")
        print(f"   Response keys: {list(updated_repair1.keys())}")
        return False
    
    # Verify status was actually updated
    if updated_repair1.get('status') != 'in_progress':
        print(f"❌ Status not updated correctly. Expected 'in_progress', got '{updated_repair1.get('status')}'")
        return False
    
    print(f"✅ Status updated to 'in_progress'")
    
    # Verify the repair record in database
    print("\nStep 5b: Verify repair record in database...")
    verify_response = requests.get(f"{BASE_URL}/repairs")
    all_repairs = verify_response.json()
    db_repair = next((r for r in all_repairs if r['id'] == repair_id), None)
    
    if db_repair and db_repair.get('status') == 'in_progress':
        print(f"✅ Repair record in database has status='in_progress'")
    else:
        print(f"❌ Repair record in database not updated correctly")
        print(f"   Database status: {db_repair.get('status') if db_repair else 'NOT FOUND'}")
        return False
    
    # Step 6: Update repair status to 'completed'
    print("\nStep 6: Update repair status to 'completed'...")
    
    update2_response = requests.put(
        f"{BASE_URL}/employees/{emp_id}/repairs/{repair_id}",
        headers={"X-Emp-Token": token},
        json={"status": "completed"}
    )
    
    if update2_response.status_code != 200:
        print(f"❌ Failed to update repair to completed: {update2_response.status_code}")
        print(f"Response: {update2_response.text}")
        return False
    
    updated_repair2 = update2_response.json()
    
    # Step 7: Verify completedAt is set
    print("\nStep 7: Verify completedAt is set...")
    
    if updated_repair2.get('status') != 'completed':
        print(f"❌ Status not updated to 'completed'. Got: {updated_repair2.get('status')}")
        return False
    
    completed_at = updated_repair2.get('completedAt')
    if completed_at:
        print(f"✅ Status updated to 'completed'")
        print(f"✅ completedAt is set: {completed_at}")
    else:
        print(f"❌ completedAt is NOT set")
        return False
    
    # Step 8: Verify employee record was NOT modified
    print("\nStep 8: Verify employee record was NOT modified...")
    
    current_emp_response = requests.get(f"{BASE_URL}/employees/{emp_id}")
    current_employee = current_emp_response.json()
    current_status = current_employee.get('status')
    current_kpi = current_employee.get('kpi')
    
    if current_status == original_status and current_kpi == original_kpi:
        print(f"✅ Employee record unchanged")
        print(f"   Status: {current_status} (same as before)")
        print(f"   KPI: {current_kpi} (same as before)")
    else:
        print(f"❌ Employee record was modified!")
        print(f"   Original status: {original_status} → Current: {current_status}")
        print(f"   Original KPI: {original_kpi} → Current: {current_kpi}")
        return False
    
    # Step 9: Verify normal PUT /api/employees/:id still works
    print("\nStep 9: Verify normal PUT /api/employees/:id still works...")
    
    test_kpi = 95
    normal_update_response = requests.put(
        f"{BASE_URL}/employees/{emp_id}",
        json={"kpi": test_kpi}
    )
    
    if normal_update_response.status_code != 200:
        print(f"❌ Normal employee update failed: {normal_update_response.status_code}")
        return False
    
    updated_emp_check = normal_update_response.json()
    
    if updated_emp_check.get('kpi') == test_kpi:
        print(f"✅ Normal employee update works correctly")
        print(f"   Updated KPI to: {test_kpi}")
        
        # Restore original KPI
        requests.put(f"{BASE_URL}/employees/{emp_id}", json={"kpi": original_kpi})
        print(f"   Restored original KPI: {original_kpi}")
    else:
        print(f"❌ Normal employee update didn't work as expected")
        return False
    
    # Cleanup: Delete test repair
    print("\nCleanup: Deleting test repair...")
    delete_response = requests.delete(f"{BASE_URL}/repairs/{repair_id}")
    if delete_response.status_code == 200:
        print(f"✅ Test repair deleted")
    
    print_section("TEST RESULT: ✅ ALL TESTS PASSED")
    print("Summary:")
    print("  ✅ Employee login successful")
    print("  ✅ Permissions verified/updated")
    print("  ✅ Repair created successfully")
    print("  ✅ PUT /api/employees/:id/repairs/:repairId returns REPAIR object (not employee)")
    print("  ✅ Repair status updated to 'in_progress'")
    print("  ✅ Repair status updated to 'completed'")
    print("  ✅ completedAt timestamp set correctly")
    print("  ✅ Employee record NOT modified by repair updates")
    print("  ✅ Normal PUT /api/employees/:id still works")
    print("\n🎉 ROUTE ORDERING BUG IS FIXED!")
    
    return True


if __name__ == "__main__":
    try:
        success = test_employee_repairs_update()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ TEST FAILED WITH EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
