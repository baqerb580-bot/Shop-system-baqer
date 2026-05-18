#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Ghazlan ERP
Tests all endpoints: Dashboard, Products, POS, Subscribers, Zones, NOC, Repairs, Employees, Camera Contracts, Reports, AI
"""

import requests
import json
import sys

BASE_URL = "https://isp-noc-hub.preview.emergentagent.com/api"

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"   {details}")
    return passed

def test_dashboard_stats():
    """Test GET /api/dashboard/stats"""
    print("\n=== Testing Dashboard Stats ===")
    try:
        resp = requests.get(f"{BASE_URL}/dashboard/stats", timeout=10)
        if resp.status_code != 200:
            return print_test("Dashboard stats", False, f"Status: {resp.status_code}")
        
        data = resp.json()
        required_fields = ['totalProducts', 'totalSubscribers', 'activeSubscribers', 'totalRepairs', 
                          'pendingRepairs', 'totalEmployees', 'totalZones', 'onlineZones', 
                          'totalRevenue', 'monthlyIncome', 'totalDebt', 'lowStockCount', 
                          'lowStock', 'salesChart']
        
        missing = [f for f in required_fields if f not in data]
        if missing:
            return print_test("Dashboard stats", False, f"Missing fields: {missing}")
        
        # Verify salesChart has 7 days
        if len(data.get('salesChart', [])) != 7:
            return print_test("Dashboard stats", False, f"salesChart should have 7 days, got {len(data.get('salesChart', []))}")
        
        return print_test("Dashboard stats", True, f"Total products: {data['totalProducts']}, Subscribers: {data['totalSubscribers']}")
    except Exception as e:
        return print_test("Dashboard stats", False, f"Exception: {str(e)}")

def test_products_crud():
    """Test Products CRUD operations"""
    print("\n=== Testing Products CRUD ===")
    all_passed = True
    
    # GET products
    try:
        resp = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp.status_code != 200:
            all_passed = print_test("GET products", False, f"Status: {resp.status_code}") and all_passed
        else:
            products = resp.json()
            if not isinstance(products, list):
                all_passed = print_test("GET products", False, "Response is not a list") and all_passed
            else:
                all_passed = print_test("GET products", True, f"Found {len(products)} products") and all_passed
    except Exception as e:
        all_passed = print_test("GET products", False, f"Exception: {str(e)}") and all_passed
    
    # POST new product
    new_product = {
        "name": "سماعة JBL Flip 6",
        "sku": "JBLF6",
        "barcode": "2000001",
        "category": "accessories",
        "price": 125000,
        "cost": 95000,
        "stock": 20,
        "lowStockAlert": 5,
        "image": "🔊"
    }
    created_id = None
    try:
        resp = requests.post(f"{BASE_URL}/products", json=new_product, timeout=10)
        if resp.status_code != 201:
            all_passed = print_test("POST product", False, f"Status: {resp.status_code}") and all_passed
        else:
            created = resp.json()
            if 'id' not in created:
                all_passed = print_test("POST product", False, "No ID in response") and all_passed
            else:
                created_id = created['id']
                all_passed = print_test("POST product", True, f"Created product ID: {created_id}") and all_passed
    except Exception as e:
        all_passed = print_test("POST product", False, f"Exception: {str(e)}") and all_passed
    
    # PUT update product
    if created_id:
        try:
            update_data = {"price": 130000, "stock": 25}
            resp = requests.put(f"{BASE_URL}/products/{created_id}", json=update_data, timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("PUT product", False, f"Status: {resp.status_code}") and all_passed
            else:
                updated = resp.json()
                if updated.get('price') != 130000:
                    all_passed = print_test("PUT product", False, f"Price not updated: {updated.get('price')}") and all_passed
                else:
                    all_passed = print_test("PUT product", True, f"Updated price to {updated['price']}") and all_passed
        except Exception as e:
            all_passed = print_test("PUT product", False, f"Exception: {str(e)}") and all_passed
    
    # DELETE product
    if created_id:
        try:
            resp = requests.delete(f"{BASE_URL}/products/{created_id}", timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("DELETE product", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("DELETE product", True, "Product deleted successfully") and all_passed
        except Exception as e:
            all_passed = print_test("DELETE product", False, f"Exception: {str(e)}") and all_passed
    
    return all_passed

def test_barcode_lookup():
    """Test GET /api/products/barcode/:code"""
    print("\n=== Testing Barcode Lookup ===")
    try:
        # Test with existing barcode from seed data
        resp = requests.get(f"{BASE_URL}/products/barcode/1000001", timeout=10)
        if resp.status_code != 200:
            return print_test("Barcode lookup", False, f"Status: {resp.status_code}")
        
        product = resp.json()
        if 'barcode' not in product or product['barcode'] != '1000001':
            return print_test("Barcode lookup", False, f"Wrong product returned: {product.get('barcode')}")
        
        return print_test("Barcode lookup", True, f"Found: {product.get('name')}")
    except Exception as e:
        return print_test("Barcode lookup", False, f"Exception: {str(e)}")

def test_pos_checkout():
    """Test POST /api/pos/checkout"""
    print("\n=== Testing POS Checkout ===")
    try:
        # First get a product to checkout
        resp = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp.status_code != 200:
            return print_test("POS checkout", False, "Cannot get products for checkout")
        
        products = resp.json()
        if len(products) == 0:
            return print_test("POS checkout", False, "No products available")
        
        # Get initial stock
        product = products[0]
        initial_stock = product.get('stock', 0)
        
        # Create checkout
        checkout_data = {
            "items": [
                {
                    "id": product['id'],
                    "name": product['name'],
                    "price": product['price'],
                    "quantity": 2
                }
            ],
            "discount": 5000,
            "paymentMethod": "cash",
            "cashier": "زهراء حسين",
            "customer": "عميل تجريبي"
        }
        
        resp = requests.post(f"{BASE_URL}/pos/checkout", json=checkout_data, timeout=10)
        if resp.status_code != 201:
            return print_test("POS checkout", False, f"Status: {resp.status_code}, Response: {resp.text}")
        
        sale = resp.json()
        required_fields = ['id', 'invoiceNumber', 'items', 'subtotal', 'discount', 'total']
        missing = [f for f in required_fields if f not in sale]
        if missing:
            return print_test("POS checkout", False, f"Missing fields: {missing}")
        
        # Verify stock was decremented
        resp = requests.get(f"{BASE_URL}/products", timeout=10)
        products_after = resp.json()
        product_after = next((p for p in products_after if p['id'] == product['id']), None)
        
        if product_after:
            expected_stock = initial_stock - 2
            if product_after['stock'] != expected_stock:
                return print_test("POS checkout", False, f"Stock not decremented correctly. Expected: {expected_stock}, Got: {product_after['stock']}")
        
        return print_test("POS checkout", True, f"Invoice: {sale['invoiceNumber']}, Total: {sale['total']}")
    except Exception as e:
        return print_test("POS checkout", False, f"Exception: {str(e)}")

def test_subscribers_crud():
    """Test Subscribers CRUD operations"""
    print("\n=== Testing Subscribers CRUD ===")
    all_passed = True
    
    # GET subscribers
    try:
        resp = requests.get(f"{BASE_URL}/subscribers", timeout=10)
        if resp.status_code != 200:
            all_passed = print_test("GET subscribers", False, f"Status: {resp.status_code}") and all_passed
        else:
            subs = resp.json()
            all_passed = print_test("GET subscribers", True, f"Found {len(subs)} subscribers") and all_passed
    except Exception as e:
        all_passed = print_test("GET subscribers", False, f"Exception: {str(e)}") and all_passed
    
    # Get a zone for the new subscriber
    zone_id = None
    try:
        resp = requests.get(f"{BASE_URL}/zones", timeout=10)
        if resp.status_code == 200:
            zones = resp.json()
            if len(zones) > 0:
                zone_id = zones[0]['id']
    except:
        pass
    
    # POST new subscriber
    new_sub = {
        "name": "عمار الجبوري",
        "phone": "07909876543",
        "package": "100 Mbps",
        "fee": 50000,
        "zoneId": zone_id,
        "zoneName": "زون تجريبي",
        "address": "بغداد - الكرادة - شارع 10",
        "ipAddress": "10.10.99.99",
        "macAddress": "AA:BB:CC:DD:EE:FF",
        "status": "active",
        "debt": 0,
        "dueDate": "2025-02-01"
    }
    created_id = None
    try:
        resp = requests.post(f"{BASE_URL}/subscribers", json=new_sub, timeout=10)
        if resp.status_code != 201:
            all_passed = print_test("POST subscriber", False, f"Status: {resp.status_code}") and all_passed
        else:
            created = resp.json()
            created_id = created.get('id')
            all_passed = print_test("POST subscriber", True, f"Created subscriber ID: {created_id}") and all_passed
    except Exception as e:
        all_passed = print_test("POST subscriber", False, f"Exception: {str(e)}") and all_passed
    
    # PUT update subscriber
    if created_id:
        try:
            update_data = {"status": "suspended", "debt": 50000}
            resp = requests.put(f"{BASE_URL}/subscribers/{created_id}", json=update_data, timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("PUT subscriber", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("PUT subscriber", True, "Subscriber updated") and all_passed
        except Exception as e:
            all_passed = print_test("PUT subscriber", False, f"Exception: {str(e)}") and all_passed
    
    # DELETE subscriber
    if created_id:
        try:
            resp = requests.delete(f"{BASE_URL}/subscribers/{created_id}", timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("DELETE subscriber", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("DELETE subscriber", True, "Subscriber deleted") and all_passed
        except Exception as e:
            all_passed = print_test("DELETE subscriber", False, f"Exception: {str(e)}") and all_passed
    
    return all_passed

def test_zones_crud():
    """Test Zones CRUD operations"""
    print("\n=== Testing Zones CRUD ===")
    all_passed = True
    
    # GET zones
    try:
        resp = requests.get(f"{BASE_URL}/zones", timeout=10)
        if resp.status_code != 200:
            all_passed = print_test("GET zones", False, f"Status: {resp.status_code}") and all_passed
        else:
            zones = resp.json()
            all_passed = print_test("GET zones", True, f"Found {len(zones)} zones") and all_passed
    except Exception as e:
        all_passed = print_test("GET zones", False, f"Exception: {str(e)}") and all_passed
    
    # POST new zone
    new_zone = {
        "name": "زون الأعظمية",
        "location": "بغداد - الأعظمية",
        "lat": 33.3650,
        "lng": 44.3950,
        "status": "online",
        "subscribers": 0,
        "fats": 5,
        "utilization": 45
    }
    created_id = None
    try:
        resp = requests.post(f"{BASE_URL}/zones", json=new_zone, timeout=10)
        if resp.status_code != 201:
            all_passed = print_test("POST zone", False, f"Status: {resp.status_code}") and all_passed
        else:
            created = resp.json()
            created_id = created.get('id')
            all_passed = print_test("POST zone", True, f"Created zone ID: {created_id}") and all_passed
    except Exception as e:
        all_passed = print_test("POST zone", False, f"Exception: {str(e)}") and all_passed
    
    # PUT update zone
    if created_id:
        try:
            update_data = {"status": "warning", "utilization": 88}
            resp = requests.put(f"{BASE_URL}/zones/{created_id}", json=update_data, timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("PUT zone", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("PUT zone", True, "Zone updated") and all_passed
        except Exception as e:
            all_passed = print_test("PUT zone", False, f"Exception: {str(e)}") and all_passed
    
    # DELETE zone
    if created_id:
        try:
            resp = requests.delete(f"{BASE_URL}/zones/{created_id}", timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("DELETE zone", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("DELETE zone", True, "Zone deleted") and all_passed
        except Exception as e:
            all_passed = print_test("DELETE zone", False, f"Exception: {str(e)}") and all_passed
    
    return all_passed

def test_noc_status():
    """Test GET /api/noc/status"""
    print("\n=== Testing NOC Status ===")
    try:
        resp = requests.get(f"{BASE_URL}/noc/status", timeout=10)
        if resp.status_code != 200:
            return print_test("NOC status", False, f"Status: {resp.status_code}")
        
        data = resp.json()
        required_fields = ['zones', 'activeConnections', 'totalTraffic', 'alerts']
        missing = [f for f in required_fields if f not in data]
        if missing:
            return print_test("NOC status", False, f"Missing fields: {missing}")
        
        # Verify zones have live data (ping, packetLoss, uplink, downlink)
        if len(data['zones']) > 0:
            zone = data['zones'][0]
            live_fields = ['ping', 'packetLoss', 'uplink', 'downlink']
            missing_live = [f for f in live_fields if f not in zone]
            if missing_live:
                return print_test("NOC status", False, f"Missing live fields in zone: {missing_live}")
        
        return print_test("NOC status", True, f"Active connections: {data['activeConnections']}, Alerts: {len(data['alerts'])}")
    except Exception as e:
        return print_test("NOC status", False, f"Exception: {str(e)}")

def test_repairs_crud():
    """Test Repairs CRUD operations with auto ticket numbering"""
    print("\n=== Testing Repairs CRUD ===")
    all_passed = True
    
    # GET repairs
    try:
        resp = requests.get(f"{BASE_URL}/repairs", timeout=10)
        if resp.status_code != 200:
            all_passed = print_test("GET repairs", False, f"Status: {resp.status_code}") and all_passed
        else:
            repairs = resp.json()
            all_passed = print_test("GET repairs", True, f"Found {len(repairs)} repairs") and all_passed
    except Exception as e:
        all_passed = print_test("GET repairs", False, f"Exception: {str(e)}") and all_passed
    
    # POST new repair (should auto-generate ticket number)
    new_repair = {
        "customerName": "خالد الربيعي",
        "phone": "07908765432",
        "device": "iPhone 14 Pro",
        "imei": "359876543210987",
        "issue": "كاميرا خلفية لا تعمل",
        "technician": "علي السوداني",
        "status": "pending",
        "cost": 120000,
        "partsCost": 95000
    }
    created_id = None
    ticket_number = None
    try:
        resp = requests.post(f"{BASE_URL}/repairs", json=new_repair, timeout=10)
        if resp.status_code != 201:
            all_passed = print_test("POST repair", False, f"Status: {resp.status_code}") and all_passed
        else:
            created = resp.json()
            created_id = created.get('id')
            ticket_number = created.get('ticketNumber')
            if not ticket_number or not ticket_number.startswith('RP-'):
                all_passed = print_test("POST repair (auto ticket)", False, f"Invalid ticket: {ticket_number}") and all_passed
            else:
                all_passed = print_test("POST repair (auto ticket)", True, f"Created ticket: {ticket_number}") and all_passed
    except Exception as e:
        all_passed = print_test("POST repair", False, f"Exception: {str(e)}") and all_passed
    
    # PUT update repair status
    if created_id:
        try:
            update_data = {"status": "in_progress"}
            resp = requests.put(f"{BASE_URL}/repairs/{created_id}", json=update_data, timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("PUT repair", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("PUT repair", True, "Repair status updated") and all_passed
        except Exception as e:
            all_passed = print_test("PUT repair", False, f"Exception: {str(e)}") and all_passed
    
    # DELETE repair
    if created_id:
        try:
            resp = requests.delete(f"{BASE_URL}/repairs/{created_id}", timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("DELETE repair", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("DELETE repair", True, "Repair deleted") and all_passed
        except Exception as e:
            all_passed = print_test("DELETE repair", False, f"Exception: {str(e)}") and all_passed
    
    return all_passed

def test_employees_crud():
    """Test Employees CRUD operations"""
    print("\n=== Testing Employees CRUD ===")
    all_passed = True
    
    # GET employees
    try:
        resp = requests.get(f"{BASE_URL}/employees", timeout=10)
        if resp.status_code != 200:
            all_passed = print_test("GET employees", False, f"Status: {resp.status_code}") and all_passed
        else:
            employees = resp.json()
            all_passed = print_test("GET employees", True, f"Found {len(employees)} employees") and all_passed
    except Exception as e:
        all_passed = print_test("GET employees", False, f"Exception: {str(e)}") and all_passed
    
    # POST new employee
    new_emp = {
        "name": "رائد الخفاجي",
        "role": "فني شبكات",
        "phone": "07906666666",
        "salary": 750000,
        "kpi": 90,
        "attendance": "present"
    }
    created_id = None
    try:
        resp = requests.post(f"{BASE_URL}/employees", json=new_emp, timeout=10)
        if resp.status_code != 201:
            all_passed = print_test("POST employee", False, f"Status: {resp.status_code}") and all_passed
        else:
            created = resp.json()
            created_id = created.get('id')
            all_passed = print_test("POST employee", True, f"Created employee ID: {created_id}") and all_passed
    except Exception as e:
        all_passed = print_test("POST employee", False, f"Exception: {str(e)}") and all_passed
    
    # PUT update employee
    if created_id:
        try:
            update_data = {"kpi": 95, "attendance": "late"}
            resp = requests.put(f"{BASE_URL}/employees/{created_id}", json=update_data, timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("PUT employee", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("PUT employee", True, "Employee updated") and all_passed
        except Exception as e:
            all_passed = print_test("PUT employee", False, f"Exception: {str(e)}") and all_passed
    
    # DELETE employee
    if created_id:
        try:
            resp = requests.delete(f"{BASE_URL}/employees/{created_id}", timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("DELETE employee", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("DELETE employee", True, "Employee deleted") and all_passed
        except Exception as e:
            all_passed = print_test("DELETE employee", False, f"Exception: {str(e)}") and all_passed
    
    return all_passed

def test_camera_contracts_crud():
    """Test Camera Contracts CRUD operations"""
    print("\n=== Testing Camera Contracts CRUD ===")
    all_passed = True
    
    # GET camera contracts
    try:
        resp = requests.get(f"{BASE_URL}/camera-contracts", timeout=10)
        if resp.status_code != 200:
            all_passed = print_test("GET camera contracts", False, f"Status: {resp.status_code}") and all_passed
        else:
            contracts = resp.json()
            all_passed = print_test("GET camera contracts", True, f"Found {len(contracts)} contracts") and all_passed
    except Exception as e:
        all_passed = print_test("GET camera contracts", False, f"Exception: {str(e)}") and all_passed
    
    # POST new contract
    new_contract = {
        "client": "صيدلية النور",
        "location": "الكرادة",
        "cameras": 6,
        "type": "تركيب + صيانة",
        "value": 1800000,
        "status": "active",
        "startDate": "2025-01-15"
    }
    created_id = None
    try:
        resp = requests.post(f"{BASE_URL}/camera-contracts", json=new_contract, timeout=10)
        if resp.status_code != 201:
            all_passed = print_test("POST camera contract", False, f"Status: {resp.status_code}") and all_passed
        else:
            created = resp.json()
            created_id = created.get('id')
            all_passed = print_test("POST camera contract", True, f"Created contract ID: {created_id}") and all_passed
    except Exception as e:
        all_passed = print_test("POST camera contract", False, f"Exception: {str(e)}") and all_passed
    
    # PUT update contract
    if created_id:
        try:
            update_data = {"status": "completed", "value": 2000000}
            resp = requests.put(f"{BASE_URL}/camera-contracts/{created_id}", json=update_data, timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("PUT camera contract", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("PUT camera contract", True, "Contract updated") and all_passed
        except Exception as e:
            all_passed = print_test("PUT camera contract", False, f"Exception: {str(e)}") and all_passed
    
    # DELETE contract
    if created_id:
        try:
            resp = requests.delete(f"{BASE_URL}/camera-contracts/{created_id}", timeout=10)
            if resp.status_code != 200:
                all_passed = print_test("DELETE camera contract", False, f"Status: {resp.status_code}") and all_passed
            else:
                all_passed = print_test("DELETE camera contract", True, "Contract deleted") and all_passed
        except Exception as e:
            all_passed = print_test("DELETE camera contract", False, f"Exception: {str(e)}") and all_passed
    
    return all_passed

def test_reports_summary():
    """Test GET /api/reports/summary"""
    print("\n=== Testing Reports Summary ===")
    try:
        resp = requests.get(f"{BASE_URL}/reports/summary", timeout=10)
        if resp.status_code != 200:
            return print_test("Reports summary", False, f"Status: {resp.status_code}")
        
        data = resp.json()
        required_fields = ['totalSales', 'ispRevenue', 'repairRevenue', 'inventoryValue', 
                          'totalRevenue', 'categoryBreakdown', 'pieData']
        missing = [f for f in required_fields if f not in data]
        if missing:
            return print_test("Reports summary", False, f"Missing fields: {missing}")
        
        return print_test("Reports summary", True, f"Total revenue: {data['totalRevenue']}, Inventory value: {data['inventoryValue']}")
    except Exception as e:
        return print_test("Reports summary", False, f"Exception: {str(e)}")

def test_ai_chat():
    """Test POST /api/ai/chat with Emergent LLM"""
    print("\n=== Testing AI Chat (Emergent LLM gpt-4o-mini) ===")
    try:
        chat_data = {
            "message": "كم عدد المشتركين النشطين؟",
            "history": []
        }
        resp = requests.post(f"{BASE_URL}/ai/chat", json=chat_data, timeout=20)
        if resp.status_code != 200:
            return print_test("AI chat", False, f"Status: {resp.status_code}, Response: {resp.text}")
        
        data = resp.json()
        if 'reply' not in data:
            return print_test("AI chat", False, "No 'reply' field in response")
        
        reply = data['reply']
        if not reply or len(reply) < 10:
            return print_test("AI chat", False, f"Reply too short: {reply}")
        
        return print_test("AI chat", True, f"Reply: {reply[:100]}...")
    except Exception as e:
        return print_test("AI chat", False, f"Exception: {str(e)}")

def test_ai_insights():
    """Test GET /api/ai/insights"""
    print("\n=== Testing AI Insights ===")
    try:
        resp = requests.get(f"{BASE_URL}/ai/insights", timeout=10)
        if resp.status_code != 200:
            return print_test("AI insights", False, f"Status: {resp.status_code}")
        
        data = resp.json()
        if 'insights' not in data:
            return print_test("AI insights", False, "No 'insights' field in response")
        
        insights = data['insights']
        if not isinstance(insights, list) or len(insights) == 0:
            return print_test("AI insights", False, "Insights is not a list or empty")
        
        # Verify insight structure
        insight = insights[0]
        required_fields = ['type', 'icon', 'title', 'message']
        missing = [f for f in required_fields if f not in insight]
        if missing:
            return print_test("AI insights", False, f"Missing fields in insight: {missing}")
        
        return print_test("AI insights", True, f"Generated {len(insights)} insights")
    except Exception as e:
        return print_test("AI insights", False, f"Exception: {str(e)}")

def main():
    print("=" * 80)
    print("GHAZLAN ERP - COMPREHENSIVE BACKEND API TEST SUITE")
    print("=" * 80)
    
    results = {}
    
    # High Priority Tests
    results['dashboard'] = test_dashboard_stats()
    results['products'] = test_products_crud()
    results['barcode'] = test_barcode_lookup()
    results['pos'] = test_pos_checkout()
    results['subscribers'] = test_subscribers_crud()
    results['zones'] = test_zones_crud()
    results['noc'] = test_noc_status()
    results['repairs'] = test_repairs_crud()
    results['ai_chat'] = test_ai_chat()
    results['ai_insights'] = test_ai_insights()
    
    # Medium Priority Tests
    results['employees'] = test_employees_crud()
    results['camera_contracts'] = test_camera_contracts_crud()
    results['reports'] = test_reports_summary()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} test groups passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Backend is fully functional.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. See details above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
