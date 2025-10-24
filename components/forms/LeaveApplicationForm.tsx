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
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-8