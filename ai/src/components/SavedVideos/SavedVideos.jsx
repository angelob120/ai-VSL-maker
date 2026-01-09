import React from 'react';
import { Folder, Play, ExternalLink, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import './SavedVideos.css';

const SavedVideos = ({ videos = [], stats }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} className="status-icon completed" />;
      case 'processing':
        return <Loader size={14} className="status-icon processing animate-spin" />;
      case 'failed':
        return <XCircle size={14} className="status-icon failed" />;
      default:
        return <Clock size={14} className="status-icon pending" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Ready';
      case 'processing': return 'Processing...';
      case 'failed': return 'Failed';
      default: return 'Pending';
    }
  };

  const completedVideos = videos.filter(v => v.status === 'completed');

  return (
    <div className="saved-videos-section">
      <div className="section-header">
        <div className="header-title">
          <Folder size={20} />
          <h3>Saved Videos ({completedVideos.length})</h3>
        </div>
        {stats && (
          <div className="stats-badges">
            {stats.processing > 0 && (
              <span className="badge processing">
                <Loader size={12} className="animate-spin" />
                {stats.processing} processing
              </span>
            )}
            {stats.pending > 0 && (
              <span className="badge pending">{stats.pending} pending</span>
            )}
          </div>
        )}
      </div>

      <div className="videos-list">
        {videos.length === 0 ? (
          <div className="empty-state">
            <p>No saved videos yet</p>
          </div>
        ) : (
          videos.map(video => (
            <div key={video.id} className={`video-item ${video.status}`}>
              <div className="video-info">
                <span className="video-name">
                  {video.first_name || video.last_name_or_company || 'Unnamed'}
                </span>
                <div className="video-status">
                  {getStatusIcon(video.status)}
                  <span>{getStatusLabel(video.status)}</span>
                </div>
              </div>
              <div className="video-actions">
                {video.status === 'completed' && video.video_url && (
                  <>
                    <a 
                      href={video.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="action-btn play"
                    >
                      <Play size={14} />
                    </a>
                    <a 
                      href={video.landing_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn link"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SavedVideos;
