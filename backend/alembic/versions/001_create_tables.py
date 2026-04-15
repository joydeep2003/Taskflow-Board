from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_create_tables'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():

    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('password', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('todo', 'in_progress', 'done', name='task_status')),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', name='task_priority')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id')),
        sa.Column('assignee_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('tasks')
    op.drop_table('projects')
    op.drop_table('users')

    op.execute('DROP TYPE IF EXISTS task_status')
    op.execute('DROP TYPE IF EXISTS task_priority')