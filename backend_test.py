#!/usr/bin/env python3
"""
Backend Test Script for Smart Clickable Notifications Feature
Tests all 8 critical scenarios as specified in the review request
"""

import requests
import json
from datetime import datetime, timedelta

# Base URL from .env
BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

# Existing employee IDs from review request
EMPLOYEE_ID_1 = "de57c5eb-40fb-4d5d-a3e4-302b0ce2d2a7"  # نعمة طالب طاهر
EMPLOYEE_ID_2 = "80b475dc-bfb3-435e-b98f-4618f796fb74"  # امير بهاء الدين علي

def print_test_header(test_num, test_name):
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {test_name}")
    print(f"{'='*80}")

def print_result(passed, message):
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"{status}: {message}")

def print_response(response, show_body=True):
    print(f"Status: {response.status_code}")
    if show_body:
        try:
            print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        except:
            print(f"Response: {response.text[:500]}")

# ============================================================================
# TEST 1: Leave Request notification has correct shape
# ============================================================================
def test_1_leave_request_notification():
    print_test_header(1, "Leave Request Notification Shape")
    
    try:
        # Create leave request
        today = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        
        leave_data = {
            "employeeId": EMPLOYEE_ID_1,
            "type": "اعتيادية",
            "reason": "اختبار نظام الإشعارات الذكية",
            "startDate": today,
            "endDate": end_date,
            "days": 5
        }
        
        print(f"\n1. Creating leave request for employee {EMPLOYEE_ID_1}...")
        response = requests.post(f"{BASE_URL}/leaves", json=leave_data)
        print_response(response)
        
        if response.status_code not in [200, 201]:
            print_result(False, f"Failed to create leave request: {response.status_code}")
            return False
        
        leave = response.json()
        leave_id = leave.get("id")
        print_result(True, f"Leave request created with ID: {leave_id}")
        
        # Get admin notifications
        print(f"\n2. Fetching admin notifications...")
        response = requests.get(f"{BASE_URL}/notifications/admin")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Failed to fetch notifications: {response.status_code}")
            return False
        
        notifications = response.json()
        print(f"Found {len(notifications)} notifications")
        
        # Find the leave request notification
        leave_notification = None
        for n in notifications:
            if n.get("type") == "leave_request" and n.get("entityId") == leave_id:
                leave_notification = n
                break
        
        if not leave_notification:
            print_result(False, "Leave request notification not found")
            return False
        
        print(f"\n3. Verifying notification structure...")
        print(f"Notification: {json.dumps(leave_notification, indent=2, ensure_ascii=False)}")
        
        # Verify required fields
        checks = [
            (leave_notification.get("entityType") == "leave", f"entityType='leave' (got: {leave_notification.get('entityType')})"),
            (leave_notification.get("entityId") == leave_id, f"entityId={leave_id} (got: {leave_notification.get('entityId')})"),
            (leave_notification.get("priority") == "high", f"priority='high' (got: {leave_notification.get('priority')})"),
            (leave_notification.get("icon") == "📅", f"icon='📅' (got: {leave_notification.get('icon')})"),
        ]
        
        all_passed = True
        for passed, msg in checks:
            print_result(passed, msg)
            if not passed:
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 2: Advance Request notification has correct shape
# ============================================================================
def test_2_advance_request_notification():
    print_test_header(2, "Advance Request Notification Shape")
    
    try:
        # Create advance request
        advance_data = {
            "employeeId": EMPLOYEE_ID_2,
            "amount": 500000,
            "reason": "اختبار نظام الإشعارات الذكية - سلفة",
            "installments": 5
        }
        
        print(f"\n1. Creating advance request for employee {EMPLOYEE_ID_2}...")
        response = requests.post(f"{BASE_URL}/advances", json=advance_data)
        print_response(response)
        
        if response.status_code not in [200, 201]:
            print_result(False, f"Failed to create advance request: {response.status_code}")
            return False
        
        advance = response.json()
        advance_id = advance.get("id")
        print_result(True, f"Advance request created with ID: {advance_id}")
        
        # Get admin notifications
        print(f"\n2. Fetching admin notifications...")
        response = requests.get(f"{BASE_URL}/notifications/admin")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Failed to fetch notifications: {response.status_code}")
            return False
        
        notifications = response.json()
        print(f"Found {len(notifications)} notifications")
        
        # Find the advance request notification
        advance_notification = None
        for n in notifications:
            if n.get("type") == "advance_request" and n.get("entityId") == advance_id:
                advance_notification = n
                break
        
        if not advance_notification:
            print_result(False, "Advance request notification not found")
            return False
        
        print(f"\n3. Verifying notification structure...")
        print(f"Notification: {json.dumps(advance_notification, indent=2, ensure_ascii=False)}")
        
        # Verify required fields
        checks = [
            (advance_notification.get("entityType") == "advance", f"entityType='advance' (got: {advance_notification.get('entityType')})"),
            (advance_notification.get("entityId") == advance_id, f"entityId={advance_id} (got: {advance_notification.get('entityId')})"),
            (advance_notification.get("priority") == "high", f"priority='high' (got: {advance_notification.get('priority')})"),
            (advance_notification.get("icon") == "💰", f"icon='💰' (got: {advance_notification.get('icon')})"),
        ]
        
        all_passed = True
        for passed, msg in checks:
            print_result(passed, msg)
            if not passed:
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 3: End-to-end approval flow
# ============================================================================
def test_3_approval_flow():
    print_test_header(3, "End-to-End Approval Flow")
    
    try:
        # Create leave request
        today = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        leave_data = {
            "employeeId": EMPLOYEE_ID_1,
            "type": "مرضية",
            "reason": "اختبار تدفق الموافقة",
            "startDate": today,
            "endDate": end_date,
            "days": 3
        }
        
        print(f"\n1. Creating leave request...")
        response = requests.post(f"{BASE_URL}/leaves", json=leave_data)
        print_response(response)
        
        if response.status_code not in [200, 201]:
            print_result(False, f"Failed to create leave request: {response.status_code}")
            return False
        
        leave = response.json()
        leave_id = leave.get("id")
        print_result(True, f"Leave request created with ID: {leave_id}")
        
        # Get notification to verify entityId
        print(f"\n2. Fetching notification to get entityId...")
        response = requests.get(f"{BASE_URL}/notifications/admin")
        notifications = response.json()
        
        notification_id = None
        for n in notifications:
            if n.get("type") == "leave_request" and n.get("entityId") == leave_id:
                notification_id = n.get("id")
                entity_id = n.get("entityId")
                print_result(True, f"Found notification with entityId: {entity_id}")
                break
        
        if not notification_id:
            print_result(False, "Notification not found")
            return False
        
        # Approve the leave using entityId from notification
        print(f"\n3. Approving leave using entityId: {entity_id}...")
        approve_data = {"approvedBy": "المدير - اختبار"}
        response = requests.post(f"{BASE_URL}/leaves/{entity_id}/approve", json=approve_data)
        print_response(response)
        
        if response.status_code != 200:
            print_result(False, f"Failed to approve leave: {response.status_code}")
            return False
        
        print_result(True, "Leave approved successfully")
        
        # Verify leave status changed to approved
        print(f"\n4. Verifying leave status...")
        response = requests.get(f"{BASE_URL}/leaves")
        leaves = response.json()
        
        approved_leave = None
        for l in leaves:
            if l.get("id") == leave_id:
                approved_leave = l
                break
        
        if not approved_leave:
            print_result(False, "Leave not found in list")
            return False
        
        status_check = approved_leave.get("status") == "approved"
        print_result(status_check, f"Leave status: {approved_leave.get('status')}")
        
        # Resolve the original notification
        print(f"\n5. Resolving original notification...")
        resolve_data = {"resolvedBy": "المدير", "note": "تمت الموافقة"}
        response = requests.post(f"{BASE_URL}/notifications/{notification_id}/resolve", json=resolve_data)
        print_response(response)
        
        if response.status_code != 200:
            print_result(False, f"Failed to resolve notification: {response.status_code}")
            return False
        
        print_result(True, "Notification resolved successfully")
        
        return status_check
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 4: End-to-end rejection flow
# ============================================================================
def test_4_rejection_flow():
    print_test_header(4, "End-to-End Rejection Flow")
    
    try:
        # Create advance request
        advance_data = {
            "employeeId": EMPLOYEE_ID_2,
            "amount": 300000,
            "reason": "اختبار تدفق الرفض",
            "installments": 3
        }
        
        print(f"\n1. Creating advance request...")
        response = requests.post(f"{BASE_URL}/advances", json=advance_data)
        print_response(response)
        
        if response.status_code not in [200, 201]:
            print_result(False, f"Failed to create advance request: {response.status_code}")
            return False
        
        advance = response.json()
        advance_id = advance.get("id")
        print_result(True, f"Advance request created with ID: {advance_id}")
        
        # Get notification to verify entityId
        print(f"\n2. Fetching notification to get entityId...")
        response = requests.get(f"{BASE_URL}/notifications/admin")
        notifications = response.json()
        
        entity_id = None
        for n in notifications:
            if n.get("type") == "advance_request" and n.get("entityId") == advance_id:
                entity_id = n.get("entityId")
                print_result(True, f"Found notification with entityId: {entity_id}")
                break
        
        if not entity_id:
            print_result(False, "Notification not found")
            return False
        
        # Reject the advance using entityId from notification
        print(f"\n3. Rejecting advance using entityId: {entity_id}...")
        reject_data = {"reason": "سبب اختبار - لا يوجد رصيد كافٍ"}
        response = requests.post(f"{BASE_URL}/advances/{entity_id}/reject", json=reject_data)
        print_response(response)
        
        if response.status_code != 200:
            print_result(False, f"Failed to reject advance: {response.status_code}")
            return False
        
        print_result(True, "Advance rejected successfully")
        
        # Verify advance status changed to rejected
        print(f"\n4. Verifying advance status and rejection reason...")
        response = requests.get(f"{BASE_URL}/advances")
        advances = response.json()
        
        rejected_advance = None
        for a in advances:
            if a.get("id") == advance_id:
                rejected_advance = a
                break
        
        if not rejected_advance:
            print_result(False, "Advance not found in list")
            return False
        
        status_check = rejected_advance.get("status") == "rejected"
        reason_check = rejected_advance.get("rejectionReason") == "سبب اختبار - لا يوجد رصيد كافٍ"
        
        print_result(status_check, f"Advance status: {rejected_advance.get('status')}")
        print_result(reason_check, f"Rejection reason: {rejected_advance.get('rejectionReason')}")
        
        return status_check and reason_check
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 5: Task review approval via notification
# ============================================================================
def test_5_task_review_approval():
    print_test_header(5, "Task Review Approval via Notification")
    
    try:
        # First, get existing tasks to find one with pending_review status
        print(f"\n1. Fetching existing tasks...")
        response = requests.get(f"{BASE_URL}/tasks")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Failed to fetch tasks: {response.status_code}")
            return False
        
        tasks = response.json()
        print(f"Found {len(tasks)} tasks")
        
        # Find a task with pending_review status
        pending_task = None
        for t in tasks:
            if t.get("status") == "pending_review":
                pending_task = t
                break
        
        # If no pending_review task, create one
        if not pending_task:
            print(f"\n2. No pending_review task found, creating a new task...")
            task_data = {
                "title": "مهمة اختبار - مراجعة",
                "description": "اختبار نظام مراجعة المهام",
                "assignedTo": EMPLOYEE_ID_1,
                "assignedToName": "نعمة طالب طاهر",
                "priority": "high",
                "status": "pending_review"
            }
            response = requests.post(f"{BASE_URL}/tasks", json=task_data)
            print_response(response)
            
            if response.status_code not in [200, 201]:
                print_result(False, f"Failed to create task: {response.status_code}")
                return False
            
            pending_task = response.json()
            print_result(True, f"Task created with ID: {pending_task.get('id')}")
        else:
            print_result(True, f"Found pending_review task with ID: {pending_task.get('id')}")
        
        task_id = pending_task.get("id")
        
        # Approve the task review
        print(f"\n3. Approving task review for task ID: {task_id}...")
        review_data = {
            "action": "approve",
            "reviewerName": "المدير - اختبار",
            "rating": 5,
            "feedback": "عمل ممتاز"
        }
        response = requests.post(f"{BASE_URL}/tasks/{task_id}/review", json=review_data)
        print_response(response)
        
        if response.status_code != 200:
            print_result(False, f"Failed to approve task review: {response.status_code}")
            return False
        
        print_result(True, "Task review approved successfully")
        
        # Verify task status changed to completed
        print(f"\n4. Verifying task status...")
        response = requests.get(f"{BASE_URL}/tasks")
        tasks = response.json()
        
        reviewed_task = None
        for t in tasks:
            if t.get("id") == task_id:
                reviewed_task = t
                break
        
        if not reviewed_task:
            print_result(False, "Task not found in list")
            return False
        
        status_check = reviewed_task.get("status") == "completed"
        review_check = reviewed_task.get("review") is not None
        
        print_result(status_check, f"Task status: {reviewed_task.get('status')}")
        print_result(review_check, f"Review object exists: {review_check}")
        
        if review_check:
            print(f"Review details: {json.dumps(reviewed_task.get('review'), indent=2, ensure_ascii=False)}")
        
        return status_check and review_check
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 6: Legacy notification enrichment
# ============================================================================
def test_6_legacy_notification_enrichment():
    print_test_header(6, "Legacy Notification Enrichment")
    
    try:
        print(f"\n1. Fetching admin notifications...")
        response = requests.get(f"{BASE_URL}/notifications/admin")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Failed to fetch notifications: {response.status_code}")
            return False
        
        notifications = response.json()
        print(f"Found {len(notifications)} notifications")
        
        # Check that all notifications have entityType and icon
        print(f"\n2. Verifying all notifications have entityType and icon...")
        
        missing_entity_type = []
        missing_icon = []
        
        for n in notifications:
            if not n.get("entityType"):
                missing_entity_type.append(n.get("id"))
            if not n.get("icon"):
                missing_icon.append(n.get("id"))
        
        entity_type_check = len(missing_entity_type) == 0
        icon_check = len(missing_icon) == 0
        
        print_result(entity_type_check, f"All notifications have entityType (missing: {len(missing_entity_type)})")
        print_result(icon_check, f"All notifications have icon (missing: {len(missing_icon)})")
        
        # Check specific notification types
        print(f"\n3. Checking specific notification type enrichment...")
        
        type_checks = {
            "leave_request": {"entityType": "leave", "icon": "📅"},
            "advance_request": {"entityType": "advance", "icon": "💰"},
            "task_submitted": {"entityType": "task", "icon": "📋"},
        }
        
        all_type_checks_passed = True
        for n in notifications:
            n_type = n.get("type")
            if n_type in type_checks:
                expected = type_checks[n_type]
                entity_match = n.get("entityType") == expected["entityType"]
                icon_match = n.get("icon") == expected["icon"]
                
                if not entity_match or not icon_match:
                    print_result(False, f"Type {n_type}: entityType={n.get('entityType')} (expected {expected['entityType']}), icon={n.get('icon')} (expected {expected['icon']})")
                    all_type_checks_passed = False
        
        if all_type_checks_passed:
            print_result(True, "All notification types have correct entityType and icon")
        
        return entity_type_check and icon_check and all_type_checks_passed
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 7: Broadcast fallback when no managers
# ============================================================================
def test_7_broadcast_fallback():
    print_test_header(7, "Broadcast Fallback When No Managers")
    
    try:
        # Check if there are any managers in the system
        print(f"\n1. Checking for managers in the system...")
        response = requests.get(f"{BASE_URL}/employees")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Failed to fetch employees: {response.status_code}")
            return False
        
        employees = response.json()
        print(f"Found {len(employees)} employees")
        
        # Count managers (employees with permissions='all' or role containing 'مدير')
        managers = []
        for emp in employees:
            if emp.get("permissions") == "all" or "مدير" in (emp.get("role") or ""):
                managers.append(emp)
        
        print(f"Found {len(managers)} managers")
        
        if len(managers) > 0:
            print_result(True, f"System has {len(managers)} managers - broadcast fallback not needed but should still work")
        else:
            print_result(True, "System has 0 managers - broadcast fallback will be used")
        
        # Get admin notifications
        print(f"\n2. Fetching admin notifications...")
        response = requests.get(f"{BASE_URL}/notifications/admin")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Failed to fetch notifications: {response.status_code}")
            return False
        
        notifications = response.json()
        print(f"Found {len(notifications)} notifications")
        
        # If no managers, check that notifications exist with userId=null
        if len(managers) == 0:
            broadcast_notifications = [n for n in notifications if n.get("userId") is None]
            print(f"Found {len(broadcast_notifications)} broadcast notifications (userId=null)")
            
            broadcast_check = len(broadcast_notifications) > 0
            print_result(broadcast_check, f"Broadcast notifications exist when no managers: {broadcast_check}")
            
            return broadcast_check
        else:
            # If managers exist, notifications should still be accessible
            print_result(True, "Notifications accessible even with managers present")
            return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 8: Regression checks
