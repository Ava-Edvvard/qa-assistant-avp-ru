import React from 'react';
import { RotateCcw, Table, ArrowLeft, Download } from 'lucide-react';
import { useDesign } from '../context/DesignContext';
import { DiffReportViewer } from '../components/DiffReportViewer';
import { ScenariosViewer } from '../components/ScenariosViewer';

export const StageOutput: React.FC = () => {
  const { 
    requirements, 
    scenarios, 
    comparisonReport, 
    mode, 
    resetSession,
    prevStage 
  } = useDesign();

  const escapeCSV = (text: string) => {
    if (text == null) return '';
    const stringified = String(text);
    if (stringified.includes(';') || stringified.includes('"') || stringified.includes('\n') || stringified.includes('\r')) {
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
  };

  const handleExportCSV = () => {
    const headers = ['№', 'Требование', ...scenarios.map(sc => sc.id), 'Всего покрывающих кейсов'];
    const csvRows = [headers.map(escapeCSV).join(';')];

    requirements.forEach(req => {
      let coverCount = 0;
      const row = [
        req.id,
        req.description,
        ...scenarios.map(sc => {
          const isCovered = sc.coverage.includes(req.id);
          if (isCovered) coverCount++;
          return isCovered ? '+' : '-';
        }),
        coverCount.toString()
      ];
      csvRows.push(row.map(escapeCSV).join(';'));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `traceability_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container animated-in">
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '2px' }}>
            Результаты тест-анализа
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Матрица трассируемости и тест-сценарии сгенерированы.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={resetSession} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <RotateCcw size={14} />
          Начать заново
        </button>
      </div>

      {/* 1. Traceability Matrix Grid */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={16} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Матрица трассируемости</h3>
          </div>
          <button className="btn btn-secondary" onClick={handleExportCSV} style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Download size={14} />
            Экспорт в .CSV
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="matrix-table" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>№</th>
                <th>Требование</th>
                {scenarios.map((sc) => (
                  <th key={sc.id} style={{ width: '70px', textAlign: 'center' }} title={sc.name}>
                    {sc.id}
                  </th>
                ))}
                <th style={{ width: '180px', textAlign: 'center' }}>Всего покрывающих кейсов</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req) => {
                let coverCount = 0;
                return (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{req.id}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{req.description}</td>
                    {scenarios.map((sc) => {
                      const isCovered = sc.coverage.includes(req.id);
                      if (isCovered) coverCount++;
                      return (
                        <td key={sc.id} style={{ textAlign: 'center', fontWeight: 700 }}>
                          {isCovered ? (
                            <span style={{ color: 'var(--success)' }}>+</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`coverage-badge ${coverCount > 0 ? 'has-cover' : 'no-cover'}`}>
                        {coverCount}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Visual Test Scenarios with Markdown Copy Capability */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <ScenariosViewer scenarios={scenarios} requirements={requirements} />
      </div>

      {/* 3. Diff Summary (Only in Existing Design mode) */}
      {mode === 'existing' && comparisonReport && (
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
          <DiffReportViewer reportText={comparisonReport} />
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button className="btn btn-secondary" onClick={prevStage} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <ArrowLeft size={14} />
          Назад к редактированию
        </button>
      </div>

    </div>
  );
};
