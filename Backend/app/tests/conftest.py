import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from ..database import Base, get_db
from ..main import app
from .. import models

# Banco de dados SQLite em memória para isolar os testes
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="db", scope="function")
def db_fixture():
    # Cria as tabelas no banco em memória antes de cada teste
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        # Semeia dados padrão de teste para garantir compatibilidade
        default_user = models.Usuario(
            id=1,
            nome="Felipe N.",
            email="teste@gmail.com",
            senha="admin"
        )
        db.add(default_user)
        db.commit()
        
        tecnologias_padrao = [
            models.Tecnologia(nome="Python", custo_base=100.00, multiplicador=1.00, usuario_id=1),
            models.Tecnologia(nome="React", custo_base=110.00, multiplicador=1.10, usuario_id=1),
            models.Tecnologia(nome="Legado", custo_base=150.00, multiplicador=1.50, usuario_id=1),
            models.Tecnologia(nome="Docker", custo_base=120.00, multiplicador=1.20, usuario_id=1)
        ]
        db.add_all(tecnologias_padrao)
        db.commit()
        
        yield db
    finally:
        db.close()
        # Drop das tabelas após o teste concluir
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(name="client", scope="function")
def client_fixture(db):
    # Sobrescreve a dependência get_db com a sessão do banco de testes
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
