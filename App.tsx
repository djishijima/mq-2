import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import CreateJobModal from './components/CreateJobModal';
import JobDetailModal from './components/JobDetailModal';
import CustomerList from './components/CustomerList';
import CustomerDetailModal from './components/CustomerDetailModal';
import { CompanyAnalysisModal } from './components/CompanyAnalysisModal';
import LeadManagementPage from './components/sales/LeadManagementPage';
import CreateLeadModal from './components/sales/CreateLeadModal';
import PlaceholderPage from './components/PlaceholderPage';
import UserManagementPage from './components/admin/UserManagementPage';
import ApprovalRouteManagementPage from './components/admin/ApprovalRouteManagementPage';
import BugReportList from './components/admin/BugReportList';
import BugReportChatModal from './components/BugReportChatModal';
import SettingsPage from './components/SettingsPage';
import AccountingPage from './components/Accounting';
import SalesPipelinePage from './components/sales/SalesPipelinePage';
import InventoryManagementPage from './components/inventory/InventoryManagementPage';
import CreateInventoryItemModal from './components/inventory/CreateInventoryItemModal';
import ManufacturingPipelinePage from './components/manufacturing/ManufacturingPipelinePage';
import ManufacturingOrdersPage from './components/manufacturing/ManufacturingOrdersPage';
import PurchasingManagementPage from './components/purchasing/PurchasingManagementPage';
import CreatePurchaseOrderModal from './components/purchasing/CreatePurchaseOrderModal';
import EstimateManagementPage from './components/sales/EstimateManagementPage';
import SalesRanking from './components/accounting/SalesRanking';
import BusinessPlanPage from './components/accounting/BusinessPlanPage';
import ApprovalWorkflowPage from './components/accounting/ApprovalWorkflowPage';
import BusinessSupportPage from './components/BusinessSupportPage';
import AIChatPage from './components/AIChatPage';
import MarketResearchPage from './components/MarketResearchPage';
import AIArtifactsPage from './components/AIArtifactsPage';
import AIDataEntryPage from './components/AIDataEntryPage';
import { ToastContainer } from './components/Toast';
import ConfirmationDialog from './components/ConfirmationDialog';
import ManufacturingCostManagement from './components/accounting/ManufacturingCostManagement';
import AuditLogPage from './components/admin/AuditLogPage';
import JournalQueuePage from './components/admin/JournalQueuePage';
import MasterManagementPage from './components/admin/MasterManagementPage';
import DatabaseSetupInstructionsModal from './components/DatabaseSetupInstructionsModal';
import AIImageStudioPage from './components/AIImageStudioPage';
import AIImageGenerationPage from './components/AIImageGenerationPage';
import Chatbot from './components/Chatbot';
import BusinessAnalysisPage from './components/accounting/BusinessAnalysisPage';
// FIX: Named import for AITextToSpeechPage
import AITextToSpeechPage from './components/ai/AITextToSpeechPage';
// FIX: Named import for AIAudioTranscriptionPage
import AIAudioTranscriptionPage from './components/ai/AIAudioTranscriptionPage';
// FIX: Named import for AIVideoAnalysisPage
import AIVideoAnalysisPage from './components/ai/AIVideoAnalysisPage';
// FIX: Named import for AIVideoGenerationPage
import AIVideoGenerationPage from './components/ai/AIVideoGenerationPage';
// FIX: Named import for AIVideoTranscriptionPage
import AIVideoTranscriptionPage from './components/ai/AIVideoTranscriptionPage';
// FIX: Named import for AICopywritingPage
import AICopywritingPage from './components/ai/AICopywritingPage';
// FIX: Named import for PeriodClosingPage
import PeriodClosingPage from './components/accounting/PeriodClosingPage';
// FIX: Named import for AnalysisProjectsPage
import AnalysisProjectsPage from './components/accounting/AnalysisProjectsPage';
// FIX: Named import for ProjectDetailPage
import ProjectDetailPage from './components/accounting/ProjectDetailPage';
// FIX: Named import for AnalysisSimulationPage
import AnalysisSimulationPage from './components/accounting/AnalysisSimulationPage';


import * as dataService from './services/dataService';
import * as geminiService from './services/geminiService';
import { hasSupabaseCredentials } from './services/supabaseClient';

// FIX: Document type aliased to AppDocument to avoid collision with global Document
import { Page, Job, Customer, JournalEntry, User, AccountItem, Lead, ApprovalRoute, PurchaseOrder, InventoryItem, Employee, Toast, ConfirmationDialogProps, BugReport, Estimate, ApplicationWithDetails, Invoice, EmployeeUser, Department, PaymentRecipient, MasterAccountItem, AllocationDivision, Title, AIArtifact, AnalysisProject, Document as AppDocument, BankScenario, BankSimulation, UserActivityLog, InvoiceStatus } from './types';
import { PlusCircle, Loader, AlertTriangle, RefreshCw, Settings, MessageCircle } from './components/Icons';
import { createDemoDataState, DemoDataState } from './services/demoData'; // Import demo data and its type

