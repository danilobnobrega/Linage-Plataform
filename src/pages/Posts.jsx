import React, { useState } from 'react';
import useStore from '../store';
import { 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  Share2, 
  Edit3, 
  Eye, 
  ExternalLink,
  PenTool,
  BookmarkCheck
} from 'lucide-react';

function Posts() {
  const { posts, agents, updatePost, user } = useStore();
  const [activeTab, setActiveTab] = useState('all'); // all, drafts, published
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [copyId, setCopyId] = useState('');

  // Delete post from state
  const handleDeletePost = (id, e) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja deletar este post?")) {
      useStore.setState(s => ({
        posts: s.posts.filter(p => p.id !== id)
      }));
      if (selectedPost?.id === id) {
        setSelectedPost(null);
      }
    }
  };

  // Toggle draft/publish status
  const handleTogglePublish = (post, e) => {
    e.stopPropagation();
    const newStatus = !post.draft;
    updatePost(post.id, { draft: newStatus });
    if (selectedPost?.id === post.id) {
      setSelectedPost({ ...selectedPost, draft: newStatus });
    }
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

  const saveEditedPost = () => {
    updatePost(selectedPost.id, {
      title: editTitle,
      content: editContent
    });
    setSelectedPost({
      ...selectedPost,
      title: editTitle,
      content: editContent
    });
    setIsEditing(false);
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'drafts') return post.draft;
    if (activeTab === 'published') return !post.draft;
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
          <p className="header-desc">Acompanhe todos os rascunhos redigidos por seus estrategistas de marca. Edite, copie o rascunho finalizado ou simule o feed.</p>
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
            className={`tab-filter-btn ${activeTab === 'published' ? 'active' : ''}`}
            onClick={() => setActiveTab('published')}
          >
            Publicados ({posts.filter(p => !p.draft).length})
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
                      <span className={`badge-indicator ${post.draft ? 'draft' : 'published'}`}>
                        {post.draft ? 'Rascunho' : 'Publicado'}
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
                  <span className={`status-pill ${selectedPost.draft ? 'draft' : 'published'}`}>
                    {selectedPost.draft ? 'Rascunho Pendente' : 'Publicado'}
                  </span>
                  <button className="status-toggle-link" onClick={(e) => handleTogglePublish(selectedPost, e)}>
                    {selectedPost.draft ? 'Marcar como Publicado' : 'Voltar para Rascunho'}
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
                  <div className="linkedin-render-preview">
                    <div className="mock-render-card">
                      <div className="mock-render-header">
                        <div 
                          className="mock-render-avatar"
                          style={{ backgroundColor: getAgentColor(selectedPost.agentId) }}
                        >
                          {agents.find(a => a.id === selectedPost.agentId)?.name[0] || 'L'}
                        </div>
                        <div>
                          <h4 className="mock-render-name">{user.name || 'Especialista Financeiro'}</h4>
                          <span className="mock-render-headline">
                            Especialista Financeiro | Focado em Captação de Leads
                          </span>
                          <span className="mock-render-time">1h • editado • 🌐 • Redigido por {agents.find(a => a.id === selectedPost.agentId)?.name || 'Linage'}</span>
                        </div>
                      </div>
                      <div className="mock-render-content">
                        <h3 className="render-title-h">{selectedPost.title}</h3>
                        <p style={{ whiteSpace: 'pre-line' }}>{selectedPost.content}</p>
                      </div>
                      <div className="mock-render-engagement">
                        <span className="reactions">👍 ❤️ 💡 64</span>
                        <span className="comments">18 comentários • 4 compartilhamentos</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card preview-workspace-card empty">
              <Eye size={40} style={{opacity: 0.3, marginBottom: 12}} />
              <h3>Visualizador de Feed</h3>
              <p>Selecione um post da lista lateral para visualizar a formatação completa, fazer edições cirúrgicas ou copiar o texto finalizado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Posts;
