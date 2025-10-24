import React, { useState, useEffect, useMemo } from 'react';
import { submitApplication } from '../../services/dataService';
import { Loader, Sparkles, AlertTriangle } from '../Icons';
import { User } from '../../types';
import ChatApplicationModal from '../ChatApplicationModal';
import ApprovalRouteSelector from './ApprovalRouteSelector';

interface LeaveApplicationFormProps {
    onSuccess: () => void;
    applicationCodeId: string;
    currentUser: User | null;
    isAIOff: boolean;
    isLoading: boolean;
    error: string;
}

const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({ onSuccess, applicationCodeId, currentUser, isAIOff, isLoading, error: formLoadError }) => {
    const [formData, setFormData] = useState({
        leaveType: '有給休暇',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
    });
    const [approvalRouteId, setApprovalRouteId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    
    const isDisabled = isSubmitting || isLoading || !!formLoadError;

    const leaveDays = useMemo(() => {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
        const diff = end.getTime() - start.getTime();
        if (diff < 0) return 0;
        return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    }, [formData.startDate, formData.endDate]);

    const initialChatMessage = useMemo(() => {
        const lines = [
            '休暇申請を作成したいです。',
            `休暇種別:${formData.leaveType}`,
            `開始日:${formData.startDate}`,
            `終了日:${formData.endDate}`,
            `日数: ${leaveDays}日`,
        ];
        if (formData.reason.trim()) {
            lines.push(`申請理由:${formData.reason}`);
        }
        lines.push('上記の内容で承認ルートも含めた申請案を作ってください。');
        return lines.join('\n');
    }, [formData, leaveDays]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!approvalRouteId) {
            setError('承認ルートを選択してください。');
            return;
        }
        if (!currentUser) {
            setError('ユーザー情報が見つかりません。再度ログインしてください。');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            await submitApplication({
                applicationCodeId: applicationCodeId,
                formData,
                approvalRouteId: approvalRouteId
            }, currentUser.id);
            onSuccess();
        } catch (err: any) {
            setError('申請の提出に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
    const inputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <>
            <div className="relative">
                {(isLoading || formLoadError) && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl p-8">
                        {isLoading && <Loader className="w-12 h-12 animate-spin text-blue-500" />}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm space-y-6 animate-fade-in-up">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">休暇申請フォーム</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">休暇種別と期間、理由を入力してください。AIアシスタントを利用すると申請理由の下書きが作成できます。</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsChatModalOpen(true)}
                            disabled={isDisabled || isAIOff}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:bg-slate-400"
                        >
                            <Sparkles className="h-4 w-4" />
                            AIに相談
                        </button>
                    </div>

                    {formLoadError && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                            <p className="font-bold">フォーム読み込みエラー</p>
                            <p>{formLoadError}</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
                            <AlertTriangle className="h-5 w-5" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="leaveType" className={labelClass}>休暇種別 *</label>
                            <select
                                id="leaveType"
                                name="leaveType"
                                value={formData.leaveType}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={isDisabled}
                            >
                                <option value="有給休暇">有給休暇</option>
                                <option value="午前半休">午前半休</option>
                                <option value="午後半休">午後半休</option>
                                <option value="欠勤">欠勤</option>
                                <option value="特別休暇">特別休暇</option>
                                <option value="その他">その他</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>申請日数</label>
                            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{leaveDays} 日</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">終了日は開始日以降の日付を選択してください。</p>
                        </div>
                        <div>
                            <label htmlFor="startDate" className={labelClass}>開始日 *</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={isDisabled}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className={labelClass}>終了日 *</label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={formData.endDate}
                                min={formData.startDate}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={isDisabled}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="reason" className={labelClass}>申請理由 *</label>
                        <textarea
                            id="reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            rows={4}
                            className={inputClass}
                            placeholder="業務引き継ぎの状況などを記載してください。"
                            disabled={isDisabled}
                            required
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">AIボタンを押すと、入力内容をもとに承認用の文章を提案します。</p>
                    </div>

                    <ApprovalRouteSelector onChange={setApprovalRouteId} isSubmitting={isDisabled} />

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setIsChatModalOpen(true)}
                            disabled={isDisabled || isAIOff}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                        >
                            <Sparkles className="h-4 w-4" />
                            AIに相談
                        </button>
                        <button
                            type="submit"
                            disabled={isDisabled}
                            className="w-40 flex items-center justify-center bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
                        >
                            {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : '申請を提出'}
                        </button>
                    </div>
                </form>
            </div>
            {isChatModalOpen && (
                <ChatApplicationModal
                    isOpen={isChatModalOpen}
                    onClose={() => setIsChatModalOpen(false)}
                    onSuccess={() => {
                        setIsChatModalOpen(false);
                        onSuccess();
                    }}
                    initialMessage={initialChatMessage}
                    currentUser={currentUser}
                    isAIOff={isAIOff}
                />
            )}
        </>
    );
};

export default LeaveApplicationForm;