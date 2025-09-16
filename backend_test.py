#!/usr/bin/env python3
"""
NexaKey Password Manager Backend API Tests
Tests all backend endpoints including authentication, vault operations, and premium features.
"""

import requests
import json
import uuid
from datetime import datetime
import hashlib
import argon2
import time

# Configuration
BACKEND_URL = "https://keymaster-app-4.preview.emergentagent.com/api"

# Test data
TEST_EMAIL = "john.doe@example.com"
TEST_PASSWORD = "MySecurePassword123!"
TEST_EMAIL_2 = "jane.smith@example.com"
TEST_PASSWORD_2 = "AnotherSecurePass456!"

class NexaKeyAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.access_token = None
        self.user_id = None
        self.ph = argon2.PasswordHasher()
        
    def hash_password(self, password: str) -> str:
        """Hash password using Argon2 (simulating client-side hashing)"""
        return self.ph.hash(password)
    
    def encrypt_data(self, data: dict) -> str:
        """Simulate client-side encryption by JSON encoding (for testing purposes)"""
        return json.dumps(data)
    
    def make_request(self, method: str, endpoint: str, data=None, headers=None, auth_required=True):
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {"Content-Type": "application/json"}
        
        if auth_required and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            return None
    
    def test_health_check(self):
        """Test GET /api/health endpoint"""
        print("\n🔍 Testing Health Check...")
        
        response = self.make_request("GET", "/health", auth_required=False)
        if response is None:
            return False
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy" and data.get("service") == "NexaKey API":
                print("✅ Health check passed")
                return True
            else:
                print(f"❌ Health check failed - unexpected response: {data}")
                return False
        else:
            print(f"❌ Health check failed - status code: {response.status_code}")
            return False
    
    def test_user_registration(self):
        """Test POST /api/auth/register"""
        print("\n🔍 Testing User Registration...")
        
        # Hash password client-side
        master_password_hash = self.hash_password(TEST_PASSWORD)
        
        registration_data = {
            "email": TEST_EMAIL,
            "master_password_hash": master_password_hash,
            "biometric_enabled": False
        }
        
        response = self.make_request("POST", "/auth/register", data=registration_data, auth_required=False)
        if response is None:
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.access_token = data["access_token"]
                self.user_id = data["user"]["id"]
                print(f"✅ User registration successful - User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Registration failed - missing required fields: {data}")
                return False
        else:
            print(f"❌ Registration failed - status code: {response.status_code}")
            if response.text:
                print(f"Response: {response.text}")
            return False
    
    def test_user_login(self):
        """Test POST /api/auth/login"""
        print("\n🔍 Testing User Login...")
        
        # Hash password client-side
        master_password_hash = self.hash_password(TEST_PASSWORD)
        
        login_data = {
            "email": TEST_EMAIL,
            "master_password_hash": master_password_hash
        }
        
        response = self.make_request("POST", "/auth/login", data=login_data, auth_required=False)
        if response is None:
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.access_token = data["access_token"]
                self.user_id = data["user"]["id"]
                print(f"✅ User login successful - User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Login failed - missing required fields: {data}")
                return False
        else:
            print(f"❌ Login failed - status code: {response.status_code}")
            if response.text:
                print(f"Response: {response.text}")
            return False
    
    def test_user_profile(self):
        """Test GET /api/user/profile"""
        print("\n🔍 Testing User Profile...")
        
        response = self.make_request("GET", "/user/profile")
        if response is None:
            return False
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["id", "email", "biometric_enabled", "vault_items_count", "is_premium", "created_at"]
            if all(field in data for field in required_fields):
                print(f"✅ User profile retrieved successfully - Email: {data['email']}, Premium: {data['is_premium']}")
                return True
            else:
                print(f"❌ Profile failed - missing required fields: {data}")
                return False
        else:
            print(f"❌ Profile failed - status code: {response.status_code}")
            return False
    
    def test_create_vault_item(self, item_data=None):
        """Test POST /api/vault/items"""
        if item_data is None:
            item_data = {
                "item_type": "password",
                "encrypted_data": self.encrypt_data({
                    "title": "Gmail Account",
                    "username": "john.doe@gmail.com",
                    "password": "SecurePassword123!",
                    "url": "https://gmail.com",
                    "notes": "Personal email account"
                })
            }
        
        response = self.make_request("POST", "/vault/items", data=item_data)
        if response is None:
            return False, None
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "encrypted_data" in data:
                return True, data["id"]
            else:
                print(f"❌ Create vault item failed - missing required fields: {data}")
                return False, None
        else:
            print(f"❌ Create vault item failed - status code: {response.status_code}")
            if response.text:
                print(f"Response: {response.text}")
            return False, None
    
    def test_vault_operations(self):
        """Test vault CRUD operations"""
        print("\n🔍 Testing Vault Operations...")
        
        # Test creating a vault item
        print("  📝 Creating vault item...")
        success, item_id = self.test_create_vault_item()
        if not success:
            return False
        print(f"  ✅ Vault item created - ID: {item_id}")
        
        # Test retrieving vault items
        print("  📋 Retrieving vault items...")
        response = self.make_request("GET", "/vault/items")
        if response is None or response.status_code != 200:
            print("  ❌ Failed to retrieve vault items")
            return False
        
        items = response.json()
        if not isinstance(items, list) or len(items) == 0:
            print("  ❌ No vault items found")
            return False
        print(f"  ✅ Retrieved {len(items)} vault items")
        
        # Test updating a vault item
        print("  ✏️ Updating vault item...")
        update_data = {
            "encrypted_data": self.encrypt_data({
                "title": "Gmail Account (Updated)",
                "username": "john.doe@gmail.com",
                "password": "NewSecurePassword456!",
                "url": "https://gmail.com",
                "notes": "Personal email account - updated"
            })
        }
        
        response = self.make_request("PUT", f"/vault/items/{item_id}", data=update_data)
        if response is None or response.status_code != 200:
            print("  ❌ Failed to update vault item")
            return False
        print("  ✅ Vault item updated successfully")
        
        # Test deleting a vault item
        print("  🗑️ Deleting vault item...")
        response = self.make_request("DELETE", f"/vault/items/{item_id}")
        if response is None or response.status_code != 200:
            print("  ❌ Failed to delete vault item")
            return False
        print("  ✅ Vault item deleted successfully")
        
        return True
    
    def test_freemium_limits(self):
        """Test freemium limit of 20 items"""
        print("\n🔍 Testing Freemium Limits...")
        
        # Create 20 items (should succeed)
        created_items = []
        print("  📝 Creating 20 vault items...")
        
        for i in range(20):
            item_data = {
                "item_type": "password",
                "encrypted_data": self.encrypt_data({
                    "title": f"Test Account {i+1}",
                    "username": f"user{i+1}@example.com",
                    "password": f"Password{i+1}!",
                    "url": f"https://example{i+1}.com"
                })
            }
            
            success, item_id = self.test_create_vault_item(item_data)
            if success:
                created_items.append(item_id)
            else:
                print(f"  ❌ Failed to create item {i+1}")
                return False
        
        print(f"  ✅ Successfully created {len(created_items)} items")
        
        # Try to create the 21st item (should fail)
        print("  📝 Attempting to create 21st item (should fail)...")
        item_data = {
            "item_type": "password",
            "encrypted_data": self.encrypt_data({
                "title": "21st Item",
                "username": "user21@example.com",
                "password": "Password21!",
                "url": "https://example21.com"
            })
        }
        
        response = self.make_request("POST", "/vault/items", data=item_data)
        if response is None:
            return False
        
        if response.status_code == 403:
            data = response.json()
            if "Free plan limit reached" in data.get("detail", ""):
                print("  ✅ Freemium limit enforced correctly")
                return True
            else:
                print(f"  ❌ Unexpected error message: {data}")
                return False
        else:
            print(f"  ❌ Expected 403 status code, got {response.status_code}")
            return False
    
    def test_premium_upgrade(self):
        """Test POST /api/user/upgrade-premium"""
        print("\n🔍 Testing Premium Upgrade...")
        
        response = self.make_request("POST", "/user/upgrade-premium", data={})
        if response is None:
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "Successfully upgraded" in data.get("message", ""):
                print("✅ Premium upgrade successful")
                
                # Verify premium status in profile
                profile_response = self.make_request("GET", "/user/profile")
                if profile_response and profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    if profile_data.get("is_premium"):
                        print("✅ Premium status confirmed in profile")
                        return True
                    else:
                        print("❌ Premium status not updated in profile")
                        return False
                else:
                    print("❌ Failed to verify premium status")
                    return False
            else:
                print(f"❌ Unexpected upgrade response: {data}")
                return False
        else:
            print(f"❌ Premium upgrade failed - status code: {response.status_code}")
            return False
    
    def test_premium_unlimited_items(self):
        """Test that premium users can create more than 20 items"""
        print("\n🔍 Testing Premium Unlimited Items...")
        
        # Try to create additional items (should succeed for premium users)
        print("  📝 Creating additional items as premium user...")
        
        for i in range(5):  # Create 5 more items
            item_data = {
                "item_type": "password",
                "encrypted_data": self.encrypt_data({
                    "title": f"Premium Item {i+1}",
                    "username": f"premium{i+1}@example.com",
                    "password": f"PremiumPass{i+1}!",
                    "url": f"https://premium{i+1}.com"
                })
            }
            
            success, item_id = self.test_create_vault_item(item_data)
            if not success:
                print(f"  ❌ Failed to create premium item {i+1}")
                return False
        
        print("  ✅ Premium users can create unlimited items")
        return True
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting NexaKey Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        
        test_results = {}
        
        # Test 1: Health Check
        test_results["health_check"] = self.test_health_check()
        
        # Test 2: User Registration
        test_results["user_registration"] = self.test_user_registration()
        
        # Test 3: User Login (using registered user)
        test_results["user_login"] = self.test_user_login()
        
        # Test 4: User Profile
        test_results["user_profile"] = self.test_user_profile()
        
        # Test 5: Vault Operations
        test_results["vault_operations"] = self.test_vault_operations()
        
        # Test 6: Freemium Limits
        test_results["freemium_limits"] = self.test_freemium_limits()
        
        # Test 7: Premium Upgrade
        test_results["premium_upgrade"] = self.test_premium_upgrade()
        
        # Test 8: Premium Unlimited Items
        test_results["premium_unlimited"] = self.test_premium_unlimited_items()
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST RESULTS SUMMARY")
        print("="*60)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! NexaKey backend is working correctly.")
        else:
            print("⚠️ Some tests failed. Please check the issues above.")
        
        return test_results

if __name__ == "__main__":
    tester = NexaKeyAPITester()
    results = tester.run_all_tests()