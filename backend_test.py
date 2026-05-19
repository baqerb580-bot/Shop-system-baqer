#!/usr/bin/env python3
"""
Backend API Test Suite for HR/Employee Management System
Tests 10 NEW endpoints for attendance, tasks, payroll, and HR reports
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def print_test(name, passed, details=""):
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"\n{status}: {name}")
    if details:
        print(f"  Details: {details}")

def test_hr_employee_management():
    print("\n" + "="*80)
    print("HR / EMPLOYEE MANAGEMENT BACKEND TESTING")
    print("="*80)
    
    # Step 0: Get employees and tasks first
    print("\n[SETUP] Getting employees and tasks from database...")
    try:
        resp = requests.get(f"{BASE_URL}/employees", timeout=10)
        employees = resp.json()
        print(f"  Found {len(employees)} employees")
        
        resp = requests.get(f"{BASE_URL}/tasks", timeout=10)
        tasks = resp.json()
        print(f"  Found {len(tasks)} tasks")
        
        if len(employees) == 0:
            print("❌ CRITICAL: No employees found in database!")
            return
        if len(tasks) == 0:
            print("⚠️  WARNING: No tasks found in database")
    except Exception as e:
        print(f"❌ SETUP FAILED: {e}")
        return
    
    # Find employee with username 'emp1' or use first employee
    test_employee = None
    for emp in employees:
        if emp.get('username') == 'emp1':
            test_employee = emp
            break
    
    if not test_employee:
        # Try other common usernames from seeded data
        for username in ['karar', 'haidar', 'ali', 'zahra', 'mustafa']:
            for emp in employees:
                if emp.get('username') == username:
                    test_employee = emp
                    break
            if test_employee:
                break
    
    if not test_employee:
        test_employee = employees[0]
    
    print(f"  Using test employee: {test_employee.get('name')} (username: {test_employee.get('username')})")
    
    employee_id = test_employee['id']
    employee_username = test_employee.get('username', 'emp1')
    employee_password = test_employee.get('password', 'pass123')
    
    # ============================================================================
    # TEST 1: POST /api/employees/login - Valid credentials
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 1: Employee Login - Valid Credentials")
    print("-"*80)
    try:
        # First try emp1/pass123 as mentioned in review request
        resp = requests.post(f"{BASE_URL}/employees/login", 
                            json={"username": "emp1", "password": "pass123"},
                            timeout=10)
        
        if resp.status_code == 401:
            # Try with the actual employee credentials
            print(f"  emp1/pass123 not found, trying {employee_username}/{employee_password}")
            resp = requests.post(f"{BASE_URL}/employees/login", 
                                json={"username": employee_username, "password": employee_password},
                                timeout=10)
        
        data = resp.json()
        
        if resp.status_code == 200 and data.get('success') and 'employee' in data and 'token' in data:
            token = data['token']
            employee = data['employee']
            print_test("Employee Login - Valid", True, 
                      f"Logged in as {employee.get('name')}, token: {token[:20]}...")
            
            # Update employee_id if we used emp1
            if employee.get('username') == 'emp1':
                employee_id = employee['id']
                test_employee = employee
        else:
            print_test("Employee Login - Valid", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("Employee Login - Valid", False, str(e))
    
    # ============================================================================
    # TEST 2: POST /api/employees/login - Invalid credentials
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 2: Employee Login - Invalid Credentials")
    print("-"*80)
    try:
        resp = requests.post(f"{BASE_URL}/employees/login", 
                            json={"username": "wronguser", "password": "wrongpass"},
                            timeout=10)
        
        if resp.status_code == 401:
            print_test("Employee Login - Invalid", True, 
                      "Correctly returned 401 Unauthorized")
        else:
            print_test("Employee Login - Invalid", False, 
                      f"Expected 401, got {resp.status_code}")
    except Exception as e:
        print_test("Employee Login - Invalid", False, str(e))
    
    # ============================================================================
    # TEST 3: POST /api/attendance/checkin - First check-in
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 3: Attendance Check-in - First Time")
    print("-"*80)
    try:
        # First, delete any existing attendance for today to ensure clean test
        today = datetime.now().strftime('%Y-%m-%d')
        resp_att = requests.get(f"{BASE_URL}/attendance/today", timeout=10)
        if resp_att.status_code == 200:
            today_records = resp_att.json()
            for record in today_records:
                if record.get('employeeId') == employee_id:
                    print(f"  Cleaning up existing attendance record for today...")
                    # Note: No DELETE endpoint for attendance, so we'll work with existing
        
        resp = requests.post(f"{BASE_URL}/attendance/checkin", 
                            json={"employeeId": employee_id},
                            timeout=10)
        data = resp.json()
        
        if resp.status_code == 200 and data.get('success') and 'record' in data:
            record = data['record']
            print_test("Attendance Check-in", True, 
                      f"Check-in at {record.get('checkIn')}, Late: {record.get('isLate')}, "
                      f"Late Minutes: {record.get('lateMinutes')}, Status: {record.get('status')}, "
                      f"Auto Deduction: {record.get('autoDeduction')}")
            
            # Check if late and auto-deduction was created
            if record.get('isLate'):
                print(f"  ⚠️  Employee was late by {record.get('lateMinutes')} minutes")
                print(f"  💰 Auto deduction: {record.get('autoDeduction')} IQD")
        elif resp.status_code == 400 and 'مسبقاً' in data.get('error', ''):
            print_test("Attendance Check-in", True, 
                      "Already checked in today (expected if running multiple times)")
        else:
            print_test("Attendance Check-in", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("Attendance Check-in", False, str(e))
    
    # ============================================================================
    # TEST 4: POST /api/attendance/checkin - Duplicate (should fail)
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 4: Attendance Check-in - Duplicate (Should Fail)")
    print("-"*80)
    try:
        resp = requests.post(f"{BASE_URL}/attendance/checkin", 
                            json={"employeeId": employee_id},
                            timeout=10)
        data = resp.json()
        
        if resp.status_code == 400 and 'مسبقاً' in data.get('error', ''):
            print_test("Duplicate Check-in Prevention", True, 
                      f"Correctly rejected: {data.get('error')}")
        else:
            print_test("Duplicate Check-in Prevention", False, 
                      f"Expected 400 with Arabic error, got {resp.status_code}: {data}")
    except Exception as e:
        print_test("Duplicate Check-in Prevention", False, str(e))
    
    # ============================================================================
    # TEST 5: GET /api/attendance/today
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 5: Get Today's Attendance")
    print("-"*80)
    try:
        resp = requests.get(f"{BASE_URL}/attendance/today", timeout=10)
        data = resp.json()
        
        if resp.status_code == 200 and isinstance(data, list):
            print_test("Get Today's Attendance", True, 
                      f"Found {len(data)} attendance records for today")
            
            # Find our employee's record
            our_record = None
            for record in data:
                if record.get('employeeId') == employee_id:
                    our_record = record
                    print(f"  Our employee: {record.get('employeeName')}, Status: {record.get('status')}, "
                          f"Check-in: {record.get('checkIn')}, Check-out: {record.get('checkOut')}")
                    break
        else:
            print_test("Get Today's Attendance", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("Get Today's Attendance", False, str(e))
    
    # ============================================================================
    # TEST 6: POST /api/attendance/checkout
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 6: Attendance Check-out")
    print("-"*80)
    try:
        resp = requests.post(f"{BASE_URL}/attendance/checkout", 
                            json={"employeeId": employee_id},
                            timeout=10)
        data = resp.json()
        
        if resp.status_code == 200 and data.get('success') and 'hoursWorked' in data:
            print_test("Attendance Check-out", True, 
                      f"Hours worked: {data.get('hoursWorked')}")
        elif resp.status_code == 400 and 'مسبقاً' in data.get('error', ''):
            print_test("Attendance Check-out", True, 
                      "Already checked out (expected if running multiple times)")
        else:
            print_test("Attendance Check-out", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("Attendance Check-out", False, str(e))
    
    # ============================================================================
    # TEST 7: POST /api/attendance/checkout - Duplicate (should fail)
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 7: Attendance Check-out - Duplicate (Should Fail)")
    print("-"*80)
    try:
        resp = requests.post(f"{BASE_URL}/attendance/checkout", 
                            json={"employeeId": employee_id},
                            timeout=10)
        data = resp.json()
        
        if resp.status_code == 400 and 'مسبقاً' in data.get('error', ''):
            print_test("Duplicate Check-out Prevention", True, 
                      f"Correctly rejected: {data.get('error')}")
        else:
            print_test("Duplicate Check-out Prevention", False, 
                      f"Expected 400 with Arabic error, got {resp.status_code}: {data}")
    except Exception as e:
        print_test("Duplicate Check-out Prevention", False, str(e))
    
    # ============================================================================
    # TEST 8: GET /api/employees/:id/attendance
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 8: Get Employee's Attendance History")
    print("-"*80)
    try:
        resp = requests.get(f"{BASE_URL}/employees/{employee_id}/attendance", timeout=10)
        data = resp.json()
        
        if resp.status_code == 200 and isinstance(data, list):
            print_test("Get Employee Attendance History", True, 
                      f"Found {len(data)} attendance records")
            
            if len(data) > 0:
                latest = data[0]
                print(f"  Latest: Date: {latest.get('date')}, Status: {latest.get('status')}, "
                      f"Hours: {latest.get('hoursWorked')}")
        else:
            print_test("Get Employee Attendance History", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("Get Employee Attendance History", False, str(e))
    
    # ============================================================================
    # TEST 9: GET /api/employees/:id/tasks
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 9: Get Employee's Tasks")
    print("-"*80)
    try:
        resp = requests.get(f"{BASE_URL}/employees/{employee_id}/tasks", timeout=10)
        data = resp.json()
        
        if resp.status_code == 200 and isinstance(data, list):
            print_test("Get Employee Tasks", True, 
                      f"Found {len(data)} tasks assigned to employee")
            
            if len(data) > 0:
                task = data[0]
                print(f"  Task: {task.get('title')}, Status: {task.get('status')}, "
                      f"Progress: {task.get('progress')}%, Priority: {task.get('priority')}")
        else:
            print_test("Get Employee Tasks", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("Get Employee Tasks", False, str(e))
    
    # ============================================================================
    # TEST 10: POST /api/tasks/:id/update
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 10: Update Task")
    print("-"*80)
    try:
        if len(tasks) > 0:
            task_id = tasks[0]['id']
            update_data = {
                "status": "in_progress",
                "progress": 75,
                "notes": "تم إنجاز 75% من المهمة - اختبار تلقائي",
                "attachments": ["test_file.pdf"]
            }
            
            resp = requests.post(f"{BASE_URL}/tasks/{task_id}/update", 
                                json=update_data,
                                timeout=10)
            data = resp.json()
            
            if resp.status_code == 200 and data.get('id') == task_id:
                print_test("Update Task", True, 
                          f"Updated task: Status={data.get('status')}, Progress={data.get('progress')}%, "
                          f"Notes={data.get('notes')[:50]}...")
            else:
                print_test("Update Task", False, 
                          f"Status: {resp.status_code}, Response: {data}")
        else:
            print_test("Update Task", False, "No tasks available to update")
    except Exception as e:
        print_test("Update Task", False, str(e))
    
    # ============================================================================
    # TEST 11: GET /api/employees/:id/payroll?month=YYYY-MM
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 11: Get Employee Payroll")
    print("-"*80)
    try:
        current_month = datetime.now().strftime('%Y-%m')
        resp = requests.get(f"{BASE_URL}/employees/{employee_id}/payroll?month={current_month}", 
                           timeout=10)
        data = resp.json()
        
        if resp.status_code == 200 and 'employee' in data and 'finalSalary' in data:
            print_test("Get Employee Payroll", True, 
                      f"Month: {data.get('month')}, Base Salary: {data.get('baseSalary')}, "
                      f"Bonuses: {data.get('bonuses')}, Deductions: {data.get('deductions')}, "
                      f"Final Salary: {data.get('finalSalary')}")
            print(f"  Attendance: Present={data.get('presentDays')}, Late={data.get('lateDays')}, "
                  f"Absent={data.get('absentDays')}, Total={data.get('totalDays')}")
            print(f"  Payroll Entries: {len(data.get('entries', []))}")
        else:
            print_test("Get Employee Payroll", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("Get Employee Payroll", False, str(e))
    
    # ============================================================================
    # TEST 12: GET /api/hr/reports?month=YYYY-MM
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 12: Get HR Reports")
    print("-"*80)
    try:
        current_month = datetime.now().strftime('%Y-%m')
        resp = requests.get(f"{BASE_URL}/hr/reports?month={current_month}", timeout=10)
        data = resp.json()
        
        if resp.status_code == 200 and 'employeeStats' in data:
            print_test("Get HR Reports", True, 
                      f"Month: {data.get('month')}, Total Employees: {data.get('totalEmployees')}, "
                      f"Total Salaries: {data.get('totalSalaries')}, "
                      f"Total Bonuses: {data.get('totalBonuses')}, "
                      f"Total Deductions: {data.get('totalDeductions')}")
            print(f"  Tasks: Total={data.get('totalTasks')}, Completed={data.get('completedTasks')}")
            print(f"  Employee Stats: {len(data.get('employeeStats', []))} employees")
            
            if len(data.get('topPerformers', [])) > 0:
                top = data['topPerformers'][0]
                print(f"  Top Performer: {top.get('name')} (KPI: {top.get('kpi')})")
        else:
            print_test("Get HR Reports", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("Get HR Reports", False, str(e))
    
    # ============================================================================
    # TEST 13: Payroll Entries CRUD
    # ============================================================================
    print("\n" + "-"*80)
    print("TEST 13: Payroll Entries CRUD")
    print("-"*80)
    
    # GET all payroll entries
    try:
        resp = requests.get(f"{BASE_URL}/payroll-entries", timeout=10)
        data = resp.json()
        
        if resp.status_code == 200 and isinstance(data, list):
            print_test("GET Payroll Entries", True, f"Found {len(data)} payroll entries")
        else:
            print_test("GET Payroll Entries", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("GET Payroll Entries", False, str(e))
    
    # POST - Create manual bonus entry
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        bonus_entry = {
            "employeeId": employee_id,
            "employeeName": test_employee.get('name'),
            "type": "bonus",
            "amount": 50000,
            "reason": "مكافأة أداء متميز - اختبار تلقائي",
            "auto": False,
            "date": today
        }
        
        resp = requests.post(f"{BASE_URL}/payroll-entries", 
                            json=bonus_entry,
                            timeout=10)
        data = resp.json()
        
        if resp.status_code == 201 and data.get('id'):
            created_entry_id = data['id']
            print_test("POST Payroll Entry (Bonus)", True, 
                      f"Created bonus entry: {data.get('amount')} IQD, Reason: {data.get('reason')}")
        else:
            print_test("POST Payroll Entry (Bonus)", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("POST Payroll Entry (Bonus)", False, str(e))
    
    # POST - Create manual deduction entry
    try:
        deduction_entry = {
            "employeeId": employee_id,
            "employeeName": test_employee.get('name'),
            "type": "deduction",
            "amount": 10000,
            "reason": "خصم يدوي - اختبار تلقائي",
            "auto": False,
            "date": today
        }
        
        resp = requests.post(f"{BASE_URL}/payroll-entries", 
                            json=deduction_entry,
                            timeout=10)
        data = resp.json()
        
        if resp.status_code == 201 and data.get('id'):
            print_test("POST Payroll Entry (Deduction)", True, 
                      f"Created deduction entry: {data.get('amount')} IQD, Reason: {data.get('reason')}")
        else:
            print_test("POST Payroll Entry (Deduction)", False, 
                      f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        print_test("POST Payroll Entry (Deduction)", False, str(e))
    
    print("\n" + "="*80)
    print("HR / EMPLOYEE MANAGEMENT TESTING COMPLETE")
    print("="*80)

if __name__ == "__main__":
    test_hr_employee_management()
