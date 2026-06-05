import { useState, useEffect } from 'react';
import { ArrowLeft, Landmark, Receipt, Trash2, Calendar, ShieldAlert, ShoppingBag, Utensils, Car, Lightbulb, PieChart, Users, Copy, Download } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function RoomView({ room, token, userId, onBack }) {
  const [members, setMembers] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [balances, setBalances] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [splitType, setSplitType] = useState('equal');
  const [exactAmounts, setExactAmounts] = useState({});
  const [showCharts, setShowCharts] = useState(true);
  const [settlements, setSettlements] = useState([]);
  const [showSettlements, setShowSettlements] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showSettlementHistory, setShowSettlementHistory] = useState(false);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const isAdmin = room.creator_id === userId;

  const loadRoomState = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/rooms/${room.id}/data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
        setTimeline(data.timeline || []);
        setBalances(data.balances || []);
      }
    } catch (err) {
      console.error('Error loading room:', err);
    }
  };

  const loadSettlements = async () => {
    const res = await fetch(`http://localhost:5000/api/rooms/${room.id}/settlements`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setSettlements(data);
  };

  const loadPendingRequests = async () => {
    if (!isAdmin) return;
    const res = await fetch(`http://localhost:5000/api/rooms/${room.id}/pending-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setPendingRequests(data);
  };

  useEffect(() => {
    loadRoomState();
    loadSettlements();
    if (isAdmin) loadPendingRequests();
  }, [room.id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const targetMail = formData.get('email');
    const targetUid = formData.get('unique_code');
    
    const res = await fetch(`http://localhost:5000/api/rooms/${room.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ email: targetMail, unique_code: targetUid })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Roommate successfully added!');
      e.target.reset();
      loadRoomState();
      loadSettlements();
    } else {
      alert(data.error || 'Failed to add member');
    }
  };

  const handleExactAmountChange = (id, val) => {
    setExactAmounts({ ...exactAmounts, [id]: parseFloat(val) || 0 });
  };

  const handleLoggedBill = async (e) => {
    e.preventDefault();
    const totalAmount = parseFloat(amount);
    if (!totalAmount || !description.trim()) {
      alert('Please fill all fields');
      return;
    }

    let splits = [];
    if (splitType === 'equal') {
      const share = totalAmount / members.length;
      splits = members.map(m => ({ user_id: m.id, amount_owed: share }));
    } else {
      let sum = 0;
      splits = members.map(m => {
        const owed = exactAmounts[m.id] || 0;
        sum += owed;
        return { user_id: m.id, amount_owed: owed };
      });
      if (Math.abs(sum - totalAmount) > 0.01) {
        alert(`Total exact amounts (₹${sum.toFixed(2)}) must equal total expense (₹${totalAmount.toFixed(2)})`);
        return;
      }
    }

    const res = await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ room_id: room.id, amount: totalAmount, description, category, split_type: splitType, splits })
    });

    if (res.ok) {
      setAmount('');
      setDescription('');
      setExactAmounts({});
      loadRoomState();
      loadSettlements();
      alert('Expense added successfully!');
    } else {
      alert('Failed to add expense');
    }
  };

  const handlePurge = async (timeframe) => {
    if (!confirm(`Are you sure you want to delete ${timeframe} ledger items?`)) return;
    const res = await fetch(`http://localhost:5000/api/rooms/${room.id}/expenses/purge`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ timeframe })
    });
    if (res.ok) {
      alert('Purge complete.');
      loadRoomState();
      loadSettlements();
    }
  };

  const handleApproveRequest = async (requestId, action) => {
    const res = await fetch(`http://localhost:5000/api/rooms/${room.id}/approve-request`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ request_id: requestId, action })
    });
    
    if (res.ok) {
      alert(action === 'approve' ? 'User approved!' : 'Request rejected');
      loadPendingRequests();
      loadRoomState();
      loadSettlements();
    }
  };

  const exportToCSV = async () => {
    setExportLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/rooms/${room.id}/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      const headers = ['Date', 'Description', 'Category', 'Amount', 'Paid By', 'Split With'];
      const csvRows = [headers];
      
      data.forEach(row => {
        csvRows.push([
          new Date(row.date).toLocaleDateString(),
          row.description,
          row.category,
          row.amount,
          row.paid_by,
          row.split_with
        ]);
      });
      
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${room.name}_expenses_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert('Export successful!');
    } catch (err) {
      alert('Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  // Send settlement email to all members
  const sendSettlementEmail = async () => {
    setSendingEmail(true);
    try {
        const res = await fetch(`http://localhost:5000/api/rooms/${room.id}/send-settlement-email`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            alert(`✅ ${data.message}`);
        } else {
            alert('Failed to send emails');
        }
    } catch (err) {
        alert('Error sending emails');
    } finally {
        setSendingEmail(false);
    }
  };

  // Mark settlement as cleared
  const markAsSettled = async (fromId, toId, amount) => {
    if (!confirm(`Confirm that you received ₹${amount.toFixed(2)} from this person?`)) return;
    
    try {
        const res = await fetch(`http://localhost:5000/api/rooms/${room.id}/settle-payment`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ from_user_id: fromId, to_user_id: toId, amount })
        });
        
        if (res.ok) {
            alert('✅ Payment recorded! Settlement cleared.');
            loadSettlements();
            loadRoomState();
        } else {
            alert('Failed to record settlement');
        }
    } catch (err) {
        alert('Error recording settlement');
    }
  };

  // Load settlement history
  const loadSettlementHistory = async () => {
    const res = await fetch(`http://localhost:5000/api/rooms/${room.id}/settlement-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setSettlementHistory(data);
  };

  const getExpenseChartData = () => {
    const contributionMap = {};
    members.forEach(m => {
      contributionMap[m.id] = { name: m.full_name, amount: 0 };
    });
    
    timeline.forEach(day => {
      day.items.forEach(exp => {
        if (contributionMap[exp.paid_by]) {
          contributionMap[exp.paid_by].amount += exp.amount;
        }
      });
    });
    
    return Object.values(contributionMap).filter(d => d.amount > 0);
  };

  const chartData = getExpenseChartData();
  const totalSpent = chartData.reduce((sum, d) => sum + d.amount, 0);
  const highestPayer = chartData.length > 0 ? chartData.reduce((a, b) => a.amount > b.amount ? a : b) : null;

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Food': return <Utensils size={16} className="text-amber-600" />;
      case 'Rent': return <ShoppingBag size={16} className="text-emerald-600" />;
      case 'Utilities': return <Lightbulb size={16} className="text-blue-600" />;
      default: return <Car size={16} className="text-gray-600" />;
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Food': return 'bg-amber-50 border-amber-100';
      case 'Rent': return 'bg-emerald-50 border-emerald-100';
      case 'Utilities': return 'bg-blue-50 border-blue-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-800 dark:text-gray-200 font-sans transition-colors">
      <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition shadow-sm">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{room.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">ROOM CODE: {room.invite_code}</p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(room.invite_code);
                  alert('Room code copied!');
                }}
                className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={exportToCSV}
            disabled={exportLoading}
            className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 font-medium transition flex items-center gap-1"
          >
            <Download size={13}/> {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
          
          <button 
            onClick={() => setShowSettlements(!showSettlements)}
            className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition flex items-center gap-1"
          >
            💰 {showSettlements ? 'Hide' : 'Show'} Settlements
          </button>
          
          <button 
            onClick={sendSettlementEmail}
            disabled={sendingEmail}
            className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition flex items-center gap-1"
          >
            📧 {sendingEmail ? 'Sending...' : 'Email Summary'}
          </button>
          
          <button 
            onClick={() => setShowCharts(!showCharts)}
            className={`text-xs px-3 py-1.5 border rounded-lg transition flex items-center gap-1 ${showCharts ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
          >
            <PieChart size={13}/> {showCharts ? 'Hide Charts' : 'Show Charts'}
          </button>
          
          {isAdmin && (
            <>
              <button 
                onClick={() => setShowRequests(!showRequests)}
                className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 font-medium transition flex items-center gap-1 relative"
              >
                👥 Join Requests
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button onClick={() => handlePurge('week')} className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition flex items-center gap-1">
                <Trash2 size={13}/> Clear Week
              </button>
              <button onClick={() => handlePurge('month')} className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition flex items-center gap-1">
                <Trash2 size={13}/> Clear Month
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expense Form */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Receipt size={16} className="text-indigo-600 dark:text-indigo-400"/> Log Room Bill</h3>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Split Method</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button 
                  type="button" 
                  className={`py-1.5 text-xs font-medium rounded-md text-center transition ${splitType === 'equal' ? 'bg-white dark:bg-gray-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`} 
                  onClick={() => setSplitType('equal')}
                >
                  Split Equally
                </button>
                <button 
                  type="button" 
                  className={`py-1.5 text-xs font-medium rounded-md text-center transition ${splitType === 'exact' ? 'bg-white dark:bg-gray-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`} 
                  onClick={() => setSplitType('exact')}
                >
                  Exact Amounts
                </button>
              </div>
            </div>

            <form onSubmit={handleLoggedBill} className="space-y-3">
              <input 
                type="text" 
                placeholder="Item Description" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900" 
                required 
              />
              
              <input 
                type="number" 
                step="0.01" 
                placeholder="Amount (₹)" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900" 
                required 
              />
              
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Food">🍿 Food / Groceries</option>
                <option value="Rent">🏡 Rent / Stay</option>
                <option value="Utilities">⚡ Utilities / WiFi</option>
                <option value="Other">📦 Other Supplies</option>
              </select>

              {splitType === 'exact' && members.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Enter exact amounts for each member:</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{m.full_name}</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="₹ Amount" 
                          className="w-32 p-1.5 text-sm border rounded-lg text-right outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                          value={exactAmounts[m.id] || ''}
                          onChange={e => handleExactAmountChange(m.id, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Total: ₹{Object.values(exactAmounts).reduce((a,b) => a + (b || 0), 0).toFixed(2)}</p>
                </div>
              )}

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl text-sm transition">
                {splitType === 'equal' ? 'Split Equally Between Roommates' : 'Save with Exact Amounts'}
              </button>
            </form>
          </div>

          {/* Timeline Ledger */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2"><Calendar size={14}/> Expense Timeline</h3>
            {timeline.length > 0 ? (
              timeline.map(group => (
                <div key={group.dayLabel} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5"><Calendar size={13}/> {group.dayLabel}</span>
                    <span className="text-xs font-mono font-bold text-gray-400 dark:text-gray-500">Total: ₹{group.totalDayVolume.toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {group.items.map(exp => (
                      <div key={exp.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${getCategoryColor(exp.category)} dark:bg-gray-700`}>
                            {getCategoryIcon(exp.category)}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{exp.description}</h4>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Paid by <span className="font-semibold text-gray-600 dark:text-gray-400">{exp.paid_by_name}</span></p>
                          </div>
                        </div>
                        <span className="font-mono font-black text-sm text-gray-900 dark:text-white">₹{exp.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 dark:text-gray-500 text-sm font-medium">
                No expenses yet. Add your first expense above!
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Balance Summary */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Landmark size={16} className="text-indigo-600 dark:text-indigo-400"/> Balance Summary</h3>
            {balances.length > 0 ? (
              <div className="space-y-2.5">
                {balances.map(b => (
                  <div key={b.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: b.avatar_color || '#4F46E5' }}>
                        {b.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{b.full_name}</span>
                    </div>
                    <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${b.net >= 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800'}`}>
                      {b.net >= 0 ? `+ ₹${b.net.toFixed(2)}` : `- ₹${Math.abs(b.net).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No members yet</p>
            )}
          </div>

          {/* Charts Section */}
          {showCharts && (
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><PieChart size={16} className="text-indigo-600 dark:text-indigo-400"/> Spending Analytics</h3>
              
              {chartData.length > 0 ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={chartData}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={3}
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Spent']} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent: <span className="font-bold text-gray-900 dark:text-white text-sm">₹{totalSpent.toFixed(2)}</span></p>
                    {highestPayer && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        👑 <span className="font-semibold text-indigo-600 dark:text-indigo-400">{highestPayer.name}</span> paid the most
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <PieChart size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Add expenses to see charts</p>
                </div>
              )}
            </div>
          )}

          {/* Admin Panel */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-1.5"><Users size={16} className="text-indigo-600 dark:text-indigo-400"/> Add Roommate</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Ask your friend for their Unique ID from their Profile page</p>
              <form onSubmit={handleAddMember} className="space-y-3">
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Friend's Email Address" 
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900" 
                  required 
                />
                <input 
                  type="text" 
                  name="unique_code" 
                  placeholder="Their Unique ID (HS-XXXX-XX)" 
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono tracking-wider uppercase outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900" 
                  required 
                />
                <button type="submit" className="w-full bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-semibold py-2 rounded-xl text-sm transition shadow-md">
                  Add Member to Room
                </button>
              </form>
            </div>
          )}

          {/* Room Members List */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Users size={16} className="text-indigo-600 dark:text-indigo-400"/> Room Members ({members.length})</h3>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: m.avatar_color || '#4F46E5' }}>
                      {m.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{m.full_name}</span>
                    {m.id === room.creator_id && (
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">Admin</span>
                    )}
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(m.unique_code)}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Copy Unique ID"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settlements Modal */}
      {showSettlements && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">💰 Settlement Plan</h3>
              <button onClick={() => setShowSettlements(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>
            
            <div className="space-y-3">
              {settlements.length > 0 ? settlements.map((s, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-red-600 dark:text-red-400">{s.from}</span>
                      <span className="text-gray-500 dark:text-gray-400"> → </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{s.to}</span>
                    </div>
                    <div className="font-mono font-bold text-lg text-gray-900 dark:text-white">₹{s.amount.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => markAsSettled(s.from_id, s.to_id, s.amount)}
                    className="w-full mt-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                  >
                    ✅ Mark as Settled
                  </button>
                </div>
              )) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">✨ All settled up! No payments needed.</p>
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
              <button 
                onClick={sendSettlementEmail}
                disabled={sendingEmail}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                📧 {sendingEmail ? 'Sending...' : 'Email Summary to All'}
              </button>
              <button 
                onClick={() => {
                  loadSettlementHistory();
                  setShowSettlementHistory(true);
                }}
                className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                📜 View History
              </button>
            </div>
            
            <button onClick={() => setShowSettlements(false)} className="w-full mt-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settlement History Modal */}
      {showSettlementHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">📜 Settlement History</h3>
              <button onClick={() => setShowSettlementHistory(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>
            
            {settlementHistory.length > 0 ? (
              <div className="space-y-2">
                {settlementHistory.map(s => (
                  <div key={s.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">{s.from_name}</span>
                        <span className="text-gray-500 dark:text-gray-400"> → </span>
                        <span className="font-semibold text-gray-900 dark:text-white">{s.to_name}</span>
                      </div>
                      <div className="font-mono font-bold text-green-600 dark:text-green-400">₹{parseFloat(s.amount).toFixed(2)}</div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Cleared by {s.settled_by_name} • {new Date(s.settled_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No settlement history yet</p>
            )}
            
            <button onClick={() => setShowSettlementHistory(false)} className="w-full mt-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Join Requests Modal */}
      {showRequests && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">👥 Join Requests</h3>
              <button onClick={() => setShowRequests(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>
            
            {pendingRequests.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: req.avatar_color || '#4F46E5' }}>
                        {req.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{req.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{req.email}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">ID: {req.unique_code}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveRequest(req.id, 'approve')} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                        ✅ Approve
                      </button>
                      <button onClick={() => handleApproveRequest(req.id, 'reject')} className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}