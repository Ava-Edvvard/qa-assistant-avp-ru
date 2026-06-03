import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = 'Обработка запроса...' }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isRateLimitPossible = seconds >= 4;

  return (
    <div 
      className="glass-panel animated-in" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        margin: '20px 0',
        minHeight: '180px',
        textAlign: 'center'
      }}
    >
      <div 
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite',
          marginBottom: '14px'
        }}
      />
      <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '1rem', fontWeight: 700 }}>{message}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
        Пожалуйста, подождите, идет обмен данными с сервером ИИ... (Время ожидания: {seconds}с)
      </p>

      {isRateLimitPossible && (
        <div 
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '520px',
            animation: 'fadeIn 0.2s ease-out forwards'
          }}
        >
          <Clock size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <span style={{ color: 'var(--warning)', fontSize: '0.75rem', textAlign: 'left', lineHeight: 1.35 }}>
            <strong>Возможно, сработал лимит частоты запросов ИИ (макс. 3 в минуту).</strong> Сервер автоматически отложит выполнение и возобновит работу через несколько секунд.
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
