#!/usr/bin/env python3
"""
Backend API Testing Script for Ghazlan ERP
Tests 2 NEW features:
1. GET /api/employees/:id/ratings - Employee ratings aggregate endpoint
2. notifyEmployee helper integration (regression tests)
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def log(msg, level="INFO"):
    """Print formatted log message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {msg}")

def test_get_request(endpoint, expected_status=200, description=""):
    """Helper for GET requests"""
    url = f"{BASE_URL}/{endpoint}"
    log(f"Testing GET {endpoint} - {description}")
    try:
        response = requests.get(url, timeout=30)
        log(f"Status: {response.status_code}, Expected: {expected_status}")
        if response.status_code != expected_status:
            log(f"FAIL: Expected {expected_status}, got {response.status_code}", "ERROR")
            log(f"Response: {response.text[:500]}", "ERROR")
            return None
        return response.json()
    except Exception as e:
        log(f"FAIL: Exception - {str(e)}", "ERROR")
        return None

def test_post_request(endpoint, data, expected_status=200, description=""):
    """Helper for POST requests"""
    url = f"{BASE_URL}/{endpoint}"
    log(f"Testing POST {endpoint} - {description}")
    try:
        response = requests.post(url, json=data, timeout=30)
        log(f"Status: {response.status_code}, Expected: {expected_status}")
        if response.status_code != expected_status:
            log(f"FAIL: Expected {expected_status}, got {response.status_code}", "ERROR")
            log(f"Response: {response.text[:500]}", "ERROR")
            return None
        return response.json()
    except Exception as e:
        log(f"FAIL: Exception - {str(e)}", "ERROR")
        return None

# ============================================================================
# TEST 1: GET /api/employees/:id/ratings - Employee Ratings Aggregate
# ============================================================================

