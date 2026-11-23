import { useEffect, useRef, useState } from 'react'
import './App.css'

const API = 'http://localhost:8080/api'

const DEFAULT_SUBJECT = 'Fresher Java/React Developer - Internship/Job Opportunity'
const DEFAULT_BODY = `Hi {company} Team,

I'm a Computer Engineering graduate looking for my first developer role. I specialize in Java/Spring Boot and React, having engineered production-ready full-stack applications. 

Do you currently have any openings for freshers, associate software engineers, or interns? I have attached my resume for your review.

If this is not relevant to your current hiring roadmap, please feel free to disregard.

Thank you for your time,
Your Name
GitHub: github.com/yourhandle | LinkedIn: linkedin.com/in/yourprofile`

// Clean inline SVG Icons (zero external npm dependencies required)
const Icons = {
  Send: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Stop: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>,
  Excel: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M10 9H8"/></svg>,
  Pdf: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/><path d="M9 11h6"/></svg>,
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Terminal: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  Eye: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Edit: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
}

function App() {
  const [file, setFile] = useState(null)
  const [resume, setResume] = useState(null)
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [body, setBody] = useState(DEFAULT_BODY)
  const [delaySec, setDelaySec] = useState(30)
  const [skip, setSkip] = useState(0)
  const [limit, setLimit] = useState(50)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [status, setStatus] = useState({ running: false, total: 0, sent: 0, failed: 0, log: [] })
  const [backendDown, setBackendDown] = useState(false)
  const [activeTab, setActiveTab] = useState('editor') // 'editor' | 'preview'
  const [copiedLog, setCopiedLog] = useState(false)

  const logRef = useRef(null)
  const fileInputRef = useRef(null)
  const resumeInputRef = useRef(null)
  const bodyTextareaRef = useRef(null)

  // Poll backend for live campaign state
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API}/status`)
        const data = await res.json()
        setStatus(data)
        setBackendDown(false)
      } catch {
        setBackendDown(true)
      }
    }
    poll()
    const timer = setInterval(poll, 2000)
    return () => clearInterval(timer)
  }, [])

  // Auto-scroll terminal log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [status.log])

  const show = (text, error = false) => {
    setMessage(text)
    setIsError(error)
  }

  const insertVariable = (variable) => {
    const textarea = bodyTextareaRef.current
    if (!textarea) {
      setBody(prev => prev + ` ${variable}`)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = body.substring(0, start) + variable + body.substring(end)
    setBody(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  const send = async () => {
    if (!file) return show('Excel contacts database (.xlsx/.xls) is required.', true)
    if (!subject.trim() || !body.trim()) return show('Subject line and email body cannot be blank.', true)
    if (!resume && !window.confirm('No resume attached. Proceed with text-only dispatch?')) return

    const form = new FormData()
    form.append('file', file)
    if (resume) form.append('resume', resume)
    form.append('subject', subject)
    form.append('body', body)
    form.append('delaySec', delaySec)
    form.append('skip', skip)
    form.append('limit', limit)

    try {
      const res = await fetch(`${API}/send`, { method: 'POST', body: form })
      const text = await res.text()
      show(text, !res.ok)
    } catch {
      show('Backend unreachable. Ensure Spring Boot is operational on :8080.', true)
    }
  }

  const stop = async () => {
    try {
      await fetch(`${API}/stop`, { method: 'POST' })
      show('Graceful stop triggered. Will safely halt upon finishing current mail.')
    } catch {
      show('Failed to issue stop request. Connection dropped.', true)
    }
  }

  const copyLogToClipboard = () => {
    if (!status.log.length) return
    navigator.clipboard.writeText(status.log.join('\n'))
    setCopiedLog(true)
    setTimeout(() => setCopiedLog(false), 2000)
  }

  const done = status.sent + status.failed
  const percent = status.total > 0 ? Math.round((done / status.total) * 100) : 0
  const remaining = Math.max(0, status.total - done)
  const successRate = done > 0 ? Math.round((status.sent / done) * 100) : 100

  // Format bytes helper
  const formatSize = (bytes) => {
    if (!bytes) return ''
    const kb = bytes / 1024
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
  }

  return (
    <div className="app-container">
      {/* Top Enterprise Navigation Bar */}
      <header className="top-nav">
        <div className="nav-brand">
          <div className="brand-badge">
            <span className="brand-dot"></span>
            <Icons.Send />
          </div>
          <div>
            <div className="brand-title">
              Outreach<span>Studio</span>
              <span className="env-tag">PRO</span>
            </div>
            <p className="brand-subtitle">Autonomous Talent & Candidate Dispatch Engine</p>
          </div>
        </div>

        <div className="nav-actions">
          <div className={`status-pill ${backendDown ? 'offline' : 'online'}`}>
            <span className="pulse-indicator"></span>
            {backendDown ? 'Backend Disconnected (:8080)' : 'API Engine Ready'}
          </div>

          <div className={`status-pill ${status.running ? 'running' : 'idle'}`}>
            <span className="dot"></span>
            {status.running ? 'Dispatching Campaign' : 'System Idle'}
          </div>
        </div>
      </header>

      {/* Backend Alert Banner */}
      {backendDown && (
        <div className="banner-alert error animate-slide-down">
          <Icons.Alert />
          <div>
            <strong>Service Connection Failure:</strong> Unable to connect to <code>http://localhost:8080/api</code>.
            Ensure your Spring Boot service is running and CORS is configured.
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <main className="dashboard-grid">
        {/* Left Column: Campaign Orchestration */}
        <section className="dashboard-col left-col">
          {/* File Ingestion Card */}
          <div className="enterprise-card">
            <div className="card-header">
              <span className="step-badge">1</span>
              <div>
                <h3>Data Ingestion & Assets</h3>
                <p>Provide contact spreadsheets and attach resume files</p>
              </div>
            </div>

            <div className="upload-grid">
              {/* Excel Dropzone */}
              <div 
                className={`dropzone ${file ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                <div className="dropzone-icon">
                  <Icons.Excel />
                </div>
                <div className="dropzone-info">
                  <div className="dropzone-title">Recruiter List (Excel)</div>
                  <div className="dropzone-sub">
                    {file ? `${file.name} (${formatSize(file.size)})` : 'Click to select .xlsx or .xls file'}
                  </div>
                </div>
                {file && (
                  <button 
                    type="button" 
                    className="file-remove-btn"
                    title="Remove file"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  >
                    <Icons.Trash />
                  </button>
                )}
              </div>

              {/* Resume Dropzone */}
              <div 
                className={`dropzone ${resume ? 'has-file' : ''}`}
                onClick={() => resumeInputRef.current?.click()}
              >
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setResume(e.target.files[0] || null)}
                />
                <div className="dropzone-icon">
                  <Icons.Pdf />
                </div>
                <div className="dropzone-info">
                  <div className="dropzone-title">Candidate Resume (PDF)</div>
                  <div className="dropzone-sub">
                    {resume ? `${resume.name} (${formatSize(resume.size)})` : 'Click to select resume .pdf'}
                  </div>
                </div>
                {resume && (
                  <button 
                    type="button" 
                    className="file-remove-btn"
                    title="Remove file"
                    onClick={(e) => { e.stopPropagation(); setResume(null); }}
                  >
                    <Icons.Trash />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email Template & Personalization Card */}
          <div className="enterprise-card">
            <div className="card-header space-between">
              <div className="flex-row">
                <span className="step-badge">2</span>
                <div>
                  <h3>Message Studio & Template Engine</h3>
                  <p>Dynamic variables are evaluated per prospect in real-time</p>
                </div>
              </div>

              {/* View Switcher: Compose / Preview */}
              <div className="view-toggle">
                <button
                  type="button"
                  className={activeTab === 'editor' ? 'active' : ''}
                  onClick={() => setActiveTab('editor')}
                >
                  <Icons.Edit /> Compose
                </button>
                <button
                  type="button"
                  className={activeTab === 'preview' ? 'active' : ''}
                  onClick={() => setActiveTab('preview')}
                >
                  <Icons.Eye /> Live Preview
                </button>
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>Subject Line</label>
                <span className="char-count">{subject.length} characters</span>
              </div>
              <input
                type="text"
                className="custom-input"
                placeholder="e.g. Fresher Java/React Developer - Inquiry"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {activeTab === 'editor' ? (
              <div className="form-group">
                <div className="label-row">
                  <label>Message Content</label>
                  <div className="variables-bar">
                    <span className="var-label">Insert variable:</span>
                    <button 
                      type="button" 
                      className="var-tag"
                      onClick={() => insertVariable('{company}')}
                      title="Inject company name dynamically"
                    >
                      + {'{company}'}
                    </button>
                  </div>
                </div>

                <textarea
                  ref={bodyTextareaRef}
                  rows={10}
                  className="custom-textarea"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Draft your personalized cold outreach email..."
                />
              </div>
            ) : (
              /* Simulated Email Preview for Enterprise Polish */
              <div className="email-preview-wrapper">
                <div className="email-preview-header">
                  <div><strong>From:</strong> You &lt;candidate@domain.com&gt;</div>
                  <div><strong>To:</strong> hiring@acme-technologies.com</div>
                  <div><strong>Subject:</strong> {subject.replace('{company}', 'Acme Technologies')}</div>
                </div>
                <div className="email-preview-body">
                  {body
                    .replace(/{company}/g, 'Acme Technologies')
                    .split('\n')
                    .map((line, i) => (
                      <p key={i}>{line || '\u00A0'}</p>
                    ))}
                </div>
                {resume && (
                  <div className="preview-attachment">
                    <Icons.Pdf />
                    <span>{resume.name}</span>
                    <span className="attachment-size">({formatSize(resume.size)})</span>
                  </div>
                )}
              </div>
            )}

            {/* Throttling & Queue Parameters */}
            <div className="parameters-panel">
              <div className="param-header">
                <span className="step-badge sm">3</span>
                <span>Delivery Guardrails & Safety Settings</span>
              </div>

              <div className="param-grid">
                <div className="param-item">
                  <label>
                    Dispatch Gap (sec)
                    <span className="tooltip-tag" title="Prevents spam flag penalties">Anti-Spam</span>
                  </label>
                  <input
                    type="number"
                    min="10"
                    className="custom-input"
                    value={delaySec}
                    onChange={(e) => setDelaySec(Number(e.target.value))}
                  />
                  <span className="sub-helper">Min 10s recommended</span>
                </div>

                <div className="param-item">
                  <label>Batch Size</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    className="custom-input"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                  />
                  <span className="sub-helper">Max emails in this run</span>
                </div>

                <div className="param-item">
                  <label>Skip Offset</label>
                  <input
                    type="number"
                    min="0"
                    className="custom-input"
                    value={skip}
                    onChange={(e) => setSkip(Number(e.target.value))}
                  />
                  <span className="sub-helper">Resume from row N</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="actions-cluster">
              <button
                type="button"
                className={`btn btn-primary ${status.running ? 'btn-loading' : ''}`}
                onClick={send}
                disabled={status.running}
              >
                {status.running ? (
                  <>
                    <span className="spinner"></span> Dispatching Pipeline...
                  </>
                ) : (
                  <>
                    <Icons.Send /> Start Campaign
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={stop}
                disabled={!status.running}
              >
                <Icons.Stop /> Abort Process
              </button>
            </div>

            {/* In-app Notification Feedback */}
            {message && (
              <div className={`toast-notification ${isError ? 'toast-error' : 'toast-success'}`}>
                {isError ? <Icons.Alert /> : <Icons.Check />}
                <span>{message}</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Telemetry, Metrics & Live Logs */}
        <section className="dashboard-col right-col">
          {/* Real-time Telemetry Metrics */}
          <div className="enterprise-card">
            <div className="card-header">
              <span className="step-badge telemetry">HUD</span>
              <div>
                <h3>Campaign Telemetry</h3>
                <p>Live metrics and throughput statistics</p>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-label">Total in Queue</span>
                <span className="kpi-val">{status.total}</span>
              </div>
              <div className="kpi-card success">
                <span className="kpi-label">Delivered</span>
                <span className="kpi-val">{status.sent}</span>
                <span className="kpi-sub">{done > 0 ? `${successRate}% Success` : 'Pending'}</span>
              </div>
              <div className="kpi-card danger">
                <span className="kpi-label">Delivery Errors</span>
                <span className="kpi-val">{status.failed}</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Remaining</span>
                <span className="kpi-val">{remaining}</span>
              </div>
            </div>

            {/* Progress Gauge */}
            <div className="progress-section">
              <div className="progress-labels">
                <span>Execution Progress</span>
                <span className="progress-pct">{percent}%</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Developer / Sysadmin Live Log Console */}
          <div className="enterprise-card console-card">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="dot-red"></span>
                <span className="dot-yellow"></span>
                <span className="dot-green"></span>
              </div>
              <div className="terminal-title">
                <Icons.Terminal /> stdout: job-dispatcher.log
              </div>
              <button 
                type="button" 
                className="terminal-action-btn"
                onClick={copyLogToClipboard}
                title="Copy log to clipboard"
              >
                <Icons.Copy /> {copiedLog ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="terminal-screen" ref={logRef}>
              {status.log.length === 0 ? (
                <div className="terminal-empty">
                  <span>[SYSTEM IDLE] Waiting for campaign initialization...</span>
                  <p>Log messages from the mail worker thread will stream here in real-time.</p>
                </div>
              ) : (
                status.log.map((entry, idx) => {
                  const isFail = entry.toLowerCase().includes('fail') || entry.toLowerCase().includes('error')
                  const isSent = entry.toLowerCase().includes('sent') || entry.toLowerCase().includes('success')
                  return (
                    <div 
                      key={idx} 
                      className={`terminal-line ${isFail ? 'line-fail' : isSent ? 'line-sent' : ''}`}
                    >
                      <span className="line-num">{String(idx + 1).padStart(3, '0')}</span>
                      <span className="line-text">{entry}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Compliance & Quota Advisor Card */}
          <div className="enterprise-card info-card">
            <div className="info-badge">
              <Icons.Shield />
              <span>Deliverability & SMTP Quota Guidance</span>
            </div>
            <ul className="info-bullets">
              <li><strong>Free Gmail Quota:</strong> Standard accounts allow up to ~500 emails/day.</li>
              <li><strong>Warm-Up Best Practice:</strong> Send 30–50 emails daily initially. Gradually increase limits to maintain domain reputation.</li>
              <li><strong>Resuming Pipeline:</strong> Use the <code>Skip Offset</code> parameter to effortlessly pick up where yesterday's batch finished.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App