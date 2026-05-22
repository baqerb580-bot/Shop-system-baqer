#!/usr/bin/env python3
"""
Backend Test Script for Module D - Advanced Tasks (Recurring Tasks Auto-Spawn)
Tests the recurring tasks feature with 9 comprehensive test cases.
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test employee IDs (from review request)
EMP_ID_1 = "de57c5eb-40fb-4d5d-a3e4-302b0ce2d2a7"  # نعمة طالب طاهر
EMP_ID_2 = "80b475dc-bfb3-435e-b98f-4618f796fb74"  # امير بهاء الدين علي

def log_test(test_num, description):
    """Print test header"""
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {description}")
    print(f"{'='*80}")

def log_result(success, message):
    """Print test result"""
    status = "✅ PASSED" if success else "❌ FAILED"
    print(f"{status}: {message}")

def get_date_str(days_offset=0):
    """Get date string in YYYY-MM-DD format"""
    return (datetime.now() + timedelta(days=days_offset)).strftime('%Y-%m-%d')

def create_task(title, task_type, priority, due_date, assigned_to, recurrence=None):
    """Helper to create a task"""
    payload = {
        "title": title,
        "taskType": task_type,
        "priority": priority,
        "dueDate": due_date,
        "assignedTo": assigned_to,
        "description": "Test task for recurring feature"
    }
    if recurrence:
        payload["recurrence"] = recurrence
    
    response = requests.post(f"{BASE_URL}/tasks", json=payload, headers=HEADERS)
    return response

def get_task(task_id):
    """Helper to get a task by ID"""
    response = requests.get(f"{BASE_URL}/tasks", headers=HEADERS)
    if response.status_code == 200:
        tasks = response.json()
        for task in tasks:
            if task.get('id') == task_id:
                return task
    return None

def admin_complete_task(task_id, user_id, user_name, note="انتهيت"):
    """Helper to admin-complete a task"""
    payload = {
        "userId": user_id,
        "userName": user_name,
        "note": note
    }
    response = requests.post(f"{BASE_URL}/tasks/{task_id}/admin-complete", json=payload, headers=HEADERS)
    return response

def set_task_status(task_id, status):
    """Helper to update task status"""
    payload = {"status": status}
    response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=payload, headers=HEADERS)
    return response

def review_task(task_id, action, reviewer_name="المدير"):
    """Helper to review a task"""
    payload = {
        "action": action,
        "reviewerName": reviewer_name
    }
    response = requests.post(f"{BASE_URL}/tasks/{task_id}/review", json=payload, headers=HEADERS)
    return response

def find_spawned_task(original_task_id):
    """Find a task spawned from the original task"""
    response = requests.get(f"{BASE_URL}/tasks", headers=HEADERS)
    if response.status_code == 200:
        tasks = response.json()
        for task in tasks:
            if task.get('spawnedFromTaskId') == original_task_id:
                return task
    return None

def get_notifications_for_user(user_id):
    """Get notifications for a specific user"""
    response = requests.get(f"{BASE_URL}/notifications?userId={user_id}", headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    return []

# ============================================================================
# TEST 1: Create task with recurrence (weekly, every 1)
# ============================================================================
def test_1():
    log_test(1, "Create task with recurrence (weekly, every 1)")
    
    try:
        due_date = get_date_str(3)  # 3 days from now (2026-05-22)
        recurrence = {
            "enabled": True,
            "type": "weekly",
            "interval": 1
        }
        
        response = create_task(
            title="مهمة دورية",
            task_type="general",
            priority="medium",
            due_date=due_date,
            assigned_to=EMP_ID_1,
            recurrence=recurrence
        )
        
        if response.status_code in [200, 201]:
            task = response.json()
            task_id = task.get('id')
            
            # Verify recurrence object is preserved
            if task.get('recurrence'):
                rec = task['recurrence']
                if rec.get('enabled') and rec.get('type') == 'weekly' and rec.get('interval') == 1:
                    log_result(True, f"Task created with recurrence preserved. Task ID: {task_id}")
                    return task_id
                else:
                    log_result(False, f"Recurrence object not correct: {rec}")
                    return None
            else:
                log_result(False, "Recurrence object missing in response")
                return None
        else:
            log_result(False, f"Failed to create task. Status: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        log_result(False, f"Exception: {str(e)}")
        return None

# ============================================================================
# TEST 2: Admin-complete a recurring task → next instance auto-created
# ============================================================================
def test_2(task_id):
    log_test(2, "Admin-complete a recurring task → next instance auto-created")
    
    if not task_id:
        log_result(False, "No task ID from Test 1")
        return None
    
    try:
        # Get original task details
        original_task = get_task(task_id)
        if not original_task:
            log_result(False, f"Could not find task {task_id}")
            return None
        
        original_due_date = original_task.get('dueDate')
        print(f"Original task due date: {original_due_date}")
        
        # Admin-complete the task
        response = admin_complete_task(task_id, EMP_ID_1, "نعمة طالب طاهر", "انتهيت")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
            # Check for spawnedTaskId in response
            spawned_task_id = result.get('spawnedTaskId')
            if spawned_task_id:
                log_result(True, f"Task completed. Spawned task ID: {spawned_task_id}")
                
                # Verify the spawned task exists
                time.sleep(1)  # Give DB time to sync
                spawned_task = get_task(spawned_task_id)
                
                if spawned_task:
                    print(f"\nSpawned task details:")
                    print(f"  - ID: {spawned_task.get('id')}")
                    print(f"  - Status: {spawned_task.get('status')}")
                    print(f"  - Progress: {spawned_task.get('progress')}")
                    print(f"  - Due Date: {spawned_task.get('dueDate')}")
                    print(f"  - Spawned From: {spawned_task.get('spawnedFromTaskId')}")
                    print(f"  - Recurrence: {spawned_task.get('recurrence')}")
                    
                    # Verify spawned task properties
                    checks = []
                    checks.append(("Status is 'pending'", spawned_task.get('status') == 'pending'))
                    checks.append(("Progress is 0", spawned_task.get('progress') == 0))
                    checks.append(("spawnedFromTaskId is set", spawned_task.get('spawnedFromTaskId') == task_id))
                    checks.append(("Recurrence preserved", spawned_task.get('recurrence', {}).get('enabled') == True))
                    
                    # Check due date is 7 days after original
                    if original_due_date:
                        expected_date = (datetime.strptime(original_due_date, '%Y-%m-%d') + timedelta(days=7)).strftime('%Y-%m-%d')
                        actual_date = spawned_task.get('dueDate')
                        checks.append((f"Due date is 7 days later ({expected_date})", actual_date == expected_date))
                    
                    all_passed = all(check[1] for check in checks)
                    for check_name, check_result in checks:
                        status = "✓" if check_result else "✗"
                        print(f"  {status} {check_name}")
                    
                    if all_passed:
                        log_result(True, "All spawned task properties verified")
                    else:
                        log_result(False, "Some spawned task properties incorrect")
                    
                    # Check for notification
                    notifications = get_notifications_for_user(EMP_ID_1)
                    recurring_notif = [n for n in notifications if n.get('icon') == '🔁']
                    if recurring_notif:
                        print(f"  ✓ Notification created with icon '🔁'")
                    else:
                        print(f"  ✗ No notification with icon '🔁' found")
                    
                    return spawned_task_id
                else:
                    log_result(False, f"Spawned task {spawned_task_id} not found in database")
                    return None
            else:
                log_result(False, f"No spawnedTaskId in response: {result}")
                return None
        else:
            log_result(False, f"Failed to complete task. Status: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        log_result(False, f"Exception: {str(e)}")
        return None

# ============================================================================
# TEST 3: Daily recurrence (interval=2)
# ============================================================================
def test_3():
    log_test(3, "Daily recurrence (interval=2)")
    
    try:
        due_date = get_date_str(10)  # 2026-06-01 (10 days from now)
        recurrence = {
            "enabled": True,
            "type": "daily",
            "interval": 2
        }
        
        response = create_task(
            title="مهمة يومية كل يومين",
            task_type="general",
            priority="low",
            due_date=due_date,
            assigned_to=EMP_ID_2,
            recurrence=recurrence
        )
        
        if response.status_code in [200, 201]:
            task = response.json()
            task_id = task.get('id')
            print(f"Created task ID: {task_id}, Due date: {due_date}")
            
            # Complete the task
            response = admin_complete_task(task_id, EMP_ID_2, "امير بهاء الدين علي")
            
            if response.status_code == 200:
                result = response.json()
                spawned_task_id = result.get('spawnedTaskId')
                
                if spawned_task_id:
                    time.sleep(1)
                    spawned_task = get_task(spawned_task_id)
                    
                    if spawned_task:
                        expected_date = (datetime.strptime(due_date, '%Y-%m-%d') + timedelta(days=2)).strftime('%Y-%m-%d')
                        actual_date = spawned_task.get('dueDate')
                        
                        print(f"Expected due date: {expected_date}")
                        print(f"Actual due date: {actual_date}")
                        
                        if actual_date == expected_date:
                            log_result(True, f"Daily recurrence working. Next due date is 2 days later: {actual_date}")
                            return True
                        else:
                            log_result(False, f"Due date mismatch. Expected: {expected_date}, Got: {actual_date}")
                            return False
                    else:
                        log_result(False, "Spawned task not found")
                        return False
                else:
                    log_result(False, "No spawned task ID returned")
                    return False
            else:
                log_result(False, f"Failed to complete task. Status: {response.status_code}")
                return False
        else:
            log_result(False, f"Failed to create task. Status: {response.status_code}")
            return False
    except Exception as e:
        log_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 4: Monthly recurrence
# ============================================================================
def test_4():
    log_test(4, "Monthly recurrence")
    
    try:
        # Use a fixed date for monthly calculation
        due_date = "2026-01-15"
        recurrence = {
            "enabled": True,
            "type": "monthly",
            "interval": 1
        }
        
        response = create_task(
            title="مهمة شهرية",
            task_type="general",
            priority="medium",
            due_date=due_date,
            assigned_to=EMP_ID_1,
            recurrence=recurrence
        )
        
        if response.status_code in [200, 201]:
            task = response.json()
            task_id = task.get('id')
            print(f"Created task ID: {task_id}, Due date: {due_date}")
            
            # Complete the task
            response = admin_complete_task(task_id, EMP_ID_1, "نعمة طالب طاهر")
            
            if response.status_code == 200:
                result = response.json()
                spawned_task_id = result.get('spawnedTaskId')
                
                if spawned_task_id:
                    time.sleep(1)
                    spawned_task = get_task(spawned_task_id)
                    
                    if spawned_task:
                        expected_date = "2026-02-15"  # 1 month later
                        actual_date = spawned_task.get('dueDate')
                        
                        print(f"Expected due date: {expected_date}")
                        print(f"Actual due date: {actual_date}")
                        
                        if actual_date == expected_date:
                            log_result(True, f"Monthly recurrence working. Next due date: {actual_date}")
                            return True
                        else:
                            log_result(False, f"Due date mismatch. Expected: {expected_date}, Got: {actual_date}")
                            return False
                    else:
                        log_result(False, "Spawned task not found")
                        return False
                else:
                    log_result(False, "No spawned task ID returned")
                    return False
            else:
                log_result(False, f"Failed to complete task. Status: {response.status_code}")
                return False
        else:
            log_result(False, f"Failed to create task. Status: {response.status_code}")
            return False
    except Exception as e:
        log_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 5: Recurrence with endDate boundary
# ============================================================================
def test_5():
    log_test(5, "Recurrence with endDate boundary")
    
    try:
        due_date = "2026-05-22"
        recurrence = {
            "enabled": True,
            "type": "weekly",
            "interval": 1,
            "endDate": "2026-05-23"  # Next would be 2026-05-29 which is > endDate
        }
        
        response = create_task(
            title="مهمة مع تاريخ انتهاء",
            task_type="general",
            priority="high",
            due_date=due_date,
            assigned_to=EMP_ID_2,
            recurrence=recurrence
        )
        
        if response.status_code in [200, 201]:
            task = response.json()
            task_id = task.get('id')
            print(f"Created task ID: {task_id}")
            print(f"Due date: {due_date}, End date: {recurrence['endDate']}")
            
            # Complete the task
            response = admin_complete_task(task_id, EMP_ID_2, "امير بهاء الدين علي")
            
            if response.status_code == 200:
                result = response.json()
                spawned_task_id = result.get('spawnedTaskId')
                
                print(f"Spawned task ID: {spawned_task_id}")
                
                if spawned_task_id is None:
                    log_result(True, "No new task created (correctly stopped at endDate)")
                    return True
                else:
                    log_result(False, f"Task was spawned when it shouldn't be. Spawned ID: {spawned_task_id}")
                    return False
            else:
                log_result(False, f"Failed to complete task. Status: {response.status_code}")
                return False
        else:
            log_result(False, f"Failed to create task. Status: {response.status_code}")
            return False
    except Exception as e:
        log_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 6: Non-recurring task (regression)
# ============================================================================
def test_6():
    log_test(6, "Non-recurring task (regression)")
    
    try:
        due_date = get_date_str(5)
        
        # Create task WITHOUT recurrence
        response = create_task(
            title="مهمة عادية بدون تكرار",
            task_type="general",
            priority="low",
            due_date=due_date,
            assigned_to=EMP_ID_1,
            recurrence=None
        )
        
        if response.status_code in [200, 201]:
            task = response.json()
            task_id = task.get('id')
            print(f"Created non-recurring task ID: {task_id}")
            
            # Complete the task
            response = admin_complete_task(task_id, EMP_ID_1, "نعمة طالب طاهر")
            
            if response.status_code == 200:
                result = response.json()
                spawned_task_id = result.get('spawnedTaskId')
                
                print(f"Spawned task ID: {spawned_task_id}")
                
                if spawned_task_id is None:
                    log_result(True, "No task spawned for non-recurring task (correct)")
                    return True
                else:
                    log_result(False, f"Task was spawned when it shouldn't be. Spawned ID: {spawned_task_id}")
                    return False
            else:
                log_result(False, f"Failed to complete task. Status: {response.status_code}")
                return False
        else:
            log_result(False, f"Failed to create task. Status: {response.status_code}")
            return False
    except Exception as e:
        log_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 7: Approve via review → also spawns
# ============================================================================
def test_7():
    log_test(7, "Approve via review → also spawns")
    
    try:
        due_date = get_date_str(2)
        recurrence = {
            "enabled": True,
            "type": "weekly",
            "interval": 1
        }
        
        # Create recurring task
        response = create_task(
            title="مهمة للمراجعة",
            task_type="general",
            priority="high",
            due_date=due_date,
            assigned_to=EMP_ID_1,
            recurrence=recurrence
        )
        
        if response.status_code in [200, 201]:
            task = response.json()
            task_id = task.get('id')
            print(f"Created task ID: {task_id}")
            
            # Change status to pending_review
            set_response = set_task_status(task_id, "pending_review")
            if set_response.status_code == 200:
                print("Task status changed to 'pending_review'")
            else:
                print(f"Warning: Could not set status to pending_review. Status: {set_response.status_code}")
            
            time.sleep(1)
            
            # Approve via review
            response = review_task(task_id, "approve", "المدير")
            
            if response.status_code == 200:
                result = response.json()
                spawned_task_id = result.get('spawnedTaskId')
                
                print(f"Review response: {json.dumps(result, ensure_ascii=False, indent=2)}")
                
                if spawned_task_id:
                    time.sleep(1)
                    spawned_task = get_task(spawned_task_id)
                    
                    if spawned_task:
                        log_result(True, f"Task approved and spawned. New task ID: {spawned_task_id}")
                        return True
                    else:
                        log_result(False, f"Spawned task {spawned_task_id} not found")
                        return False
                else:
                    log_result(False, "No spawned task ID in response")
                    return False
            else:
                log_result(False, f"Failed to approve task. Status: {response.status_code}, Response: {response.text}")
                return False
        else:
            log_result(False, f"Failed to create task. Status: {response.status_code}")
            return False
    except Exception as e:
        log_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 8: Reject via review → does NOT spawn
# ============================================================================
def test_8():
    log_test(8, "Reject via review → does NOT spawn")
    
    try:
        due_date = get_date_str(2)
        recurrence = {
            "enabled": True,
            "type": "weekly",
            "interval": 1
        }
        
        # Create recurring task
        response = create_task(
            title="مهمة للرفض",
            task_type="general",
            priority="medium",
            due_date=due_date,
            assigned_to=EMP_ID_2,
            recurrence=recurrence
        )
        
        if response.status_code in [200, 201]:
            task = response.json()
            task_id = task.get('id')
            print(f"Created task ID: {task_id}")
            
            # Change status to pending_review
            set_response = set_task_status(task_id, "pending_review")
            if set_response.status_code == 200:
                print("Task status changed to 'pending_review'")
            
            time.sleep(1)
            
            # Reject via review
            response = review_task(task_id, "reject", "المدير")
            
            if response.status_code == 200:
                result = response.json()
                spawned_task_id = result.get('spawnedTaskId')
                
                print(f"Review response: {json.dumps(result, ensure_ascii=False, indent=2)}")
                
                if spawned_task_id is None:
                    log_result(True, "Task rejected and no spawn occurred (correct)")
                    return True
                else:
                    log_result(False, f"Task was spawned when it shouldn't be. Spawned ID: {spawned_task_id}")
                    return False
            else:
                log_result(False, f"Failed to reject task. Status: {response.status_code}")
                return False
        else:
            log_result(False, f"Failed to create task. Status: {response.status_code}")
            return False
    except Exception as e:
        log_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 9: Time tracking fields
# ============================================================================
def test_9():
    log_test(9, "Time tracking fields")
    
    try:
        due_date = get_date_str(1)
        
        # Create task
        response = create_task(
            title="مهمة لاختبار الوقت",
            task_type="general",
            priority="high",
            due_date=due_date,
            assigned_to=EMP_ID_1,
            recurrence=None
        )
        
        if response.status_code in [200, 201]:
            task = response.json()
            task_id = task.get('id')
            print(f"Created task ID: {task_id}")
            
            # Start the task
            start_response = requests.post(f"{BASE_URL}/tasks/{task_id}/start", json={}, headers=HEADERS)
            if start_response.status_code == 200:
                print("Task started")
            else:
                print(f"Warning: Could not start task. Status: {start_response.status_code}")
            
            # Wait 1 second
            time.sleep(1)
            
            # Admin-complete the task
            response = admin_complete_task(task_id, EMP_ID_1, "نعمة طالب طاهر")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Complete response: {json.dumps(result, ensure_ascii=False, indent=2)}")
                
                # Check response fields
                has_completed_at = 'completedAt' in result
                has_duration = 'durationMin' in result
                duration_value = result.get('durationMin', -1)
                
                print(f"\nTime tracking fields:")
                print(f"  - completedAt: {result.get('completedAt', 'MISSING')}")
                print(f"  - durationMin: {duration_value}")
                
                # Verify task in database
                time.sleep(1)
                updated_task = get_task(task_id)
                
                if updated_task:
                    db_started_at = updated_task.get('startedAt')
                    db_completed_at = updated_task.get('completedAt')
                    db_duration = updated_task.get('durationMin')
                    
                    print(f"\nTask in database:")
                    print(f"  - startedAt: {db_started_at}")
                    print(f"  - completedAt: {db_completed_at}")
                    print(f"  - durationMin: {db_duration}")
                    
                    checks = []
                    checks.append(("Response has completedAt", has_completed_at))
                    checks.append(("Response has durationMin", has_duration))
                    checks.append(("durationMin >= 0", duration_value >= 0))
                    checks.append(("Task has startedAt", db_started_at is not None))
                    checks.append(("Task has completedAt", db_completed_at is not None))
                    checks.append(("Task has durationMin", db_duration is not None))
                    
                    all_passed = all(check[1] for check in checks)
                    for check_name, check_result in checks:
                        status = "✓" if check_result else "✗"
                        print(f"  {status} {check_name}")
                    
                    if all_passed:
                        log_result(True, "All time tracking fields verified")
                        return True
                    else:
                        log_result(False, "Some time tracking fields missing or incorrect")
                        return False
                else:
                    log_result(False, "Could not retrieve updated task from database")
                    return False
            else:
                log_result(False, f"Failed to complete task. Status: {response.status_code}")
                return False
        else:
            log_result(False, f"Failed to create task. Status: {response.status_code}")
            return False
    except Exception as e:
        log_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================
def main():
    print("\n" + "="*80)
    print("BACKEND TESTING: Module D - Advanced Tasks (Recurring Tasks Auto-Spawn)")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    results = {}
    
    # Test 1: Create recurring task
    task_id_1 = test_1()
    results['test_1'] = task_id_1 is not None
    
    # Test 2: Admin-complete and verify spawn
    if task_id_1:
        spawned_id = test_2(task_id_1)
        results['test_2'] = spawned_id is not None
    else:
        print("\n⚠️  Skipping Test 2 (depends on Test 1)")
        results['test_2'] = False
    
    # Test 3: Daily recurrence
    results['test_3'] = test_3()
    
    # Test 4: Monthly recurrence
    results['test_4'] = test_4()
    
    # Test 5: Recurrence with endDate
    results['test_5'] = test_5()
    
    # Test 6: Non-recurring task
    results['test_6'] = test_6()
    
    # Test 7: Approve via review
    results['test_7'] = test_7()
    
    # Test 8: Reject via review
    results['test_8'] = test_8()
    
    # Test 9: Time tracking
    results['test_9'] = test_9()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed ({passed*100//total}%)")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Recurring tasks feature is working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the output above.")
    
    print("="*80)

if __name__ == "__main__":
    main()
