import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../api/client";
import Navbar from "./Navbar";
 
type Task = {
  id: string;
  title: string;
  description?: string;
  status?: string;
};
 
type ProjectDetailsResponse = {
  id: string;
  name: string;
  description?: string;
  tasks?: Task[];
};
 
const COLUMNS = [
  { id: "todo",        label: "To Do",       color: "#6b7280", accent: "rgba(107,114,128,0.12)" },
  { id: "in_progress", label: "In Progress",  color: "#4b5de4", accent: "rgba(75,93,228,0.12)"   },
  { id: "done",        label: "Done",         color: "#22c55e", accent: "rgba(34,197,94,0.12)"    },
];
 
const ease = [0.22, 1, 0.36, 1] as const;
 
/* ── Droppable column wrapper ── */
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`kanban-drop-zone ${isOver ? "is-over" : ""}`}>
      {children}
    </div>
  );
}
 
/* ── Sortable task card ── */
function SortableTaskCard({
  task,
  colColor,
  onEdit,
  onMove,
  colId,
}: {
  task: Task;
  colColor: string;
  onEdit: (task: Task) => void;
  onMove: (taskId: string, status: string) => void;
  colId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task, colId },
  });
 
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };
 
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCardContent
        task={task}
        colColor={colColor}
        colId={colId}
        onEdit={onEdit}
        onMove={onMove}
        dragListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}
 
