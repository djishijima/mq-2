import React, { useState, useMemo } from 'react';
import { submitApplication, uploadFile, getPublicUrl } from '../../services/dataService';
import { extractInvoiceDetails } from '../../services/geminiService';
import ApprovalRouteSelector from './ApprovalRouteSelector';
import AccountItemSelect from './AccountItemSelect';
import PaymentRecipientSelect from './PaymentRecipientSelect';
import DepartmentSelect from './DepartmentSelect';
// FIX: AlertTriangleをIconsからインポート
import { Loader, Upload, PlusCircle, Trash2, AlertTriangle } from '../Icons';
import { User, InvoiceData, Customer, AccountItem, Job, PurchaseOrder, Department, AllocationDivision } from '../../types';

interface ExpenseReimbursementFormProps {
    onSuccess: () => void;
    applicationCodeId: string;
    currentUser: User | null;
    customers: Customer[];
    accountItems: AccountItem[];
    jobs: Job[];
    purchaseOrders: PurchaseOrder[];
    departments: Department[];
    isAIOff: boolean;
    isLoading: boolean;
    error: string;
    allocationDivisions: AllocationDivision[];
}

interface ExpenseDetail {
    id: string;
    paymentDate: string;
    paymentRecipientId: string;
    description: string;
    allocationTarget: string;
    costType: 'V' | 'F';
    accountItemId: string;
    allocationDivisionId: string;
    amount: number;
    receiptPath?: string;
    receiptUrl?: string;
}

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1]) : reject("Read failed");
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

