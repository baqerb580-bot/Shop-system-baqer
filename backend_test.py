#!/usr/bin/env python3
"""
Backend API Testing Script for HR Features
Tests: Attendance with photo, Leaves, Advances, Notifications, Telegram, Payroll
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def log(msg, level="INFO"):
    """Print formatted log message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {msg}")

def test_api(method, endpoint, data=None, expected_status=200, description=""):
    """Generic API test helper"""
    url = f"{BASE_URL}/{endpoint}"
    log(f"Testing: {description or endpoint}")
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, timeout=10)
        else:
            log(f"Unknown method: {method}", "ERROR")
            return None
        
        status_ok = response.status_code == expected_status
        status_indicator = "✅" if status_ok else "❌"
        
        log(f"{status_indicator} Status: {response.status_code} (expected {expected_status})", 
            "PASS" if status_ok else "FAIL")
        
        try:
            result = response.json()
            if not status_ok:
                log(f"Response: {json.dumps(result, ensure_ascii=False)[:200]}", "DEBUG")
            return result
        except:
            log(f"Response text: {response.text[:200]}", "DEBUG")
            return {"status_code": response.status_code, "text": response.text}
            
    except Exception as e:
        log(f"❌ Exception: {str(e)}", "ERROR")
        return None

def main():
    log("=" * 80)
    log("STARTING HR FEATURES BACKEND TESTING")
    log("=" * 80)
    
    # Step 1: Get employee credentials (ssaa/ssaa)
    log("\n### STEP 1: Employee Login ###")
    login_result = test_api("POST", "employees/login", 
                           {"username": "ssaa", "password": "ssaa"},
                           expected_status=200,
                           description="Login with ssaa/ssaa")
    
    if not login_result or not login_result.get("success"):
        log("❌ CRITICAL: Cannot login with ssaa/ssaa. Checking if employee exists...", "ERROR")
        
        # Try to get all employees to see what's available
        employees = test_api("GET", "employees", description="Get all employees")
        if employees:
            log(f"Found {len(employees)} employees in DB", "INFO")
            # Try to find ssaa or create one
            ssaa_emp = None
            for emp in employees:
                if emp.get("username") == "ssaa":
                    ssaa_emp = emp
                    break
            
            if not ssaa_emp:
                log("Employee 'ssaa' not found. Creating one...", "INFO")
                create_result = test_api("POST", "employees",
                                       {"username": "ssaa", "password": "ssaa", 
                                        "name": "موظف الاختبار", "role": "موظف",
                                        "salary": 500000, "kpi": 80},
                                       expected_status=201,
                                       description="Create ssaa employee")
                if create_result:
                    employee_id = create_result.get("id")
                    log(f"✅ Created employee with ID: {employee_id}", "PASS")
                else:
                    log("❌ Failed to create employee", "ERROR")
                    return
            else:
                employee_id = ssaa_emp.get("id")
                log(f"✅ Found existing ssaa employee with ID: {employee_id}", "PASS")
        else:
            log("❌ Cannot retrieve employees list", "ERROR")
            return
    else:
        employee_id = login_result.get("employee", {}).get("id")
        log(f"✅ Login successful. Employee ID: {employee_id}", "PASS")
    
    # Step 2: Test Attendance with Mandatory Photo
    log("\n### STEP 2: ATTENDANCE WITH MANDATORY PHOTO (CRITICAL) ###")
    
    # Test 2.1: Check-in WITHOUT photoUrl (should fail with 400)
    log("\n--- Test 2.1: Check-in without photoUrl (expect 400) ---")
    checkin_no_photo = test_api("POST", "attendance/checkin",
                               {"employeeId": employee_id},
                               expected_status=400,
                               description="Check-in WITHOUT photoUrl")
    
    if checkin_no_photo and "error" in checkin_no_photo:
        error_msg = checkin_no_photo.get("error", "")
        if "صورة الحضور إلزامية" in error_msg or "صورة" in error_msg:
            log(f"✅ PASS: Got expected Arabic error: '{error_msg}'", "PASS")
        else:
            log(f"⚠️ WARNING: Got error but not the expected Arabic message: '{error_msg}'", "WARN")
    else:
        log("❌ FAIL: Expected 400 error with Arabic message", "FAIL")
    
    # Test 2.2: Check-in WITH photoUrl (should succeed or duplicate error)
    log("\n--- Test 2.2: Check-in with photoUrl ---")
    checkin_with_photo = test_api("POST", "attendance/checkin",
                                 {"employeeId": employee_id, "photoUrl": "/uploads/test.jpg"},
                                 expected_status=[200, 400],  # 200 success or 400 duplicate
                                 description="Check-in WITH photoUrl")
    
    if checkin_with_photo:
        if checkin_with_photo.get("success"):
            log("✅ PASS: Check-in successful", "PASS")
            record = checkin_with_photo.get("record", {})
            if record.get("checkInPhoto") == "/uploads/test.jpg":
                log(f"✅ PASS: checkInPhoto saved correctly: {record.get('checkInPhoto')}", "PASS")
            else:
                log(f"❌ FAIL: checkInPhoto not saved correctly", "FAIL")
        elif "تم تسجيل الحضور مسبقاً اليوم" in checkin_with_photo.get("error", ""):
            log("✅ PASS: Got expected duplicate check-in error (employee already checked in today)", "PASS")
        else:
            log(f"⚠️ Unexpected response: {checkin_with_photo}", "WARN")
    
    # Test 2.3: Check-out WITHOUT photoUrl (should fail with 400)
    log("\n--- Test 2.3: Check-out without photoUrl (expect 400) ---")
    checkout_no_photo = test_api("POST", "attendance/checkout",
                                {"employeeId": employee_id},
                                expected_status=400,
                                description="Check-out WITHOUT photoUrl")
    
    if checkout_no_photo and "error" in checkout_no_photo:
        error_msg = checkout_no_photo.get("error", "")
        if "صورة الانصراف إلزامية" in error_msg or "صورة" in error_msg:
            log(f"✅ PASS: Got expected Arabic error: '{error_msg}'", "PASS")
        else:
            log(f"⚠️ WARNING: Got error but not the expected Arabic message: '{error_msg}'", "WARN")
    else:
        log("❌ FAIL: Expected 400 error with Arabic message", "FAIL")
    
    # Test 2.4: Check-out WITH photoUrl
    log("\n--- Test 2.4: Check-out with photoUrl ---")
    checkout_with_photo = test_api("POST", "attendance/checkout",
                                  {"employeeId": employee_id, "photoUrl": "/uploads/test_checkout.jpg"},
                                  expected_status=[200, 400],
                                  description="Check-out WITH photoUrl")
    
    if checkout_with_photo:
        if checkout_with_photo.get("success"):
            log("✅ PASS: Check-out successful", "PASS")
        elif "تم تسجيل الانصراف مسبقاً" in checkout_with_photo.get("error", ""):
            log("✅ PASS: Got expected duplicate check-out error", "PASS")
        elif "لم تسجل حضور اليوم" in checkout_with_photo.get("error", ""):
            log("⚠️ INFO: Cannot check-out without check-in (expected if check-in failed)", "INFO")
    
    # Step 3: Test Leaves System
    log("\n### STEP 3: LEAVES SYSTEM ###")
    
    # Test 3.1: Get all leaves
    log("\n--- Test 3.1: GET /api/leaves ---")
    leaves_list = test_api("GET", "leaves", description="Get all leaves")
    if leaves_list is not None:
        log(f"✅ PASS: Retrieved {len(leaves_list)} leaves", "PASS")
    
    # Test 3.2: Create leave request
    log("\n--- Test 3.2: POST /api/leaves (create leave request) ---")
    leave_data = {
        "employeeId": employee_id,
        "type": "annual",
        "reason": "إجازة سنوية",
        "startDate": "2026-06-01",
        "endDate": "2026-06-05",
        "days": 5
    }
    leave_created = test_api("POST", "leaves", leave_data,
                            expected_status=201,
                            description="Create leave request")
    
    leave_id = None
    if leave_created and leave_created.get("id"):
        leave_id = leave_created.get("id")
        log(f"✅ PASS: Leave created with ID: {leave_id}, status: {leave_created.get('status')}", "PASS")
        if leave_created.get("status") == "pending":
            log("✅ PASS: Leave status is 'pending' as expected", "PASS")
    else:
        log("❌ FAIL: Failed to create leave", "FAIL")
    
    # Test 3.3: Get leaves filtered by employeeId
    log("\n--- Test 3.3: GET /api/leaves?employeeId=X ---")
    emp_leaves = test_api("GET", f"leaves?employeeId={employee_id}",
                         description="Get leaves for employee")
    if emp_leaves is not None:
        log(f"✅ PASS: Retrieved {len(emp_leaves)} leaves for employee", "PASS")
        if leave_id and any(l.get("id") == leave_id for l in emp_leaves):
            log("✅ PASS: Created leave appears in employee's leaves list", "PASS")
    
    # Test 3.4: Get leave balance
    log("\n--- Test 3.4: GET /api/employees/:id/leave-balance ---")
    leave_balance = test_api("GET", f"employees/{employee_id}/leave-balance",
                            description="Get leave balance")
    if leave_balance:
        log(f"✅ PASS: Leave balance retrieved", "PASS")
        log(f"  Year: {leave_balance.get('year')}", "INFO")
        log(f"  Allowance: {leave_balance.get('allowance')}", "INFO")
        log(f"  Used: {leave_balance.get('used')}", "INFO")
        log(f"  Pending: {leave_balance.get('pending')}", "INFO")
        log(f"  Remaining: {leave_balance.get('remaining')}", "INFO")
        
        if leave_balance.get("allowance") == 24:
            log("✅ PASS: Yearly allowance is 24 days (default)", "PASS")
        if leave_balance.get("pending") == 5:
            log("✅ PASS: Pending days is 5 (our leave request)", "PASS")
    
    # Test 3.5: Approve leave
    if leave_id:
        log("\n--- Test 3.5: POST /api/leaves/:id/approve ---")
        approve_result = test_api("POST", f"leaves/{leave_id}/approve",
                                 {"approvedBy": "المدير"},
                                 expected_status=200,
                                 description="Approve leave")
        if approve_result and approve_result.get("success"):
            log("✅ PASS: Leave approved successfully", "PASS")
            
            # Verify leave balance updated
            log("\n--- Test 3.5b: Verify leave balance after approval ---")
            balance_after = test_api("GET", f"employees/{employee_id}/leave-balance",
                                    description="Get leave balance after approval")
            if balance_after:
                log(f"  Used: {balance_after.get('used')}", "INFO")
                log(f"  Pending: {balance_after.get('pending')}", "INFO")
                log(f"  Remaining: {balance_after.get('remaining')}", "INFO")
                
                if balance_after.get("used") == 5:
                    log("✅ PASS: Used days updated to 5", "PASS")
                if balance_after.get("pending") == 0:
                    log("✅ PASS: Pending days updated to 0", "PASS")
    
    # Test 3.6: Create another leave and reject it
    log("\n--- Test 3.6: Create another leave and reject it ---")
    leave_data2 = {
        "employeeId": employee_id,
        "type": "sick",
        "reason": "إجازة مرضية",
        "startDate": "2026-06-10",
        "endDate": "2026-06-12",
        "days": 3
    }
    leave_created2 = test_api("POST", "leaves", leave_data2,
                             expected_status=201,
                             description="Create second leave request")
    
    leave_id2 = None
    if leave_created2 and leave_created2.get("id"):
        leave_id2 = leave_created2.get("id")
        log(f"✅ PASS: Second leave created with ID: {leave_id2}", "PASS")
        
        # Reject it
        log("\n--- Test 3.6b: POST /api/leaves/:id/reject ---")
        reject_result = test_api("POST", f"leaves/{leave_id2}/reject",
                                {"approvedBy": "المدير", "reason": "لا توجد موارد"},
                                expected_status=200,
                                description="Reject leave")
        if reject_result and reject_result.get("success"):
            log("✅ PASS: Leave rejected successfully", "PASS")
    
    # Test 3.7: Verify notifications created
    log("\n--- Test 3.7: Verify notifications for employee ---")
    notifications = test_api("GET", f"notifications?userId={employee_id}",
                            description="Get employee notifications")
    if notifications is not None:
        log(f"✅ PASS: Retrieved {len(notifications)} notifications", "PASS")
        leave_notifs = [n for n in notifications if "leave" in n.get("type", "")]
        if leave_notifs:
            log(f"✅ PASS: Found {len(leave_notifs)} leave-related notifications", "PASS")
            for notif in leave_notifs[:2]:
                log(f"  - {notif.get('title')}: {notif.get('message')[:50]}...", "INFO")
    
    # Step 4: Test Advances System
    log("\n### STEP 4: ADVANCES SYSTEM ###")
    
    # Test 4.1: Create advance request
    log("\n--- Test 4.1: POST /api/advances (create advance request) ---")
    advance_data = {
        "employeeId": employee_id,
        "amount": 300000,
        "reason": "سلفة طارئة",
        "installments": 3
    }
    advance_created = test_api("POST", "advances", advance_data,
                              expected_status=201,
                              description="Create advance request")
    
    advance_id = None
    if advance_created and advance_created.get("id"):
        advance_id = advance_created.get("id")
        log(f"✅ PASS: Advance created with ID: {advance_id}", "PASS")
        log(f"  Status: {advance_created.get('status')}", "INFO")
        log(f"  Amount: {advance_created.get('amount')}", "INFO")
        log(f"  Installments: {advance_created.get('installments')}", "INFO")
        log(f"  Per Installment: {advance_created.get('perInstallment')}", "INFO")
        
        if advance_created.get("status") == "pending":
            log("✅ PASS: Advance status is 'pending'", "PASS")
        if advance_created.get("perInstallment") == 100000:
            log("✅ PASS: Per installment calculated correctly (300000/3=100000)", "PASS")
    
    # Test 4.2: Get advances for employee
    log("\n--- Test 4.2: GET /api/advances?employeeId=X ---")
    emp_advances = test_api("GET", f"advances?employeeId={employee_id}",
                           description="Get advances for employee")
    if emp_advances is not None:
        log(f"✅ PASS: Retrieved {len(emp_advances)} advances", "PASS")
    
    # Test 4.3: Approve advance with modified installments
    if advance_id:
        log("\n--- Test 4.3: POST /api/advances/:id/approve (with installments=6) ---")
        approve_adv = test_api("POST", f"advances/{advance_id}/approve",
                              {"installments": 6},
                              expected_status=200,
                              description="Approve advance with 6 installments")
        if approve_adv and approve_adv.get("success"):
            log("✅ PASS: Advance approved successfully", "PASS")
            
            # Verify installments updated
            adv_after = test_api("GET", f"advances?employeeId={employee_id}",
                                description="Get advances after approval")
            if adv_after:
                approved_adv = next((a for a in adv_after if a.get("id") == advance_id), None)
                if approved_adv:
                    log(f"  Status: {approved_adv.get('status')}", "INFO")
                    log(f"  Installments: {approved_adv.get('installments')}", "INFO")
                    log(f"  Per Installment: {approved_adv.get('perInstallment')}", "INFO")
                    
                    if approved_adv.get("installments") == 6:
                        log("✅ PASS: Installments updated to 6", "PASS")
                    if approved_adv.get("perInstallment") == 50000:
                        log("✅ PASS: Per installment recalculated (300000/6=50000)", "PASS")
    
    # Test 4.4: Check payroll with advance deduction
    log("\n--- Test 4.4: GET /api/employees/:id/payroll?month=2026-05 ---")
    payroll = test_api("GET", f"employees/{employee_id}/payroll?month=2026-05",
                      description="Get payroll with advance deduction")
    if payroll:
        log(f"✅ PASS: Payroll retrieved", "PASS")
        log(f"  Base Salary: {payroll.get('baseSalary')}", "INFO")
        log(f"  Bonuses: {payroll.get('bonuses')}", "INFO")
        log(f"  Late Deductions: {payroll.get('lateDeductions')}", "INFO")
        log(f"  Advance Deduction: {payroll.get('advanceDeduction')}", "INFO")
        log(f"  Total Deductions: {payroll.get('deductions')}", "INFO")
        log(f"  Final Salary: {payroll.get('finalSalary')}", "INFO")
        
        if payroll.get("advanceDeduction") == 50000:
            log("✅ PASS: Advance deduction is 50000 (one installment)", "PASS")
        
        active_advances = payroll.get("activeAdvances", [])
        if active_advances:
            log(f"✅ PASS: Found {len(active_advances)} active advances in payroll", "PASS")
            for adv in active_advances:
                log(f"  - Amount: {adv.get('amount')}, Per Installment: {adv.get('perInstallment')}, Paid: {adv.get('paid')}/{adv.get('installments')}", "INFO")
    
    # Test 4.5: Pay installment
    if advance_id:
        log("\n--- Test 4.5: POST /api/advances/:id/pay-installment ---")
        pay_result = test_api("POST", f"advances/{advance_id}/pay-installment",
                             expected_status=200,
                             description="Pay one installment")
        if pay_result and pay_result.get("success"):
            log(f"✅ PASS: Installment paid successfully", "PASS")
            log(f"  Paid Installments: {pay_result.get('paidInstallments')}", "INFO")
            log(f"  Remaining: {pay_result.get('remaining')}", "INFO")
            
            if pay_result.get("paidInstallments") == 1:
                log("✅ PASS: Paid installments incremented to 1", "PASS")
            if pay_result.get("remaining") == 250000:
                log("✅ PASS: Remaining amount is 250000 (300000 - 50000)", "PASS")
        
        # Pay remaining installments to complete
        log("\n--- Test 4.5b: Pay remaining 5 installments ---")
        for i in range(2, 7):
            pay_result = test_api("POST", f"advances/{advance_id}/pay-installment",
                                 expected_status=200,
                                 description=f"Pay installment {i}/6")
            if pay_result:
                log(f"  Installment {i}/6 paid. Remaining: {pay_result.get('remaining')}", "INFO")
        
        # Verify final status
        adv_final = test_api("GET", f"advances?employeeId={employee_id}",
                            description="Get advances after all payments")
        if adv_final:
            completed_adv = next((a for a in adv_final if a.get("id") == advance_id), None)
            if completed_adv:
                log(f"  Final Status: {completed_adv.get('status')}", "INFO")
                if completed_adv.get("status") == "paid":
                    log("✅ PASS: Advance status changed to 'paid' after all installments", "PASS")
    
    # Test 4.6: Create and reject another advance
    log("\n--- Test 4.6: Create and reject another advance ---")
    advance_data2 = {
        "employeeId": employee_id,
        "amount": 500000,
        "reason": "سلفة كبيرة",
        "installments": 10
    }
    advance_created2 = test_api("POST", "advances", advance_data2,
                               expected_status=201,
                               description="Create second advance")
    
    advance_id2 = None
    if advance_created2 and advance_created2.get("id"):
        advance_id2 = advance_created2.get("id")
        log(f"✅ PASS: Second advance created with ID: {advance_id2}", "PASS")
        
        # Reject it
        log("\n--- Test 4.6b: POST /api/advances/:id/reject ---")
        reject_adv = test_api("POST", f"advances/{advance_id2}/reject",
                             {"reason": "تجاوز الحد"},
                             expected_status=200,
                             description="Reject advance")
        if reject_adv and reject_adv.get("success"):
            log("✅ PASS: Advance rejected successfully", "PASS")
    
    # Step 5: Test Notifications (Admin)
    log("\n### STEP 5: NOTIFICATIONS (ADMIN) ###")
    
    # Test 5.1: Get admin notifications
    log("\n--- Test 5.1: GET /api/notifications/admin ---")
    admin_notifs = test_api("GET", "notifications/admin",
                           description="Get admin/manager notifications")
    if admin_notifs is not None:
        log(f"✅ PASS: Retrieved {len(admin_notifs)} admin notifications", "PASS")
        
        # Check for leave/advance notifications
        leave_notifs = [n for n in admin_notifs if "leave" in n.get("type", "")]
        advance_notifs = [n for n in admin_notifs if "advance" in n.get("type", "")]
        
        if leave_notifs:
            log(f"✅ PASS: Found {len(leave_notifs)} leave notifications for managers", "PASS")
        if advance_notifs:
            log(f"✅ PASS: Found {len(advance_notifs)} advance notifications for managers", "PASS")
        
        # Show sample notifications
        for notif in admin_notifs[:3]:
            log(f"  - [{notif.get('type')}] {notif.get('title')}", "INFO")
    else:
        log("⚠️ INFO: No admin notifications (may be empty if no manager exists in DB)", "INFO")
    
    # Test 5.2: Mark all admin notifications as read
    log("\n--- Test 5.2: POST /api/notifications/admin/read-all ---")
    read_all = test_api("POST", "notifications/admin/read-all",
                       expected_status=200,
                       description="Mark all admin notifications as read")
    if read_all and read_all.get("success"):
        log("✅ PASS: All admin notifications marked as read", "PASS")
        
        # Verify all are read
        admin_notifs_after = test_api("GET", "notifications/admin",
                                     description="Get admin notifications after read-all")
        if admin_notifs_after:
            unread = [n for n in admin_notifs_after if not n.get("read")]
            if len(unread) == 0:
                log("✅ PASS: All notifications are now read=true", "PASS")
            else:
                log(f"⚠️ WARNING: Still have {len(unread)} unread notifications", "WARN")
    
    # Step 6: Test Telegram (with fake token, must not crash)
    log("\n### STEP 6: TELEGRAM (CONFIGURED WITH FAKE TOKEN) ###")
    
    # Test 6.1: Configure telegram with fake token
    log("\n--- Test 6.1: PUT /api/settings (enable telegram with fake token) ---")
    telegram_settings = {
        "telegram": {
            "enabled": True,
            "botToken": "123:fakeToken",
            "managerChatId": "999"
        }
    }
    settings_result = test_api("PUT", "settings", telegram_settings,
                              expected_status=200,
                              description="Enable telegram with fake token")
    if settings_result:
        log("✅ PASS: Settings updated with telegram config", "PASS")
    
    # Test 6.2: Create a leave/advance to trigger telegram notification (should not crash)
    log("\n--- Test 6.2: Create leave to trigger telegram (should not crash) ---")
    leave_data3 = {
        "employeeId": employee_id,
        "type": "emergency",
        "reason": "إجازة طارئة",
        "startDate": "2026-06-20",
        "endDate": "2026-06-21",
        "days": 2
    }
    leave_with_telegram = test_api("POST", "leaves", leave_data3,
                                  expected_status=201,
                                  description="Create leave with telegram enabled")
    if leave_with_telegram and leave_with_telegram.get("id"):
        log("✅ PASS: Leave created successfully (telegram did not crash the app)", "PASS")
    else:
        log("❌ FAIL: Leave creation failed (telegram may have crashed)", "FAIL")
    
    # Test 6.3: Test telegram endpoint directly
    log("\n--- Test 6.3: POST /api/settings/test/telegram ---")
    telegram_test = test_api("POST", "settings/test/telegram",
                            expected_status=[200, 400],
                            description="Test telegram endpoint")
    if telegram_test:
        if telegram_test.get("error"):
            log(f"✅ PASS: Telegram test returned error gracefully (no crash): {telegram_test.get('error')}", "PASS")
        elif telegram_test.get("success"):
            log("✅ PASS: Telegram test succeeded (unexpected with fake token)", "PASS")
    
    # Test 6.4: Disable telegram
    log("\n--- Test 6.4: PUT /api/settings (disable telegram) ---")
    disable_telegram = {
        "telegram": {
            "enabled": False
        }
    }
    disable_result = test_api("PUT", "settings", disable_telegram,
                             expected_status=200,
                             description="Disable telegram")
    if disable_result:
        log("✅ PASS: Telegram disabled", "PASS")
    
    # Step 7: Cleanup
    log("\n### STEP 7: CLEANUP ###")
    
    # Delete test leaves
    if leave_id:
        log(f"\n--- Deleting test leave {leave_id} ---")
        test_api("DELETE", f"leaves/{leave_id}", description="Delete test leave 1")
    if leave_id2:
        log(f"--- Deleting test leave {leave_id2} ---")
        test_api("DELETE", f"leaves/{leave_id2}", description="Delete test leave 2")
    
    # Delete test advances
    if advance_id:
        log(f"\n--- Deleting test advance {advance_id} ---")
        test_api("DELETE", f"advances/{advance_id}", description="Delete test advance 1")
    if advance_id2:
        log(f"--- Deleting test advance {advance_id2} ---")
        test_api("DELETE", f"advances/{advance_id2}", description="Delete test advance 2")
    
    log("\n" + "=" * 80)
    log("TESTING COMPLETE")
    log("=" * 80)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("\n\nTesting interrupted by user", "WARN")
        sys.exit(1)
    except Exception as e:
        log(f"\n\nFATAL ERROR: {str(e)}", "ERROR")
        import traceback
        traceback.print_exc()
        sys.exit(1)
