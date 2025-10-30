import {
  AccountItem,
  ApplicationCode,
  ApplicationWithDetails,
  ApprovalRoute,
  BugReport,
  BugReportStatus,
  Customer,
  Department,
  Employee,
  EmployeeUser,
  Estimate,
  EstimateItem,
  EstimateStatus,
  InboxItem,
  InboxItemStatus,
  InventoryItem,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  InvoiceData,
  Job,
  JobStatus,
  JournalEntry,
  Lead,
  LeadStatus,
  ManufacturingStatus,
  PaymentRecipient,
  PurchaseOrder,
  PurchaseOrderStatus,
  UserActivityLog,
  ApprovalHistory,
  AnalysisProject,
  Document,
  BankScenario,
  BankSimulation,
  AllocationDivision, // Added missing property
  Title, // Added missing property
  AIArtifact, // Added missing property
} from '../types';

export interface DemoDataState {
  jobs: Job[];
  customers: Customer[];
  journalEntries: JournalEntry[];
  accountItems: AccountItem[];
  leads: Lead[];
  approvalRoutes: ApprovalRoute[];
  purchaseOrders: PurchaseOrder[];
  inventoryItems: InventoryItem[];
  employees: Employee[];
  employeeUsers: EmployeeUser[];
  bugReports: BugReport[];
  estimates: Estimate[];
  applications: ApplicationWithDetails[];
  applicationCodes: ApplicationCode[];
  invoices: Invoice[];
  inboxItems: InboxItem[];
  departments: Department[];
  paymentRecipients: PaymentRecipient[];
  userActivityLogs: UserActivityLog[];
  approvalHistory: ApprovalHistory[];
  analysisProjects: AnalysisProject[];
  documents: Document[];
  bankScenarios: BankScenario[];
  bankSimulations: BankSimulation[];
  // FIX: Added missing properties to DemoDataState
  allocationDivisions: AllocationDivision[];
  titles: Title[];
  aiArtifacts: AIArtifact[];
}

const clone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const createEstimateItems = (items: EstimateItem[]): EstimateItem[] => items.map(item => ({ ...item }));

