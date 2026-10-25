import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LayoutDashboard, Users, Activity, FileText, Clock, Calendar, Sparkles } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/dashboard');
                setData(res.data);
            } catch (error) {
                console.error("Dashboard error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (loading) return <div className="p-8 text-center animate-pulse">Loading command center...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    const { stats, charts } = data;

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                titleColor: '#1f2937',
                bodyColor: '#4b5563',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
            }
        },
        scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { display: false }, border: { display: false }, ticks: { display: false } }
        },
        interaction: { mode: 'index', intersect: false },
    };

    const lineChartData = {
        labels: charts.dailyOP.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [{
            label: 'Visits',
            data: charts.dailyOP.map(d => d.count),
            borderColor: '#b30000',
            backgroundColor: 'rgba(179, 0, 0, 0.05)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
        }]
    };

    const doughnutData = {
        labels: charts.deptPatients.map(d => d.name),
        datasets: [{
            data: charts.deptPatients.map(d => d.count),
            backgroundColor: ['#FFD700', '#b30000', '#4CAF50', '#2196F3', '#9C27B0'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    return (
        <div className="space-y-6">
            {/* Command Center Header */}
            <div className="card border-none bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 flex flex-col md:flex-row justify-between items-center animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-2">
                        Good Morning, Admin <Sparkles className="w-5 h-5 text-yellow-400" />
                    </h2>
                    <p className="text-gray-400 font-medium tracking-wide">Here is what's happening at Sri Karuna Hospital today.</p>
                </div>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                        <Calendar className="w-5 h-5 text-blue-300" />
                        <span className="font-semibold">{currentTime.toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                        <Clock className="w-5 h-5 text-yellow-300" />
                        <span className="font-mono font-bold text-lg">{currentTime.toLocaleTimeString('en-IN', { timeStyle: 'short' })}</span>
                    </div>
                </div>
            </div>
            
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Primary Stats - 8 columns */}
                <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card border-none bg-gradient-to-br from-purple-100/80 to-purple-50/50 relative overflow-hidden group shadow-md hover:shadow-xl p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-purple-300/50 rounded-full blur-3xl group-hover:bg-purple-400/50 transition-colors duration-500"></div>
                        <p className="text-xs text-purple-800 mb-2 flex items-center gap-2 font-bold relative z-10 uppercase tracking-widest"><Activity className="w-4 h-4"/> All-Time Revenue</p>
                        <h3 className="text-5xl font-black text-purple-950 relative z-10 tracking-tighter mt-2">₹{stats.totalRevenue?.toLocaleString('en-IN') || 0}</h3>
                        <p className="text-sm font-medium text-purple-700/70 mt-4 relative z-10">Total lifetime collection</p>
                    </div>

                    <div className="card border-none bg-gradient-to-br from-green-50/80 to-green-100/50 relative overflow-hidden group shadow-md hover:shadow-xl p-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-green-200/50 rounded-full blur-3xl group-hover:bg-green-300/60 transition-colors duration-500"></div>
                        <p className="text-xs text-green-700 mb-2 flex items-center gap-2 font-bold relative z-10 uppercase tracking-widest"><Activity className="w-4 h-4"/> Today's Revenue</p>
                        <h3 className="text-5xl font-black text-green-900 relative z-10 tracking-tighter mt-2">₹{stats.todaysRevenue?.toLocaleString('en-IN') || 0}</h3>
                        <p className="text-sm font-medium text-green-700/70 mt-4 relative z-10">Combined OP & Pharmacy</p>
                    </div>
                </div>

                {/* Secondary Stats - 4 columns vertical stack */}
                <div className="md:col-span-4 flex flex-col gap-6">
                    <div className="card border-none bg-gradient-to-br from-red-50/80 to-white/50 relative overflow-hidden group flex-1 p-5 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <div className="absolute right-0 bottom-0 w-20 h-20 bg-red-200/40 rounded-full blur-2xl transition-colors"></div>
                        <p className="text-xs text-red-700 mb-1 flex items-center gap-2 font-bold uppercase tracking-widest relative z-10"><Users className="w-4 h-4"/> Today's OP</p>
                        <h3 className="text-3xl font-black text-gray-800 relative z-10 tracking-tight">{stats.todaysOP}</h3>
                    </div>
                    <div className="card border-none bg-gradient-to-br from-blue-50/80 to-white/50 relative overflow-hidden group flex-1 p-5 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <div className="absolute right-0 bottom-0 w-20 h-20 bg-blue-200/40 rounded-full blur-2xl transition-colors"></div>
                        <p className="text-xs text-blue-700 mb-1 flex items-center gap-2 font-bold uppercase tracking-widest relative z-10"><FileText className="w-4 h-4"/> Pharmacy Sales (Today)</p>
                        <h3 className="text-3xl font-black text-gray-800 relative z-10 tracking-tight">₹{stats.todaysPharmacySales?.toLocaleString('en-IN') || 0}</h3>
                    </div>
                    <div className="card border-none bg-gradient-to-br from-yellow-50/80 to-white/50 relative overflow-hidden group flex-1 p-5 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                        <div className="absolute right-0 bottom-0 w-20 h-20 bg-yellow-200/40 rounded-full blur-2xl transition-colors"></div>
                        <p className="text-xs text-yellow-700 mb-1 flex items-center gap-2 font-bold uppercase tracking-widest relative z-10"><LayoutDashboard className="w-4 h-4"/> Total Patients</p>
                        <h3 className="text-3xl font-black text-gray-800 relative z-10 tracking-tight">{stats.totalPatients}</h3>
                    </div>
                </div>

                {/* Charts Area - Bento Grid */}
                <div className="md:col-span-8 card p-8 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Patient Visits Trend</h3>
                        <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">Last 7 Days</span>
                    </div>
                    <div className="h-64 w-full">
                        <Line data={lineChartData} options={chartOptions} />
                    </div>
                </div>

                <div className="md:col-span-4 card p-8 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 text-center">Department Split</h3>
                    <div className="h-64 w-full flex justify-center relative">
                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } } }, cutout: '75%' }} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <span className="text-3xl font-black text-gray-800 tracking-tight">{charts.deptPatients.reduce((acc, curr) => acc + curr.count, 0)}</span>
                            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
