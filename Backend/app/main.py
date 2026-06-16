from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal
from .routes import projetos
from . import models

# Inicializa as tabelas no banco de dados se não existirem
Base.metadata.create_all(bind=engine)

# Semeia o usuário desenvolvedor padrão (ID 1) caso ele não exista
def seed_default_user():
    db: Session = SessionLocal()
    try:
        usuario = db.query(models.Usuario).filter(models.Usuario.id == 1).first()
        if not usuario:
            default_user = models.Usuario(
                id=1,
                nome="Felipe N.",
                email="felipe.ngsouza@gmail.com",
                senha="admin"
            )
            db.add(default_user)
            db.commit()
            print("Usuário padrão semeado com sucesso no banco de dados.")
    except Exception as e:
        print(f"Erro ao semear usuário padrão: {e}")
    finally:
        db.close()

seed_default_user()

app = FastAPI(
    title="Assistente de Escopo e Precificação API",
    description="Backend para automação de escopos de software utilizando Inteligência Artificial.",
    version="1.0.0"
)

# Configura CORS para permitir acesso a partir de qualquer origem local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra as rotas da API
app.include_router(projetos.router, prefix="/api", tags=["Projetos & Escopos"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "API do Assistente de Escopo rodando. Acesse /docs para visualizar a documentação."
    }
