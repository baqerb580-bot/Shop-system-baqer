#!/usr/bin/env python3
"""
Backend API Testing Script for NEW Endpoints
Tests: Admin Credentials, Subscribers Search, Payroll Entries CRUD, Tasks with Subscriber Repair Type
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def print_test(name, passed, details=""):
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"{status} - {name}")
    if details:
        print(f"  Details: {details}")

def test_admin_credentials():
    """Test Admin Credentials Management (GET, PUT, POST)"""
    print("\n" + "="*80)
    print("TEST 1: ADMIN CREDENTIALS MANAGEMENT")
    print("="*80)
    
    # 1a. GET /api/admin/credentials (initial state)
    print("\n1a. GET /api/admin/credentials (initial state)")
    try:
        resp = requests.get(f"{BASE_URL}/admin/credentials")
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        initial_username = data.get('username', 'admin')
        initial_has_password = data.get('hasPassword', False)
        print_test("GET /api/admin/credentials", resp.status_code == 200, 
                   f"username={initial_username}, hasPassword={initial_has_password}")
    except Exception as e:
        print_test("GET /api/admin/credentials", False, str(e))
        return
    
    # 1b. PUT /api/admin/credentials (first call - no password set yet)
    print("\n1b. PUT /api/admin/credentials (first call - set initial credentials)")
    try:
        payload = {
            "newUsername": "ghazlan_admin",
            "newPassword": "secure123"
        }
        resp = requests.put(f"{BASE_URL}/admin/credentials", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("PUT /api/admin/credentials (first call)", 
                   resp.status_code == 200 and data.get('success') == True,
                   "Set username=ghazlan_admin, password=secure123")
    except Exception as e:
        print_test("PUT /api/admin/credentials (first call)", False, str(e))
        return
    
    # 1c. Verify GET reflects changes
    print("\n1c. GET /api/admin/credentials (verify changes)")
    try:
        resp = requests.get(f"{BASE_URL}/admin/credentials")
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("GET /api/admin/credentials (after update)", 
                   data.get('username') == 'ghazlan_admin' and data.get('hasPassword') == True,
                   f"username={data.get('username')}, hasPassword={data.get('hasPassword')}")
    except Exception as e:
        print_test("GET /api/admin/credentials (after update)", False, str(e))
    
    # 1d. PUT without currentPassword (should fail with 400)
    print("\n1d. PUT /api/admin/credentials (without currentPassword - should fail)")
    try:
        payload = {
            "newUsername": "test_admin",
            "newPassword": "newpass123"
        }
        resp = requests.put(f"{BASE_URL}/admin/credentials", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("PUT without currentPassword", 
                   resp.status_code == 400 and 'كلمة المرور الحالية مطلوبة' in data.get('error', ''),
                   f"Status: {resp.status_code}, Error: {data.get('error', '')}")
    except Exception as e:
        print_test("PUT without currentPassword", False, str(e))
    
    # 1e. PUT with WRONG currentPassword (should fail with 401)
    print("\n1e. PUT /api/admin/credentials (with WRONG currentPassword - should fail)")
    try:
        payload = {
            "currentPassword": "wrongpassword",
            "newPassword": "newer123"
        }
        resp = requests.put(f"{BASE_URL}/admin/credentials", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("PUT with WRONG currentPassword", 
                   resp.status_code == 401 and 'كلمة المرور الحالية غير صحيحة' in data.get('error', ''),
                   f"Status: {resp.status_code}, Error: {data.get('error', '')}")
    except Exception as e:
        print_test("PUT with WRONG currentPassword", False, str(e))
    
    # 1f. PUT with CORRECT currentPassword (should succeed)
    print("\n1f. PUT /api/admin/credentials (with CORRECT currentPassword)")
    try:
        payload = {
            "currentPassword": "secure123",
            "newPassword": "newer123"
        }
        resp = requests.put(f"{BASE_URL}/admin/credentials", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("PUT with CORRECT currentPassword", 
                   resp.status_code == 200 and data.get('success') == True,
                   "Password updated to newer123")
    except Exception as e:
        print_test("PUT with CORRECT currentPassword", False, str(e))
    
    # 1g. PUT with too-short password (should fail with 400)
    print("\n1g. PUT /api/admin/credentials (with too-short password - should fail)")
    try:
        payload = {
            "currentPassword": "newer123",
            "newPassword": "abc"
        }
        resp = requests.put(f"{BASE_URL}/admin/credentials", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("PUT with too-short password", 
                   resp.status_code == 400 and 'كلمة المرور يجب أن لا تقل عن 6 أحرف' in data.get('error', ''),
                   f"Status: {resp.status_code}, Error: {data.get('error', '')}")
    except Exception as e:
        print_test("PUT with too-short password", False, str(e))
    
    # 1h. POST /api/admin/login (with matching credentials)
    print("\n1h. POST /api/admin/login (with matching credentials)")
    try:
        payload = {
            "username": "ghazlan_admin",
            "password": "newer123"
        }
        resp = requests.post(f"{BASE_URL}/admin/login", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("POST /api/admin/login (valid credentials)", 
                   resp.status_code == 200 and data.get('success') == True and data.get('username') == 'ghazlan_admin',
                   f"success={data.get('success')}, username={data.get('username')}")
    except Exception as e:
        print_test("POST /api/admin/login (valid credentials)", False, str(e))
    
    # 1i. POST /api/admin/login (with wrong password)
    print("\n1i. POST /api/admin/login (with wrong password - should fail)")
    try:
        payload = {
            "username": "ghazlan_admin",
            "password": "wrongpass"
        }
        resp = requests.post(f"{BASE_URL}/admin/login", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("POST /api/admin/login (wrong password)", 
                   resp.status_code == 401 and 'بيانات الدخول غير صحيحة' in data.get('error', ''),
                   f"Status: {resp.status_code}, Error: {data.get('error', '')}")
    except Exception as e:
        print_test("POST /api/admin/login (wrong password)", False, str(e))
    
    # 1j. POST /api/admin/login (with wrong username)
    print("\n1j. POST /api/admin/login (with wrong username - should fail)")
    try:
        payload = {
            "username": "wronguser",
            "password": "newer123"
        }
        resp = requests.post(f"{BASE_URL}/admin/login", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("POST /api/admin/login (wrong username)", 
                   resp.status_code == 401 and 'بيانات الدخول غير صحيحة' in data.get('error', ''),
                   f"Status: {resp.status_code}, Error: {data.get('error', '')}")
    except Exception as e:
        print_test("POST /api/admin/login (wrong username)", False, str(e))
    
    # Return the last known password for cleanup
    return "newer123"

def test_subscribers_search():
    """Test Subscribers Search Endpoint"""
    print("\n" + "="*80)
    print("TEST 2: SUBSCRIBERS SEARCH ENDPOINT")
    print("="*80)
    
    # 2a. GET /api/subscribers/search?q= (empty query)
    print("\n2a. GET /api/subscribers/search?q= (empty query)")
    try:
        resp = requests.get(f"{BASE_URL}/subscribers/search?q=")
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)[:200]}")
        print_test("GET /api/subscribers/search (empty query)", 
                   resp.status_code == 200 and isinstance(data, list) and len(data) == 0,
                   f"Returned {len(data)} results (expected 0)")
    except Exception as e:
        print_test("GET /api/subscribers/search (empty query)", False, str(e))
    
    # 2b. GET /api/subscribers/search?q=ا (single Arabic letter)
    print("\n2b. GET /api/subscribers/search?q=ا (single Arabic letter)")
    try:
        resp = requests.get(f"{BASE_URL}/subscribers/search?q=ا")
        data = resp.json()
        print(f"Response: Found {len(data)} subscribers")
        if len(data) > 0:
            print(f"First result: {json.dumps(data[0], ensure_ascii=False)}")
            # Verify structure
            first = data[0]
            has_required_fields = all(k in first for k in ['id', 'name', 'phone', 'username', 'zoneName', 'ipAddress', 'address', 'userLat', 'userLng', 'status'])
            has_no_mongo_id = '_id' not in first
            print_test("GET /api/subscribers/search (Arabic letter)", 
                       resp.status_code == 200 and len(data) <= 20 and has_required_fields and has_no_mongo_id,
                       f"Found {len(data)} results, has all required fields, no _id field")
        else:
            print_test("GET /api/subscribers/search (Arabic letter)", 
                       resp.status_code == 200,
                       "No subscribers found (DB might be empty)")
    except Exception as e:
        print_test("GET /api/subscribers/search (Arabic letter)", False, str(e))
    
    # 2c. GET /api/subscribers/search?q=07 (phone number prefix)
    print("\n2c. GET /api/subscribers/search?q=07 (phone number prefix)")
    try:
        resp = requests.get(f"{BASE_URL}/subscribers/search?q=07")
        data = resp.json()
        print(f"Response: Found {len(data)} subscribers")
        if len(data) > 0:
            print(f"First result: {json.dumps(data[0], ensure_ascii=False)}")
            print_test("GET /api/subscribers/search (phone prefix)", 
                       resp.status_code == 200 and len(data) <= 20,
                       f"Found {len(data)} results matching phone prefix '07'")
        else:
            print_test("GET /api/subscribers/search (phone prefix)", 
                       resp.status_code == 200,
                       "No subscribers found with phone prefix '07'")
    except Exception as e:
        print_test("GET /api/subscribers/search (phone prefix)", False, str(e))

def test_payroll_entries_crud():
    """Test Payroll Entries Edit/Delete"""
    print("\n" + "="*80)
    print("TEST 3: PAYROLL ENTRIES EDIT/DELETE")
    print("="*80)
    
    # Get an employee to use for testing
    print("\n3a. Get an employee for testing")
    try:
        resp = requests.get(f"{BASE_URL}/employees")
        employees = resp.json()
        if len(employees) == 0:
            print_test("Get employees", False, "No employees found in DB")
            return
        employee = employees[0]
        employee_id = employee['id']
        employee_name = employee['name']
        print_test("Get employees", True, f"Using employee: {employee_name} (id: {employee_id})")
    except Exception as e:
        print_test("Get employees", False, str(e))
        return
    
    # 3b. Get existing payroll entries
    print("\n3b. GET /api/payroll-entries (before creating test entry)")
    try:
        resp = requests.get(f"{BASE_URL}/payroll-entries")
        entries_before = resp.json()
        print(f"Response: Found {len(entries_before)} existing payroll entries")
        print_test("GET /api/payroll-entries", resp.status_code == 200, f"Found {len(entries_before)} entries")
    except Exception as e:
        print_test("GET /api/payroll-entries", False, str(e))
        return
    
    # 3c. POST /api/payroll-entries (create test entry)
    print("\n3c. POST /api/payroll-entries (create test deduction)")
    try:
        payload = {
            "employeeId": employee_id,
            "employeeName": employee_name,
            "type": "deduction",
            "amount": 25000,
            "reason": "خصم تجريبي",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "auto": False
        }
        resp = requests.post(f"{BASE_URL}/payroll-entries", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        entry_id = data.get('id')
        print_test("POST /api/payroll-entries", 
                   resp.status_code == 201 and entry_id is not None,
                   f"Created entry with id: {entry_id}")
    except Exception as e:
        print_test("POST /api/payroll-entries", False, str(e))
        return
    
    # 3d. PUT /api/payroll-entries/:id (update entry)
    print("\n3d. PUT /api/payroll-entries/:id (update entry)")
    try:
        payload = {
            "amount": 30000,
            "reason": "خصم معدّل"
        }
        resp = requests.put(f"{BASE_URL}/payroll-entries/{entry_id}", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("PUT /api/payroll-entries/:id", 
                   resp.status_code == 200 and data.get('amount') == 30000 and data.get('reason') == 'خصم معدّل',
                   f"Updated amount to {data.get('amount')}, reason to '{data.get('reason')}'")
    except Exception as e:
        print_test("PUT /api/payroll-entries/:id", False, str(e))
    
    # 3e. GET /api/payroll-entries (verify update)
    print("\n3e. GET /api/payroll-entries (verify update)")
    try:
        resp = requests.get(f"{BASE_URL}/payroll-entries")
        entries = resp.json()
        updated_entry = next((e for e in entries if e['id'] == entry_id), None)
        if updated_entry:
            print(f"Updated entry: {json.dumps(updated_entry, ensure_ascii=False)}")
            print_test("GET /api/payroll-entries (verify update)", 
                       updated_entry['amount'] == 30000 and updated_entry['reason'] == 'خصم معدّل',
                       "Entry updated correctly")
        else:
            print_test("GET /api/payroll-entries (verify update)", False, "Entry not found")
    except Exception as e:
        print_test("GET /api/payroll-entries (verify update)", False, str(e))
    
    # 3f. DELETE /api/payroll-entries/:id
    print("\n3f. DELETE /api/payroll-entries/:id")
    try:
        resp = requests.delete(f"{BASE_URL}/payroll-entries/{entry_id}")
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("DELETE /api/payroll-entries/:id", 
                   resp.status_code == 200 and data.get('success') == True,
                   "Entry deleted successfully")
    except Exception as e:
        print_test("DELETE /api/payroll-entries/:id", False, str(e))
    
    # 3g. GET /api/payroll-entries (verify deletion)
    print("\n3g. GET /api/payroll-entries (verify deletion)")
    try:
        resp = requests.get(f"{BASE_URL}/payroll-entries")
        entries_after = resp.json()
        deleted_entry = next((e for e in entries_after if e['id'] == entry_id), None)
        print_test("GET /api/payroll-entries (verify deletion)", 
                   deleted_entry is None,
                   f"Entry no longer exists. Total entries: {len(entries_after)}")
    except Exception as e:
        print_test("GET /api/payroll-entries (verify deletion)", False, str(e))

def test_tasks_subscriber_repair():
    """Test Tasks with Subscriber Repair Type"""
    print("\n" + "="*80)
    print("TEST 4: TASKS WITH SUBSCRIBER REPAIR TYPE")
    print("="*80)
    
    # Get an employee and subscriber for testing
    print("\n4a. Get employee and subscriber for testing")
    try:
        resp = requests.get(f"{BASE_URL}/employees")
        employees = resp.json()
        if len(employees) == 0:
            print_test("Get employees", False, "No employees found")
            return
        employee = employees[0]
        employee_id = employee['id']
        
        resp = requests.get(f"{BASE_URL}/subscribers")
        subscribers = resp.json()
        if len(subscribers) == 0:
            print_test("Get subscribers", False, "No subscribers found")
            return
        subscriber = subscribers[0]
        subscriber_id = subscriber['id']
        
        print_test("Get test data", True, 
                   f"Using employee: {employee['name']}, subscriber: {subscriber['name']}")
    except Exception as e:
        print_test("Get test data", False, str(e))
        return
    
    # 4b. POST /api/tasks (create task with subscriber_repair type)
    print("\n4b. POST /api/tasks (create subscriber_repair task)")
    try:
        payload = {
            "title": "صيانة - أحمد",
            "description": "اختبار مهمة صيانة مشترك",
            "priority": "high",
            "assignedTo": employee_id,
            "assignedToName": employee['name'],
            "dueDate": datetime.now().strftime("%Y-%m-%d"),
            "taskType": "subscriber_repair",
            "subscriberId": subscriber_id,
            "subscriberName": subscriber.get('name', 'أحمد'),
            "subscriberPhone": subscriber.get('phone', '07900000000'),
            "subscriberAddress": subscriber.get('address', 'زون 1'),
            "subscriberLat": subscriber.get('userLat', 33.31),
            "subscriberLng": subscriber.get('userLng', 44.40),
            "faultDescription": "انقطاع في الخدمة"
        }
        resp = requests.post(f"{BASE_URL}/tasks", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        task_id = data.get('id')
        
        # Verify all subscriber fields are present
        has_all_fields = all(k in data for k in ['taskType', 'subscriberId', 'subscriberName', 'subscriberPhone', 'subscriberAddress', 'subscriberLat', 'subscriberLng', 'faultDescription'])
        print_test("POST /api/tasks (subscriber_repair)", 
                   resp.status_code == 201 and task_id is not None and has_all_fields,
                   f"Created task with id: {task_id}, all subscriber fields present")
    except Exception as e:
        print_test("POST /api/tasks (subscriber_repair)", False, str(e))
        return
    
    # 4c. GET /api/tasks (verify task appears with all fields)
    print("\n4c. GET /api/tasks (verify task with all custom fields)")
    try:
        resp = requests.get(f"{BASE_URL}/tasks")
        tasks = resp.json()
        created_task = next((t for t in tasks if t['id'] == task_id), None)
        if created_task:
            print(f"Created task: {json.dumps(created_task, ensure_ascii=False)}")
            has_all_fields = all(k in created_task for k in ['taskType', 'subscriberId', 'subscriberName', 'subscriberPhone', 'subscriberAddress', 'subscriberLat', 'subscriberLng', 'faultDescription'])
            print_test("GET /api/tasks (verify custom fields)", 
                       has_all_fields and created_task['taskType'] == 'subscriber_repair',
                       "All subscriber fields preserved correctly")
        else:
            print_test("GET /api/tasks (verify custom fields)", False, "Task not found")
    except Exception as e:
        print_test("GET /api/tasks (verify custom fields)", False, str(e))
    
    # 4d. DELETE test task (cleanup)
    print("\n4d. DELETE /api/tasks/:id (cleanup)")
    try:
        resp = requests.delete(f"{BASE_URL}/tasks/{task_id}")
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("DELETE /api/tasks/:id (cleanup)", 
                   resp.status_code == 200 and data.get('success') == True,
                   "Test task deleted successfully")
    except Exception as e:
        print_test("DELETE /api/tasks/:id (cleanup)", False, str(e))

def cleanup_admin_credentials(last_password):
    """Reset admin credentials back to default"""
    print("\n" + "="*80)
    print("CLEANUP: RESET ADMIN CREDENTIALS")
    print("="*80)
    
    try:
        payload = {
            "currentPassword": last_password,
            "newUsername": "admin"
        }
        resp = requests.put(f"{BASE_URL}/admin/credentials", json=payload)
        data = resp.json()
        print(f"Response: {json.dumps(data, ensure_ascii=False)}")
        print_test("Reset admin credentials", 
                   resp.status_code == 200 and data.get('success') == True,
                   "Admin credentials reset to username='admin'")
    except Exception as e:
        print_test("Reset admin credentials", False, str(e))

def main():
    print("\n" + "="*80)
    print("BACKEND API TESTING - NEW ENDPOINTS")
    print("Testing: Admin Credentials, Subscribers Search, Payroll Entries, Tasks")
    print("="*80)
    
    # Test 1: Admin Credentials Management
    last_password = test_admin_credentials()
    
    # Test 2: Subscribers Search
    test_subscribers_search()
    
    # Test 3: Payroll Entries CRUD
    test_payroll_entries_crud()
    
    # Test 4: Tasks with Subscriber Repair Type
    test_tasks_subscriber_repair()
    
    # Cleanup: Reset admin credentials
    if last_password:
        cleanup_admin_credentials(last_password)
    
    print("\n" + "="*80)
    print("ALL TESTS COMPLETED")
    print("="*80)

if __name__ == "__main__":
    main()
