import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Document, EmployeeUser, Toast, FinancialSimulationResult } from '../../types';
import * as dataService from '../../services/dataService';
import * as geminiService from '../../services/geminiService';
// FIX: Import the 'X' icon component.
import { Loader, Upload, AlertTriangle, FileText, CheckCircle, Clock, Sparkles, X } from '../Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
// FIX: Import formatJPY function to resolve 'not found' errors.
import { formatJPY } from '../../utils';

interface BusinessAnalysisPageProps {
  addToast: (message: string, type: Toast['type']) => void;
  isAIOff: boolean;
  currentUser: EmployeeUser | null;
}

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = error => reject(error);
  });
};

const BusinessAnalysisPage: React.FC<BusinessAnalysisPageProps> = ({ addToast, isAIOff, currentUser }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ analysis: string; suggestions: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setFiles(prev => [...prev, ...newFiles]);
  };
  
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files)); };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { handleFiles(Array.from(e.target.files || [])); e.target.value = ''; };

  const handleRunAnalysis = async () => {
    if (files.length === 0 || isAIOff) return;
    setIsLoading(true);
    setAnalysisResult(null);
    // FIX: Added currentUser check
    if (!currentUser) {
        addToast('ユーザー情報が見つかりません。', 'error');
        setIsLoading(false);
        return;
    }
    try {
        const fileData = await Promise.all(files.map(fileToBase64));
        // FIX: Passed currentUser.id as the second argument
        const result = await geminiService.getBusinessAnalysisAndSuggestions(fileData, currentUser.id);
        setAnalysisResult(result);
        addToast('統合分析が完了しました。', 'success');
        if (currentUser) {
            await dataService.addAIArtifact({
                kind: 'analysis',
                title: `経営分析レポート (${new Date().toLocaleDateString()})`,
                body_md: `## 分析サマリー\n${result.analysis}\n\n## 改善提案\n${result.suggestions.join('\n- ')}`,
                created_by: currentUser.id,
            });
            addToast('分析結果をAIドキュメントに保存しました。', 'success');
        }

    } catch (e) {
        addToast(e instanceof Error ? `統合分析に失敗: ${e.message}` : '統合分析エラー', 'error');
    } finally {
        setIsLoading(false);
    }
  };
  
  const Section: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
       <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 relative">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
            {title}
          </h3>
          {children}
      </div>
  );

  return (
    <div className="space-y-6">
      <Section title="1. 財務資料のアップロード">
        <div 
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
            onDrop={handleFileDrop}
            className={`relative p-8 border-2 border-dashed rounded-lg text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-slate-300 dark:border-slate-600'}`}
        >
            <input type="file" id="file-upload-dnd" multiple onChange={handleFileInput} className="hidden" accept="image/*,application/pdf" />
            <label htmlFor="file-upload-dnd" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-slate-400" />
                <p className="mt-2 font-semibold">ドラッグ＆ドロップで一括アップロード</p>
                <p className="text-sm text-slate-500">またはクリックしてファイルを選択 (複数可)</p>
            </label>
        </div>
        {files.length > 0 && (
            <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">アップロード済み資料 ({files.length}件)</h4>
                <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                   {files.map((file, index) => (
                       <li key={`${file.name}-${index}`} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between">
                           <div className="flex items-center gap-3">
                               <FileText className="w-5 h-5 text-slate-500"/>
                               <span className="font-medium text-sm">{file.name}</span>
                           </div>
                           <button onClick={() => setFiles(f => f.filter((_, i) => i !== index))} className="text-slate-400 hover:text-red-500">
                               <X className="w-4 h-4" />
                           </button>
                       </li>
                   ))}
                </ul>
            </div>
        )}
      </Section>
      
      <Section title="2. AI統合分析">
          <button onClick={handleRunAnalysis} disabled={isLoading || isAIOff || files.length === 0} className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
              {isLoading ? <Loader className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>} 
              {files.length}件の資料でAI統合分析を実行
          </button>
           {isAIOff && <p className="text-sm text-red-500 mt-2 text-center">AI機能は現在無効です。</p>}
          
          {isLoading && <div className="flex items-center justify-center gap-2 text-slate-500 p-4"><Loader className="w-5 h-5 animate-spin"/><span>統合分析中...</span></div>}
          
          {analysisResult && (
              <div className="space-y-4 mt-6">
                  <div>
                      <h4 className="font-semibold text-base mb-2">分析サマリー</h4>
                      <p className="text-sm whitespace-pre-wrap p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">{analysisResult.analysis}</p>
                  </div>
                  <div>
                      <h4 className="font-semibold text-base mb-2">改善提案</h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                          {analysisResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                  </div>
              </div>
          )}
      </Section>
    </div>
  );
};

export default BusinessAnalysisPage;