# ============================================================================
def test_8_regression_checks():
    print_test_header(8, "Regression Checks")
    
    try:
        all_passed = True
        
        # Test 1: GET /api/notifications/admin
        print(f"\n1. Testing GET /api/notifications/admin...")
        response = requests.get(f"{BASE_URL}/notifications/admin")
        check1 = response.status_code == 200
        print_result(check1, f"GET /api/notifications/admin: {response.status_code}")
        if not check1:
            all_passed = False
        
        # Get a notification ID for further tests
        notification_id = None
        if check1:
            notifications = response.json()
            if len(notifications) > 0:
                notification_id = notifications[0].get("id")
                print(f"Using notification ID: {notification_id}")
        
        if not notification_id:
            print_result(False, "No notifications found for further testing")
            return False
        
        # Test 2: POST /api/notifications/:id/click
        print(f"\n2. Testing POST /api/notifications/:id/click...")
        response = requests.post(f"{BASE_URL}/notifications/{notification_id}/click")
        check2 = response.status_code == 200
        print_result(check2, f"POST /api/notifications/:id/click: {response.status_code}")
        if check2:
            data = response.json()
            has_entity_type = "entityType" in data
            has_entity_id = "entityId" in data
            print_result(has_entity_type, f"Response has entityType: {has_entity_type}")
            print_result(has_entity_id, f"Response has entityId: {has_entity_id}")
            if not (has_entity_type and has_entity_id):
                all_passed = False
        else:
            all_passed = False
        
        # Test 3: POST /api/notifications/:id/resolve
        print(f"\n3. Testing POST /api/notifications/:id/resolve...")
        resolve_data = {"resolvedBy": "admin", "note": "اختبار"}
        response = requests.post(f"{BASE_URL}/notifications/{notification_id}/resolve", json=resolve_data)
        check3 = response.status_code == 200
        print_result(check3, f"POST /api/notifications/:id/resolve: {response.status_code}")
        if not check3:
            all_passed = False
        
        # Test 4: POST /api/notifications/:id/reopen
        print(f"\n4. Testing POST /api/notifications/:id/reopen...")
        response = requests.post(f"{BASE_URL}/notifications/{notification_id}/reopen")
        check4 = response.status_code == 200
        print_result(check4, f"POST /api/notifications/:id/reopen: {response.status_code}")
        if not check4:
            all_passed = False
        
        # Test 5: POST /api/notifications/admin/read-all
        print(f"\n5. Testing POST /api/notifications/admin/read-all...")
        response = requests.post(f"{BASE_URL}/notifications/admin/read-all")
        check5 = response.status_code == 200
        print_result(check5, f"POST /api/notifications/admin/read-all: {response.status_code}")
        if not check5:
            all_passed = False
        
        return all_passed
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================
def main():
    print("\n" + "="*80)
    print("SMART CLICKABLE NOTIFICATIONS - BACKEND TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Employee 1: {EMPLOYEE_ID_1}")
    print(f"Employee 2: {EMPLOYEE_ID_2}")
    
    results = {}
    
    # Run all tests
    results["Test 1: Leave Request Notification"] = test_1_leave_request_notification()
    results["Test 2: Advance Request Notification"] = test_2_advance_request_notification()
    results["Test 3: End-to-End Approval Flow"] = test_3_approval_flow()
    results["Test 4: End-to-End Rejection Flow"] = test_4_rejection_flow()
    results["Test 5: Task Review Approval"] = test_5_task_review_approval()
    results["Test 6: Legacy Notification Enrichment"] = test_6_legacy_notification_enrichment()
    results["Test 7: Broadcast Fallback"] = test_7_broadcast_fallback()
    results["Test 8: Regression Checks"] = test_8_regression_checks()
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = 0
    failed = 0
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("\n" + "="*80)
    print(f"TOTAL: {passed} passed, {failed} failed out of {passed + failed} tests")
    print("="*80)
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
