#!/usr/bin/env python3
"""
Backend API Testing for Arabic ERP - Task Workflow, Notifications, File Upload, Privacy
Tests NEW endpoints: Task Accept/Reject/Complete/Review, Notifications, File Upload, Employee Self
"""

import requests
import json
import os
from io import BytesIO

# Base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://isp-noc-hub.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

print(f"🧪 Testing Arabic ERP Backend - Task Workflow & Notifications")
print(f"📍 Base URL: {API_URL}\n")

# Test counters
tests_passed = 0
tests_failed = 0
test_results = []

def test(name, func):
    """Run a test and track results"""
    global tests_passed, tests_failed
    try:
        print(f"\n{'='*80}")
        print(f"🧪 TEST: {name}")
        print(f"{'='*80}")
        func()
        tests_passed += 1
        test_results.append(f"✅ {name}")
        print(f"✅ PASSED: {name}")
    except AssertionError as e:
        tests_failed += 1
        test_results.append(f"❌ {name}: {str(e)}")
        print(f"❌ FAILED: {name}")
        print(f"   Error: {str(e)}")
    except Exception as e:
        tests_failed += 1
        test_results.append(f"❌ {name}: {str(e)}")
        print(f"❌ ERROR: {name}")
        print(f"   Exception: {str(e)}")

# Global variables for test data
employee_id = None
employee_name = None
task_id = None
notification_id = None
uploaded_file_url = None

# ============================================================================
# SETUP: Get Employee Data
# ============================================================================

def setup_get_employee():
    """Get employee with username='asas' for testing"""
    global employee_id, employee_name
    print("🔍 Getting employee data (username='asas')...")
    
    # Get all employees
    r = requests.get(f"{API_URL}/employees")
    assert r.status_code == 200, f"Failed to get employees: {r.status_code}"
    
    employees = r.json()
    print(f"   Found {len(employees)} employees in database")
    
    # Find employee with username='asas'
    asas_emp = None
    for emp in employees:
        if emp.get('username') == 'asas':
            asas_emp = emp
            break
    
    assert asas_emp is not None, "Employee with username='asas' not found"
    
    employee_id = asas_emp['id']
    employee_name = asas_emp['name']
    
    print(f"   ✅ Found employee: {employee_name} (ID: {employee_id})")
    print(f"   Employee details: role={asas_emp.get('role')}, kpi={asas_emp.get('kpi')}, tasksCompleted={asas_emp.get('tasksCompleted', 0)}")

# ============================================================================
# TEST 1: Task Creation with Auto-Notification
# ============================================================================

def test_task_creation_with_notification():
    """Test POST /api/tasks - creates task with status='pending' and notifies employee"""
    global task_id
    
    print(f"📝 Creating new task assigned to employee {employee_id}...")
    
    task_data = {
        "title": "اختبار نظام المهام الجديد",
        "description": "مهمة اختبار لنظام قبول ورفض المهام",
        "priority": "high",
        "dueDate": "2026-05-25",
        "assignedTo": employee_id,
        "assignedToName": employee_name,
        "createdBy": "مدير النظام",
        "createdById": "manager-test-id"
    }
    
    r = requests.post(f"{API_URL}/tasks", json=task_data)
    assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
    
    task = r.json()
    print(f"   ✅ Task created: {task['id']}")
    print(f"   Title: {task['title']}")
    print(f"   Status: {task['status']}")
    print(f"   Priority: {task['priority']}")
    
    # Verify status is 'pending'
    assert task['status'] == 'pending', f"Expected status='pending', got '{task['status']}'"
    print(f"   ✅ Status is 'pending' (default)")
    
    task_id = task['id']
    
    # Verify notification was created for employee
    print(f"\n🔔 Checking if notification was created for employee...")
    r = requests.get(f"{API_URL}/notifications?userId={employee_id}")
    assert r.status_code == 200, f"Failed to get notifications: {r.status_code}"
    
    notifications = r.json()
    print(f"   Found {len(notifications)} notifications for employee")
    
    # Find notification for this task
    task_notification = None
    for notif in notifications:
        if notif.get('taskId') == task_id and notif.get('type') == 'task_new':
            task_notification = notif
            break
    
    assert task_notification is not None, "No notification found for new task"
    print(f"   ✅ Notification created:")
    print(f"      Type: {task_notification['type']}")
    print(f"      Title: {task_notification['title']}")
    print(f"      Message: {task_notification['message']}")
    print(f"      Read: {task_notification['read']}")