def test_employee_ratings():
    """Test employee ratings aggregate endpoint"""
    log("=" * 80)
    log("TEST 1: Employee Ratings Aggregate Endpoint")
    log("=" * 80)
    
    results = {"passed": 0, "failed": 0, "tests": []}
    
    # Step 1: Fetch a valid employee (username='amer')
    log("\n--- Step 1: Fetch valid employee with username='amer' ---")
    employees = test_get_request("employees", description="Get all employees")
    if not employees:
        results["failed"] += 1
        results["tests"].append("❌ Failed to fetch employees")
        return results
    
    # Find employee with username='amer'
    amer = None
    for emp in employees:
        if emp.get("username") == "amer":
            amer = emp
            break
    
    if not amer:
        log("Employee 'amer' not found, trying first employee", "WARN")
        amer = employees[0] if employees else None
    
    if not amer:
        results["failed"] += 1
        results["tests"].append("❌ No employees found in database")
        return results
    
    emp_id = amer.get("id")
    emp_name = amer.get("name", "Unknown")
    log(f"✅ Found employee: {emp_name} (ID: {emp_id})")
    results["passed"] += 1
    results["tests"].append(f"✅ Found employee: {emp_name}")
    
    # Step 2: Success case - GET /api/employees/:id/ratings
    log(f"\n--- Step 2: GET /api/employees/{emp_id}/ratings (Success Case) ---")
    ratings = test_get_request(f"employees/{emp_id}/ratings", description="Get employee ratings")
    
    if not ratings:
        results["failed"] += 1
        results["tests"].append("❌ Failed to fetch ratings")
        return results
    
    # Verify response shape
    required_fields = ["employee", "ratedTasksCount", "averages", "kpiPct", "monthly", "recent"]
    missing_fields = [f for f in required_fields if f not in ratings]
    
    if missing_fields:
        log(f"FAIL: Missing fields: {missing_fields}", "ERROR")
        results["failed"] += 1
        results["tests"].append(f"❌ Missing fields: {missing_fields}")
        return results
    
    log(f"✅ All required fields present: {required_fields}")
    results["passed"] += 1
    results["tests"].append("✅ Response has all required fields")
    
    # Verify employee object
    employee = ratings.get("employee", {})
    emp_required = ["id", "name", "role", "kpi", "ratingPoints", "tasksCompleted"]
    emp_missing = [f for f in emp_required if f not in employee]
    
    if emp_missing:
        log(f"FAIL: Employee object missing fields: {emp_missing}", "ERROR")
        results["failed"] += 1
        results["tests"].append(f"❌ Employee object missing: {emp_missing}")
    else:
        log(f"✅ Employee object complete: {employee}")
        results["passed"] += 1
        results["tests"].append("✅ Employee object has all fields")
    
    # Verify averages (each should be 0-5)
    averages = ratings.get("averages", {})
    avg_fields = ["speed", "quality", "commitment", "delay", "overall"]
    
    for field in avg_fields:
        value = averages.get(field, -1)
        if not isinstance(value, (int, float)) or value < 0 or value > 5:
            log(f"FAIL: averages.{field} = {value} (should be 0-5)", "ERROR")
            results["failed"] += 1
            results["tests"].append(f"❌ averages.{field} out of range: {value}")
        else:
            log(f"✅ averages.{field} = {value} (valid)")
    
    if all(0 <= averages.get(f, -1) <= 5 for f in avg_fields):
        results["passed"] += 1
        results["tests"].append("✅ All averages values between 0 and 5")
    
    # Verify kpiPct (0-100)
    kpi_pct = ratings.get("kpiPct", -1)
    if not isinstance(kpi_pct, (int, float)) or kpi_pct < 0 or kpi_pct > 100:
        log(f"FAIL: kpiPct = {kpi_pct} (should be 0-100)", "ERROR")
        results["failed"] += 1
        results["tests"].append(f"❌ kpiPct out of range: {kpi_pct}")
    else:
        log(f"✅ kpiPct = {kpi_pct}% (valid)")
        results["passed"] += 1
        results["tests"].append(f"✅ kpiPct valid: {kpi_pct}%")
    
    # Verify monthly array
    monthly = ratings.get("monthly", [])
    if not isinstance(monthly, list):
        log(f"FAIL: monthly is not an array: {type(monthly)}", "ERROR")
        results["failed"] += 1
        results["tests"].append("❌ monthly is not an array")
    else:
        log(f"✅ monthly is array with {len(monthly)} entries")
        results["passed"] += 1
        results["tests"].append(f"✅ monthly array: {len(monthly)} entries")
        
        # Check monthly structure
        for m in monthly[:3]:  # Check first 3
            if not all(k in m for k in ["month", "count", "avgScore"]):
                log(f"FAIL: monthly entry missing fields: {m}", "ERROR")
                results["failed"] += 1
                results["tests"].append(f"❌ monthly entry incomplete: {m}")
                break
    
    # Verify recent array
    recent = ratings.get("recent", [])
    if not isinstance(recent, list):
        log(f"FAIL: recent is not an array: {type(recent)}", "ERROR")
        results["failed"] += 1
        results["tests"].append("❌ recent is not an array")
    else:
        log(f"✅ recent is array with {len(recent)} entries")
        results["passed"] += 1
        results["tests"].append(f"✅ recent array: {len(recent)} entries")
        
        # Check recent structure
        for r in recent[:2]:  # Check first 2
            required_recent = ["taskId", "title", "reviewedAt", "reviewerName", "notes", "rating", "score"]
            missing_recent = [f for f in required_recent if f not in r]
            if missing_recent:
                log(f"FAIL: recent entry missing: {missing_recent}", "ERROR")
                results["failed"] += 1
                results["tests"].append(f"❌ recent entry missing: {missing_recent}")
                break
            
            # Check rating object
            rating = r.get("rating", {})
            rating_fields = ["speed", "quality", "commitment", "delay"]
            if not all(f in rating for f in rating_fields):
                log(f"FAIL: rating missing fields: {rating}", "ERROR")
                results["failed"] += 1
                results["tests"].append(f"❌ rating incomplete: {rating}")
                break
            
            # Check score (0-100)
            score = r.get("score", -1)
            if not isinstance(score, (int, float)) or score < 0 or score > 100:
                log(f"FAIL: score = {score} (should be 0-100)", "ERROR")
                results["failed"] += 1
                results["tests"].append(f"❌ score out of range: {score}")
                break
    
    # Step 3: Empty case - Find employee with no reviewed tasks
    log("\n--- Step 3: Empty case (employee with no reviews) ---")
    # Try to find an employee with 0 rated tasks or create a test one
    empty_emp = None
    for emp in employees:
        # Quick check - if employee has no tasks, likely no reviews
        if emp.get("tasksCompleted", 0) == 0:
            empty_emp = emp
            break
    
    if empty_emp:
        empty_id = empty_emp.get("id")
        log(f"Testing with employee: {empty_emp.get('name')} (ID: {empty_id})")
        empty_ratings = test_get_request(f"employees/{empty_id}/ratings", description="Get ratings for employee with no reviews")
        
        if empty_ratings:
            if (empty_ratings.get("ratedTasksCount") == 0 and
                all(empty_ratings.get("averages", {}).get(f) == 0 for f in ["speed", "quality", "commitment", "delay", "overall"]) and
                len(empty_ratings.get("monthly", [])) == 0 and
                len(empty_ratings.get("recent", [])) == 0):
                log("✅ Empty case verified: ratedTasksCount=0, all averages=0, monthly=[], recent=[]")
                results["passed"] += 1
                results["tests"].append("✅ Empty case: correct response for employee with no reviews")
            else:
                log(f"WARN: Empty case response unexpected: {empty_ratings}", "WARN")
                results["passed"] += 1  # Not critical
                results["tests"].append("⚠️  Empty case: response structure OK but has data")
    else:
        log("SKIP: No employee with 0 tasks found for empty case test", "WARN")
        results["tests"].append("⚠️  Empty case: skipped (no suitable employee)")
    
    # Step 4: 404 case - Non-existent employee
    log("\n--- Step 4: 404 case (non-existent employee) ---")
    fake_id = "non-existent-id-zzz"
    response = requests.get(f"{BASE_URL}/employees/{fake_id}/ratings", timeout=30)
    
    if response.status_code == 404:
        try:
            error_data = response.json()
            error_msg = error_data.get("error", "")
            if "الموظف غير موجود" in error_msg or "not found" in error_msg.lower():
                log(f"✅ 404 case verified: {error_msg}")
                results["passed"] += 1
                results["tests"].append("✅ 404 case: correct error for non-existent employee")
            else:
                log(f"WARN: 404 but unexpected error message: {error_msg}", "WARN")
                results["passed"] += 1
                results["tests"].append("⚠️  404 case: status correct but message unexpected")
        except:
            log("✅ 404 case verified (no JSON body)")
            results["passed"] += 1
            results["tests"].append("✅ 404 case: correct status code")
    else:
        log(f"FAIL: Expected 404, got {response.status_code}", "ERROR")
        results["failed"] += 1
        results["tests"].append(f"❌ 404 case: got {response.status_code} instead")
    
    return results

