import React, { useState } from 'react';
import { HelpCircle, ChevronRight, CornerDownLeft, Sparkles, ArrowLeft, Edit2, RotateCcw, MinusCircle } from 'lucide-react';
import { useDesign } from '../context/DesignContext';
import { Loader } from '../components/Loader';

export const Stage3Questions: React.FC = () => {
  const { 
    questions, 
    answers, 
    requirements,
    submitAnswer, 
    skipQuestion, 
    updateAnswer,
    resetAnswer,
    generateTestScenarios, 
    prevStage,
    loading 
  } = useDesign();

  const [activeAnswer, setActiveAnswer] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showReqTooltip, setShowReqTooltip] = useState(false);

  const currentQuestion = questions.length > 0 ? questions[0] : null;
  const relatedRequirement = currentQuestion ? requirements.find(r => r.id === currentQuestion.requirement_id) : null;

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuestion && activeAnswer.trim()) {
      submitAnswer(currentQuestion.id, activeAnswer.trim());
      setActiveAnswer('');
      setShowReqTooltip(false);
    }
  };

  const handleSkip = () => {
    if (currentQuestion) {
      skipQuestion(currentQuestion.id);
      setActiveAnswer('');
      setShowReqTooltip(false);
    }
  };

  const handleNotConsidered = () => {
    if (currentQuestion) {
      submitAnswer(currentQuestion.id, 'Не рассматривается в рамках требования');
      setActiveAnswer('');
      setShowReqTooltip(false);
    }
  };

  if (loading) {
    return <Loader message="Генерируем тест-сценарии..." />;
  }

  return (
    <div className="container animated-in" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '2px' }}>
          Этап 3: Уточняющие вопросы к требованиям
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Ответьте на вопросы, чтобы сделать тест-сценарии максимально точными.
        </p>
      </div>

      {currentQuestion ? (
        /* Active Question Card */
        <div className="glass-panel" style={{ padding: '20px', position: 'relative', marginBottom: '20px' }}>
          <div 
            onClick={() => setShowReqTooltip(!showReqTooltip)}
            onMouseEnter={() => setShowReqTooltip(true)}
            onMouseLeave={() => setShowReqTooltip(false)}
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: showReqTooltip ? 'var(--primary-glow)' : '#f1f5f9',
              padding: '6px 12px',
              borderRadius: '0 var(--radius-sm) 0 var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--primary)',
              fontWeight: 600,
              borderLeft: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 10
            }}
            title="Нажмите или наведите, чтобы прочесть требование полностью"
          >
            Связано с: {currentQuestion.requirement_id}
            
            {showReqTooltip && relatedRequirement && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  width: '340px',
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  zIndex: 100,
                  marginTop: '4px',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  fontWeight: 'normal',
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--primary)' }}>
                  {relatedRequirement.id}
                </div>
                {relatedRequirement.description}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px', marginTop: '8px' }}>
            <div style={{ color: 'var(--primary)', padding: '4px', background: 'var(--primary-glow)', borderRadius: '50%' }}>
              <HelpCircle size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Вопрос {answers.length + 1} из {questions.length + answers.length}
              </span>
              <h3 style={{ fontSize: '1.05rem', marginTop: '2px', lineHeight: 1.35, fontWeight: 650, color: 'var(--text-primary)' }}>
                {currentQuestion.question}
              </h3>
            </div>
          </div>

          <form onSubmit={handleAnswerSubmit}>
            <div className="form-group">
              <textarea
                className="form-textarea"
                value={activeAnswer}
                onChange={(e) => setActiveAnswer(e.target.value)}
                placeholder="Введите ваш ответ на вопрос..."
                style={{ minHeight: '80px', fontSize: '0.85rem' }}
                required
                autoFocus
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleSkip}
                style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                Пропустить
                <ChevronRight size={14} />
              </button>

              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleNotConsidered}
                style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                Не рассматривается
                <MinusCircle size={14} />
              </button>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!activeAnswer.trim()}
                style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                Ответить
                <CornerDownLeft size={14} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Queue Empty: Review Answers and Proceed */
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'left', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Сводка по ответам на вопросы:
          </h3>
          
          {answers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {answers.map((ans, idx) => {
                const isEditing = editingQuestionId === ans.question_id;
                return (
                  <div 
                    key={ans.question_id} 
                    style={{ 
                      padding: '16px', 
                      background: '#f8fafc', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 650, color: 'var(--primary)', lineHeight: 1.35 }}>
                      Вопрос {idx + 1}: {ans.question}
                    </div>
                    
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                          className="form-textarea"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          style={{ minHeight: '60px', fontSize: '0.85rem' }}
                          required
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setEditingQuestionId(null)}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', height: '30px' }}
                          >
                            Отмена
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              if (editText.trim()) {
                                updateAnswer(ans.question_id, editText.trim());
                                setEditingQuestionId(null);
                              }
                            }}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', height: '30px' }}
                          >
                            Сохранить
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div 
                          style={{ 
                            fontSize: '0.85rem', 
                            color: 'var(--text-secondary)', 
                            paddingLeft: '10px', 
                            borderLeft: '3px solid var(--border)',
                            lineHeight: 1.4
                          }}
                        >
                          {ans.answer}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => {
                              setEditingQuestionId(ans.question_id);
                              setEditText(ans.answer);
                            }}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit2 size={12} />
                            Изменить ответ
                          </button>
                          
                          <button 
                            className="btn btn-secondary"
                            onClick={() => resetAnswer(ans.question_id)}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)' }}
                          >
                            <RotateCcw size={12} />
                            Вернуть к вопросу
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Нет ответов на вопросы.
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <button className="btn btn-primary" onClick={generateTestScenarios} style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Начать тест-анализ
              <Sparkles size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button className="btn btn-secondary" onClick={prevStage} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <ArrowLeft size={14} />
          Назад к матрице
        </button>
      </div>

    </div>
  );
};
