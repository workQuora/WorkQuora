import React from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Building, 
  History, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

const WalletDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 lg:p-10">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight">My Wallet</h1>
        <p className="text-gray-400 mt-1">Manage your funds, payments, and transaction history</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Balance & Payment Methods */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl border border-indigo-400/30 shadow-lg shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Wallet size={80} />
            </div>
            <p className="text-indigo-100 text-sm font-medium mb-2 uppercase tracking-wider">Available Balance</p>
            <h2 className="text-5xl font-black text-white mb-6">₹84,500</h2>
            
            <div className="flex gap-3 relative z-10">
              <button className="flex-1 bg-white text-indigo-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                <ArrowUpRight size={18} /> Withdraw
              </button>
              <button className="flex-1 bg-indigo-900/50 border border-indigo-400/50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-900/70 transition-colors">
                <ArrowDownRight size={18} /> Add Funds
              </button>
            </div>
          </div>

          {/* Linked Payment Methods */}
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Payment Methods</h3>
              <button className="text-indigo-400 text-sm font-bold hover:text-indigo-300">Add New</button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                <div className="bg-gray-800 p-3 rounded-xl">
                  <Building size={20} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">HDFC Bank</h4>
                  <p className="text-xs text-gray-400">**** **** 4567</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase">Primary</span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                <div className="bg-gray-800 p-3 rounded-xl">
                  <CreditCard size={20} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">Visa Debit</h4>
                  <p className="text-xs text-gray-400">**** 8901</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Transactions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Mini Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-3xl flex items-center gap-5">
              <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-400">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Withdrawn</p>
                <h3 className="text-2xl font-extrabold">₹3,40,000</h3>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-3xl flex items-center gap-5">
              <div className="bg-orange-500/10 p-4 rounded-2xl text-orange-400">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Pending Clearance</p>
                <h3 className="text-2xl font-extrabold">₹12,500</h3>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History size={20} className="text-gray-400" /> Recent Activity
              </h3>
              <button className="text-gray-400 text-sm hover:text-white transition-colors">View All</button>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Withdrawal to HDFC Bank', date: 'Today, 10:30 AM', amount: '-₹15,000', type: 'debit', status: 'completed' },
                { title: 'Payment: Website Redesign', date: 'Yesterday', amount: '+₹42,000', type: 'credit', status: 'completed' },
                { title: 'Payment: Dashboard UI', date: '3 days ago', amount: '+₹35,000', type: 'credit', status: 'pending' },
                { title: 'Platform Fee Deduction', date: '3 days ago', amount: '-₹1,750', type: 'debit', status: 'completed' },
                { title: 'Withdrawal to HDFC Bank', date: '1 week ago', amount: '-₹20,000', type: 'debit', status: 'completed' },
              ].map((tx, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-gray-900/40 rounded-2xl border border-gray-700/30 hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tx.type === 'credit' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{tx.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-base ${tx.type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.amount}
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${tx.status === 'completed' ? 'text-gray-500' : 'text-orange-400'}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;