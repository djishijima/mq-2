import React, { useMemo, useState } from 'react';
import { UserActivityLog } from '../../types';
import { Archive, Clock, Sparkles } from '../Icons';
import { formatDateTime } from '../../utils';
import EmptyState from '../ui/EmptyState';

interface AuditLogPageProps {
  logs: UserActivityLog[];
}

const AuditLogPage: React.FC<AuditLogPageProps> = ({ logs }) => {
  const [filter, setFilter] = useState<'all' | 'ai'>('all');

  const filteredLogs = useMemo(() => {
    if (filter === 'ai') {
      return logs.filter(log => log.action.startsWith('ai_'));
    }
    return logs;
  }, [logs, filter]);

  const logsByDate = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      const date = new Date(log.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {} as Record<string, UserActivityLog[]>);
  }, [filteredLogs]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">マイ アクティビティログ</h2>
                <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                    あなたのシステム内での操作履歴がここに表示されます。
                </p>
            </div>
            <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-md text-sm font-semibold ${filter === 'all' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>すべて</button>
                <button onClick={() => setFilter('ai')} className={`px-3 py-1 rounded-md text-sm font-semibold ${filter === 'ai' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>AI利用履歴</button>
            </div>
        </div>
      </div>
      
      {filteredLogs.length === 0 ? (
        <EmptyState 
            icon={Archive}
            title="アクティビティがありません"
            message="システムを操作すると、その履歴がここに記録されます。"
        />
      ) : (
        <div className="p-6 space-y-8">
          {Object.entries(logsByDate).map(([date, dateLogs]) => (
            <div key={date}>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 pb-2 border-b-2 border-slate-200 dark:border-slate-700 mb-4">{date}</h3>
              <ul className="space-y-4">
                {dateLogs.map(log => (
                  <li key={log.id} className="flex items-start gap-4">
                    <div className="w-20 text-sm text-slate-500 dark:text-slate-400 flex-shrink-0 pt-1">{new Date(log.created_at).toLocaleTimeString('ja-JP')}</div>
                    <div className="relative w-full pl-6 border-l border-slate-200 dark:border-slate-700">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${log.action.startsWith('ai_') ? 'bg-purple-500' : 'bg-blue-500'} border-2 border-white dark:border-slate-800`}></div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{log.action}</p>
                        {log.details && (
                           <pre className="mt-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md whitespace-pre-wrap font-mono">
                                <code>
                                    {/* FIX: Add a type check for `log.details` before stringifying to prevent potential runtime errors with non-object types. */}
                                    {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                                </code>
                           </pre>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;