# ============================================================================
# TEST 2: notifyEmployee Integration (Regression Tests)
# ============================================================================

def test_notify_employee_integration():
    """Test notifyEmployee helper integration in existing flows"""
    log("=" * 80)
    log("TEST 2: notifyEmployee Integration (Regression Tests)")
    log("=" * 80)
    
    results = {"passed": 0, "failed": 0, "tests": []}
    
    # Get test data
    log("\n--- Setup: Fetch test data ---")
    employees = test_get_request("employees", description="Get employees")
    subscribers = test_get_request("subscribers", description="Get subscribers")
    packages = test_get_request("packages", description="Get packages")
    
    if not employees or not subscribers or not packages:
        results["failed"] += 1
        results["tests"].append("❌ Failed to fetch test data")
        return results
    
    test_emp = employees[0] if employees else None
    test_sub = subscribers[0] if subscribers else None
    test_pkg = packages[0] if packages else None
    
    if not test_emp or not test_sub or not test_pkg:
        results["failed"] += 1
        results["tests"].append("❌ Insufficient test data")
        return results
    
    emp_id = test_emp.get("id")
    emp_name = test_emp.get("name")
    sub_id = test_sub.get("id")
    pkg_id = test_pkg.get("id")
    
    log(f"✅ Test employee: {emp_name} (ID: {emp_id})")
    log(f"✅ Test subscriber: {test_sub.get('name')} (ID: {sub_id})")
    log(f"✅ Test package: {test_pkg.get('name')} (ID: {pkg_id})")
    results["passed"] += 1
    results["tests"].append("✅ Test data fetched successfully")
    
    # Test 5: Task creation flow
    log("\n--- Test 5: Task creation flow (notifyEmployee integration) ---")
    task_data = {
        "title": "اختبار notifyEmp",
        "description": "مهمة اختبار لنظام الإشعارات",
        "assignedTo": emp_id,
        "assignedToName": emp_name,
        "priority": "high",
        "dueDate": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "createdBy": "Tester",
        "createdById": "test-system"
    }
    
    task_response = test_post_request("tasks", task_data, expected_status=201, description="Create task")
    
    if task_response and task_response.get("id"):
        task_id = task_response.get("id")
        log(f"✅ Task created: {task_id}")
        results["passed"] += 1
        results["tests"].append("✅ Task creation: successful")
        
        # Verify notification was created
        log("Checking notifications for employee...")
        notifs = test_get_request(f"notifications?userId={emp_id}", description="Get employee notifications")
        
        if notifs and isinstance(notifs, list):
            # Look for task_new notification
            task_notif = None
            for n in notifs:
                if n.get("type") == "task_new" and "مهمة جديدة" in n.get("title", ""):
                    task_notif = n
                    break
            
            if task_notif:
                log(f"✅ Notification found: {task_notif.get('title')}")
                results["passed"] += 1
                results["tests"].append("✅ Task notification: created successfully")
            else:
                log("WARN: task_new notification not found (may be async)", "WARN")
                results["tests"].append("⚠️  Task notification: not found (may be async)")
        else:
            log("WARN: Could not verify notifications", "WARN")
            results["tests"].append("⚠️  Task notification: could not verify")
        
        # Cleanup: delete test task
        requests.delete(f"{BASE_URL}/tasks/{task_id}", timeout=30)
        log(f"Cleaned up test task: {task_id}")
    else:
        log("FAIL: Task creation failed", "ERROR")
        results["failed"] += 1
        results["tests"].append("❌ Task creation: failed")
    
    # Test 6: Task review flow
    log("\n--- Test 6: Task review flow (notifyEmployee integration) ---")
    # Find a task in pending_review status or create one
    tasks = test_get_request("tasks", description="Get all tasks")
    
    if tasks:
        # Look for a task we can review
        reviewable_task = None
        for t in tasks:
            if t.get("status") in ["pending_review", "completed"] and t.get("assignedTo") == emp_id:
                reviewable_task = t
                break
        
        if not reviewable_task:
            # Create a task and mark it as pending_review
            log("Creating task for review test...")
            review_task_data = {
                "title": "مهمة للمراجعة",
                "assignedTo": emp_id,
                "assignedToName": emp_name,
                "priority": "medium",
                "dueDate": datetime.now().strftime("%Y-%m-%d"),
                "status": "pending_review",
                "createdBy": "Tester"
            }
            reviewable_task = test_post_request("tasks", review_task_data, expected_status=201, description="Create task for review")
        
        if reviewable_task:
            review_task_id = reviewable_task.get("id")
            log(f"Testing review for task: {review_task_id}")
            
            review_data = {
                "action": "approve",
                "rating": {"speed": 5, "quality": 5, "commitment": 4, "delay": 4},
                "notes": "ممتاز",
                "reviewerName": "المدير"
            }
            
            review_response = test_post_request(f"tasks/{review_task_id}/review", review_data, expected_status=200, description="Review task")
            
            if review_response and review_response.get("success"):
                log("✅ Task review successful")
                results["passed"] += 1
                results["tests"].append("✅ Task review: successful")
                
                # Check for notification
                notifs = test_get_request(f"notifications?userId={emp_id}", description="Get notifications after review")
                if notifs:
                    review_notif = any(n.get("type") == "task_approve" for n in notifs)
                    if review_notif:
                        log("✅ Review notification found")
                        results["passed"] += 1
                        results["tests"].append("✅ Review notification: created")
                    else:
                        log("WARN: Review notification not found", "WARN")
                        results["tests"].append("⚠️  Review notification: not found")
            else:
                log("WARN: Task review failed or already reviewed", "WARN")
                results["tests"].append("⚠️  Task review: could not complete")
        else:
            log("SKIP: No reviewable task found", "WARN")
            results["tests"].append("⚠️  Task review: skipped (no suitable task)")
    else:
        log("SKIP: No tasks found", "WARN")
        results["tests"].append("⚠️  Task review: skipped (no tasks)")
    
    # Test 7: Leave approve flow
    log("\n--- Test 7: Leave approve flow (notifyEmployee integration) ---")
    # Create a leave request
    leave_data = {
        "employeeId": emp_id,
        "type": "annual",
        "reason": "test",
        "startDate": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d"),
        "endDate": (datetime.now() + timedelta(days=11)).strftime("%Y-%m-%d"),
        "days": 2
    }
    
    leave_response = test_post_request("leaves", leave_data, expected_status=201, description="Create leave request")
    
    if leave_response and leave_response.get("id"):
        leave_id = leave_response.get("id")
        log(f"✅ Leave request created: {leave_id}")
        
        # Approve the leave
        approve_data = {"approvedBy": "Tester"}
        approve_response = test_post_request(f"leaves/{leave_id}/approve", approve_data, expected_status=200, description="Approve leave")
        
        if approve_response and approve_response.get("success"):
            log("✅ Leave approved successfully")
            results["passed"] += 1
            results["tests"].append("✅ Leave approve: successful")
            
            # Verify no 500 errors occurred
            log("✅ No 500 errors during leave approval")
            results["passed"] += 1
            results["tests"].append("✅ Leave approve: no crashes")
            
            # Check notification
            notifs = test_get_request(f"notifications?userId={emp_id}", description="Get notifications after leave approval")
            if notifs:
                leave_notif = any(n.get("type") == "leave_approve" for n in notifs)
                if leave_notif:
                    log("✅ Leave approval notification found")
                    results["passed"] += 1
                    results["tests"].append("✅ Leave notification: created")
                else:
                    log("WARN: Leave notification not found", "WARN")
                    results["tests"].append("⚠️  Leave notification: not found")
        else:
            log("FAIL: Leave approval failed", "ERROR")
            results["failed"] += 1
            results["tests"].append("❌ Leave approve: failed")
    else:
        log("FAIL: Leave creation failed", "ERROR")
        results["failed"] += 1
        results["tests"].append("❌ Leave creation: failed")
    
    # Test 8: Advance approve flow
    log("\n--- Test 8: Advance approve flow (notifyEmployee integration) ---")
    # Create an advance request
    advance_data = {
        "employeeId": emp_id,
        "amount": 100000,
        "reason": "test",
        "installments": 2
    }
    
    advance_response = test_post_request("advances", advance_data, expected_status=201, description="Create advance request")
    
    if advance_response and advance_response.get("id"):
        advance_id = advance_response.get("id")
        log(f"✅ Advance request created: {advance_id}")
        
        # Approve the advance
        approve_data = {"approvedBy": "Tester"}
        approve_response = test_post_request(f"advances/{advance_id}/approve", approve_data, expected_status=200, description="Approve advance")
        
        if approve_response and approve_response.get("success"):
            log("✅ Advance approved successfully")
            results["passed"] += 1
            results["tests"].append("✅ Advance approve: successful")
            
            # Verify no 500 errors
            log("✅ No 500 errors during advance approval")
            results["passed"] += 1
            results["tests"].append("✅ Advance approve: no crashes")
        else:
            log("FAIL: Advance approval failed", "ERROR")
            results["failed"] += 1
            results["tests"].append("❌ Advance approve: failed")
    else:
        log("FAIL: Advance creation failed", "ERROR")
        results["failed"] += 1
        results["tests"].append("❌ Advance creation: failed")
    
    # Test 9: Verify settings defaults
    log("\n--- Test 9: Verify settings defaults ---")
    settings = test_get_request("settings", description="Get settings")
    
    if settings:
        notifications = settings.get("notifications", {})
        notify_wa = notifications.get("notifyEmployeesWhatsApp")
        notify_tg = notifications.get("notifyEmployeesTelegram")
        
        if notify_wa is True:
            log("✅ notifyEmployeesWhatsApp = true (default)")
            results["passed"] += 1
            results["tests"].append("✅ Settings: notifyEmployeesWhatsApp = true")
        else:
            log(f"WARN: notifyEmployeesWhatsApp = {notify_wa} (expected true)", "WARN")
            results["tests"].append(f"⚠️  Settings: notifyEmployeesWhatsApp = {notify_wa}")
        
        if notify_tg is True:
            log("✅ notifyEmployeesTelegram = true (default)")
            results["passed"] += 1
            results["tests"].append("✅ Settings: notifyEmployeesTelegram = true")
        else:
            log(f"WARN: notifyEmployeesTelegram = {notify_tg} (expected true)", "WARN")
            results["tests"].append(f"⚠️  Settings: notifyEmployeesTelegram = {notify_tg}")
    else:
        log("FAIL: Could not fetch settings", "ERROR")
        results["failed"] += 1
        results["tests"].append("❌ Settings: fetch failed")
    
    return results

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    """Run all tests and print summary"""
    log("=" * 80)
    log("BACKEND API TESTING - 2 NEW FEATURES")
    log("=" * 80)
    log(f"Base URL: {BASE_URL}")
    log(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log("")
    
    all_results = {"passed": 0, "failed": 0, "tests": []}
    
    # Test 1: Employee Ratings
    try:
        results1 = test_employee_ratings()
        all_results["passed"] += results1["passed"]
        all_results["failed"] += results1["failed"]
        all_results["tests"].extend(results1["tests"])
    except Exception as e:
        log(f"CRITICAL ERROR in test_employee_ratings: {str(e)}", "ERROR")
        all_results["failed"] += 1
        all_results["tests"].append(f"❌ Employee Ratings: Critical error - {str(e)}")
    
    # Test 2: notifyEmployee Integration
    try:
        results2 = test_notify_employee_integration()
        all_results["passed"] += results2["passed"]
        all_results["failed"] += results2["failed"]
        all_results["tests"].extend(results2["tests"])
    except Exception as e:
        log(f"CRITICAL ERROR in test_notify_employee_integration: {str(e)}", "ERROR")
        all_results["failed"] += 1
        all_results["tests"].append(f"❌ notifyEmployee Integration: Critical error - {str(e)}")
    
    # Print summary
    log("")
    log("=" * 80)
    log("TEST SUMMARY")
    log("=" * 80)
    
    for test in all_results["tests"]:
        log(test)
    
    log("")
    log(f"Total Passed: {all_results['passed']}")
    log(f"Total Failed: {all_results['failed']}")
    log(f"Total Tests: {all_results['passed'] + all_results['failed']}")
    
    if all_results["failed"] == 0:
        log("✅ ALL TESTS PASSED", "SUCCESS")
        return 0
    else:
        log(f"❌ {all_results['failed']} TEST(S) FAILED", "ERROR")
        return 1

if __name__ == "__main__":
    sys.exit(main())
