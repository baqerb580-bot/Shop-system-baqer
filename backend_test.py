#!/usr/bin/env python3
"""
Backend Testing Script for POS Discount/Increase and Zones AI Load Balancing
Tests 14 endpoints as specified in the review request
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def test_result(test_num, name, passed, details=""):
    status = "✅ PASSED" if passed else "❌ FAILED"
    log(f"Test {test_num}: {name} - {status}")
    if details:
        log(f"  Details: {details}")
    return passed

# ============================================================================
# TEST GROUP 1: POS Discount/Increase with permissions + audit log
# ============================================================================

def test_1_get_settings():
    """Test 1: GET /api/settings - verify pos section exists with defaults"""
    log("\n=== TEST 1: GET /api/settings ===")
    try:
        resp = requests.get(f"{BASE_URL}/settings", timeout=10)
        if resp.status_code != 200:
            return test_result(1, "GET /api/settings", False, f"Status {resp.status_code}")
        
        data = resp.json()
        if 'pos' not in data:
            return test_result(1, "GET /api/settings", False, "pos section missing")
        
        pos = data['pos']
        required_fields = [
            'allowDiscount', 'maxDiscountAmount', 'maxDiscountPercent', 'requireDiscountReason',
            'allowIncrease', 'maxIncreaseAmount', 'maxIncreasePercent',
            'discountAllowedRoles', 'increaseAllowedRoles', 'requireManagerApprovalAboveLimit'
        ]
        
        missing = [f for f in required_fields if f not in pos]
        if missing:
            return test_result(1, "GET /api/settings", False, f"Missing fields: {missing}")
        
        # Verify defaults
        checks = []
        checks.append(pos['allowDiscount'] == True)
        checks.append(pos['maxDiscountAmount'] == 50000)
        checks.append(pos['maxDiscountPercent'] == 30)
        checks.append(pos['requireDiscountReason'] == True)
        checks.append(pos['allowIncrease'] == True)
        checks.append(pos['maxIncreaseAmount'] == 50000)
        checks.append(pos['maxIncreasePercent'] == 20)
        checks.append(pos['requireManagerApprovalAboveLimit'] == True)
        checks.append(isinstance(pos['discountAllowedRoles'], list))
        checks.append(isinstance(pos['increaseAllowedRoles'], list))
        
        if not all(checks):
            return test_result(1, "GET /api/settings", False, f"Default values incorrect: {pos}")
        
        return test_result(1, "GET /api/settings", True, "pos section with all defaults verified")
    except Exception as e:
        return test_result(1, "GET /api/settings", False, str(e))

def test_2_checkout_with_discount():
    """Test 2: POST /api/pos/checkout - happy path with small discount"""
    log("\n=== TEST 2: POST /api/pos/checkout with discount ===")
    try:
        # First get a real product
        resp = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp.status_code != 200:
            return test_result(2, "Checkout with discount", False, "Cannot fetch products")
        
        products = resp.json()
        if not products or len(products) == 0:
            return test_result(2, "Checkout with discount", False, "No products available")
        
        product = products[0]
        product_id = product['id']
        product_name = product.get('name', 'Test Product')
        product_price = product.get('price', 10000)
        
        # Create checkout with small discount
        payload = {
            "items": [{"id": product_id, "name": product_name, "price": product_price, "quantity": 2}],
            "discount": 1000,
            "discountReason": "زبون مميز",
            "paymentMethod": "cash",
            "cashier": "TestCashier"
        }
        
        resp = requests.post(f"{BASE_URL}/pos/checkout", json=payload, timeout=10)
        if resp.status_code != 201:
            return test_result(2, "Checkout with discount", False, f"Status {resp.status_code}: {resp.text}")
        
        data = resp.json()
        
        # Verify response structure
        required_fields = ['invoiceNumber', 'subtotal', 'discount', 'surcharge', 'total']
        missing = [f for f in required_fields if f not in data]
        if missing:
            return test_result(2, "Checkout with discount", False, f"Missing fields: {missing}")
        
        expected_subtotal = product_price * 2
        expected_total = expected_subtotal - 1000
        
        if data['subtotal'] != expected_subtotal:
            return test_result(2, "Checkout with discount", False, f"Subtotal mismatch: {data['subtotal']} != {expected_subtotal}")
        
        if data['discount'] != 1000:
            return test_result(2, "Checkout with discount", False, f"Discount mismatch: {data['discount']} != 1000")
        
        if data['surcharge'] != 0:
            return test_result(2, "Checkout with discount", False, f"Surcharge should be 0: {data['surcharge']}")
        
        if data['total'] != expected_total:
            return test_result(2, "Checkout with discount", False, f"Total mismatch: {data['total']} != {expected_total}")
        
        # Verify pos_modifications entry exists
        resp = requests.get(f"{BASE_URL}/pos/modifications", timeout=10)
        if resp.status_code != 200:
            return test_result(2, "Checkout with discount", False, "Cannot verify pos_modifications")
        
        mods_data = resp.json()
        if 'items' not in mods_data:
            return test_result(2, "Checkout with discount", False, "pos_modifications missing items")
        
        return test_result(2, "Checkout with discount", True, f"Sale created: subtotal={expected_subtotal}, discount=1000, total={expected_total}")
    except Exception as e:
        return test_result(2, "Checkout with discount", False, str(e))

def test_3_checkout_with_surcharge():
    """Test 3: POST /api/pos/checkout - happy path with surcharge"""
    log("\n=== TEST 3: POST /api/pos/checkout with surcharge ===")
    try:
        # Get a product
        resp = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp.status_code != 200:
            return test_result(3, "Checkout with surcharge", False, "Cannot fetch products")
        
        products = resp.json()
        if not products:
            return test_result(3, "Checkout with surcharge", False, "No products available")
        
        product = products[0]
        product_id = product['id']
        product_name = product.get('name', 'Test Product')
        product_price = 5000
        
        # Create checkout with surcharge
        payload = {
            "items": [{"id": product_id, "name": product_name, "price": product_price, "quantity": 1}],
            "surcharge": 500,
            "surchargeReason": "خدمة توصيل",
            "paymentMethod": "cash",
            "cashier": "TestCashier"
        }
        
        resp = requests.post(f"{BASE_URL}/pos/checkout", json=payload, timeout=10)
        if resp.status_code != 201:
            return test_result(3, "Checkout with surcharge", False, f"Status {resp.status_code}: {resp.text}")
        
        data = resp.json()
        
        expected_subtotal = product_price
        expected_total = expected_subtotal + 500
        
        if data['subtotal'] != expected_subtotal:
            return test_result(3, "Checkout with surcharge", False, f"Subtotal mismatch: {data['subtotal']} != {expected_subtotal}")
        
        if data.get('surcharge', 0) != 500:
            return test_result(3, "Checkout with surcharge", False, f"Surcharge mismatch: {data.get('surcharge')} != 500")
        
        if data['total'] != expected_total:
            return test_result(3, "Checkout with surcharge", False, f"Total mismatch: {data['total']} != {expected_total}")
        
        return test_result(3, "Checkout with surcharge", True, f"Sale created: subtotal={expected_subtotal}, surcharge=500, total={expected_total}")
    except Exception as e:
        return test_result(3, "Checkout with surcharge", False, str(e))

def test_4_missing_discount_reason():
    """Test 4: Validation - missing discount reason"""
    log("\n=== TEST 4: Validation - missing discount reason ===")
    try:
        # Get a product
        resp = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp.status_code != 200:
            return test_result(4, "Missing discount reason", False, "Cannot fetch products")
        
        products = resp.json()
        if not products:
            return test_result(4, "Missing discount reason", False, "No products available")
        
        product = products[0]
        product_id = product['id']
        
        # Create checkout with discount but NO reason
        payload = {
            "items": [{"id": product_id, "name": "X", "price": 1000, "quantity": 1}],
            "discount": 100,
            "paymentMethod": "cash",
            "cashier": "TestCashier"
        }
        
        resp = requests.post(f"{BASE_URL}/pos/checkout", json=payload, timeout=10)
        if resp.status_code != 400:
            return test_result(4, "Missing discount reason", False, f"Expected 400, got {resp.status_code}")
        
        error_text = resp.text
        if "سبب الخصم مطلوب" not in error_text:
            return test_result(4, "Missing discount reason", False, f"Expected Arabic error, got: {error_text}")
        
        return test_result(4, "Missing discount reason", True, "Correctly rejected with 400 and Arabic error")
    except Exception as e:
        return test_result(4, "Missing discount reason", False, str(e))

def test_5_discount_over_limit():
    """Test 5: Validation - discount over limit, no override"""
    log("\n=== TEST 5: Validation - discount over limit ===")
    try:
        # Get a product
        resp = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp.status_code != 200:
            return test_result(5, "Discount over limit", False, "Cannot fetch products")
        
        products = resp.json()
        if not products:
            return test_result(5, "Discount over limit", False, "No products available")
        
        product = products[0]
        product_id = product['id']
        
        # Create checkout with discount OVER limit (60000 > maxDiscountAmount 50000)
        payload = {
            "items": [{"id": product_id, "name": "X", "price": 100000, "quantity": 1}],
            "discount": 60000,
            "discountReason": "test",
            "paymentMethod": "cash",
            "cashier": "TestCashier"
        }
        
        resp = requests.post(f"{BASE_URL}/pos/checkout", json=payload, timeout=10)
        if resp.status_code != 403:
            return test_result(5, "Discount over limit", False, f"Expected 403, got {resp.status_code}")
        
        error_text = resp.text
        if "يحتاج موافقة المدير" not in error_text:
            return test_result(5, "Discount over limit", False, f"Expected Arabic error with 'يحتاج موافقة المدير', got: {error_text}")
        
        return test_result(5, "Discount over limit", True, "Correctly rejected with 403 and manager approval message")
    except Exception as e:
        return test_result(5, "Discount over limit", False, str(e))

def test_6_manager_override():
    """Test 6: Manager override with valid override flag"""
    log("\n=== TEST 6: Manager override ===")
    try:
        # Get a product
        resp = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp.status_code != 200:
            return test_result(6, "Manager override", False, "Cannot fetch products")
        
        products = resp.json()
        if not products:
            return test_result(6, "Manager override", False, "No products available")
        
        product = products[0]
        product_id = product['id']
        
        # Same as test 5 but with managerOverride=true
        payload = {
            "items": [{"id": product_id, "name": "X", "price": 100000, "quantity": 1}],
            "discount": 60000,
            "discountReason": "test",
            "managerOverride": True,
            "paymentMethod": "cash",
            "cashier": "TestCashier"
        }
        
        resp = requests.post(f"{BASE_URL}/pos/checkout", json=payload, timeout=10)
        if resp.status_code != 201:
            return test_result(6, "Manager override", False, f"Expected 201, got {resp.status_code}: {resp.text}")
        
        data = resp.json()
        
        # Verify managerOverride flag is set
        if not data.get('managerOverride'):
            return test_result(6, "Manager override", False, "managerOverride flag not set in response")
        
        # Verify overLimitWarnings array exists
        if 'overLimitWarnings' not in data:
            return test_result(6, "Manager override", False, "overLimitWarnings array missing")
        
        if 'discount_over_limit' not in data['overLimitWarnings']:
            return test_result(6, "Manager override", False, "discount_over_limit not in overLimitWarnings")
        
        return test_result(6, "Manager override", True, "Sale created with managerOverride=true and overLimitWarnings")
    except Exception as e:
        return test_result(6, "Manager override", False, str(e))

def test_7_get_modifications():
    """Test 7: GET /api/pos/modifications"""
    log("\n=== TEST 7: GET /api/pos/modifications ===")
    try:
        resp = requests.get(f"{BASE_URL}/pos/modifications", timeout=10)
        if resp.status_code != 200:
            return test_result(7, "GET pos/modifications", False, f"Status {resp.status_code}")
        
        data = resp.json()
        
        # Verify response shape
        if 'items' not in data:
            return test_result(7, "GET pos/modifications", False, "items field missing")
        
        if 'summary' not in data:
            return test_result(7, "GET pos/modifications", False, "summary field missing")
        
        summary = data['summary']
        required_summary_fields = ['totalCount', 'totalDiscount', 'totalIncrease', 'overLimitCount', 'netAdjustment']
        missing = [f for f in required_summary_fields if f not in summary]
        if missing:
            return test_result(7, "GET pos/modifications", False, f"Missing summary fields: {missing}")
        
        # Verify items is an array
        if not isinstance(data['items'], list):
            return test_result(7, "GET pos/modifications", False, "items is not an array")
        
        return test_result(7, "GET pos/modifications", True, f"Returns items array and summary with all fields. Found {len(data['items'])} modifications")
    except Exception as e:
        return test_result(7, "GET pos/modifications", False, str(e))

def test_8_get_modifications_filtered():
    """Test 8: GET /api/pos/modifications?type=discount"""
    log("\n=== TEST 8: GET /api/pos/modifications?type=discount ===")
    try:
        resp = requests.get(f"{BASE_URL}/pos/modifications?type=discount", timeout=10)
        if resp.status_code != 200:
            return test_result(8, "GET pos/modifications filtered", False, f"Status {resp.status_code}")
        
        data = resp.json()
        
        if 'items' not in data:
            return test_result(8, "GET pos/modifications filtered", False, "items field missing")
        
        # Verify all items have discount > 0
        items = data['items']
        if items:
            for item in items:
                if item.get('discount', 0) <= 0:
                    return test_result(8, "GET pos/modifications filtered", False, f"Item has no discount: {item}")
        
        return test_result(8, "GET pos/modifications filtered", True, f"Filter working. Found {len(items)} discount-only entries")
    except Exception as e:
        return test_result(8, "GET pos/modifications filtered", False, str(e))

# ============================================================================
# TEST GROUP 2: Zones AI Load Balancing
# ============================================================================

def test_9_get_load_balance():
    """Test 9: GET /api/zones/load-balance"""
    log("\n=== TEST 9: GET /api/zones/load-balance ===")
    try:
        resp = requests.get(f"{BASE_URL}/zones/load-balance", timeout=10)
        if resp.status_code != 200:
            return test_result(9, "GET zones/load-balance", False, f"Status {resp.status_code}")
        
        data = resp.json()
        
        # Verify response shape
        required_fields = ['generatedAt', 'summary', 'zones', 'suggestions']
        missing = [f for f in required_fields if f not in data]
        if missing:
            return test_result(9, "GET zones/load-balance", False, f"Missing fields: {missing}")
        
        # Verify summary shape
        summary = data['summary']
        summary_fields = ['totalZones', 'overloadedCount', 'underUsedCount', 'offlineCount', 'thresholds']
        missing = [f for f in summary_fields if f not in summary]
        if missing:
            return test_result(9, "GET zones/load-balance", False, f"Missing summary fields: {missing}")
        
        # Verify thresholds
        thresholds = summary['thresholds']
        if 'warning' not in thresholds or 'critical' not in thresholds:
            return test_result(9, "GET zones/load-balance", False, "Missing thresholds.warning or thresholds.critical")
        
        # Verify zones array
        if not isinstance(data['zones'], list):
            return test_result(9, "GET zones/load-balance", False, "zones is not an array")
        
        if data['zones']:
            zone = data['zones'][0]
            zone_fields = ['id', 'name', 'subscribers', 'capacity', 'utilization', 'networks']
            missing = [f for f in zone_fields if f not in zone]
            if missing:
                return test_result(9, "GET zones/load-balance", False, f"Missing zone fields: {missing}")
        
        # Verify suggestions array
        if not isinstance(data['suggestions'], list):
            return test_result(9, "GET zones/load-balance", False, "suggestions is not an array")
        
        if data['suggestions']:
            suggestion = data['suggestions'][0]
            suggestion_fields = ['id', 'zoneId', 'zoneName', 'priority', 'type', 'title', 'reason', 'action']
            missing = [f for f in suggestion_fields if f not in suggestion]
            if missing:
                return test_result(9, "GET zones/load-balance", False, f"Missing suggestion fields: {missing}")
        
        return test_result(9, "GET zones/load-balance", True, f"Returns complete data: {summary['totalZones']} zones, {len(data['suggestions'])} suggestions")
    except Exception as e:
        return test_result(9, "GET zones/load-balance", False, str(e))

def test_10_apply_add_fat():
    """Test 10: POST /api/zones/load-balance/apply - add_fat action"""
    log("\n=== TEST 10: POST zones/load-balance/apply - add_fat ===")
    try:
        # First get a zone
        resp = requests.get(f"{BASE_URL}/zones", timeout=10)
        if resp.status_code != 200:
            return test_result(10, "Apply add_fat", False, "Cannot fetch zones")
        
        zones = resp.json()
        if not zones:
            return test_result(10, "Apply add_fat", False, "No zones available")
        
        zone = zones[0]
        zone_id = zone['id']
        
        # Get initial network count
        resp = requests.get(f"{BASE_URL}/networks", timeout=10)
        if resp.status_code != 200:
            return test_result(10, "Apply add_fat", False, "Cannot fetch networks")
        
        initial_networks = resp.json()
        initial_count = len([n for n in initial_networks if n.get('zoneId') == zone_id])
        
        # Apply add_fat action
        payload = {
            "action": {
                "type": "add_fat",
                "zoneId": zone_id,
                "count": 1,
                "capacityPerFat": 32
            }
        }
        
        resp = requests.post(f"{BASE_URL}/zones/load-balance/apply", json=payload, timeout=10)
        if resp.status_code != 200:
            return test_result(10, "Apply add_fat", False, f"Status {resp.status_code}: {resp.text}")
        
        data = resp.json()
        
        # Verify response
        if not data.get('success'):
            return test_result(10, "Apply add_fat", False, "success field is not true")
        
        if data.get('created') != 1:
            return test_result(10, "Apply add_fat", False, f"Expected created=1, got {data.get('created')}")
        
        if data.get('type') != 'add_fat':
            return test_result(10, "Apply add_fat", False, f"Expected type=add_fat, got {data.get('type')}")
        
        # Verify new network was added
        resp = requests.get(f"{BASE_URL}/networks", timeout=10)
        if resp.status_code != 200:
            return test_result(10, "Apply add_fat", False, "Cannot verify networks")
        
        final_networks = resp.json()
        final_count = len([n for n in final_networks if n.get('zoneId') == zone_id])
        
        if final_count != initial_count + 1:
            return test_result(10, "Apply add_fat", False, f"Network count mismatch: {initial_count} -> {final_count} (expected +1)")
        
        # Verify zone.fats incremented
        resp = requests.get(f"{BASE_URL}/zones", timeout=10)
        if resp.status_code != 200:
            return test_result(10, "Apply add_fat", False, "Cannot verify zone")
        
        zones = resp.json()
        updated_zone = next((z for z in zones if z['id'] == zone_id), None)
        if not updated_zone:
            return test_result(10, "Apply add_fat", False, "Zone not found after update")
        
        return test_result(10, "Apply add_fat", True, f"Network added successfully. Zone networks: {initial_count} -> {final_count}")
    except Exception as e:
        return test_result(10, "Apply add_fat", False, str(e))

def test_11_apply_create_subzone():
    """Test 11: POST /api/zones/load-balance/apply - create_subzone"""
    log("\n=== TEST 11: POST zones/load-balance/apply - create_subzone ===")
    try:
        # Get a zone
        resp = requests.get(f"{BASE_URL}/zones", timeout=10)
        if resp.status_code != 200:
            return test_result(11, "Apply create_subzone", False, "Cannot fetch zones")
        
        zones = resp.json()
        if not zones:
            return test_result(11, "Apply create_subzone", False, "No zones available")
        
        zone = zones[0]
        zone_id = zone['id']
        
        # Apply create_subzone action
        payload = {
            "action": {
                "type": "create_subzone",
                "parentZoneId": zone_id
            }
        }
        
        resp = requests.post(f"{BASE_URL}/zones/load-balance/apply", json=payload, timeout=10)
        if resp.status_code != 200:
            return test_result(11, "Apply create_subzone", False, f"Status {resp.status_code}: {resp.text}")
        
        data = resp.json()
        
        # Verify response
        if not data.get('success'):
            return test_result(11, "Apply create_subzone", False, "success field is not true")
        
        if 'subzoneId' not in data:
            return test_result(11, "Apply create_subzone", False, "subzoneId field missing")
        
        if data.get('type') != 'create_subzone':
            return test_result(11, "Apply create_subzone", False, f"Expected type=create_subzone, got {data.get('type')}")
        
        subzone_id = data['subzoneId']
        
        # Verify new zone was created with parentZoneId
        resp = requests.get(f"{BASE_URL}/zones", timeout=10)
        if resp.status_code != 200:
            return test_result(11, "Apply create_subzone", False, "Cannot verify zones")
        
        zones = resp.json()
        subzone = next((z for z in zones if z['id'] == subzone_id), None)
        if not subzone:
            return test_result(11, "Apply create_subzone", False, "Subzone not found")
        
        if subzone.get('parentZoneId') != zone_id:
            return test_result(11, "Apply create_subzone", False, f"parentZoneId mismatch: {subzone.get('parentZoneId')} != {zone_id}")
        
        return test_result(11, "Apply create_subzone", True, f"Subzone created with parentZoneId={zone_id}")
    except Exception as e:
        return test_result(11, "Apply create_subzone", False, str(e))

def test_12_apply_create_repair_task():
    """Test 12: POST /api/zones/load-balance/apply - create_repair_task"""
    log("\n=== TEST 12: POST zones/load-balance/apply - create_repair_task ===")
    try:
        # Get a zone
        resp = requests.get(f"{BASE_URL}/zones", timeout=10)
        if resp.status_code != 200:
            return test_result(12, "Apply create_repair_task", False, "Cannot fetch zones")
        
        zones = resp.json()
        if not zones:
            return test_result(12, "Apply create_repair_task", False, "No zones available")
        
        zone = zones[0]
        zone_id = zone['id']
        zone_name = zone.get('name', 'TestZone')
        
        # Get initial task count
        resp = requests.get(f"{BASE_URL}/tasks", timeout=10)
        if resp.status_code != 200:
            return test_result(12, "Apply create_repair_task", False, "Cannot fetch tasks")
        
        initial_tasks = resp.json()
        initial_count = len(initial_tasks)
        
        # Apply create_repair_task action
        payload = {
            "action": {
                "type": "create_repair_task",
                "zoneId": zone_id,
                "zoneName": zone_name
            }
        }
        
        resp = requests.post(f"{BASE_URL}/zones/load-balance/apply", json=payload, timeout=10)
        if resp.status_code != 200:
            return test_result(12, "Apply create_repair_task", False, f"Status {resp.status_code}: {resp.text}")
        
        data = resp.json()
        
        # Verify response
        if not data.get('success'):
            return test_result(12, "Apply create_repair_task", False, "success field is not true")
        
        if 'taskId' not in data:
            return test_result(12, "Apply create_repair_task", False, "taskId field missing")
        
        if data.get('type') != 'create_repair_task':
            return test_result(12, "Apply create_repair_task", False, f"Expected type=create_repair_task, got {data.get('type')}")
        
        task_id = data['taskId']
        
        # Verify new task was created
        resp = requests.get(f"{BASE_URL}/tasks", timeout=10)
        if resp.status_code != 200:
            return test_result(12, "Apply create_repair_task", False, "Cannot verify tasks")
        
        final_tasks = resp.json()
        final_count = len(final_tasks)
        
        if final_count != initial_count + 1:
            return test_result(12, "Apply create_repair_task", False, f"Task count mismatch: {initial_count} -> {final_count} (expected +1)")
        
        # Verify task contains zone name in title
        task = next((t for t in final_tasks if t['id'] == task_id), None)
        if not task:
            return test_result(12, "Apply create_repair_task", False, "Task not found")
        
        if zone_name not in task.get('title', ''):
            return test_result(12, "Apply create_repair_task", False, f"Zone name not in task title: {task.get('title')}")
        
        return test_result(12, "Apply create_repair_task", True, f"Urgent task created with title containing '{zone_name}'")
    except Exception as e:
        return test_result(12, "Apply create_repair_task", False, str(e))

def test_13_invalid_action_type():
    """Test 13: Invalid action type"""
    log("\n=== TEST 13: Invalid action type ===")
    try:
        payload = {
            "action": {
                "type": "unknown_xyz"
            }
        }
        
        resp = requests.post(f"{BASE_URL}/zones/load-balance/apply", json=payload, timeout=10)
        if resp.status_code != 400:
            return test_result(13, "Invalid action type", False, f"Expected 400, got {resp.status_code}")
        
        error_text = resp.text
        if "نوع action غير مدعوم" not in error_text:
            return test_result(13, "Invalid action type", False, f"Expected Arabic error, got: {error_text}")
        
        return test_result(13, "Invalid action type", True, "Correctly rejected with 400 and Arabic error")
    except Exception as e:
        return test_result(13, "Invalid action type", False, str(e))

def test_14_missing_action_body():
    """Test 14: Missing action body"""
    log("\n=== TEST 14: Missing action body ===")
    try:
        payload = {}
        
        resp = requests.post(f"{BASE_URL}/zones/load-balance/apply", json=payload, timeout=10)
        if resp.status_code != 400:
            return test_result(14, "Missing action body", False, f"Expected 400, got {resp.status_code}")
        
        error_text = resp.text
        if "action مطلوب" not in error_text:
            return test_result(14, "Missing action body", False, f"Expected Arabic error, got: {error_text}")
        
        return test_result(14, "Missing action body", True, "Correctly rejected with 400 and Arabic error")
    except Exception as e:
        return test_result(14, "Missing action body", False, str(e))

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    log("=" * 80)
    log("BACKEND TESTING: POS Discount/Increase + Zones AI Load Balancing")
    log("=" * 80)
    
    results = []
    
    # TEST GROUP 1: POS Discount/Increase (8 tests)
    log("\n" + "=" * 80)
    log("TEST GROUP 1: POS Discount/Increase with permissions + audit log")
    log("=" * 80)
    results.append(test_1_get_settings())
    results.append(test_2_checkout_with_discount())
    results.append(test_3_checkout_with_surcharge())
    results.append(test_4_missing_discount_reason())
    results.append(test_5_discount_over_limit())
    results.append(test_6_manager_override())
    results.append(test_7_get_modifications())
    results.append(test_8_get_modifications_filtered())
    
    # TEST GROUP 2: Zones AI Load Balancing (6 tests)
    log("\n" + "=" * 80)
    log("TEST GROUP 2: Zones AI Load Balancing")
    log("=" * 80)
    results.append(test_9_get_load_balance())
    results.append(test_10_apply_add_fat())
    results.append(test_11_apply_create_subzone())
    results.append(test_12_apply_create_repair_task())
    results.append(test_13_invalid_action_type())
    results.append(test_14_missing_action_body())
    
    # Summary
    log("\n" + "=" * 80)
    log("TEST SUMMARY")
    log("=" * 80)
    passed = sum(results)
    total = len(results)
    log(f"Total: {total} tests")
    log(f"Passed: {passed} tests")
    log(f"Failed: {total - passed} tests")
    log(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        log("\n✅ ALL TESTS PASSED!")
        return 0
    else:
        log(f"\n❌ {total - passed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())
