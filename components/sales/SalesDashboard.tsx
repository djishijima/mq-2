import React, { useMemo } from 'react';
import { Job, Lead, LeadStatus } from '../../types';
import { formatJPY } from '../../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../StatCard';
import { DollarSign, TrendingUp, Users, Package } from '../Icons';

interface SalesDashboardProps {
    jobs: Job[];
    leads: Lead[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SalesDashboard: React.FC<SalesDashboardProps> = ({ jobs, leads }) => {
    
    const salesData = useMemo(() => {
        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();

        const currentMonthJobs = jobs.filter(job => {
            const jobDate = new Date(job.createdAt);
            return jobDate.getFullYear() === thisYear && jobDate.getMonth() === thisMonth;
        });

        const thisMonthSales = currentMonthJobs.reduce((sum, job) => sum + job.price, 0);
        const thisMonthJobCount = currentMonthJobs.length;

        const monthlySales: Record<string, number> = {};
        for(let i=0; i<12; i++) {
            const d = new Date(thisYear, thisMonth - i, 1);
            const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlySales[key] = 0;
        }

        jobs.forEach(job => {
            const d = new Date(job.createdAt);
            const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (monthlySales.hasOwnProperty(key)) {
                monthlySales[key] += job.price;
            }
        });

        const salesChartData = Object.entries(monthlySales).map(([name, value]) => ({name, "売上": value})).reverse();
        
        const leadSourceData = leads.reduce((acc, lead) => {
            const source = lead.source || '不明';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const leadSourceChartData = Object.entries(leadSourceData).map(([name, value]) => ({name, value}));

        const convertedLeads = leads.filter(l => l.status === LeadStatus.Converted || l.status === LeadStatus.Closed).length;
        const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;

        return { salesChartData, leadSourceChartData, thisMonthSales, thisMonthJobCount, convertedLeads, conversionRate };

    }, [jobs, leads]);

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="今月の売上高" value={formatJPY(salesData.thisMonthSales)} icon={<DollarSign className="w-6 h-6 text-green-600"/>} />
                <StatCard title="今月の案件数" value={`${salesData.thisMonthJobCount}`} icon={<Package className="w-6 h-6 text-indigo-600"/>} />
                <StatCard title="コンバージョン数 (累計)" value={`${salesData.convertedLeads}`} icon={<Users className="w-6 h-6 text-blue-600"/>} />
                <StatCard title="コンバージョン率 (累計)" value={`${salesData.conversionRate.toFixed(1)}%`} icon={<TrendingUp className="w-6 h-6 text-purple-600"/>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xl font-semibold mb-4">月別売上</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesData.salesChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis tickFormatter={(value) => `¥${value / 1000}k`} fontSize={12} />
                            <Tooltip formatter={(value: number) => [formatJPY(value), '売上']} />
                            <Bar dataKey="売上" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xl font-semibold mb-4">リードソース分析</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={salesData.leadSourceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {salesData.leadSourceChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => `${value}件`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;