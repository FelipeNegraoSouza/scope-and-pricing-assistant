from sqlalchemy import Column, Integer, String, Text, Decimal, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from .database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    senha = Column(String(255), nullable=False)
    criado_em = Column(DateTime, default=func.now())

    clientes = relationship("Cliente", back_populates="usuario", cascade="all, delete-orphan")
    projetos = relationship("Projeto", back_populates="usuario", cascade="all, delete-orphan")

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome_empresa = Column(String(150), nullable=False)
    responsavel = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    telefone = Column(String(20), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    criado_em = Column(DateTime, default=func.now())

    usuario = relationship("Usuario", back_populates="clientes")
    projetos = relationship("Projeto", back_populates="cliente", cascade="all, delete-orphan")

class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(150), nullable=False)
    descricao_geral = Column(Text, nullable=False)
    status = Column(String(50), default="Rascunho")
    valor_total = Column(Decimal(10, 2), default=0.00)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    criado_em = Column(DateTime, default=func.now())

    usuario = relationship("Usuario", back_populates="projetos")
    cliente = relationship("Cliente", back_populates="projetos")
    itens = relationship("ItemEscopo", back_populates="projeto", cascade="all, delete-orphan")

class ItemEscopo(Base):
    __tablename__ = "itens_escopo"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id", ondelete="CASCADE"), nullable=False)
    titulo_tarefa = Column(String(150), nullable=False)
    descricao_detalhada = Column(Text, nullable=True)
    horas_estimadas = Column(Integer, default=0)
    complexidade = Column(String(20), default="Média")
    valor_hora = Column(Decimal(10, 2), default=50.00)
    custo_estimado = Column(Decimal(10, 2), default=0.00)
    criado_em = Column(DateTime, default=func.now())

    projeto = relationship("Projeto", back_populates="itens")
