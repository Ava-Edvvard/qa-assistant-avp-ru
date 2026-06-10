import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, Image as ImageIcon, FileText, ArrowRight } from 'lucide-react';
import { useDesign } from '../context/DesignContext';
import { Loader } from '../components/Loader';

export const Stage1Requirements: React.FC = () => {
  const { mode, parseRequirements, loading, error } = useDesign();
  
  const [reqText, setReqText] = useState('');
  const [addInfo, setAddInfo] = useState('');
  const [oldTcs, setOldTcs] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachedFiles([...attachedFiles, ...filesArray]);
    }
  };

  const removeFile = (idx: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqText.trim()) return;
    
    parseRequirements(reqText, addInfo, mode === 'existing' ? oldTcs : undefined, attachedFiles);
  };

  if (loading) {
    return <Loader message="Парсим требования и обрабатываем файлы..." />;
  }

  return (
    <div className="container animated-in">
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '4px', fontWeight: 700 }}>
          Этап 1: Ввод требований и файлов
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {mode === 'existing' 
            ? 'Введите новые требования, прикрепите файлы (Excel/изображения) и существующие тест-кейсы.'
            : 'Введите требования к продукту, дополнительную информацию и прикрепите файлы для анализа.'
          }
        </p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fce8e6', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', marginBottom: '16px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Main Requirements Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="reqs-input">Основные требования к системе *</label>
          <textarea
            id="reqs-input"
            className="form-textarea"
            placeholder="Пример: Пользователь должен иметь возможность авторизоваться в системе. Пароль должен быть не менее 8 символов..."
            value={reqText}
            onChange={(e) => setReqText(e.target.value)}
            style={{ minHeight: '100px', fontSize: '0.85rem' }}
            required
          />
        </div>

        {/* Additional Info Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="info-input">Дополнительная информация (необязательно)</label>
          <textarea
            id="info-input"
            className="form-textarea"
            placeholder="Пример: Требования актуальны только для пользователя admin"
            value={addInfo}
            onChange={(e) => setAddInfo(e.target.value)}
            style={{ minHeight: '60px', fontSize: '0.85rem' }}
          />
        </div>

        {/* Conditional Old Test Cases Field for Existing Design Mode */}
        {mode === 'existing' && (
          <div className="form-group">
            <label className="form-label" htmlFor="tcs-input">Существующие тест-сценарии (Которые уже созданы) *</label>
            <textarea
              id="tcs-input"
              className="form-textarea"
              placeholder="Пример:&#13;TC-001: Тестовый сценарий открытие главной страницы - П1&#13;Предусловия:&#13;- Есть доступ к продукту&#13;Шаги:&#13;1. Открыть браузер..."
              value={oldTcs}
              onChange={(e) => setOldTcs(e.target.value)}
              style={{ minHeight: '100px', fontSize: '0.85rem' }}
              required
            />
          </div>
        )}

        {/* File Upload Zone */}
        <div className="form-group">
          <label className="form-label">Прикрепить файлы (Excel таблицы / Макеты макетов)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '1.5px dashed var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: '#f8fafc',
              transition: 'all var(--transition-normal)'
            }}
          >
            <Upload size={22} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2px', fontWeight: 500 }}>
              Нажмите для выбора файлов
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Поддерживаются .xlsx, .xls, .png, .jpg
            </p>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
              accept=".xlsx,.xls,.png,.jpg,.jpeg,.webp"
            />
          </div>

          {/* Files List */}
          {attachedFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {attachedFiles.map((file, idx) => {
                const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
                const isImage = file.name.match(/\.(jpg|jpeg|png|webp)$/i);
                
                return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isExcel && <FileSpreadsheet size={14} style={{ color: '#10b981' }} />}
                      {isImage && <ImageIcon size={14} style={{ color: '#ec4899' }} />}
                      {!isExcel && !isImage && <FileText size={14} style={{ color: '#3b82f6' }} />}
                      <span style={{ fontSize: '0.8rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFile(idx)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!reqText.trim() || (mode === 'existing' && !oldTcs.trim())}
          style={{ width: '100%', padding: '10px', marginTop: '4px' }}
        >
          Далее
          <ArrowRight size={14} />
        </button>

      </form>
    </div>
  );
};
