import { Download, FileText, File, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { ChatMessage, Role } from '../types';

interface Props {
  message: ChatMessage;
  role: Role;
  onBack: () => void;
}

export function ExportScreen({ message, role, onBack }: Props) {
  const confidence = message.audit?.riskLevel === 'Low' ? 91 : message.audit?.riskLevel === 'High' ? 58 : 82;
  const userQuery = (() => {
    const lines = message.content.split('\n');
    return message.audit?.question || lines[0] || 'N/A';
  })();

  const cleanContent = message.content.replace(/\*\*/g, '');

  const handleDownloadPdf = () => {
    document.body.classList.add('is-printing-export');
    const cleanup = () => {
      document.body.classList.remove('is-printing-export');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handleDownloadText = () => {
    const text = [
      'PHARMORA SIGNAL — DECISION SUMMARY REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      `Department: ${role}`,
      '',
      `QUERY: ${userQuery}`,
      '',
      `AI RECOMMENDATION:`,
      cleanContent,
      '',
      `CONFIDENCE LEVEL: ${confidence}%`,
      '',
      'SOURCE CITATIONS:',
      ...(message.evidence
        ? Object.entries(message.evidence.details).map(([k, v]) =>
            `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`
          )
        : ['N/A']),
      '',
      'AUDIT TRAIL:',
      message.audit ? `  ID: ${message.audit.id}` : '',
      message.audit ? `  Role: ${message.audit.role}` : '',
      message.audit ? `  Risk Level: ${message.audit.riskLevel}` : '',
      message.audit ? `  Timestamp: ${message.audit.timestamp}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    downloadBlob(text, 'text/plain', 'txt');
  };

  const handleDownloadCsv = () => {
    const rows: string[][] = [
      ['Field', 'Value'],
      ['Generated', new Date().toISOString()],
      ['Department', role],
      ['Query', userQuery],
      ['Confidence', `${confidence}%`],
      ['Recommendation', cleanContent],
    ];

    if (message.audit) {
      rows.push(['Query ID', message.audit.id]);
      rows.push(['Risk Level', message.audit.riskLevel]);
      rows.push(['Timestamp', message.audit.timestamp]);
    }

    if (message.evidence) {
      for (const [key, value] of Object.entries(message.evidence.details)) {
        rows.push([
          `Source: ${key}`,
          Array.isArray(value) ? value.join('; ') : String(value),
        ]);
      }
    }

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    downloadBlob(csv, 'text/csv', 'csv');
  };

  return (
    <div className="export-screen">
      <div className="export-header export-no-print">
        <button className="rec-back-btn" onClick={onBack}>Back</button>
        <h2>Export Decision Summary</h2>
      </div>

      <div className="export-body">
        <div className="export-preview">
          <div className="export-preview-header">
            <h3>Decision Summary Report</h3>
            <span className="export-date">Generated: {new Date().toLocaleDateString()}</span>
          </div>

          <div className="export-preview-content">
            <div className="export-field">
              <span className="export-field-label">Session ID</span>
              <span className="export-field-value">SESSION-{new Date().toISOString().slice(0, 10)}-001</span>
            </div>

            <div className="export-field">
              <span className="export-field-label">Department</span>
              <span className="export-field-value">{role}</span>
            </div>

            <div className="export-section-divider"></div>

            <div className="export-field">
              <span className="export-field-label">Original Query</span>
              <div className="export-field-value export-query-text">
                "{userQuery}"
              </div>
            </div>

            <div className="export-section-divider"></div>

            <div className="export-field">
              <span className="export-field-label">AI Recommendation</span>
              <div className="export-field-value">
                {cleanContent}
              </div>
            </div>

            <div className="export-section-divider"></div>

            <div className="export-field">
              <span className="export-field-label">Confidence Level</span>
              <div className="export-confidence-row">
                <div className="confidence-bar export-confidence-bar">
                  <div className="confidence-fill" style={{ width: `${confidence}%` }}></div>
                </div>
                <span className="confidence-value">{confidence}% — {confidence >= 80 ? 'High' : confidence >= 60 ? 'Moderate' : 'Low'} Confidence</span>
              </div>
            </div>

            <div className="export-section-divider"></div>

            {message.evidence && (
              <>
                <div className="export-field">
                  <span className="export-field-label">Source Citations</span>
                  <ul className="export-citations">
                    {Object.entries(message.evidence.details).map(([key, value]) => (
                      <li key={key}>{key}: {Array.isArray(value) ? value.join(', ') : value}</li>
                    ))}
                  </ul>
                </div>
                <div className="export-section-divider"></div>
              </>
            )}

            {message.audit && (
              <div className="export-field">
                <span className="export-field-label">Audit Trail</span>
                <div className="export-audit-grid">
                  <div className="export-audit-item">
                    <CheckCircle size={12} />
                    <span>Query ID: {message.audit.id}</span>
                  </div>
                  <div className="export-audit-item">
                    <ShieldCheck size={12} />
                    <span>Risk Level: {message.audit.riskLevel}</span>
                  </div>
                  <div className="export-audit-item">
                    <Clock size={12} />
                    <span>Time: {new Date(message.audit.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="export-audit-item">
                    <CheckCircle size={12} />
                    <span>Role: {message.audit.role}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="export-actions-panel export-no-print">
          <h4>Download Format</h4>
          <button className="export-download-btn export-download-primary" onClick={handleDownloadPdf}>
            <FileText size={16} />
            <div>
              <span className="export-btn-title">Download as PDF</span>
              <span className="export-btn-desc">Print dialog — choose "Save as PDF"</span>
            </div>
          </button>
          <button className="export-download-btn" onClick={handleDownloadText}>
            <File size={16} />
            <div>
              <span className="export-btn-title">Download as Text</span>
              <span className="export-btn-desc">Plain text summary</span>
            </div>
          </button>
          <button className="export-download-btn" onClick={handleDownloadCsv}>
            <Download size={16} />
            <div>
              <span className="export-btn-title">Download as CSV</span>
              <span className="export-btn-desc">Data points for analysis</span>
            </div>
          </button>

          <div className="export-disclaimer">
            <ShieldCheck size={14} />
            <p>
              This summary is auto-generated by Pharmora Copilot AI. All recommendations
              should be reviewed by qualified personnel before implementation. Full audit
              trail is preserved in the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadBlob(content: string, mime: string, extension: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pharmora-summary-${Date.now()}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}
