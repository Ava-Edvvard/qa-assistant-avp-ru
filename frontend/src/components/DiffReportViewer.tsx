import React, { useState } from 'react';
import { Copy, Check, GitCompare, List, Layers, ShieldCheck } from 'lucide-react';

interface DiffReportViewerProps {
  reportText: string;
}

interface PriorityStat {
  p1: number;
  p2: number;
  p3: number;
}

export const DiffReportViewer: React.FC<DiffReportViewerProps> = ({ reportText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parsing sections
  const reqHeaderRegex = /(?:^|\n)(?:#{1,6}\s+)?(?:1\.\s+)?(?:Сводка по изменениям в требованиях|Изменения в требованиях)/i;
  const scenHeaderRegex = /(?:^|\n)(?:#{1,6}\s+)?(?:2\.\s+)?(?:Сводка изменений сценариев|Изменения сценариев)/i;
  const statsHeaderRegex = /(?:^|\n)(?:#{1,6}\s+)?(?:3\.\s+)?(?:Сводка по количеству(?: старых тест-сценариев)?|Сводка по количеству и приоритетам|Количество и приоритеты)/i;

  const reqMatch = reportText.match(reqHeaderRegex);
  const scenMatch = reportText.match(scenHeaderRegex);
  const statsMatch = reportText.match(statsHeaderRegex);

  let reqStart = -1;
  let scenStart = -1;
  let statsStart = -1;

  if (reqMatch && reqMatch.index !== undefined) {
    reqStart = reqMatch.index + reqMatch[0].length;
  }
  if (scenMatch && scenMatch.index !== undefined) {
    scenStart = scenMatch.index + scenMatch[0].length;
  }
  if (statsMatch && statsMatch.index !== undefined) {
    statsStart = statsMatch.index + statsMatch[0].length;
  }

  let requirementsChanges = '';
  let scenariosChanges = '';
  let statsText = '';

  if (reqStart !== -1) {
    const end = scenStart !== -1 ? (scenStart - scenMatch![0].length) : (statsStart !== -1 ? (statsStart - statsMatch![0].length) : reportText.length);
    requirementsChanges = reportText.substring(reqStart, end).trim();
  }

  if (scenStart !== -1) {
    const end = statsStart !== -1 ? (statsStart - statsMatch![0].length) : reportText.length;
    scenariosChanges = reportText.substring(scenStart, end).trim();
  }

  if (statsStart !== -1) {
    statsText = reportText.substring(statsStart).trim();
  }

  // Fallback if parsing failed
  const isParsedSuccessfully = reqStart !== -1 || scenStart !== -1 || statsStart !== -1;

  const parsePart = (text: string): PriorityStat => {
    let p1 = 0, p2 = 0, p3 = 0;
    const lines = text.split('\n');
    for (const line of lines) {
      const cleaned = line.trim();
      if (!cleaned) continue;

      if (/^(?:1|П1)\b/i.test(cleaned) || cleaned.includes('1 приоритет') || cleaned.includes('1 - приоритет') || cleaned.includes('П1')) {
        const withoutPrio = cleaned.replace(/^(?:1|П1)\b/i, '').replace(/1\s*(?:-|—)?\s*приоритет/i, '').replace(/П1/i, '');
        const countMatch = withoutPrio.match(/(\d+)/);
        if (countMatch) p1 = parseInt(countMatch[1], 10);
      }
      else if (/^(?:2|П2)\b/i.test(cleaned) || cleaned.includes('2 приоритет') || cleaned.includes('2 - приоритет') || cleaned.includes('П2')) {
        const withoutPrio = cleaned.replace(/^(?:2|П2)\b/i, '').replace(/2\s*(?:-|—)?\s*приоритет/i, '').replace(/П2/i, '');
        const countMatch = withoutPrio.match(/(\d+)/);
        if (countMatch) p2 = parseInt(countMatch[1], 10);
      }
      else if (/^(?:3|П3)\b/i.test(cleaned) || cleaned.includes('3 приоритет') || cleaned.includes('3 - приоритет') || cleaned.includes('П3')) {
        const withoutPrio = cleaned.replace(/^(?:3|П3)\b/i, '').replace(/3\s*(?:-|—)?\s*приоритет/i, '').replace(/П3/i, '');
        const countMatch = withoutPrio.match(/(\d+)/);
        if (countMatch) p3 = parseInt(countMatch[1], 10);
      }
    }
    return { p1, p2, p3 };
  };

  const parsePriorityStats = (text: string) => {
    const былоRegex = /(?:Было|Before):([\s\S]*?)(?:Стало|After|$)/i;
    const сталоRegex = /(?:Стало|After):([\s\S]*)/i;

    const былоMatch = text.match(былоRegex);
    const сталоMatch = text.match(сталоRegex);

    const было = былоMatch ? parsePart(былоMatch[1]) : null;
    const стало = сталоMatch ? parsePart(сталоMatch[1]) : null;

    return { было, стало };
  };

  const { было, стало } = parsePriorityStats(statsText);

  // Render list from markdown lines
  const renderLines = (text: string) => {
    if (!text.trim()) return <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Нет данных</div>;
    return (
      <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
        {text.split('\n').map((line, idx) => {
          let cleanLine = line.trim();
          if (!cleanLine) return null;

          // Strip markers like *, -, •
          if (cleanLine.startsWith('*') || cleanLine.startsWith('-') || cleanLine.startsWith('•')) {
            cleanLine = cleanLine.substring(1).trim();
          }

          // Format bold tags within line
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
          
          return (
            <li key={idx} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '8px', 
              marginBottom: '8px',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              color: 'var(--text-secondary)'
            }}>
              <span style={{ 
                color: 'var(--primary)', 
                fontSize: '1rem', 
                lineHeight: 1, 
                marginTop: '1px' 
              }}>•</span>
              <span>
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
                  }
                  return part;
                })}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header and Copy Action */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCompare size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Сводный отчет изменений
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
              <span>Копировать отчет</span>
            </>
          )}
        </button>
      </div>

      {isParsedSuccessfully ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: Requirements changes */}
          <div style={{ 
            background: 'var(--bg-base)', 
            padding: '16px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <List size={16} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-primary)' }}>
                1. Сводка по изменениям в требованиях
              </h4>
            </div>
            {renderLines(requirementsChanges)}
          </div>

          {/* Section 2: Scenario changes */}
          <div style={{ 
            background: 'var(--bg-base)', 
            padding: '16px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Layers size={16} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-primary)' }}>
                2. Сводка изменений сценариев
              </h4>
            </div>
            {renderLines(scenariosChanges)}
          </div>

          {/* Section 3: Statistics */}
          {было && стало ? (
            <div style={{ 
              background: 'var(--bg-base)', 
              padding: '16px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-primary)' }}>
                  3. Сводка по количеству и приоритетам сценариев
                </h4>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                {/* Before (Было) */}
                <div style={{ 
                  background: 'var(--bg-surface)', 
                  padding: '12px 16px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    Было:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span className="badge badge-p1">1 приоритет</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{было.p1} кейса</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span className="badge badge-p2">2 приоритет</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{было.p2} кейса</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span className="badge badge-p3">3 приоритет</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{было.p3} кейса</span>
                    </div>
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <span>Всего:</span>
                      <span>{было.p1 + было.p2 + было.p3} кейсов</span>
                    </div>
                  </div>
                </div>

                {/* After (Стало) */}
                <div style={{ 
                  background: 'var(--bg-surface)', 
                  padding: '12px 16px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    Стало:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span className="badge badge-p1">1 приоритет</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{стало.p1} кейса</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span className="badge badge-p2">2 приоритет</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{стало.p2} кейса</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span className="badge badge-p3">3 приоритет</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{стало.p3} кейса</span>
                    </div>
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <span>Всего:</span>
                      <span>{стало.p1 + стало.p2 + стало.p3} кейсов</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div style={{ 
              background: 'var(--bg-base)', 
              padding: '16px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-primary)' }}>
                  3. Сводка по количеству и приоритетам сценариев
                </h4>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {statsText}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          lineHeight: 1.5, 
          color: 'var(--text-secondary)',
          fontSize: '0.85rem' 
        }}>
          {reportText}
        </div>
      )}

    </div>
  );
};
