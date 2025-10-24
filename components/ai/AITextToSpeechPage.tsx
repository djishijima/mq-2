import React, { useState } from 'react';
import { Loader, Sparkles } from '../Icons';
import * as geminiService from '../../services/geminiService';
import * as dataService from '../../services/dataService'; // FIX: Imported dataService
import { Toast, EmployeeUser } from '../../types';
import { decode, decodeAudioData } from '../../utils';

interface AITextToSpeechPageProps {
  isAIOff: boolean;
  addToast: (message: string, type: Toast['type']) => void;
  currentUser: EmployeeUser | null;
}

const AITextToSpeechPage: React.FC<AITextToSpeechPageProps> = ({ addToast, isAIOff, currentUser }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [text, setText] = useState('ようこそ。これはAIによるテキスト読み上げデモです。');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleGenerateSpeech = async () => {
    if (isAIOff) {
      addToast('AI機能は現在無効です。', 'error');
      return;
    }
    if (!text.trim()) {
      addToast('読み上げたいテキストを入力してください。', 'info');
      return;
    }
    if (!currentUser) {
      addToast('ユーザー情報が見つかりません。', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const { audioBlob, artifactData } = await geminiService.generateSpeech(text, currentUser.id);
      const objectUrl = URL.createObjectURL(audioBlob);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(objectUrl);
      await dataService.addAIArtifact({ ...artifactData, storage_path: null });
      addToast('音声の生成が完了し、AIドキュメントに保存されました。', 'success');

      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          // 自動再生がブロックされる場合があるため、エラーは無視
        });
      }
    } catch (e) {
      const message = e instanceof Error ? `音声生成エラー: ${e.message}` : '不明なエラーが発生しました。';
      addToast(message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">AI テキスト読み上げ</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          テキストを入力すると、Geminiが日本語の音声を生成します。生成された音声はAIドキュメントとして保存されます。
        </p>
        <div>
          <label htmlFor="tts-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            読み上げテキスト
          </label>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            disabled={isGenerating || isAIOff}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="読み上げたいテキストを入力してください。"
          />
        </div>
        <button
          onClick={handleGenerateSpeech}
          disabled={isGenerating || isAIOff || !text.trim()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          <span>{isGenerating ? '生成中...' : '音声を生成'}</span>
        </button>
        {isAIOff && <p className="text-sm text-red-500">AI機能は現在無効です。</p>}
      </div>
      {audioUrl && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">生成された音声</h3>
          <audio ref={audioRef} controls className="w-full">
            <source src={audioUrl} type="audio/wav" />
            お使いのブラウザはaudio要素をサポートしていません。
          </audio>
        </div>
      )}
    </div>
  );
};

export default AITextToSpeechPage;