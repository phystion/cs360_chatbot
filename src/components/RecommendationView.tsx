import { BarChart3, FileText, GitCompare, ExternalLink, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { ChatMessage, AuditRecord, EvidenceData } from '../types';

interface Props {
  message: ChatMessage;
  onExport: () => void;
  onBack: () => void;
}

export function RecommendationView({ message, onExport, onBack }: Props) {
  const confidence = message.audit?.riskLevel === 'Low' ? 91 : message.audit?.riskLevel === 'High' ? 58 : 82;
  const confidenceLabel = confidence >= 80 ? 'High' : confidence >= 60 ? 'Moderate' : 'Low';

  const sections = parseContent(message.content);

  return (
    <div className="recommendation-screen">
      <div className="recommendation-header">
        <button className="rec-back-btn" onClick={onBack}>Back to Chat</button>
        <h2>AI-Generated Recommendation</h2>
        <div className="rec-confidence">
          <span className="confidence-label">Confidence Level</span>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${confidence}%` }}></div>
          </div>
          <span className="confidence-value">{confidence}% {confidenceLabel}</span>
        </div>
      </div>

      <div className="recommendation-body">
        <div className="rec-main">
          {sections.recommendation && (
            <div className="rec-section rec-answer">
              <div className="rec-section-header">
                <CheckCircle size={16} />
                <h3>Recommendation</h3>
              </div>
              <p>{sections.recommendation}</p>
            </div>
          )}

          {message.evidence && (
            <div className="rec-section rec-sources">
              <div className="rec-section-header">
                <FileText size={16} />
                <h3>Cited Data Sources</h3>
              </div>
              <div className="source-list">
                {Object.entries(message.evidence.details).map(([key, value]) => (
                  <div key={key} className="source-item">
                    <span className="source-tag">{key}</span>
                    <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.risk && (
            <div className="rec-section rec-risk">
              <div className="rec-section-header">
                <AlertTriangle size={16} />
                <h3>Strategic Risk Assessment</h3>
              </div>
              <p>{sections.risk}</p>
            </div>
          )}

          {sections.nextAction && (
            <div className="rec-section rec-next">
              <div className="rec-section-header">
                <Info size={16} />
                <h3>Recommended Next Steps</h3>
              </div>
              <p>{sections.nextAction}</p>
            </div>
          )}
        </div>

        <div className="rec-sidebar">
          <div className="rec-actions">
            <h4>Actions</h4>
            <button className="rec-action-btn" onClick={onExport}>
              <FileText size={14} />
              Export as PDF
            </button>
            <button className="rec-action-btn" onClick={onExport}>
              <FileText size={14} />
              Export as Text
            </button>
            <button className="rec-action-btn">
              <GitCompare size={14} />
              Compare Scenarios
            </button>
            <button className="rec-action-btn">
              <BarChart3 size={14} />
              Drill Into Data
            </button>
            <button className="rec-action-btn">
              <ExternalLink size={14} />
              Share with Team
            </button>
          </div>

          {message.audit && (
            <div className="rec-audit-trail">
              <h4>Audit Trail</h4>
              <div className="audit-mini">
                <div className="audit-mini-row"><span>Query ID:</span><span>{message.audit.id}</span></div>
                <div className="audit-mini-row"><span>Role:</span><span>{message.audit.role}</span></div>
                <div className="audit-mini-row"><span>Tool Used:</span><span>{message.audit.toolUsed}</span></div>
                <div className="audit-mini-row"><span>Human Review:</span><span>{message.audit.reviewStatus}</span></div>
                <div className="audit-mini-row">
                  <span>Risk Level:</span>
                  <span className={`risk-badge risk-${message.audit.riskLevel.toLowerCase()}`}>{message.audit.riskLevel}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parseContent(content: string) {
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^\*\*(.+?):\*\*\s*(.+)/);
    if (match) {
      const key = match[1].toLowerCase().trim();
      if (key.includes('recommendation')) result.recommendation = match[2];
      else if (key.includes('risk')) result.risk = match[2];
      else if (key.includes('next')) result.nextAction = match[2];
      else if (key.includes('evidence')) result.evidence = match[2];
      else if (key.includes('human')) result.humanReview = match[2];
    }
  }
  if (!result.recommendation) {
    result.recommendation = content.replace(/\*\*/g, '').slice(0, 500);
  }
  return result;
}
