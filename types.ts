export type Page =
  | 'analysis_dashboard' | 'sales_leads' | 'sales_customers' | 'sales_pipeline'
  | 'sales_estimates' | 'sales_orders' | 'sales_billing' | 'analysis_ranking'
  | 'purchasing_orders' | 'purchasing_invoices' | 'purchasing_payments'
  | 'inventory_management' | 'manufacturing_orders' | 'manufacturing_progress' | 'manufacturing_cost'
  | 'hr_attendance' | 'hr_man_hours' | 'hr_labor_cost'
  | 'approval_list' | 'approval_form_expense' | 'approval_form_transport' | 'approval_form_leave'
  | 'approval_form_approval' | 'approval_form_daily' | 'approval_form_weekly'
  | 'accounting_journal' | 'accounting_general_ledger' | 'accounting_trial_balance'
  | 'accounting_tax_summary' | 'accounting_period_closing' | 'accounting_business_plan'
  | 'business_analysis'
  | 'business_support_proposal'
  | 'ai_business_consultant'
  | 'ai_market_research'
  | 'ai_artifacts'
  | 'ai_data_entry'
  | 'ai_image_studio'
  | 'ai_image_generation'
  | 'ai_tts'
  | 'ai_audio_transcription'
  | 'ai_video_analysis'
  | 'ai_video_generation'
  | 'ai_video_transcription'
  | 'ai_copywriting'
  | 'ai_prompt_history'
  | 'admin_audit_log' | 'admin_journal_queue' | 'admin_user_management' | 'admin_route_management'
  | 'admin_master_management' | 'admin_bug_reports' | 'settings'
  | 'accounting_analysis_projects'
  | 'accounting_project_detail'
  | 'accounting_analysis_simulation'
  ;

export enum JobStatus {
  Pending = '保留',
  InProgress = '進行中',
  Completed = '完了',
  Cancelled = 'キャンセル',
}

export enum InvoiceStatus {
  Uninvoiced = '未請求',
  Invoiced = '請求済',
  Paid = '入金済',
}

export enum LeadStatus {
    Untouched = '未対応',
    New = '新規',
    Contacted = 'コンタクト済',
    Qualified = '有望',
    Disqualified = '失注',
    Converted = '商談化',
    Closed = 'クローズ',
}

export enum PurchaseOrderStatus {
    Ordered = '発注済',
    Received = '受領済',
    Cancelled = 'キャンセル',
}

export enum ManufacturingStatus {
  OrderReceived = '受注',
  DataCheck = 'データチェック',
  Prepress = '製版',
  Printing = '印刷',
  Finishing = '加工',
  AwaitingShipment = '出荷待ち',
  Delivered = '納品済',
}

export enum EstimateStatus {
  Draft = 'draft',
  Ordered = 'ordered',
  Lost = 'lost',
}

export enum BugReportStatus {
    Open = '未対応',
    InProgress = '対応中',
    Closed = '完了',
}


export interface Job {
  id: string;
  jobNumber: number;
  clientName: string;
  title: string;
  status: JobStatus;
  dueDate: string;
  quantity: number;
  paperType: string;
  finishing: string;
  details: string;
  createdAt: string;
  price: number;
  variableCost: number;
  invoiceStatus: InvoiceStatus;
  invoicedAt?: string | null;
  paidAt?: string | null;
  readyToInvoice?: boolean;
  invoiceId?: string | null;
  manufacturingStatus?: ManufacturingStatus;
  aiAnalysisReport?: string;
}

