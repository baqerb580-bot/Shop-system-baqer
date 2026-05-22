#!/usr/bin/env python3
"""
Backend API Testing Script for Balance Management System
Tests all balance management endpoints including auto-deduct on activation
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL
BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

# Test results tracking
tests_passed = 0
tests_failed = 0
test_results = []

def log_test(name, passed, details=""):
    """Log test result"""
    global tests_passed, tests_failed
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    test_results.append({"name": name, "passed": passed, "details": details})
    if passed:
        tests_passed += 1
    else:
        tests_failed += 1

def test_get_balance_accounts():
    """Test 1: GET /api/balance/accounts - should return 5 default accounts on first call"""
    try:
        print("\n=== Test 1: GET /api/balance/accounts ===")
        response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/balance/accounts", False, f"Expected 200, got {response.status_code}")
            return None
        
        data = response.json()
        
        # Verify it's an array
        if not isinstance(data, list):
            log_test("GET /api/balance/accounts", False, "Response is not an array")
            return None
        
        # Should have 5 default accounts (fast, master, management, cash, box)
        if len(data) < 5:
            log_test("GET /api/balance/accounts", False, f"Expected at least 5 accounts, got {len(data)}")
            return None
        
        # Verify structure of first account
        account = data[0]
        required_fields = ['id', 'key', 'name', 'type', 'balance', 'color', 'icon', 'enabled', 'txCount']
        missing_fields = [f for f in required_fields if f not in account]
        
        if missing_fields:
            log_test("GET /api/balance/accounts", False, f"Missing fields: {missing_fields}")
            return None
        
        # Find the fast account for later tests
        fast_account = next((a for a in data if a['key'] == 'fast'), None)
        master_account = next((a for a in data if a['key'] == 'master'), None)
        
        log_test("GET /api/balance/accounts", True, f"Found {len(data)} accounts with correct structure")
        return {"accounts": data, "fast": fast_account, "master": master_account}
        
    except Exception as e:
        log_test("GET /api/balance/accounts", False, f"Exception: {str(e)}")
        return None

def test_create_account():
    """Test 2: POST /api/balance/accounts - create new account"""
    try:
        print("\n=== Test 2: POST /api/balance/accounts ===")
        payload = {
            "name": "حساب اختبار",
            "type": "other",
            "icon": "🧪",
            "color": "#ff0066"
        }
        
        response = requests.post(f"{BASE_URL}/balance/accounts", json=payload, timeout=10)
        
        if response.status_code != 200:
            log_test("POST /api/balance/accounts", False, f"Expected 200, got {response.status_code}")
            return None
        
        data = response.json()
        
        # Verify created account has all fields
        if not all(k in data for k in ['id', 'name', 'type', 'icon', 'color']):
            log_test("POST /api/balance/accounts", False, "Missing fields in created account")
            return None
        
        if data['name'] != "حساب اختبار":
            log_test("POST /api/balance/accounts", False, f"Name mismatch: {data['name']}")
            return None
        
        log_test("POST /api/balance/accounts", True, f"Created account with id: {data['id']}")
        
        # Verify it appears in GET
        get_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = get_response.json()
        
        if len(accounts) < 6:
            log_test("POST /api/balance/accounts - verification", False, f"Expected 6 accounts, got {len(accounts)}")
        else:
            log_test("POST /api/balance/accounts - verification", True, f"Account appears in list (total: {len(accounts)})")
        
        return data
        
    except Exception as e:
        log_test("POST /api/balance/accounts", False, f"Exception: {str(e)}")
        return None

def test_deposit(account_id, account_name):
    """Test 3: POST /api/balance/deposit"""
    try:
        print("\n=== Test 3: POST /api/balance/deposit ===")
        payload = {
            "accountId": account_id,
            "amount": 1000000,
            "description": "تعبئة شهرية"
        }
        
        response = requests.post(f"{BASE_URL}/balance/deposit", json=payload, timeout=10)
        
        if response.status_code != 200:
            log_test("POST /api/balance/deposit", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Verify response structure
        if not all(k in data for k in ['success', 'transaction', 'newBalance']):
            log_test("POST /api/balance/deposit", False, "Missing fields in response")
            return False
        
        if data['newBalance'] != 1000000:
            log_test("POST /api/balance/deposit", False, f"Expected balance 1000000, got {data['newBalance']}")
            return False
        
        log_test("POST /api/balance/deposit", True, f"Deposited 1,000,000 IQD, new balance: {data['newBalance']}")
        
        # Verify balance updated in account
        get_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = get_response.json()
        account = next((a for a in accounts if a['id'] == account_id), None)
        
        if account and account['balance'] == 1000000:
            log_test("POST /api/balance/deposit - balance verification", True, f"{account_name} balance is 1,000,000")
        else:
            log_test("POST /api/balance/deposit - balance verification", False, f"Balance not updated correctly")
        
        # Verify transaction created
        tx_response = requests.get(f"{BASE_URL}/balance/transactions?accountId={account_id}", timeout=10)
        transactions = tx_response.json()
        
        if len(transactions) > 0 and transactions[0]['type'] == 'deposit':
            log_test("POST /api/balance/deposit - transaction verification", True, "Transaction created in balance_transactions")
        else:
            log_test("POST /api/balance/deposit - transaction verification", False, "Transaction not found")
        
        return True
        
    except Exception as e:
        log_test("POST /api/balance/deposit", False, f"Exception: {str(e)}")
        return False

def test_withdraw(account_id, account_name):
    """Test 4: POST /api/balance/withdraw"""
    try:
        print("\n=== Test 4: POST /api/balance/withdraw ===")
        payload = {
            "accountId": account_id,
            "amount": 300000,
            "description": "دفع مصاريف مكتب"
        }
        
        response = requests.post(f"{BASE_URL}/balance/withdraw", json=payload, timeout=10)
        
        if response.status_code != 200:
            log_test("POST /api/balance/withdraw", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Verify response structure
        if not all(k in data for k in ['success', 'transaction', 'newBalance']):
            log_test("POST /api/balance/withdraw", False, "Missing fields in response")
            return False
        
        if data['newBalance'] != 700000:
            log_test("POST /api/balance/withdraw", False, f"Expected balance 700000, got {data['newBalance']}")
            return False
        
        # Verify transaction has balanceBefore and balanceAfter
        tx = data['transaction']
        if tx['balanceBefore'] == 1000000 and tx['balanceAfter'] == 700000:
            log_test("POST /api/balance/withdraw", True, f"Withdrew 300,000 IQD, balance: 1,000,000 → 700,000")
        else:
            log_test("POST /api/balance/withdraw", False, f"Balance tracking incorrect: {tx['balanceBefore']} → {tx['balanceAfter']}")
        
        return True
        
    except Exception as e:
        log_test("POST /api/balance/withdraw", False, f"Exception: {str(e)}")
        return False

def test_withdraw_insufficient():
    """Test 5: POST /api/balance/withdraw with insufficient balance"""
    try:
        print("\n=== Test 5: POST /api/balance/withdraw (insufficient balance) ===")
        
        # Get fast account
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        
        if not fast_account:
            log_test("POST /api/balance/withdraw (insufficient)", False, "Fast account not found")
            return False
        
        payload = {
            "accountId": fast_account['id'],
            "amount": 999999999,
            "description": "محاولة سحب مبلغ كبير"
        }
        
        response = requests.post(f"{BASE_URL}/balance/withdraw", json=payload, timeout=10)
        
        if response.status_code != 400:
            log_test("POST /api/balance/withdraw (insufficient)", False, f"Expected 400, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'error' in data and 'الرصيد غير كافٍ' in data['error']:
            log_test("POST /api/balance/withdraw (insufficient)", True, "Correctly rejected with insufficient balance error")
        else:
            log_test("POST /api/balance/withdraw (insufficient)", False, f"Wrong error message: {data}")
        
        # Verify balance unchanged
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account_after = next((a for a in accounts if a['key'] == 'fast'), None)
        
        if fast_account_after['balance'] == fast_account['balance']:
            log_test("POST /api/balance/withdraw (insufficient) - balance unchanged", True, "Balance unchanged after failed withdrawal")
        else:
            log_test("POST /api/balance/withdraw (insufficient) - balance unchanged", False, "Balance changed after failed withdrawal")
        
        return True
        
    except Exception as e:
        log_test("POST /api/balance/withdraw (insufficient)", False, f"Exception: {str(e)}")
        return False

def test_withdraw_overdraft():
    """Test 6: POST /api/balance/withdraw with allowOverdraft"""
    try:
        print("\n=== Test 6: POST /api/balance/withdraw (with allowOverdraft) ===")
        
        # Get fast account
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        
        if not fast_account:
            log_test("POST /api/balance/withdraw (overdraft)", False, "Fast account not found")
            return False
        
        current_balance = fast_account['balance']
        overdraft_amount = current_balance + 100000  # Withdraw more than available
        
        payload = {
            "accountId": fast_account['id'],
            "amount": overdraft_amount,
            "description": "سحب مع السماح بالسالب",
            "allowOverdraft": True
        }
        
        response = requests.post(f"{BASE_URL}/balance/withdraw", json=payload, timeout=10)
        
        if response.status_code != 200:
            log_test("POST /api/balance/withdraw (overdraft)", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if data['newBalance'] < 0:
            log_test("POST /api/balance/withdraw (overdraft)", True, f"Overdraft allowed, balance went negative: {data['newBalance']}")
        else:
            log_test("POST /api/balance/withdraw (overdraft)", False, f"Balance should be negative but is: {data['newBalance']}")
        
        # Check for critical notification
        notif_response = requests.get(f"{BASE_URL}/notifications/admin", timeout=10)
        notifications = notif_response.json()
        
        overdraft_notif = next((n for n in notifications if n.get('type') == 'balance_overdraft'), None)
        
        if overdraft_notif:
            log_test("POST /api/balance/withdraw (overdraft) - notification", True, "Critical overdraft notification created")
        else:
            log_test("POST /api/balance/withdraw (overdraft) - notification", False, "Overdraft notification not found")
        
        return True
        
    except Exception as e:
        log_test("POST /api/balance/withdraw (overdraft)", False, f"Exception: {str(e)}")
        return False

def test_transfer():
    """Test 7: POST /api/balance/transfer"""
    try:
        print("\n=== Test 7: POST /api/balance/transfer ===")
        
        # Get fast and master accounts
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        master_account = next((a for a in accounts if a['key'] == 'master'), None)
        
        if not fast_account or not master_account:
            log_test("POST /api/balance/transfer", False, "Fast or Master account not found")
            return False
        
        # First, ensure fast account has positive balance
        if fast_account['balance'] < 100000:
            deposit_payload = {
                "accountId": fast_account['id'],
                "amount": 500000,
                "description": "تعبئة للتحويل"
            }
            requests.post(f"{BASE_URL}/balance/deposit", json=deposit_payload, timeout=10)
        
        # Get updated balances
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        master_account = next((a for a in accounts if a['key'] == 'master'), None)
        
        fast_before = fast_account['balance']
        master_before = master_account['balance']
        
        payload = {
            "fromAccountId": fast_account['id'],
            "toAccountId": master_account['id'],
            "amount": 100000,
            "description": "تحويل اختبار"
        }
        
        response = requests.post(f"{BASE_URL}/balance/transfer", json=payload, timeout=10)
        
        if response.status_code != 200:
            log_test("POST /api/balance/transfer", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Verify response structure
        if not all(k in data for k in ['success', 'fromBalance', 'toBalance']):
            log_test("POST /api/balance/transfer", False, "Missing fields in response")
            return False
        
        expected_from = fast_before - 100000
        expected_to = master_before + 100000
        
        if data['fromBalance'] == expected_from and data['toBalance'] == expected_to:
            log_test("POST /api/balance/transfer", True, f"Transfer successful: Fast {fast_before} → {data['fromBalance']}, Master {master_before} → {data['toBalance']}")
        else:
            log_test("POST /api/balance/transfer", False, f"Balance mismatch: from={data['fromBalance']} (expected {expected_from}), to={data['toBalance']} (expected {expected_to})")
        
        # Verify 2 transactions created with same batchId
        tx_response = requests.get(f"{BASE_URL}/balance/transactions?limit=10", timeout=10)
        transactions = tx_response.json()
        
        transfer_txs = [t for t in transactions if t.get('type') in ['transfer_out', 'transfer_in']]
        
        if len(transfer_txs) >= 2:
            # Check if they have the same batchId
            batch_ids = [t.get('batchId') for t in transfer_txs[:2]]
            if batch_ids[0] and batch_ids[0] == batch_ids[1]:
                log_test("POST /api/balance/transfer - transactions", True, f"2 transactions created with same batchId: {batch_ids[0]}")
            else:
                log_test("POST /api/balance/transfer - transactions", False, "Transactions don't have matching batchId")
        else:
            log_test("POST /api/balance/transfer - transactions", False, "Transfer transactions not found")
        
        return True
        
    except Exception as e:
        log_test("POST /api/balance/transfer", False, f"Exception: {str(e)}")
        return False

def test_transfer_same_account():
    """Test 8: POST /api/balance/transfer to same account (should fail)"""
    try:
        print("\n=== Test 8: POST /api/balance/transfer (same account) ===")
        
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        
        if not fast_account:
            log_test("POST /api/balance/transfer (same account)", False, "Fast account not found")
            return False
        
        payload = {
            "fromAccountId": fast_account['id'],
            "toAccountId": fast_account['id'],
            "amount": 100,
            "description": "محاولة تحويل لنفس الحساب"
        }
        
        response = requests.post(f"{BASE_URL}/balance/transfer", json=payload, timeout=10)
        
        if response.status_code != 400:
            log_test("POST /api/balance/transfer (same account)", False, f"Expected 400, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'error' in data and 'لا يمكن التحويل لنفس الحساب' in data['error']:
            log_test("POST /api/balance/transfer (same account)", True, "Correctly rejected transfer to same account")
        else:
            log_test("POST /api/balance/transfer (same account)", False, f"Wrong error message: {data}")
        
        return True
        
    except Exception as e:
        log_test("POST /api/balance/transfer (same account)", False, f"Exception: {str(e)}")
        return False

def test_transfer_insufficient():
    """Test 9: POST /api/balance/transfer with insufficient source balance"""
    try:
        print("\n=== Test 9: POST /api/balance/transfer (insufficient source) ===")
        
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        master_account = next((a for a in accounts if a['key'] == 'master'), None)
        
        if not fast_account or not master_account:
            log_test("POST /api/balance/transfer (insufficient)", False, "Accounts not found")
            return False
        
        payload = {
            "fromAccountId": fast_account['id'],
            "toAccountId": master_account['id'],
            "amount": fast_account['balance'] + 1000000,
            "description": "محاولة تحويل مبلغ أكبر من الرصيد"
        }
        
        response = requests.post(f"{BASE_URL}/balance/transfer", json=payload, timeout=10)
        
        if response.status_code != 400:
            log_test("POST /api/balance/transfer (insufficient)", False, f"Expected 400, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'error' in data and 'رصيد المصدر غير كافٍ' in data['error']:
            log_test("POST /api/balance/transfer (insufficient)", True, "Correctly rejected transfer with insufficient source balance")
        else:
            log_test("POST /api/balance/transfer (insufficient)", False, f"Wrong error message: {data}")
        
        return True
        
    except Exception as e:
        log_test("POST /api/balance/transfer (insufficient)", False, f"Exception: {str(e)}")
        return False

def test_get_transactions():
    """Test 10: GET /api/balance/transactions with filters"""
    try:
        print("\n=== Test 10: GET /api/balance/transactions ===")
        
        # Get fast account
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        
        if not fast_account:
            log_test("GET /api/balance/transactions", False, "Fast account not found")
            return False
        
        # Test with accountId filter
        response = requests.get(f"{BASE_URL}/balance/transactions?accountId={fast_account['id']}&limit=20", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/balance/transactions", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if not isinstance(data, list):
            log_test("GET /api/balance/transactions", False, "Response is not an array")
            return False
        
        # Verify structure if transactions exist
        if len(data) > 0:
            tx = data[0]
            required_fields = ['id', 'accountId', 'accountName', 'type', 'amount', 'balanceBefore', 'balanceAfter', 'description', 'createdBy', 'createdByName', 'createdAt']
            missing_fields = [f for f in required_fields if f not in tx]
            
            if missing_fields:
                log_test("GET /api/balance/transactions", False, f"Missing fields: {missing_fields}")
                return False
            
            log_test("GET /api/balance/transactions", True, f"Found {len(data)} transactions with correct structure")
        else:
            log_test("GET /api/balance/transactions", True, "No transactions found (empty array)")
        
        # Test with type filter
        response = requests.get(f"{BASE_URL}/balance/transactions?type=deposit", timeout=10)
        
        if response.status_code == 200:
            deposits = response.json()
            deposit_types = [t['type'] for t in deposits if 'type' in t]
            if all(t == 'deposit' for t in deposit_types):
                log_test("GET /api/balance/transactions (type filter)", True, f"Type filter working: found {len(deposits)} deposit transactions")
            else:
                log_test("GET /api/balance/transactions (type filter)", False, "Type filter not working correctly")
        else:
            log_test("GET /api/balance/transactions (type filter)", False, f"Expected 200, got {response.status_code}")
        
        return True
        
    except Exception as e:
        log_test("GET /api/balance/transactions", False, f"Exception: {str(e)}")
        return False

def test_get_summary():
    """Test 11: GET /api/balance/summary"""
    try:
        print("\n=== Test 11: GET /api/balance/summary ===")
        
        response = requests.get(f"{BASE_URL}/balance/summary", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/balance/summary", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if not isinstance(data, list):
            log_test("GET /api/balance/summary", False, "Response is not an array")
            return False
        
        # Verify structure
        if len(data) > 0:
            summary = data[0]
            required_fields = ['todayDeposit', 'todayWithdraw', 'monthDeposit', 'monthWithdraw', 'yearDeposit', 'yearWithdraw']
            missing_fields = [f for f in required_fields if f not in summary]
            
            if missing_fields:
                log_test("GET /api/balance/summary", False, f"Missing fields: {missing_fields}")
                return False
            
            # Verify all values are numbers
            all_numbers = all(isinstance(summary[f], (int, float)) for f in required_fields)
            
            if all_numbers:
                log_test("GET /api/balance/summary", True, f"Summary returned for {len(data)} accounts with all numeric fields")
            else:
                log_test("GET /api/balance/summary", False, "Some fields are not numbers")
        else:
            log_test("GET /api/balance/summary", True, "No accounts found (empty array)")
        
        return True
        
    except Exception as e:
        log_test("GET /api/balance/summary", False, f"Exception: {str(e)}")
        return False

def test_update_account():
    """Test 12: PUT /api/balance/accounts/:id"""
    try:
        print("\n=== Test 12: PUT /api/balance/accounts/:id ===")
        
        # Get fast account
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        
        if not fast_account:
            log_test("PUT /api/balance/accounts/:id", False, "Fast account not found")
            return False
        
        original_name = fast_account['name']
        original_icon = fast_account['icon']
        
        payload = {
            "name": "رصيد Fast - معدل",
            "icon": "⚡⚡"
        }
        
        response = requests.put(f"{BASE_URL}/balance/accounts/{fast_account['id']}", json=payload, timeout=10)
        
        if response.status_code != 200:
            log_test("PUT /api/balance/accounts/:id", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if not data.get('success'):
            log_test("PUT /api/balance/accounts/:id", False, "Success field not true")
            return False
        
        # Verify changes persisted
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        updated_account = next((a for a in accounts if a['id'] == fast_account['id']), None)
        
        if updated_account and updated_account['name'] == "رصيد Fast - معدل" and updated_account['icon'] == "⚡⚡":
            log_test("PUT /api/balance/accounts/:id", True, "Account updated successfully, changes persisted")
        else:
            log_test("PUT /api/balance/accounts/:id", False, "Changes not persisted correctly")
        
        # Restore original values
        restore_payload = {
            "name": original_name,
            "icon": original_icon
        }
        requests.put(f"{BASE_URL}/balance/accounts/{fast_account['id']}", json=restore_payload, timeout=10)
        
        return True
        
    except Exception as e:
        log_test("PUT /api/balance/accounts/:id", False, f"Exception: {str(e)}")
        return False

def test_auto_deduct():
    """Test 13: AUTO-DEDUCT on subscriber activation (CRITICAL)"""
    try:
        print("\n=== Test 13: AUTO-DEDUCT on subscriber activation (CRITICAL) ===")
        
        # Get fast account current balance
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        
        if not fast_account:
            log_test("AUTO-DEDUCT test", False, "Fast account not found")
            return False
        
        fast_balance_before = fast_account['balance']
        print(f"   Fast account balance before activation: {fast_balance_before}")
        
        # Get a subscriber to activate
        subscribers_response = requests.get(f"{BASE_URL}/subscribers", timeout=10)
        subscribers = subscribers_response.json()
        
        # Find an inactive subscriber or create one
        test_subscriber = next((s for s in subscribers if s.get('status') != 'active'), None)
        
        if not test_subscriber:
            # Create a test subscriber
            print("   Creating test subscriber...")
            create_payload = {
                "name": "مشترك اختبار تسقيط",
                "phone": "07700000999",
                "address": "بغداد - الكرادة",
                "zoneId": subscribers[0]['zoneId'] if len(subscribers) > 0 else None,
                "status": "inactive"
            }
            create_response = requests.post(f"{BASE_URL}/subscribers", json=create_payload, timeout=10)
            if create_response.status_code == 200 or create_response.status_code == 201:
                test_subscriber = create_response.json()
            else:
                log_test("AUTO-DEDUCT test", False, "Failed to create test subscriber")
                return False
        
        print(f"   Using subscriber: {test_subscriber['name']} (ID: {test_subscriber['id']})")
        
        # Get packages
        packages_response = requests.get(f"{BASE_URL}/packages", timeout=10)
        packages = packages_response.json()
        
        if len(packages) == 0:
            log_test("AUTO-DEDUCT test", False, "No packages found")
            return False
        
        test_package = packages[0]
        print(f"   Using package: {test_package['name']}")
        
        # Get agents
        agents_response = requests.get(f"{BASE_URL}/agents", timeout=10)
        agents = agents_response.json()
        
        if len(agents) == 0:
            log_test("AUTO-DEDUCT test", False, "No agents found")
            return False
        
        test_agent = agents[0]
        
        # Activate subscriber with fastpay payment method
        activation_amount = 25000
        activation_payload = {
            "packageId": test_package['id'],
            "speed": test_package['speed'],
            "amount": activation_amount,
            "paymentMethod": "fastpay",
            "durationMonths": 1,
            "agentId": test_agent['id'],
            "notes": "تفعيل اختبار للتسقيط التلقائي"
        }
        
        print(f"   Activating subscriber with amount: {activation_amount} IQD via fastpay...")
        activation_response = requests.post(f"{BASE_URL}/subscribers/{test_subscriber['id']}/activate", json=activation_payload, timeout=10)
        
        if activation_response.status_code not in [200, 201]:
            log_test("AUTO-DEDUCT test", False, f"Activation failed with status {activation_response.status_code}")
            return False
        
        activation_data = activation_response.json()
        print(f"   Activation successful")
        
        # Get fast account balance after activation
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account_after = next((a for a in accounts if a['key'] == 'fast'), None)
        
        fast_balance_after = fast_account_after['balance']
        print(f"   Fast account balance after activation: {fast_balance_after}")
        
        expected_balance = fast_balance_before - activation_amount
        
        if fast_balance_after == expected_balance:
            log_test("AUTO-DEDUCT test - balance deduction", True, f"Fast account balance decreased by exactly {activation_amount} IQD ({fast_balance_before} → {fast_balance_after})")
        else:
            log_test("AUTO-DEDUCT test - balance deduction", False, f"Balance mismatch: expected {expected_balance}, got {fast_balance_after}")
        
        # Verify transaction created
        tx_response = requests.get(f"{BASE_URL}/balance/transactions?accountId={fast_account['id']}&limit=5", timeout=10)
        transactions = tx_response.json()
        
        auto_deduct_tx = next((t for t in transactions if t.get('type') == 'auto_deduct' and t.get('subscriberId') == test_subscriber['id']), None)
        
        if auto_deduct_tx:
            # Verify transaction details
            checks = []
            checks.append(auto_deduct_tx['type'] == 'auto_deduct')
            checks.append(auto_deduct_tx['linkedEntity'] == 'activation')
            checks.append(auto_deduct_tx['subscriberId'] == test_subscriber['id'])
            checks.append(auto_deduct_tx['subscriberName'] == test_subscriber['name'])
            checks.append(auto_deduct_tx['amount'] == activation_amount)
            
            if all(checks):
                log_test("AUTO-DEDUCT test - transaction", True, f"Auto-deduct transaction created with correct details (type=auto_deduct, linkedEntity=activation, amount={activation_amount})")
            else:
                log_test("AUTO-DEDUCT test - transaction", False, f"Transaction details incorrect: {auto_deduct_tx}")
        else:
            log_test("AUTO-DEDUCT test - transaction", False, "Auto-deduct transaction not found")
        
        # Cleanup: delete test subscriber
        print(f"   Cleaning up test subscriber...")
        requests.delete(f"{BASE_URL}/subscribers/{test_subscriber['id']}", timeout=10)
        
        return True
        
    except Exception as e:
        log_test("AUTO-DEDUCT test", False, f"Exception: {str(e)}")
        return False

def test_delete_transaction():
    """Test 14: DELETE /api/balance/transactions/:id"""
    try:
        print("\n=== Test 14: DELETE /api/balance/transactions/:id ===")
        
        # Get fast account
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        
        if not fast_account:
            log_test("DELETE /api/balance/transactions/:id", False, "Fast account not found")
            return False
        
        balance_before = fast_account['balance']
        
        # Create a test deposit
        deposit_payload = {
            "accountId": fast_account['id'],
            "amount": 50000,
            "description": "إيداع اختبار للحذف"
        }
        
        deposit_response = requests.post(f"{BASE_URL}/balance/deposit", json=deposit_payload, timeout=10)
        
        if deposit_response.status_code != 200:
            log_test("DELETE /api/balance/transactions/:id", False, "Failed to create test deposit")
            return False
        
        deposit_data = deposit_response.json()
        transaction_id = deposit_data['transaction']['id']
        
        # Get balance after deposit
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account_after_deposit = next((a for a in accounts if a['key'] == 'fast'), None)
        balance_after_deposit = fast_account_after_deposit['balance']
        
        print(f"   Created test deposit: {transaction_id}, balance: {balance_before} → {balance_after_deposit}")
        
        # Delete the transaction
        delete_response = requests.delete(f"{BASE_URL}/balance/transactions/{transaction_id}", timeout=10)
        
        if delete_response.status_code != 200:
            log_test("DELETE /api/balance/transactions/:id", False, f"Expected 200, got {delete_response.status_code}")
            return False
        
        # Verify balance reverted
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account_after_delete = next((a for a in accounts if a['key'] == 'fast'), None)
        balance_after_delete = fast_account_after_delete['balance']
        
        if balance_after_delete == balance_before:
            log_test("DELETE /api/balance/transactions/:id", True, f"Transaction deleted, balance reverted: {balance_after_deposit} → {balance_after_delete}")
        else:
            log_test("DELETE /api/balance/transactions/:id", False, f"Balance not reverted correctly: expected {balance_before}, got {balance_after_delete}")
        
        return True
        
    except Exception as e:
        log_test("DELETE /api/balance/transactions/:id", False, f"Exception: {str(e)}")
        return False

def test_delete_account():
    """Test 15: DELETE /api/balance/accounts/:id"""
    try:
        print("\n=== Test 15: DELETE /api/balance/accounts/:id ===")
        
        # Create a test account
        create_payload = {
            "name": "حساب للحذف",
            "type": "other",
            "icon": "🗑️",
            "color": "#999999"
        }
        
        create_response = requests.post(f"{BASE_URL}/balance/accounts", json=create_payload, timeout=10)
        
        if create_response.status_code != 200:
            log_test("DELETE /api/balance/accounts/:id", False, "Failed to create test account")
            return False
        
        test_account = create_response.json()
        account_id = test_account['id']
        
        print(f"   Created test account: {account_id}")
        
        # Try to delete (should succeed - no transactions, zero balance)
        delete_response = requests.delete(f"{BASE_URL}/balance/accounts/{account_id}", timeout=10)
        
        if delete_response.status_code != 200:
            log_test("DELETE /api/balance/accounts/:id (empty account)", False, f"Expected 200, got {delete_response.status_code}")
            return False
        
        log_test("DELETE /api/balance/accounts/:id (empty account)", True, "Successfully deleted account with no transactions and zero balance")
        
        # Test deleting account with transactions
        # Get fast account (has transactions)
        accounts_response = requests.get(f"{BASE_URL}/balance/accounts", timeout=10)
        accounts = accounts_response.json()
        fast_account = next((a for a in accounts if a['key'] == 'fast'), None)
        
        if fast_account:
            delete_response = requests.delete(f"{BASE_URL}/balance/accounts/{fast_account['id']}", timeout=10)
            
            if delete_response.status_code == 400:
                data = delete_response.json()
                if 'error' in data and ('يوجد رصيد أو معاملات' in data['error'] or 'لا يمكن الحذف' in data['error']):
                    log_test("DELETE /api/balance/accounts/:id (with transactions)", True, "Correctly rejected deletion of account with transactions")
                else:
                    log_test("DELETE /api/balance/accounts/:id (with transactions)", False, f"Wrong error message: {data}")
            else:
                log_test("DELETE /api/balance/accounts/:id (with transactions)", False, f"Expected 400, got {delete_response.status_code}")
        
        return True
        
    except Exception as e:
        log_test("DELETE /api/balance/accounts/:id", False, f"Exception: {str(e)}")
        return False

def test_regression():
    """Test 16: Regression checks"""
    try:
        print("\n=== Test 16: Regression checks ===")
        
        endpoints = [
            ("/dashboard/stats", "Dashboard stats"),
            ("/whatsapp/status", "WhatsApp status"),
            ("/isp-sync/logs", "ISP sync logs"),
            ("/notifications/admin", "Admin notifications"),
            ("/tasks", "Tasks"),
            ("/health", "Health check")
        ]
        
        all_passed = True
        
        for endpoint, name in endpoints:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
                if response.status_code == 200:
                    print(f"   ✅ {name}: 200")
                else:
                    print(f"   ❌ {name}: {response.status_code}")
                    all_passed = False
            except Exception as e:
                print(f"   ❌ {name}: Exception - {str(e)}")
                all_passed = False
        
        # Special check for health endpoint
        try:
            health_response = requests.get(f"{BASE_URL}/health", timeout=10)
            if health_response.status_code == 200:
                health_data = health_response.json()
                if health_data.get('dbConnected') == True:
                    print(f"   ✅ Database connected: true")
                else:
                    print(f"   ⚠️  Database connected: {health_data.get('dbConnected')}")
                    all_passed = False
        except:
            pass
        
        if all_passed:
            log_test("Regression checks", True, "All regression endpoints working")
        else:
            log_test("Regression checks", False, "Some regression endpoints failed")
        
        return all_passed
        
    except Exception as e:
        log_test("Regression checks", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all balance management tests"""
    print("=" * 80)
    print("BALANCE MANAGEMENT BACKEND TESTING")
    print("=" * 80)
    print(f"Backend URL: {BASE_URL}")
    print(f"Started at: {datetime.now().isoformat()}")
    print("=" * 80)
    
    # Test 1: Get balance accounts (auto-seeds 5 defaults)
    accounts_data = test_get_balance_accounts()
    
    if not accounts_data:
        print("\n❌ CRITICAL: Failed to get balance accounts. Stopping tests.")
        sys.exit(1)
    
    fast_account = accounts_data['fast']
    master_account = accounts_data['master']
    
    # Test 2: Create new account
    new_account = test_create_account()
    
    # Test 3: Deposit to fast account
    if fast_account:
        test_deposit(fast_account['id'], fast_account['name'])
    
    # Test 4: Withdraw from fast account
    if fast_account:
        test_withdraw(fast_account['id'], fast_account['name'])
    
    # Test 5: Withdraw with insufficient balance
    test_withdraw_insufficient()
    
    # Test 6: Withdraw with overdraft
    test_withdraw_overdraft()
    
    # Test 7: Transfer between accounts
    test_transfer()
    
    # Test 8: Transfer to same account (should fail)
    test_transfer_same_account()
    
    # Test 9: Transfer with insufficient source balance
    test_transfer_insufficient()
    
    # Test 10: Get transactions with filters
    test_get_transactions()
    
    # Test 11: Get summary
    test_get_summary()
    
    # Test 12: Update account
    test_update_account()
    
    # Test 13: AUTO-DEDUCT on activation (CRITICAL)
    test_auto_deduct()
    
    # Test 14: Delete transaction
    test_delete_transaction()
    
    # Test 15: Delete account
    test_delete_account()
    
    # Test 16: Regression checks
    test_regression()
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Total tests: {tests_passed + tests_failed}")
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {tests_failed}")
    print(f"Success rate: {(tests_passed / (tests_passed + tests_failed) * 100):.1f}%")
    print("=" * 80)
    
    if tests_failed > 0:
        print("\n❌ FAILED TESTS:")
        for result in test_results:
            if not result['passed']:
                print(f"  - {result['name']}")
                if result['details']:
                    print(f"    {result['details']}")
    
    print(f"\nCompleted at: {datetime.now().isoformat()}")
    
    # Exit with appropriate code
    sys.exit(0 if tests_failed == 0 else 1)

if __name__ == "__main__":
    main()
