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
import { ApprovalWorkflowPage } from './components/accounting/ApprovalWorkflowPage';
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
import AITextToSpeechPage from './components/ai/AITextToSpeechPage';
import AIAudioTranscriptionPage from './components/ai/AIAudioTranscriptionPage';
import AIVideoAnalysisPage from './components/ai/AIVideoAnalysisPage';
import AIVideoGenerationPage from './components/ai/AIVideoGenerationPage';
import AIVideoTranscriptionPage from './components/ai/AIVideoTranscriptionPage';
import AICopywritingPage from './components/ai/AICopywritingPage';
import PeriodClosingPage from './components/accounting/PeriodClosingPage';
import AnalysisProjectsPage from './components/accounting/AnalysisProjectsPage';
import ProjectDetailPage from './components/accounting/ProjectDetailPage';
import AnalysisSimulationPage from './components/accounting/AnalysisSimulationPage';
// FIX: Added missing import for BillingManagement
import BillingManagement from './components/accounting/BillingManagement';


import * as dataService from './services/dataService';
import * as geminiService from './services/geminiService';
import { hasSupabaseCredentials } from './services/supabaseClient';

// FIX: Document type aliased to AppDocument to avoid collision with global Document
import { Page, Job, Customer, JournalEntry, User, AccountItem, Lead, ApprovalRoute, PurchaseOrder, InventoryItem, Employee, Toast, ConfirmationDialogProps, BugReport, Estimate, ApplicationWithDetails, Invoice, EmployeeUser, Department, PaymentRecipient, MasterAccountItem, AllocationDivision, Title, AIArtifact, AnalysisProject, AppDocument, BankScenario, BankSimulation, UserActivityLog, InvoiceStatus } from './types';
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
    manufacturing_progress: '製造パイプライン（進捗）',
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

