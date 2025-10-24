import React, { useState, useRef } from 'react';
import { Loader, Wand, Upload, Image as ImageIcon, Search } from './Icons';
import * as geminiService from '../services/geminiService';
import * as dataService from '../services/dataService';
import { Toast, EmployeeUser } from '../types';
import { base64ToBlob } from '../utils';

interface AIImageStudioPageProps {
  addToast: (message: string, type: Toast['type']) => void;
  isAIOff: boolean;
  currentUser: EmployeeUser | null;
}

type Mode = 'edit' | 'analyze';

const AIImageStudioPage: React.FC<AIImageStudioPageProps> = ({ addToast, isAIOff, currentUser }) => {
  const [mode, setMode] = useState<Mode>('edit');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addToast('画像ファイルを選択してください。', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
      setOriginalImageFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt.trim() || !originalImageFile) {
      addToast('画像を選択し、指示を入力してください。', 'error');
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
    setEditedImage(null);
    setAnalysisResult(null);

    try {
      const base64Data = originalImage.split(',')[1];
      const mimeType = originalImageFile.type;
      
      if (mode === 'edit') {
        // FIX: Passed currentUser.id as the fourth argument
        const resultBase64 = await geminiService.editImageWithText(base64Data, mimeType, prompt, currentUser.id);
        setEditedImage(`data:image/png;base64,${resultBase64}`);
        addToast('画像の編集が完了しました。', 'success');

        if (currentUser) {
          const blob = base64ToBlob(resultBase64, 'image/png');
          const { path } = await dataService.uploadFile(blob, 'ai', `ai-edit-${Date.now()}.png`);
          await dataService.addAIArtifact({
              kind: 'image',
              title: `AI編集画像: ${prompt.substring(0, 50)}`,
              storage_path: path,
              created_by: currentUser.id,
          });
          addToast('編集画像をAIドキュメントに保存しました。', 'success');
        }
      } else { // analyze mode
        // FIX: Passed currentUser.id as the fourth argument
        const resultText = await geminiService.analyzeImage(base64Data, mimeType, prompt, currentUser.id);
        setAnalysisResult(resultText);
        addToast('画像の分析が完了しました。', 'success');
        if (currentUser) {
            await dataService.addAIArtifact({
                kind: 'image_analysis',
                title: `AI画像分析: ${prompt.substring(0, 50)}`,
                body_md: resultText,
                created_by: currentUser.id,
            });
            addToast('分析結果をAIドキュメントに保存しました。', 'success');
        }
      }

    } catch (e) {
      const message = e instanceof Error ? e.message : `画像の${mode === 'edit' ? '編集' : '分析'}中にエラーが発生しました。`;
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const ImagePlaceholder: React.FC<{ onUploadClick: () => void }> = ({ onUploadClick }) => (
    <div 
        className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        onClick={onUploadClick}
    >
      <Upload className="w-12 h-12 text-slate-400 mb-2" />
      <p className="text-slate-500 font-semibold">クリックして画像をアップロード</p>
      <p className="text-sm text-slate-400">またはドラッグ＆ドロップ</p>
    </div>
  );

  const ImagePreview: React.FC<{ src: string; alt: string; isLoading?: boolean; loadingText?: string }> = ({ src, alt, isLoading = false, loadingText }) => (
    <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 relative overflow-hidden">
      {isLoading ? (
        <div className="flex flex-col items-center">
            <Loader className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="mt-4 text-slate-500">{loadingText}</p>
        </div>
      ) : (
        <img src={src} alt={alt} className="w-full h-full object-contain" />
      )}
    </div>
  );
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-500" />
            AI 画像編集 / 分析
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Original Image */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">1. 元の画像</h3>
                {originalImage ? (
                    <ImagePreview src={originalImage} alt="Original" />
                ) : (
                    <ImagePlaceholder onUploadClick={() => fileInputRef.current?.click()} />
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />
                 {originalImage && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                        別の画像をアップロード
                    </button>
                 )}
            </div>

            {/* Right: Prompt and Result */}
            <div className="space-y-4">
                 <h3 className="text-lg font-semibold">2. AIへの指示 & 結果</h3>
                 <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <button onClick={() => setMode('edit')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold ${mode === 'edit' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>編集</button>
                    <button onClick={() => setMode('analyze')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold ${mode === 'analyze' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>分析</button>
                 </div>
                 <div className="space-y-2">
                    <label htmlFor="prompt-input" className="font-medium text-slate-700 dark:text-slate-300">プロンプト</label>
                    <textarea
                        id="prompt-input"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={mode === 'edit' ? "例: レトロなフィルターを追加して" : "例: この画像に写っているものは何ですか？"}
                        className="w-full text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 focus:ring-blue-500 disabled:opacity-50"
                        disabled={isLoading || isAIOff}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || isAIOff || !originalImage}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin"/> : (mode === 'edit' ? <Wand className="w-5 h-5"/> : <Search className="w-5 h-5"/>)}
                        {isLoading ? (mode === 'edit' ? '編集中...' : '分析中...') : (mode === 'edit' ? 'AIで画像を編集' : 'AIで画像を分析')}
                    </button>
                     {isAIOff && <p className="text-sm text-red-500 mt-2 text-center">AI機能は現在無効です。</p>}
                 </div>

                 <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">結果</h3>
                    {mode === 'edit' ? (
                        editedImage || isLoading ? (
                            <ImagePreview src={editedImage!} alt="Edited" isLoading={isLoading} loadingText="AIが画像を編集中..." />
                        ) : (
                            <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                               <ImageIcon className="w-12 h-12 text-slate-400 mb-2" />
                               <p className="text-slate-500 font-semibold">ここに編集後の画像が表示されます</p>
                            </div>
                        )
                    ) : (
                         analysisResult || isLoading ? (
                            <div className="w-full min-h-[20rem] bg-slate-100 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                {isLoading ? <div className="flex items-center justify-center h-full"><Loader className="w-8 h-8 animate-spin"/></div> : <p className="whitespace-pre-wrap text-sm">{analysisResult}</p>}
                            </div>
                        ) : (
                             <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                               <Search className="w-12 h-12 text-slate-400 mb-2" />
                               <p className="text-slate-500 font-semibold">ここに分析結果が表示されます</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AIImageStudioPage;