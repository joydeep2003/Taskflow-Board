from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.project import Project
from app.models.task import Task
from app.api.deps import get_current_user

router = APIRouter()

@router.get("")
def get_projects(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.owner_id == user["user_id"]).all()


@router.get("/{project_id}")
def get_project(project_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == user["user_id"])
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail={"error": "not found"})

    tasks = db.query(Task).filter(Task.project_id == project.id).all()

    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "owner_id": str(project.owner_id),
        "created_at": project.created_at,
        "tasks": tasks,
    }


@router.post("")
def create_project(data: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    project = Project(
        name=data["name"],
        description=data.get("description"),
        owner_id=user["user_id"]
    )
    db.add(project)
    db.commit()
    db.refresh(project)  # ✅ important
    return project


@router.patch("/{project_id}")
def update_project(project_id: str, data: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == user["user_id"])
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail={"error": "not found"})

    for field in ["name", "description"]:
        if field in data:
            setattr(project, field, data[field])

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(project_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == user["user_id"])
        .first()
    )

    if not project:
        raise HTTPException(status_code=404, detail={"error": "not found"})

    db.query(Task).filter(Task.project_id == project.id).delete()
    db.delete(project)
    db.commit()
    return {"success": True}