export const createDemoDataState = (): DemoDataState => {
  const jobs: Job[] = [
    {
      id: 'job-001',
      jobNumber: 20241001,
      clientName: '株式会社ネオプリント',
      title: '秋季キャンペーンチラシ',
      status: JobStatus.InProgress,
      dueDate: '2025-11-05',
      quantity: 15000,
      paperType: 'コート紙 90kg',
      finishing: 'PP加工（グロス）',
      details: 'A4 / 両面フルカラー / 3営業日納期',
      createdAt: '2025-10-05T03:12:00Z',
      price: 580000,
      variableCost: 320000,
      invoiceStatus: InvoiceStatus.Uninvoiced,
      invoicedAt: null,
      paidAt: null,
      readyToInvoice: false,
      invoiceId: null,
      manufacturingStatus: ManufacturingStatus.Printing,
      aiAnalysisReport: 'AI分析レポートのサンプル',
    },
    {
      id: 'job-002',
      jobNumber: 20240921,
      clientName: '有限会社ブルースタジオ',
      title: '会社案内パンフレット改訂',
      status: JobStatus.Pending,
      dueDate: '2025-10-30',
      quantity: 3000,
      paperType: 'マットコート紙 110kg',
      finishing: '箔押し',
      details: 'A4 / 中綴じ12P / 金箔押しロゴ',
      createdAt: '2025-09-21T10:45:00Z',
      price: 780000,
      variableCost: 410000,
      invoiceStatus: InvoiceStatus.Uninvoiced,
      invoicedAt: null,
      paidAt: null,
      readyToInvoice: true,
      invoiceId: null,
      manufacturingStatus: ManufacturingStatus.DataCheck,
      aiAnalysisReport: 'AI分析レポートのサンプル',
    },
    {
      id: 'job-003',
      jobNumber: 20240818,
      clientName: '株式会社リンクス',
      title: '商品カタログ2025',
      status: JobStatus.Completed,
      dueDate: '2025-09-10',
      quantity: 8000,
      paperType: 'アートポスト 180kg',
      finishing: 'PP加工（マット）',
      details: 'A5 / 無線綴じ / 校正2回',
      createdAt: '2025-08-18T08:30:00Z',
      price: 1250000,
      variableCost: 720000,
      invoiceStatus: InvoiceStatus.Invoiced,
      invoicedAt: '2025-09-12T00:00:00Z',
      paidAt: null,
      readyToInvoice: false,
      invoiceId: 'inv-001',
      manufacturingStatus: ManufacturingStatus.Delivered,
      aiAnalysisReport: 'AI分析レポートのサンプル',
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cus-001',
      customerName: '株式会社ネオプリント',
      representative: '山田 太郎',
      phoneNumber: '03-1234-5678',
      address1: '東京都中央区銀座1-2-3',
      companyContent: 'デザイン・広告制作',
      annualSales: '5億円',
      createdAt: '2023-04-01T00:00:00Z',
      websiteUrl: 'https://neoprint.jp',
      customerRank: 'A',
      salesType: '直取引',
      creditLimit: '500万円',
      customerContactInfo: 'sales@neoprint.jp',
      aiAnalysis: {
        swot: 'SWOT分析サンプル',
        painPointsAndNeeds: '課題サンプル',
        suggestedActions: '提案アクションサンプル',
        proposalEmail: { subject: '提案メール件名', body: '提案メール本文' },
      },
    },
    {
      id: 'cus-002',
      customerName: '有限会社ブルースタジオ',
      representative: '佐藤 花子',
      phoneNumber: '06-2345-6789',
      address1: '大阪府大阪市北区梅田2-3-4',
      companyContent: 'クリエイティブスタジオ',
      annualSales: '1.2億円',
      createdAt: '2024-02-14T00:00:00Z',
      websiteUrl: 'https://bluestudio.jp',
      customerRank: 'B',
      salesType: '紹介',
      creditLimit: '200万円',
      customerContactInfo: 'info@bluestudio.jp',
      aiAnalysis: null,
    },
    {
      id: 'cus-003',
      customerName: '株式会社リンクス',
      representative: '田中 実',
      phoneNumber: '052-345-6789',
      address1: '愛知県名古屋市中区栄1-2-3',
      companyContent: '電子機器製造・販売',
      annualSales: '20億円',
      createdAt: '2022-10-10T00:00:00Z',
      websiteUrl: 'https://lynx.co.jp',
      customerRank: 'A',
      salesType: '直取引',
      creditLimit: '800万円',
      customerContactInfo: 'procurement@lynx.co.jp',
      aiAnalysis: null,
    },
  ];

  const journalEntries: JournalEntry[] = [
    {
      id: 1,
      date: '2025-10-01',
      account: '売上高',
      debit: 0,
      credit: 580000,
      description: '秋季キャンペーンチラシ 納品',
    },
    {
      id: 2,
      date: '2025-10-02',
      account: '外注費',
      debit: 220000,
      credit: 0,
      description: 'デザイン外注費',
    },
    {
      id: 3,
      date: '2025-10-03',
      account: '売掛金',
      debit: 1250000,
      credit: 0,
      description: '株式会社リンクス カタログ制作',
    },
  ];

  const accountItems: AccountItem[] = [
    {
      id: 'acct-001',
      code: '5001',
      name: '売上高',
      categoryCode: '50',
      isActive: true,
      sortOrder: 1,
      createdAt: '2022-04-01T00:00:00Z',
      updatedAt: '2025-04-01T00:00:00Z',
    },
    {
      id: 'acct-002',
      code: '5201',
      name: '外注費',
      categoryCode: '52',
      isActive: true,
      sortOrder: 2,
      createdAt: '2022-04-01T00:00:00Z',
      updatedAt: '2025-04-01T00:00:00Z',
    },
    {
      id: 'acct-003',
      code: '6101',
      name: '人件費',
      categoryCode: '61',
      isActive: true,
      sortOrder: 3,
      createdAt: '2022-04-01T00:00:00Z',
      updatedAt: '2025-04-01T00:00:00Z',
    },
    { id: 'acct-6001', code: '6001', name: '旅費交通費', categoryCode: 'EXP_TRAVEL', isActive: true, sortOrder: 10, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: 'acct-6002', code: '6002', name: '通信費', categoryCode: 'EXP_COMM', isActive: true, sortOrder: 20, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: 'acct-6003', code: '6003', name: '消耗品費', categoryCode: 'EXP_SUPPLIES', isActive: true, sortOrder: 30, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
  ];

  const leads: Lead[] = [
    {
      id: 'lead-001',
      status: LeadStatus.Contacted,
      createdAt: '2025-09-18T02:15:00Z',
      name: '鈴木 一郎',
      email: 'suzuki@example.com',
      phone: '045-123-4567',
      company: '株式会社アーク',
      source: '展示会',
      tags: ['印刷', '大型案件'],
      message: '大型イベント用のパンフレット制作を検討しています。',
      updatedAt: '2025-09-25T11:22:00Z',
      referrer: null,
      referrerUrl: null,
      landingPageUrl: null,
      searchKeywords: null,
      utmSource: 'expo',
      utmMedium: 'offline',
      utmCampaign: 'autumn_fair',
      utmTerm: null,
      utmContent: null,
      userAgent: null,
      ipAddress: null,
      deviceType: null,
      browserName: null,
      osName: null,
      country: '日本',
      city: '横浜市',
      region: '神奈川県',
      employees: '120名',
      budget: '300万円',
      timeline: '11月中旬納品希望',
      inquiryType: 'デモ依頼',
      inquiryTypes: ['デモ依頼', '見積依頼'],
      infoSalesActivity: '10/01 オンラインデモ実施。詳細見積もり提出予定。',
      score: 78,
      aiInvestigation: {
        summary: '株式会社アークは、イベント企画・運営を主事業とする企業。最近ではオンラインイベントの需要増に対応するため、デジタルコンテンツ制作にも注力している。',
        sources: [{ uri: 'https://example.com/arc-news', title: 'アーク最新ニュース' }]
      }
    },
    {
      id: 'lead-002',
      status: LeadStatus.Qualified,
      createdAt: '2025-09-01T07:00:00Z',
      name: '松本 里奈',
      email: 'rina.matsumoto@example.com',
      phone: '078-987-6543',
      company: '株式会社ライトアップ',
      source: 'Webサイト',
      tags: ['短納期'],
      message: '採用パンフレットの制作を依頼したいです。',
      updatedAt: '2025-09-15T09:30:00Z',
      referrer: null,
      referrerUrl: null,
      landingPageUrl: 'https://example.com/lp',
      searchKeywords: '採用パンフレット 印刷',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'recruit-ads',
      utmTerm: '採用パンフレット',
      utmContent: 'text_ad',
      userAgent: null,
      ipAddress: null,
      deviceType: 'desktop',
      browserName: 'Chrome',
      osName: 'Windows',
      country: '日本',
      city: '神戸市',
      region: '兵庫県',
      employees: '80名',
      budget: '180万円',
      timeline: '12月初旬納品',
      inquiryType: '導入相談',
      inquiryTypes: ['導入相談'],
      infoSalesActivity: '要件定義完了。10/20 契約予定。',
      score: 84,
      aiInvestigation: null,
    },
  ];

  const employeeUsers: EmployeeUser[] = [
    {
      id: 'user-001',
      name: '田中 翔',
      department: '営業部',
      title: 'マネージャー',
      email: 'sho.tanaka@example.com',
      role: 'admin',
      createdAt: '2023-01-15T00:00:00Z',
    },
    {
      id: 'user-002',
      name: '高橋 美咲',
      department: '営業部',
      title: 'シニアセールス',
      email: 'misaki.takahashi@example.com',
      role: 'user',
      createdAt: '2023-05-12T00:00:00Z',
    },
    {
      id: 'user-003',
      name: '佐々木 大樹',
      department: '製造部',
      title: '工場長',
      email: 'daiki.sasaki@example.com',
      role: 'user',
      createdAt: '2022-11-01T00:00:00Z',
    },
  ];

  const approvalRoutes: ApprovalRoute[] = [
    {
      id: 'route-001',
      name: '営業経費申請ルート',
      routeData: {
        steps: [
          { approverId: employeeUsers.find(u => u.id === 'user-001')?.id as string }, // FIX: Add type assertion
          { approverId: employeeUsers.find(u => u.id === 'user-002')?.id as string }, // FIX: Add type assertion
        ],
      },
      createdAt: '2024-01-05T00:00:00Z',
    },
    {
      id: 'route-002',
      name: '製造部 稟議ルート',
      routeData: {
        steps: [
          { approverId: employeeUsers.find(u => u.id === 'user-003')?.id as string }, // FIX: Add type assertion
          { approverId: employeeUsers.find(u => u.id === 'user-001')?.id as string }, // FIX: Add type assertion
        ],
      },
      createdAt: '2024-03-12T00:00:00Z',
    },
    {
      id: 'route-prez',
      name: '社長決裁ルート',
      routeData: {
        steps: [
          { approverId: employeeUsers.find(u => u.id === 'user-001')?.id as string }, // 田中 翔 (Manager/Admin) as President // FIX: Add type assertion
        ],
      },
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  const applicationCodes: ApplicationCode[] = [
    { id: 'code-exp', code: 'EXP', name: '経費精算', description: '経費精算申請', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'code-trp', code: 'TRP', name: '交通費申請', description: '交通費申請', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'code-lev', code: 'LEV', name: '休暇申請', description: '休暇申請', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'code-apl', code: 'APL', name: '稟議申請', description: '稟議申請', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'code-dly', code: 'DLY', name: '日報', description: '日報', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'code-wkr', code: 'WKR', name: '週報', description: '週報', createdAt: '2024-01-01T00:00:00Z' },
  ];

  const applications: ApplicationWithDetails[] = [
    {
      id: 'app-001',
      applicantId: 'user-002',
      applicationCodeId: 'code-exp',
      formData: {
        purpose: '得意先訪問の交通費精算',
        amount: 12840,
        notes: '10/3 東京メトロ利用',
      },
      status: 'pending_approval',
      submittedAt: '2025-10-04T02:45:00Z',
      approvedAt: null,
      rejectedAt: null,
      currentLevel: 1,
      approverId: 'user-001',
      rejectionReason: null,
      approvalRouteId: 'route-001',
      createdAt: '2025-10-04T02:45:00Z',
      updatedAt: '2025-10-04T02:45:00Z',
      applicant: employeeUsers.find(u => u.id === 'user-002'),
      applicationCode: applicationCodes.find(c => c.id === 'code-exp'),
      approvalRoute: approvalRoutes.find(r => r.id === 'route-001'),
      approvalHistory: [
        {
          id: 'hist-001',
          application_id: 'app-001',
          user_id: 'user-002',
          action: 'submitted',
          comment: '申請が提出されました。',
          created_at: '2025-10-04T02:45:00Z',
          user: { name: '高橋 美咲' },
        },
      ],
    },
    {
      id: 'app-002',
      applicantId: 'user-003',
      applicationCodeId: 'code-apl',
      formData: {
        title: '新型オンデマンド印刷機導入',
        amount: 4800000,
        roi: '2年で投資回収見込み',
      },
      status: 'draft',
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      currentLevel: 0,
      approverId: null,
      rejectionReason: null,
      approvalRouteId: 'route-002',
      createdAt: '2025-09-28T07:10:00Z',
      updatedAt: '2025-09-28T07:10:00Z',
      applicant: employeeUsers.find(u => u.id === 'user-003'),
      applicationCode: applicationCodes.find(c => c.id === 'code-apl'),
      approvalRoute: approvalRoutes.find(r => r.id === 'route-002'),
      approvalHistory: [
        {
          id: 'hist-002',
          application_id: 'app-002',
          user_id: 'user-003',
          action: 'submitted',
          comment: '新型印刷機の導入稟議',
          created_at: '2025-09-28T07:10:00Z',
          user: { name: '佐々木 大樹' },
        },
      ],
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-001',
      supplierName: '東都紙業株式会社',
      itemName: 'コート紙 90kg (1091×788)',
      orderDate: '2025-10-05',
      quantity: 2000,
      unitPrice: 38, // FIX: Added missing property
      status: PurchaseOrderStatus.Ordered, // FIX: Added missing property
    },
    {
      id: 'po-002',
      supplierName: '京浜加工サービス',
      itemName: 'PP加工（グロス）',
      orderDate: '2025-10-03',
      quantity: 1500,
      unitPrice: 2.5, // FIX: Added missing property
      status: PurchaseOrderStatus.Ordered, // FIX: Added missing property
    },
  ];

  const inventoryItems: InventoryItem[] = [
    {
      id: 'inv-item-001',
      name: 'コート紙 90kg (A判)',
      category: '用紙',
      quantity: 50000,
      unit: '枚',
      unitPrice: 35,
    },
    {
      id: 'inv-item-002',
      name: 'CMYKインクセット',
      category: 'インク',
      quantity: 10,
      unit: 'セット',
      unitPrice: 12000,
    },
  ];

  const employees: Employee[] = [
    {
      id: 'emp-001',
      name: '田中 翔',
      department: '営業部',
      title: '部長',
      hireDate: '2020-04-01',
      salary: 450000,
      createdAt: '2020-04-01T00:00:00Z',
    },
    {
      id: 'emp-002',
      name: '高橋 美咲',
      department: '営業部',
      title: '一般',
      hireDate: '2023-05-12',
      salary: 300000,
      createdAt: '2023-05-12T00:00:00Z',
    },
    {
      id: 'emp-003',
      name: '佐々木 大樹',
      department: '製造部',
      title: '工場長',
      hireDate: '2022-11-01',
      salary: 400000,
      createdAt: '2022-11-01T00:00:00Z',
    },
  ];

  const bugReports: BugReport[] = [
    {
      id: 'bug-001',
      reporterName: '高橋 美咲',
      reportType: 'bug',
      summary: '案件登録時、納期が自動で本日になってしまう',
      description: '新規案件登録フォームで、納期フィールドに何も入力しないと、現在の年月日が自動でセットされてしまう。空のままにしておきたい。',
      status: BugReportStatus.Open,
      createdAt: '2025-10-06T10:00:00Z',
    },
    {
      id: 'bug-002',
      reporterName: '田中 翔',
      reportType: 'improvement',
      summary: 'ダッシュボードに月次目標達成率を表示してほしい',
      description: '現在の月次目標に対して、売上高、限界利益、利益がどの程度達成されているか、パーセンテージで表示されると視覚的に分かりやすい。',
      status: BugReportStatus.InProgress,
      createdAt: '2025-10-01T14:30:00Z',
    },
  ];

  const estimates: Estimate[] = [
    {
      id: 'est-001',
      leadId: 'lead-001',
      customerId: 'cus-001',
      customerName: '株式会社アーク',
      title: 'イベント用パンフレット制作',
      totalAmount: 2500000,
      status: EstimateStatus.Draft,
      bodyMd: 'AIが生成した提案書ドラフトです。',
      createdBy: 'user-001',
      createdAt: '2025-10-01T00:00:00Z',
      updatedAt: '2025-10-01T00:00:00Z',
      jsonData: [
        { division: 'デザイン・DTP代', content: 'A4パンフレット 8Pデザイン', quantity: 1, unit: '式', unitPrice: 300000, price: 300000, cost: 150000, costRate: 0.5, subtotal: 300000 },
        { division: '印刷代', content: 'オフセット印刷 A4 8P 5000部', quantity: 5000, unit: '部', unitPrice: 400, price: 2000000, cost: 1000000, costRate: 0.5, subtotal: 2000000 },
        { division: '加工代', content: '製本・断裁', quantity: 1, unit: '式', unitPrice: 200000, price: 200000, cost: 100000, costRate: 0.5, subtotal: 200000 },
      ],
      pdfPath: null,
      estimateDate: '2025-10-01',
      notes: 'イベント期間が短いため、迅速な対応が必要です。',
      user: employeeUsers.find(u => u.id === 'user-001'),
    },
  ];

  const invoices: Invoice[] = [
    {
      id: 'inv-001',
      invoiceNo: 'INV-20250912-001',
      invoiceDate: '2025-09-12',
      dueDate: '2025-10-31',
      customerName: '株式会社リンクス',
      subtotalAmount: 1250000,
      taxAmount: 125000,
      totalAmount: 1375000,
      status: InvoiceStatus.Issued,
      createdAt: '2025-09-12T00:00:00Z',
      paidAt: null,
      items: [
        {
          id: 'inv-item-001',
          invoiceId: 'inv-001',
          jobId: 'job-003',
          description: '商品カタログ2025 (案件番号: 20240818)',
          quantity: 1,
          unit: '式',
          unitPrice: 1250000,
          lineTotal: 1250000,
          sortIndex: 0,
        },
      ],
    },
  ];

  const inboxItems: InboxItem[] = [
    {
      id: 'inbox-001',
      fileName: 'receipt_20251001.jpg',
      filePath: 'inbox/receipt_20251001.jpg',
      fileUrl: 'https://example.com/receipt_20251001.jpg',
      mimeType: 'image/jpeg',
      status: InboxItemStatus.PendingReview,
      extractedData: {
        vendorName: 'カフェ・ド・パリ',
        invoiceDate: '2025-10-01',
        totalAmount: 1500,
        description: '会議用コーヒー',
        costType: 'F',
        account: '会議費',
      },
      errorMessage: null,
      createdAt: '2025-10-01T15:00:00Z',
    },
  ];

  const departments: Department[] = [
    { id: 'dept-001', name: '営業部' },
    { id: 'dept-002', name: '製造部' },
    { id: 'dept-003', name: '経理部' },
  ];

  const paymentRecipients: PaymentRecipient[] = [
    { id: 'pay-rec-001', recipientCode: 'TR001', companyName: '東都紙業株式会社', recipientName: null },
    { id: 'pay-rec-002', recipientCode: 'KP001', companyName: '京浜加工サービス', recipientName: null },
  ];

  const userActivityLogs: UserActivityLog[] = [
    {
      id: 'log-001',
      user_id: 'user-001',
      action: 'login',
      details: { ip: '192.168.1.1' },
      created_at: '2025-10-07T09:00:00Z',
      user: { name: '田中 翔' },
    },
    {
      id: 'log-002',
      user_id: 'user-002',
      action: 'job_created',
      details: { jobId: 'job-001', title: '秋季キャンペーンチラシ' },
      created_at: '2025-10-05T03:15:00Z',
      user: { name: '高橋 美咲' },
    },
    {
      id: 'log-003',
      user_id: 'user-001',
      action: 'ai_company_analysis_completed',
      details: { customerId: 'cus-001', customerName: '株式会社ネオプリント' },
      created_at: '2025-10-04T11:00:00Z',
      user: { name: '田中 翔' },
    },
  ];

  const approvalHistory: ApprovalHistory[] = [
    {
      id: 'app-hist-001',
      application_id: 'app-001',
      user_id: 'user-002',
      action: 'submitted',
      comment: '得意先訪問の交通費申請を提出',
      created_at: '2025-10-04T02:45:00Z',
      user: { name: '高橋 美咲' },
    },
  ];

  const analysisProjects: AnalysisProject[] = [
    {
      id: 'proj-001',
      name: '新規事業参入分析',
      objective: '新市場への参入可能性と戦略を評価する',
      created_by: 'user-001',
      status: 'ready',
      created_at: '2025-08-01T00:00:00Z',
    },
  ];

  const documents: Document[] = [
    {
      id: 'doc-001',
      project_id: 'proj-001',
      file_name: '市場調査レポート.pdf',
      file_path: 'ai/proj-001/market_research.pdf',
      mime_type: 'application/pdf',
      status: 'processed',
      extracted_text: '日本のデジタル印刷市場は成長傾向にあり、特にパーソナライズ印刷の需要が高まっています。',
      created_at: '2025-08-05T00:00:00Z',
    },
  ];

  const bankScenarios: BankScenario[] = [
    {
      id: 'scenario-001',
      project_id: 'proj-001',
      name: '設備投資向け融資シミュレーション',
      sim_type: '借入枠',
      assumptions: {
        investment_amount: 50000000,
        interest_rate: 0.015,
        repayment_period_years: 7,
      },
      created_at: '2025-08-10T00:00:00Z',
      created_by: 'user-001',
    },
  ];

  const bankSimulations: BankSimulation[] = [
    {
      id: 'sim-001',
      scenario_id: 'scenario-001',
      inputs: {
        documents: ['doc-001'],
        assumptions: {
          investment_amount: 50000000,
          interest_rate: 0.015,
          repayment_period_years: 7,
        },
      },
      outputs: {
        summary: '新規設備投資に対する融資シミュレーションの結果、現在の財務状況であれば希望額の融資は十分可能であると判断されます。返済計画も無理のない範囲です。',
        result: {
          approved_loan_amount: 50000000,
          monthly_repayment: 630000,
          dsr: 0.25,
        },
      },
      source_artifacts: [{ file_id: 'doc-001', file_name: '市場調査レポート.pdf' }],
      status: 'succeeded',
      created_at: '2025-08-12T00:00:00Z',
      completed_at: '2025-08-12T00:05:00Z',
    },
  ];

  const allocationDivisions: AllocationDivision[] = [
    { id: 'alloc-001', name: '本社経費', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
    { id: 'alloc-002', name: '営業部経費', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  ];

  const titles: Title[] = [
    { id: 'title-001', name: '代表取締役', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
    { id: 'title-002', name: '部長', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  ];

  const aiArtifacts: AIArtifact[] = [
    {
      id: 'art-001',
      project_id: 'proj-001',
      kind: 'research',
      title: 'デジタル印刷市場の最新動向',
      body_md: '## 市場概要\n日本のデジタル印刷市場は年々拡大しており、特にパーソナライズされた製品や小ロット多品種生産の需要が高まっています。\n## 競合\n主要競合は〇〇社、△△社...',
      storage_path: null,
      status: 'ready',
      created_by: 'user-001',
      created_by_user: { name: '田中 翔' },
      createdAt: '2025-08-05T00:00:00Z',
      updatedAt: '2025-08-05T00:00:00Z',
    },
  ];

  return {
    jobs: clone(jobs),
    customers: clone(customers),
    journalEntries: clone(journalEntries),
    accountItems: clone(accountItems),
    leads: clone(leads),
    approvalRoutes: clone(approvalRoutes),
    purchaseOrders: clone(purchaseOrders),
    inventoryItems: clone(inventoryItems),
    employees: clone(employees),
    employeeUsers: clone(employeeUsers),
    bugReports: clone(bugReports),
    estimates: clone(estimates),
    applications: clone(applications),
    applicationCodes: clone(applicationCodes),
    invoices: clone(invoices),
    inboxItems: clone(inboxItems),
    departments: clone(departments),
    paymentRecipients: clone(paymentRecipients),
    userActivityLogs: clone(userActivityLogs),
    approvalHistory: clone(approvalHistory),
    analysisProjects: clone(analysisProjects),
    documents: clone(documents),
    bankScenarios: clone(bankScenarios),
    bankSimulations: clone(bankSimulations),
    allocationDivisions: clone(allocationDivisions),
    titles: clone(titles),
    aiArtifacts: clone(aiArtifacts),
  };
};