import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Film, X } from 'lucide-react';
import './VideoUpload.css';

const VideoUpload = ({ videoUrl, videoFile, onUpload, onRemove, disabled }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.avi']
    },
    maxFiles: 1,
    disabled
  });

  const hasVideo = videoUrl || videoFile;

  return (
    <div className="video-upload-section">
      <div className="section-header">
        <Film size={20} />
        <h3>Video Upload</h3>
      </div>
      
      {hasVideo ? (
        <div className="video-preview-container">
          <video 
            src={videoFile ? URL.createObjectURL(videoFile) : videoUrl} 
            controls 
            className="video-preview"
          />
          <button 
            className="remove-video-btn" 
            onClick={onRemove}
            disabled={disabled}
          >
            <X size={16} />
            Remove
          </button>
        </div>
      ) : (
        <div 
          {...getRootProps()} 
          className={`upload-dropzone ${isDragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload size={24} className="upload-icon" />
          <span>Upload Intro Video</span>
          <span className="upload-hint">Drag & drop or click to select</span>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