const ExpenseReimbursementForm: React.FC<ExpenseReimbursementFormProps> = ({ onSuccess, applicationCodeId, currentUser, customers, jobs, departments, isAIOff, isLoading, error: formLoadError, allocationDivisions }) => {
    const [departmentId, setDepartmentId] = useState<string>('');
    const [details, setDetails] = useState<ExpenseDetail[]>([]);
    const [notes, setNotes] = useState('');
    const [approvalRouteId, setApprovalRouteId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [error, setError] = useState('');
    
    const isDisabled = isSubmitting || isLoading || !!formLoadError;

    const totalAmount = useMemo(() => details.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [details]);

    const addNewRow = () => {
        setDetails(prev => [...prev, {
            id: `row_${Date.now()}`,
            paymentDate: new Date().toISOString().split('T')[0],
            paymentRecipientId: '',
            description: '',
            allocationTarget: '',
            costType: 'F',
            accountItemId: '',
            allocationDivisionId: '',
            amount: 0,
        }]);
    };
    
    const handleDetailChange = (id: string, field: keyof ExpenseDetail, value: string | number) => {
        setDetails(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveRow = (id: string) => setDetails(prev => prev.filter(item => item.id !== id));
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (isAIOff) {
            setError('AI機能は現在無効です。ファイルからの読み取りはできません。');
            return;
        }
        if (!currentUser) {
            setError('ユーザー情報が見つかりません。');
            return;
        }

        setIsOcrLoading(true);
        setError('');
        
        const filePromises = Array.from(files).map(async file => {
            try {
                const [base64String, uploadResult] = await Promise.all([
                    readFileAsBase64(file),
                    uploadFile(file, 'receipts', file.name)
                ]);
                
                // FIX: Pass currentUser.id to extractInvoiceDetails
                const ocrData: InvoiceData = await extractInvoiceDetails(base64String, file.type, currentUser.id);
                const receiptUrl = getPublicUrl(uploadResult.path, 'receipts');
                
                return {
                    id: `row_ocr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    paymentDate: ocrData.invoiceDate || new Date().toISOString().split('T')[0],
                    paymentRecipientId: '', // To be filled by user
                    description: `【OCR読取: ${ocrData.vendorName}】${ocrData.description}`,
                    allocationTarget: ocrData.project ? `job:${jobs.find(j => j.title === ocrData.project)?.id || ''}` : `customer:${customers.find(c => c.customerName === ocrData.relatedCustomer)?.id || ''}`,
                    costType: ocrData.costType || 'F',
                    accountItemId: '', // To be filled by user
                    allocationDivisionId: '', // To be filled by user
                    amount: ocrData.totalAmount || 0,
                    receiptPath: uploadResult.path,
                    receiptUrl: receiptUrl || undefined,
                };
            } catch (err: any) {
                console.error(`Error processing file ${file.name}:`, err);
                setError(`ファイル ${file.name} のAI-OCR処理中にエラーが発生しました: ${err.message || '不明なエラー'}`);
                return null;
            }
        });

        const newDetails = (await Promise.all(filePromises)).filter(d => d !== null) as ExpenseDetail[];
        setDetails(prev => [...prev, ...newDetails]);

        setIsOcrLoading(false);
        e.target.value = ''; // Clear file input
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!approvalRouteId) return setError('承認ルートを選択してください。');
        if (!currentUser) return setError('ユーザー情報が見つかりません。');
        if (!departmentId) return setError('部門を選択してください。');
        if (details.length === 0 || details.every(d => !d.description && !d.paymentRecipientId)) {
            return setError('少なくとも1つの明細を入力してください。');
        }

        setIsSubmitting(true);
        setError('');
        try {
            const submissionData = {
                departmentId,
                details: details.filter(d => d.description || d.paymentRecipientId),
                notes: notes,
                totalAmount: totalAmount,
            };
            await submitApplication({ applicationCodeId, formData: submissionData, approvalRouteId }, currentUser.id);
            onSuccess();
        } catch (err: any) {
            setError('申請の提出に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const tableInputClass = "w-full text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="relative">
            {(isLoading || formLoadError) && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl p-8">
                    {isLoading && <Loader className="w-12 h-12 animate-spin text-blue-500" />}
                </div>
            )}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm space-y-4 animate-fade-in-up">
                
                {formLoadError && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p className="font-bold">フォーム読み込みエラー</p>
                        <p>{formLoadError}</p>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">申請部門 *</label>
                      <DepartmentSelect
                        value={departmentId}
                        onChange={setDepartmentId}
                        required
                      />
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">備考</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={tableInputClass} placeholder="補足事項があれば入力してください。" disabled={isDisabled} />
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500 dark:text-slate-400">合計金額</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-white">¥{totalAmount.toLocaleString()}</p>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-base font-semibold text-slate-700 dark:text-slate-200">経費明細 *</label>
                        <div className="flex items-center gap-2">
                            <label htmlFor="ocr-file-upload" className={`relative inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer ${isOcrLoading || isAIOff || isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isOcrLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <span>{isOcrLoading ? '解析中...' : '領収書から追加'}</span>
                                <input id="ocr-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" multiple disabled={isOcrLoading || isAIOff || isDisabled} />
                            </label>
                            <button type="button" onClick={addNewRow} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700" disabled={isDisabled}>
                                <PlusCircle className="w-4 h-4" /> 行を追加
                            </button>
                        </div>
                    </div>
                    {isAIOff && <p className="text-xs text-red-500 mb-2">AI機能無効のため、AI-OCR機能は利用できません。</p>}

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    {['支払日', '支払先', '内容', '勘定科目', '費用種別', '関連案件/顧客 (MQ割当)', '金額'].map(h => <th key={h} className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>)}
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {details.map(item => (
                                    <tr key={item.id}>
                                        <td className="p-1"><input type="date" value={item.paymentDate} onChange={e => handleDetailChange(item.id, 'paymentDate', e.target.value)} className={`${tableInputClass} w-36`} disabled={isDisabled} /></td>
                                        <td className="p-1 min-w-[200px]"><PaymentRecipientSelect value={item.paymentRecipientId} onChange={(id) => handleDetailChange(item.id, 'paymentRecipientId', id)} required /></td>
                                        <td className="p-1 min-w-[200px]"><input type="text" placeholder="内容" value={item.description} onChange={e => handleDetailChange(item.id, 'description', e.target.value)} className={tableInputClass} disabled={isDisabled} /></td>
                                        <td className="p-1 min-w-[200px]"><AccountItemSelect value={item.accountItemId} onChange={(id) => handleDetailChange(item.id, 'accountItemId', id)} required /></td>
                                        <td className="p-1 min-w-[120px]">
                                            <select value={item.costType} onChange={e => handleDetailChange(item.id, 'costType', e.target.value)} className={tableInputClass} disabled={isDisabled}>
                                                <option value="F">固定費 (F)</option>
                                                <option value="V">変動費 (V)</option>
                                            </select>
                                        </td>
                                        <td className="p-1 min-w-[200px]">
                                            <select value={item.allocationTarget} onChange={e => handleDetailChange(item.id, 'allocationTarget', e.target.value)} className={tableInputClass} disabled={isDisabled}>
                                                <option value="">関連先なし</option>
                                                <optgroup label="顧客">
                                                    {customers.map(c => <option key={`customer:${c.id}`} value={`customer:${c.id}`}>{c.customerName}</option>)}
                                                </optgroup>
                                                <optgroup label="案件">
                                                    {jobs.map(j => <option key={`job:${j.id}`} value={`job:${j.id}`}>{j.title}</option>)}
                                                </optgroup>
                                            </select>
                                        </td>
                                        <td className="p-1 min-w-[120px]"><input type="number" placeholder="金額" value={item.amount} onChange={e => handleDetailChange(item.id, 'amount', Number(e.target.value))} className={`${tableInputClass} text-right`} disabled={isDisabled} /></td>
                                        <td className="text-center p-1">
                                            <button type="button" onClick={() => handleRemoveRow(item.id)} className="p-1 text-slate-400 hover:text-red-500" disabled={isDisabled}><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ApprovalRouteSelector onChange={setApprovalRouteId} isSubmitting={isDisabled} />

                {error && <p className="text-red-500 text-sm bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600" disabled={isDisabled}>下書き保存</button>
                    <button type="submit" className="w-40 flex justify-center items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isDisabled}>
                        {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : '申請を送信する'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseReimbursementForm;