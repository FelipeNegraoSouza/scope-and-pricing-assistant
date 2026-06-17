from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter()

@router.post("/usuarios/registrar", response_model=schemas.UsuarioSchema, status_code=status.HTTP_201_CREATED)
def registrar_usuario(payload: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # Verifica se já existe um usuário com o mesmo e-mail
    usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == payload.email).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um usuário cadastrado com este e-mail."
        )

    # Cria o novo usuário
    novo_usuario = models.Usuario(
        nome=payload.nome,
        email=payload.email,
        senha=payload.senha  # Armazenado em texto plano para simplificar a semente de banco original
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

@router.post("/usuarios/login", response_model=schemas.UsuarioSchema)
def login_usuario(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == payload.email).first()
    if not usuario or usuario.senha != payload.senha:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )
    return usuario
