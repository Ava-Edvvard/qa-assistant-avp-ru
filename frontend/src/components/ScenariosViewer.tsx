import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { TestScenario, Requirement } from '../context/DesignContext';

interface ScenariosViewerProps {
  scenarios: TestScenario[];
  requirements: Requirement[];
}

export const ScenariosViewer: React.FC<ScenariosViewerProps> = ({ scenarios, requirements }) => {
  const [copied, setCopied] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(x => x !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  const getScenariosMarkdown = (): string => {
    let md = '';
    scenarios.forEach((sc) => {
      md += `${sc.id}: ${sc.name} - ${sc.priority}\n`;
      
      md += 'Предусловия:\n';
      if (!sc.preconditions || sc.preconditions.length === 0) {
        md += '* Нет\n';
      } else {
        sc.preconditions.forEach((p) => {
          md += `* ${p}\n`;
        });
      }
      
      md += 'Шаги:\n';
      if (sc.steps) {
        sc.steps.forEach((step, index) => {
          md += `${index + 1}. ${step}\n`;
        });
      }
      
      md += 'Ожидаемый результат:\n';
      if (sc.expected_results) {
        sc.expected_results.forEach((res, index) => {
          md += `${index + 1}. ${res}\n`;
        });
      }
      
      md += 'Покрытие:\n';
      if (sc.coverage) {
        sc.coverage.forEach((reqId) => {
          md += `* ${reqId}\n`;
        });
      }
      
      md += '\n';
    });
    return md.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getScenariosMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header and Copy Action */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Сгенерированные тест-сценарии
          </span>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={handleCopy} 
          style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {copied ? (
            <>
              <Check size={14} style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Скопировано!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Скопировать Markdown</span>
            </>
          )}
        </button>
      </div>

      {/* Scenarios Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {scenarios.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Нет созданных тест-сценариев.
          </div>
        ) : (
          scenarios.map((sc) => {
            const isExpanded = expandedIds.includes(sc.id);
            
            return (
              <div 
                key={sc.id} 
                className="glass-panel" 
                style={{ 
                  overflow: 'visible', 
                  borderLeft: `3px solid ${sc.priority === 'П1' ? 'var(--danger)' : sc.priority === 'П2' ? 'var(--warning)' : 'var(--primary)'}` 
                }}
              >
                {/* Accordion Header */}
                <div 
                  onClick={() => toggleExpand(sc.id)}
                  style={{ 
                    padding: '10px 16px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', minWidth: '50px' }}>{sc.id}</span>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: '0.9rem', 
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginRight: '8px'
                    }} title={sc.name}>
                      {sc.name}
                    </span>
                    
                    <span className={`badge badge-${sc.priority.toLowerCase()}`} style={{ flexShrink: 0 }}>
                      {sc.priority}
                    </span>
                    
                    {sc.coverage && sc.coverage.length > 0 && (
                      <div style={{ display: 'flex', gap: '3px', marginLeft: '6px', flexWrap: 'wrap' }}>
                        {sc.coverage.map(cId => {
                          const req = requirements.find(r => r.id === cId);
                          return (
                            <span 
                              key={cId}
                              className="custom-tooltip-container"
                              style={{ 
                                fontSize: '0.65rem', 
                                background: '#f1f5f9', 
                                padding: '1px 4px', 
                                borderRadius: '3px',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {cId}
                              {req && (
                                <span className="custom-tooltip-text">
                                  <strong style={{ color: 'var(--primary)' }}>{req.id}:</strong> {req.description}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div style={{ 
                    padding: '12px 16px 16px 16px', 
                    borderTop: '1px solid var(--border)', 
                    background: 'var(--bg-base)',
                    borderBottomLeftRadius: 'var(--radius-md)',
                    borderBottomRightRadius: 'var(--radius-md)'
                  }}>
                    
                    {/* Preconditions */}
                    <div>
                      <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>
                        Предусловия
                      </h4>
                      {!sc.preconditions || sc.preconditions.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Нет предусловий</p>
                      ) : (
                        <ul style={{ paddingLeft: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                          {sc.preconditions.map((p, idx) => (
                            <li key={idx} style={{ marginBottom: '2px' }}>{p}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Steps & Expected Results grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>
                          Шаги
                        </h4>
                        <ol style={{ paddingLeft: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                          {sc.steps && sc.steps.map((step, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      
                      <div>
                        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>
                          Ожидаемый результат
                        </h4>
                        <ol style={{ paddingLeft: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                          {sc.expected_results && sc.expected_results.map((res, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{res}</li>
                          ))}
                        </ol>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
