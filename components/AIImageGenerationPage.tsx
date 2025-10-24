import React, { useState } from 'react';
import { Loader, Wand, Image as ImageIcon } from './Icons';
import * as geminiService from '../services/geminiService';
import * as dataService from '../services/dataService';
import { Toast, EmployeeUser } from '../types';
import { base64ToBlob } from '../utils';

interface AIImageGenerationPageProps {
  addToast: (message: string, type: Toast['type']) => void;
  isAIOff: boolean;
  currentUser: EmployeeUser | null;
}

const aspectRatios: ('1:1' | '16:9' | '9:16' | '4:3' | '3:4')[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

const AIImageGenerationPage: React.FC<AIImageGenerationPageProps> = ({ addToast, isAIOff, currentUser }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addToast('プロンプトを入力してください。', 'error');
      return;
    }
    if (isAIOff) {
      addToast('AI機能は現在無効です。', 'error');
      return;
    }
    // FIX: Added currentUser check
    if (!currentUser) {
      addToast('ユーザー情報が見つかりません。', 'error');
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);
    try {
      // FIX: Passed currentUser.id as the third argument
      const resultBase64 = await geminiService.generateImage(prompt, aspectRatio, currentUser.id);
      setGeneratedImage(`data:image/jpeg;base64,${resultBase64}`);
      addToast('画像の生成が完了しました。', 'success');

      if (currentUser) {
        try {
            const blob = base64ToBlob(resultBase64, 'image/jpeg');
            const fileName = `ai-gen-${Date.now()}.jpg`;
            const { path } = await dataService.uploadFile(blob, 'ai', fileName);
            
            await dataService.addAIArtifact({
                kind: 'image',
                title: `AI生成画像: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
                storage_path: path,
                created_by: currentUser.id,
            });
            addToast('生成画像をAIドキュメントに保存しました。', 'success');

        } catch (e) {
            console.error("Failed to save image artifact:", e);
            addToast('生成画像の保存に失敗しました。', 'error');
        }
      }

    } catch (e) {
      const message = e instanceof Error ? e.message : '画像の生成中にエラーが発生しました。';
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const ImageResult: React.FC = () => {
      if (isLoading) {
          return (
            <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="mt-4 text-slate-500">AIが画像を生成中...</p>
                <p className="mt-1 text-xs text-slate-400">数分かかる場合があります</p>
            </div>
          );
      }
      if (generatedImage) {
          return (
              <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                  <img src={generatedImage} alt={prompt} className="w-full h-full object-contain" />
                  <a href={generatedImage} download={`generated-image-${Date.now()}.jpg`} className="absolute bottom-4 right-4 bg-black/50 text-white py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      ダウンロード
                  </a>
              </div>
          );
      }
      return (
        <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
           <ImageIcon className="w-16 h-16 text-slate-400 mb-2" />
           <p className="text-slate-500 font-semibold">生成された画像がここに表示されます</p>
        </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-6 h-fit">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Wand className="w-6 h-6 text-blue-500" />
                AIイラスト生成 (Imagen 4.0)
            </h2>
            <div className="space-y-2">
                <label htmlFor="prompt-input" className="font-medium text-slate-700 dark:text-slate-300">プロンプト</label>
                <textarea
                    id="prompt-input"
                    rows={5}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="例：夕焼けのビーチを歩くサイバーパンクな猫、アニメスタイル"
                    className="w-full text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isLoading || isAIOff}
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="aspect-ratio-select" className="font-medium text-slate-700 dark:text-slate-300">アスペクト比</label>
                <select
                    id="aspect-ratio-select"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isLoading || isAIOff}
                >
                    {aspectRatios.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                </select>
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading || isAIOff || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
            >
                {isLoading ? <Loader className="w-5 h-5 animate-spin"/> : <Wand className="w-5 h-5" />}
                {isLoading ? '生成中...' : '画像を生成'}
            </button>
            {isAIOff && <p className="text-sm text-red-500 mt-2 text-center">AI機能は現在無効です。</p>}
        </div>
        
        <div>
             <ImageResult />
        </div>
    </div>
  );
};

export default AIImageGenerationPage;