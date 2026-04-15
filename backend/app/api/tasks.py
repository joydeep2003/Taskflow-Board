from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.task import Task
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/projects/{project_id}/tasks")
def create_task(project_id: str, data: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    task = Task(**data, project_id=project_id, assignee_id=user["user_id"])
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/{id}")
def update_task(id: str, data: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).get(id)

    if not task:
        raise HTTPException(404, detail={"error": "not found"})

    for k, v in data.items():
        setattr(task, k, v)

    db.commit()
    db.refresh(task)
    return task