import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import useStore from '../store';
import {
  FileText,
  Trash2,
  Copy,
  Check,
  Edit3,
  Eye,
  PenTool,
} from 'lucide-react';

function Posts() {
  const { posts, agents, updatePost, setPosts, user } = useStore();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [copyId, setCopyId] = useState('');

  useEffect(() => {
    async function loadFromDb() {
      try {
        const token = await getToken();
        const res = await fetch('/api/posts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const dbPosts = await res.json();
        setPosts(dbPosts.map(p => ({
          id: p.id,
          title: p.title,
          content: p.content,
          draft: p.status === 'draft',
          agentId: p.agent_id,
          createdAt: new Date(p.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }),
          chatHistory: (() => { try { return JSON.parse(p.chat_history || '[]'); } catch { return []; } })(),
        })));
      } catch {}
    }
    loadFromDb();
  }, []);

  const handleDeletePost = async (id, e) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja deletar este post?")) {
      setPosts(posts.filter(p => p.id !== id));
      if (selectedPost?.id === id) setSelectedPost(null);
      try {
        const token = await getToken();
        await fetch(`/api/posts/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
  };

  // Toggle draft/publish status
  const handleTogglePublish = async (post, e) => {
    e.stopPropagation();
    const newDraft = !post.draft;
    updatePost(post.id, { draft: newDraft });
    if (selectedPost?.id === post.id) setSelectedPost({ ...selectedPost, draft: newDraft });
    try {
      const token = await getToken();
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: post.id, title: post.title, content: post.content, agentId: post.agentId, status: newDraft ? 'draft' : 'completed' }),
      });
    } catch {}
  };

  const handleCopyText = (post, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(post.content);
    setCopyId(post.id);
    setTimeout(() => setCopyId(''), 2000);
  };

  const startEditPost = (post, e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const saveEditedPost = async () => {
    updatePost(selectedPost.id, { title: editTitle, content: editContent });
    setSelectedPost({ ...selectedPost, title: editTitle, content: editContent });
    setIsEditing(false);
    try {
      const token = await getToken();
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: selectedPost.id, title: editTitle, content: editContent, agentId: selectedPost.agentId, status: selectedPost.draft ? 'draft' : 'completed' }),
      });
    } catch {}
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'drafts') return post.draft;
    if (activeTab === 'completed') return !post.draft;
    return true;
  });

  const getAgentColor = (agentId) => {
    const colors = {
      ashe:   '#3b82f6',
      jace:   '#ef4444',
      aiden:  '#10b981',
      venn:   '#8b5cf6',
      dexter: '#f59e0b',
    };
    return colors[agentId] || 'var(--accent)';
  };

  return (
    <div className="page-container posts-page animate-fade-in">
      <header className="page-header">
        <div className="header-icon-wrapper posts-glow">
          <FileText className="posts-star-icon" size={24} />
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Histórico Editorial</span>
          <h1 className="header-title">Meus Posts</h1>
          <p className="header-desc">Todos os seus posts em um lugar. Edite, copie ou marque como concluído.</p>
        </div>
      </header>

      {/* Tabs Filter Bar */}
      <div className="posts-tabs-bar">
        <div className="tabs-navigation">
          <button 
            className={`tab-filter-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Todos ({posts.length})
          </button>
          <button 
            className={`tab-filter-btn ${activeTab === 'drafts' ? 'active' : ''}`}
            onClick={() => setActiveTab('drafts')}
          >
            Rascunhos ({posts.filter(p => p.draft).length})
          </button>
          <button
            className={`tab-filter-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Concluídos ({posts.filter(p => !p.draft).length})
          </button>
        </div>
      </div>

      <div className="posts-grid-layout">
        {/* Posts List */}
        <div className="posts-list-column">
          {filteredPosts.length === 0 ? (
            <div className="glass-card empty-posts-inner">
              <PenTool size={32} style={{color: 'var(--text)', opacity: 0.5, marginBottom: 12}} />
              <h4>Nenhum registro encontrado</h4>
              <p>Comece conversando com um agente para produzir suas primeiras publicações.</p>
            </div>
          ) : (
            <div className="posts-cards-scroll">
              {filteredPosts.map(post => {
                const agent = agents.find(a => a.id === post.agentId);
                const isSelected = selectedPost?.id === post.id;
                
                return (
                  <div 
                    key={post.id} 
                    className={`post-row-selector ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedPost(post);
                      setIsEditing(false);
                    }}
                  >
                    <div className="post-selector-header">
                      <span 
                        className="post-agent-tag"
                        style={{ 
                          borderColor: getAgentColor(post.agentId), 
                          color: getAgentColor(post.agentId) 
                        }}
                      >
                        {agent?.name || 'Linage'}
                      </span>
                      <span className="post-time-meta">{post.createdAt}</span>
                    </div>
                    <h3 className="post-selector-title">{post.title}</h3>
                    <p className="post-selector-snippet">
                      {post.content.replace(/[*#]/g, '').substring(0, 120)}...
                    </p>
                    <div className="post-selector-actions">
                      <span className={`badge-indicator ${post.draft ? 'draft' : 'completed'}`}>
                        {post.draft ? 'Rascunho' : 'Concluído'}
                      </span>
                      <div className="selector-btn-group">
                        <button 
                          className="action-btn-small" 
                          onClick={(e) => handleCopyText(post, e)}
                          title="Copiar texto do post"
                        >
                          {copyId === post.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <button 
                          className="action-btn-small delete" 
                          onClick={(e) => handleDeletePost(post.id, e)}
                          title="Excluir post"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Post Preview Workspace Panel */}
        <div className="post-preview-panel">
          {selectedPost ? (
            <div className="glass-card preview-workspace-card">
              <header className="workspace-header-actions">
                <div className="workspace-badge-and-info">
                  <span className={`status-pill ${selectedPost.draft ? 'draft' : 'completed'}`}>
                    {selectedPost.draft ? 'Rascunho Pendente' : 'Concluído'}
                  </span>
                  <button className="status-toggle-link" onClick={(e) => handleTogglePublish(selectedPost, e)}>
                    {selectedPost.draft ? 'Marcar como Concluído' : 'Voltar para Rascunho'}
                  </button>
                </div>
                
                <div className="workspace-action-buttons">
                  {isEditing ? (
                    <>
                      <button className="btn-secondary-sm" onClick={() => setIsEditing(false)}>Cancelar</button>
                      <button className="btn-primary-sm" onClick={saveEditedPost}>Salvar</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-secondary-sm" onClick={(e) => startEditPost(selectedPost, e)}>
                        <Edit3 size={14} style={{marginRight: 4}} /> Editar
                      </button>
                      <button className="btn-primary-sm" onClick={(e) => handleCopyText(selectedPost, e)}>
                        {copyId === selectedPost.id ? <Check size={14} style={{marginRight: 4}} /> : <Copy size={14} style={{marginRight: 4}} />}
                        {copyId === selectedPost.id ? 'Copiado' : 'Copiar Rascunho'}
                      </button>
                    </>
                  )}
                </div>
              </header>

              <div className="workspace-body-container">
                {isEditing ? (
                  <div className="workspace-editor-form">
                    <input 
                      type="text" 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="edit-title-input"
                    />
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="edit-content-textarea"
                    />
                  </div>
                ) : (
                  <div className="workspace-editor-form">
                    <div className="post-view-title">{selectedPost.title}</div>
                    <div className="post-view-content" style={{ whiteSpace: 'pre-line' }}>{selectedPost.content}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card preview-workspace-card empty">
              <Eye size={40} style={{opacity: 0.3, marginBottom: 12}} />
              <h3>Nenhum post selecionado</h3>
              <p>Selecione um post da lista para visualizar o conteúdo, editar ou copiar o texto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Posts;
