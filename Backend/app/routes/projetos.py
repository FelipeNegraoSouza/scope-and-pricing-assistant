import os
import re
import json
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import google.generativeai as genai

def get_current_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-Id")) -> int:
    if x_user_id:
        try:
            return int(x_user_id)
        except ValueError:
            pass
    return 1 # Fallback para o usuário padrão Felipe N. (ID 1)

from ..database import get_db
from .. import models, schemas

router = APIRouter()

# Configuração da API do Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("AVISO: GEMINI_API_KEY não configurada. A geração com IA usará dados mockados de fallback.")

# 1. GET /api/dashboard
@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), usuario_id: int = Depends(get_current_user_id)):
    
    # Escopos ativos (status em Rascunho, Gerado pela IA, Em Andamento)
    escopos_ativos = db.query(models.Projeto).filter(
        models.Projeto.usuario_id == usuario_id,
        models.Projeto.status.in_(["Rascunho", "Gerado pela IA", "Em Andamento"])
    ).count()

    # Propostas enviadas (total de projetos criados)
    propostas_enviadas = db.query(models.Projeto).filter(
        models.Projeto.usuario_id == usuario_id
    ).count()

    # Faturamento potencial (soma do valor total dos escopos ativos)
    faturamento_potencial_res = db.query(func.sum(models.Projeto.valor_total)).filter(
        models.Projeto.usuario_id == usuario_id,
        models.Projeto.status.in_(["Rascunho", "Gerado pela IA", "Em Andamento"])
    ).scalar()
    
    faturamento_potencial = faturamento_potencial_res if faturamento_potencial_res is not None else 0.0

    # Últimos escopos cadastrados (com o nome do cliente associado)
    projetos = db.query(models.Projeto).filter(
        models.Projeto.usuario_id == usuario_id
    ).order_by(models.Projeto.criado_em.desc()).limit(5).all()

    ultimos_escopos = []
    for p in projetos:
        cliente = db.query(models.Cliente).filter(models.Cliente.id == p.cliente_id).first()
        cliente_nome = cliente.nome_empresa if cliente else "Cliente Desconhecido"
        ultimos_escopos.append(
            schemas.UltimoEscopo(
                id=p.id,
                cliente=cliente_nome,
                projeto=p.titulo,
                status=p.status or "Rascunho",
                valor_total=p.valor_total
            )
        )

    return schemas.DashboardStats(
        escopos_ativos=escopos_ativos,
        propostas_enviadas=propostas_enviadas,
        faturamento_potencial=faturamento_potencial,
        ultimos_escopos=ultimos_escopos
    )

