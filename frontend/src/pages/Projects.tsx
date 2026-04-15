import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/client";
import Navbar from "./Navbar";
 
type Project = {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
};
 
const ease = [0.22, 1, 0.36, 1] as const;
 
const PROJECT_COLORS = [
  "linear-gradient(135deg,#e85d38,#f5a623)",
  "linear-gradient(135deg,#4b5de4,#7c3aed)",
  "linear-gradient(135deg,#22c55e,#16a34a)",
  "linear-gradient(135deg,#f5a623,#ef4444)",
  "linear-gradient(135deg,#06b6d4,#4b5de4)",
  "linear-gradient(135deg,#ec4899,#e85d38)",
];
 
export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [userName, setUserName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
 
  const fetchProjects = async () => {
    const res = await api.get("/projects");
    setProjects(res.data);
  };
 
  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUserName(res.data.name || "");
    } catch { }
  };
 
  const createProject = async () => {
    if (!name.trim()) return;
    await api.post("/projects", { name, description });
    setName("");
    setDescription("");
    setShowCreateModal(false);
    fetchProjects();
  };
 
  const startEditProject = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditName(project.name || "");
    setEditDescription(project.description || "");
  };
 
  const cancelEditProject = () => {
    setEditingProjectId(null);
    setEditName("");
    setEditDescription("");
  };
 
  const saveProject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingProjectId || !editName.trim()) return;
    await api.patch(`/projects/${editingProjectId}`, {
      name: editName,
      description: editDescription,
    });
    cancelEditProject();
    fetchProjects();
  };
 
  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await api.delete(`/projects/${projectId}`);
    if (editingProjectId === projectId) cancelEditProject();
    fetchProjects();
  };
 
  useEffect(() => {
    fetchProjects();
    fetchUser();
  }, []);
 
  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
 
  return (
    <main className="projects-shell">
      <Navbar userName={userName} />
 
      <div className="projects-body">
        {/* Header */}
        <motion.div
          className="projects-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          <div>
            <h1 className="projects-title">Your Projects</h1>
            <p className="projects-subtitle">
              {projects.length} workspace{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="projects-header-actions">
            <div className="projects-search">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                className="projects-search-input"
                placeholder="Search projects…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <motion.button
              className="projects-create-btn"
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              New Project
            </motion.button>
          </div>
        </motion.div>
 
        {/* Board */}
        {filtered.length === 0 ? (
          <motion.div
            className="projects-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="projects-empty-icon">📋</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="projects-create-btn" onClick={() => setShowCreateModal(true)}>
              Create project
            </button>
          </motion.div>
        ) : (
          <motion.div className="projects-board" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
            {filtered.map((project, index) => {
              const colorIdx = index % PROJECT_COLORS.length;
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1 + index * 0.06, ease }}
                >
                  {editingProjectId === project.id ? (
                    <div className="project-card project-card--editing">
                      <input
                        className="pc-input"
                        value={editName}
                        placeholder="Project name"
                        autoFocus
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <textarea
                        className="pc-textarea"
                        value={editDescription}
                        placeholder="Description (optional)"
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                      <div className="pc-edit-actions">
                        <button className="pc-btn pc-btn--save" onClick={saveProject}>Save</button>
                        <button className="pc-btn pc-btn--cancel" onClick={cancelEditProject}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <Link to={`/projects/${project.id}`} className="project-card-link">
                      <motion.div
                        className="project-card"
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      >
                        {/* Color banner */}
                        <div className="pc-banner" style={{ background: PROJECT_COLORS[colorIdx] }}>
                          <div className="pc-banner-pattern" />
                          <div className="pc-banner-actions">
                            <button
                              className="pc-icon-btn"
                              onClick={(e) => startEditProject(project, e)}
                              title="Edit"
                            >
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M1.5 11.5l3-1 6-6-2-2-6 6-1 3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                                <path d="M8.5 2.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                              </svg>
                            </button>
                            <button
                              className="pc-icon-btn pc-icon-btn--danger"
                              onClick={(e) => deleteProject(project.id, e)}
                              title="Delete"
                            >
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M2.5 4h8M5 4V2.5h3V4M5.5 6v4M7.5 6v4M3.5 4l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </div>
 
                        {/* Card body */}
                        <div className="pc-body">
                          <h3 className="pc-title">{project.name}</h3>
                          <p className="pc-desc">
                            {project.description?.trim() || "No description added yet"}
                          </p>
                          <div className="pc-footer">
                            <span className="pc-open-label">Open board →</span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
 
      {/* Create modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowCreateModal(false)}
            />
 
            <div className="modal-center-wrap">
              <motion.div
                className="modal-card"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.22, ease }}
              >
                <div className="modal-head">
                  <h2>New Project</h2>
                  <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                <div className="modal-fields">
                  <div className="modal-field">
                    <label>Project name *</label>
                    <input
                      className="pc-input"
                      placeholder="e.g. Website Redesign"
                      value={name}
                      autoFocus
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createProject()}
                    />
                  </div>
                  <div className="modal-field">
                    <label>Description</label>
                    <textarea
                      className="pc-textarea"
                      placeholder="What's this project about?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="pc-btn pc-btn--cancel" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <motion.button
                    className="pc-btn pc-btn--primary"
                    onClick={createProject}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Create Project
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
 