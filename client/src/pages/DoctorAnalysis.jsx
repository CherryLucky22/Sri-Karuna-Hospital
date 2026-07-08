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

    const StatCard = ({ title, patients, revenue, icon: Icon, colorClass }) => (
        <div className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col ${colorClass}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg bg-white bg-opacity-70 shadow-sm ${colorClass.split(' ')[0].replace('bg-', 'text-')}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-white bg-opacity-60 rounded-lg p-4 flex flex-col justify-center items-center border border-white/50">
                    <Users className="w-5 h-5 text-gray-500 mb-1" />
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Patients</p>
                    <p className="text-2xl font-black text-gray-800">{patients || 0}</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded-lg p-4 flex flex-col justify-center items-center border border-white/50">
                    <IndianRupee className="w-5 h-5 text-gray-500 mb-1" />
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-2xl font-black text-green-700">₹{revenue?.toFixed(2) || '0.00'}</p>
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
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="w-7 h-7 text-primary" /> Hospital Analysis
                </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Daily Overview (Today)" 
                    patients={data?.daily?.patients} 
                    revenue={data?.daily?.revenue}
                    icon={TrendingUp}
                    colorClass="bg-blue-50 border-blue-100"
                />
                <StatCard 
                    title="Weekly Overview (Last 7 Days)" 
                    patients={data?.weekly?.patients} 
                    revenue={data?.weekly?.revenue}
                    icon={Calendar}
                    colorClass="bg-purple-50 border-purple-100"
                />
                <StatCard 
                    title="Monthly Overview (This Month)" 
                    patients={data?.monthly?.patients} 
                    revenue={data?.monthly?.revenue}
                    icon={BarChart3}
                    colorClass="bg-pink-50 border-pink-100"
                />
                <StatCard 
                    title="Last Month Overview" 
                    patients={data?.lastMonth?.patients} 
                    revenue={data?.lastMonth?.revenue}
                    icon={Calendar}
                    colorClass="bg-orange-50 border-orange-100"
                />
                <StatCard 
                    title="Yearly Overview (This Year)" 
                    patients={data?.yearly?.patients} 
                    revenue={data?.yearly?.revenue}
                    icon={TrendingUp}
                    colorClass="bg-teal-50 border-teal-100"
                />
                <StatCard 
                    title="All-Time Overview" 
                    patients={data?.allTime?.patients} 
                    revenue={data?.allTime?.revenue}
                    icon={BarChart3}
                    colorClass="bg-indigo-50 border-indigo-100"
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
