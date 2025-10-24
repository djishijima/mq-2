import React, { useState } from 'react';
import { Loader, Sparkles, Upload } from '../Icons';
import * as geminiService from '../../services/geminiService';
import * as dataService from '../../services/dataService';
import { Toast, EmployeeUser } from '../../types';

const VideoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 8-6 4 6 4V8Z"></path><rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect></svg>
);

interface AIVideoTranscriptionPageProps {
  addToast: (message: string, type: Toast['type']) => void;
  isAIOff: boolean;
  currentUser: EmployeeUser | null;
}

const AIVideoTranscriptionPage: React.FC<AIVideoTranscriptionPageProps> = ({ addToast, isAIOff, currentUser }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        addToast('動画ファイルを選択してください。', 'error');
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setTranscription(null);
    }
  };

  const handleTranscribe = async () => {
    if (isAIOff || !videoFile || !currentUser) {
      addToast(isAIOff ? 'AI機能は現在無効です。' : '動画ファイルを選択してください。', 'error');
      return;
    }

    setIsLoading(true);
    setTranscription(null);
    try {
      const artifact = await geminiService.transcribeVideoWithTimestamps(videoFile, "この動画の音声を文字起こししてください。", currentUser.id);
      setTranscription(artifact.body_md || '');
      await dataService.addAIArtifact(artifact);
      addToast('動画の文字起こしが完了し、AIドキュメントに保存されました。', 'success');
    } catch (e) {
      addToast(e instanceof Error ? `動画文字起こしエラー: ${e.message}` : '不明なエラーが発生しました。', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><VideoIcon /> AI 動画文字起こし (タイムスタンプ付き)</h2>
        
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

        <button
          onClick={handleTranscribe}
          disabled={isLoading || isAIOff || !videoFile}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isLoading ? '文字起こし中...' : '文字起こしを実行'}
        </button>
        {isAIOff && <p className="text-sm text-red-500 text-center">AI機能は現在無効です。</p>}
      </div>
      {(isLoading || transcription) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2">文字起こし結果</h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg whitespace-pre-wrap text-base font-mono">
              {transcription}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIVideoTranscriptionPage;