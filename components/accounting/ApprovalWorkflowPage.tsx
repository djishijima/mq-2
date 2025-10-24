import React, { useState, useEffect, useMemo } from 'react';
import ApplicationList from '../ApplicationList';
import ApplicationDetailModal from '../ApplicationDetailModal';
import { getApplicationCodes, approveApplication, rejectApplication } from '../../services/dataService';
import { ApplicationWithDetails, ApplicationCode, EmployeeUser, Toast, Customer, AccountItem, Job, PurchaseOrder, Department, AllocationDivision } from '../../types';
import { Loader, AlertTriangle } from '../Icons';

// Form components
import ExpenseReimbursementForm from '../forms/ExpenseReimbursementForm';
import TransportExpenseForm from '../forms/TransportExpenseForm';
import LeaveApplicationForm from '../forms/LeaveApplicationForm';
import ApprovalForm from '../forms/ApprovalForm';
import DailyReportForm from '../forms/DailyReportForm';
import WeeklyReportForm from '../forms/WeeklyReportForm';

interface ApprovalWorkflowPageProps {
    currentUser: EmployeeUser | null;
    view: 'list' | 'form';
    formCode?: string;
    searchTerm?: string;
    addToast: (message: string, type: Toast['type']) => void;
    customers?: Customer[];
    accountItems?: AccountItem[];
    jobs?: Job[];
    purchaseOrders?: PurchaseOrder[];
    departments?: Department[];
    isAIOff?: boolean;
    allocationDivisions?: AllocationDivision[];
    applications: ApplicationWithDetails[];
    onRefresh: () => void;
}

type NormalizedFormCode = 'EXP' | 'TRP' | 'LEV' | 'APL' | 'DLY' | 'WKR';

const FORM_CODE_ALIASES: Record<NormalizedFormCode, string[]> = {
    EXP: ['EXP', 'EXPENSE', 'EXPENSES', 'EXPENSE_REIMBURSEMENT', 'EXPENSE_FORM', 'EXPENSE_CLAIM', '経費精算'],
    TRP: ['TRP', 'TRAVEL', 'TRAVEL_EXPENSE', 'TRANSPORT', 'TRANSPORTATION', 'TRANSPORT_EXPENSE', '交通費申請'],
    LEV: ['LEV', 'LEAVE', 'LEAVE_APPLICATION', 'VACATION', 'HOLIDAY', '休暇申請'],
    APL: ['APL', 'APPROVAL', 'APPROVAL_REQUEST', 'RINGI', '稟議'],
    DLY: ['DLY', 'DAILY', 'DAILY_REPORT', 'REPORT_DAILY', '日報'],
    WKR: ['WKR', 'WEEKLY', 'WEEKLY_REPORT', 'REPORT_WEEKLY', '週報'],
};

const normalizeFormCode = (code?: string): NormalizedFormCode | undefined => {
    if (!code) return undefined;
    const trimmed = code.trim();
    if (!trimmed) return undefined;
    const upperCased = trimmed.toUpperCase();

    for (const [normalized, aliases] of Object.entries(FORM_CODE_ALIASES) as [NormalizedFormCode, string[]][]) {
        if (aliases.some(alias => alias.toUpperCase() === upperCased)) {
            return normalized;
        }
    }

    return undefined;
};

const TABS_CONFIG = {
    pending: { title: "要承認", description: "あなたが承認する必要がある申請の一覧です。" },
    submitted: { title: "自分の申請", description: "あなたが過去に提出したすべての申請履歴です。" },
    completed: { title: "完了済", description: "承認または却下されたすべての申請の履歴です。" },
};

