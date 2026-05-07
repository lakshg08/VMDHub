import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { apiFetch } from '../lib/api';

const STORAGE_KEY = 'vmd_backup_folder';

export default function BackupModal({ onClose }) {
  const { role } = useAuth();
  const [status, setStatus] = useState('idle');
  const [folderPath, setFolderPath] = useState('');
  const [filename, setFilename] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setFolderPath(localStorage.getItem(STORAGE_KEY) || '');
  }, []);

  async function handleRunBackup() {
    const trimmed = folderPath.trim();
    if (!trimmed) {
      setErrorMsg('Backup folder not configured on this machine. Ask admin to set it up first.');
      setStatus('error');
      return;
    }
    if (role === 'admin') {
      localStorage.setItem(STORAGE_KEY, trimmed);
    }
    setStatus('loading');
    try {
      const res = await apiFetch('/api/backup/local-drive/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFilename(data.filename);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  const isLoading = status === 'loading';

  return (
    <div className="modal-overlay" onClick={isLoading ? undefined : onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: 18 }}>Backup to Google Drive</h2>
          <button className="modal-close" onClick={onClose} disabled={isLoading}>×</button>
        </div>

        <div style={{ marginTop: 20 }}>
          {(status === 'idle' || status === 'loading') && (
            <div>
              {role === 'admin' ? (
                <>
                  <p style={{ marginBottom: 8, fontSize: 13, color: '#555' }}>
                    Paste the path to your local Google Drive folder on this machine.
                  </p>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Google Drive folder path
                  </label>
                  <input
                    type="text"
                    value={folderPath}
                    onChange={e => setFolderPath(e.target.value)}
                    disabled={isLoading}
                    placeholder={
                      navigator.platform.includes('Win')
                        ? 'C:\\Users\\You\\Google Drive\\My Drive'
                        : '/Users/you/Library/CloudStorage/GoogleDrive-you@gmail.com/My Drive'
                    }
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '8px 10px', fontSize: 13, borderRadius: 4,
                      border: '1px solid #ccc', marginBottom: 16, fontFamily: 'monospace',
                    }}
                  />
                </>
              ) : (
                <p style={{ marginBottom: 16, fontSize: 13, color: '#555' }}>
                  Backup your database to Google Drive.
                </p>
              )}
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  <p style={{ margin: 0, color: '#555', fontSize: 14 }}>Copying backup…</p>
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleRunBackup}
                  disabled={role === 'admin' && !folderPath.trim()}
                >
                  Start Backup
                </button>
              )}
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                Backup complete!
                {role === 'admin' && (
                  <>
                    <br />
                    <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{filename}</code>
                  </>
                )}
              </div>
              <button className="btn btn-primary" onClick={onClose}>Confirm</button>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                {errorMsg}
              </div>
              <button className="btn btn-outline" onClick={() => setStatus('idle')}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
