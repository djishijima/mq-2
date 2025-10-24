import React, { useState } from 'react';
import { Loader, Sparkles, Upload } from '../Icons';
import * as geminiService from '../../services/geminiService';
import * as dataService from '../../services/dataService'; // FIX: Imported dataService
import { Toast, EmployeeUser } from '../../types';

const VideoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 8-6 4 6 4V8Z"></path><rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect></svg>
);

interface AIVideoAnalysisPageProps {
  addToast: (message: string, type: Toast['type']) => void;
  isAIOff: boolean;
  currentUser: EmployeeUser | null;
}

const AIVideoAnalysisPage: React.FC<AIVideoAnalysisPageProps> = ({ addToast, isAIOff, currentUser }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('この動画の要点をまとめてください。');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        addToast('動画ファイルを選択してください。', 'error');
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (isAIOff) {
      addToast('AI機能は現在無効です。', 'error');
      return;
    }
    if (!videoFile || !prompt.trim()) {
      addToast('動画ファイルを選択し、質問を入力してください。', 'info');
      return;
    }
    // FIX: Added currentUser check
    if (!currentUser) {
        addToast('ユーザー情報が見つかりません。', 'error');
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      // FIX: Pass currentUser.id as the third argument
      const result = await geminiService.analyzeVideo(videoFile, prompt, currentUser.id);
      // FIX: Set only the text property of the result object
      setAnalysisResult(result.text);
      // FIX: Save artifact
      await dataService.addAIArtifact(result.artifactData);
      addToast('動画の分析が完了し、AIドキュメントに保存されました。', 'success');
    } catch (e) {
      addToast(e instanceof Error ? `動画分析エラー: ${e.message}` : '不明なエラーが発生しました。', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><VideoIcon /> AI 動画分析</h2>
        
        {videoUrl ? (
            <video src={videoUrl} controls className="w-full rounded-lg" />
        ) : (
            <label htmlFor="video-upload" className="block w-full cursor-pointer">
                <div className="p-8 border-2 border-dashed rounded-lg text-center hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <Upload className="w-12 h-12 mx-auto text-slate-400" />
                    <p className="mt-2 font-semibold">クリックして動画をアップロード</p>
                </div>
            </label>
        )}
        <input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} className="hidden" />

        <div>
          <label htmlFor="video-prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            動画に関する質問
          </label>
          <textarea
            id="video-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 focus:ring-blue-500"
            disabled={isLoading || isAIOff}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isLoading || isAIOff || !videoFile || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isLoading ? '分析中...' : '動画を分析'}
        </button>
        {isAIOff && <p className="text-sm text-red-500 text-center">AI機能は現在無効です。</p>}
      </div>
      {(isLoading || analysisResult) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2">分析結果</h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg whitespace-pre-wrap text-base">
              {analysisResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIVideoAnalysisPage;