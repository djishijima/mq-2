import React, { useState, useEffect } from 'react';
import { Loader, Sparkles } from '../Icons';
import * as geminiService from '../../services/geminiService';
import * as dataService from '../../services/dataService'; // FIX: Imported dataService
import { Toast, EmployeeUser } from '../../types';

interface AIVideoGenerationPageProps {
  addToast: (message: string, type: Toast['type']) => void;
  isAIOff: boolean;
  currentUser: EmployeeUser | null;
}

const AIVideoGenerationPage: React.FC<AIVideoGenerationPageProps> = ({ addToast, isAIOff, currentUser }) => {
  const [prompt, setPrompt] = useState('A majestic lion roaring on a cliff at sunset');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [apiKeySelected, setApiKeySelected] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeySelected(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success and let the user proceed.
      setApiKeySelected(true);
    }
  };

  const handleGenerate = async () => {
    if (isAIOff || !apiKeySelected) {
        addToast(isAIOff ? 'AI機能は現在無効です。' : 'APIキーを選択してください。', 'error');
        return;
    }
    if (!prompt.trim()) {
        addToast('プロンプトを入力してください。', 'info');
        return;
    }
    // FIX: Added currentUser check
    if (!currentUser) {
        addToast('ユーザー情報が見つかりません。', 'error');
        return;
    }

    setIsLoading(true);
    setGeneratedVideoUrl(null);
    setLoadingMessage('動画生成を開始しています...');
    
    try {
        // FIX: Pass currentUser.id as the fourth argument
        const result = await geminiService.generateVideo(prompt, aspectRatio, (message) => setLoadingMessage(message), currentUser.id);
        // FIX: Set only the videoUrl property of the result object
        setGeneratedVideoUrl(result.videoUrl);
        // FIX: Save artifact
        await dataService.addAIArtifact(result.artifactData);
        addToast('動画の生成が完了し、AIドキュメントに保存されました。', 'success');
    } catch (e: any) {
        let message = e instanceof Error ? `動画生成エラー: ${e.message}` : '不明なエラーが発生しました。';
        if (e.message?.includes("Requested entity was not found.")) {
            message = "APIキーが無効、または権限がありません。再度キーを選択してください。";
            setApiKeySelected(false);
        }
        addToast(message, 'error');
    } finally {
        setIsLoading(false);
    }
  };
  
  if (!apiKeySelected) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 text-center">
        <h2 className="text-xl font-semibold">APIキーが必要です</h2>
        <p className="my-4">Veoビデオ生成モデルを使用するには、APIキーを選択する必要があります。</p>
        <p className="text-sm my-4">請求に関する詳細は<a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">こちら</a>をご確認ください。</p>
        <button onClick={handleSelectKey} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">APIキーを選択</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold">AI 動画生成 (Veo)</h2>
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-1">プロンプト</label>
          <textarea id="prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isLoading || isAIOff} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium mb-1">アスペクト比</label>
          <select id="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')} disabled={isLoading || isAIOff} className="w-full p-2 border rounded">
            <option value="16:9">16:9 (横長)</option>
            <option value="9:16">9:16 (縦長)</option>
          </select>
        </div>
        <button onClick={handleGenerate} disabled={isLoading || isAIOff || !prompt.trim()} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isLoading ? '生成中...' : '動画を生成'}
        </button>
        {isAIOff && <p className="text-sm text-red-500 text-center">AI機能は現在無効です。</p>}
      </div>
      {(isLoading || generatedVideoUrl) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">生成結果</h3>
          {isLoading ? (
            <div>
              <Loader className="w-12 h-12 animate-spin mx-auto text-blue-500" />
              <p className="mt-4">{loadingMessage}</p>
              <p className="text-sm text-slate-500 mt-1">動画生成には数分かかることがあります。</p>
            </div>
          ) : (
            generatedVideoUrl && <video src={generatedVideoUrl} controls className="w-full rounded-lg" />
          )}
        </div>
      )}
    </div>
  );
};

export default AIVideoGenerationPage;