import React, { useState, useEffect, useRef } from 'react';
import { Lead, LeadStatus, Toast, ConfirmationDialogProps, EmployeeUser, LeadScore, CompanyInvestigation, CustomProposalContent, LeadProposalPackage, EstimateStatus, Estimate, EstimateItem } from '../../types';
import { X, Save, Loader, Pencil, Trash2, Mail, CheckCircle, Lightbulb, Search, FileText } from '../Icons';
import LeadStatusBadge from './LeadStatusBadge';
import { INQUIRY_TYPES } from '../../constants';
import LeadScoreBadge from '../ui/LeadScoreBadge';
// FIX: Rewriting this line to ensure there are no hidden characters causing a TypeScript error.
import { createLeadProposalPackage, investigateLeadCompany } from '../../services/geminiService';
import * as dataService from '../../services/dataService';
import ProposalPdfContent from './ProposalPdfContent';
import { generateMultipagePdf } from '../../utils';
import InvestigationReportPdfContent from '../reports/InvestigationReportPdfContent';

interface LeadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onSave: (leadId: string, updatedData: Partial<Lead>) => Promise<void>;
    onDelete: (leadId: string) => void;
    addToast: (message: string, type: Toast['type']) => void;
    // FIX: Rewriting this line to ensure there are no hidden characters causing a TypeScript error.
    requestConfirmation: (dialog: Omit<ConfirmationDialogProps, "isOpen" | "onClose">) => void;
    currentUser: EmployeeUser | null;
    onGenerateReply: (lead: Lead) => void;
    isAIOff: boolean;
    onAddEstimate: (estimate: Partial<Estimate>) => Promise<void>;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
    <div className={`pt-4 ${className || ''}`}>
        <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-4">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Field: React.FC<{
    label: string;
    name: keyof Lead;
    value: string | string[] | null | undefined;
    isEditing: boolean;
    onChange: (e: React.ChangeEvent<any>) => void;
    type?: 'text' | 'email' | 'select' | 'textarea';
    options?: any[];
    className?: string;
}> = ({ label, name, value, isEditing, onChange, type = 'text', options = [], className = '' }) => {
    const inputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500";
    
    return (
        <div className={className}>
            <label htmlFor={String(name)} className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</label>
            <div className="mt-1">
                {isEditing ? (
                    <>
                        {type === 'textarea' && <textarea id={String(name)} name={String(name)} value={(value as string) || ''} onChange={onChange} className={inputClass} rows={5} />}
                        {type === 'select' && <select id={String(name)} name={String(name)} value={(value as string) || ''} onChange={onChange} className={inputClass}>{options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}</select>}
                        {type !== 'textarea' && type !== 'select' && <input type={type} id={String(name)} name={String(name)} value={(value as string) || ''} onChange={onChange} className={inputClass} />}
                    </>
                ) : (
                    <p className="text-base text-slate-900 dark:text-white min-h-[44px] flex items-center whitespace-pre-wrap break-words">
                        {Array.isArray(value) ? value.join(', ') : (value || '-')}
                    </p>
                )}
            </div>
        </div>
    );
};

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, lead, onSave, onDelete, addToast, requestConfirmation, currentUser, onGenerateReply, isAIOff, onAddEstimate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Lead>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isInvestigating, setIsInvestigating] = useState(false);
    const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);
    const [proposalPackage, setProposalPackage] = useState<LeadProposalPackage | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isSavingEstimate, setIsSavingEstimate] = useState(false);
    
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);
    
    useEffect(() => {
        if (lead) {
            setFormData({ ...lead });
            setIsEditing(false);
            setProposalPackage(null); // Reset package on new lead
        }
    }, [lead]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !lead) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const { id, createdAt, updatedAt, ...submissionData } = formData;
        await onSave(lead.id, submissionData);
        setIsSaving(false);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (!lead) return;
        requestConfirmation({
            title: 'リードの削除',
            message: `本当にリード「${lead.company} / ${lead.name}」を削除しますか？この操作は元に戻せません。`,
            onConfirm: () => {
                onDelete(lead.id);
                onClose();
            }
        });
    };

    const handleInvestigateCompany = async () => {
        if (!lead || isAIOff || !currentUser) return; // FIX: Added currentUser check
        setIsInvestigating(true);
        try {
            // FIX: Passed currentUser.id as the second argument
            const result = await investigateLeadCompany(lead.company, currentUser.id);
            await onSave(lead.id, { aiInvestigation: result });
            if (mounted.current) {
                setFormData(prev => ({...prev, aiInvestigation: result}));
                addToast('企業調査が完了しました。', 'success');
            }
        } catch (e) {
            if (mounted.current) addToast(e instanceof Error ? `企業調査エラー: ${e.message}`: '不明なエラーが発生しました。', 'error');
        } finally {
            if (mounted.current) setIsInvestigating(false);
        }
    };
    
    const handleCreateProposalPackage = async () => {
        if (isAIOff) {
            addToast('AI機能は現在無効です。', 'error');
            return;
        }
        // FIX: Added currentUser check
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        setIsGeneratingPackage(true);
        setProposalPackage(null);
        try {
            // FIX: Passed currentUser.id as the second argument
            const result = await createLeadProposalPackage(lead, currentUser.id);
            if (mounted.current) {
                setProposalPackage(result);
                if (result.isSalesLead && result.proposal && currentUser) {
                    try {
                        await dataService.addAIArtifact({
                            kind: 'proposal',
                            title: result.proposal.coverTitle,
                            body_md: `## 事業理解\n${result.proposal.businessUnderstanding}\n\n## 課題\n${result.proposal.challenges}\n\n## 提案\n${result.proposal.proposal}\n\n## 結論\n${result.proposal.conclusion}`,
                            content_json: { estimate: result.estimate },
                            created_by: currentUser.id,
                            lead_id: lead.id,
                        });
                        addToast('提案パッケージをAIドキュメントに保存しました。', 'success');
                    } catch (artifactError) {
                        console.error("Failed to save proposal artifact:", artifactError);
                        addToast('提案パッケージをAIドキュメントに保存できませんでした。', 'error');
                    }
                }
            }
        } catch(e) {
            if(mounted.current) addToast(e instanceof Error ? e.message : 'AI提案パッケージの作成に失敗しました。', 'error');
        } finally {
            if(mounted.current) setIsGeneratingPackage(false);
        }
    };

    const handleGeneratePdf = async () => {
        if (!proposalPackage?.proposal || !lead) return;
        setIsGeneratingPdf(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // allow content to render
          await generateMultipagePdf(
            'proposal-pdf-content',
            `提案書_${lead.company}.pdf`
          );
        } catch(e) {
            addToast(e instanceof Error ? e.message : 'PDFの生成に失敗しました。', 'error');
        } finally {
            if(mounted.current) setIsGeneratingPdf(false);
        }
    };

    const handleSaveEstimate = async () => {
        if (!proposalPackage?.estimate || !lead || !currentUser) return;
        setIsSavingEstimate(true);
        try {
            const totalAmount = proposalPackage.estimate.reduce((sum, item) => sum + (item.price || 0), 0);
            await onAddEstimate({
                leadId: lead.id,
                customerName: lead.company,
                title: proposalPackage.proposal?.coverTitle || `【提案】${lead.company}`,
                totalAmount: totalAmount,
                status: EstimateStatus.Draft,
                bodyMd: "AIによる自動生成見積です。",
                createdBy: currentUser.id,
                jsonData: proposalPackage.estimate,
                notes: 'AIによる自動生成見積です。内容は担当者にご確認ください。',
                estimateDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
            });
            addToast('見積が下書きとして保存されました。', 'success');
        } catch (e) {
            addToast(e instanceof Error ? `見積保存エラー: ${e.message}`: '見積の保存に失敗しました。', 'error');
        } finally {
            if(mounted.current) setIsSavingEstimate(false);
        }
    };


    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">リード詳細</h2>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="会社名" name="company" value={formData.company} isEditing={isEditing} onChange={handleChange} />
                                <Field label="担当者名" name="name" value={formData.name} isEditing={isEditing} onChange={handleChange} />
                                <Field label="メールアドレス" name="email" type="email" value={formData.email} isEditing={isEditing} onChange={handleChange} />
                                <Field label="電話番号" name="phone" value={formData.phone} isEditing={isEditing} onChange={handleChange} />
                                <Field label="ステータス" name="status" value={formData.status} isEditing={isEditing} onChange={handleChange} type="select" options={Object.values(LeadStatus)} />
                                <Field label="ソース" name="source" value={formData.source} isEditing={isEditing} onChange={handleChange} />
                            </div>
                            <Field label="問い合わせ内容" name="message" value={formData.message} isEditing={isEditing} onChange={handleChange} type="textarea" />
                            <Field label="活動履歴" name="infoSalesActivity" value={formData.infoSalesActivity} isEditing={isEditing} onChange={handleChange} type="textarea" />
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <DetailSection title="AIアシスタント" className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">企業調査</h4>
                                        <button onClick={handleInvestigateCompany} disabled={isInvestigating || isAIOff} className="text-sm font-semibold text-blue-600 flex items-center gap-2 disabled:opacity-50">
                                            {isInvestigating ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                            {formData.aiInvestigation ? '再調査' : 'AIで企業調査'}
                                        </button>
                                    </div>
                                    {isInvestigating ? (
                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Web検索を用いて調査中...
                                        </div>
                                    ) : formData.aiInvestigation ? (
                                        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                                            <p className="whitespace-pre-wrap">{formData.aiInvestigation.summary}</p>
                                            {formData.aiInvestigation.sources && formData.aiInvestigation.sources.length > 0 && (
                                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                                    <h5 className="text-xs font-bold text-slate-500 mb-1">情報源</h5>
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {formData.aiInvestigation.sources.map((source, index) => (
                                                            <li key={index} className="text-xs truncate">
                                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={source.title || source.uri}>
                                                                    {source.title || source.uri}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">企業の基本情報や最新ニュースを調査します。</p>
                                    )}
                                </div>
                                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                     <h4 className="font-semibold text-slate-800 dark:text-slate-100">提案パッケージ</h4>
                                     <button onClick={handleCreateProposalPackage} disabled={isGeneratingPackage || isAIOff} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
                                         {isGeneratingPackage ? <Loader className="w-5 h-5 animate-spin"/> : <Lightbulb className="w-5 h-5" />}
                                         AI提案パッケージ作成
                                     </button>
                                     {isGeneratingPackage && <p className="text-sm text-slate-500 text-center mt-2">AIが提案書と見積を作成中です...</p>}
                                     {proposalPackage && (
                                         <div className="mt-4 space-y-4">
                                             {!proposalPackage.isSalesLead ? <p className="p-3 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">AI分析結果: 営業メールの可能性が高いです (理由: {proposalPackage.reason})</p> :
                                             <>
                                                {proposalPackage.proposal && <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-md text-sm">提案書: 「{proposalPackage.proposal.coverTitle}」が生成されました。</div>}
                                                {proposalPackage.estimate && <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-md text-sm">見積: {proposalPackage.estimate.length}項目が生成されました。</div>}
                                                <div className="flex items-center gap-2">
                                                    <button onClick={handleGeneratePdf} disabled={isGeneratingPdf} className="text-sm flex-1 flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 py-2 rounded-md disabled:opacity-50">
                                                        {isGeneratingPdf ? <Loader className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4"/>} 提案書PDF
                                                    </button>
                                                    <button disabled={isSavingEstimate} onClick={handleSaveEstimate} className="text-sm flex-1 flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 py-2 rounded-md disabled:opacity-50">
                                                         {isSavingEstimate ? <Loader className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 見積を保存
                                                    </button>
                                                </div>
                                             </>
                                             }
                                         </div>
                                     )}
                                </div>
                                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">メール返信</h4>
                                    <button onClick={() => onGenerateReply(lead)} disabled={isAIOff} className="w-full flex items-center justify-center gap-2 bg-purple-100 text-purple-700 font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
                                        <Mail className="w-4 h-4"/> AIで返信作成
                                    </button>
                                </div>
                            </DetailSection>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
                    <div>{isEditing && <button type="button" onClick={handleDelete} className="flex items-center gap-2 text-red-600 font-semibold py-2 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50"><Trash2 className="w-4 h-4"/>削除</button>}</div>
                    <div className="flex gap-4">
                        {!isEditing ? (
                            <>
                                <button type="button" onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200"><Pencil className="w-4 h-4"/>編集</button>
                                <button type="button" onClick={onClose} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">閉じる</button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-100 dark:bg-slate-700 font-semibold py-2 px-4 rounded-lg">キャンセル</button>
                                <button type="button" onClick={handleSave} disabled={isSaving} className="w-32 flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-slate-400">
                                    {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />保存</>}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        {/* Hidden divs for PDF generation */}
        { (isGeneratingPdf || proposalPackage?.proposal) &&
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {proposalPackage?.proposal && <ProposalPdfContent content={proposalPackage.proposal} lead={lead} />}
            </div>
        }
      </>
    );
};