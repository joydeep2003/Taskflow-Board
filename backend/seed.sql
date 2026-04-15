CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (id, name, email, password, created_at)
VALUES (
  gen_random_uuid(),
  'Test User',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (id, name, description, owner_id, created_at)
SELECT
  gen_random_uuid(),
  'Sample Project',
  'Demo project with seeded tasks',
  u.id,
  NOW()
FROM users u
WHERE u.email = 'test@example.com'
  AND NOT EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.owner_id = u.id AND p.name = 'Sample Project'
  );

INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  task_data.title,
  task_data.description,
  task_data.status,
  task_data.priority,
  p.id,
  u.id,
  NOW(),
  NOW()
FROM users u
JOIN projects p ON p.owner_id = u.id
JOIN (
  VALUES
    ('Task 1', 'Seeded task in todo state', 'todo', 'low'),
    ('Task 2', 'Seeded task in progress', 'in_progress', 'medium'),
    ('Task 3', 'Seeded completed task', 'done', 'high')
) AS task_data(title, description, status, priority) ON true
WHERE u.email = 'test@example.com'
  AND p.name = 'Sample Project'
  AND NOT EXISTS (
    SELECT 1
    FROM tasks t
    WHERE t.project_id = p.id AND t.title = task_data.title
  );