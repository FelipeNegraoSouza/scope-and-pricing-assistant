def test_criar_briefing_com_precificacao_dinamica(client):
    headers = {"X-User-Id": "1"}
    payload = {
        "cliente": "Empresa Teste",
        "projeto": "Sistema de ERP",
        "descricao": "Desenvolvimento de um sistema completo ERP de gestão.",
        "stack": ["Python", "Legado"] # Python (100h) e Legado (225h) cadastrados no conftest
    }
    
    # Chama o endpoint de briefing (como a chave do Gemini está vazia nos testes, ele entra no fallback)
    response = client.post("/api/briefing", headers=headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["titulo"] == "Sistema de ERP"
    assert len(data["itens"]) == 3
    
    # Itens do Fallback esperados:
    # 1. Estrutura Principal: Python -> Valor Hora: 100.00 (custo_base=100, mult=1.0)
    # 2. Painel de Controle: Legado -> Valor Hora: 225.00 (custo_base=150, mult=1.5)
    # 3. Módulo de Relatórios: Python -> Valor Hora: 100.00 (custo_base=100, mult=1.0)
    
    itens = data["itens"]
    
    # Valida Tarefa 1 (Python)
    assert itens[0]["titulo_tarefa"] == "Estrutura Principal (Backend & Banco)"
    assert float(itens[0]["valor_hora"]) == 100.00
    assert float(itens[0]["custo_estimado"]) == 50 * 100.00
    
    # Valida Tarefa 2 (Legado)
    assert itens[1]["titulo_tarefa"] == "Painel de Controle e Dashboards"
    assert float(itens[1]["valor_hora"]) == 225.00
    assert float(itens[1]["custo_estimado"]) == 40 * 225.00
    
    # Valida Tarefa 3 (Python)
    assert itens[2]["titulo_tarefa"] == "Módulo de Relatórios e Exportação"
    assert float(itens[2]["valor_hora"]) == 100.00
    assert float(itens[2]["custo_estimado"]) == 20 * 100.00
    
    # Valor Total Calculado: (50*100) + (40*225) + (20*100) = 5000 + 9000 + 2000 = 16000.00
    assert float(data["valor_total"]) == 16000.00

def test_criar_briefing_stack_nao_cadastrada(client):
    headers = {"X-User-Id": "1"}
    payload = {
        "cliente": "Empresa Teste 2",
        "projeto": "App Flutter",
        "descricao": "Aplicativo mobile multiplataforma.",
        "stack": ["Flutter", "Firebase"] # Nenhuma cadastrada no conftest
    }
    
    response = client.post("/api/briefing", headers=headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Sem tecnologias cadastradas para "Flutter" ou "Firebase", deve assumir o padrão 100.00/h
    itens = data["itens"]
    assert float(itens[0]["valor_hora"]) == 100.00
    assert float(itens[1]["valor_hora"]) == 100.00
    assert float(itens[2]["valor_hora"]) == 100.00
    
    # Valor Total: (50*100) + (40*100) + (20*100) = 5000 + 4000 + 2000 = 11000.00
    assert float(data["valor_total"]) == 11000.00
