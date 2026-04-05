import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(async_client: AsyncClient):
    response = await async_client.post("/auth/register", json={
        "email": "newuser@test.com",
        "password": "securepassword",
        "name": "New User"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "User successfully registered"

@pytest.mark.asyncio
async def test_login_user(async_client: AsyncClient, test_user):
    response = await async_client.post("/auth/login", data={
        "username": test_user.email,
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(async_client: AsyncClient):
    response = await async_client.post("/auth/login", data={
        "username": "wrong@test.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
