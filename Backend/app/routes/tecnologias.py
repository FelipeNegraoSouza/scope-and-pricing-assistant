from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from .projetos import get_current_user_id

router = APIRouter()

# 1. GET /api/tecnologias
@router.get("/tecnologias", response_model=List[schemas.TecnologiaSchema])
def get_tecnologias(db: Session = Depends(get_db), usuario_id: int = Depends(get_current_user_id)):
    return db.query(models.Tecnologia).filter(models.Tecnologia.usuario_id == usuario_id).all()

# 2. POST /api/tecnologias
@router.post("/tecnologias", response_model=schemas.TecnologiaSchema, status_code=status.HTTP_201_CREATED)
def create_tecnologia(payload: schemas.TecnologiaCreate, db: Session = Depends(get_db), usuario_id: int = Depends(get_current_user_id)):
    # Verifica se já existe uma tecnologia com o mesmo nome para este usuário
    nome_normalizado = payload.nome.strip()
    existe = db.query(models.Tecnologia).filter(
        models.Tecnologia.nome == nome_normalizado,
        models.Tecnologia.usuario_id == usuario_id
    ).first()
    
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tecnologia '{payload.nome}' já cadastrada."
        )
        
    nova_tech = models.Tecnologia(
        nome=nome_normalizado,
        custo_base=payload.custo_base,
        multiplicador=payload.multiplicador,
        usuario_id=usuario_id
    )
    db.add(nova_tech)
    db.commit()
    db.refresh(nova_tech)
    return nova_tech

# 3. PUT /api/tecnologias/{id}
@router.put("/tecnologias/{id}", response_model=schemas.TecnologiaSchema)
def update_tecnologia(id: int, payload: schemas.TecnologiaCreate, db: Session = Depends(get_db), usuario_id: int = Depends(get_current_user_id)):
    tech = db.query(models.Tecnologia).filter(
        models.Tecnologia.id == id,
        models.Tecnologia.usuario_id == usuario_id
    ).first()
    
    if not tech:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tecnologia não encontrada."
        )
        
    # Verifica se o novo nome conflita com outra tecnologia do mesmo usuário
    nome_normalizado = payload.nome.strip()
    conflito = db.query(models.Tecnologia).filter(
        models.Tecnologia.nome == nome_normalizado,
        models.Tecnologia.usuario_id == usuario_id,
        models.Tecnologia.id != id
    ).first()
    
    if conflito:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Outra tecnologia com o nome '{payload.nome}' já existe."
        )
        
    tech.nome = nome_normalizado
    tech.custo_base = payload.custo_base
    tech.multiplicador = payload.multiplicador
    
    db.commit()
    db.refresh(tech)
    return tech

# 4. DELETE /api/tecnologias/{id}
@router.delete("/tecnologias/{id}")
def delete_tecnologia(id: int, db: Session = Depends(get_db), usuario_id: int = Depends(get_current_user_id)):
    tech = db.query(models.Tecnologia).filter(
        models.Tecnologia.id == id,
        models.Tecnologia.usuario_id == usuario_id
    ).first()
    
    if not tech:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tecnologia não encontrada."
        )
        
    db.delete(tech)
    db.commit()
    return {"status": "success", "message": "Tecnologia excluída com sucesso."}