/* ── Task card ── */
function TaskCardContent({
  task,
  colColor,
  colId,
  onEdit,
  onMove,
  dragListeners,
  isDragging = false,
}: {
  task: Task;
  colColor: string;
  colId: string;
  onEdit: (task: Task) => void;
  onMove: (taskId: string, status: string) => void;
  dragListeners?: Record<string, unknown>;
  isDragging?: boolean;
}) {
  return (
    <motion.div
      className={`task-card ${isDragging ? "task-card--dragging" : ""}`}
      whileHover={isDragging ? {} : { y: -3, boxShadow: "0 12px 28px rgba(28,20,16,0.13)" }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      layout
    >
      <div className="task-card-top">
        <span className="task-status-dot" style={{ background: colColor }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Edit */}
          <button className="tc-icon-btn" onClick={() => onEdit(task)} title="Edit task">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 10.5l2.5-.8 5.5-5.5-1.7-1.7L2 8l-.5 2.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M7.8 2.2l1.7 1.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </button>
          {/* Drag handle */}
          <span className="tc-drag-handle" {...dragListeners} title="Drag to reorder">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="4" cy="3" r="1" fill="currentColor"/>
              <circle cx="8" cy="3" r="1" fill="currentColor"/>
              <circle cx="4" cy="6" r="1" fill="currentColor"/>
              <circle cx="8" cy="6" r="1" fill="currentColor"/>
              <circle cx="4" cy="9" r="1" fill="currentColor"/>
              <circle cx="8" cy="9" r="1" fill="currentColor"/>
            </svg>
          </span>
        </div>
      </div>
 
      <p className="task-card-title">{task.title}</p>
      {task.description?.trim() && (
        <p className="task-card-desc">{task.description}</p>
      )}
 
      <div className="task-card-move">
        {COLUMNS.filter((c) => c.id !== colId).map((targetCol) => (
          <button
            key={targetCol.id}
            className="task-move-btn"
            style={{ color: targetCol.color, borderColor: targetCol.color + "44" }}
            onClick={() => onMove(task.id, targetCol.id)}
          >
            → {targetCol.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
 
export default function ProjectDetail() {
  const { id } = useParams();
  const [projectName, setProjectName] = useState("Project");
  const [projectDescription, setProjectDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [showEditProject, setShowEditProject] = useState(false);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColId, setActiveColId] = useState<string | null>(null);
 
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
 
  const fetchTasks = async () => {
    const res = await api.get<ProjectDetailsResponse>(`/projects/${id}`);
    setProjectName(res.data.name || "Project");
    setProjectDescription(res.data.description || "");
    setEditProjectName(res.data.name || "Project");
    setEditProjectDescription(res.data.description || "");
    setTasks(res.data.tasks || []);
  };
 
  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUserName(res.data.name || "");
    } catch { }
  };
 
  const createTask = async (status: string) => {
    if (!title.trim()) return;
    await api.post(`/projects/${id}/tasks`, { title, description, status });
    setTitle("");
    setDescription("");
    setAddingToColumn(null);
    fetchTasks();
  };
 
  const updateStatus = async (taskId: string, status: string) => {
    await api.patch(`/tasks/${taskId}`, { status });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };
 
  const saveProject = async () => {
    if (!editProjectName.trim()) return;
    await api.patch(`/projects/${id}`, {
      name: editProjectName,
      description: editProjectDescription,
    });
    setShowEditProject(false);
    fetchTasks();
  };
 
  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title || "");
    setEditTaskDescription(task.description || "");
  };
 
  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskTitle("");
    setEditTaskDescription("");
  };
 
  const saveTask = async () => {
    if (!editingTaskId || !editTaskTitle.trim()) return;
    await api.patch(`/tasks/${editingTaskId}`, {
      title: editTaskTitle,
      description: editTaskDescription,
    });
    cancelEditTask();
    fetchTasks();
  };
 
  /* ── DnD handlers ── */
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      setActiveColId(task.status || "todo");
    }
  };
 
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
 
    const activeId = active.id as string;
    const overId = over.id as string;
 
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;
 
    // Check if dragging over a column directly
    const overCol = COLUMNS.find((c) => c.id === overId);
    if (overCol && activeTask.status !== overId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: overId } : t))
      );
      return;
    }
 
    // Check if dragging over a task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && overTask.status !== activeTask.status) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: overTask.status || "todo" } : t))
      );
    }
  };
 
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColId(null);
 
    if (!over) return;
 
    const activeId = active.id as string;
    const overId = over.id as string;
 
    const currentTask = tasks.find((t) => t.id === activeId);
    if (!currentTask) return;
 
    // Reorder within same column
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && overTask.status === currentTask.status && activeId !== overId) {
      setTasks((prev) => {
        const colTasks = prev.filter((t) => t.status === currentTask.status);
        const others = prev.filter((t) => t.status !== currentTask.status);
        const oldIdx = colTasks.findIndex((t) => t.id === activeId);
        const newIdx = colTasks.findIndex((t) => t.id === overId);
        const reordered = arrayMove(colTasks, oldIdx, newIdx);
        return [...others, ...reordered];
      });
    }
 
    // Persist status change
    try {
      await api.patch(`/tasks/${activeId}`, { status: currentTask.status });
    } catch { }
  };
 
  useEffect(() => {
    fetchTasks();
    fetchUser();
  }, []);
 
  const getColumnTasks = (colId: string) =>
    tasks.filter((t) => (t.status || "todo") === colId);
 
  return (
    <main className="board-shell">
      <Navbar userName={userName} />
 
      {/* Board header */}
      <motion.div
        className="board-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <div className="board-header-left">
          <Link to="/projects" className="board-back-btn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            All projects
          </Link>
          <div className="board-title-row">
            <h1 className="board-title">{projectName}</h1>
            <button className="board-edit-btn" onClick={() => setShowEditProject((v) => !v)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1.5 12.5l3-1 7-7-2-2-7 7-1 3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M9.5 2.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {projectDescription && <p className="board-subtitle">{projectDescription}</p>}
        </div>
 
        <div className="board-stats">
          {COLUMNS.map((col) => (
            <div className="board-stat" key={col.id}>
              <span className="board-stat-count" style={{ color: col.color }}>
                {getColumnTasks(col.id).length}
              </span>
              <span className="board-stat-label">{col.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
 
      {/* Inline project edit panel */}
      <AnimatePresence>
        {showEditProject && (
          <motion.div
            className="board-edit-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <input className="pc-input" value={editProjectName} placeholder="Project name"
              onChange={(e) => setEditProjectName(e.target.value)} />
            <input className="pc-input" value={editProjectDescription} placeholder="Description"
              onChange={(e) => setEditProjectDescription(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="pc-btn pc-btn--save" onClick={saveProject}>Save changes</button>
              <button className="pc-btn pc-btn--cancel" onClick={() => setShowEditProject(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Kanban board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          className="kanban-board"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease }}
        >
          {COLUMNS.map((col) => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div className="kanban-column" key={col.id}>
                {/* Column header */}
                <div className="kanban-col-header">
                  <div className="kanban-col-label-row">
                    <span className="kanban-col-dot" style={{ background: col.color }} />
                    <h3 className="kanban-col-title">{col.label}</h3>
                    <span className="kanban-col-count" style={{ background: col.accent, color: col.color }}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button className="kanban-add-btn" onClick={() => {
                    setAddingToColumn(col.id);
                    setTitle("");
                    setDescription("");
                  }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
 
                {/* Add task form */}
                <AnimatePresence>
                  {addingToColumn === col.id && (
                    <motion.div
                      className="kanban-add-form"
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.97 }}
                      transition={{ duration: 0.25, ease }}
                    >
                      <input className="pc-input" placeholder="Task title…" value={title} autoFocus
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && createTask(col.id)} />
                      <textarea className="pc-textarea pc-textarea--sm" placeholder="Description (optional)"
                        value={description} onChange={(e) => setDescription(e.target.value)} />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="pc-btn pc-btn--save pc-btn--sm" onClick={() => createTask(col.id)}>Add task</button>
                        <button className="pc-btn pc-btn--cancel pc-btn--sm" onClick={() => setAddingToColumn(null)}>Cancel</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
 
                {/* Task list */}
                <DroppableColumn id={col.id}>
                  <SortableContext
                    items={colTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="kanban-tasks">
                      <AnimatePresence mode="popLayout">
                        {colTasks.map((task, idx) =>
                          editingTaskId === task.id ? (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="task-card task-card--editing"
                            >
                              <input className="pc-input" value={editTaskTitle} placeholder="Task title"
                                autoFocus onChange={(e) => setEditTaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveTask()} />
                              <textarea className="pc-textarea pc-textarea--sm" value={editTaskDescription}
                                placeholder="Description" onChange={(e) => setEditTaskDescription(e.target.value)} />
                              <div style={{ display: "flex", gap: 6 }}>
                                <button className="pc-btn pc-btn--save pc-btn--sm" onClick={saveTask}>Save</button>
                                <button className="pc-btn pc-btn--cancel pc-btn--sm" onClick={cancelEditTask}>Cancel</button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 14, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              transition={{ duration: 0.3, delay: idx * 0.04, ease }}
                            >
                              <SortableTaskCard
                                task={task}
                                colColor={col.color}
                                colId={col.id}
                                onEdit={startEditTask}
                                onMove={updateStatus}
                              />
                            </motion.div>
                          )
                        )}
                      </AnimatePresence>
 
                      {colTasks.length === 0 && addingToColumn !== col.id && (
                        <motion.div className="kanban-empty"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                          <div className="kanban-empty-icon" style={{ borderColor: col.color + "33" }}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <rect x="2.5" y="2.5" width="13" height="13" rx="2.5" stroke={col.color} strokeWidth="1.3" strokeDasharray="3 2"/>
                              <path d="M9 6v6M6 9h6" stroke={col.color} strokeWidth="1.3" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <p>Drop tasks here</p>
                        </motion.div>
                      )}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              </div>
            );
          })}
        </motion.div>
 
        {/* Drag overlay */}
        <DragOverlay>
          {activeTask && activeColId ? (
            <div style={{ transform: "rotate(2deg)", opacity: 0.95 }}>
              <TaskCardContent
                task={activeTask}
                colColor={COLUMNS.find((c) => c.id === activeColId)?.color ?? "#6b7280"}
                colId={activeColId}
                onEdit={() => {}}
                onMove={() => {}}
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}