# ============================================================================
# TEST 2: Task Accept (Employee)
# ============================================================================

def test_task_accept():
    """Test POST /api/tasks/:id/accept - employee accepts task"""
    
    print(f"✅ Employee accepting task {task_id}...")
    
    r = requests.post(f"{API_URL}/tasks/{task_id}/accept", json={"employeeId": employee_id})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    result = r.json()
    assert result.get('success') == True, "Expected success=true"
    print(f"   ✅ Task accepted successfully")
    
    # Verify task status changed to 'in_progress'
    print(f"\n🔍 Verifying task status changed to 'in_progress'...")
    r = requests.get(f"{API_URL}/tasks")
    tasks = r.json()
    task = next((t for t in tasks if t['id'] == task_id), None)
    
    assert task is not None, "Task not found"
    assert task['status'] == 'in_progress', f"Expected status='in_progress', got '{task['status']}'"
    assert 'acceptedAt' in task, "acceptedAt field not set"
    print(f"   ✅ Task status: {task['status']}")
    print(f"   ✅ Accepted at: {task['acceptedAt']}")
    
    # Verify manager notification was created
    print(f"\n🔔 Checking if manager notification was created...")
    manager_id = "manager-test-id"
    r = requests.get(f"{API_URL}/notifications?userId={manager_id}")
    assert r.status_code == 200, f"Failed to get manager notifications: {r.status_code}"
    
    notifications = r.json()
    print(f"   Found {len(notifications)} notifications for manager")
    
    # Find notification for task acceptance
    accept_notif = None
    for notif in notifications:
        if notif.get('taskId') == task_id and notif.get('type') == 'task_accepted':
            accept_notif = notif
            break
    
    assert accept_notif is not None, "No notification found for task acceptance"
    print(f"   ✅ Manager notification created:")
    print(f"      Type: {accept_notif['type']}")
    print(f"      Title: {accept_notif['title']}")
    print(f"      Message: {accept_notif['message']}")

# ============================================================================
# TEST 3: Task Accept - Validation Tests
# ============================================================================

def test_task_accept_validation():
    """Test task accept validation (wrong employee, wrong status)"""
    
    # Test 1: Wrong employee ID (should return 403)
    print(f"🔒 Testing accept with wrong employeeId (should fail with 403)...")
    r = requests.post(f"{API_URL}/tasks/{task_id}/accept", json={"employeeId": "wrong-employee-id"})
    assert r.status_code == 403, f"Expected 403, got {r.status_code}"
    print(f"   ✅ Correctly rejected with 403 (unauthorized)")
    
    # Test 2: Task already accepted (should return 400)
    print(f"\n🔒 Testing accept on already accepted task (should fail with 400)...")
    r = requests.post(f"{API_URL}/tasks/{task_id}/accept", json={"employeeId": employee_id})
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print(f"   ✅ Correctly rejected with 400 (invalid status)")

# ============================================================================
# TEST 4: Task Reject with Reason
# ============================================================================

