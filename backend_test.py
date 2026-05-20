#!/usr/bin/env python3
"""
Backend API Testing for NEW Endpoints (E-commerce Orders, Bcrypt Login, Activity Logs, Accounting)
Tests only the 4 new tasks as specified in review_request.
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def test_orders_crud():
    """Test E-commerce Orders endpoints"""
    log("=" * 80)
    log("TEST 1: E-COMMERCE ORDERS")
    log("=" * 80)
    
    # Get existing products first
    log("\n1.1 Getting existing products to use in order...")
    try:
        r = requests.get(f"{BASE_URL}/products", timeout=10)
        if r.status_code != 200:
            log(f"❌ FAILED: Cannot get products (status {r.status_code})")
            return False
        products = r.json()
        if not products or len(products) == 0:
            log(f"❌ FAILED: No products found in database")
            return False
        product = products[0]
        log(f"✅ Found product: {product.get('name')} (id: {product.get('id')}, price: {product.get('price')})")
    except Exception as e:
        log(f"❌ FAILED: Error getting products: {e}")
        return False
    
    # Test GET /api/orders (empty or existing)
    log("\n1.2 Testing GET /api/orders...")
    try:
        r = requests.get(f"{BASE_URL}/orders", timeout=10)
        if r.status_code != 200:
            log(f"❌ FAILED: GET /api/orders returned {r.status_code}")
            return False
        orders = r.json()
        log(f"✅ GET /api/orders returned {len(orders)} orders")
    except Exception as e:
        log(f"❌ FAILED: Error getting orders: {e}")
        return False
    
    # Test POST /api/orders with missing data
    log("\n1.3 Testing POST /api/orders with missing customerName (should fail)...")
    try:
        r = requests.post(f"{BASE_URL}/orders", json={
            "customerPhone": "07701234567",
            "items": [{"id": product['id'], "quantity": 1}]
        }, timeout=10)
        if r.status_code != 400:
            log(f"❌ FAILED: Expected 400, got {r.status_code}")
            return False
        error_msg = r.json().get('error', '')
        if "بيانات الطلب ناقصة" not in error_msg:
            log(f"❌ FAILED: Expected Arabic error 'بيانات الطلب ناقصة', got: {error_msg}")
            return False
        log(f"✅ Correctly rejected with 400: {error_msg}")
    except Exception as e:
        log(f"❌ FAILED: Error testing missing data: {e}")
        return False
    
    # Test POST /api/orders with non-existent product
    log("\n1.4 Testing POST /api/orders with non-existent product ids...")
    try:
        r = requests.post(f"{BASE_URL}/orders", json={
            "customerName": "أحمد محمد",
            "customerPhone": "07701234567",
            "customerAddress": "بغداد - الكرادة",
            "items": [{"id": "non-existent-id-12345", "quantity": 1}],
            "paymentMethod": "cod"
        }, timeout=10)
        if r.status_code != 400:
            log(f"❌ FAILED: Expected 400, got {r.status_code}")
            return False
        error_msg = r.json().get('error', '')
        if "لا توجد منتجات صالحة" not in error_msg:
            log(f"❌ FAILED: Expected Arabic error 'لا توجد منتجات صالحة', got: {error_msg}")
            return False
        log(f"✅ Correctly rejected with 400: {error_msg}")
    except Exception as e:
        log(f"❌ FAILED: Error testing non-existent product: {e}")
        return False
    
    # Test POST /api/orders with valid data (subtotal < 50000, should have shipping)
    log("\n1.5 Testing POST /api/orders with valid data (subtotal < 50000)...")
    try:
        order_data = {
            "customerName": "علي حسن",
            "customerPhone": "07701234567",
            "customerAddress": "بغداد - الكرادة - شارع 52",
            "items": [{"id": product['id'], "quantity": 2}],
            "paymentMethod": "cod",
            "notes": "توصيل سريع من فضلك"
        }
        r = requests.post(f"{BASE_URL}/orders", json=order_data, timeout=10)
        if r.status_code != 201:
            log(f"❌ FAILED: Expected 201, got {r.status_code}: {r.text}")
            return False
        order = r.json()
        
        # Verify order structure
        if not order.get('orderNumber', '').startswith('ORD-'):
            log(f"❌ FAILED: orderNumber should start with 'ORD-', got: {order.get('orderNumber')}")
            return False
        if order.get('status') != 'pending':
            log(f"❌ FAILED: status should be 'pending', got: {order.get('status')}")
            return False
        
        # Verify shipping calculation
        subtotal = order.get('subtotal', 0)
        shipping = order.get('shipping', 0)
        total = order.get('total', 0)
        
        expected_shipping = 5000 if subtotal < 50000 else 0
        if shipping != expected_shipping:
            log(f"❌ FAILED: shipping should be {expected_shipping} (subtotal={subtotal}), got: {shipping}")
            return False
        
        if total != subtotal + shipping:
            log(f"❌ FAILED: total should be {subtotal + shipping}, got: {total}")
            return False
        
        order_id = order.get('id')
        log(f"✅ Order created: {order.get('orderNumber')}, subtotal={subtotal}, shipping={shipping}, total={total}")
    except Exception as e:
        log(f"❌ FAILED: Error creating order: {e}")
        return False
    
    # Test GET /api/orders?phone=
    log("\n1.6 Testing GET /api/orders?phone=07701234567...")
    try:
        r = requests.get(f"{BASE_URL}/orders?phone=07701234567", timeout=10)
        if r.status_code != 200:
            log(f"❌ FAILED: GET with phone filter returned {r.status_code}")
            return False
        filtered_orders = r.json()
        if len(filtered_orders) == 0:
            log(f"❌ FAILED: Expected at least 1 order with phone 07701234567")
            return False
        log(f"✅ Phone filter returned {len(filtered_orders)} orders")
    except Exception as e:
        log(f"❌ FAILED: Error testing phone filter: {e}")
        return False
    
    # Test POST /api/orders/:id/status with invalid status
    log("\n1.7 Testing POST /api/orders/:id/status with invalid status...")
    try:
        r = requests.post(f"{BASE_URL}/orders/{order_id}/status", json={
            "status": "invalid_status"
        }, timeout=10)
        if r.status_code != 400:
            log(f"❌ FAILED: Expected 400, got {r.status_code}")
            return False
        error_msg = r.json().get('error', '')
        if "حالة غير صالحة" not in error_msg:
            log(f"❌ FAILED: Expected Arabic error 'حالة غير صالحة', got: {error_msg}")
            return False
        log(f"✅ Correctly rejected invalid status with 400: {error_msg}")
    except Exception as e:
        log(f"❌ FAILED: Error testing invalid status: {e}")
        return False
    
    # Test POST /api/orders/:id/status to confirmed
    log("\n1.8 Testing POST /api/orders/:id/status to 'confirmed'...")
    try:
        r = requests.post(f"{BASE_URL}/orders/{order_id}/status", json={
            "status": "confirmed"
        }, timeout=10)
        if r.status_code != 200:
            log(f"❌ FAILED: Status update to confirmed returned {r.status_code}: {r.text}")
            return False
        log(f"✅ Order status updated to 'confirmed'")
    except Exception as e:
        log(f"❌ FAILED: Error updating status to confirmed: {e}")
        return False
    
    # Get product stock before delivery
    log("\n1.9 Getting product stock before delivery...")
    try:
        r = requests.get(f"{BASE_URL}/products", timeout=10)
        products_before = r.json()
        product_before = next((p for p in products_before if p['id'] == product['id']), None)
        if not product_before:
            log(f"❌ FAILED: Cannot find product after order creation")
            return False
        stock_before = product_before.get('stock', 0)
        log(f"✅ Product stock before delivery: {stock_before}")
    except Exception as e:
        log(f"❌ FAILED: Error getting product stock: {e}")
        return False
    
    # Test POST /api/orders/:id/status to delivered (should decrement stock)
    log("\n1.10 Testing POST /api/orders/:id/status to 'delivered' (should decrement stock)...")
    try:
        r = requests.post(f"{BASE_URL}/orders/{order_id}/status", json={
            "status": "delivered"
        }, timeout=10)
        if r.status_code != 200:
            log(f"❌ FAILED: Status update to delivered returned {r.status_code}: {r.text}")
            return False
        log(f"✅ Order status updated to 'delivered'")
        
        # Verify stock was decremented
        time.sleep(0.5)  # Small delay to ensure DB update
        r = requests.get(f"{BASE_URL}/products", timeout=10)
        products_after = r.json()
        product_after = next((p for p in products_after if p['id'] == product['id']), None)
        if not product_after:
            log(f"❌ FAILED: Cannot find product after delivery")
            return False
        stock_after = product_after.get('stock', 0)
        
        expected_stock = stock_before - 2  # We ordered quantity 2
        if stock_after != expected_stock:
            log(f"❌ FAILED: Stock should be {expected_stock} (was {stock_before}, ordered 2), got: {stock_after}")
            return False
        log(f"✅ Product stock correctly decremented: {stock_before} → {stock_after}")
    except Exception as e:
        log(f"❌ FAILED: Error testing delivery stock decrement: {e}")
        return False
    
    # Test DELETE /api/orders/:id
    log("\n1.11 Testing DELETE /api/orders/:id...")
    try:
        r = requests.delete(f"{BASE_URL}/orders/{order_id}", timeout=10)
        if r.status_code != 200:
            log(f"❌ FAILED: DELETE returned {r.status_code}: {r.text}")
            return False
        log(f"✅ Order deleted successfully")
    except Exception as e:
        log(f"❌ FAILED: Error deleting order: {e}")
        return False
    
    log("\n✅ ALL E-COMMERCE ORDERS TESTS PASSED")
    return True


def test_bcrypt_login():
    """Test Bcrypt Employee Login with auto-upgrade"""
    log("\n" + "=" * 80)
    log("TEST 2: BCRYPT EMPLOYEE LOGIN + AUTO-UPGRADE")
    log("=" * 80)
    
    # Test with amer/2004 (should be plaintext initially or already upgraded)
    log("\n2.1 Testing login with amer/2004...")
    try:
        r = requests.post(f"{BASE_URL}/employees/login", json={
            "username": "amer",
            "password": "2004"
        }, timeout=10)
        if r.status_code != 200:
            log(f"❌ FAILED: Login returned {r.status_code}: {r.text}")
            return False
        data = r.json()
        if not data.get('success'):
            log(f"❌ FAILED: Login success should be true")
            return False
        if not data.get('token'):
            log(f"❌ FAILED: Token should be present")
            return False
        if not data.get('employee'):
            log(f"❌ FAILED: Employee object should be present")
            return False
        log(f"✅ Login successful: {data.get('employee', {}).get('name')}, token: {data.get('token')[:20]}...")
    except Exception as e:
        log(f"❌ FAILED: Error testing login: {e}")
        return False
    
    # Test with admin/admin (another valid credential)
    log("\n2.2 Testing login with admin/admin...")
    try:
        r = requests.post(f"{BASE_URL}/employees/login", json={
            "username": "admin",
            "password": "admin"
        }, timeout=10)
        if r.status_code != 200:
            log(f"⚠️  admin/admin login failed (may not exist): {r.status_code}")
        else:
            data = r.json()
            if data.get('success'):
                log(f"✅ Login successful: {data.get('employee', {}).get('name')}")
    except Exception as e:
        log(f"⚠️  admin/admin test skipped: {e}")
    
    # Test login again (should still work with bcrypt)
    log("\n2.3 Testing login again (password should be upgraded to bcrypt now)...")
    try:
        r = requests.post(f"{BASE_URL}/employees/login", json={
            "username": "amer",
            "password": "2004"
        }, timeout=10)
        if r.status_code != 200:
            log(f"❌ FAILED: Second login returned {r.status_code}: {r.text}")
            return False
        data = r.json()
        if not data.get('success'):
            log(f"❌ FAILED: Second login success should be true")
            return False
        log(f"✅ Second login successful (bcrypt.compare working)")
    except Exception as e:
        log(f"❌ FAILED: Error testing second login: {e}")
        return False
    
    # Test with wrong password
    log("\n2.4 Testing login with wrong password...")
    try:
        r = requests.post(f"{BASE_URL}/employees/login", json={
            "username": "amer",
            "password": "wrong_password"
        }, timeout=10)
        if r.status_code != 401:
            log(f"❌ FAILED: Expected 401, got {r.status_code}")
            return False
        error_msg = r.json().get('error', '')
        if "بيانات الدخول خاطئة" not in error_msg:
            log(f"❌ FAILED: Expected Arabic error 'بيانات الدخول خاطئة', got: {error_msg}")
            return False
        log(f"✅ Correctly rejected wrong password with 401: {error_msg}")
    except Exception as e:
        log(f"❌ FAILED: Error testing wrong password: {e}")
        return False
    
    log("\n✅ ALL BCRYPT LOGIN TESTS PASSED")
    return True


def test_activity_logs():
    """Test Activity Logs endpoint"""
    log("\n" + "=" * 80)
    log("TEST 3: ACTIVITY LOGS")
    log("=" * 80)
    
    # Test GET /api/activity-logs
    log("\n3.1 Testing GET /api/activity-logs...")
    try:
        r = requests.get(f"{BASE_URL}/activity-logs", timeout=10)
        if r.status_code != 200:
            log(f"❌ FAILED: GET /api/activity-logs returned {r.status_code}")
            return False
        logs = r.json()
        if not isinstance(logs, list):
            log(f"❌ FAILED: Expected array, got: {type(logs)}")
            return False
        log(f"✅ GET /api/activity-logs returned {len(logs)} log entries")
        
        # Check if we have order_created from previous test
        order_created_logs = [l for l in logs if l.get('action') == 'order_created']
        if len(order_created_logs) > 0:
            log(f"✅ Found {len(order_created_logs)} 'order_created' activity log entries")
        else:
            log(f"⚠️  No 'order_created' entries found (may have been deleted)")
        
        # Check if we have login_failed from previous test
        login_failed_logs = [l for l in logs if l.get('action') == 'login_failed']
        if len(login_failed_logs) > 0:
            log(f"✅ Found {len(login_failed_logs)} 'login_failed' activity log entries")
        else:
            log(f"⚠️  No 'login_failed' entries found")
        
        # Show sample log entry structure
        if len(logs) > 0:
            sample = logs[0]
            log(f"✅ Sample log entry: action={sample.get('action')}, entity={sample.get('entity')}, user={sample.get('user')}")
    except Exception as e:
        log(f"❌ FAILED: Error getting activity logs: {e}")
        return False
    
    log("\n✅ ALL ACTIVITY LOGS TESTS PASSED")
    return True


def test_accounting_summary():
    """Test Accounting Summary endpoint"""
    log("\n" + "=" * 80)
    log("TEST 4: ACCOUNTING SUMMARY")
    log("=" * 80)
    
    # Test GET /api/accounting/summary
    log("\n4.1 Testing GET /api/accounting/summary...")
    try:
        r = requests.get(f"{BASE_URL}/accounting/summary", timeout=10)
        if r.status_code != 200:
            log(f"❌ FAILED: GET /api/accounting/summary returned {r.status_code}")
            return False
        summary = r.json()
        
        # Verify structure
        required_keys = ['period', 'revenue', 'expenses', 'netProfit', 'debts', 'counts', 'breakdown']
        for key in required_keys:
            if key not in summary:
                log(f"❌ FAILED: Missing key '{key}' in summary")
                return False
        
        # Verify revenue structure
        revenue = summary.get('revenue', {})
        if not all(k in revenue for k in ['sales', 'activations', 'repairs', 'total']):
            log(f"❌ FAILED: Revenue missing required keys")
            return False
        
        # Verify expenses structure
        expenses = summary.get('expenses', {})
        if not all(k in expenses for k in ['bonuses', 'salaries', 'advances', 'total']):
            log(f"❌ FAILED: Expenses missing required keys")
            return False
        
        # Verify debts structure
        debts = summary.get('debts', {})
        if not all(k in debts for k in ['count', 'total', 'topDebtors']):
            log(f"❌ FAILED: Debts missing required keys")
            return False
        
        # Verify counts structure
        counts = summary.get('counts', {})
        if not all(k in counts for k in ['sales', 'activations', 'repairs']):
            log(f"❌ FAILED: Counts missing required keys")
            return False
        
        # Verify breakdown is array
        breakdown = summary.get('breakdown', [])
        if not isinstance(breakdown, list):
            log(f"❌ FAILED: Breakdown should be array")
            return False
        
        log(f"✅ Accounting summary structure valid")
        log(f"   Period: {summary.get('period')}")
        log(f"   Revenue: {revenue.get('total')} (sales: {revenue.get('sales')}, activations: {revenue.get('activations')}, repairs: {revenue.get('repairs')})")
        log(f"   Expenses: {expenses.get('total')} (bonuses: {expenses.get('bonuses')}, salaries: {expenses.get('salaries')}, advances: {expenses.get('advances')})")
        log(f"   Net Profit: {summary.get('netProfit')}")
        log(f"   Debts: {debts.get('count')} debtors, total: {debts.get('total')}")
        log(f"   Counts: {counts.get('sales')} sales, {counts.get('activations')} activations, {counts.get('repairs')} repairs")
        log(f"   Breakdown: {len(breakdown)} entries")
        log(f"   Top Debtors: {len(debts.get('topDebtors', []))} entries")
    except Exception as e:
        log(f"❌ FAILED: Error getting accounting summary: {e}")
        return False
    
    log("\n✅ ALL ACCOUNTING SUMMARY TESTS PASSED")
    return True


def main():
    log("=" * 80)
    log("BACKEND API TESTING - NEW ENDPOINTS ONLY")
    log("Testing 4 new tasks: Orders, Bcrypt Login, Activity Logs, Accounting")
    log("=" * 80)
    
    results = {
        "E-commerce Orders": False,
        "Bcrypt Employee Login": False,
        "Activity Logs": False,
        "Accounting Summary": False
    }
    
    # Run tests
    results["E-commerce Orders"] = test_orders_crud()
    results["Bcrypt Employee Login"] = test_bcrypt_login()
    results["Activity Logs"] = test_activity_logs()
    results["Accounting Summary"] = test_accounting_summary()
    
    # Summary
    log("\n" + "=" * 80)
    log("TEST SUMMARY")
    log("=" * 80)
    for task, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        log(f"{status}: {task}")
    
    all_passed = all(results.values())
    if all_passed:
        log("\n🎉 ALL TESTS PASSED!")
    else:
        log("\n❌ SOME TESTS FAILED")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    exit(main())
