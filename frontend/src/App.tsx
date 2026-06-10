import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, AlertCircle, RefreshCw } from 'lucide-react';
import { DesignProvider, useDesign } from './context/DesignContext';
import { Header } from './components/Header';
import { Dashboard } from './views/Dashboard';
import { StepProgress } from './components/StepProgress';
import { Stage1Requirements } from './views/Stage1Requirements';
import { Stage2TraceMatrix } from './views/Stage2TraceMatrix';
import { Stage3Questions } from './views/Stage3Questions';
import { Stage4TestScenarios } from './views/Stage4TestScenarios';
import { Stage5Comparison } from './views/Stage5Comparison';
import { StageOutput } from './views/StageOutput';

const defaultModels: Record<string, string[]> = {
  custom: []
};

const MainLayout: React.FC = () => {
  const { 
    mode, 
    currentStage, 
    activeLlmName, 
    isFallbackMock, 
    fallbackError,
    llmProvider,
    llmApiKey,
    llmBaseUrl,
    llmModel,
    setLlmProvider,
    setLlmApiKey,
    setLlmBaseUrl,
    setLlmModel,
    fetchModels,
    clearFallbackMock
  } = useDesign();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [localProvider, setLocalProvider] = useState(llmProvider);
  const [localApiKey, setLocalApiKey] = useState(llmApiKey);
  const [localBaseUrl, setLocalBaseUrl] = useState(llmBaseUrl);
  const [localModel, setLocalModel] = useState(llmModel);

  const [localModelsList, setLocalModelsList] = useState<string[]>([]);
  const [localModelsLoading, setLocalModelsLoading] = useState(false);
  const [localModelsError, setLocalModelsError] = useState<string | null>(null);

  const handleOpenSettings = () => {
    setLocalProvider(llmProvider);
    setLocalApiKey(llmApiKey);
    setLocalBaseUrl(llmBaseUrl);
    setLocalModel(llmModel);
    setLocalModelsList([]);
    setLocalModelsError(null);
    setShowSettingsModal(true);
  };

  const handleLoadLocalModels = async () => {
    setLocalModelsLoading(true);
    setLocalModelsError(null);
    try {
      const list = await fetchModels(localProvider, localApiKey, localBaseUrl);
      setLocalModelsList(list);
      if (list.length > 0) {
        if (!list.includes(localModel)) {
          setLocalModel(list[0]);
        }
      } else {
        setLocalModelsError('Список моделей недоступен — введите название модели вручную.');
      }
    } catch (err: any) {
      setLocalModelsError(err.message || 'Не удалось загрузить список моделей.');
    } finally {
      setLocalModelsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    setLlmProvider(localProvider);
    setLlmApiKey(localApiKey);
    setLlmBaseUrl(localBaseUrl);
    setLlmModel(localModel);
    clearFallbackMock();
    setShowSettingsModal(false);
  };

  const mergedLocalModels = localModelsList.length > 0 ? localModelsList : (defaultModels[localProvider] || []);

  // Define steps titles based on mode
  const newDesignStages = [
    'Ввод требований',
    'Матрица требований',
    'Вопросы ИИ',
    'Генерация сценариев',
    'Результаты'
  ];

  const existingDesignStages = [
    'Ввод требований',
    'Матрица требований',
    'Вопросы ИИ',
    'Генерация сценариев',
    'Сравнение',
    'Результаты'
  ];

  const activeStages = mode === 'existing' ? existingDesignStages : newDesignStages;

  // Render correct view according to the active stage
  const renderStageView = () => {
    switch (currentStage) {
      case 1:
        return <Stage1Requirements />;
      case 2:
        return <Stage2TraceMatrix />;
      case 3:
        return <Stage3Questions />;
      case 4:
        return <Stage4TestScenarios />;
      case 5:
        return mode === 'existing' ? <Stage5Comparison /> : <StageOutput />;
      case 6:
        return mode === 'existing' ? <StageOutput /> : null;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div>
      <Header />
      
      <main style={{ paddingBottom: '80px' }}>
        {mode === null ? (
          <Dashboard />
        ) : (
          <div className="container animated-in">
            <StepProgress stages={activeStages} currentStage={currentStage} />
            
            <div 
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px',
                marginTop: '-10px'
              }}
            >
              <span 
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span 
                  style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    backgroundColor: isFallbackMock 
                      ? 'var(--danger)' 
                      : (activeLlmName.includes('Mock') ? 'var(--warning)' : 'var(--success)'),
                    display: 'inline-block' 
                  }}
                ></span>
                Модель: <strong>{activeLlmName}</strong>
                <button
                  onClick={handleOpenSettings}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: '0 0 0 6px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s ease'
                  }}
                  title="Изменить настройки ИИ"
                >
                  <Settings size={12} />
                </button>
              </span>
            </div>

            {/* Global fallback mock error notice */}
            {isFallbackMock && fallbackError && (
              <div 
                style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger)',
                  marginBottom: '20px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm)',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--danger)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}>
                  !
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>
                    <strong>Аварийное переключение:</strong> Запрос к ИИ завершился ошибкой ({fallbackError}). 
                    Система переключилась на локальные мок-данные.
                  </span>
                  <button
                    onClick={handleOpenSettings}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--primary)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 650
                    }}
                  >
                    Настроить ИИ
                  </button>
                </div>
              </div>
            )}

            {renderStageView()}
          </div>
        )}
      </main>

      {/* Dynamic LLM Settings Modal */}
      {showSettingsModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Settings size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Настройки нейросети (LLM)</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Провайдер ИИ</label>
                <select 
                  className="form-select"
                  value={localProvider}
                  onChange={(e) => {
                    setLocalProvider(e.target.value);
                    setLocalModel('');
                    setLocalModelsList([]);
                  }}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="custom">Kaspersky</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">API-ключ</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="password"
                    className="form-input"
                    placeholder={llmApiKey ? "•••••••••••••••• (Сохранен)" : "Введите API-ключ"}
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    style={{ fontSize: '0.85rem', flex: 1 }}
                  />
                  <a 
                    href="https://confluence.kaspersky.com/spaces/LS/pages/1577822276/%F0%9F%A4%96%D0%A0%D0%B0%D0%B1%D0%BE%D1%82%D0%B0+%D1%87%D0%B5%D1%80%D0%B5%D0%B7+API"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '6px 12px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', height: '38px' }}
                  >
                    Перейти к API
                  </a>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Base URL (Адрес API Kaspersky)</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Пример: https://llm.kaspersky-labs.com/v1/"
                  value={localBaseUrl}
                  onChange={(e) => setLocalBaseUrl(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label">Выбор модели</label>
                    {localProvider === 'custom' && localModelsList.length === 0 ? (
                      <input 
                        type="text"
                        className="form-input"
                        placeholder="Название модели, например: llama-3"
                        value={localModel}
                        onChange={(e) => setLocalModel(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      />
                    ) : (
                      <select
                        className="form-select"
                        value={localModel}
                        onChange={(e) => setLocalModel(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      >
                        {mergedLocalModels.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <button 
                    className="btn btn-secondary"
                    onClick={handleLoadLocalModels}
                    disabled={localModelsLoading || !localApiKey.trim()}
                    style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    <RefreshCw size={14} className={localModelsLoading ? "spin" : ""} />
                    {localModelsLoading ? 'Загрузка...' : 'Загрузить модели'}
                  </button>
                </div>

                {localModelsError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: localModelsError.includes('недоступен') ? '#856404' : 'var(--danger)',
                    fontSize: '0.75rem',
                    marginTop: '4px'
                  }}>
                    <AlertCircle size={14} />
                    <span>{localModelsError}</span>
                  </div>
                )}
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowSettingsModal(false)}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Отмена
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSaveSettings}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Применить
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DesignProvider>
      <MainLayout />
    </DesignProvider>
  );
};

export default App;
