import React, { useState, useEffect } from 'react';
import { FilePlus, FileEdit, Settings, RefreshCw, AlertCircle, Mail } from 'lucide-react';
import { useDesign } from '../context/DesignContext';

const defaultModels: Record<string, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  custom: []
};

export const Dashboard: React.FC = () => {
  const { 
    startNewDesign, 
    startExistingDesign,
    llmProvider,
    llmApiKey,
    llmBaseUrl,
    llmModel,
    setLlmProvider,
    setLlmApiKey,
    setLlmBaseUrl,
    setLlmModel,
    fetchModels
  } = useDesign();

  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState<boolean>(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const handleLoadModels = async () => {
    if (!llmApiKey.trim()) {
      setModelsError('Введите API-ключ для загрузки списка моделей');
      return;
    }
    setModelsLoading(true);
    setModelsError(null);
    try {
      const list = await fetchModels(llmProvider, llmApiKey, llmBaseUrl);
      setModels(list);
      if (list.length > 0) {
        // Automatically select the first model if current is not in the list
        if (!list.includes(llmModel)) {
          setLlmModel(list[0]);
        }
      } else {
        setModelsError('Список моделей недоступен — введите название модели вручную.');
      }
    } catch (err: any) {
      setModelsError(err.message || 'Не удалось загрузить список моделей. Проверьте правильность ключа и URL.');
    } finally {
      setModelsLoading(false);
    }
  };

  // Load models on mount if API key is present
  useEffect(() => {
    if (llmApiKey.trim()) {
      handleLoadModels();
    }
  }, []);

  const mergedModels = models.length > 0 ? models : (defaultModels[llmProvider] || []);

  return (
    <div 
      className="container animated-in" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'space-between', 
        minHeight: '80vh',
        padding: '20px 16px',
        gap: '30px'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          gap: '24px'
        }}
      >
        <h1 
          style={{ 
            fontSize: '1.6rem', 
            fontFamily: 'var(--font-display)', 
            fontWeight: 700, 
            color: 'var(--primary)', 
            textAlign: 'center',
            marginBottom: '4px'
          }}
        >
          Выберите режим проработки тест-дизайна
        </h1>

        {/* LLM Configuration Panel */}
        <div 
          className="glass-panel"
          style={{
            maxWidth: '700px',
            width: '100%',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Settings size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 650, fontSize: '0.95rem' }}>Настройка нейросети (LLM)</span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.4, marginTop: '-8px' }}>
            Если API-ключ не указан, бэкенд использует настройки из файла `.env` сервера. Если на сервере отсутствуют ключи, приложение запустится в Mock-режиме (на умных локальных заглушках).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Провайдер ИИ</label>
              <select 
                className="form-select"
                value={llmProvider}
                onChange={(e) => {
                  setLlmProvider(e.target.value);
                  setModels([]); // Reset models list when provider changes
                  setLlmModel('');
                }}
              >
                <option value="openai">OpenAI (официальный)</option>
                <option value="gemini">Google Gemini (OpenAI layer)</option>
                <option value="custom">Кастомный (OpenAI-совместимый)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">API-ключ</label>
              <input 
                type="password"
                className="form-input"
                placeholder={llmApiKey ? "••••••••••••••••" : "Введите API-ключ (необязательно)"}
                value={llmApiKey}
                onChange={(e) => setLlmApiKey(e.target.value)}
              />
            </div>
          </div>

          {/* Conditional Fields for Custom Provider */}
          {llmProvider === 'custom' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Base URL (Адрес API кастомного сервиса)</label>
              <input 
                type="text"
                className="form-input"
                placeholder="Пример: https://api.proxy.com/v1"
                value={llmBaseUrl}
                onChange={(e) => setLlmBaseUrl(e.target.value)}
              />
            </div>
          )}

          {/* Model selection & dynamic loading */}
          {llmApiKey.trim().length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Выбор модели</label>
                  {llmProvider === 'custom' && models.length === 0 ? (
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Название модели, например: llama-3"
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                    />
                  ) : (
                    <select
                      className="form-select"
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                    >
                      {mergedModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>

                <button 
                  className="btn btn-secondary"
                  onClick={handleLoadModels}
                  disabled={modelsLoading}
                  style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <RefreshCw size={14} className={modelsLoading ? "spin" : ""} />
                  {modelsLoading ? 'Загрузка...' : 'Загрузить модели'}
                </button>
              </div>

              {modelsError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: modelsError.includes('недоступен') ? '#856404' : 'var(--danger)',
                  fontSize: '0.75rem',
                  marginTop: '4px'
                }}>
                  <AlertCircle size={14} />
                  <span>{modelsError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mode cards */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '700px',
            width: '100%',
            margin: '0 auto'
          }}
        >
          {/* Mode 1: New Test Design */}
          <div 
            className="glass-panel" 
            onClick={startNewDesign}
            style={{
              padding: '20px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(28, 100, 242, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                border: '1px solid rgba(28, 100, 242, 0.1)'
              }}
            >
              <FilePlus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: 650, color: 'var(--text-primary)' }}>Новый тест-дизайн</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                Разработка тест-плана полностью с нуля. Загрузите требования, сформируйте требования в виде матрицы, уточните нестыковки с ИИ и получите готовые тест-кейсы.
              </p>
            </div>
            
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
              Запустить (5 этапов) →
            </div>
          </div>

          {/* Mode 2: Existing Test Design */}
          <div 
            className="glass-panel" 
            onClick={startExistingDesign}
            style={{
              padding: '20px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(71, 85, 105, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                border: '1px solid rgba(71, 85, 105, 0.1)'
              }}
            >
              <FileEdit size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: 650, color: 'var(--text-primary)' }}>Доработка существующего</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                Загрузите новые требования вместе со старыми тест-кейсами. ИИ проведет анализ обновлений, сгенерирует новые тест-кейсы и покажет сводку различий (diff report).
              </p>
            </div>
            
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
              Запустить (6 этапов) →
            </div>
          </div>
        </div>
      </div>

      {/* Footer with email contact */}
      <footer 
        style={{ 
          marginTop: 'auto', 
          paddingTop: '30px', 
          paddingBottom: '10px', 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)', 
          textAlign: 'center',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          borderTop: '1px solid var(--border)'
        }}
      >
        <Mail size={12} style={{ color: 'var(--text-muted)' }} />
        <span>По вопросам и рекомендациям писать:</span>
        <a 
          href="mailto:eduard.avagimov@kaspersky.com" 
          style={{ 
            color: 'var(--primary)', 
            textDecoration: 'none', 
            fontWeight: 500 
          }}
        >
          eduard.avagimov@kaspersky.com
        </a>
      </footer>
    </div>
  );
};
