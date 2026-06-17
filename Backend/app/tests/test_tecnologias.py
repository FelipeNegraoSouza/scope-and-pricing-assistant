def test_listar_tecnologias_usuario_padrao(client):
    headers = {"X-User-Id": "1"}
    response = client.get("/api/tecnologias", headers=headers)
    assert response.status_code == 200
    data = response.json()
    # No conftest semeamos 4 tecnologias
    assert len(data) == 4
    nomes = [t["nome"] for t in data]
    assert "Python" in nomes
    assert "React" in nomes

def test_listar_tecnologias_outro_usuario(client):
    headers = {"X-User-Id": "999"} # Usuário sem tecnologias cadastradas
    response = client.get("/api/tecnologias", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_criar_tecnologia_sucesso(client):
    headers = {"X-User-Id": "1"}
    payload = {
        "nome": "VueJS",
        "custo_base": 120.00,
        "multiplicador": 1.25
    }
    response = client.post("/api/tecnologias", headers=headers, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["nome"] == "VueJS"
    assert float(data["custo_base"]) == 120.00
    assert float(data["multiplicador"]) == 1.25
    assert data["usuario_id"] == 1

def test_criar_tecnologia_duplicada(client):
    headers = {"X-User-Id": "1"}
    payload = {
        "nome": "Python", # Já existe para usuário 1
        "custo_base": 100.00,
        "multiplicador": 1.00
    }
    response = client.post("/api/tecnologias", headers=headers, json=payload)
    assert response.status_code == 400
    assert "já cadastrada" in response.json()["detail"]

def test_atualizar_tecnologia_sucesso(client):
    headers = {"X-User-Id": "1"}
    payload = {
        "nome": "Python Atualizado",
        "custo_base": 110.00,
        "multiplicador": 1.10
    }
    # Atualiza a tecnologia de ID 1 (Python)
    response = client.put("/api/tecnologias/1", headers=headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Python Atualizado"
    assert float(data["custo_base"]) == 110.00
    assert float(data["multiplicador"]) == 1.10

def test_atualizar_tecnologia_usuario_incorreto(client):
    headers = {"X-User-Id": "999"} # Usuário 999 não é dono do ID 1
    payload = {
        "nome": "Hack",
        "custo_base": 100.00,
        "multiplicador": 1.00
    }
    response = client.put("/api/tecnologias/1", headers=headers, json=payload)
    assert response.status_code == 404
    assert response.json()["detail"] == "Tecnologia não encontrada."

def test_deletar_tecnologia_sucesso(client):
    headers = {"X-User-Id": "1"}
    response = client.delete("/api/tecnologias/1", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Verifica se foi realmente removida
    response_get = client.get("/api/tecnologias", headers=headers)
    assert len(response_get.json()) == 3
