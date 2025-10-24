import React, { useState, useMemo, useEffect } from 'react';
import { Estimate, SortConfig, EmployeeUser, Customer, EstimateItem, EstimateStatus, Toast } from '../../types';
import SortableHeader from '../ui/SortableHeader';
import EmptyState from '../ui/EmptyState';
import { FileText, PlusCircle, Loader, Sparkles, Trash2, X, Save, Eye, Pencil } from '../Icons';
import { formatJPY, formatDate } from '../../utils';
import { draftEstimate } from '../../services/geminiService';
import EstimateDetailModal from './EstimateDetailModal';

// Modal Component
interface EstimateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (estimate: Partial<Estimate>) => Promise<void>;
    customers: Customer[];
    addToast: (message: string, type: Toast['type']) => void;
    estimateToEdit?: Estimate | null;
    currentUser: EmployeeUser | null;
    isAIOff: boolean;
}

const EstimateModal: React.FC<EstimateModalProps> = ({ isOpen, onClose, onSave, customers, addToast, estimateToEdit, currentUser, isAIOff }) => {
    const [estimate, setEstimate] = useState<Partial<Estimate>>({});
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            const initialData = estimateToEdit ? 
                { ...estimateToEdit, items: estimateToEdit.jsonData || estimateToEdit.items || [] } : 
                {
                    items: [],
                    title: '',
                    customerName: '',
                    customerId: null,
                    status: 'draft' as EstimateStatus,
                };
            setEstimate(initialData);
            setErrors({});
            setAiPrompt('');
        }
    }, [isOpen, estimateToEdit]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        let customerId: string | null = null;
        if (name === 'customerName') {
            const existingCustomer = customers.find(c => c.customerName === value);
            customerId = existingCustomer ? existingCustomer.id : null;
             setEstimate(prev => ({ ...prev, customerName: value, customerId: customerId }));
        } else {
            setEstimate(prev => ({ ...prev, [name]: value }));
        }

        if (value) setErrors(prev => ({...prev, [name]: ''}));
    };

    const handleAiDraft = async () => {
        if (isAIOff) {
            addToast('AI機能は現在無効です。', 'error');
            return;
        }
        if (!aiPrompt) return;
        // FIX: Add check for currentUser before accessing currentUser.id
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        setIsAiLoading(true);
        setErrors({});
        try {
            // FIX: Pass currentUser.id as the second argument to draftEstimate
            const draft = await draftEstimate(aiPrompt, currentUser.id);
            setEstimate(prev => ({
                ...prev,
                title: draft.title,
                items: draft.items?.map(item => ({...item, subtotal: item.price})),
                notes: draft.notes,
            }));
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'AIによる下書き作成に失敗しました。', 'error');
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleItemChange = (index: number, field: keyof EstimateItem, value: any) => {
        const newItems = [...(estimate.items || [])];
        const item = { ...newItems[index] };
        (item[field] as any) = value;

        if (field === 'quantity' || field === 'unitPrice') {
            item.price = (item.quantity || 0) * (item.unitPrice || 0);
        }
        item.subtotal = item.price;

        newItems[index] = item;
        setEstimate(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        const newItem: EstimateItem = { division: 'その他', content: '', quantity: 1, unit: '式', unitPrice: 0, price: 0, cost: 0, costRate: 0, subtotal: 0 };
        setEstimate(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    };
    
    const removeItem = (index: number) => {
        setEstimate(prev => ({ ...prev, items: (prev.items || []).filter((_, i) => i !== index) }));
    };

    const total = useMemo(() => estimate.items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0, [estimate.items]);
    const totalCost = useMemo(() => estimate.items?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0, [estimate.items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!estimate.customerName) newErrors.customerName = '顧客名は必須です。';
        if (!estimate.title) newErrors.title = '件名は必須です。';
        if (!estimate.items || estimate.items.length === 0) newErrors.items = '少なくとも1つの明細が必要です。';
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            addToast("入力内容に誤りがあります。", 'error');
            return;
        }

        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        try {
            const saveData = { 
                ...estimate, 
                totalAmount: total, 
                jsonData: estimate.items,
                createdBy: estimate.createdBy || currentUser.id,
            };
            await onSave(saveData);
        } catch(e) {
            addToast(e instanceof Error ? e.message : '保存に失敗しました。', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;
    
    const inputClass = "w-full bg-slate-50 dark:bg-slate-700/50 border text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 text-base";
    const tableInputClass = "w-full bg-transparent p-1 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none rounded-md";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{estimateToEdit ? '見積編集' : '新規見積作成'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-blue-50 dark:bg-slate-700/50 p-4 rounded-lg border border-blue-200 dark:border-slate-700">
                      <div className="flex gap-2">
                        <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="例：A4チラシ 80000枚、コート90kg、両面カラー" className={inputClass} />
                        <button onClick={handleAiDraft} disabled={isAiLoading || isAIOff} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                            {isAiLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} AIで下書き
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <input name="customerName" value={estimate.customerName || ''} onChange={handleInputChange} list="customer-list" placeholder="顧客名 *" className={`${inputClass} ${errors.customerName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`} />
                            <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.customerName} />)}</datalist>
                        </div>
                        <input type="text" name="title" value={estimate.title || ''} onChange={handleInputChange} placeholder="件名 *" className={`${inputClass} ${errors.title ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`} />
                    </div>
                    
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50"><tr>{['区分', '内容', '数量(Q)', '単位', '単価(P)', '原価(V)', '金額(PQ)'].map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}<th/></tr></thead>
                            <tbody>{estimate.items?.map((item, index) => <tr key={index}>
                                <td><input value={item.division} onChange={e => handleItemChange(index, 'division', e.target.value)} className={tableInputClass} /></td>
                                <td className="w-1/3"><input value={item.content} onChange={e => handleItemChange(index, 'content', e.target.value)} className={tableInputClass} /></td>
                                <td><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className={`${tableInputClass} w-20`} /></td>
                                <td><input value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} className={`${tableInputClass} w-16`} /></td>
                                <td><input type="number" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))} className={`${tableInputClass} w-24`} /></td>
                                <td><input type="number" value={item.cost} onChange={e => handleItemChange(index, 'cost', Number(e.target.value))} className={`${tableInputClass} w-24`} /></td>
                                <td className="px-2">{formatJPY(item.price)}</td>
                                <td><button onClick={() => removeItem(index)}><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500"/></button></td>
                            </tr>)}</tbody>
                        </table>
                    </div>
                    {errors.items && <p className="text-red-500 text-xs">{errors.items}</p>}

                    <div className="flex justify-between items-center">
                        <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"><PlusCircle className="w-4 h-4"/>行を追加</button>
                        <div className="text-right space-y-1">
                            <div><span className="text-sm text-slate-500">小計(PQ): </span><span className="font-semibold text-lg">{formatJPY(total)}</span></div>
                            <div><span className="text-sm text-slate-500">原価合計(VQ): </span><span className="font-semibold text-lg">{formatJPY(totalCost)}</span></div>
                            <div className="border-t pt-1"><span className="text-sm text-slate-500">粗利(MQ): </span><span className="font-bold text-xl text-blue-600 dark:text-blue-400">{formatJPY(total - totalCost)}</span></div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">キャンセル</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="w-32 flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
                        {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Page Component
// FIX: Cannot find name 'EstimateManagementPageProps'.
interface EstimateManagementPageProps {
    estimates: Estimate[];
    customers: Customer[];
    allUsers: EmployeeUser[];
    onAddEstimate: (estimate: Partial<Estimate>) => Promise<void>;
    onUpdateEstimate: (id: string, estimateData: Partial<Estimate>) => Promise<void>;
    addToast: (message: string, type: Toast['type']) => void;
    currentUser: EmployeeUser | null;
    searchTerm: string;
    isAIOff: boolean;
}

const EstimateManagementPage: React.FC<EstimateManagementPageProps> = ({ estimates, customers, allUsers, onAddEstimate, onUpdateEstimate, addToast, currentUser, searchTerm, isAIOff }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'createdAt', direction: 'descending' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);

    const filteredEstimates = useMemo(() => {
        if (!searchTerm) return estimates;
        const lower = searchTerm.toLowerCase();
        return estimates.filter(e => e.customerName.toLowerCase().includes(lower) || e.title.toLowerCase().includes(lower));
    }, [estimates, searchTerm]);

    const sortedEstimates = useMemo(() => {
        let sortable = [...filteredEstimates];
        if (sortConfig) {
            sortable.sort((a, b) => {
                const aVal = a[sortConfig.key as keyof Estimate];
                const bVal = b[sortConfig.key as keyof Estimate];
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortable;
    }, [filteredEstimates, sortConfig]);

    const requestSort = (key: string) => {
        const direction = sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
        setSortConfig({ key, direction });
    };
    
    const handleOpenDetail = (estimate: Estimate) => {
        setSelectedEstimate(estimate);
        setIsDetailModalOpen(true);
    };

    const handleOpenModal = (estimate: Estimate | null = null) => {
        setSelectedEstimate(estimate);
        setIsModalOpen(true);
    };

    const handleSaveEstimate = async (estimateData: Partial<Estimate>) => {
        if (estimateData.id) {
            await onUpdateEstimate(estimateData.id, estimateData);
            addToast('見積を更新しました。', 'success');
        } else {
            await onAddEstimate(estimateData);
            addToast('見積を保存しました。', 'success');
        }
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">見積一覧</h2>
                    <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">
                        <PlusCircle className="w-5 h-5" />
                        新規見積作成
                    </button>
                </div>
                {sortedEstimates.length === 0 ? (
                     <EmptyState icon={FileText} title="見積がありません" message="最初の見積を作成しましょう。" action={{label: "新規見積作成", onClick: () => handleOpenModal(null)}} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left">
                            <thead className="text-sm uppercase bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <SortableHeader sortKey="id" label="見積番号" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="customerName" label="顧客名" sortConfig={sortConfig} requestSort={requestSort} />
                                    <th scope="col" className="px-6 py-3 font-medium">件名</th>
                                    <SortableHeader sortKey="totalAmount" label="合計金額" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="createdAt" label="作成日" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="status" label="ステータス" sortConfig={sortConfig} requestSort={requestSort} />
                                    <th scope="col" className="px-6 py-3 font-medium text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {sortedEstimates.map(est => (
                                    <tr key={est.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-mono text-sm">{est.id.substring(0,8)}...</td>
                                        <td className="px-6 py-4">{est.customerName}</td>
                                        <td className="px-6 py-4">{est.title}</td>
                                        <td className="px-6 py-4 font-semibold">{formatJPY(est.totalAmount)}</td>
                                        <td className="px-6 py-4">{formatDate(est.createdAt)}</td>
                                        <td className="px-6 py-4">{est.status}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleOpenDetail(est)} className="p-2 text-slate-500 hover:text-blue-600"><Eye className="w-5 h-5"/></button>
                                            <button onClick={() => handleOpenModal(est)} className="p-2 text-slate-500 hover:text-green-600"><Pencil className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {isModalOpen && <EstimateModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEstimate}
                customers={customers}
                addToast={addToast}
                estimateToEdit={selectedEstimate}
                currentUser={currentUser}
                isAIOff={isAIOff}
            />}
             {isDetailModalOpen && <EstimateDetailModal 
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                estimate={selectedEstimate}
                addToast={addToast}
                onEdit={() => {
                    setIsDetailModalOpen(false);
                    handleOpenModal(selectedEstimate);
                }}
            />}
        </>
    );
};

export default EstimateManagementPage;