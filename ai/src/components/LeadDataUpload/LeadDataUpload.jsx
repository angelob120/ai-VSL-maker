import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileSpreadsheet, Upload } from 'lucide-react';
import './LeadDataUpload.css';

const LeadDataUpload = ({ onUpload, disabled, uploadResult }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    disabled
  });

  return (
    <div className="lead-data-section">
      <div className="section-header">
        <FileSpreadsheet size={20} />
        <h3>Lead Data (CSV)</h3>
      </div>
      
      <div 
        {...getRootProps()} 
        className={`upload-dropzone ${isDragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload size={24} className="upload-icon" />
        <span>Upload CSV</span>
        <span className="upload-hint">Include: Website URL, First Name, Company/Last Name</span>
      </div>

      {uploadResult && (
        <div className="upload-result">
          <div className="result-stat valid">
            <span className="stat-value">{uploadResult.validLeads}</span>
            <span className="stat-label">Valid Leads</span>
          </div>
          {uploadResult.invalidLeads > 0 && (
            <div className="result-stat invalid">
              <span className="stat-value">{uploadResult.invalidLeads}</span>
              <span className="stat-label">Invalid</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadDataUpload;