export interface JournalEntry {
  id: number;
  date: string;
  account: string;
  debit: number;
  credit: number;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface EmployeeUser {
  id: string;
  name: string;
  department: string | null;
  title: string | null;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Customer {
  id: string;
  customerCode?: string;
  customerName: string;
  customerNameKana?: string;
  representative?: string;
  phoneNumber?: string;
  address1?: string;
  companyContent?: string;
  annualSales?: string;
  employeesCount?: string;
  note?: string;
  infoSalesActivity?: string;
  infoRequirements?: string;
  infoHistory?: string;
  createdAt: string;
  postNo?: string;
  address2?: string;
  fax?: string;
  closingDay?: string;
  monthlyPlan?: string;
  payDay?: string;
  recoveryMethod?: string;
  userId?: string;
  name2?: string;
  websiteUrl?: string;
  zipCode?: string;
  foundationDate?: string;
  capital?: string;
  customerRank?: string;
  customerDivision?: string;
  salesType?: string;
  creditLimit?: string;
  payMoney?: string;
  bankName?: string;
  branchName?: string;
  accountNo?: string;
  salesUserCode?: string;
  startDate?: string;
  endDate?: string;
  drawingDate?: string;
  salesGoal?: string;
  infoSalesIdeas?: string;
  customerContactInfo?: string; // for mailto
  aiAnalysis?: CompanyAnalysis | null;
}

export interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

export interface AISuggestions {
    clientName?: string;
    title: string;
    quantity: number;
    paperType: string;
    finishing: string;
    details: string;
    price: number;
    variableCost: number;
}

export interface CompanyAnalysis {
    swot: string;
    painPointsAndNeeds: string;
    suggestedActions: string;
    proposalEmail: {
        subject: string;
        body: string;
    };
    sources?: { uri: string; title: string; }[];
}

export interface CompanyInvestigation {
    summary: string;
    sources: {
        uri: string;
        title: string;
    }[];
}

export interface InvoiceData {
    vendorName: string;
    invoiceDate: string;
    totalAmount: number;
    description: string;
    costType: 'V' | 'F';
    account: string;
    relatedCustomer?: string;
    project?: string;
}

export interface AIJournalSuggestion {
    account: string;
    description: string;
    debit: number;
    credit: number;
}

export interface ApplicationCode {
    id: string;
    code: string;
    name: string;
    description: string;
    createdAt: string;
}

export interface EstimateItem {
    division: '用紙代' | 'デザイン・DTP代' | '刷版代' | '印刷代' | '加工代' | 'その他' | '初期費用' | '月額費用';
    content: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    price: number;
    cost: number;
    costRate: number;
    subtotal: number;
}

export interface Estimate {
    id: string;
    leadId: string | null;
    customerId: string | null;
    customerName: string;
    totalAmount: number;
    status: EstimateStatus;
    bodyMd: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
    title: string;
    notes: string | null;
    jsonData: EstimateItem[] | null;
    pdfPath: string | null;
    estimateDate: string | null;
    estimateNumber?: number;
    deliveryDate?: string | null;
    paymentTerms?: string | null;
    deliveryMethod?: string | null;
    version?: number;
    items?: EstimateItem[]; // will be mapped from jsonData
    user?: User; // will be mapped from createdBy
}


export interface Lead {
    id: string;
    status: LeadStatus;
    createdAt: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string;
    source: string | null;
    tags: string[] | null;
    message: string | null;
    updatedAt: string | null;
    referrer: string | null;
    referrerUrl: string | null;
    landingPageUrl: string | null;
    searchKeywords: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmTerm: string | null;
    utmContent: string | null;
    userAgent: string | null;
    ipAddress: string | null;
    deviceType: string | null;
    browserName: string | null;
    osName: string | null;
    country: string | null;
    city: string | null;
    region: string | null;
    employees: string | null;
    budget: string | null;
    timeline: string | null;
    inquiryType: string | null;
    inquiryTypes: string[] | null;
    infoSalesActivity: string | null;
    score?: number;
    aiAnalysisReport?: string;
    aiDraftProposal?: string;
    aiInvestigation?: CompanyInvestigation | null;
}

export interface ApprovalRoute {
    id: string;
    name: string;
    routeData: {
        steps: { approverId: string }[];
    };
    createdAt: string;
}

export interface Application {
    id: string;
    applicantId: string;
    applicationCodeId: string;
    formData: any;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled';
    submittedAt: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    currentLevel: number;
    approverId: string | null;
    rejectionReason: string | null;
    approvalRouteId: string;
    createdAt: string;
    updatedAt?: string | null;
}

export interface ApplicationWithDetails extends Application {
    applicant?: User;
    applicationCode?: ApplicationCode;
    approvalRoute?: ApprovalRoute;
    approvalHistory?: ApprovalHistory[];
}

export interface Employee {
    id: string;
    name: string;
    department: string;
    title: string;
    hireDate: string;
    salary: number;
    createdAt: string;
}

export interface AccountItem {
    id: string;
    code: string;
    name: string;
    categoryCode: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface PurchaseOrder {
    id: string;
    supplierName: string;
    itemName: string;
    orderDate: string;
    quantity: number;
    unitPrice: number;
    status: PurchaseOrderStatus;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    unitPrice: number;
}

export interface BusinessPlan {
    name: string;
    headers: string[];
    items: {
        name: string;
        totalValue: number | string;
        data: {
            type: '目標' | '実績' | '前年';
            monthly: (number | string)[];
            cumulative: (number | string)[];
        }[];
    }[];
}

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}
  
export interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
}

export interface LeadScore {
    score: number;
    rationale: string;
}

export interface BugReport {
  id: string;
  reporterName: string;
  reportType: 'bug' | 'improvement';
  summary: string;
  description: string;
  status: BugReportStatus;
  createdAt: string;
}

export interface ClosingChecklistItem {
    id: string;
    description: string;
    count: number;
    status: 'ok' | 'needs_review';
    actionPage?: Page;
}

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    jobId?: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
    sortIndex: number;
}

