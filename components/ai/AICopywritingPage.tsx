import React, { useState } from 'react';
import { Loader, Sparkles, Upload, FileText, X } from '../Icons';
import * as geminiService from '../../services/geminiService';
import * as dataService from '../../services/dataService';
import { Toast, EmployeeUser } from '../../types';

interface AICopywritingPageProps {
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

const AICopywritingPage: React.FC<AICopywritingPageProps> = ({ addToast, isAIOff, currentUser }) => {
  const [characterCount, setCharacterCount] = useState(800);
  const [referenceText, setReferenceText] = useState('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [specFile, setSpecFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manuscript, setManuscript] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (isAIOff || !currentUser) {
      addToast('AI機能は現在無効です。', 'error');
      return;
    }
    setIsLoading(true);
    setManuscript(null);
    try {
      const refFileData = referenceFile ? await fileToBase64(referenceFile) : null;
      const specFileData = specFile ? await fileToBase64(specFile) : null;
      
      const artifact = await geminiService.generateManuscript(
        characterCount,
        referenceText,
        refFileData,
        specFileData,
        currentUser.id
      );

      setManuscript(artifact.body_md || '');
      await dataService.addAIArtifact(artifact);
      addToast('原稿が生成され、AIドキュメントに保存されました。', 'success');

    } catch (e) {
      addToast(e instanceof Error ? `原稿生成エラー: ${e.message}` : '不明なエラーが発生しました。', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const FileInput: React.FC<{
    label: string;
    file: File | null;
    setFile: (file: File | null) => void;
    accept: string;
    disabled: boolean;
  }> = ({ label, file, setFile, accept, disabled }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <label className={`relative inline-flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Upload className="w-4 h-4" />
          <span>ファイルを選択</span>
          <input type="file" className="sr-only" onChange={e => setFile(e.target.files?.[0] || null)} accept={accept} disabled={disabled} />
        </label>
        {file && (
          <div className="flex items-center gap-2 text-sm bg-slate-200 dark:bg-slate-600 py-1 px-2 rounded-md">
            <FileText className="w-4 h-4" />
            <span className="truncate max-w-xs">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} disabled={disabled} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold">AI 原稿作成</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="char-count" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">文字数 (約)</label>
            <input
              id="char-count"
              type="number"
              value={characterCount}
              onChange={e => setCharacterCount(Number(e.target.value))}
              className="w-full p-2 border rounded"
              disabled={isLoading || isAIOff}
            />
          </div>
        </div>

        <div>
          <label htmlFor="ref-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">参照テキスト (コピー＆ペースト)</label>
          <textarea
            id="ref-text"
            rows={5}
            value={referenceText}
            onChange={e => setReferenceText(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="参考にする文章やキーワードを貼り付け"
            disabled={isLoading || isAIOff}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileInput label="参照ファイル (TXT, MD等)" file={referenceFile} setFile={setReferenceFile} accept=".txt,.md,.html" disabled={isLoading || isAIOff} />
            <FileInput label="仕様書・指示書 (画像)" file={specFile} setFile={setSpecFile} accept="image/*" disabled={isLoading || isAIOff} />
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isLoading || isAIOff}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isLoading ? '生成中...' : '原稿を生成'}
        </button>
        {isAIOff && <p className="text-sm text-red-500 text-center">AI機能は現在無効です。</p>}
      </div>

      {(isLoading || manuscript) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2">生成された原稿</h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg whitespace-pre-wrap text-base prose prose-slate dark:prose-invert max-w-none">
              {manuscript}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AICopywritingPage;