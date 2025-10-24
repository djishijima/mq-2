import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CustomerList } from './components/CustomerList';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import CreateJobModal from './components/CreateJobModal';
import JobDetailModal from './components/JobDetailModal';
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
            setEmployeeTitles(demoData.employeeUsers.map(u => ({ id: u.id, name: u.title || '', isActive: true, createdAt: u.createdAt }))); // Assuming EmployeeUser.title can map to Title.name
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
            setIsCreateInventoryItemModalOpen(false);
        } catch (error: any) {
            addToast(`在庫品目の更新に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleMarkPaid = useCallback(async (invoice: Invoice) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.updateInvoice(invoice.id, { status: 'paid', paidAt: new Date().toISOString() });
            addToast(`請求書 ${invoice.invoiceNo} を入金済みにしました。`, 'success');
            await dataService.logUserActivity(currentUser.id, 'invoice_marked_paid', { invoiceId: invoice.id, invoiceNo: invoice.invoiceNo });
            await fetchAllData();
        } catch (error: any) {
            addToast(`請求書の更新に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleSaveAccountItem = useCallback(async (item: Partial<AccountItem>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.saveAccountItem(item);
            addToast('勘定科目を保存しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'account_item_saved', { name: item.name });
            await fetchAllData();
        } catch (error: any) {
            addToast(`勘定科目の保存に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleDeleteAccountItem = useCallback(async (id: string) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.deactivateAccountItem(id); // Deactivate instead of hard delete
            addToast('勘定科目を無効化しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'account_item_deactivated', { id });
            await fetchAllData();
        } catch (error: any) {
            addToast(`勘定科目の無効化に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleSavePaymentRecipient = useCallback(async (item: Partial<PaymentRecipient>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.savePaymentRecipient(item);
            addToast('支払先を保存しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'payment_recipient_saved', { name: item.companyName || item.recipientName });
            await fetchAllData();
        } catch (error: any) {
            addToast(`支払先の保存に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleDeletePaymentRecipient = useCallback(async (id: string) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.deletePaymentRecipient(id);
            addToast('支払先を削除しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'payment_recipient_deleted', { id });
            await fetchAllData();
        } catch (error: any) {
            addToast(`支払先の削除に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleSaveAllocationDivision = useCallback(async (item: Partial<AllocationDivision>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.saveAllocationDivision(item);
            addToast('振分区分を保存しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'allocation_division_saved', { name: item.name });
            await fetchAllData();
        } catch (error: any) {
            addToast(`振分区分の保存に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleDeleteAllocationDivision = useCallback(async (id: string) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.deleteAllocationDivision(id);
            addToast('振分区分を削除しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'allocation_division_deleted', { id });
            await fetchAllData();
        } catch (error: any) {
            addToast(`振分区分の削除に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleSaveDepartment = useCallback(async (item: Partial<Department>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.saveDepartment(item);
            addToast('部署を保存しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'department_saved', { name: item.name });
            await fetchAllData();
        } catch (error: any) {
            addToast(`部署の保存に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleDeleteDepartment = useCallback(async (id: string) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.deleteDepartment(id);
            addToast('部署を削除しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'department_deleted', { id });
            await fetchAllData();
        } catch (error: any) {
            addToast(`部署の削除に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleSaveTitle = useCallback(async (item: Partial<Title>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.saveTitle(item);
            addToast('役職を保存しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'title_saved', { name: item.name });
            await fetchAllData();
        } catch (error: any) {
            addToast(`役職の保存に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleDeleteTitle = useCallback(async (id: string) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.deleteTitle(id);
            addToast('役職を削除しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'title_deleted', { id });
            await fetchAllData();
        } catch (error: any) {
            addToast(`役職の削除に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleAddEstimate = useCallback(async (estimateData: Partial<Estimate>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.addEstimate(estimateData);
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
            await dataService.updateEstimate(id, estimateData);
            addToast('見積を更新しました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'estimate_updated', { estimateId: id, updates: estimateData });
            await fetchAllData();
        } catch (error: any) {
            addToast(`見積の更新に失敗しました: ${error.message}`, 'error');
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
            await dataService.logUserActivity(currentUser.id, 'bug_report_updated', { bugReportId: id, updates });
            await fetchAllData();
        } catch (error: any) {
            addToast(`報告の更新に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    const handleAddBugReport = useCallback(async (report: Omit<BugReport, 'id' | 'created_at' | 'status' | 'reporter_name'>) => {
        if (!currentUser) {
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        try {
            await dataService.addBugReport({ ...report, reporterName: currentUser.name, status: '未対応' });
            addToast('バグ報告・改善要望を受け付けました。', 'success');
            await dataService.logUserActivity(currentUser.id, 'bug_report_added', { summary: report.summary, type: report.reportType });
            await fetchAllData();
        } catch (error: any) {
            addToast(`報告の送信に失敗しました: ${error.message}`, 'error');
        }
    }, [addToast, fetchAllData, currentUser]);

    // Handle offline/Supabase connection issues
    if (!isSupabaseConnected && !isDemoMode && connectionError) {
        // FIX: Replaced ConnectionSetupPage with DatabaseSetupInstructionsModal
        return <DatabaseSetupInstructionsModal onRetry={fetchAllData} />;
    }
    if (showDatabaseSetupInstructions) {
        return <DatabaseSetupInstructionsModal onRetry={fetchAllData} />;
    }
    if (!currentUser && (isSupabaseConnected || isDemoMode)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-[#0d1117] text-slate-800 dark:text-white">
                <Loader className="w-12 h-12 animate-spin text-blue-600" />
                <p className="ml-4 text-xl">ユーザーデータを読み込み中...</p>
            </div>
        );
    }
    
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
            <Sidebar 
                currentPage={currentPage} 
                onNavigate={handleNavigate} 
                currentUser={currentUser}
                allUsers={allUsers}
                onUserChange={setCurrentUser}
            />
            <main className="flex-1 p-8 overflow-y-auto">
                <Header 
                    title={pageTitle} 
                    primaryAction={primaryAction} 
                    search={['sales_leads', 'sales_customers', 'sales_orders', 'admin_bug_reports', 'sales_estimates', 'ai_artifacts'].includes(currentPage) ? {
                        value: searchTerm,
                        onChange: setSearchTerm,
                        placeholder: `${pageTitle}を検索...`
                    } : undefined}
                />
                <div className="mt-8">
                    {currentPage === 'analysis_dashboard' && <Dashboard jobs={jobs} journalEntries={journalEntries} accountItems={accountItems} pendingApprovalCount={applications.filter(app => app.approverId === currentUser?.id && app.status === 'pending_approval').length} onNavigateToApprovals={() => handleNavigate('approval_list')} isAIOff={isAIOff} />}
                    {currentPage === 'sales_orders' && <JobList jobs={jobs} searchTerm={searchTerm} onSelectJob={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} onNewJob={() => setIsCreateJobModalOpen(true)} />}
                    {currentPage === 'sales_customers' && <CustomerList customers={customers} searchTerm={searchTerm} onSelectCustomer={(customer) => { setSelectedCustomer(customer); setCustomerDetailMode('view'); setIsCustomerDetailModalOpen(true); }} onUpdateCustomer={handleUpdateCustomer} onAnalyzeCustomer={handleAnalyzeCustomer} addToast={addToast} currentUser={currentUser} onNewCustomer={() => { setSelectedCustomer(null); setCustomerDetailMode('new'); setIsCustomerDetailModalOpen(true); }} isAIOff={isAIOff} />}
                    {currentPage === 'sales_leads' && <LeadManagementPage leads={leads} searchTerm={searchTerm} onRefresh={fetchAllData} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} addToast={addToast} requestConfirmation={requestConfirmation} currentUser={currentUser} isAIOff={isAIOff} onAddEstimate={handleAddEstimate} />}
                    {currentPage === 'sales_pipeline' && <SalesPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} />}
                    {currentPage === 'purchasing_orders' && <PurchasingManagementPage purchaseOrders={purchaseOrders} />}
                    {currentPage === 'inventory_management' && <InventoryManagementPage inventoryItems={inventoryItems} onSelectItem={(item) => { setSelectedInventoryItem(item); setIsCreateInventoryItemModalOpen(true); }} />}
                    {currentPage === 'manufacturing_orders' && <ManufacturingOrdersPage jobs={jobs} onSelectJob={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} />}
                    {currentPage === 'manufacturing_progress' && <ManufacturingPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} />}
                    {currentPage === 'manufacturing_cost' && <ManufacturingCostManagement jobs={jobs} />}
                    {currentPage === 'sales_estimates' && <EstimateManagementPage estimates={estimates} customers={customers} allUsers={allUsers} onAddEstimate={handleAddEstimate} onUpdateEstimate={handleUpdateEstimate} addToast={addToast} currentUser={currentUser} searchTerm={searchTerm} isAIOff={isAIOff} />}
                    {currentPage === 'sales_billing' && <AccountingPage page={currentPage} jobs={jobs} onRefreshData={fetchAllData} onMarkPaid={handleMarkPaid} />}
                    {currentPage === 'accounting_journal' && <AccountingPage page={currentPage} journalEntries={journalEntries} onAddEntry={handleAddEntry} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'purchasing_invoices' && <AccountingPage page={currentPage} onAddEntry={handleAddEntry} addToast={addToast} requestConfirmation={requestConfirmation} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'purchasing_payments' && <AccountingPage page={currentPage} journalEntries={journalEntries} onExecutePayment={handleAddEntry} />}
                    {currentPage === 'hr_labor_cost' && <AccountingPage page={currentPage} employees={employees} />}
                    {currentPage === 'accounting_general_ledger' && <AccountingPage page={currentPage} journalEntries={journalEntries} accountItems={accountItems} />}
                    {currentPage === 'accounting_trial_balance' && <AccountingPage page={currentPage} journalEntries={journalEntries} />}
                    {currentPage === 'accounting_period_closing' && <AccountingPage page={currentPage} addToast={addToast} jobs={jobs} applications={applications} journalEntries={journalEntries} onNavigate={handleNavigate} currentUser={currentUser} />}
                    {currentPage === 'accounting_business_plan' && <BusinessPlanPage allUsers={allUsers} />}
                    {currentPage === 'analysis_ranking' && <SalesRanking jobs={jobs} />}
                    {currentPage === 'admin_user_management' && <UserManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />}
                    {currentPage === 'admin_route_management' && <ApprovalRouteManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />}
                    {currentPage === 'admin_bug_reports' && <BugReportList reports={bugReports} onUpdateReport={handleUpdateBugReport} searchTerm={searchTerm} />}
                    {currentPage === 'admin_audit_log' && <AuditLogPage logs={userActivityLogs} />}
                    {currentPage === 'admin_journal_queue' && <JournalQueuePage />}
                    {currentPage === 'admin_master_management' && <MasterManagementPage accountItems={accountItems} paymentRecipients={paymentRecipients} allocationDivisions={allocationDivisions} departments={departments} titles={employeeTitles} onSaveAccountItem={handleSaveAccountItem} onDeleteAccountItem={handleDeleteAccountItem} onSavePaymentRecipient={handleSavePaymentRecipient} onDeletePaymentRecipient={handleDeletePaymentRecipient} onSaveAllocationDivision={handleSaveAllocationDivision} onDeleteAllocationDivision={handleDeleteAllocationDivision} onSaveDepartment={handleSaveDepartment} onDeleteDepartment={handleDeleteDepartment} onSaveTitle={handleSaveTitle} onDeleteTitle={handleDeleteTitle} addToast={addToast} requestConfirmation={requestConfirmation} />}
                    {currentPage === 'business_support_proposal' && <BusinessSupportPage customers={customers} jobs={jobs} estimates={estimates} currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} />}
                    {currentPage === 'ai_business_consultant' && <AIChatPage currentUser={currentUser} jobs={jobs} customers={customers} journalEntries={journalEntries} />}
                    {currentPage === 'ai_market_research' && <MarketResearchPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'ai_artifacts' && <AIArtifactsPage artifacts={aiArtifacts} allUsers={allUsers} searchTerm={searchTerm} />}
                    {currentPage === 'ai_data_entry' && <AIDataEntryPage customers={customers} onAddLead={handleAddLead} onUpdateCustomer={handleUpdateCustomer} onAddJob={handleAddJob} addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'ai_image_studio' && <AIImageStudioPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'ai_image_generation' && <AIImageGenerationPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'ai_tts' && <AITextToSpeechPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'ai_audio_transcription' && <AIAudioTranscriptionPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'ai_video_analysis' && <AIVideoAnalysisPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'ai_video_generation' && <AIVideoGenerationPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'ai_video_transcription' && <AIVideoTranscriptionPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'ai_copywriting' && <AICopywritingPage addToast={addToast} isAIOff={isAIOff} currentUser={currentUser} />}
                    {currentPage === 'accounting_analysis_projects' && <AnalysisProjectsPage projects={analysisProjects} onRefresh={fetchAllData} currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} />}
                    {currentPage === 'accounting_analysis_simulation' && <AnalysisSimulationPage documents={documents} scenarios={bankScenarios} simulations={bankSimulations} onRefresh={fetchAllData} currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} />}
                    {['approval_list', 'approval_form_expense', 'approval_form_transport', 'approval_form_leave', 'approval_form_approval', 'approval_form_daily', 'approval_form_weekly'].includes(currentPage) && (
                        <ApprovalWorkflowPage 
                            currentUser={currentUser} 
                            view={currentPage === 'approval_list' ? 'list' : 'form'} 
                            formCode={currentPage.replace('approval_form_', '').toUpperCase()}
                            addToast={addToast}
                            customers={customers}
                            accountItems={accountItems}
                            jobs={jobs}
                            purchaseOrders={purchaseOrders}
                            departments={departments}
                            isAIOff={isAIOff}
                            allocationDivisions={allocationDivisions}
                            applications={applications}
                            onRefresh={fetchAllData}
                        />
                    )}
                    {currentPage === 'settings' && <SettingsPage addToast={addToast} />}
                    {/* Placeholder for other pages */}
                    {![
                        'analysis_dashboard', 'sales_orders', 'sales_customers', 'sales_leads', 'sales_pipeline',
                        'purchasing_orders', 'inventory_management', 'manufacturing_orders', 'manufacturing_progress', 'manufacturing_cost',
                        'sales_estimates', 'sales_billing', 'accounting_journal', 'purchasing_invoices', 'purchasing_payments',
                        'hr_labor_cost', 'accounting_general_ledger', 'accounting_trial_balance', 'accounting_period_closing',
                        'accounting_business_plan', 'analysis_ranking', 'admin_user_management', 'admin_route_management',
                        'admin_bug_reports', 'admin_audit_log', 'admin_journal_queue', 'admin_master_management',
                        'business_support_proposal', 'ai_business_consultant', 'ai_market_research', 'ai_artifacts', 'ai_data_entry',
                        'ai_image_studio', 'ai_image_generation', 'ai_tts', 'ai_audio_transcription', 'ai_video_analysis',
                        'ai_video_generation', 'ai_video_transcription', 'ai_copywriting', 'accounting_analysis_projects',
                        'accounting_analysis_simulation', 'settings',
                        'approval_list', 'approval_form_expense', 'approval_form_transport', 'approval_form_leave', 'approval_form_approval', 'approval_form_daily', 'approval_form_weekly'
                    ].includes(currentPage) && <PlaceholderPage title={pageTitle} />}
                </div>
            </main>

            {/* Modals */}
            <CreateJobModal isOpen={isCreateJobModalOpen} onClose={() => setIsCreateJobModalOpen(false)} onAddJob={handleAddJob} addToast={addToast} currentUser={currentUser} />
            <JobDetailModal job={selectedJob} isOpen={isJobDetailModalOpen} onClose={() => setIsJobDetailModalOpen(false)} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} requestConfirmation={requestConfirmation} onNavigate={handleNavigate} addToast={addToast} />
            <CustomerDetailModal isOpen={isCustomerDetailModalOpen} customer={selectedCustomer} mode={customerDetailMode} onClose={() => setIsCustomerDetailModalOpen(false)} onSave={customerDetailMode === 'new' ? handleAddCustomer : handleUpdateCustomer} onSetMode={setCustomerDetailMode} onAnalyzeCustomer={handleAnalyzeCustomer} isAIOff={isAIOff} addToast={addToast} />
            <CompanyAnalysisModal isOpen={isCompanyAnalysisModalOpen} onClose={() => setIsCompanyAnalysisModalOpen(false)} analysis={companyAnalysisResult} customer={selectedCustomer} isLoading={isCompanyAnalysisLoading} error={companyAnalysisError} currentUser={currentUser} isAIOff={isAIOff} onReanalyze={handleAnalyzeCustomer} />
            <CreateLeadModal isOpen={isCreateLeadModalOpen} onClose={() => setIsCreateLeadModalOpen(false)} onAddLead={handleAddLead} addToast={addToast} />
            <CreateInventoryItemModal isOpen={isCreateInventoryItemModalOpen} onClose={() => setIsCreateInventoryItemModalOpen(false)} onSave={selectedInventoryItem ? handleUpdateInventoryItem : handleAddInventoryItem} item={selectedInventoryItem} />
            <CreatePurchaseOrderModal isOpen={isCreatePurchaseOrderModalOpen} onClose={() => setIsCreatePurchaseOrderModalOpen(false)} onAddPurchaseOrder={handleAddPurchaseOrder} />
            
            <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
            <ConfirmationDialog {...confirmationDialog} />

            {/* AI Chatbot Button */}
            {!isChatbotOpen && (
                <button 
                    onClick={() => setIsChatbotOpen(true)} 
                    className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors z-[90]"
                    aria-label="Open AI Chatbot"
                >
                    <MessageCircle className="w-8 h-8" />
                </button>
            )}
            {isChatbotOpen && <Chatbot onClose={() => setIsChatbotOpen(false)} isAIOff={isAIOff} currentUser={currentUser} />}
            
            {/* Bug Report Chat Button */}
            <button 
                onClick={() => setIsBugReportChatModalOpen(true)} 
                className="fixed bottom-8 left-8 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 transition-colors z-[90]"
                aria-label="Open Bug Report Chat"
            >
                <AlertTriangle className="w-8 h-8" />
            </button>
            <BugReportChatModal isOpen={isBugReportChatModalOpen} onClose={() => setIsBugReportChatModalOpen(false)} onReportSubmit={handleAddBugReport} isAIOff={isAIOff} />
            
            </main>
        </div>
    );
};