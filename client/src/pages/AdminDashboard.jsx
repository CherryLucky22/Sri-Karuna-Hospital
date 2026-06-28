import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LayoutDashboard, Users, Activity, FileText } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend
);

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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
    }, []);

    if (loading) return <div className="p-8 text-center">Loading dashboard data...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    const { stats, charts } = data;

    const lineChartData = {
        labels: charts.dailyOP.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Daily OP Registrations (Last 7 Days)',
                data: charts.dailyOP.map(d => d.count),
                borderColor: '#b30000',
                backgroundColor: 'rgba(179, 0, 0, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const doughnutData = {
        labels: charts.deptPatients.map(d => d.name),
        datasets: [
            {
                data: charts.deptPatients.map(d => d.count),
                backgroundColor: ['#FFD700', '#b30000', '#4CAF50', '#2196F3', '#9C27B0'],
                borderWidth: 0,
            }
        ]
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card border-t-4 border-t-primary">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Users className="w-4 h-4"/> Today's OP</p>
                    <h3 className="text-3xl font-black text-gray-800">{stats.todaysOP}</h3>
                </div>
                <div className="card border-t-4 border-t-green-500">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Activity className="w-4 h-4"/> Today's Revenue</p>
                    <h3 className="text-3xl font-black text-gray-800">₹{stats.todaysRevenue}</h3>
                </div>
                <div className="card border-t-4 border-t-blue-500">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><FileText className="w-4 h-4"/> Pharmacy Sales</p>
                    <h3 className="text-3xl font-black text-gray-800">₹{stats.todaysPharmacySales}</h3>
                </div>
                <div className="card border-t-4 border-t-accent">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Total Patients</p>
                    <h3 className="text-3xl font-black text-gray-800">{stats.totalPatients}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card">
                    <h3 className="text-lg font-bold mb-4">Patient Visits Trend</h3>
                    <div className="h-72 w-full">
                        <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card">
                    <h3 className="text-lg font-bold mb-4">Department Distribution</h3>
                    <div className="h-64 w-full flex justify-center">
                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