const PAGE_TITLES: Record<Page, string> = {
    analysis_dashboard: 'ホーム',
    sales_leads: 'リード管理',
    sales_customers: '取引先管理',
    sales_pipeline: 'パイプライン（進捗）',
    sales_estimates: '見積管理',
    sales_orders: '案件・受注管理',
    sales_billing: '売上請求 (AR)',
    analysis_ranking: '売上ランキング',
    purchasing_orders: '発注 (PO)',
    purchasing_invoices: '仕入計上 (AP)',
    purchasing_payments: '支払管理',
    inventory_management: '在庫管理',
    manufacturing_orders: '製造指示',
    manufacturing_progress: '製造パイプライン',
    manufacturing_cost: '製造原価',
    hr_attendance: '勤怠',
    hr_man_hours: '工数',
    hr_labor_cost: '人件費配賦',
    approval_list: '承認一覧',
    approval_form_expense: '経費精算',
    approval_form_transport: '交通費申請',
    approval_form_leave: '休暇申請',
    approval_form_approval: '稟議',
    approval_form_daily: '日報',
    approval_form_weekly: '週報',
    accounting_journal: '仕訳帳',
    accounting_general_ledger: '総勘定元帳',
    accounting_trial_balance: '試算表',
    accounting_tax_summary: '消費税集計',
    accounting_period_closing: '締処理',
    accounting_business_plan: '経営計画',
    business_analysis: '経営分析',
    business_support_proposal: '提案書作成',
    ai_business_consultant: 'AIチャット',
    ai_market_research: 'AI市場調査',
    ai_artifacts: 'AIドキュメント',
    ai_data_entry: 'AIデータ入力',
    ai_image_studio: 'AI画像編集/分析',
    ai_image_generation: 'AIイラスト生成',
    ai_tts: 'AI音声合成',
    ai_audio_transcription: 'AI音声文字起こし',
    ai_video_analysis: 'AI動画分析',
    ai_video_generation: 'AI動画生成',
    ai_video_transcription: 'AI動画文字起こし',
    ai_copywriting: 'AI原稿作成',
    ai_prompt_history: 'AIプロンプト履歴', // Assuming this page exists from types, but not necessarily in sidebar
    admin_audit_log: 'マイアクティビティ',
    admin_journal_queue: 'ジャーナル・キュー',
    admin_user_management: 'ユーザー管理',
    admin_route_management: '承認ルート管理',
    admin_master_management: 'マスタ管理',
    admin_bug_reports: '改善要望一覧',
    settings: '設定',
    accounting_analysis_projects: '分析プロジェクト',
    accounting_project_detail: 'プロジェクト詳細',
    accounting_analysis_simulation: '財務シミュレーション',
};

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('analysis_dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [accountItems, setAccountItems] = useState<AccountItem[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [approvalRoutes, setApprovalRoutes] = useState<ApprovalRoute[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [allUsers, setAllUsers] = useState<EmployeeUser[]>([]);
    const [currentUser, setCurrentUser] = useState<EmployeeUser | null>(null);
    const [bugReports, setBugReports] = useState<BugReport[]>([]);
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [allocationDivisions, setAllocationDivisions] = useState<AllocationDivision[]>([]);
    const [employeeTitles, setEmployeeTitles] = useState<Title[]>([]);
    const [aiArtifacts, setAiArtifacts] = useState<AIArtifact[]>([]);
    const [userActivityLogs, setUserActivityLogs] = useState<UserActivityLog[]>([]);
    const [analysisProjects, setAnalysisProjects] = useState<AnalysisProject[]>([]);
    // FIX: Use AppDocument alias for Document
    const [documents, setDocuments] = useState<AppDocument[]>([]);
    const [bankScenarios, setBankScenarios] = useState<BankScenario[]>([]);
    const [bankSimulations, setBankSimulations] = useState<BankSimulation[]>([]);


    const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
    const [isJobDetailModalOpen, setIsJobDetailModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
    const [isCustomerDetailModalOpen, setIsCustomerDetailModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerDetailMode, setCustomerDetailMode] = useState<'view' | 'edit' | 'new'>('view');

    const [isCompanyAnalysisModalOpen, setIsCompanyAnalysisModalOpen] = useState(false);
    const [companyAnalysisResult, setCompanyAnalysisResult] = useState<any>(null);
    const [isCompanyAnalysisLoading, setIsCompanyAnalysisLoading] = useState(false);
    const [companyAnalysisError, setCompanyAnalysisError] = useState('');

    const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
    const [isCreateInventoryItemModalOpen, setIsCreateInventoryItemModalOpen] = useState(false);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
    const [isCreatePurchaseOrderModalOpen, setIsCreatePurchaseOrderModalOpen] = useState(false);

    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogProps & { isOpen: boolean }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }, onClose: () => { }
    });

    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isBugReportChatModalOpen, setIsBugReportChatModalOpen] = useState(false);

    const [isSupabaseConnected, setIsSupabaseConnected] = useState(hasSupabaseCredentials());
    const [showDatabaseSetupInstructions, setShowDatabaseSetupInstructions] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // FIX: Use process.env for environment variables
    const isDemoMode = useMemo(() => process.env.VITE_MODE === 'demo', []);
    const isAIOff = useMemo(() => process.env.VITE_AI_OFF === '1', []);

    const addToast = useCallback((message: string, type: Toast['type']) => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    }, []);

    const requestConfirmation = useCallback((dialog: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => {
        setConfirmationDialog({ ...dialog, isOpen: true, onClose: () => setConfirmationDialog(prev => ({ ...prev, isOpen: false })) });
    }, [setConfirmationDialog]);

    const fetchAllData = useCallback(async () => {
        if (isDemoMode) {
            const demoData: DemoDataState = createDemoDataState();
            setJobs(demoData.jobs);
            setCustomers(demoData.customers);
            setJournalEntries(demoData.journalEntries);
            setAccountItems(demoData.accountItems);
            setLeads(demoData.leads);
            setApprovalRoutes(demoData.approvalRoutes);
            setPurchaseOrders(demoData.purchaseOrders);
            setInventoryItems(demoData.inventoryItems);
            setEmployees(demoData.employees);
            setAllUsers(demoData.employeeUsers);
            setBugReports(demoData.bugReports);
            setEstimates(demoData.estimates);
            setApplications(demoData.applications);
            setInvoices(demoData.invoices);
            setDepartments(demoData.departments);
            // FIX: Access allocationDivisions correctly from demoData
            setAllocationDivisions(demoData.allocationDivisions);
            // FIX: Access titles correctly from demoData
            setEmployeeTitles(demoData.titles);
            // FIX: Access aiArtifacts correctly from demoData
            setAiArtifacts(demoData.aiArtifacts);
            setUserActivityLogs(demoData.userActivityLogs);
            setAnalysisProjects(demoData.analysisProjects);
            setDocuments(demoData.documents);
            setBankScenarios(demoData.bankScenarios);
            setBankSimulations(demoData.bankSimulations);

            if (!currentUser && demoData.employeeUsers.length > 0) {
                setCurrentUser(demoData.employeeUsers[0]);
            } else if (currentUser) {
                const updatedCurrentUser = demoData.employeeUsers.find(u => u.id === currentUser.id);
                if (updatedCurrentUser) setCurrentUser(updatedCurrentUser);
                else setCurrentUser(demoData.employeeUsers[0] || null);
            }
            setIsSupabaseConnected(true); // Treat as connected for UI purposes in demo mode
            setConnectionError(null);
            return;
        }

        // Production Mode Data Fetching
        if (!isSupabaseConnected) {
            setConnectionError("Supabase接続情報が設定されていません。");
            return;
        }

        try {
            setConnectionError(null);
            const [
                jobsData,
                customersData,
                journalEntriesData,
                accountItemsData,
                leadsData,
                approvalRoutesData,
                purchaseOrdersData,
                inventoryItemsData,
                employeesData,
                usersData,
                bugReportsData,
                estimatesData,
                applicationCodesData,
                invoicesData,
                departmentsData,
                allocationDivisionsData,
                employeeTitlesData,
                aiArtifactsData,
                analysisProjectsData,
            ] = await Promise.all([
                dataService.getJobs(),
                dataService.getCustomers(),
                dataService.getJournalEntries(),
                dataService.getAccountItems(),
                dataService.getLeads(),
                dataService.getApprovalRoutes(),
                dataService.getPurchaseOrders(),
                dataService.getInventoryItems(),
                dataService.getEmployees(),
                dataService.getUsers(),
                dataService.getBugReports(),
                dataService.getEstimates(),
                dataService.getApplicationCodes(),
                dataService.getInvoices(),
                dataService.getDepartments(),
                dataService.getAllocationDivisions(),
                dataService.getTitles(),
                dataService.getAIArtifacts(),
                dataService.getAnalysisProjects(),
            ]);

            setJobs(jobsData);
            setCustomers(customersData);
            setJournalEntries(journalEntriesData);
            setAccountItems(accountItemsData);
            setLeads(leadsData);
            setApprovalRoutes(approvalRoutesData);
            setPurchaseOrders(purchaseOrdersData);
            setInventoryItems(inventoryItemsData);
            setEmployees(employeesData);
            setAllUsers(usersData);
            setBugReports(bugReportsData);
            setEstimates(estimatesData);
            // FIX: Pass currentUser to getApplications
            setApplications(await dataService.getApplications(currentUser)); 
            setInvoices(invoicesData);
            setDepartments(departmentsData);
            setAllocationDivisions(allocationDivisionsData);
            setEmployeeTitles(employeeTitlesData);
            setAiArtifacts(aiArtifactsData);
            setAnalysisProjects(analysisProjectsData);

            if (currentUser) {
                setUserActivityLogs(await dataService.getUserActivityLogs(currentUser.id));
            }


            if (!currentUser && usersData.length > 0) {
                setCurrentUser(usersData[0]); // Select first user as default
            } else if (currentUser) {
                // Ensure currentUser object is up-to-date with fetched data
                const updatedCurrentUser = usersData.find(u => u.id === currentUser.id);
                if (updatedCurrentUser) {
                    setCurrentUser(updatedCurrentUser);
                } else {
                    // Current user might have been deleted or deactivated
                    setCurrentUser(usersData[0] || null);
                }
            }


        } catch (err: any) {
            console.error("Failed to fetch all data:", err);
            if (dataService.isSupabaseUnavailableError(err)) {
                setConnectionError("Supabaseに接続できません。認証情報を確認してください。");
            } else {
                setConnectionError(err.message || "データの読み込み中に不明なエラーが発生しました。");
            }
            setIsSupabaseConnected(false); // Assume connection issue
            addToast('データの読み込みに失敗しました。', 'error');
        }
    }, [isSupabaseConnected, currentUser, addToast, isDemoMode]);

    useEffect(() => {
        if (isSupabaseConnected || isDemoMode) {
            fetchAllData();
        }
    }, [isSupabaseConnected, fetchAllData, isDemoMode]);

    const handleUserChange = (user: EmployeeUser | null) => {
        setCurrentUser(user);
        addToast(`${user?.name}にユーザーを切り替えました。`, 'info');
        // Refresh data specific to the user, like applications and audit logs
        fetchAllData();
    };

    const handleRefreshData = useCallback(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleAddJob = useCallback(async (jobData: Omit<Job, 'id' | 'createdAt' | 'jobNumber'>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.addJob(jobData);
        addToast('案件が正常に追加されました。', 'success');
        handleRefreshData();
        setIsCreateJobModalOpen(false);
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleUpdateJob = useCallback(async (jobId: string, updatedData: Partial<Job>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.updateJob(jobId, updatedData);
        addToast('案件が正常に更新されました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleDeleteJob = useCallback(async (jobId: string) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.deleteJob(jobId);
        addToast('案件が正常に削除されました。', 'success');
        handleRefreshData();
        setIsJobDetailModalOpen(false);
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleAddCustomer = useCallback(async (customerData: Partial<Customer>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.addCustomer(customerData);
        addToast('顧客が正常に追加されました。', 'success');
        handleRefreshData();
        setIsCreateCustomerModalOpen(false);
        setCustomerDetailMode('view');
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleUpdateCustomer = useCallback(async (customerId: string, updatedData: Partial<Customer>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.updateCustomer(customerId, updatedData);
        addToast('顧客情報が正常に更新されました。', 'success');
        handleRefreshData();
        setCustomerDetailMode('view');
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleAddJournalEntry = useCallback(async (entryData: Omit<JournalEntry, 'id'>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        // FIX: Ensure date is properly added if omitted in the type
        await dataService.addJournalEntry({ ...entryData, date: new Date().toISOString().split('T')[0] });
        addToast('仕訳が正常に追加されました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleAddLead = useCallback(async (leadData: Partial<Lead>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.addLead(leadData);
        addToast('リードが正常に追加されました。', 'success');
        handleRefreshData();
        setIsCreateLeadModalOpen(false);
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleUpdateLead = useCallback(async (leadId: string, updatedData: Partial<Lead>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.updateLead(leadId, updatedData);
        addToast('リードが正常に更新されました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleDeleteLead = useCallback(async (leadId: string) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.deleteLead(leadId);
        addToast('リードが正常に削除されました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleUpdateBugReport = useCallback(async (id: string, updates: Partial<BugReport>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.updateBugReport(id, updates);
        addToast('改善要望を更新しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleAddBugReport = useCallback(async (report: Omit<BugReport, 'id' | 'created_at' | 'status' | 'reporter_name'>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        await dataService.addBugReport({ ...report, reporterName: currentUser.name });
        addToast('改善要望を送信しました。ありがとうございます！', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, currentUser, isDemoMode]);

    const handleAddEstimate = useCallback(async (estimate: Partial<Estimate>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.addEstimate(estimate);
        addToast('見積を保存しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleUpdateEstimate = useCallback(async (id: string, estimateData: Partial<Estimate>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.updateEstimate(id, estimateData);
        addToast('見積を更新しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleMarkJobInvoiceStatus = useCallback(async (jobId: string, status: InvoiceStatus) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.updateJob(jobId, { invoiceStatus: status, invoicedAt: new Date().toISOString() });
        addToast('案件の請求ステータスを更新しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleMarkInvoicePaid = useCallback(async (invoice: Invoice) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.updateInvoice(invoice.id, { status: 'paid', paidAt: new Date().toISOString() });
        // Also update related jobs
        for (const item of (invoice.items || [])) {
            if (item.jobId) {
                await dataService.updateJob(item.jobId, { paidAt: new Date().toISOString() });
            }
        }
        addToast(`請求書 ${invoice.invoiceNo} が入金済みになりました。`, 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);


    const handleAddPurchaseOrder = useCallback(async (order: Omit<PurchaseOrder, 'id'>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.addPurchaseOrder(order);
        addToast('発注が正常に追加されました。', 'success');
        handleRefreshData();
        setIsCreatePurchaseOrderModalOpen(false);
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleSaveInventoryItem = useCallback(async (itemData: Partial<InventoryItem>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        if (itemData.id) {
            await dataService.updateInventoryItem(itemData.id, itemData);
            addToast('在庫品目が更新されました。', 'success');
        } else {
            await dataService.addInventoryItem(itemData as Omit<InventoryItem, 'id'>);
            addToast('新規在庫品目が追加されました。', 'success');
        }
        handleRefreshData();
        setIsCreateInventoryItemModalOpen(false);
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleSaveAccountItem = useCallback(async (item: Partial<AccountItem>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.saveAccountItem(item);
        addToast('勘定科目を保存しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleDeleteAccountItem = useCallback(async (id: string) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.deactivateAccountItem(id);
        addToast('勘定科目を無効化しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleSavePaymentRecipient = useCallback(async (item: Partial<PaymentRecipient>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.savePaymentRecipient(item);
        addToast('支払先を保存しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleDeletePaymentRecipient = useCallback(async (id: string) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.deletePaymentRecipient(id);
        addToast('支払先を削除しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);
    
    const handleSaveAllocationDivision = useCallback(async (item: Partial<AllocationDivision>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.saveAllocationDivision(item);
        addToast('振分区分を保存しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleDeleteAllocationDivision = useCallback(async (id: string) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.deleteAllocationDivision(id);
        addToast('振分区分を削除しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleSaveDepartment = useCallback(async (item: Partial<Department>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.saveDepartment(item);
        addToast('部署を保存しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleDeleteDepartment = useCallback(async (id: string) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.deleteDepartment(id);
        addToast('部署を削除しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleSaveTitle = useCallback(async (item: Partial<Title>) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.saveTitle(item);
        addToast('役職を保存しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);

    const handleDeleteTitle = useCallback(async (id: string) => {
        if (isDemoMode) { addToast('デモモードでは変更は保存されません。', 'info'); return; }
        await dataService.deleteTitle(id);
        addToast('役職を削除しました。', 'success');
        handleRefreshData();
    }, [addToast, handleRefreshData, isDemoMode]);


    const headerPrimaryAction = useMemo(() => {
        switch (currentPage) {
            case 'sales_orders':
                return { label: '新規案件作成', onClick: () => setIsCreateJobModalOpen(true), icon: PlusCircle };
            case 'sales_customers':
                return { label: '新規顧客登録', onClick: () => { setIsCreateCustomerModalOpen(true); setCustomerDetailMode('new'); }, icon: PlusCircle };
            case 'sales_leads':
                return { label: '新規リード作成', onClick: () => setIsCreateLeadModalOpen(true), icon: PlusCircle };
            case 'purchasing_orders':
                return { label: '新規発注作成', onClick: () => setIsCreatePurchaseOrderModalOpen(true), icon: PlusCircle };
            case 'inventory_management':
                return { label: '新規品目登録', onClick: () => { setSelectedInventoryItem(null); setIsCreateInventoryItemModalOpen(true); }, icon: PlusCircle };
            case 'admin_bug_reports':
                return { label: '改善要望を送信', onClick: () => setIsBugReportChatModalOpen(true), icon: MessageCircle };
            case 'sales_estimates':
                return { label: '新規見積作成', onClick: () => setCurrentPage('sales_estimates'), icon: PlusCircle };
            case 'accounting_analysis_projects':
                return { label: '新規プロジェクト作成', onClick: () => setIsCreateJobModalOpen(true), icon: PlusCircle }; // Re-using job modal state temporarily
            default:
                return undefined;
        }
    }, [currentPage]);

    const renderPage = useCallback(() => {
        switch (currentPage) {
            case 'analysis_dashboard':
                const pendingApprovalCount = applications.filter(app => app.approverId === currentUser?.id && app.status === 'pending_approval').length;
                return <Dashboard jobs={jobs} journalEntries={journalEntries} accountItems={accountItems} pendingApprovalCount={pendingApprovalCount} onNavigateToApprovals={() => setCurrentPage('approval_list')} isAIOff={isAIOff} />;
            case 'sales_orders':
                return <JobList jobs={jobs} searchTerm={searchTerm} onSelectJob={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} onNewJob={() => setIsCreateJobModalOpen(true)} />;
            case 'sales_customers':
                return <CustomerList customers={customers} searchTerm={searchTerm} onSelectCustomer={(customer) => { setSelectedCustomer(customer); setIsCustomerDetailModalOpen(true); setCustomerDetailMode('view'); }} onUpdateCustomer={handleUpdateCustomer} onAnalyzeCustomer={(customer) => { setSelectedCustomer(customer); setIsCompanyAnalysisModalOpen(true); setCompanyAnalysisResult(customer.aiAnalysis || null); setCompanyAnalysisError(''); }} currentUser={currentUser} onNewCustomer={() => { setIsCreateCustomerModalOpen(true); setCustomerDetailMode('new'); }} addToast={addToast} isAIOff={isAIOff} />;
            case 'sales_leads':
                return <LeadManagementPage leads={leads} searchTerm={searchTerm} onRefresh={handleRefreshData} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} addToast={addToast} requestConfirmation={requestConfirmation} currentUser={currentUser} isAIOff={isAIOff} onAddEstimate={handleAddEstimate} />;
            case 'sales_pipeline':
                return <SalesPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} />;
            case 'sales_estimates':
                return <EstimateManagementPage estimates={estimates} customers={customers} allUsers={allUsers} onAddEstimate={handleAddEstimate} onUpdateEstimate={handleUpdateEstimate} addToast={addToast} currentUser={currentUser} searchTerm={searchTerm} isAIOff={isAIOff} />;
            case 'sales_billing':
                return <AccountingPage page={currentPage} jobs={jobs} onRefreshData={handleRefreshData} onMarkPaid={handleMarkInvoicePaid} />;
            case 'analysis_ranking':
                return <SalesRanking jobs={jobs} />;
            case 'purchasing_orders':
                return <PurchasingManagementPage purchaseOrders={purchaseOrders} />;
            case 'purchasing_invoices':
                return <AccountingPage page={currentPage} onAddEntry={handleAddJournalEntry} addToast={addToast} requestConfirmation={requestConfirmation} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'purchasing_payments':
                return <AccountingPage page={currentPage} journalEntries={journalEntries} onExecutePayment={handleAddJournalEntry} />;
            case 'inventory_management':
                return <InventoryManagementPage inventoryItems={inventoryItems} onSelectItem={(item) => { setSelectedInventoryItem(item); setIsCreateInventoryItemModalOpen(true); }} />;
            case 'manufacturing_orders':
                return <ManufacturingOrdersPage jobs={jobs} onSelectJob={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} />;
            case 'manufacturing_progress':
                return <ManufacturingPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} />;
            case 'manufacturing_cost':
                return <ManufacturingCostManagement jobs={jobs} />;
            case 'hr_attendance':
            case 'hr_man_hours':
                return <PlaceholderPage title={PAGE_TITLES[currentPage]} />;
            case 'hr_labor_cost':
                return <AccountingPage page={currentPage} employees={employees} />;
            case 'approval_list':
            case 'approval_form_expense':
            case 'approval_form_transport':
            case 'approval_form_leave':
            case 'approval_form_approval':
            case 'approval_form_daily':
            case 'approval_form_weekly':
                return <ApprovalWorkflowPage
                    view={currentPage === 'approval_list' ? 'list' : 'form'}
                    formCode={currentPage.replace('approval_form_', '')}
                    applications={applications}
                    currentUser={currentUser}
                    searchTerm={searchTerm}
                    addToast={addToast}
                    onRefresh={handleRefreshData}
                    customers={customers}
                    accountItems={accountItems}
                    jobs={jobs}
                    purchaseOrders={purchaseOrders}
                    departments={departments}
                    isAIOff={isAIOff}
                    allocationDivisions={allocationDivisions}
                />;
            case 'accounting_journal':
                return <AccountingPage page={currentPage} journalEntries={journalEntries} onAddEntry={handleAddJournalEntry} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'accounting_general_ledger':
                return <AccountingPage page={currentPage} journalEntries={journalEntries} accountItems={accountItems} />;
            case 'accounting_trial_balance':
                return <AccountingPage page={currentPage} journalEntries={journalEntries} />;
            case 'accounting_tax_summary':
                return <PlaceholderPage title={PAGE_TITLES[currentPage]} />;
            case 'accounting_period_closing':
                return <PeriodClosingPage addToast={addToast} jobs={jobs} applications={applications} journalEntries={journalEntries} onNavigate={setCurrentPage} currentUser={currentUser} />;
            case 'accounting_business_plan':
                return <BusinessPlanPage allUsers={allUsers} />;
            case 'business_analysis':
                return <BusinessAnalysisPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'business_support_proposal':
                return <BusinessSupportPage customers={customers} jobs={jobs} estimates={estimates} currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} />;
            case 'ai_business_consultant':
                return <AIChatPage currentUser={currentUser} jobs={jobs} customers={customers} journalEntries={journalEntries} />;
            case 'ai_market_research':
                return <MarketResearchPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'ai_artifacts':
                return <AIArtifactsPage artifacts={aiArtifacts} allUsers={allUsers} searchTerm={searchTerm} />;
            case 'ai_data_entry':
                return <AIDataEntryPage customers={customers} onAddLead={handleAddLead} onUpdateCustomer={handleUpdateCustomer} onAddJob={handleAddJob} addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'ai_image_studio':
                return <AIImageStudioPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'ai_image_generation':
                return <AIImageGenerationPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'ai_tts':
                return <AITextToSpeechPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'ai_audio_transcription':
                return <AIAudioTranscriptionPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'ai_video_analysis':
                return <AIVideoAnalysisPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'ai_video_generation':
                return <AIVideoGenerationPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'ai_video_transcription':
                return <AIVideoTranscriptionPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'ai_copywriting':
                return <AICopywritingPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'ai_prompt_history':
                // FIX: AuditLogPage handles internal filtering
                return <AuditLogPage logs={userActivityLogs} />;
            case 'admin_audit_log':
                return <AuditLogPage logs={userActivityLogs} />;
            case 'admin_journal_queue':
                return <JournalQueuePage />;
            case 'admin_user_management':
                return <UserManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
            case 'admin_route_management':
                return <ApprovalRouteManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
            case 'admin_master_management':
                return <MasterManagementPage
                    accountItems={accountItems}
                    paymentRecipients={[]} // Assuming this will be fetched separately if needed
                    allocationDivisions={allocationDivisions}
                    departments={departments}
                    titles={employeeTitles}
                    onSaveAccountItem={handleSaveAccountItem}
                    onDeleteAccountItem={handleDeleteAccountItem}
                    onSavePaymentRecipient={handleSavePaymentRecipient}
                    onDeletePaymentRecipient={handleDeletePaymentRecipient}
                    onSaveAllocationDivision={handleSaveAllocationDivision}
                    onDeleteAllocationDivision={handleDeleteAllocationDivision}
                    onSaveDepartment={handleSaveDepartment}
                    onDeleteDepartment={handleDeleteDepartment}
                    onSaveTitle={handleSaveTitle}
                    onDeleteTitle={handleDeleteTitle}
                    addToast={addToast}
                    requestConfirmation={requestConfirmation}
                />;
            case 'admin_bug_reports':
                return <BugReportList reports={bugReports} onUpdateReport={handleUpdateBugReport} searchTerm={searchTerm} />;
            case 'settings':
                return <SettingsPage addToast={addToast} />;
            case 'accounting_analysis_projects':
                return <AnalysisProjectsPage projects={analysisProjects} onRefresh={handleRefreshData} currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} />;
            case 'accounting_project_detail': // This will need a project ID, currently not passed via navigation
                 const projectId = 'some-project-id'; // This needs to come from router/state
                 const selectedProject = analysisProjects.find(p => p.id === projectId);
                 if (!selectedProject) return <PlaceholderPage title="プロジェクト詳細" message="プロジェクトが見つかりません。" />;
                return <ProjectDetailPage projectId={projectId} projectName={selectedProject.name} onBack={() => setCurrentPage('accounting_analysis_projects')} currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} />;
            case 'accounting_analysis_simulation':
                return <AnalysisSimulationPage documents={documents} scenarios={bankScenarios} simulations={bankSimulations} onRefresh={handleRefreshData} currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} />;

            default:
                return <PlaceholderPage title={PAGE_TITLES[currentPage] || '未定義ページ'} />;
        }
    }, [
        currentPage, searchTerm, jobs, customers, journalEntries, accountItems, leads,
        approvalRoutes, purchaseOrders, inventoryItems, employees, allUsers, currentUser,
        bugReports, estimates, applications, invoices, departments, allocationDivisions, employeeTitles, aiArtifacts, userActivityLogs, analysisProjects, documents, bankScenarios, bankSimulations,
        addToast, requestConfirmation, handleAddJob, handleUpdateJob, handleDeleteJob,
        handleAddCustomer, handleUpdateCustomer, handleAddJournalEntry, handleAddLead,
        handleUpdateLead, handleDeleteLead, handleUpdateBugReport, handleAddEstimate,
        handleUpdateEstimate, handleMarkJobInvoiceStatus, handleMarkInvoicePaid,
        handleAddPurchaseOrder, handleSaveInventoryItem, handleSaveAccountItem, handleDeleteAccountItem,
        handleSavePaymentRecipient, handleDeletePaymentRecipient, handleSaveAllocationDivision,
        handleDeleteAllocationDivision, handleSaveDepartment, handleDeleteDepartment,
        handleSaveTitle, handleDeleteTitle, isAIOff, isDemoMode, handleRefreshData
    ]);

    // Conditional rendering for the main app or setup instructions
    if (!isSupabaseConnected && !showDatabaseSetupInstructions && !isDemoMode) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
                <dataService.SupabaseCredentialsModal
                    onRetry={() => {
                        setIsSupabaseConnected(hasSupabaseCredentials()); // Re-check credentials
                        setShowDatabaseSetupInstructions(false); // Hide instructions
                        if (hasSupabaseCredentials()) {
                            addToast("Supabase認証情報を検出しました。データを読み込み中...", "info");
                        } else {
                            addToast("Supabase認証情報が見つからないか、不完全です。", "error");
                        }
                    }}
                    onShowSetup={() => setShowDatabaseSetupInstructions(true)}
                />
            </div>
        );
    }
    if (showDatabaseSetupInstructions && !isDemoMode) {
        return (
            <DatabaseSetupInstructionsModal onRetry={() => {
                setShowDatabaseSetupInstructions(false);
                setIsSupabaseConnected(hasSupabaseCredentials());
            }} />
        );
    }


    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
            <Sidebar
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                currentUser={currentUser}
                allUsers={allUsers}
                onUserChange={handleUserChange}
            />
            <main className="flex-1 p-8 overflow-y-auto">
                {connectionError && !isDemoMode && (
                    <div className="bg-red-100 dark:bg-red-900/50 border-b-2 border-red-400 dark:border-red-600 p-4 flex items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-red-800 dark:text-red-200">データベース接続エラー</h3>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    {connectionError}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => fetchAllData()}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                再接続
                            </button>
                            <button
                                onClick={() => setShowDatabaseSetupInstructions(true)}
                                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold text-sm py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                設定ガイド
                            </button>
                        </div>
                    </div>
                )}
                {isDemoMode && (
                    <dataService.DemoModeBanner
                        error={connectionError} // Can still show demo mode connection issues
                        onRetry={() => {
                            setIsSupabaseConnected(hasSupabaseCredentials());
                            setConnectionError(null);
                        }}
                        onShowSetup={() => setShowDatabaseSetupInstructions(true)}
                    />
                )}
                <Header
                    title={PAGE_TITLES[currentPage]}
                    primaryAction={headerPrimaryAction}
                    search={{
                        value: searchTerm,
                        onChange: setSearchTerm,
                        placeholder: '検索...',
                    }}
                />
                <div className="mt-8">
                    {renderPage()}
                </div>
            </main>

            <CreateJobModal
                isOpen={isCreateJobModalOpen}
                onClose={() => setIsCreateJobModalOpen(false)}
                onAddJob={handleAddJob}
                addToast={addToast}
                currentUser={currentUser}
            />
            <JobDetailModal
                job={selectedJob}
                isOpen={isJobDetailModalOpen}
                onClose={() => setIsJobDetailModalOpen(false)}
                onUpdateJob={handleUpdateJob}
                onDeleteJob={handleDeleteJob}
                requestConfirmation={requestConfirmation}
                onNavigate={setCurrentPage}
                addToast={addToast}
            />
            <CustomerDetailModal
                customer={selectedCustomer}
                isOpen={isCustomerDetailModalOpen}
                onClose={() => { setIsCustomerDetailModalOpen(false); setSelectedCustomer(null); setCustomerDetailMode('view'); }}
                // FIX: onSave expects a Partial<Customer> and needs to handle both add and update
                onSave={ (customerData) => customerData.id ? handleUpdateCustomer(customerData.id, customerData) : handleAddCustomer(customerData) }
                mode={customerDetailMode}
                onSetMode={setCustomerDetailMode}
                onAnalyzeCustomer={(customer) => { setSelectedCustomer(customer); setIsCompanyAnalysisModalOpen(true); setCompanyAnalysisResult(customer.aiAnalysis || null); setCompanyAnalysisError(''); }}
                isAIOff={isAIOff}
                addToast={addToast}
            />
            <CompanyAnalysisModal
                isOpen={isCompanyAnalysisModalOpen}
                onClose={() => { setIsCompanyAnalysisModalOpen(false); setCompanyAnalysisResult(null); setCompanyAnalysisError(''); }}
                analysis={companyAnalysisResult}
                customer={selectedCustomer}
                isLoading={isCompanyAnalysisLoading}
                error={companyAnalysisError}
                currentUser={currentUser}
                isAIOff={isAIOff}
                onReanalyze={async (customer) => {
                    setIsCompanyAnalysisLoading(true);
                    setCompanyAnalysisError('');
                    try {
                        const result = await geminiService.analyzeCompany(customer, currentUser?.id || 'anonymous');
                        await dataService.updateCustomer(customer.id, { aiAnalysis: result });
                        setCompanyAnalysisResult(result);
                        addToast('AI企業分析を更新しました。', 'success');
                    } catch (e) {
                        setCompanyAnalysisError(e instanceof Error ? e.message : '分析中にエラーが発生しました。');
                        addToast('AI企業分析の更新に失敗しました。', 'error');
                    } finally {
                        setIsCompanyAnalysisLoading(false);
                        handleRefreshData(); // Refresh customer data to get updated aiAnalysis
                    }
                }}
            />
            <CreateLeadModal
                isOpen={isCreateLeadModalOpen}
                onClose={() => setIsCreateLeadModalOpen(false)}
                onAddLead={handleAddLead}
                addToast={addToast}
            />
            <CreatePurchaseOrderModal
                isOpen={isCreatePurchaseOrderModalOpen}
                onClose={() => setIsCreatePurchaseOrderModalOpen(false)}
                onAddPurchaseOrder={handleAddPurchaseOrder}
            />
            <CreateInventoryItemModal
                isOpen={isCreateInventoryItemModalOpen}
                onClose={() => setIsCreateInventoryItemModalOpen(false)}
                onSave={handleSaveInventoryItem}
                item={selectedInventoryItem}
            />
            <BugReportChatModal
                isOpen={isBugReportChatModalOpen}
                onClose={() => setIsBugReportChatModalOpen(false)}
                onReportSubmit={handleAddBugReport}
                isAIOff={isAIOff}
            />

            <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
            <ConfirmationDialog {...confirmationDialog} />

            {/* Chatbot Toggle Button */}
            <button
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 z-50"
                aria-label="Open AI Chatbot"
            >
                <MessageCircle className="w-8 h-8" />
            </button>

            {isChatbotOpen && <Chatbot onClose={() => setIsChatbotOpen(false)} isAIOff={isAIOff} currentUser={currentUser} />}
        </div>
    );
};

export default App;