export interface Invoice {
    id: string;
    invoiceNo: string;
    invoiceDate: string;
    dueDate?: string;
    customerName: string;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    status: 'draft' | 'issued' | 'paid' | 'void';
    createdAt: string;
    paidAt?: string;
    items?: InvoiceItem[];
}

export enum InboxItemStatus {
  Processing = 'processing',
  PendingReview = 'pending_review',
  Approved = 'approved',
  Error = 'error',
}

export interface InboxItem {
    id: string;
    fileName: string;
    filePath: string;
    fileUrl: string;
    mimeType: string;
    status: InboxItemStatus;
    extractedData: InvoiceData | null;
    errorMessage: string | null;
    createdAt: string;
}

export interface MasterAccountItem {
  id: string;
  code: string;
  name: string;
  categoryCode: string | null;
}

export interface PaymentRecipient {
  id: string;
  recipientCode: string;
  companyName: string | null;
  recipientName: string | null;
}

export interface Department {
  id: string;
  name: string;
}

export interface AllocationDivision {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface Title {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CustomProposalContent {
  coverTitle: string;
  businessUnderstanding: string;
  challenges: string;
  proposal: string;
  conclusion: string;
}

export interface LeadProposalPackage {
  isSalesLead: boolean;
  reason: string;
  proposal?: CustomProposalContent;
  estimate?: EstimateItem[];
}

export interface MarketResearchReport {
  title: string;
  summary: string;
  trends: string[];
  competitorAnalysis: string;
  opportunities: string[];
  threats: string[];
  sources?: { uri: string; title: string; }[];
}

export interface FinancialSimulationResult {
  summary: string;
  metrics: {
    label: string;
    before: number;
    after: number;
    change: number;
  }[];
}

export type AnalysisStatus = 'draft' | 'ingesting' | 'analyzing' | 'ready';
export type ArtifactKind = '対策表' | 'PL' | 'BS' | 'CF' | 'その他' | 'research' | 'proposal' | 'estimate' | 'mail' | 'analysis' | 'image' | 'image_analysis' | 'log' | 'tts' | 'audio_transcription' | 'video_analysis' | 'video_generation' | 'video_transcription' | 'copywriting';
export type SimType = '借入枠' | '返済計画' | '金利感応' | '資金繰り';

export interface AnalysisProject {
  id: string;
  name: string;
  objective: string | null;
  created_by: string | null;
  status: AnalysisStatus;
  created_at: string;
}

export interface AIArtifact {
  id: string;
  project_id?: string;
  kind: ArtifactKind;
  title: string;
  content_json?: any;
  source_url?: string;
  file_path?: string;
  metrics?: any;
  period?: any;
  lead_id?: string | null;
  customer_id?: string | null;
  body_md?: string | null;
  storage_path?: string | null;
  status?: string;
  created_by?: string | null;
  created_by_user?: Pick<User, 'name'>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Document {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  extracted_text: string | null;
  created_at: string;
}

export interface TimeSeriesMetric {
  id: string;
  project_id: string;
  metric_code: string;
  metric_name: string;
  period_start: string;
  period_end: string;
  value: number;
  unit: string | null;
  source_artifact_id: string | null;
  created_at: string;
}

export interface BankScenario {
  id: string;
  project_id: string;
  name: string;
  sim_type: SimType;
  assumptions: any; // JSONB
  created_at: string;
  created_by?: string | null;
}

export interface BankSimulation {
  id: string;
  scenario_id: string;
  inputs: any; // JSONB
  outputs: any | null; // JSONB
  source_artifacts?: { file_id: string; file_name: string }[];
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  created_at: string;
  completed_at: string | null;
}

export interface Plan {
  id: string;
  project_id: string;
  scenario_id: string | null;
  version: number;
  summary_text: string | null;
  plan_doc: any; // JSONB
  created_at: string;
}

export interface DataInterpretation {
    type: 'add_lead' | 'add_job' | 'update_customer' | 'add_expense_from_text' | 'add_application';
    data: any;
    confidence: number;
    reasoning: string;
}

export interface ApprovalHistory {
  id: string;
  application_id: string;
  user_id: string;
  action: 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'commented';
  comment: string | null;
  created_at: string;
  user?: Pick<User, 'name'>; 
}

export interface UserActivityLog {
    id: string;
    user_id: string;
    action: string;
    details: any | null;
    created_at: string;
    user?: Pick<User, 'name'>;
}