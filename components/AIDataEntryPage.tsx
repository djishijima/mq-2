import React, { useState } from 'react';
import { Customer, Job, JobStatus, Lead, LeadStatus, Toast, InvoiceStatus, ManufacturingStatus, EmployeeUser } from '../types';
import * as geminiService from '../services/geminiService';
import { Loader, Send, Sparkles, Upload, FileText, X } from './Icons';

interface AIDataEntryPageProps {
  customers: Customer[];
  onAddLead: (lead: Partial<Lead>) => Promise<void>;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  onAddJob: (job: Omit<Job, 'id' | 'createdAt' | 'jobNumber'>) => Promise<void>;
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

const AIDataEntryPage: React.FC<AIDataEntryPageProps> = ({ customers, onAddLead, onUpdateCustomer, onAddJob, addToast, isAIOff, currentUser }) => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        addToast('ファイルサイズは5MB以下にしてください。', 'error');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAIOff || (!input.trim() && !file)) {
      addToast(isAIOff ? 'AI機能は現在無効です。' : 'テキストまたはファイルを入力してください。', 'error');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      let fileData;
      if (file) {
        fileData = await fileToBase64(file);
      }

      // FIX: Passed currentUser.id as the fourth argument
      const response = await geminiService.processUnstructuredData(input, currentUser?.name || '名無しのユーザー', fileData, currentUser?.id || 'anonymous');

      if (response.functionCalls && response.functionCalls.length > 0) {
        let successMessage = '';
        for (const functionCall of response.functionCalls) {
          const args = functionCall.args;

          switch (functionCall.name) {
            case 'add_lead':
              await onAddLead({ ...args, status: LeadStatus.New });
              successMessage += `新しいリード「${args.company}」を追加しました。\n`;
              break;

            case 'update_customer':
              const customerToUpdate = customers.find(c => c.customerName === args.customerName);
              if (!customerToUpdate) {
                successMessage += `エラー: 取引先「${args.customerName}」が見つかりませんでした。\n`;
                addToast(`取引先「${args.customerName}」が見つかりませんでした。`, 'error');
              } else {
                const { customerName, ...updates } = args;
                await onUpdateCustomer(customerToUpdate.id, updates);
                successMessage += `取引先「${args.customerName}」の情報を更新しました。\n`;
              }
              break;

            case 'add_job':
              await onAddJob({
                ...(args as any),
                status: JobStatus.Pending,
                invoiceStatus: InvoiceStatus.Uninvoiced,
                manufacturingStatus: ManufacturingStatus.OrderReceived
              });
              successMessage += `新しい案件「${args.title}」を追加しました。\n`;
              break;

            default:
              const errorMsg = `エラー: 不明な関数呼び出し '${functionCall.name}'`;
              successMessage += `${errorMsg}\n`;
              addToast(errorMsg, 'error');
          }
        }
        setResult(successMessage.trim());
        if (!successMessage.includes('エラー:')) {
          addToast('AIによるデータ処理が完了しました。', 'success');
          setInput('');
          setFile(null);
        }
      } else {
        const textResponse = response.text;
        setResult(textResponse);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'AIの処理中にエラーが発生しました。';
      setResult(`エラー: ${errorMsg}`);
      addToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-purple-500" />
        AI データ入力
      </h2>
      <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
        メール本文、メモ、仕様書ファイルなど、登録したい情報を入力してください。AIが内容を解釈し、適切なテーブルにデータを登録・更新します。
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          className="w-full text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 focus:ring-blue-500 disabled:opacity-50"
          placeholder="例: 新規リード、株式会社未来テクノロジーの佐藤様。電話番号は03-1234-5678。来週打ち合わせ希望。"
          disabled={isLoading || isAIOff}
        />
        
        <div className="flex items-center gap-4">
            <label className={`relative inline-flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer ${isLoading || isAIOff ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="w-5 h-5" />
                <span>ファイルを追加...</span>
                <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf,.txt,.md" disabled={isLoading || isAIOff} />
            </label>
            {file && (
                <div className="flex items-center gap-2 text-sm bg-slate-200 dark:bg-slate-600 py-1 px-2 rounded-md">
                    <FileText className="w-4 h-4" />
                    <span className="truncate max-w-xs">{file.name}</span>
                    <button type="button" onClick={() => setFile(null)} disabled={isLoading} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                        <X className="w-4 h-4"/>
                    </button>
                </div>
            )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || isAIOff || (!input.trim() && !file)}
            className="w-48 flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-purple-700 disabled:bg-slate-400"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isLoading ? '処理中...' : 'AIで処理'}
          </button>
        </div>
      </form>

      {(result || isLoading) && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-2">処理結果</h3>
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader className="w-4 h-4 animate-spin" />
              <span>AIがテキストを解釈しています...</span>
            </div>
          ) : (
            <pre className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">{result}</pre>
          )}
        </div>
      )}
    </div>
  );
};

export default AIDataEntryPage;