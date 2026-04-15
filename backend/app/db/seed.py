from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.project import Project
from app.models.task import Task
from app.models.user import User


DEMO_EMAIL = "test@example.com"
DEMO_PASSWORD = "password123"
DEMO_NAME = "Test User"
DEMO_PROJECT = "Sample Project"
DEMO_PROJECT_DESCRIPTION = "Demo project with seeded tasks"


def seed() -> None:
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == DEMO_EMAIL).first()

        if not user:
            user = User(
                name=DEMO_NAME,
                email=DEMO_EMAIL,
                password=hash_password(DEMO_PASSWORD),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        project = (
            db.query(Project)
            .filter(Project.owner_id == user.id, Project.name == DEMO_PROJECT)
            .first()
        )

        if not project:
            project = Project(
                name=DEMO_PROJECT,
                description=DEMO_PROJECT_DESCRIPTION,
                owner_id=user.id,
            )
            db.add(project)
            db.commit()
            db.refresh(project)

        existing_titles = {
            title
            for (title,) in db.query(Task.title).filter(Task.project_id == project.id).all()
        }

        for title, task_description, status, priority in [
            ("Task 1", "Seeded task in todo state", "todo", "low"),
            ("Task 2", "Seeded task in progress", "in_progress", "medium"),
            ("Task 3", "Seeded completed task", "done", "high"),
        ]:
            if title in existing_titles:
                continue

            db.add(
                Task(
                    title=title,
                    description=task_description,
                    status=status,
                    priority=priority,
                    project_id=project.id,
                    assignee_id=user.id,
                )
            )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
