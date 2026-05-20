#!/usr/bin/env python3
"""
Backend Test Script for Custom Fields API (Schema Editor)
Tests ONLY the NEW custom fields endpoints added in this iteration.
"""

import requests
import json
import sys
from datetime import datetime

# Base URL from environment
BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def log(msg):
    """Print timestamped log message"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def test_custom_fields_api():
    """Test Custom Fields API endpoints"""
    
    log("=" * 80)
    log("CUSTOM FIELDS API TESTING - Schema Editor")
    log("=" * 80)
    
    test_results = {
        "passed": 0,
        "failed": 0,
        "tests": []
    }
    
    def record_test(name, passed, details=""):
        test_results["tests"].append({"name": name, "passed": passed, "details": details})
        if passed:
            test_results["passed"] += 1
            log(f"✅ PASS: {name}")
        else:
            test_results["failed"] += 1
            log(f"❌ FAIL: {name}")
        if details:
            log(f"   Details: {details}")
    
    try:
        # ============================================================
        # TEST 1: GET /api/custom-fields (all entities)
        # ============================================================
        log("\n--- TEST 1: GET /api/custom-fields (all entities) ---")
        try:
            response = requests.get(f"{BASE_URL}/custom-fields", timeout=10)
            log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                expected_entities = ['subscribers', 'networks', 'zones', 'employees', 'products', 'agents', 'repairs', 'tasks']
                
                # Check all 8 entities are present
                all_present = all(entity in data for entity in expected_entities)
                
                # Check all values are arrays
                all_arrays = all(isinstance(data.get(entity), list) for entity in expected_entities)
                
                if all_present and all_arrays:
                    record_test("GET /api/custom-fields returns all 8 entities as arrays", True, 
                               f"Found entities: {list(data.keys())}")
                else:
                    record_test("GET /api/custom-fields returns all 8 entities as arrays", False,
                               f"Missing entities or wrong types. Data: {data}")
            else:
                record_test("GET /api/custom-fields returns 200", False, f"Got {response.status_code}")
        except Exception as e:
            record_test("GET /api/custom-fields", False, f"Exception: {str(e)}")
        
        # ============================================================
        # TEST 2: GET /api/custom-fields/subscribers (specific entity)
        # ============================================================
        log("\n--- TEST 2: GET /api/custom-fields/subscribers ---")
        try:
            response = requests.get(f"{BASE_URL}/custom-fields/subscribers", timeout=10)
            log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "entity" in data and data["entity"] == "subscribers" and "fields" in data and isinstance(data["fields"], list):
                    record_test("GET /api/custom-fields/subscribers returns correct structure", True,
                               f"entity={data['entity']}, fields count={len(data['fields'])}")
                else:
                    record_test("GET /api/custom-fields/subscribers returns correct structure", False,
                               f"Wrong structure: {data}")
            else:
                record_test("GET /api/custom-fields/subscribers", False, f"Got {response.status_code}")
        except Exception as e:
            record_test("GET /api/custom-fields/subscribers", False, f"Exception: {str(e)}")
        
        # ============================================================
        # TEST 3: GET /api/custom-fields/invalid_entity (expect 400)
        # ============================================================
        log("\n--- TEST 3: GET /api/custom-fields/invalid_entity (expect 400) ---")
        try:
            response = requests.get(f"{BASE_URL}/custom-fields/invalid_entity", timeout=10)
            log(f"Status: {response.status_code}")
            
            if response.status_code == 400:
                data = response.json()
                if "نوع غير مدعوم" in data.get("error", ""):
                    record_test("GET /api/custom-fields/invalid_entity returns 400 with Arabic error", True,
                               f"Error: {data.get('error')}")
                else:
                    record_test("GET /api/custom-fields/invalid_entity returns 400 with Arabic error", False,
                               f"Wrong error message: {data}")
            else:
                record_test("GET /api/custom-fields/invalid_entity returns 400", False, f"Got {response.status_code}")
        except Exception as e:
            record_test("GET /api/custom-fields/invalid_entity", False, f"Exception: {str(e)}")
        
        # ============================================================
        # TEST 4: PUT /api/custom-fields/subscribers (valid fields)
        # ============================================================
        log("\n--- TEST 4: PUT /api/custom-fields/subscribers (valid fields) ---")
        try:
            valid_fields = {
                "fields": [
                    {
                        "key": "router_model",
                        "label": "موديل الراوتر",
                        "type": "text",
                        "required": False
                    },
                    {
                        "key": "wall_color",
                        "label": "لون الجدار",
                        "type": "select",
                        "required": False,
                        "options": [
                            {"value": "white", "label": "أبيض"},
                            {"value": "blue", "label": "أزرق"}
                        ]
                    },
                    {
                        "key": "monthly_quota",
                        "label": "الحصة الشهرية",
                        "type": "currency",
                        "required": True
                    }
                ]
            }
            
            response = requests.put(f"{BASE_URL}/custom-fields/subscribers", 
                                   json=valid_fields, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("entity") == "subscribers" and len(data.get("fields", [])) == 3:
                    record_test("PUT /api/custom-fields/subscribers with valid fields", True,
                               f"Created 3 fields successfully")
                else:
                    record_test("PUT /api/custom-fields/subscribers with valid fields", False,
                               f"Wrong response: {data}")
            else:
                record_test("PUT /api/custom-fields/subscribers with valid fields", False, 
                           f"Got {response.status_code}: {response.text}")
        except Exception as e:
            record_test("PUT /api/custom-fields/subscribers with valid fields", False, f"Exception: {str(e)}")
        
        # ============================================================
        # TEST 5: GET /api/custom-fields/subscribers (verify persistence)
        # ============================================================
        log("\n--- TEST 5: GET /api/custom-fields/subscribers (verify persistence) ---")
        try:
            response = requests.get(f"{BASE_URL}/custom-fields/subscribers", timeout=10)
            log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                fields = data.get("fields", [])
                
                # Check if all 3 fields are persisted
                field_keys = [f["key"] for f in fields]
                expected_keys = ["router_model", "wall_color", "monthly_quota"]
                
                if all(key in field_keys for key in expected_keys):
                    record_test("Custom fields persisted correctly", True,
                               f"Found all 3 fields: {field_keys}")
                else:
                    record_test("Custom fields persisted correctly", False,
                               f"Missing fields. Found: {field_keys}, Expected: {expected_keys}")
            else:
                record_test("GET /api/custom-fields/subscribers after PUT", False, f"Got {response.status_code}")
        except Exception as e:
            record_test("GET /api/custom-fields/subscribers after PUT", False, f"Exception: {str(e)}")
        
        # ============================================================
        # TEST 6: PUT validation tests
        # ============================================================
        log("\n--- TEST 6: PUT validation tests ---")
        
        # 6a: Invalid key (uppercase/spaces)
        try:
            invalid_key = {"fields": [{"key": "Bad Key", "label": "x", "type": "text"}]}
            response = requests.put(f"{BASE_URL}/custom-fields/subscribers", 
                                   json=invalid_key, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            log(f"6a - Invalid key status: {response.status_code}")
            
            if response.status_code == 400:
                record_test("PUT validation: Invalid key (uppercase/spaces) returns 400", True,
                           f"Error: {response.json().get('error', '')}")
            else:
                record_test("PUT validation: Invalid key (uppercase/spaces) returns 400", False,
                           f"Got {response.status_code}")
        except Exception as e:
            record_test("PUT validation: Invalid key", False, f"Exception: {str(e)}")
        
        # 6b: Missing label
        try:
            missing_label = {"fields": [{"key": "ok", "type": "text"}]}
            response = requests.put(f"{BASE_URL}/custom-fields/subscribers", 
                                   json=missing_label, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            log(f"6b - Missing label status: {response.status_code}")
            
            if response.status_code == 400:
                record_test("PUT validation: Missing label returns 400", True,
                           f"Error: {response.json().get('error', '')}")
            else:
                record_test("PUT validation: Missing label returns 400", False,
                           f"Got {response.status_code}")
        except Exception as e:
            record_test("PUT validation: Missing label", False, f"Exception: {str(e)}")
        
        # 6c: Invalid type
        try:
            invalid_type = {"fields": [{"key": "ok", "label": "x", "type": "alien_type"}]}
            response = requests.put(f"{BASE_URL}/custom-fields/subscribers", 
                                   json=invalid_type, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            log(f"6c - Invalid type status: {response.status_code}")
            
            if response.status_code == 400:
                record_test("PUT validation: Invalid type returns 400", True,
                           f"Error: {response.json().get('error', '')}")
            else:
                record_test("PUT validation: Invalid type returns 400", False,
                           f"Got {response.status_code}")
        except Exception as e:
            record_test("PUT validation: Invalid type", False, f"Exception: {str(e)}")
        
        # 6d: select without options
        try:
            select_no_options = {"fields": [{"key": "ok", "label": "x", "type": "select"}]}
            response = requests.put(f"{BASE_URL}/custom-fields/subscribers", 
                                   json=select_no_options, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            log(f"6d - select without options status: {response.status_code}")
            
            if response.status_code == 400:
                record_test("PUT validation: select without options returns 400", True,
                           f"Error: {response.json().get('error', '')}")
            else:
                record_test("PUT validation: select without options returns 400", False,
                           f"Got {response.status_code}")
        except Exception as e:
            record_test("PUT validation: select without options", False, f"Exception: {str(e)}")
        
        # 6e: Duplicate keys
        try:
            duplicate_keys = {"fields": [
                {"key": "a", "label": "1", "type": "text"},
                {"key": "a", "label": "2", "type": "text"}
            ]}
            response = requests.put(f"{BASE_URL}/custom-fields/subscribers", 
                                   json=duplicate_keys, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            log(f"6e - Duplicate keys status: {response.status_code}")
            
            if response.status_code == 400:
                record_test("PUT validation: Duplicate keys returns 400", True,
                           f"Error: {response.json().get('error', '')}")
            else:
                record_test("PUT validation: Duplicate keys returns 400", False,
                           f"Got {response.status_code}")
        except Exception as e:
            record_test("PUT validation: Duplicate keys", False, f"Exception: {str(e)}")
        
        # ============================================================
        # TEST 7: PUT /api/custom-fields/networks (test another entity)
        # ============================================================
        log("\n--- TEST 7: PUT /api/custom-fields/networks ---")
        try:
            network_fields = {
                "fields": [
                    {
                        "key": "fiber_type",
                        "label": "نوع الألياف",
                        "type": "select",
                        "required": False,
                        "options": [
                            {"value": "single", "label": "أحادي"},
                            {"value": "multi", "label": "متعدد"}
                        ]
                    }
                ]
            }
            
            response = requests.put(f"{BASE_URL}/custom-fields/networks", 
                                   json=network_fields, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("entity") == "networks" and len(data.get("fields", [])) == 1:
                    record_test("PUT /api/custom-fields/networks with valid fields", True,
                               f"Created 1 field for networks")
                else:
                    record_test("PUT /api/custom-fields/networks with valid fields", False,
                               f"Wrong response: {data}")
            else:
                record_test("PUT /api/custom-fields/networks with valid fields", False, 
                           f"Got {response.status_code}: {response.text}")
        except Exception as e:
            record_test("PUT /api/custom-fields/networks", False, f"Exception: {str(e)}")
        
        # ============================================================
        # TEST 8: PUT /api/custom-fields/invalid_entity (expect 400)
        # ============================================================
        log("\n--- TEST 8: PUT /api/custom-fields/invalid_entity (expect 400) ---")
        try:
            response = requests.put(f"{BASE_URL}/custom-fields/invalid_entity", 
                                   json={"fields": []}, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            log(f"Status: {response.status_code}")
            
            if response.status_code == 400:
                data = response.json()
                if "نوع غير مدعوم" in data.get("error", ""):
                    record_test("PUT /api/custom-fields/invalid_entity returns 400", True,
                               f"Error: {data.get('error')}")
                else:
                    record_test("PUT /api/custom-fields/invalid_entity returns 400", False,
                               f"Wrong error: {data}")
            else:
                record_test("PUT /api/custom-fields/invalid_entity returns 400", False, 
                           f"Got {response.status_code}")
        except Exception as e:
            record_test("PUT /api/custom-fields/invalid_entity", False, f"Exception: {str(e)}")
        
        # ============================================================
        # TEST 9: Create subscriber with customFields
        # ============================================================
        log("\n--- TEST 9: Create subscriber with customFields ---")
        test_subscriber_id = None
        try:
            subscriber_data = {
                "name": "مشترك تجريبي للحقول المخصصة",
                "phone": "07900000099",
                "username": "cftest_user",
                "customFields": {
                    "router_model": "TP-Link Archer C6",
                    "monthly_quota": 50000
                }
            }
            
            response = requests.post(f"{BASE_URL}/subscribers", 
                                    json=subscriber_data, 
                                    headers={"Content-Type": "application/json"},
                                    timeout=10)
            log(f"Status: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                test_subscriber_id = data.get("id")
                
                # Check if customFields is in response
                if "customFields" in data and data["customFields"].get("router_model") == "TP-Link Archer C6":
                    record_test("POST /api/subscribers with customFields", True,
                               f"Created subscriber with customFields: {data['customFields']}")
                else:
                    record_test("POST /api/subscribers with customFields", False,
                               f"customFields not in response or wrong data: {data}")
            else:
                record_test("POST /api/subscribers with customFields", False, 
                           f"Got {response.status_code}: {response.text}")
        except Exception as e:
            record_test("POST /api/subscribers with customFields", False, f"Exception: {str(e)}")
        
        # ============================================================
        # TEST 10: GET /api/subscribers (verify customFields preserved)
        # ============================================================
        log("\n--- TEST 10: GET /api/subscribers (verify customFields preserved) ---")
        if test_subscriber_id:
            try:
                response = requests.get(f"{BASE_URL}/subscribers", timeout=10)
                log(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Find our test subscriber
                    test_sub = next((s for s in data if s.get("id") == test_subscriber_id), None)
                    
                    if test_sub and "customFields" in test_sub:
                        cf = test_sub["customFields"]
                        if cf.get("router_model") == "TP-Link Archer C6" and cf.get("monthly_quota") == 50000:
                            record_test("GET /api/subscribers preserves customFields", True,
                                       f"customFields intact: {cf}")
                        else:
                            record_test("GET /api/subscribers preserves customFields", False,
                                       f"customFields wrong: {cf}")
                    else:
                        record_test("GET /api/subscribers preserves customFields", False,
                                   f"Subscriber not found or no customFields")
                else:
                    record_test("GET /api/subscribers", False, f"Got {response.status_code}")
            except Exception as e:
                record_test("GET /api/subscribers", False, f"Exception: {str(e)}")
        else:
            record_test("GET /api/subscribers (verify customFields)", False, "No test subscriber created")
        
        # ============================================================
        # TEST 11: PUT /api/subscribers/:id (update customFields)
        # ============================================================
        log("\n--- TEST 11: PUT /api/subscribers/:id (update customFields) ---")
        if test_subscriber_id:
            try:
                update_data = {
                    "customFields": {
                        "router_model": "Mikrotik hEX",
                        "wall_color": "blue",
                        "monthly_quota": 75000
                    }
                }
                
                response = requests.put(f"{BASE_URL}/subscribers/{test_subscriber_id}", 
                                       json=update_data, 
                                       headers={"Content-Type": "application/json"},
                                       timeout=10)
                log(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "customFields" in data:
                        cf = data["customFields"]
                        if (cf.get("router_model") == "Mikrotik hEX" and 
                            cf.get("wall_color") == "blue" and 
                            cf.get("monthly_quota") == 75000):
                            record_test("PUT /api/subscribers/:id updates customFields", True,
                                       f"Updated customFields: {cf}")
                        else:
                            record_test("PUT /api/subscribers/:id updates customFields", False,
                                       f"customFields not updated correctly: {cf}")
                    else:
                        record_test("PUT /api/subscribers/:id updates customFields", False,
                                   f"No customFields in response")
                else:
                    record_test("PUT /api/subscribers/:id updates customFields", False, 
                               f"Got {response.status_code}: {response.text}")
            except Exception as e:
                record_test("PUT /api/subscribers/:id updates customFields", False, f"Exception: {str(e)}")
        else:
            record_test("PUT /api/subscribers/:id (update customFields)", False, "No test subscriber created")
        
        # ============================================================
        # TEST 12: Verify update with GET
        # ============================================================
        log("\n--- TEST 12: Verify customFields update with GET ---")
        if test_subscriber_id:
            try:
                response = requests.get(f"{BASE_URL}/subscribers", timeout=10)
                log(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    test_sub = next((s for s in data if s.get("id") == test_subscriber_id), None)
                    
                    if test_sub and "customFields" in test_sub:
                        cf = test_sub["customFields"]
                        if (cf.get("router_model") == "Mikrotik hEX" and 
                            cf.get("wall_color") == "blue" and 
                            cf.get("monthly_quota") == 75000):
                            record_test("GET verifies customFields update persisted", True,
                                       f"Updated customFields persisted: {cf}")
                        else:
                            record_test("GET verifies customFields update persisted", False,
                                       f"customFields not persisted correctly: {cf}")
                    else:
                        record_test("GET verifies customFields update persisted", False,
                                   f"Subscriber not found or no customFields")
                else:
                    record_test("GET verifies customFields update", False, f"Got {response.status_code}")
            except Exception as e:
                record_test("GET verifies customFields update", False, f"Exception: {str(e)}")
        else:
            record_test("GET verifies customFields update", False, "No test subscriber created")
        
        # ============================================================
        # CLEANUP: Delete test subscriber
        # ============================================================
        log("\n--- CLEANUP: Delete test subscriber ---")
        if test_subscriber_id:
            try:
                response = requests.delete(f"{BASE_URL}/subscribers/{test_subscriber_id}", timeout=10)
                log(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    log("✅ Test subscriber deleted successfully")
                else:
                    log(f"⚠️ Failed to delete test subscriber: {response.status_code}")
            except Exception as e:
                log(f"⚠️ Exception during cleanup: {str(e)}")
        
        # ============================================================
        # CLEANUP: Reset custom fields for subscribers
        # ============================================================
        log("\n--- CLEANUP: Reset custom fields for subscribers ---")
        try:
            response = requests.put(f"{BASE_URL}/custom-fields/subscribers", 
                                   json={"fields": []}, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                log("✅ Subscribers custom fields reset successfully")
            else:
                log(f"⚠️ Failed to reset subscribers custom fields: {response.status_code}")
        except Exception as e:
            log(f"⚠️ Exception during cleanup: {str(e)}")
        
        # ============================================================
        # CLEANUP: Reset custom fields for networks
        # ============================================================
        log("\n--- CLEANUP: Reset custom fields for networks ---")
        try:
            response = requests.put(f"{BASE_URL}/custom-fields/networks", 
                                   json={"fields": []}, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                log("✅ Networks custom fields reset successfully")
            else:
                log(f"⚠️ Failed to reset networks custom fields: {response.status_code}")
        except Exception as e:
            log(f"⚠️ Exception during cleanup: {str(e)}")
        
    except Exception as e:
        log(f"❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # ============================================================
    # SUMMARY
    # ============================================================
    log("\n" + "=" * 80)
    log("TEST SUMMARY")
    log("=" * 80)
    log(f"Total Tests: {test_results['passed'] + test_results['failed']}")
    log(f"✅ Passed: {test_results['passed']}")
    log(f"❌ Failed: {test_results['failed']}")
    log("=" * 80)
    
    if test_results['failed'] > 0:
        log("\nFailed Tests:")
        for test in test_results['tests']:
            if not test['passed']:
                log(f"  ❌ {test['name']}")
                if test['details']:
                    log(f"     {test['details']}")
    
    return test_results['failed'] == 0

if __name__ == "__main__":
    success = test_custom_fields_api()
    sys.exit(0 if success else 1)
