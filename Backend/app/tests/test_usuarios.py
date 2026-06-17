def test_login_sucesso(client):
    payload = {
        "email": "teste@gmail.com",
        "senha": "admin"
    }
    response = client.post("/api/usuarios/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "teste@gmail.com"
    assert "id" in data
    assert "nome" in data

def test_login_senha_incorreta(client):
    payload = {
        "email": "teste@gmail.com",
        "senha": "senha_errada"
    }
    response = client.post("/api/usuarios/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "E-mail ou senha incorretos."

def test_login_usuario_inexistente(client):
    payload = {
        "email": "inexistente@gmail.com",
        "senha": "admin"
    }
    response = client.post("/api/usuarios/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "E-mail ou senha incorretos."

def test_registrar_novo_usuario_sucesso(client):
    payload = {
        "nome": "Novo Usuario",
        "email": "novo@gmail.com",
        "senha": "password123"
    }
    response = client.post("/api/usuarios/registrar", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "novo@gmail.com"
    assert data["nome"] == "Novo Usuario"
    assert "id" in data

def test_registrar_usuario_duplicado(client):
    payload = {
        "nome": "Outro Nome",
        "email": "teste@gmail.com", # Email já semeado no conftest
        "senha": "password123"
    }
    response = client.post("/api/usuarios/registrar", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Já existe um usuário cadastrado com este e-mail."