export const ApprovalWorkflowPage: React.FC<ApprovalWorkflowPageProps> = ({ currentUser, view, formCode, searchTerm, addToast, customers, accountItems, jobs, purchaseOrders, departments, isAIOff, allocationDivisions, applications, onRefresh }) => {
    // State for list view
    const [error, setError] = useState('');
    const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'completed'>('pending');

    // State for form view
    const [applicationCodes, setApplicationCodes] = useState<ApplicationCode[]>([]);
    const [isCodesLoading, setIsCodesLoading] = useState(true);

    const fetchFormData = async () => {
        setIsCodesLoading(true);
        setError('');
        try {
            const codes = await getApplicationCodes();
            setApplicationCodes(codes);
        } catch (err: any) {
             setError(err.message || '申請フォームの基本データの読み込みに失敗しました。');
        } finally {
            setIsCodesLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'form') {
            fetchFormData();
        }
    }, [view]);

    // List View Logic
    const handleSelectApplication = (app: ApplicationWithDetails) => {
        setSelectedApplication(app);
        setIsDetailModalOpen(true);
    };

    const handleModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedApplication(null);
    };

    const handleApprove = async (application: ApplicationWithDetails, reason: string) => {
        if (!currentUser) return;
        try {
            await approveApplication(application, currentUser as any, reason);
            addToast('申請を承認しました。', 'success');
            handleModalClose();
            await onRefresh();
        } catch (err: any) {
            addToast(`エラー: ${err.message}`, 'error');
        }
    };

    const handleReject = async (application: ApplicationWithDetails, reason: string) => {
        if (!currentUser) return;
        try {
            await rejectApplication(application, reason, currentUser as any);
            addToast('申請を差し戻しました。', 'success');
            handleModalClose();
            await onRefresh();
        } catch (err: any) {
            addToast(`エラー: ${err.message}`, 'error');
        }
    };

    const filteredApplications = useMemo(() => {
        let filtered = applications;
        if (currentUser) {
            if (activeTab === 'pending') {
                filtered = applications.filter(app => app.approverId === currentUser.id && app.status === 'pending_approval');
            } else if (activeTab === 'submitted') {
                filtered = applications.filter(app => app.applicantId === currentUser.id);
            } else if (activeTab === 'completed') {
                filtered = applications.filter(app => app.status === 'approved' || app.status === 'rejected');
            }
        }

        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(app => 
                app.applicationCode?.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
                app.applicant?.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
                app.status.toLowerCase().includes(lowerCaseSearchTerm) ||
                JSON.stringify(app.formData).toLowerCase().includes(lowerCaseSearchTerm)
            );
        }
        return filtered;
    }, [applications, currentUser, activeTab, searchTerm]);

    const currentFormCode = useMemo(() => normalizeFormCode(formCode), [formCode]);
    const currentApplicationCode = useMemo(() => applicationCodes.find(code => code.code === currentFormCode), [applicationCodes, currentFormCode]);

    // Render list view
    if (view === 'list') {
        return (
            <div className="space-y-6">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            {Object.entries(TABS_CONFIG).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key as any)}
                                    className={`${
                                        activeTab === key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-base`}
                                    aria-current={activeTab === key ? 'page' : undefined}
                                >
                                    {config.title}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{TABS_CONFIG[activeTab].description}</p>
                </div>
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p className="font-bold">データ読み込みエラー</p>
                        <p>{error}</p>
                    </div>
                )}
                <ApplicationList
                    applications={filteredApplications}
                    onApplicationSelect={handleSelectApplication}
                    selectedApplicationId={selectedApplication?.id || null}
                />
                <ApplicationDetailModal
                    application={selectedApplication}
                    currentUser={currentUser}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onClose={handleModalClose}
                    customers={customers || []}
                    jobs={jobs || []}
                />
            </div>
        );
    }

    // Render form view
    if (view === 'form') {
        return (
            <div className="max-w-3xl mx-auto">
                {isCodesLoading && (
                    <div className="text-center py-10">
                        <Loader className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                        <p className="mt-2 text-slate-500 dark:text-slate-400">フォームを読み込み中...</p>
                    </div>
                )}
                {error && !isCodesLoading && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p className="font-bold">フォーム読み込みエラー</p>
                        <p>{error}</p>
                    </div>
                )}
                {!isCodesLoading && !error && currentApplicationCode && (
                    <>
                        {currentFormCode === 'EXP' && <ExpenseReimbursementForm onSuccess={onRefresh} applicationCodeId={currentApplicationCode.id} currentUser={currentUser} customers={customers || []} accountItems={accountItems || []} jobs={jobs || []} purchaseOrders={purchaseOrders || []} departments={departments || []} isAIOff={!!isAIOff} isLoading={isCodesLoading} error={error} allocationDivisions={allocationDivisions || []} />}
                        {currentFormCode === 'TRP' && <TransportExpenseForm onSuccess={onRefresh} applicationCodeId={currentApplicationCode.id} currentUser={currentUser} isAIOff={!!isAIOff} isLoading={isCodesLoading} error={error} />}
                        {currentFormCode === 'LEV' && <LeaveApplicationForm onSuccess={onRefresh} applicationCodeId={currentApplicationCode.id} currentUser={currentUser} isAIOff={!!isAIOff} isLoading={isCodesLoading} error={error} />}
                        {currentFormCode === 'APL' && <ApprovalForm onSuccess={onRefresh} applicationCodeId={currentApplicationCode.id} currentUser={currentUser} isAIOff={!!isAIOff} isLoading={isCodesLoading} error={error} />}
                        {currentFormCode === 'DLY' && <DailyReportForm onSuccess={onRefresh} applicationCodeId={currentApplicationCode.id} currentUser={currentUser} addToast={addToast} isAIOff={!!isAIOff} isLoading={isCodesLoading} error={error} />}
                        {currentFormCode === 'WKR' && <WeeklyReportForm onSuccess={onRefresh} applicationCodeId={currentApplicationCode.id} currentUser={currentUser} addToast={addToast} isAIOff={!!isAIOff} isLoading={isCodesLoading} error={error} />}
                    </>
                )}
                 {!isCodesLoading && !error && !currentApplicationCode && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p className="font-bold">エラー</p>
                        <p>指定されたフォームコード ({formCode}) が見つかりません。</p>
                    </div>
                 )}
            </div>
        );
    }

    return null;
};