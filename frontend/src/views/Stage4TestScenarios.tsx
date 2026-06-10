import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, ArrowRight, ArrowLeft } from 'lucide-react';
import { useDesign, TestScenario } from '../context/DesignContext';
import { Loader } from '../components/Loader';

export const Stage4TestScenarios: React.FC = () => {
  const { 
    scenarios, 
    requirements, 
    addScenario, 
    editScenario, 
    deleteScenario, 
    nextStage, 
    prevStage,
    compareTestScenarios,
    mode,
    loading,
    error 
  } = useDesign();

  // Accordion state
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<TestScenario | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPriority, setFormPriority] = useState('П2');
  const [formPreconditions, setFormPreconditions] = useState('');
  const [formSteps, setFormSteps] = useState('');
  const [formExpectedResults, setFormExpectedResults] = useState('');
  const [formCoverage, setFormCoverage] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(x => x !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  const handleOpenAdd = () => {
    setEditingScenario(null);
    setFormName('');
    setFormPriority('П2');
    setFormPreconditions('');
    setFormSteps('');
    setFormExpectedResults('');
    setFormCoverage([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sc: TestScenario, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion toggling
    setEditingScenario(sc);
    setFormName(sc.name);
    setFormPriority(sc.priority);
    setFormPreconditions(sc.preconditions.join('\n'));
    setFormSteps(sc.steps.join('\n'));
    setFormExpectedResults(sc.expected_results.join('\n'));
    setFormCoverage(sc.coverage);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion toggling
    if (confirm('Вы уверены, что хотите удалить этот тест-сценарий?')) {
      deleteScenario(id);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const preconditions = formPreconditions.split('\n').map(x => x.trim()).filter(Boolean);
    const steps = formSteps.split('\n').map(x => x.trim()).filter(Boolean);
    const expected_results = formExpectedResults.split('\n').map(x => x.trim()).filter(Boolean);
    
    if (editingScenario) {
      // Edit
      editScenario(editingScenario.id, {
        name: formName,
        priority: formPriority,
        preconditions,
        steps,
        expected_results,
        coverage: formCoverage
      });
    } else {
      // Add
      const nextNum = scenarios.length + 1;
      const newId = `TC-${nextNum < 10 ? '00' + nextNum : nextNum < 100 ? '0' + nextNum : nextNum}`;
      
      const newSc: TestScenario = {
        id: newId,
        name: formName,
        priority: formPriority,
        preconditions,
        steps,
        expected_results,
        coverage: formCoverage
      };
      addScenario(newSc);
    }
    
    setIsModalOpen(false);
  };

  const handleCheckboxChange = (reqId: string) => {
    if (formCoverage.includes(reqId)) {
      setFormCoverage(formCoverage.filter(x => x !== reqId));
    } else {
      setFormCoverage([...formCoverage, reqId]);
    }
  };

  const handleNextTransition = () => {
    if (mode === 'existing') {
      compareTestScenarios();
    } else {
      nextStage();
    }
  };

  if (loading) {
    return <Loader message="Анализируем изменения и составляем отчет..." />;
  }

  return (
    <div className="container animated-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '2px' }}>
            Этап 4: Генерация и редактирование тест-сценариев
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Редактируйте или удаляйте сгенерированные сценарии перед выводом результатов.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <Plus size={14} />
          Создать тест-сценарий
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fce8e6', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', marginBottom: '16px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Scenarios Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {scenarios.length === 0 ? (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Нет созданных тест-сценариев. Нажмите кнопку сверху, чтобы добавить вручную.
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', minWidth: '50px' }}>{sc.id}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{sc.name}</span>
                    
                    <span className={`badge badge-${sc.priority.toLowerCase()}`}>
                      {sc.priority}
                    </span>
                    
                    {sc.coverage.length > 0 && (
                      <div style={{ display: 'flex', gap: '3px', marginLeft: '6px' }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      className="btn-icon" 
                      onClick={(e) => handleOpenEdit(sc, e)}
                      title="Редактировать"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={(e) => handleDelete(sc.id, e)}
                      title="Удалить"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} />
                    </button>
                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div style={{ 
                    padding: '10px 16px 14px 16px', 
                    borderTop: '1px solid var(--border)', 
                    background: '#fafafa',
                    borderBottomLeftRadius: 'var(--radius-md)',
                    borderBottomRightRadius: 'var(--radius-md)'
                  }}>
                    
                    {/* Preconditions */}
                    <div style={{ marginTop: '8px' }}>
                      <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                        Предусловия
                      </h4>
                      {sc.preconditions.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нет предусловий</p>
                      ) : (
                        <ul style={{ paddingLeft: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {sc.preconditions.map((p, idx) => (
                            <li key={idx} style={{ marginBottom: '2px' }}>{p}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Steps & Expected Results grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                          Шаги
                        </h4>
                        <ol style={{ paddingLeft: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {sc.steps.map((step, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      
                      <div>
                        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                          Ожидаемый результат
                        </h4>
                        <ol style={{ paddingLeft: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {sc.expected_results.map((res, idx) => (
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

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={prevStage} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <ArrowLeft size={14} />
          Назад к вопросам
        </button>
        <button className="btn btn-primary" onClick={handleNextTransition} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          Далее
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '14px', fontSize: '1.1rem', fontWeight: 700 }}>
              {editingScenario ? `Редактировать сценарий ${editingScenario.id}` : 'Создать новый тест-сценарий'}
            </h3>
            
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Название сценария *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Например: Открытие формы авторизации"
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                    required
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Приоритет</label>
                  <select
                    className="form-select"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  >
                    <option value="П1">П1 - Высокий</option>
                    <option value="П2">П2 - Средний</option>
                    <option value="П3">П3 - Низкий</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Предусловия (каждое с новой строки)</label>
                <textarea
                  className="form-textarea"
                  value={formPreconditions}
                  onChange={(e) => setFormPreconditions(e.target.value)}
                  placeholder="Пользователь находится на главной странице"
                  style={{ minHeight: '50px', fontSize: '0.85rem', padding: '6px 10px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Шаги (каждый с новой строки) *</label>
                  <textarea
                    className="form-textarea"
                    value={formSteps}
                    onChange={(e) => setFormSteps(e.target.value)}
                    placeholder="Открыть браузер"
                    style={{ minHeight: '80px', fontSize: '0.85rem', padding: '6px 10px' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ожидаемые результаты (каждый с новой строки) *</label>
                  <textarea
                    className="form-textarea"
                    value={formExpectedResults}
                    onChange={(e) => setFormExpectedResults(e.target.value)}
                    placeholder="Браузер успешно запущен"
                    style={{ minHeight: '80px', fontSize: '0.85rem', padding: '6px 10px' }}
                    required
                  />
                </div>
              </div>

              {/* Requirement Coverage Checkboxes */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Покрытие требований</label>
                <div 
                  style={{ 
                    maxHeight: '180px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border)', 
                    padding: '8px', 
                    borderRadius: 'var(--radius-sm)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '8px',
                    background: '#f8fafc'
                  }}
                >
                  {requirements.map((req) => (
                    <label 
                      key={req.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        gap: '8px', 
                        fontSize: '0.8rem', 
                        cursor: 'pointer',
                        color: formCoverage.includes(req.id) ? 'var(--text-primary)' : 'var(--text-muted)',
                        padding: '6px 8px',
                        background: formCoverage.includes(req.id) ? '#ffffff' : 'transparent',
                        border: '1px solid',
                        borderColor: formCoverage.includes(req.id) ? 'var(--border)' : 'transparent',
                        borderRadius: '4px',
                        transition: 'all 0.15s ease-in-out'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formCoverage.includes(req.id)}
                        onChange={() => handleCheckboxChange(req.id)}
                        style={{ cursor: 'pointer', marginTop: '3px' }}
                      />
                      <span style={{ lineHeight: '1.4' }}>
                        <strong>{req.id}</strong>: {req.description}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  {editingScenario ? 'Сохранить' : 'Создать'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
