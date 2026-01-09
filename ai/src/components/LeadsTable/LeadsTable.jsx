import React, { useState } from 'react';
import { X, Plus, ExternalLink } from 'lucide-react';
import './LeadsTable.css';

const LeadsTable = ({ 
  leads = [], 
  videos = [],
  onAddLead, 
  onRemoveLead, 
  disabled 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({
    website_url: '',
    first_name: '',
    last_name_or_company: ''
  });

  const validLeads = leads.filter(l => l.website_url);
  const invalidLeads = leads.filter(l => !l.website_url);

  const getVideoForLead = (leadId) => {
    return videos.find(v => v.lead_id === leadId);
  };

  const handleAddLead = () => {
    if (newLead.website_url) {
      onAddLead(newLead);
      setNewLead({ website_url: '', first_name: '', last_name_or_company: '' });
      setShowAddForm(false);
    }
  };

  const truncateUrl = (url, maxLength = 25) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="leads-table-section">
      <div className="table-tabs">
        <button className="tab active">
          All <span className="tab-count">{leads.length}</span>
        </button>
        {invalidLeads.length > 0 && (
          <button className="tab invalid-tab">
            Invalid <span className="tab-count">{invalidLeads.length}</span>
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Website URLs</th>
              <th>First name</th>
              <th>Last name or company name</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => {
              const video = getVideoForLead(lead.id);
              return (
                <tr key={lead.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    <a 
                      href={lead.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="url-link"
                    >
                      {truncateUrl(lead.website_url)}
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td>{lead.first_name || '-'}</td>
                  <td>{lead.last_name_or_company || '-'}</td>
                  <td>
                    <button 
                      className="remove-btn"
                      onClick={() => onRemoveLead(lead.id)}
                      disabled={disabled}
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddForm ? (
        <div className="add-lead-form">
          <input
            type="url"
            placeholder="Website URL"
            value={newLead.website_url}
            onChange={(e) => setNewLead(prev => ({ ...prev, website_url: e.target.value }))}
          />
          <input
            type="text"
            placeholder="First name"
            value={newLead.first_name}
            onChange={(e) => setNewLead(prev => ({ ...prev, first_name: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Company / Last name"
            value={newLead.last_name_or_company}
            onChange={(e) => setNewLead(prev => ({ ...prev, last_name_or_company: e.target.value }))}
          />
          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleAddLead}>
              Add Lead
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="add-lead-btn" 
          onClick={() => setShowAddForm(true)}
          disabled={disabled}
        >
          <Plus size={16} />
          Add
        </button>
      )}
    </div>
  );
};

export default LeadsTable;