# 2. POST /api/briefing
@router.post("/briefing", response_model=schemas.ProjetoSchema)
def create_briefing_and_generate_scope(payload: schemas.BriefingRequest, db: Session = Depends(get_db), usuario_id: int = Depends(get_current_user_id)):
    
    # 1. Buscar ou criar cliente
    cliente = db.query(models.Cliente).filter(
        models.Cliente.nome_empresa == payload.cliente,
        models.Cliente.usuario_id == usuario_id
    ).first()

    if not cliente:
        cliente = models.Cliente(
            nome_empresa=payload.cliente,
            usuario_id=usuario_id,
            responsavel="Contato Principal",
            email=f"contato@{payload.cliente.lower().replace(' ', '')}.com"
        )
        db.add(cliente)
        db.commit()
        db.refresh(cliente)

    # 2. Criar novo Projeto base
    projeto = models.Projeto(
        titulo=payload.projeto,
        descricao_geral=payload.descricao,
        status="Rascunho",
        valor_total=0.0,
        cliente_id=cliente.id,
        usuario_id=usuario_id
    )
    db.add(projeto)
    db.commit()
    db.refresh(projeto)

    # 3. Invocar IA do Gemini para gerar os módulos
    modulos = []
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Você é um especialista em engenharia de requisitos e precificação de software.
            Com base nas seguintes informações de briefing fornecidas pelo cliente:
            - Nome do Projeto: {payload.projeto}
            - Stack Tecnológica Sugerida: {", ".join(payload.stack)}
            - Descrição da Solicitação: {payload.descricao}

            Gere um escopo de projeto detalhado composto por módulos de entrega de software (geralmente de 2 a 5 módulos).
            Para cada módulo, forneça:
            1. Nome/Título do módulo (ex: "Módulo de Autenticação e Segurança")
            2. Descrição técnica detalhada descrevendo o que será construído
            3. Estimativa de horas (um número inteiro realista, ex: 40, 60, 80)
            4. Nível de complexidade (Baixa, Média, Alta)

            Você DEVE responder APENAS com um array JSON válido contendo objetos no formato abaixo:
            [
              {{
                "titulo_tarefa": "Nome do Módulo",
                "descricao_detalhada": "Descrição técnica das funcionalidades e requisitos do módulo.",
                "horas_estimadas": 40,
                "complexidade": "Média"
              }}
            ]
            Não inclua explicações, introduções ou blocos de código Markdown. Retorne estritamente o JSON.
            """
            response = model.generate_content(prompt)
            texto = response.text.strip()
            
            # Limpa blocos de código markdown se o modelo tiver retornado
            match = re.search(r'\[.*\]', texto, re.DOTALL)
            if match:
                json_str = match.group(0)
            else:
                json_str = texto
                
            modulos_parsed = json.loads(json_str)
            if not isinstance(modulos_parsed, list):
                raise ValueError("Resposta do Gemini não é uma lista")
            for item in modulos_parsed:
                if not isinstance(item, dict):
                    raise ValueError("Item do escopo não é um dicionário")
            modulos = modulos_parsed
        except Exception as e:
            print(f"Erro ao chamar a API do Gemini ou processar a resposta: {e}. Usando fallback.")
            modulos = []

    # Fallback se a IA falhar ou a chave não estiver configurada
    if not modulos:
        modulos = [
            {
                "titulo_tarefa": "Estrutura Principal (Backend & Banco)",
                "descricao_detalhada": f"Desenvolvimento da estrutura central do {payload.projeto} utilizando a stack recomendada: {', '.join(payload.stack)}.",
                "horas_estimadas": 50,
                "complexidade": "Média"
            },
            {
                "titulo_tarefa": "Painel de Controle e Dashboards",
                "descricao_detalhada": "Criação de interface de usuário (frontend) responsiva para controle dos módulos e estatísticas de uso.",
                "horas_estimadas": 40,
                "complexidade": "Média"
            },
            {
                "titulo_tarefa": "Módulo de Relatórios e Exportação",
                "descricao_detalhada": "Lógica para geração de relatórios, exportação de planilhas CSV/PDF e análises de desempenho.",
                "horas_estimadas": 20,
                "complexidade": "Baixa"
            }
        ]

    # 4. Salvar os módulos gerados como itens do escopo
    total_acumulado = 0.0
    for mod in modulos:
        horas = int(mod.get("horas_estimadas", 10))
        valor_hora = 100.00 # Valor padrão da hora do desenvolvedor
        custo = horas * valor_hora
        total_acumulado += custo

        item_db = models.ItemEscopo(
            projeto_id=projeto.id,
            titulo_tarefa=mod.get("titulo_tarefa", "Novo Módulo"),
            descricao_detalhada=mod.get("descricao_detalhada", ""),
            horas_estimadas=horas,
            complexidade=mod.get("complexidade", "Média"),
            valor_hora=valor_hora,
            custo_estimado=custo
        )
        db.add(item_db)

    # 5. Atualizar o valor total do projeto no banco
    projeto.valor_total = total_acumulado
    db.commit()
    db.refresh(projeto)

    # Converte para retornar com o nome do cliente
    response_schema = schemas.ProjetoSchema.model_validate(projeto)
    response_schema.cliente_nome_empresa = cliente.nome_empresa
    return response_schema

# 3. GET /api/projetos/{id}
@router.get("/projetos/{id}", response_model=schemas.ProjetoSchema)
def get_projeto_by_id(id: int, db: Session = Depends(get_db)):
    projeto = db.query(models.Projeto).filter(models.Projeto.id == id).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")
    
    cliente = db.query(models.Cliente).filter(models.Cliente.id == projeto.cliente_id).first()
    cliente_nome = cliente.nome_empresa if cliente else "Cliente Desconhecido"

    # Carrega os itens ordenados
    itens = db.query(models.ItemEscopo).filter(models.ItemEscopo.projeto_id == id).all()

    response_schema = schemas.ProjetoSchema.model_validate(projeto)
    response_schema.cliente_nome_empresa = cliente_nome
    response_schema.itens = [schemas.ItemEscopoSchema.model_validate(i) for i in itens]
    return response_schema

# 4. PUT /api/projetos/{id}
@router.put("/projetos/{id}", response_model=schemas.ProjetoSchema)
def update_projeto_scope(id: int, payload: schemas.ProjetoUpdate, db: Session = Depends(get_db), usuario_id: int = Depends(get_current_user_id)):
    projeto = db.query(models.Projeto).filter(models.Projeto.id == id, models.Projeto.usuario_id == usuario_id).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")

    # Atualiza dados do projeto principal
    projeto.titulo = payload.titulo
    projeto.status = payload.status
    projeto.valor_total = payload.valor_total

    # Remove todos os itens de escopo antigos esvaziando a relação (cascade="all, delete-orphan")
    projeto.itens.clear()

    # Adiciona os novos itens de escopo salvos pelo desenvolvedor diretamente na relação
    for item in payload.itens:
        novo_item = models.ItemEscopo(
            titulo_tarefa=item.titulo_tarefa,
            descricao_detalhada=item.descricao_detalhada,
            horas_estimadas=item.horas_estimadas,
            complexidade=item.complexidade,
            valor_hora=item.valor_hora,
            custo_estimado=item.horas_estimadas * item.valor_hora
        )
        projeto.itens.append(novo_item)

    db.commit()
    db.refresh(projeto)

    cliente = db.query(models.Cliente).filter(models.Cliente.id == projeto.cliente_id).first()
    cliente_nome = cliente.nome_empresa if cliente else "Cliente Desconhecido"

    itens = db.query(models.ItemEscopo).filter(models.ItemEscopo.projeto_id == id).all()

    response_schema = schemas.ProjetoSchema.model_validate(projeto)
    response_schema.cliente_nome_empresa = cliente_nome
    response_schema.itens = [schemas.ItemEscopoSchema.model_validate(i) for i in itens]
    return response_schema

# 5. POST /api/projetos/{id}/aprovar
@router.post("/projetos/{id}/aprovar")
def approve_proposal(id: int, db: Session = Depends(get_db)):
    projeto = db.query(models.Projeto).filter(models.Projeto.id == id).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")

    projeto.status = "Aprovado"
    db.commit()
    return {"status": "success", "message": "Proposta aprovada com sucesso."}
