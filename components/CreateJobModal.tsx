import React, { useState, useEffect, useRef } from 'react';
import { Job, JobStatus, AISuggestions, InvoiceStatus, ManufacturingStatus, Toast, EmployeeUser } from '../types';
import { PAPER_TYPES, FINISHING_OPTIONS } from '../constants';
import { suggestJobParameters } from '../services/geminiService';
import { Sparkles, Loader, X, Upload, FileText } from './Icons';
import { formatJPY } from '../utils';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (job: Omit<Job, 'id' | 'createdAt' | 'jobNumber'>) => Promise<void>;
  addToast: (message: string, type: Toast['type']) => void;
  currentUser: EmployeeUser | null; // Add currentUser prop
}

type ValidationErrors = {
    clientName?: string;
    title?: string;
    dueDate?: string;
    price?: string;
}

const initialFormState = {
  clientName: '',
  title: '',
  quantity: 1000,
  paperType: PAPER_TYPES[0],
  finishing: FINISHING_OPTIONS[0],
  details: '',
  dueDate: '',
  price: 0,
  variableCost: 0,
};

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onAddJob, addToast, currentUser }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  const mounted = useRef(false);
  const clientNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setAiPrompt('');
      setAiFile(null);
      setErrors({});
      setIsAiLoading(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
      const newErrors: ValidationErrors = {};
      if (!formData.clientName.trim()) newErrors.clientName = "クライアント名は必須です。";
      if (!formData.title.trim()) newErrors.title = "案件タイトルは必須です。";
      if (!formData.dueDate) newErrors.dueDate = "納期は必須です。";
      if (formData.price <= 0) newErrors.price = "売上高は0より大きい値にしてください。";
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: ['quantity', 'price', 'variableCost'].includes(name) ? parseInt(value) || 0 : value }));
    if (errors[name as keyof ValidationErrors]) {
        setErrors(prev => ({...prev, [name]: undefined}));
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            addToast('ファイルサイズは5MB以下にしてください。', 'error');
            return;
        }
        setAiFile(file);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt && !aiFile) {
        addToast("AIへの依頼内容(テキストまたはファイル)を入力してください。", 'info');
        return;
    }
    if (!currentUser) {
        addToast("ユーザー情報が見つかりません。", 'error');
        return;
    }

    setIsAiLoading(true);
    setErrors({});
    try {
        let fileData;
        if (aiFile) {
            const base64 = await readFileAsBase64(aiFile);
            fileData = { base64, mimeType: aiFile.type, name: aiFile.name }; // Add name for logging
        }
        // FIX: Pass currentUser.id as the fifth argument
        const suggestions = await suggestJobParameters(aiPrompt, PAPER_TYPES, FINISHING_OPTIONS, fileData, currentUser.id);
        if (mounted.current) {
            setFormData(prev => ({
                ...prev,
                clientName: (suggestions as any).clientName || prev.clientName,
                title: suggestions.title,
                quantity: suggestions.quantity,
                paperType: suggestions.paperType,
                finishing: suggestions.finishing,
                details: suggestions.details,
                price: suggestions.price,
                variableCost: suggestions.variableCost,
            }));

            if (!(suggestions as any).clientName && !formData.clientName) {
                clientNameInputRef.current?.focus();
            }
        }
    } catch (e) {
        if (mounted.current) {
            addToast(e instanceof Error ? e.message : "AIによる提案の生成中に不明なエラーが発生しました。", 'error');
        }
    } finally {
        if (mounted.current) {
            setIsAiLoading(false);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast("入力内容に誤りがあります。", 'error');
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
        const newJob: Omit<Job, 'id' | 'createdAt' | 'jobNumber'> = {
          status: JobStatus.Pending,
          invoiceStatus: InvoiceStatus.Uninvoiced,
          manufacturingStatus: ManufacturingStatus.OrderReceived,
          ...formData,
        };
        await onAddJob(newJob);
        if (mounted.current) {
            onClose();
        }
    } catch (err) {
        console.error(err);
        if (mounted.current) {
            addToast('案件の追加に失敗しました。データベースの接続を確認し、もう一度お試しください。', 'error');
        }
    } finally {
        if (mounted.current) {
            setIsSubmitting(false);
        }
    }
  };
  
  const formRowClass = "flex flex-col gap-2";
  const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-300";
  const getInputClass = (field: keyof ValidationErrors) => `w-full bg-slate-50 dark:bg-slate-700 border text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${errors[field] ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">新規案件作成</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
            <div className="bg-blue-50 dark:bg-slate-700/50 p-4 rounded-lg border border-blue-200 dark:border-slate-700 mb-6">
                <label htmlFor="ai-prompt" className="block text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    AIアシスタント
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">メールの本文を貼り付けたり、仕様書(画像/PDF)をアップロードして、項目を自動入力できます。</p>
                <div className="space-y-2">
                    <textarea
                        id="ai-prompt"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="例: 株式会社ABC様のカフェオープン用A4チラシ1000枚"
                        rows={3}
                        className={`${getInputClass(undefined)} flex-grow`}
                        disabled={isAiLoading || isSubmitting}
                    />
                    <div className="flex items-center gap-2">
                        <label className={`relative inline-flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer ${isAiLoading || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload className="w-4 h-4" />
                            <span>ファイルを選択</span>
                            <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" disabled={isAiLoading || isSubmitting} />
                        </label>
                        {aiFile && (
                            <div className="flex items-center gap-2 text-sm bg-slate-200 dark:bg-slate-600 py-1 px-2 rounded-md">
                                <FileText className="w-4 h-4" />
                                <span className="truncate max-w-xs">{aiFile.name}</span>
                                <button type="button" onClick={() => setAiFile(null)} disabled={isAiLoading || isSubmitting} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                        )}
                        <button onClick={handleAiGenerate} disabled={isAiLoading || isSubmitting || (!aiPrompt && !aiFile)} className="ml-auto bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-400 flex items-center gap-2 transition-colors">
                            {isAiLoading ? <Loader className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5" />}
                            <span>{isAiLoading ? '生成中...' : 'AIで生成'}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <div className="flex justify-end gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} disabled={isSubmitting} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50">キャンセル</button>
          <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-32 flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
              {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : '案件を追加'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;