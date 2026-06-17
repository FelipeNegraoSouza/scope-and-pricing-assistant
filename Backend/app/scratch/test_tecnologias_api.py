import requests

API_URL = "http://127.0.0.1:8000/api/tecnologias"
HEADERS = {
    "X-User-Id": "1",
    "Content-Type": "application/json"
}

def run_tests():
    print("Iniciando testes da API de Tecnologias...")
    
    # 1. Listar Tecnologias iniciais
    print("\n--- 1. Listando tecnologias iniciais ---")
    res = requests.get(API_URL, headers=HEADERS)
    print(f"Status: {res.status_code}")
    print(res.json())
    assert res.status_code == 200
    initial_count = len(res.json())
    
    # 2. Criar Nova Tecnologia
    print("\n--- 2. Criando nova tecnologia (VueJS) ---")
    payload = {
        "nome": "VueJS",
        "custo_base": 115.50,
        "multiplicador": 1.15
    }
    res = requests.post(API_URL, headers=HEADERS, json=payload)
    print(f"Status: {res.status_code}")
    new_tech = res.json()
    print(new_tech)
    assert res.status_code == 201
    assert new_tech["nome"] == "VueJS"
    assert float(new_tech["custo_base"]) == 115.50
    assert float(new_tech["multiplicador"]) == 1.15
    new_id = new_tech["id"]

    # 3. Listar novamente e validar incremento
    print("\n--- 3. Verificando se a tecnologia foi adicionada ao catálogo ---")
    res = requests.get(API_URL, headers=HEADERS)
    assert res.status_code == 200
    assert len(res.json()) == initial_count + 1

    # 4. Atualizar a tecnologia criada
    print(f"\n--- 4. Atualizando tecnologia ID {new_id} ---")
    payload_update = {
        "nome": "VueJS v3",
        "custo_base": 125.00,
        "multiplicador": 1.25
    }
    res = requests.put(f"{API_URL}/{new_id}", headers=HEADERS, json=payload_update)
    print(f"Status: {res.status_code}")
    updated_tech = res.json()
    print(updated_tech)
    assert res.status_code == 200
    assert updated_tech["nome"] == "VueJS v3"
    assert float(updated_tech["custo_base"]) == 125.00
    assert float(updated_tech["multiplicador"]) == 1.25

    # 5. Deletar a tecnologia criada
    print(f"\n--- 5. Removendo tecnologia ID {new_id} ---")
    res = requests.delete(f"{API_URL}/{new_id}", headers=HEADERS)
    print(f"Status: {res.status_code}")
    print(res.json())
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # 6. Listar novamente e validar decréscimo
    print("\n--- 6. Verificando se a tecnologia foi removida do catálogo ---")
    res = requests.get(API_URL, headers=HEADERS)
    assert res.status_code == 200
    assert len(res.json()) == initial_count

    print("\n[SUCESSO] Todos os testes de API foram executados com sucesso!")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[ERRO] Erro durante os testes: {str(e)}")
