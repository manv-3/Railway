"""
Enterprise Security Test Suite: Database-Backed Authentication,
Redis Refresh Token Vault, Token Revocation Blacklist, and RBAC Guardrails
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from api.main import app
from database.connection import SessionLocal
from database.models import User

client = TestClient(app)

def test_database_user_login():
    """Verify login against PostgreSQL database credentials and token issuance"""
    response = client.post(
        "/auth/login",
        data={"username": "div_controller", "password": "demo123"}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "div_controller"
    assert data["user"]["tier_role"] == "DIV_CONTROLLER"

def test_auth_me_profile_with_bearer_token():
    """Verify authenticated user profile retrieval via JWT Bearer"""
    # 1. Login to get token
    login_resp = client.post(
        "/auth/login",
        data={"username": "board_exec", "password": "demo123"}
    )
    token = login_resp.json()["access_token"]
    
    # 2. Query /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/auth/me", headers=headers)
    assert me_resp.status_code == 200, me_resp.text
    user_info = me_resp.json()
    assert user_info["username"] == "board_exec"
    assert user_info["tier_role"] == "BOARD_EXEC"
    assert "board@railway.gov.in" in user_info["email"]

def test_refresh_token_rotation_and_vault():
    """Verify single-use refresh token rotation and replay prevention"""
    # 1. Initial Login
    login_resp = client.post(
        "/auth/login",
        data={"username": "zonal_gm", "password": "demo123"}
    )
    initial_tokens = login_resp.json()
    refresh_token = initial_tokens["refresh_token"]
    
    # 2. Use refresh token to rotate
    rotate_resp = client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert rotate_resp.status_code == 200, rotate_resp.text
    rotated_tokens = rotate_resp.json()
    assert "access_token" in rotated_tokens
    assert "refresh_token" in rotated_tokens
    new_refresh = rotated_tokens["refresh_token"]
    assert new_refresh != refresh_token
    
    # 3. Replaying the consumed refresh token MUST be rejected (401)
    replay_resp = client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert replay_resp.status_code == 401

def test_logout_token_revocation_blacklist():
    """Verify logout blacklists access token in Redis and revokes access"""
    # 1. Login
    login_resp = client.post(
        "/auth/login",
        data={"username": "field_sse", "password": "demo123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Verify token works
    pre_resp = client.get("/auth/me", headers=headers)
    assert pre_resp.status_code == 200
    
    # 3. Call logout
    logout_resp = client.post("/auth/logout", headers=headers)
    assert logout_resp.status_code == 200
    assert logout_resp.json()["status"] == "success"
    
    # 4. Token should now be rejected as revoked
    post_resp = client.get("/auth/me", headers=headers)
    assert post_resp.status_code == 401
    assert "revoked" in post_resp.json()["detail"].lower()

def test_list_platform_users_endpoint():
    """Verify /auth/users returns database-backed user roster"""
    resp = client.get("/auth/users")
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert len(data["users"]) >= 5
    usernames = [u["username"] for u in data["users"]]
    assert "board_exec" in usernames
    assert "div_controller" in usernames

def test_admin_user_creation_and_rbac():
    """Verify Board Exec can create new officers and non-admin is blocked"""
    # 1. Login as field_sse (non-admin) and attempt creation -> 403 Forbidden
    field_resp = client.post(
        "/auth/login",
        data={"username": "field_sse", "password": "demo123"}
    )
    field_token = field_resp.json()["access_token"]
    
    unique_suffix = uuid.uuid4().hex[:6]
    new_user_payload = {
        "username": f"test_officer_{unique_suffix}",
        "email": f"officer_{unique_suffix}@railway.gov.in",
        "password": "SecurePassword2026!",
        "full_name": f"Test Officer {unique_suffix}",
        "tier_role": "DIV_CONTROLLER",
        "department": "OPERATING",
        "jurisdiction_id": "DIV_DLI"
    }
    
    forbidden_resp = client.post(
        "/auth/users",
        headers={"Authorization": f"Bearer {field_token}"},
        json=new_user_payload
    )
    assert forbidden_resp.status_code == 403
    
    # 2. Login as board_exec (admin) and successfully create officer -> 201 Created
    board_resp = client.post(
        "/auth/login",
        data={"username": "board_exec", "password": "demo123"}
    )
    board_token = board_resp.json()["access_token"]
    
    create_resp = client.post(
        "/auth/users",
        headers={"Authorization": f"Bearer {board_token}"},
        json=new_user_payload
    )
    assert create_resp.status_code == 201, create_resp.text
    created_data = create_resp.json()
    assert created_data["username"] == new_user_payload["username"]
    
    # 3. Authenticate with the newly created database user
    new_login_resp = client.post(
        "/auth/login",
        data={"username": new_user_payload["username"], "password": new_user_payload["password"]}
    )
    assert new_login_resp.status_code == 200
    assert new_login_resp.json()["user"]["full_name"] == new_user_payload["full_name"]
