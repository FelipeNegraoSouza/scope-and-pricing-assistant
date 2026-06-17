from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal
from .routes import projetos, usuarios, tecnologias
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
                email="teste@gmail.com",
                senha="admin"
            )
            db.add(default_user)
            db.commit()
            print("Usuário padrão semeado com sucesso no banco de dados.")
        else:
            if usuario.email == "felipe.ngsouza@gmail.com":
                usuario.email = "teste@gmail.com"
                db.commit()
                print("E-mail do usuário padrão updated para teste@gmail.com no banco de dados.")
        
        # Semeia tecnologias padrão se não houver nenhuma
        if db.query(models.Tecnologia).count() == 0:
            tecnologias_padrao = [
                models.Tecnologia(nome="Python", custo_base=100.00, multiplicador=1.00, usuario_id=1),
                models.Tecnologia(nome="React", custo_base=110.00, multiplicador=1.10, usuario_id=1),
                models.Tecnologia(nome="Legado", custo_base=150.00, multiplicador=1.50, usuario_id=1),
                models.Tecnologia(nome="Docker", custo_base=120.00, multiplicador=1.20, usuario_id=1)
            ]
            db.add_all(tecnologias_padrao)
            db.commit()
            print("Tecnologias padrão semeadas com sucesso no banco de dados.")
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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra as rotas da API
app.include_router(projetos.router, prefix="/api", tags=["Projetos & Escopos"])
app.include_router(usuarios.router, prefix="/api", tags=["Usuários & Autenticação"])
app.include_router(tecnologias.router, prefix="/api", tags=["Tecnologias & Precificação"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "API do Assistente de Escopo rodando. Acesse /docs para visualizar a documentação."
    }
