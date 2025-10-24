import React, { useState, useEffect, useMemo } from 'react';
import ApplicationList from '../ApplicationList';
import ApplicationDetailModal from '../ApplicationDetailModal';
import { getApplicationCodes, approveApplication, rejectApplication } from '../../services/dataService';
import { ApplicationWithDetails, ApplicationCode, EmployeeUser, Toast, Customer, AccountItem, Job, PurchaseOrder, Department, AllocationDivision } from '../../types';
import { Loader, AlertTriangle } from '../Icons';

// Form components
import ExpenseReimbursementForm from '../forms/ExpenseReimbursementForm';
import TransportExpenseForm from '../forms/TransportExpenseForm'; // FIX: Named import for PeriodClosingPage
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

const ApprovalWorkflowPage: React.FC<ApprovalWorkflowPageProps> = ({ currentUser, view, formCode, searchTerm, addToast, customers, accountItems, jobs, purchaseOrders, departments, isAIOff, allocationDivisions, applications, onRefresh }) => {
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
            await approveApplication(application, currentUser as any, reason); // FIX: Passed reason to approveApplication
            addToast('申請を承認しました。', 'success');
            handleModalClose();
            await onRefresh();
        } catch (err: any) {
            addToast(`エラー: ${err.message}`, 'error');
        }
    };

    const handleReject = async (