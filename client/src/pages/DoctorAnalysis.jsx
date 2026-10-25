import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, TrendingUp, Users, Calendar, IndianRupee } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DoctorAnalysis = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const res = await api.get('/doctors/analysis');
                setData(res.data);
            } catch (error) {
                console.error("Analysis fetch error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    const StatCard = ({ title, patients, revenue, icon: Icon, gradientFrom, gradientTo, iconColor, iconBg }) => (
        <div className="group relative bg-white rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col h-full">
            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700`}></div>
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <h3 className="text-[15px] font-bold text-gray-800 leading-tight tracking-tight flex-1 pr-2">{title}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 flex-1 relative z-10">
                <div className="bg-gray-50/80 rounded-2xl p-4 flex flex-col justify-between border border-gray-100/50 group-hover:bg-blue-50/30 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-blue-100/50 p-1.5 rounded-lg">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Patients</p>
                    </div>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">{patients || 0}</p>
                </div>
                
                <div className="bg-gray-50/80 rounded-2xl p-4 flex flex-col justify-between border border-gray-100/50 group-hover:bg-emerald-50/30 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-emerald-100/50 p-1.5 rounded-lg">
                            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Revenue</p>
                    </div>
                    <p className="text-xl font-black text-emerald-600 tracking-tight">₹{(revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
        </div>
    );

    const patientChartData = {
        labels: ['Today', 'Last 7 Days', 'This Month', 'Last Month', 'This Year'],
        datasets: [
            {
                label: 'Patients',
                data: [data?.daily?.patients || 0, data?.weekly?.patients || 0, data?.monthly?.patients || 0, data?.lastMonth?.patients || 0, data?.yearly?.patients || 0],
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }
        ]
    };

    const revenueChartData = {
        labels: ['Today', 'Last 7 Days', 'This Month', 'Last Month', 'This Year'],
        datasets: [
            {
                label: 'Revenue (₹)',
                data: [data?.daily?.revenue || 0, data?.weekly?.revenue || 0, data?.monthly?.revenue || 0, data?.lastMonth?.revenue || 0, data?.yearly?.revenue || 0],
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    return (
        <div className="h-full space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        Hospital Analysis
                    </h2>
                    <p className="text-slate-500 font-medium mt-2 ml-14">Comprehensive overview of patient and revenue metrics.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Daily Overview (Today)" 
                    patients={data?.daily?.patients} 
                    revenue={data?.daily?.revenue}
                    icon={TrendingUp}
                    gradientFrom="from-blue-400" gradientTo="to-indigo-500" iconColor="text-blue-600" iconBg="bg-blue-50"
                />
                <StatCard 
                    title="Weekly Overview (Last 7 Days)" 
                    patients={data?.weekly?.patients} 
                    revenue={data?.weekly?.revenue}
                    icon={Calendar}
                    gradientFrom="from-purple-400" gradientTo="to-pink-500" iconColor="text-purple-600" iconBg="bg-purple-50"
                />
                <StatCard 
                    title="Monthly Overview (This Month)" 
                    patients={data?.monthly?.patients} 
                    revenue={data?.monthly?.revenue}
                    icon={BarChart3}
                    gradientFrom="from-emerald-400" gradientTo="to-teal-500" iconColor="text-emerald-600" iconBg="bg-emerald-50"
                />
                <StatCard 
                    title="Last Month Overview" 
                    patients={data?.lastMonth?.patients} 
                    revenue={data?.lastMonth?.revenue}
                    icon={Calendar}
                    gradientFrom="from-orange-400" gradientTo="to-red-500" iconColor="text-orange-600" iconBg="bg-orange-50"
                />
                <StatCard 
                    title="Yearly Overview (This Year)" 
                    patients={data?.yearly?.patients} 
                    revenue={data?.yearly?.revenue}
                    icon={TrendingUp}
                    gradientFrom="from-cyan-400" gradientTo="to-blue-500" iconColor="text-cyan-600" iconBg="bg-cyan-50"
                />
                <StatCard 
                    title="All-Time Overview" 
                    patients={data?.allTime?.patients} 
                    revenue={data?.allTime?.revenue}
                    icon={BarChart3}
                    gradientFrom="from-indigo-400" gradientTo="to-purple-500" iconColor="text-indigo-600" iconBg="bg-indigo-50"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500"/> Patient Trends
                    </h3>
                    <div className="h-64">
                        <Bar data={patientChartData} options={chartOptions} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-green-500"/> Revenue Trends
                    </h3>
                    <div className="h-64">
                        <Bar data={revenueChartData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorAnalysis;
