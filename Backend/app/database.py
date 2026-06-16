import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Lê a URL de conexão do banco das variáveis de ambiente
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://apaw_user:apaw_pass@db:3306/assistente_escopo"
)

# Cria o engine com tratamento de concorrência e reaproveitamento de conexão
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Define a fábrica de sessões locais
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base declarativa para modelos
Base = declarative_base()

# Dependência do FastAPI para injetar sessões do banco nas requisições
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