export const App: React.FC = () => {
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
    // FIX: Add paymentRecipients state
    const [paymentRecipients, setPaymentRecipients] = useState<PaymentRecipient[]>([]);


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
            // FIX: Access paymentRecipients from demoData
            setPaymentRecipients(demoData.paymentRecipients);


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
                // FIX: Add getPaymentRecipients to promise all
                paymentRecipientsData,
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
                // FIX: Add getPaymentRecipients to promise all
                dataService.getPaymentRecipients(),
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
            // FIX: Set paymentRecipients data
            setPaymentRecipients(paymentRecipientsData);

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
            setConnectionError(dataService.isSupabaseUnavailableError(err) ? "データベースに接続できません。設定を確認してください。" : err.message || "データの読み込み中にエラーが発生しました。");
            setIsSupabaseConnected(false);
            if (dataService.isSupabaseUnavailableError(err)) {
                setShowDatabaseSetupInstructions(true);
            }
        } finally {
            // Additional data for projects (documents, scenarios, simulations) is fetched within ProjectDetailPage
            // No need to fetch here at the top level
        }
    }, [isDemoMode, isSupabaseConnected, currentUser]); // currentUser in dependency array for getApplications

    useEffect(() => {
        fetchAllData();
        const intervalId = setInterval(fetchAllData, 60000); // Refresh every 60 seconds
        return () => clearInterval(intervalId);
    }, [fetchAllData]);

    const handleNavigate = useCallback((page: Page) => {
        setCurrentPage(page);
        setSearchTerm(''); // Clear search term on page navigation
    }, []);

    const pageTitle = PAGE_TITLES[currentPage];

    const primaryAction = useMemo(() => {
        if (currentPage === 'sales_leads') {
            return {
                label: '新規リード作成',
                onClick: () => setIsCreateLeadModalOpen(true),
                icon: PlusCircle,
            };
        } else if (currentPage === 'sales_customers') {
            return {
                label: '新規顧客登録',
                onClick: () => { setSelectedCustomer(null); setCustomerDetailMode('new'); setIsCustomerDetailModalOpen(true); },
                icon: PlusCircle,
            };
        } else if (currentPage === 'sales_orders') {
            return {
                label: '新規案件作成',
                onClick: () => setIsCreateJobModalOpen(true),
                icon: PlusCircle,
            };
        } else if (currentPage === 'inventory_management') {
            return {
                label: '新規品目登録',
                onClick: () => setIsCreateInventoryItemModalOpen(true), // For creating new item
                icon: PlusCircle,
            };
        } else if (currentPage === 'purchasing_orders') {
            return {
                label: '新規発注作成',
                onClick: () => setIsCreatePurchaseOrderModalOpen(true),
                icon: PlusCircle,
            };
        }
        return undefined;
    }, [currentPage]);
    
    const handleAddJob = useCallback(async (jobData: Omit<Job, 'id' | 'createdAt' | 'jobNumber'>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.addJob(jobData);
            addToast('案件を追加しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'job_added', { title: jobData.title, clientName: jobData.clientName });
            await fetchAllData();
        } catch (error: any) {
            addToast(`案件の追加に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleUpdateJob = useCallback(async (jobId: string, updatedData: Partial<Job>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.updateJob(jobId, updatedData);
            addToast('案件を更新しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'job_updated', { jobId, updates: updatedData });
            await fetchAllData();
        } catch (error: any) {
            addToast(`案件の更新に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleDeleteJob = useCallback(async (jobId: string) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.deleteJob(jobId);
            addToast('案件を削除しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'job_deleted', { jobId });
            await fetchAllData();
        } catch (error: any) {
            addToast(`案件の削除に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleAddCustomer = useCallback(async (customerData: Partial<Customer>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.addCustomer(customerData);
            addToast('顧客を登録しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'customer_added', { customerName: customerData.customerName });
            await fetchAllData();
            setIsCustomerDetailModalOpen(false);
            setCustomerDetailMode('view');
        } catch (error: any) {
            addToast(`顧客の登録に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleUpdateCustomer = useCallback(async (customerId: string, updatedData: Partial<Customer>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.updateCustomer(customerId, updatedData);
            addToast('顧客情報を更新しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'customer_updated', { customerId, updates: updatedData });
            await fetchAllData();
            setIsCustomerDetailModalOpen(false);
            setCustomerDetailMode('view');
        } catch (error: any) {
            addToast(`顧客情報の更新に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleAnalyzeCustomer = useCallback(async (customer: Customer) => {
        if (isAIOff) {
            addToast('AI機能は現在無効です。', 'error');
            return;
        }
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        setIsCompanyAnalysisModalOpen(true);
        setIsCompanyAnalysisLoading(true);
        setCompanyAnalysisError('');
        setCompanyAnalysisResult(null);
        try {
            const analysis = await geminiService.analyzeCompany(customer, currentUser.id);
            setCompanyAnalysisResult(analysis);
            await dataService.updateCustomer(customer.id, { aiAnalysis: analysis });
            addToast('企業分析が完了しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'ai_company_analysis_completed', { customerId: customer.id });
        } catch (error: any) {
            setCompanyAnalysisError(error.message || 'AI企業分析に失敗しました。');
            addToast(`AI企業分析に失敗しました: ${error.message}`, 'error');
            await dataService.logUserActivity(currentUser.id, 'ai_company_analysis_failed', { customerId: customer.id, error: error.message });
        } finally {
            setIsCompanyAnalysisLoading(false);
        }
    }, [addToast, isAIOff, currentUser]);

    const handleAddLead = useCallback(async (leadData: Partial<Lead>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.addLead(leadData);
            addToast('リードを追加しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'lead_added', { company: leadData.company, name: leadData.name });
            await fetchAllData();
            setIsCreateLeadModalOpen(false);
        } catch (error: any) {
            addToast(`リードの追加に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleUpdateLead = useCallback(async (leadId: string, updatedData: Partial<Lead>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.updateLead(leadId, updatedData);
            addToast('リードを更新しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'lead_updated', { leadId, updates: updatedData });
            await fetchAllData();
        } catch (error: any) {
            addToast(`リードの更新に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleDeleteLead = useCallback(async (leadId: string) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.deleteLead(leadId);
            addToast('リードを削除しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'lead_deleted', { leadId });
            await fetchAllData();
        } catch (error: any) {
            addToast(`リードの削除に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleAddEntry = useCallback(async (entryData: Omit<JournalEntry, 'id' | 'date'>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.addJournalEntry({ ...entryData, date: new Date().toISOString().split('T')[0] });
            addToast('仕訳を追加しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'journal_entry_added', { account: entryData.account, debit: entryData.debit, credit: entryData.credit });
            await fetchAllData();
        } catch (error: any) {
            addToast(`仕訳の追加に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleAddPurchaseOrder = useCallback(async (orderData: Omit<PurchaseOrder, 'id'>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.addPurchaseOrder(orderData);
            addToast('発注を追加しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'purchase_order_added', { supplierName: orderData.supplierName, itemName: orderData.itemName });
            await fetchAllData();
            setIsCreatePurchaseOrderModalOpen(false);
        } catch (error: any) {
            addToast(`発注の追加に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleAddInventoryItem = useCallback(async (itemData: Omit<InventoryItem, 'id'>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.addInventoryItem(itemData);
            addToast('在庫品目を追加しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'inventory_item_added', { name: itemData.name });
            await fetchAllData();
            setIsCreateInventoryItemModalOpen(false);
        } catch (error: any) {
            addToast(`在庫品目の追加に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleUpdateInventoryItem = useCallback(async (itemId: string, itemData: Partial<InventoryItem>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.updateInventoryItem(itemId, itemData);
            addToast('在庫品目を更新しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'inventory_item_updated', { itemId, updates: itemData });
            await fetchAllData();
            setIsCreateInventoryItemModalOpen(false); // Close modal after saving
            setSelectedInventoryItem(null); // Clear selected item
        } catch (error: any) {
            addToast(`在庫品目の更新に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleMarkInvoicePaid = useCallback(async (invoice: Invoice) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.updateInvoice(invoice.id, { status: InvoiceStatus.Paid, paidAt: new Date().toISOString() });
            addToast('請求書を入金済みにしました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'invoice_paid', { invoiceId: invoice.id });
            await fetchAllData();
        } catch (error: any) {
            addToast(`請求書の更新に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleAddBugReport = useCallback(async (report: Omit<BugReport, 'id' | 'created_at' | 'status' | 'reporter_name'>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.addBugReport({ ...report, reporterName: currentUser.name });
            addToast('ご報告ありがとうございます！', 'success');
            await dataService.logUserActivity(currentUser.id, 'bug_report_added', { summary: report.summary, type: report.reportType });
            await fetchAllData();
            setIsBugReportChatModalOpen(false);
        } catch (error: any) {
            addToast(`報告の送信に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleUpdateBugReport = useCallback(async (id: string, updates: Partial<BugReport>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.updateBugReport(id, updates);
            addToast('報告を更新しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'bug_report_updated', { reportId: id, updates });
            await fetchAllData();
        } catch (error: any) {
            addToast(`報告の更新に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleAddEstimate = useCallback(async (estimateData: Partial<Estimate>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.addEstimate({ ...estimateData, createdBy: currentUser.id });
            addToast('見積を保存しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'estimate_added', { title: estimateData.title, customerName: estimateData.customerName });
            await fetchAllData();
        } catch (error: any) {
            addToast(`見積の保存に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleUpdateEstimate = useCallback(async (id: string, estimateData: Partial<Estimate>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.updateEstimate(id, { ...estimateData, createdBy: currentUser.id });
            addToast('見積を更新しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'estimate_updated', { id, title: estimateData.title, customerName: estimateData.customerName });
            await fetchAllData();
        } catch (error: any) {
            addToast(`見積の更新に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    // Conditional rendering for content based on page state
    const renderContent = () => {
        if (showDatabaseSetupInstructions) {
            return (
                <DatabaseSetupInstructionsModal
                    onRetry={() => {
                        setShowDatabaseSetupInstructions(false);
                        setIsSupabaseConnected(hasSupabaseCredentials()); // Re-check credentials
                        if (hasSupabaseCredentials()) fetchAllData(); // Try fetching data again
                    }}
                />
            );
        }

        if (!isSupabaseConnected && !isDemoMode) { // Only show loading/error if not in demo mode
            return (
                <div className="flex flex-col items-center justify-center min-h-screen-minus-header">
                    <Loader className="w-16 h-16 animate-spin text-blue-500" />
                    <p className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-300">データベースに接続中...</p>
                    <p className="mt-2 text-base text-slate-500 dark:text-slate-400">認証情報を確認しています。</p>
                </div>
            );
        }

        if (connectionError && !isDemoMode) {
            return (
                <div className="p-8">
                    <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg flex items-center gap-4">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        <div>
                            <h2 className="font-bold text-red-800 dark:text-red-200">接続エラー: {connectionError}</h2>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                SupabaseのURLやAnon Keyが正しく設定されているか、またはデータベースが稼働しているかを確認してください。
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-center">
                        <button onClick={() => setShowDatabaseSetupInstructions(true)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">
                            <Settings className="w-5 h-5" />
                            設定ガイドを開く
                        </button>
                    </div>
                </div>
            );
        }

        switch (currentPage) {
            case 'analysis_dashboard':
                return <Dashboard jobs={jobs} journalEntries={journalEntries} accountItems={accountItems} pendingApprovalCount={applications.filter(app => app.approverId === currentUser?.id && app.status === 'pending_approval').length} onNavigateToApprovals={() => handleNavigate('approval_list')} isAIOff={isAIOff} />;
            case 'sales_leads':
                return <LeadManagementPage leads={leads} searchTerm={searchTerm} onRefresh={fetchAllData} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} addToast={addToast} requestConfirmation={requestConfirmation} currentUser={currentUser} isAIOff={isAIOff} onAddEstimate={handleAddEstimate} />;
            case 'sales_customers':
                return <CustomerList customers={customers} searchTerm={searchTerm} onSelectCustomer={(c) => { setSelectedCustomer(c); setCustomerDetailMode('view'); setIsCustomerDetailModalOpen(true); }} onUpdateCustomer={handleUpdateCustomer} onAnalyzeCustomer={handleAnalyzeCustomer} addToast={addToast} currentUser={currentUser} onNewCustomer={() => { setSelectedCustomer(null); setCustomerDetailMode('new'); setIsCustomerDetailModalOpen(true); }} isAIOff={isAIOff} />;
            case 'sales_pipeline':
                return <SalesPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={(j) => { setSelectedJob(j); setIsJobDetailModalOpen(true); }} />;
            case 'sales_estimates':
                return <EstimateManagementPage estimates={estimates} customers={customers} allUsers={allUsers} onAddEstimate={handleAddEstimate} onUpdateEstimate={handleUpdateEstimate} addToast={addToast} currentUser={currentUser} searchTerm={searchTerm} isAIOff={isAIOff} />;
            case 'sales_orders':
                return <JobList jobs={jobs} searchTerm={searchTerm} onSelectJob={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} onNewJob={() => setIsCreateJobModalOpen(true)} />;
            case 'sales_billing':
                return <BillingManagement jobs={jobs} onRefreshData={fetchAllData} onMarkPaid={handleMarkInvoicePaid} />;
            case 'analysis_ranking':
                return <SalesRanking jobs={jobs} />;
            case 'purchasing_orders':
                return <PurchasingManagementPage purchaseOrders={purchaseOrders} />;
            case 'purchasing_invoices':
                return <AccountingPage page={currentPage} jobs={jobs} journalEntries={journalEntries} accountItems={accountItems} onAddEntry={handleAddEntry} addToast={addToast} requestConfirmation={requestConfirmation} currentUser={currentUser} isAIOff={isAIOff} />;
            case 'purchasing_payments':
                return <AccountingPage page={currentPage} jobs={jobs} journalEntries={journalEntries} accountItems={accountItems} onAddEntry={handleAddEntry} addToast={addToast} requestConfirmation={requestConfirmation} currentUser={currentUser} isAIOff={isAIOff} paymentRecipients={paymentRecipients} />;
            case 'inventory_management':
                return <InventoryManagementPage inventoryItems={inventoryItems} onSelectItem={(item) => { setSelectedInventoryItem(item); setIsCreateInventoryItemModalOpen(true); }} />;
            case 'manufacturing_orders':
                return <ManufacturingOrdersPage jobs={jobs} onSelectJob={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} />;
            case 'manufacturing_progress':
                return <ManufacturingPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={(j) => { setSelectedJob(j); setIsJobDetailModalOpen(true); }} />;
            case 'manufacturing_cost':
                return <ManufacturingCostManagement jobs={jobs} />;
            case 'hr_attendance':
                return <PlaceholderPage title="勤怠" />;
            case 'hr_man_hours':
                return <PlaceholderPage title="工数" />;
            case 'hr_labor_cost':
                return <AccountingPage page={currentPage} employees={employees} />;
            case 'approval_list':
                return <ApprovalWorkflowPage currentUser={currentUser} view='list' addToast={addToast} customers={customers} jobs={jobs} accountItems={accountItems} purchaseOrders={purchaseOrders} departments={departments} isAIOff={isAIOff} allocationDivisions={allocationDivisions} applications={applications} onRefresh={fetchAllData} />;
            case 'approval_form_expense':
                return <ApprovalWorkflowPage currentUser={currentUser} view='form' formCode='EXP' addToast={addToast} customers={customers} jobs={jobs} accountItems={accountItems} purchaseOrders={purchaseOrders} departments={departments} isAIOff={isAIOff} allocationDivisions={allocationDivisions} applications={applications} onRefresh={fetchAllData} paymentRecipients={paymentRecipients} />;
            case 'approval_form_transport':
                return <ApprovalWorkflowPage currentUser={currentUser} view='form' formCode='TRP' addToast={addToast} customers={customers} jobs={jobs} accountItems={accountItems} purchaseOrders={purchaseOrders} departments={departments} isAIOff={isAIOff} allocationDivisions={allocationDivisions} applications={applications} onRefresh={fetchAllData} />;
            case 'approval_form_leave':
                return <ApprovalWorkflowPage currentUser={currentUser} view='form' formCode='LEV' addToast={addToast} customers={customers} jobs={jobs} accountItems={accountItems} purchaseOrders={purchaseOrders} departments={departments} isAIOff={isAIOff} allocationDivisions={allocationDivisions} applications={applications} onRefresh={fetchAllData} />;
            case 'approval_form_approval':
                return <ApprovalWorkflowPage currentUser={currentUser} view='form' formCode='APL' addToast={addToast} customers={customers} jobs={jobs} accountItems={accountItems} purchaseOrders={purchaseOrders} departments={departments} isAIOff={isAIOff} allocationDivisions={allocationDivisions} applications={applications} onRefresh={fetchAllData} />;
            case 'approval_form_daily':
                return <ApprovalWorkflowPage currentUser={currentUser} view='form' formCode='DLY' addToast={addToast} customers={customers} jobs={jobs} accountItems={accountItems} purchaseOrders={purchaseOrders} departments={departments} isAIOff={isAIOff} allocationDivisions={allocationDivisions} applications={applications} onRefresh={fetchAllData} />;
            case 'approval_form_weekly':
                return <ApprovalWorkflowPage currentUser={currentUser} view='form' formCode='WKR' addToast={addToast} customers={customers} jobs={jobs} accountItems={accountItems} purchaseOrders={purchaseOrders} departments={departments} isAIOff={isAIOff} allocationDivisions={allocationDivisions} applications={applications} onRefresh={fetchAllData} />;
            case 'accounting_journal':
                return <AccountingPage page={currentPage} journalEntries={journalEntries} onAddEntry={handleAddEntry} isAIOff={isAIOff} currentUser={currentUser} />;
            case 'accounting_general_ledger':
                return <AccountingPage page={currentPage} journalEntries={journalEntries} accountItems={accountItems} />;
            case 'accounting_trial_balance':
                return <AccountingPage page={currentPage} journalEntries={journalEntries} />;
            case 'accounting_tax_summary':
                return <PlaceholderPage title="消費税集計" />;
            case 'accounting_period_closing':
                return <PeriodClosingPage addToast={addToast} jobs={jobs} applications={applications} journalEntries={journalEntries} onNavigate={handleNavigate} currentUser={currentUser} />;
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
            case 'admin_audit_log':
                return <AuditLogPage logs={userActivityLogs} />;
            case 'admin_journal_queue':
                return <JournalQueuePage />;
            case 'admin_user_management':
                return <UserManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
            case 'admin_route_management':
                return <ApprovalRouteManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
            case 'admin_master_management':
                return <MasterManagementPage addToast={addToast} requestConfirmation={requestConfirmation} accountItems={accountItems} paymentRecipients={paymentRecipients} allocationDivisions={allocationDivisions} departments={departments} titles={employeeTitles} onSaveAccountItem={dataService.saveAccountItem} onDeleteAccountItem={dataService.deactivateAccountItem} onSavePaymentRecipient={dataService.savePaymentRecipient} onDeletePaymentRecipient={dataService.deletePaymentRecipient} onSaveAllocationDivision={dataService.saveAllocationDivision} onDeleteAllocationDivision={dataService.deleteAllocationDivision} onSaveDepartment={dataService.saveDepartment} onDeleteDepartment={dataService.deleteDepartment} onSaveTitle={dataService.saveTitle} onDeleteTitle={dataService.deleteTitle} />;
            case 'admin_bug_reports':
                return <BugReportList reports={bugReports} onUpdateReport={handleUpdateBugReport} searchTerm={searchTerm} />;
            case 'settings':
                return <SettingsPage addToast={addToast} />;
            case 'accounting_analysis_projects':
                return <AnalysisProjectsPage projects={analysisProjects} onRefresh={fetchAllData} currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} />;
            case 'accounting_project_detail':
                // This page requires a project ID, which isn't directly available from currentPage.
                // Assuming navigation to this page sets a selectedProjectId in state or via URL params.
                // For now, we'll render a placeholder or handle gracefully.
                return <PlaceholderPage title="プロジェクト詳細" />;
            case 'accounting_analysis_simulation':
                return <AnalysisSimulationPage documents={documents} scenarios={bankScenarios} simulations={bankSimulations} onRefresh={fetchAllData} currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} />;
            default:
                return <PlaceholderPage title={pageTitle} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-gray-900 text-slate-800 dark:text-slate-200">
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} currentUser={currentUser} allUsers={allUsers} onUserChange={setCurrentUser} />
            <main className="flex-1 overflow-y-auto p-8">
                <Header title={pageTitle} primaryAction={primaryAction} search={{ value: searchTerm, onChange: setSearchTerm, placeholder: `${pageTitle}を検索...` }} />
                <div className="mt-8">
                    {renderContent()}
                </div>
            </main>
            <CreateJobModal isOpen={isCreateJobModalOpen} onClose={() => setIsCreateJobModalOpen(false)} onAddJob={handleAddJob} addToast={addToast} currentUser={currentUser} />
            <JobDetailModal isOpen={isJobDetailModalOpen} onClose={() => setIsJobDetailModalOpen(false)} job={selectedJob} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} requestConfirmation={requestConfirmation} onNavigate={handleNavigate} addToast={addToast} />
            <CustomerDetailModal isOpen={isCustomerDetailModalOpen} onClose={() => setIsCustomerDetailModalOpen(false)} customer={selectedCustomer} mode={customerDetailMode} onSave={customerDetailMode === 'new' ? handleAddCustomer : handleUpdateCustomer} onSetMode={setCustomerDetailMode} onAnalyzeCustomer={handleAnalyzeCustomer} isAIOff={isAIOff} addToast={addToast} />
            <CreateLeadModal isOpen={isCreateLeadModalOpen} onClose={() => setIsCreateLeadModalOpen(false)} onAddLead={handleAddLead} addToast={addToast} />
            <CreateInventoryItemModal isOpen={isCreateInventoryItemModalOpen} onClose={() => { setIsCreateInventoryItemModalOpen(false); setSelectedInventoryItem(null); }} onSave={handleUpdateInventoryItem} item={selectedInventoryItem} />
            <CreatePurchaseOrderModal isOpen={isCreatePurchaseOrderModalOpen} onClose={() => setIsCreatePurchaseOrderModalOpen(false)} onAddPurchaseOrder={handleAddPurchaseOrder} />
            <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
            <ConfirmationDialog {...confirmationDialog} />
            {isChatbotOpen && <Chatbot onClose={() => setIsChatbotOpen(false)} isAIOff={isAIOff} currentUser={currentUser} />}
            <button
                className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors z-[90]"
                onClick={() => setIsChatbotOpen(true)}
                aria-label="Open AI Chatbot"
            >
                <MessageCircle className="w-8 h-8" />
            </button>
            {isBugReportChatModalOpen && <BugReportChatModal isOpen={isBugReportChatModalOpen} onClose={() => setIsBugReportChatModalOpen(false)} onReportSubmit={handleAddBugReport} isAIOff={isAIOff} />}
            <button
                className="fixed bottom-8 right-24 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 transition-colors z-[90]"
                onClick={() => setIsBugReportChatModalOpen(true)}
                aria-label="Open Bug Report Chat"
            >
                <AlertTriangle className="w-8 h-8" />
            </button>
        </div>
    );
};