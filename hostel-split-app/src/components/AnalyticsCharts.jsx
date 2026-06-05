import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AnalyticsCharts({ expenses, members }) {
  const [timeframe, setTimeframe] = useState('month');

  const userContributionMap = {};
  members.forEach(m => { userContributionMap[m.id] = { name: m.full_name, total: 0 } });

  expenses.forEach(exp => {
    const expDate = new Date(exp.created_at);
    const now = new Date();
    const diffTime = Math.abs(now - expDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (timeframe === 'week' && diffDays > 7) return;
    if (timeframe === 'month' && diffDays > 30) return;
    if (timeframe === 'year' && diffDays > 365) return;

    if (userContributionMap[exp.paid_by]) {
      userContributionMap[exp.paid_by].total += parseFloat(exp.amount);
    }
  });

  const chartData = Object.values(userContributionMap).filter(item => item.total > 0);
  const aggregateTotal = chartData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm text-gray-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h4 className="text-lg font-bold text-gray-900">Spending Volume</h4>
          <p className="text-sm text-gray-500">Aggregate total: <span className="font-semibold text-gray-800">₹{aggregateTotal.toFixed(2)}</span></p>
        </div>
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          {['week', 'month', 'year'].map((t) => (
            <button key={t} className={`px-3 py-1 text-xs font-semibold rounded-md capitalize ${timeframe === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setTimeframe(t)}>{t}</button>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${parseFloat(value).toFixed(2)}`} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400 border border-dashed rounded-lg">No points found in range.</div>
      )}
    </div>
  );
}