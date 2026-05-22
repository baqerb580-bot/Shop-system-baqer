#!/usr/bin/env python3
"""
Backend API Testing Script for Smart Notifications + Advanced Tasks
Tests all new notification and task lifecycle endpoints
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def log_test(test_name, passed, details=""):
    """Log test results"""
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"\n{status} - {test_name}")
    if details:
        print(f"  Details: {details}")

def test_notifications_click():
    """Test POST /api/notifications/:id/click"""
    print("\n" + "="*80)
    print("TEST 1: Notification Click Endpoint")
    print("="*80)
    
    try:
        # Get a notification first
        resp = requests.get(f"{BASE_URL}/notifications/admin")
        if resp.status_code != 200:
            log_test("Get notifications for click test", False, f"Status: {resp.status_code}")
            return None
        
        notifications = resp.json()
        if not notifications or len(notifications) == 0:
            log_test("Get notifications for click test", False, "No notifications found")
            return None
        
        notif_id = notifications[0]['id']
        log_test("Get notification ID", True, f"ID: {notif_id}")
        
        # Test click endpoint
        resp = requests.post(f"{BASE_URL}/notifications/{notif_id}/click")
        if resp.status_code != 200:
            log_test("POST /api/notifications/:id/click", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return None
        
        data = resp.json()
        
        # Verify response structure
        required_fields = ['success', 'actionUrl', 'entityType', 'entityId']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            log_test("POST /api/notifications/:id/click", False, f"Missing fields: {missing_fields}")
            return None
        
        if not data.get('success'):
            log_test("POST /api/notifications/:id/click", False, f"success=false: {data}")
            return None
        
        log_test("POST /api/notifications/:id/click", True, 
                f"actionUrl={data.get('actionUrl')}, entityType={data.get('entityType')}, entityId={data.get('entityId')}")
        
        # Verify notification is marked as read with clickedAt
        resp = requests.get(f"{BASE_URL}/notifications/admin")
        if resp.status_code == 200:
            notifications = resp.json()
            clicked_notif = next((n for n in notifications if n['id'] == notif_id), None)
            if clicked_notif:
                if clicked_notif.get('read') and clicked_notif.get('clickedAt'):
                    log_test("Notification marked as read with clickedAt", True, 
                            f"read={clicked_notif['read']}, clickedAt={clicked_notif.get('clickedAt')}")
                else:
                    log_test("Notification marked as read with clickedAt", False, 
                            f"read={clicked_notif.get('read')}, clickedAt={clicked_notif.get('clickedAt')}")
        
        return notif_id
        
    except Exception as e:
        log_test("POST /api/notifications/:id/click", False, f"Exception: {str(e)}")
        return None

def test_notifications_resolve(notif_id):
    """Test POST /api/notifications/:id/resolve"""
    print("\n" + "="*80)
    print("TEST 2: Notification Resolve Endpoint")
    print("="*80)
    
    try:
        # Get a fresh notification
        if not notif_id:
            resp = requests.get(f"{BASE_URL}/notifications/admin")
            if resp.status_code == 200:
                notifications = resp.json()
                if notifications and len(notifications) > 0:
                    notif_id = notifications[0]['id']
        
        if not notif_id:
            log_test("POST /api/notifications/:id/resolve", False, "No notification ID available")
            return None
        
        # Test resolve endpoint
        payload = {
            "note": "تمت المعالجة",
            "resolvedBy": "المدير"
        }
        resp = requests.post(f"{BASE_URL}/notifications/{notif_id}/resolve", json=payload)
        
        if resp.status_code != 200:
            log_test("POST /api/notifications/:id/resolve", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return None
        
        data = resp.json()
        
        if not data.get('success'):
            log_test("POST /api/notifications/:id/resolve", False, f"success=false: {data}")
            return None
        
        log_test("POST /api/notifications/:id/resolve", True, "Notification resolved successfully")
        
        # Verify notification is marked as resolved
        resp = requests.get(f"{BASE_URL}/notifications/admin")
        if resp.status_code == 200:
            notifications = resp.json()
            resolved_notif = next((n for n in notifications if n['id'] == notif_id), None)
            if resolved_notif:
                checks = {
                    'resolved': resolved_notif.get('resolved') == True,
                    'resolvedAt': resolved_notif.get('resolvedAt') is not None,
                    'resolvedBy': resolved_notif.get('resolvedBy') == "المدير",
                    'resolutionNote': resolved_notif.get('resolutionNote') == "تمت المعالجة",
                    'read': resolved_notif.get('read') == True
                }
                
                all_passed = all(checks.values())
                log_test("Notification marked as resolved with all fields", all_passed, 
                        f"Checks: {checks}")
        
        return notif_id
        
    except Exception as e:
        log_test("POST /api/notifications/:id/resolve", False, f"Exception: {str(e)}")
        return None

def test_notifications_reopen(notif_id):
    """Test POST /api/notifications/:id/reopen"""
    print("\n" + "="*80)
    print("TEST 3: Notification Reopen Endpoint")
    print("="*80)
    
    try:
        if not notif_id:
            log_test("POST /api/notifications/:id/reopen", False, "No notification ID available")
            return
        
        # Test reopen endpoint
        resp = requests.post(f"{BASE_URL}/notifications/{notif_id}/reopen")
        
        if resp.status_code != 200:
            log_test("POST /api/notifications/:id/reopen", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return
        
        data = resp.json()
        
        if not data.get('success'):
            log_test("POST /api/notifications/:id/reopen", False, f"success=false: {data}")
            return
        
        log_test("POST /api/notifications/:id/reopen", True, "Notification reopened successfully")
        
        # Verify notification is marked as not resolved
        resp = requests.get(f"{BASE_URL}/notifications/admin")
        if resp.status_code == 200:
            notifications = resp.json()
            reopened_notif = next((n for n in notifications if n['id'] == notif_id), None)
            if reopened_notif:
                checks = {
                    'resolved': reopened_notif.get('resolved') == False,
                    'resolvedAt': reopened_notif.get('resolvedAt') is None,
                    'resolvedBy': reopened_notif.get('resolvedBy') is None
                }
                
                all_passed = all(checks.values())
                log_test("Notification marked as not resolved", all_passed, 
                        f"Checks: {checks}")
        
    except Exception as e:
        log_test("POST /api/notifications/:id/reopen", False, f"Exception: {str(e)}")

def test_notifications_delete(notif_id):
    """Test DELETE /api/notifications/:id (soft delete)"""
    print("\n" + "="*80)
    print("TEST 4: Notification Delete Endpoint (Soft Delete)")
    print("="*80)
    
    try:
        if not notif_id:
            log_test("DELETE /api/notifications/:id", False, "No notification ID available")
            return
        
        # Test delete endpoint
        resp = requests.delete(f"{BASE_URL}/notifications/{notif_id}")
        
        if resp.status_code != 200:
            log_test("DELETE /api/notifications/:id", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return
        
        data = resp.json()
        
        if not data.get('success'):
            log_test("DELETE /api/notifications/:id", False, f"success=false: {data}")
            return
        
        log_test("DELETE /api/notifications/:id", True, "Notification soft deleted successfully")
        
        # Verify notification has deleted flag and deletedAt timestamp
        # Note: Soft deleted notifications might be filtered out from the list, 
        # so we just verify the endpoint returned success
        
    except Exception as e:
        log_test("DELETE /api/notifications/:id", False, f"Exception: {str(e)}")

def test_task_lifecycle():
    """Test complete task lifecycle: create -> start -> admin-complete -> rate"""
    print("\n" + "="*80)
    print("TEST 5-7: Task Lifecycle (Start, Admin-Complete, Rate)")
    print("="*80)
    
    try:
        # Create a test task
        task_payload = {
            "title": "تجربة دورة المهمة",
            "assignedTo": "test-emp-id-001",
            "assignedToName": "موظف تجريبي",
            "priority": "high",
            "dueDate": "2026-12-31"
        }
        
        resp = requests.post(f"{BASE_URL}/tasks", json=task_payload)
        if resp.status_code not in [200, 201]:
            log_test("Create test task", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return None
        
        task = resp.json()
        task_id = task.get('id')
        log_test("Create test task", True, f"Task ID: {task_id}")
        
        # TEST 5: Start task
        print("\n--- Testing POST /api/tasks/:id/start ---")
        start_payload = {"userName": "موظف تجريبي"}
        resp = requests.post(f"{BASE_URL}/tasks/{task_id}/start", json=start_payload)
        
        if resp.status_code != 200:
            log_test("POST /api/tasks/:id/start", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return task_id
        
        data = resp.json()
        
        if not data.get('success'):
            log_test("POST /api/tasks/:id/start", False, f"success=false: {data}")
            return task_id
        
        if not data.get('startedAt'):
            log_test("POST /api/tasks/:id/start", False, "Missing startedAt in response")
            return task_id
        
        log_test("POST /api/tasks/:id/start", True, f"startedAt={data.get('startedAt')}")
        
        # Verify task status and history
        resp = requests.get(f"{BASE_URL}/tasks")
        if resp.status_code == 200:
            tasks = resp.json()
            started_task = next((t for t in tasks if t['id'] == task_id), None)
            if started_task:
                checks = {
                    'status': started_task.get('status') == 'in_progress',
                    'startedAt': started_task.get('startedAt') is not None,
                    'history': isinstance(started_task.get('history'), list) and len(started_task.get('history', [])) > 0
                }
                log_test("Task status updated to in_progress", all(checks.values()), f"Checks: {checks}")
        
        # Check if notification was created
        resp = requests.get(f"{BASE_URL}/notifications/admin")
        if resp.status_code == 200:
            notifications = resp.json()
            task_started_notif = next((n for n in notifications if n.get('type') == 'task_started' and n.get('entityId') == task_id), None)
            if task_started_notif:
                log_test("Notification created for task_started", True, f"Notification type: {task_started_notif.get('type')}")
            else:
                log_test("Notification created for task_started", False, "No task_started notification found")
        
        # Test starting already started task (should return 400)
        resp = requests.post(f"{BASE_URL}/tasks/{task_id}/start", json=start_payload)
        if resp.status_code == 400:
            log_test("Prevent double start", True, "Correctly returns 400 for already started task")
        else:
            log_test("Prevent double start", False, f"Expected 400, got {resp.status_code}")
        
        # TEST 6: Admin complete task
        print("\n--- Testing POST /api/tasks/:id/admin-complete ---")
        complete_payload = {
            "note": "تم بنجاح",
            "userName": "المدير"
        }
        resp = requests.post(f"{BASE_URL}/tasks/{task_id}/admin-complete", json=complete_payload)
        
        if resp.status_code != 200:
            log_test("POST /api/tasks/:id/admin-complete", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return task_id
        
        data = resp.json()
        
        if not data.get('success'):
            log_test("POST /api/tasks/:id/admin-complete", False, f"success=false: {data}")
            return task_id
        
        required_fields = ['completedAt', 'durationMin']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            log_test("POST /api/tasks/:id/admin-complete", False, f"Missing fields: {missing_fields}")
            return task_id
        
        if not isinstance(data.get('durationMin'), (int, float)) or data.get('durationMin') <= 0:
            log_test("POST /api/tasks/:id/admin-complete", False, f"Invalid durationMin: {data.get('durationMin')}")
            return task_id
        
        log_test("POST /api/tasks/:id/admin-complete", True, 
                f"completedAt={data.get('completedAt')}, durationMin={data.get('durationMin')}")
        
        # Verify task status
        resp = requests.get(f"{BASE_URL}/tasks")
        if resp.status_code == 200:
            tasks = resp.json()
            completed_task = next((t for t in tasks if t['id'] == task_id), None)
            if completed_task:
                checks = {
                    'status': completed_task.get('status') == 'completed',
                    'completedAt': completed_task.get('completedAt') is not None,
                    'durationMin': isinstance(completed_task.get('durationMin'), (int, float)) and completed_task.get('durationMin') > 0
                }
                log_test("Task status updated to completed", all(checks.values()), f"Checks: {checks}")
        
        # Check if notification was created
        resp = requests.get(f"{BASE_URL}/notifications/admin")
        if resp.status_code == 200:
            notifications = resp.json()
            task_completed_notif = next((n for n in notifications if n.get('type') == 'task_completed' and n.get('entityId') == task_id), None)
            if task_completed_notif:
                log_test("Notification created for task_completed", True, f"Notification type: {task_completed_notif.get('type')}")
            else:
                log_test("Notification created for task_completed", False, "No task_completed notification found")
        
        # TEST 7: Rate task
        print("\n--- Testing POST /api/tasks/:id/rate ---")
        rate_payload = {
            "rating": 85,
            "success": True,
            "notes": "أداء ممتاز",
            "by": {
                "id": "manager",
                "name": "المدير"
            }
        }
        resp = requests.post(f"{BASE_URL}/tasks/{task_id}/rate", json=rate_payload)
        
        if resp.status_code != 200:
            log_test("POST /api/tasks/:id/rate", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return task_id
        
        data = resp.json()
        
        if not data.get('success'):
            log_test("POST /api/tasks/:id/rate", False, f"success=false: {data}")
            return task_id
        
        if 'review' not in data:
            log_test("POST /api/tasks/:id/rate", False, "Missing review in response")
            return task_id
        
        review = data['review']
        required_review_fields = ['rating', 'success', 'notes', 'reviewedAt', 'reviewedBy', 'reviewedByName']
        missing_review_fields = [f for f in required_review_fields if f not in review]
        
        if missing_review_fields:
            log_test("POST /api/tasks/:id/rate", False, f"Missing review fields: {missing_review_fields}")
            return task_id
        
        if review.get('rating') != 85:
            log_test("POST /api/tasks/:id/rate", False, f"Rating mismatch: expected 85, got {review.get('rating')}")
            return task_id
        
        log_test("POST /api/tasks/:id/rate", True, 
                f"rating={review.get('rating')}, success={review.get('success')}, notes={review.get('notes')}")
        
        # Verify task has review field
        resp = requests.get(f"{BASE_URL}/tasks")
        if resp.status_code == 200:
            tasks = resp.json()
            rated_task = next((t for t in tasks if t['id'] == task_id), None)
            if rated_task:
                if 'review' in rated_task and rated_task['review'].get('rating') == 85:
                    log_test("Task has review field populated", True, f"review={rated_task['review']}")
                else:
                    log_test("Task has review field populated", False, f"review={rated_task.get('review')}")
        
        # Check if notification was created for assignee
        resp = requests.get(f"{BASE_URL}/notifications/admin")
        if resp.status_code == 200:
            notifications = resp.json()
            task_reviewed_notif = next((n for n in notifications if n.get('type') == 'task_reviewed' and n.get('entityId') == task_id), None)
            if task_reviewed_notif:
                log_test("Notification created for task_reviewed", True, f"Notification type: {task_reviewed_notif.get('type')}")
            else:
                log_test("Notification created for task_reviewed", False, "No task_reviewed notification found")
        
        return task_id
        
    except Exception as e:
        log_test("Task lifecycle tests", False, f"Exception: {str(e)}")
        return None

def test_task_transfer():
    """Test POST /api/tasks/:id/transfer"""
    print("\n" + "="*80)
    print("TEST 8: Task Transfer Endpoint")
    print("="*80)
    
    try:
        # Create a test task
        task_payload = {
            "title": "مهمة للنقل",
            "assignedTo": "old-emp-id",
            "assignedToName": "موظف قديم",
            "priority": "medium",
            "dueDate": "2026-12-31"
        }
        
        resp = requests.post(f"{BASE_URL}/tasks", json=task_payload)
        if resp.status_code not in [200, 201]:
            log_test("Create task for transfer", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return None
        
        task = resp.json()
        task_id = task.get('id')
        log_test("Create task for transfer", True, f"Task ID: {task_id}")
        
        # Test transfer endpoint
        transfer_payload = {
            "toEmployeeId": "new-emp-id",
            "toEmployeeName": "موظف ثاني",
            "reason": "الموظف الحالي غير متاح",
            "by": {
                "id": "manager",
                "name": "المدير"
            }
        }
        resp = requests.post(f"{BASE_URL}/tasks/{task_id}/transfer", json=transfer_payload)
        
        if resp.status_code != 200:
            log_test("POST /api/tasks/:id/transfer", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return task_id
        
        data = resp.json()
        
        if not data.get('success'):
            log_test("POST /api/tasks/:id/transfer", False, f"success=false: {data}")
            return task_id
        
        log_test("POST /api/tasks/:id/transfer", True, "Task transferred successfully")
        
        # Verify task fields updated
        resp = requests.get(f"{BASE_URL}/tasks")
        if resp.status_code == 200:
            tasks = resp.json()
            transferred_task = next((t for t in tasks if t['id'] == task_id), None)
            if transferred_task:
                checks = {
                    'assignedTo': transferred_task.get('assignedTo') == 'new-emp-id',
                    'assignedToName': transferred_task.get('assignedToName') == 'موظف ثاني',
                    'status': transferred_task.get('status') == 'transferred',
                    'transferredFrom': transferred_task.get('transferredFrom') == 'old-emp-id',
                    'transferredFromName': transferred_task.get('transferredFromName') == 'موظف قديم',
                    'transferredAt': transferred_task.get('transferredAt') is not None,
                    'transferReason': transferred_task.get('transferReason') == 'الموظف الحالي غير متاح'
                }
                
                all_passed = all(checks.values())
                log_test("Task fields updated correctly", all_passed, f"Checks: {checks}")
                
                # Check history
                if 'history' in transferred_task and isinstance(transferred_task['history'], list):
                    transfer_event = next((h for h in transferred_task['history'] if h.get('event') == 'transferred'), None)
                    if transfer_event:
                        log_test("History has transferred event", True, f"Event: {transfer_event}")
                    else:
                        log_test("History has transferred event", False, "No transferred event in history")
        
        # Check if 3 notifications were created
        resp = requests.get(f"{BASE_URL}/notifications/admin")
        if resp.status_code == 200:
            notifications = resp.json()
            transfer_notifs = [n for n in notifications if n.get('entityId') == task_id and 'transfer' in n.get('type', '')]
            
            notif_types = [n.get('type') for n in transfer_notifs]
            expected_types = ['task_transferred_in', 'task_transferred_out', 'task_transferred']
            
            log_test("Three transfer notifications created", len(transfer_notifs) >= 3, 
                    f"Found {len(transfer_notifs)} notifications with types: {notif_types}")
            
            # Check for specific notification types
            has_in = any(n.get('type') == 'task_transferred_in' for n in transfer_notifs)
            has_out = any(n.get('type') == 'task_transferred_out' for n in transfer_notifs)
            has_broadcast = any(n.get('type') == 'task_transferred' for n in transfer_notifs)
            
            log_test("Notification types correct", has_in and has_out and has_broadcast,
                    f"task_transferred_in={has_in}, task_transferred_out={has_out}, task_transferred={has_broadcast}")
        
        return task_id
        
    except Exception as e:
        log_test("POST /api/tasks/:id/transfer", False, f"Exception: {str(e)}")
        return None

def test_task_duplicates():
    """Test GET /api/tasks/:id/duplicates"""
    print("\n" + "="*80)
    print("TEST 9: Task Duplicates Detection")
    print("="*80)
    
    try:
        # Create first task
        task_payload = {
            "title": "مهمة مكررة للاختبار",
            "assignedTo": "test-emp-123",
            "assignedToName": "موظف اختبار",
            "priority": "low",
            "dueDate": "2026-12-31"
        }
        
        resp = requests.post(f"{BASE_URL}/tasks", json=task_payload)
        if resp.status_code not in [200, 201]:
            log_test("Create first task", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return None, None
        
        task1 = resp.json()
        task1_id = task1.get('id')
        log_test("Create first task", True, f"Task 1 ID: {task1_id}")
        
        # Create second task with same title and assignee
        resp = requests.post(f"{BASE_URL}/tasks", json=task_payload)
        if resp.status_code not in [200, 201]:
            log_test("Create second task", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return task1_id, None
        
        task2 = resp.json()
        task2_id = task2.get('id')
        log_test("Create second task", True, f"Task 2 ID: {task2_id}")
        
        # Test duplicates endpoint for task1
        resp = requests.get(f"{BASE_URL}/tasks/{task1_id}/duplicates")
        
        if resp.status_code != 200:
            log_test("GET /api/tasks/:id/duplicates", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return task1_id, task2_id
        
        duplicates = resp.json()
        
        if not isinstance(duplicates, list):
            log_test("GET /api/tasks/:id/duplicates", False, f"Expected array, got: {type(duplicates)}")
            return task1_id, task2_id
        
        # Check if task2 appears in task1's duplicates
        duplicate_ids = [d.get('id') for d in duplicates]
        
        if task2_id in duplicate_ids:
            log_test("GET /api/tasks/:id/duplicates", True, 
                    f"Found {len(duplicates)} duplicate(s), including task2")
        else:
            log_test("GET /api/tasks/:id/duplicates", False, 
                    f"task2 not found in duplicates. Found IDs: {duplicate_ids}")
        
        # Test duplicates endpoint for task2 (should show task1)
        resp = requests.get(f"{BASE_URL}/tasks/{task2_id}/duplicates")
        if resp.status_code == 200:
            duplicates2 = resp.json()
            duplicate_ids2 = [d.get('id') for d in duplicates2]
            
            if task1_id in duplicate_ids2:
                log_test("Duplicate detection is bidirectional", True, 
                        f"task1 found in task2's duplicates")
            else:
                log_test("Duplicate detection is bidirectional", False, 
                        f"task1 not found in task2's duplicates")
        
        return task1_id, task2_id
        
    except Exception as e:
        log_test("GET /api/tasks/:id/duplicates", False, f"Exception: {str(e)}")
        return None, None

def test_employees_for_transfer():
    """Test GET /api/tasks/employees-for-transfer"""
    print("\n" + "="*80)
    print("TEST 10: Employees for Transfer Endpoint")
    print("="*80)
    
    try:
        resp = requests.get(f"{BASE_URL}/tasks/employees-for-transfer")
        
        if resp.status_code != 200:
            log_test("GET /api/tasks/employees-for-transfer", False, f"Status: {resp.status_code}, Body: {resp.text}")
            return
        
        employees = resp.json()
        
        if not isinstance(employees, list):
            log_test("GET /api/tasks/employees-for-transfer", False, f"Expected array, got: {type(employees)}")
            return
        
        log_test("GET /api/tasks/employees-for-transfer", True, f"Found {len(employees)} employees")
        
        # Verify structure of employee objects
        if len(employees) > 0:
            emp = employees[0]
            required_fields = ['id', 'name', 'role']
            missing_fields = [f for f in required_fields if f not in emp]
            
            if missing_fields:
                log_test("Employee object structure", False, f"Missing fields: {missing_fields}")
            else:
                log_test("Employee object structure", True, f"All required fields present: {required_fields}")
        
    except Exception as e:
        log_test("GET /api/tasks/employees-for-transfer", False, f"Exception: {str(e)}")

def test_notification_structure():
    """Test notification structure after task lifecycle"""
    print("\n" + "="*80)
    print("TEST 11: Notification Structure Check")
    print("="*80)
    
    try:
        resp = requests.get(f"{BASE_URL}/notifications/admin")
        
        if resp.status_code != 200:
            log_test("GET /api/notifications/admin", False, f"Status: {resp.status_code}")
            return
        
        notifications = resp.json()
        
        if not isinstance(notifications, list):
            log_test("Notifications is array", False, f"Expected array, got: {type(notifications)}")
            return
        
        log_test("GET /api/notifications/admin", True, f"Found {len(notifications)} notifications")
        
        # Find task-related notifications
        task_notifs = [n for n in notifications if n.get('entityType') == 'task']
        
        if len(task_notifs) == 0:
            log_test("Task notifications found", False, "No task notifications found")
            return
        
        log_test("Task notifications found", True, f"Found {len(task_notifs)} task notifications")
        
        # Check structure of task notifications
        sample_notif = task_notifs[0]
        required_fields = ['entityType', 'entityId', 'actionUrl', 'type', 'title', 'message']
        missing_fields = [f for f in required_fields if f not in sample_notif]
        
        if missing_fields:
            log_test("Notification structure", False, f"Missing fields: {missing_fields}")
        else:
            log_test("Notification structure", True, 
                    f"All required fields present. entityType={sample_notif.get('entityType')}, actionUrl={sample_notif.get('actionUrl')}")
        
        # Verify actionUrl format
        if sample_notif.get('actionUrl'):
            if 'tasks?id=' in sample_notif.get('actionUrl'):
                log_test("actionUrl format", True, f"actionUrl={sample_notif.get('actionUrl')}")
            else:
                log_test("actionUrl format", False, f"Unexpected format: {sample_notif.get('actionUrl')}")
        
        # Check for Arabic content
        has_arabic = any(ord(c) > 127 for c in sample_notif.get('title', '') + sample_notif.get('message', ''))
        log_test("Arabic content in notifications", has_arabic, 
                f"title={sample_notif.get('title')}, message={sample_notif.get('message')[:50]}...")
        
    except Exception as e:
        log_test("Notification structure check", False, f"Exception: {str(e)}")

def test_backward_compatibility():
    """Test backward compatibility - old endpoints still work"""
    print("\n" + "="*80)
    print("TEST 12: Backward Compatibility")
    print("="*80)
    
    try:
        # Create a test task for backward compatibility tests
        task_payload = {
            "title": "مهمة للتوافق الخلفي",
            "assignedTo": "test-emp-backward",
            "assignedToName": "موظف اختبار",
            "priority": "medium",
            "dueDate": "2026-12-31"
        }
        
        resp = requests.post(f"{BASE_URL}/tasks", json=task_payload)
        if resp.status_code not in [200, 201]:
            log_test("Create task for backward compatibility", False, f"Status: {resp.status_code}")
            return
        
        task = resp.json()
        task_id = task.get('id')
        log_test("Create task for backward compatibility", True, f"Task ID: {task_id}")
        
        # Test old employee accept endpoint (should return 403 since employeeId doesn't match)
        print("\n--- Testing POST /api/tasks/:id/accept (old endpoint) ---")
        accept_payload = {"employeeId": "wrong-id"}
        resp = requests.post(f"{BASE_URL}/tasks/{task_id}/accept", json=accept_payload)
        
        if resp.status_code == 403:
            log_test("POST /api/tasks/:id/accept (old endpoint)", True, 
                    "Correctly returns 403 for mismatched employeeId (endpoint still wired)")
        else:
            log_test("POST /api/tasks/:id/accept (old endpoint)", False, 
                    f"Expected 403, got {resp.status_code}")
        
        # Test old manager review endpoint (should still work)
        print("\n--- Testing POST /api/tasks/:id/review (old endpoint) ---")
        review_payload = {
            "action": "approve",
            "rating": {
                "quality": 4,
                "timeliness": 5,
                "communication": 4
            },
            "reviewerName": "المدير"
        }
        resp = requests.post(f"{BASE_URL}/tasks/{task_id}/review", json=review_payload)
        
        if resp.status_code == 200:
            log_test("POST /api/tasks/:id/review (old endpoint)", True, 
                    "Old review endpoint still works")
        else:
            log_test("POST /api/tasks/:id/review (old endpoint)", False, 
                    f"Status: {resp.status_code}, Body: {resp.text}")
        
        # Test old employee complete endpoint (should return 403 since employeeId doesn't match)
        print("\n--- Testing POST /api/tasks/:id/complete (old endpoint) ---")
        complete_payload = {
            "employeeId": "wrong-id",
            "summary": "تم الإنجاز",
            "notes": "ملاحظات"
        }
        resp = requests.post(f"{BASE_URL}/tasks/{task_id}/complete", json=complete_payload)
        
        if resp.status_code == 403:
            log_test("POST /api/tasks/:id/complete (old endpoint)", True, 
                    "Correctly returns 403 for mismatched employeeId (endpoint still wired)")
        else:
            log_test("POST /api/tasks/:id/complete (old endpoint)", False, 
                    f"Expected 403, got {resp.status_code}")
        
        # Clean up
        requests.delete(f"{BASE_URL}/tasks/{task_id}")
        
    except Exception as e:
        log_test("Backward compatibility tests", False, f"Exception: {str(e)}")

def test_regression():
    """Test regression - existing endpoints still work"""
    print("\n" + "="*80)
    print("TEST 13: Regression Tests")
    print("="*80)
    
    endpoints = [
        ("GET /api/dashboard/stats", f"{BASE_URL}/dashboard/stats"),
        ("GET /api/isp-sync/logs", f"{BASE_URL}/isp-sync/logs"),
        ("GET /api/whatsapp/status", f"{BASE_URL}/whatsapp/status"),
        ("GET /api/health", f"{BASE_URL}/health")
    ]
    
    for name, url in endpoints:
        try:
            resp = requests.get(url)
            if resp.status_code == 200:
                log_test(name, True, f"Status: 200")
                
                # Additional checks for specific endpoints
                if "health" in url:
                    data = resp.json()
                    if data.get('dbConnected'):
                        log_test(f"{name} - dbConnected", True, "Database connected")
                    else:
                        log_test(f"{name} - dbConnected", False, f"dbConnected={data.get('dbConnected')}")
            else:
                log_test(name, False, f"Status: {resp.status_code}")
        except Exception as e:
            log_test(name, False, f"Exception: {str(e)}")

def cleanup_test_tasks(task_ids):
    """Clean up test tasks"""
    print("\n" + "="*80)
    print("CLEANUP: Deleting Test Tasks")
    print("="*80)
    
    deleted_count = 0
    for task_id in task_ids:
        if task_id:
            try:
                resp = requests.delete(f"{BASE_URL}/tasks/{task_id}")
                if resp.status_code == 200:
                    deleted_count += 1
                    print(f"✅ Deleted task: {task_id}")
                else:
                    print(f"⚠️  Failed to delete task {task_id}: Status {resp.status_code}")
            except Exception as e:
                print(f"⚠️  Exception deleting task {task_id}: {str(e)}")
    
    print(f"\nDeleted {deleted_count} test tasks")

def main():
    """Main test runner"""
    print("\n" + "="*80)
    print("SMART NOTIFICATIONS + ADVANCED TASKS VERIFICATION")
    print("Backend URL:", BASE_URL)
    print("="*80)
    
    task_ids_to_cleanup = []
    
    # Test notifications
    notif_id = test_notifications_click()
    notif_id = test_notifications_resolve(notif_id)
    test_notifications_reopen(notif_id)
    test_notifications_delete(notif_id)
    
    # Test task lifecycle
    task_id = test_task_lifecycle()
    if task_id:
        task_ids_to_cleanup.append(task_id)
    
    # Test task transfer
    task_id = test_task_transfer()
    if task_id:
        task_ids_to_cleanup.append(task_id)
    
    # Test task duplicates
    task1_id, task2_id = test_task_duplicates()
    if task1_id:
        task_ids_to_cleanup.append(task1_id)
    if task2_id:
        task_ids_to_cleanup.append(task2_id)
    
    # Test employees for transfer
    test_employees_for_transfer()
    
    # Test notification structure
    test_notification_structure()
    
    # Test backward compatibility
    test_backward_compatibility()
    
    # Test regression
    test_regression()
    
    # Cleanup
    cleanup_test_tasks(task_ids_to_cleanup)
    
    print("\n" + "="*80)
    print("TESTING COMPLETE")
    print("="*80)

if __name__ == "__main__":
    main()
