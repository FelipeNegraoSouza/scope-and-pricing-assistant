from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# item de escopo schemas
class ItemEscopoBase(BaseModel):
    titulo_tarefa: str
    descricao_detalhada: Optional[str] = None
    horas_estimadas: int
    complexidade: str = "Média"
    valor_hora: Decimal = Decimal("50.00")
    custo_estimado: Decimal = Decimal("0.00")

class ItemEscopoCreate(ItemEscopoBase):
    pass

class ItemEscopoSchema(ItemEscopoBase):
    id: int
    projeto_id: int

    class Config:
        from_attributes = True

# projeto schemas
class ProjetoBase(BaseModel):
    titulo: str
    descricao_geral: str
    status: str = "Rascunho"
    valor_total: Decimal = Decimal("0.00")

class ProjetoCreate(ProjetoBase):
    cliente_id: int
    usuario_id: int

class ProjetoUpdate(BaseModel):
    titulo: str
    status: str
    valor_total: Decimal
    itens: List[ItemEscopoCreate]

class ProjetoSchema(ProjetoBase):
    id: int
    cliente_id: int
    usuario_id: int
    criado_em: datetime
    cliente_nome_empresa: Optional[str] = None
    itens: List[ItemEscopoSchema] = []

    class Config:
        from_attributes = True

# cliente schemas
class ClienteBase(BaseModel):
    nome_empresa: str
    responsavel: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None

class ClienteCreate(ClienteBase):
    usuario_id: int

class ClienteSchema(ClienteBase):
    id: int
    usuario_id: int
    criado_em: datetime

    class Config:
        from_attributes = True

# briefing schemas
class BriefingRequest(BaseModel):
    cliente: str
    projeto: str
    descricao: str
    stack: List[str]

# dashboard schemas
class UltimoEscopo(BaseModel):
    id: int
    cliente: str
    projeto: str
    status: str
    valor_total: Decimal

class DashboardStats(BaseModel):
    escopos_ativos: int
    propostas_enviadas: int
    faturamento_potencial: Decimal
    ultimos_escopos: List[UltimoEscopo]
