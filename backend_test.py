#!/usr/bin/env python3
"""
Backend API Testing Script for WhatsApp Enhancement Features
Tests all new WhatsApp endpoints added to the ISP NOC Hub ERP system
"""

import requests
import json
from datetime import datetime

# Backend URL from .env
BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message, data=None):
    status = "✅ PASSED" if success else "❌ FAILED"
    print(f"{status}: {message}")
    if data:
        print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")

def test_whatsapp_stats():
    """Test 1: GET /api/whatsapp/stats - Should return 200 with all 5 counters"""
    print_test_header("GET /api/whatsapp/stats")
    
    try:
        response = requests.get(f"{BASE_URL}/whatsapp/stats", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}", response.text)
            return False
        
        data = response.json()
        
        # Verify all 5 counters exist and are numbers
        required_fields = ['totalSent', 'totalFailed', 'totalQueued', 'todaySent', 'weekSent']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Missing fields: {missing_fields}", data)
            return False
        
        # Verify all are numbers
        non_numeric = [f for f in required_fields if not isinstance(data[f], (int, float))]
        if non_numeric:
            print_result(False, f"Non-numeric fields: {non_numeric}", data)
            return False
        
        print_result(True, f"All 5 counters present and numeric", data)
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_whatsapp_history():
    """Test 2: GET /api/whatsapp/history/:subscriberId - Should return 200 with array"""
    print_test_header("GET /api/whatsapp/history/:subscriberId")
    
    try:
        # First get a real subscriber ID
        print("Step 1: Getting subscriber list...")
        subs_response = requests.get(f"{BASE_URL}/subscribers", timeout=10)
        
        if subs_response.status_code != 200:
            print_result(False, f"Failed to get subscribers: {subs_response.status_code}")
            return False
        
        subscribers = subs_response.json()
        if not subscribers or len(subscribers) == 0:
            print_result(False, "No subscribers found in database")
            return False
        
        # Pick first subscriber with a phone
        subscriber = None
        for sub in subscribers:
            if sub.get('phone'):
                subscriber = sub
                break
        
        if not subscriber:
            print_result(False, "No subscriber with phone found")
            return False
        
        subscriber_id = subscriber['id']
        subscriber_name = subscriber.get('name', 'Unknown')
        print(f"Step 2: Testing with subscriber: {subscriber_name} (ID: {subscriber_id})")
        
        # Now test the history endpoint
        response = requests.get(f"{BASE_URL}/whatsapp/history/{subscriber_id}", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}", response.text)
            return False
        
        data = response.json()
        
        if not isinstance(data, list):
            print_result(False, f"Expected array, got {type(data)}", data)
            return False
        
        print_result(True, f"Returns array with {len(data)} messages for subscriber {subscriber_name}", 
                    {"subscriberId": subscriber_id, "messageCount": len(data), "sample": data[:2] if data else []})
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_whatsapp_test_send():
    """Test 3: POST /api/whatsapp/test-send - Should return 200 with success shape"""
    print_test_header("POST /api/whatsapp/test-send")
    
    try:
        payload = {
            "phone": "07901234567",
            "message": "Test ping from automated testing"
        }
        
        response = requests.post(f"{BASE_URL}/whatsapp/test-send", json=payload, timeout=10)
        
        if response.status_code == 500:
            print_result(False, "Got 500 error - endpoint crashed", response.text)
            return False
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}", response.text)
            return False
        
        data = response.json()
        
        # Should have success field
        if 'success' not in data:
            print_result(False, "Missing 'success' field", data)
            return False
        
        print_result(True, f"Test send completed with success={data.get('success')}", data)
        
        # Verify message was persisted
        print("\nStep 2: Verifying message was persisted in DB...")
        messages_response = requests.get(f"{BASE_URL}/whatsapp/messages?type=test&limit=5", timeout=10)
        
        if messages_response.status_code == 200:
            messages = messages_response.json()
            test_messages = [m for m in messages if m.get('type') == 'test']
            print_result(True, f"Found {len(test_messages)} test messages in DB", 
                        {"latestTestMessage": test_messages[0] if test_messages else None})
        else:
            print_result(False, f"Failed to verify persistence: {messages_response.status_code}")
        
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_whatsapp_resend_failed():
    """Test 4: POST /api/whatsapp/resend-failed - Should return 200 with correct shape"""
    print_test_header("POST /api/whatsapp/resend-failed")
    
    try:
        response = requests.post(f"{BASE_URL}/whatsapp/resend-failed", json={}, timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}", response.text)
            return False
        
        data = response.json()
        
        # Verify shape: {success, total, sent, failed}
        required_fields = ['success', 'total', 'sent', 'failed']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Missing fields: {missing_fields}", data)
            return False
        
        if not isinstance(data['success'], bool):
            print_result(False, "'success' should be boolean", data)
            return False
        
        for field in ['total', 'sent', 'failed']:
            if not isinstance(data[field], (int, float)):
                print_result(False, f"'{field}' should be numeric", data)
                return False
        
        print_result(True, f"Resend-failed completed: total={data['total']}, sent={data['sent']}, failed={data['failed']}", data)
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_whatsapp_run_expiry_alerts():
    """Test 5: POST /api/whatsapp/run-expiry-alerts - Should return 200 with correct shape"""
    print_test_header("POST /api/whatsapp/run-expiry-alerts")
    
    try:
        # First, get count of active subscribers expiring in next 30 days
        print("Step 1: Getting active subscribers expiring in next 30 days...")
        subs_response = requests.get(f"{BASE_URL}/subscribers", timeout=10)
        
        if subs_response.status_code != 200:
            print_result(False, f"Failed to get subscribers: {subs_response.status_code}")
            return False
        
        subscribers = subs_response.json()
        
        # Filter: status='active' AND endDate within next 30 days
        from datetime import datetime, timedelta
        now = datetime.now()
        future_30_days = now + timedelta(days=30)
        
        expiring_count = 0
        for sub in subscribers:
            if sub.get('status') == 'active' and sub.get('endDate'):
                try:
                    end_date = datetime.fromisoformat(sub['endDate'].replace('Z', '+00:00'))
                    if now <= end_date <= future_30_days:
                        expiring_count += 1
                except:
                    pass
        
        print(f"Expected subscribers expiring in next 30 days: {expiring_count}")
        
        # Now test the endpoint
        payload = {"daysAhead": 30}
        response = requests.post(f"{BASE_URL}/whatsapp/run-expiry-alerts", json=payload, timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}", response.text)
            return False
        
        data = response.json()
        
        # Verify shape: {success, total, sent, failed, daysAhead}
        required_fields = ['success', 'total', 'sent', 'failed', 'daysAhead']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Missing fields: {missing_fields}", data)
            return False
        
        if data['daysAhead'] != 30:
            print_result(False, f"daysAhead should be 30, got {data['daysAhead']}", data)
            return False
        
        print_result(True, f"Expiry alerts completed: total={data['total']}, sent={data['sent']}, failed={data['failed']}, daysAhead={data['daysAhead']}", data)
        
        # Verify count matches (approximately - may differ if some don't have phones)
        if data['total'] > expiring_count:
            print(f"⚠️  WARNING: API returned more subscribers ({data['total']}) than expected ({expiring_count})")
        
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_whatsapp_run_debt_reminders():
    """Test 6: POST /api/whatsapp/run-debt-reminders - Should return 200 with correct shape"""
    print_test_header("POST /api/whatsapp/run-debt-reminders")
    
    try:
        # First, get count of subscribers with debt > 0
        print("Step 1: Getting subscribers with debt > 0...")
        subs_response = requests.get(f"{BASE_URL}/subscribers", timeout=10)
        
        if subs_response.status_code != 200:
            print_result(False, f"Failed to get subscribers: {subs_response.status_code}")
            return False
        
        subscribers = subs_response.json()
        
        debt_count = sum(1 for sub in subscribers if sub.get('debt', 0) > 0)
        print(f"Expected subscribers with debt > 0: {debt_count}")
        
        # Now test the endpoint
        response = requests.post(f"{BASE_URL}/whatsapp/run-debt-reminders", json={}, timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}", response.text)
            return False
        
        data = response.json()
        
        # Verify shape: {success, total, sent, failed, batchId}
        required_fields = ['success', 'total', 'sent', 'failed', 'batchId']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Missing fields: {missing_fields}", data)
            return False
        
        print_result(True, f"Debt reminders completed: total={data['total']}, sent={data['sent']}, failed={data['failed']}, batchId={data['batchId']}", data)
        
        # Verify count matches (approximately - may differ if some don't have phones)
        if data['total'] > debt_count:
            print(f"⚠️  WARNING: API returned more subscribers ({data['total']}) than expected ({debt_count})")
        
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_regression_endpoints():
    """Test 7: Regression tests - Ensure no regression from new code"""
    print_test_header("REGRESSION TESTS")
    
    results = {}
    
    # Test 1: Dashboard stats
    try:
        print("\n1. Testing GET /api/dashboard/stats...")
        response = requests.get(f"{BASE_URL}/dashboard/stats", timeout=10)
        results['dashboard_stats'] = response.status_code == 200
        print_result(results['dashboard_stats'], f"Dashboard stats: {response.status_code}")
    except Exception as e:
        results['dashboard_stats'] = False
        print_result(False, f"Dashboard stats exception: {str(e)}")
    
    # Test 2: WhatsApp status
    try:
        print("\n2. Testing GET /api/whatsapp/status...")
        response = requests.get(f"{BASE_URL}/whatsapp/status", timeout=10)
        results['whatsapp_status'] = response.status_code == 200
        if response.status_code == 200:
            data = response.json()
            status = data.get('status')
            phone = data.get('phone')
            print_result(True, f"WhatsApp status: {status}, phone: {phone}", data)
        else:
            print_result(False, f"WhatsApp status: {response.status_code}")
    except Exception as e:
        results['whatsapp_status'] = False
        print_result(False, f"WhatsApp status exception: {str(e)}")
    
    # Test 3: WhatsApp templates
    try:
        print("\n3. Testing GET /api/whatsapp/templates...")
        response = requests.get(f"{BASE_URL}/whatsapp/templates", timeout=10)
        results['whatsapp_templates'] = response.status_code == 200
        if response.status_code == 200:
            data = response.json()
            template_count = len(data)
            print_result(True, f"WhatsApp templates: {template_count} templates found", {"count": template_count, "templates": list(data.keys())})
        else:
            print_result(False, f"WhatsApp templates: {response.status_code}")
    except Exception as e:
        results['whatsapp_templates'] = False
        print_result(False, f"WhatsApp templates exception: {str(e)}")
    
    # Test 4: Subscribers
    try:
        print("\n4. Testing GET /api/subscribers...")
        response = requests.get(f"{BASE_URL}/subscribers", timeout=10)
        results['subscribers'] = response.status_code == 200
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Subscribers: {len(data)} subscribers found")
        else:
            print_result(False, f"Subscribers: {response.status_code}")
    except Exception as e:
        results['subscribers'] = False
        print_result(False, f"Subscribers exception: {str(e)}")
    
    all_passed = all(results.values())
    print(f"\n{'='*80}")
    print(f"REGRESSION SUMMARY: {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    print(f"{'='*80}")
    for endpoint, passed in results.items():
        print(f"  {endpoint}: {'✅' if passed else '❌'}")
    
    return all_passed

def main():
    print(f"""
╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║           WhatsApp Enhancement Features - Backend API Testing                 ║
║                                                                                ║
║  Testing Backend URL: {BASE_URL}                                              ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
""")
    
    results = {}
    
    # Run all tests
    results['whatsapp_stats'] = test_whatsapp_stats()
    results['whatsapp_history'] = test_whatsapp_history()
    results['whatsapp_test_send'] = test_whatsapp_test_send()
    results['whatsapp_resend_failed'] = test_whatsapp_resend_failed()
    results['whatsapp_run_expiry_alerts'] = test_whatsapp_run_expiry_alerts()
    results['whatsapp_run_debt_reminders'] = test_whatsapp_run_debt_reminders()
    results['regression'] = test_regression_endpoints()
    
    # Final summary
    print(f"\n\n{'='*80}")
    print(f"FINAL TEST SUMMARY")
    print(f"{'='*80}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed")
    print(f"{'='*80}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! WhatsApp enhancement features are working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the failures above.")
        return 1

if __name__ == "__main__":
    exit(main())