def test_task_reject():
    """Test POST /api/tasks/:id/reject - employee rejects task with reason"""
    
    # First, create a new task to reject
    print(f"📝 Creating new task to test rejection...")
    task_data = {
        "title": "مهمة للرفض",
        "description": "مهمة سيتم رفضها",
        "priority": "medium",
        "dueDate": "2026-05-26",
        "assignedTo": employee_id,
        "assignedToName": employee_name,
        "createdBy": "مدير النظام",
        "createdById": "manager-test-id"
    }
    
    r = requests.post(f"{API_URL}/tasks", json=task_data)
    assert r.status_code == 201, f"Failed to create task: {r.status_code}"
    reject_task_id = r.json()['id']
    print(f"   ✅ Task created: {reject_task_id}")
    
    # Test rejection with short reason (should fail)
    print(f"\n🔒 Testing reject with short reason (should fail with 400)...")
    r = requests.post(f"{API_URL}/tasks/{reject_task_id}/reject", json={
        "employeeId": employee_id,
        "reason": "ab"  # Too short
    })
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print(f"   ✅ Correctly rejected with 400 (reason too short)")
    
    # Test rejection with valid reason
    print(f"\n❌ Employee rejecting task with valid reason...")
    reason = "لا أملك الخبرة الكافية لإنجاز هذه المهمة"
    r = requests.post(f"{API_URL}/tasks/{reject_task_id}/reject", json={
        "employeeId": employee_id,
        "reason": reason
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    result = r.json()
    assert result.get('success') == True, "Expected success=true"
    print(f"   ✅ Task rejected successfully")
    
    # Verify task status and reason
    print(f"\n🔍 Verifying task status and rejection reason...")
    r = requests.get(f"{API_URL}/tasks")
    tasks = r.json()
    task = next((t for t in tasks if t['id'] == reject_task_id), None)
    
    assert task is not None, "Task not found"
    assert task['status'] == 'rejected_by_employee', f"Expected status='rejected_by_employee', got '{task['status']}'"
    assert task.get('rejectionReason') == reason, "Rejection reason not saved correctly"
    assert 'rejectedAt' in task, "rejectedAt field not set"
    print(f"   ✅ Task status: {task['status']}")
    print(f"   ✅ Rejection reason: {task['rejectionReason']}")
    print(f"   ✅ Rejected at: {task['rejectedAt']}")
    
    # Verify manager notification with reason
    print(f"\n🔔 Checking if manager notification includes rejection reason...")
    r = requests.get(f"{API_URL}/notifications?userId=manager-test-id")
    notifications = r.json()
    
    reject_notif = None
    for notif in notifications:
        if notif.get('taskId') == reject_task_id and notif.get('type') == 'task_rejected':
            reject_notif = notif
            break
    
    assert reject_notif is not None, "No notification found for task rejection"
    assert reason in reject_notif['message'], "Rejection reason not in notification message"
    print(f"   ✅ Manager notification created with reason:")
    print(f"      Message: {reject_notif['message']}")

# ============================================================================
# TEST 5: Task Complete (Submit Report)
# ============================================================================

def test_task_complete():
    """Test POST /api/tasks/:id/complete - employee submits completion report"""
    
    print(f"📋 Employee submitting completion report for task {task_id}...")
    
    report_data = {
        "employeeId": employee_id,
        "summary": "تم إنجاز المهمة بنجاح وفق المطلوب",
        "notes": "تمت المهمة بدون مشاكل",
        "progress": 100,
        "attachments": ["/uploads/report1.pdf", "/uploads/screenshot.png"],
        "problems": "لا توجد مشاكل",
        "completionTime": "2026-05-20T14:30:00.000Z"
    }
    
    r = requests.post(f"{API_URL}/tasks/{task_id}/complete", json=report_data)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    result = r.json()
    assert result.get('success') == True, "Expected success=true"
    print(f"   ✅ Completion report submitted successfully")
    
    # Verify task status and report
    print(f"\n🔍 Verifying task status and report data...")
    r = requests.get(f"{API_URL}/tasks")
    tasks = r.json()
    task = next((t for t in tasks if t['id'] == task_id), None)
    
    assert task is not None, "Task not found"
    assert task['status'] == 'pending_review', f"Expected status='pending_review', got '{task['status']}'"
    assert 'report' in task, "Report not saved"
    
    report = task['report']
    assert report['summary'] == report_data['summary'], "Summary not saved correctly"
    assert report['notes'] == report_data['notes'], "Notes not saved correctly"
    assert report['progress'] == report_data['progress'], "Progress not saved correctly"
    assert report['attachments'] == report_data['attachments'], "Attachments not saved correctly"
    assert report['problems'] == report_data['problems'], "Problems not saved correctly"
    assert 'submittedAt' in report, "submittedAt not set"
    
    print(f"   ✅ Task status: {task['status']}")
    print(f"   ✅ Report saved:")
    print(f"      Summary: {report['summary']}")
    print(f"      Progress: {report['progress']}%")
    print(f"      Attachments: {len(report['attachments'])} files")
    print(f"      Submitted at: {report['submittedAt']}")
    
    # Verify manager notification
    print(f"\n🔔 Checking if manager notification was created...")
    r = requests.get(f"{API_URL}/notifications?userId=manager-test-id")
    notifications = r.json()
    
    submit_notif = None
    for notif in notifications:
        if notif.get('taskId') == task_id and notif.get('type') == 'task_submitted':
            submit_notif = notif
            break
    
    assert submit_notif is not None, "No notification found for task submission"
    print(f"   ✅ Manager notification created:")
    print(f"      Type: {submit_notif['type']}")
    print(f"      Title: {submit_notif['title']}")
    print(f"      Message: {submit_notif['message']}")

# ============================================================================
# TEST 6: Task Review - Approve with Rating
# ============================================================================

def test_task_review_approve():
    """Test POST /api/tasks/:id/review - manager approves with rating"""
    
    print(f"⭐ Manager reviewing and approving task {task_id}...")
    
    # Get employee's current KPI and tasksCompleted before approval
    r = requests.get(f"{API_URL}/employees")
    employees = r.json()
    emp_before = next((e for e in employees if e['id'] == employee_id), None)
    kpi_before = emp_before.get('kpi', 0)
    tasks_completed_before = emp_before.get('tasksCompleted', 0)
    rating_points_before = emp_before.get('ratingPoints', 0)
    
    print(f"   Employee stats before approval:")
    print(f"      KPI: {kpi_before}")
    print(f"      Tasks Completed: {tasks_completed_before}")
    print(f"      Rating Points: {rating_points_before}")
    
    review_data = {
        "action": "approve",
        "rating": {
            "speed": 5,
            "quality": 4,
            "commitment": 5,
            "delay": 4
        },
        "notes": "عمل ممتاز، استمر",
        "reviewerName": "مدير النظام"
    }
    
    r = requests.post(f"{API_URL}/tasks/{task_id}/review", json=review_data)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    result = r.json()
    assert result.get('success') == True, "Expected success=true"
    print(f"   ✅ Task approved successfully")
    
    # Verify task status and review
    print(f"\n🔍 Verifying task status and review data...")
    r = requests.get(f"{API_URL}/tasks")
    tasks = r.json()
    task = next((t for t in tasks if t['id'] == task_id), None)
    
    assert task is not None, "Task not found"
    assert task['status'] == 'completed', f"Expected status='completed', got '{task['status']}'"
    assert 'review' in task, "Review not saved"
    
    review = task['review']
    assert review['action'] == 'approve', "Action not saved correctly"
    assert review['rating'] == review_data['rating'], "Rating not saved correctly"
    assert review['notes'] == review_data['notes'], "Notes not saved correctly"
    
    print(f"   ✅ Task status: {task['status']}")
    print(f"   ✅ Review saved:")
    print(f"      Action: {review['action']}")
    print(f"      Rating: speed={review['rating']['speed']}, quality={review['rating']['quality']}, commitment={review['rating']['commitment']}, delay={review['rating']['delay']}")
    print(f"      Notes: {review['notes']}")
    
    # Verify employee KPI updated
    print(f"\n📊 Verifying employee KPI and stats updated...")
    r = requests.get(f"{API_URL}/employees")
    employees = r.json()
    emp_after = next((e for e in employees if e['id'] == employee_id), None)
    
    assert emp_after is not None, "Employee not found"
    
    kpi_after = emp_after.get('kpi', 0)
    tasks_completed_after = emp_after.get('tasksCompleted', 0)
    rating_points_after = emp_after.get('ratingPoints', 0)
    
    # Calculate expected score: (5+4+5+4)/4 * 20 = 4.5 * 20 = 90
    expected_score = round(((5 + 4 + 5 + 4) / 4) * 20)
    
    assert tasks_completed_after == tasks_completed_before + 1, f"Tasks completed not incremented: {tasks_completed_after} vs {tasks_completed_before}"
    assert rating_points_after == rating_points_before + expected_score, f"Rating points not updated correctly: {rating_points_after} vs {rating_points_before + expected_score}"
    
    print(f"   ✅ Employee stats after approval:")
    print(f"      KPI: {kpi_before} → {kpi_after}")
    print(f"      Tasks Completed: {tasks_completed_before} → {tasks_completed_after}")
    print(f"      Rating Points: {rating_points_before} → {rating_points_after} (+{expected_score})")
    
    # Verify employee notification
    print(f"\n🔔 Checking if employee notification was created...")
    r = requests.get(f"{API_URL}/notifications?userId={employee_id}")
    notifications = r.json()
    
    approve_notif = None
    for notif in notifications:
        if notif.get('taskId') == task_id and notif.get('type') == 'task_approve':
            approve_notif = notif
            break
    
    assert approve_notif is not None, "No notification found for task approval"
    print(f"   ✅ Employee notification created:")
    print(f"      Type: {approve_notif['type']}")
    print(f"      Title: {approve_notif['title']}")
    print(f"      Message: {approve_notif['message']}")

# ============================================================================
# TEST 7: Task Review - Revise (back to in_progress)
# ============================================================================

def test_task_review_revise():
    """Test POST /api/tasks/:id/review - manager requests revisions"""
    
    # Create and complete a new task for revise test
    print(f"📝 Creating new task for revise test...")
    task_data = {
        "title": "مهمة للمراجعة",
        "description": "مهمة سيتم طلب تعديلات عليها",
        "priority": "medium",
        "dueDate": "2026-05-27",
        "assignedTo": employee_id,
        "assignedToName": employee_name,
        "createdBy": "مدير النظام",
        "createdById": "manager-test-id"
    }
    
    r = requests.post(f"{API_URL}/tasks", json=task_data)
    revise_task_id = r.json()['id']
    print(f"   ✅ Task created: {revise_task_id}")
    
    # Accept task
    r = requests.post(f"{API_URL}/tasks/{revise_task_id}/accept", json={"employeeId": employee_id})
    assert r.status_code == 200, "Failed to accept task"
    print(f"   ✅ Task accepted")
    
    # Complete task
    r = requests.post(f"{API_URL}/tasks/{revise_task_id}/complete", json={
        "employeeId": employee_id,
        "summary": "تم الإنجاز",
        "notes": "ملاحظات",
        "progress": 100
    })
    assert r.status_code == 200, "Failed to complete task"
    print(f"   ✅ Task completed")
    
    # Manager requests revisions
    print(f"\n🔄 Manager requesting revisions...")
    review_data = {
        "action": "revise",
        "notes": "يرجى إعادة العمل على النقاط التالية: 1) تحسين الجودة 2) إضافة تفاصيل أكثر",
        "reviewerName": "مدير النظام"
    }
    
    r = requests.post(f"{API_URL}/tasks/{revise_task_id}/review", json=review_data)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    result = r.json()
    assert result.get('success') == True, "Expected success=true"
    print(f"   ✅ Revisions requested successfully")
    
    # Verify task status went back to 'in_progress'
    print(f"\n🔍 Verifying task status went back to 'in_progress'...")
    r = requests.get(f"{API_URL}/tasks")
    tasks = r.json()
    task = next((t for t in tasks if t['id'] == revise_task_id), None)
    
    assert task is not None, "Task not found"
    assert task['status'] == 'in_progress', f"Expected status='in_progress', got '{task['status']}'"
    print(f"   ✅ Task status: {task['status']} (back to work)")
    
    # Verify employee notification
    print(f"\n🔔 Checking if employee notification was created...")
    r = requests.get(f"{API_URL}/notifications?userId={employee_id}")
    notifications = r.json()
    
    revise_notif = None
    for notif in notifications:
        if notif.get('taskId') == revise_task_id and notif.get('type') == 'task_revise':
            revise_notif = notif
            break
    
    assert revise_notif is not None, "No notification found for task revise"
    print(f"   ✅ Employee notification created:")
    print(f"      Type: {revise_notif['type']}")
    print(f"      Title: {revise_notif['title']}")
    print(f"      Message: {revise_notif['message']}")

# ============================================================================
# TEST 8: Task Review - Invalid Action
# ============================================================================

def test_task_review_invalid_action():
    """Test task review with invalid action (should return 400)"""
    
    print(f"🔒 Testing review with invalid action (should fail with 400)...")
    
    review_data = {
        "action": "invalid_action",  # Invalid
        "notes": "test"
    }
    
    r = requests.post(f"{API_URL}/tasks/{task_id}/review", json=review_data)
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print(f"   ✅ Correctly rejected with 400 (invalid action)")

# ============================================================================
# TEST 9: Notifications - GET with userId
# ============================================================================

def test_notifications_get():
    """Test GET /api/notifications?userId=X"""
    
    print(f"🔔 Getting notifications for employee {employee_id}...")
    
    r = requests.get(f"{API_URL}/notifications?userId={employee_id}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    notifications = r.json()
    assert isinstance(notifications, list), "Expected array of notifications"
    print(f"   ✅ Retrieved {len(notifications)} notifications")
    
    # Verify notifications are sorted by createdAt desc
    if len(notifications) > 1:
        for i in range(len(notifications) - 1):
            assert notifications[i]['createdAt'] >= notifications[i+1]['createdAt'], "Notifications not sorted by createdAt desc"
        print(f"   ✅ Notifications sorted by createdAt (descending)")
    
    # Verify structure
    if len(notifications) > 0:
        notif = notifications[0]
        assert 'id' in notif, "Notification missing 'id'"
        assert 'userId' in notif, "Notification missing 'userId'"
        assert 'type' in notif, "Notification missing 'type'"
        assert 'title' in notif, "Notification missing 'title'"
        assert 'message' in notif, "Notification missing 'message'"
        assert 'read' in notif, "Notification missing 'read'"
        assert 'createdAt' in notif, "Notification missing 'createdAt'"
        print(f"   ✅ Notification structure valid")
        print(f"      Sample: {notif['type']} - {notif['title']}")
    
    # Test without userId (should return 400)
    print(f"\n🔒 Testing GET without userId (should fail with 400)...")
    r = requests.get(f"{API_URL}/notifications")
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print(f"   ✅ Correctly rejected with 400 (userId required)")

# ============================================================================
# TEST 10: Notifications - Mark Single as Read
# ============================================================================

def test_notifications_mark_read():
    """Test POST /api/notifications/:id/read"""
    global notification_id
    
    print(f"📖 Marking single notification as read...")
    
    # Get unread notifications
    r = requests.get(f"{API_URL}/notifications?userId={employee_id}")
    notifications = r.json()
    
    unread = [n for n in notifications if not n.get('read')]
    assert len(unread) > 0, "No unread notifications found"
    
    notification_id = unread[0]['id']
    print(f"   Found unread notification: {notification_id}")
    print(f"   Type: {unread[0]['type']}, Title: {unread[0]['title']}")
    
    # Mark as read
    r = requests.post(f"{API_URL}/notifications/{notification_id}/read")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    result = r.json()
    assert result.get('success') == True, "Expected success=true"
    print(f"   ✅ Notification marked as read")
    
    # Verify it's marked as read
    print(f"\n🔍 Verifying notification is marked as read...")
    r = requests.get(f"{API_URL}/notifications?userId={employee_id}")
    notifications = r.json()
    
    notif = next((n for n in notifications if n['id'] == notification_id), None)
    assert notif is not None, "Notification not found"
    assert notif['read'] == True, f"Expected read=true, got {notif['read']}"
    print(f"   ✅ Notification read status: {notif['read']}")

# ============================================================================
# TEST 11: Notifications - Mark All as Read
# ============================================================================

def test_notifications_mark_all_read():
    """Test POST /api/notifications/read-all"""
    
    print(f"📖 Marking all notifications as read for employee...")
    
    # Get current unread count
    r = requests.get(f"{API_URL}/notifications?userId={employee_id}")
    notifications = r.json()
    unread_before = len([n for n in notifications if not n.get('read')])
    print(f"   Unread notifications before: {unread_before}")
    
    # Mark all as read
    r = requests.post(f"{API_URL}/notifications/read-all", json={"userId": employee_id})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    result = r.json()
    assert result.get('success') == True, "Expected success=true"
    print(f"   ✅ All notifications marked as read")
    
    # Verify all are read
    print(f"\n🔍 Verifying all notifications are marked as read...")
    r = requests.get(f"{API_URL}/notifications?userId={employee_id}")
    notifications = r.json()
    
    unread_after = len([n for n in notifications if not n.get('read')])
    assert unread_after == 0, f"Expected 0 unread, found {unread_after}"
    print(f"   ✅ Unread notifications after: {unread_after}")

# ============================================================================
# TEST 12: File Upload
# ============================================================================

def test_file_upload():
    """Test POST /api/upload - multipart file upload"""
    global uploaded_file_url
    
    print(f"📤 Testing file upload...")
    
    # Create a test file
    file_content = b"This is a test file for upload testing.\nLine 2\nLine 3"
    file_name = "test_document.txt"
    
    files = {'file': (file_name, BytesIO(file_content), 'text/plain')}
    
    r = requests.post(f"{API_URL}/upload", files=files)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    result = r.json()
    assert result.get('success') == True, "Expected success=true"
    assert 'url' in result, "Missing 'url' in response"
    assert 'name' in result, "Missing 'name' in response"
    assert 'size' in result, "Missing 'size' in response"
    
    uploaded_file_url = result['url']
    
    print(f"   ✅ File uploaded successfully:")
    print(f"      URL: {result['url']}")
    print(f"      Name: {result['name']}")
    print(f"      Size: {result['size']} bytes")
    
    # Verify URL format
    assert result['url'].startswith('/uploads/'), f"URL should start with '/uploads/', got {result['url']}"
    assert result['url'].endswith('.txt'), f"URL should end with '.txt', got {result['url']}"
    print(f"   ✅ URL format valid")
    
    # Verify file exists on disk
    import os
    file_path = f"/app/public{result['url']}"
    assert os.path.exists(file_path), f"File not found at {file_path}"
    print(f"   ✅ File exists on disk: {file_path}")
    
    # Verify file content
    with open(file_path, 'rb') as f:
        saved_content = f.read()
    assert saved_content == file_content, "File content doesn't match"
    print(f"   ✅ File content verified")
    
    # Test upload without file (should return 400)
    print(f"\n🔒 Testing upload without file (should fail with 400)...")
    r = requests.post(f"{API_URL}/upload", data={})
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print(f"   ✅ Correctly rejected with 400 (no file)")

# ============================================================================
# TEST 13: Employee Self (Privacy)
# ============================================================================

def test_employee_self():
    """Test GET /api/employees/:id/self - returns safe fields only"""
    
    print(f"🔒 Testing employee self endpoint (privacy)...")
    
    r = requests.get(f"{API_URL}/employees/{employee_id}/self")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    emp = r.json()
    
    # Verify required fields are present
    required_fields = ['id', 'employeeId', 'name', 'role', 'photo', 'shiftStart', 
                      'shiftEnd', 'permissions', 'status', 'salary', 'kpi', 
                      'ratingPoints', 'tasksCompleted']
    
    for field in required_fields:
        assert field in emp, f"Missing required field: {field}"
    
    print(f"   ✅ All required fields present:")
    print(f"      ID: {emp['id']}")
    print(f"      Employee ID: {emp['employeeId']}")
    print(f"      Name: {emp['name']}")
    print(f"      Role: {emp['role']}")
    print(f"      Salary: {emp['salary']}")
    print(f"      KPI: {emp['kpi']}")
    print(f"      Tasks Completed: {emp['tasksCompleted']}")
    
    # Verify sensitive fields are NOT present
    sensitive_fields = ['password', 'phone']
    for field in sensitive_fields:
        assert field not in emp, f"Sensitive field '{field}' should not be exposed"
    
    print(f"   ✅ Sensitive fields (password, phone) NOT exposed")
    
    # Test with invalid ID (should return 404)
    print(f"\n🔒 Testing with invalid employee ID (should fail with 404)...")
    r = requests.get(f"{API_URL}/employees/invalid-id-12345/self")
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    print(f"   ✅ Correctly returned 404 (not found)")

# ============================================================================
# RUN ALL TESTS
# ============================================================================

print("\n" + "="*80)
print("🚀 STARTING BACKEND TESTS")
print("="*80)

# Setup
test("Setup: Get Employee Data", setup_get_employee)

# Task Workflow Tests
test("1. Task Creation with Auto-Notification", test_task_creation_with_notification)
test("2. Task Accept (Employee)", test_task_accept)
test("3. Task Accept - Validation Tests", test_task_accept_validation)
test("4. Task Reject with Reason", test_task_reject)
test("5. Task Complete (Submit Report)", test_task_complete)
test("6. Task Review - Approve with Rating", test_task_review_approve)
test("7. Task Review - Revise (back to in_progress)", test_task_review_revise)
test("8. Task Review - Invalid Action", test_task_review_invalid_action)

# Notifications Tests
test("9. Notifications - GET with userId", test_notifications_get)
test("10. Notifications - Mark Single as Read", test_notifications_mark_read)
test("11. Notifications - Mark All as Read", test_notifications_mark_all_read)

# File Upload Test
test("12. File Upload", test_file_upload)

# Privacy Test
test("13. Employee Self (Privacy)", test_employee_self)

# ============================================================================
# SUMMARY
# ============================================================================

print("\n" + "="*80)
print("📊 TEST SUMMARY")
print("="*80)

for result in test_results:
    print(result)

print(f"\n{'='*80}")
print(f"✅ PASSED: {tests_passed}")
print(f"❌ FAILED: {tests_failed}")
print(f"📊 TOTAL:  {tests_passed + tests_failed}")
print(f"{'='*80}")

if tests_failed == 0:
    print("\n🎉 ALL TESTS PASSED! 🎉")
else:
    print(f"\n⚠️  {tests_failed} TEST(S) FAILED")

exit(0 if tests_failed == 0 else 1)
