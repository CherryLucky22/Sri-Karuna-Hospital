import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, CreditCard, Clock, CheckCircle, HeartPulse, X, Save, Calendar, Sparkles, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReceptionDashboard = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedVisitForVitals, setSelectedVisitForVitals] = useState(null);
    const [vitals, setVitals] = useState({
        blood_pressure: '', heart_rate: '', temperature: '', spo2: '', weight: ''
    });

    useEffect(() => {
        const fetchVisits = async () => {
            try {
                const res = await api.get('/visits/today');
                setVisits(res.data);
            } catch (error) {
                console.error("Failed to fetch visits", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVisits();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSaveVitals = async () => {
        try {
            await api.post(`/visits/${selectedVisitForVitals.id}/vitals`, vitals);
            alert("Vitals saved successfully");
            setSelectedVisitForVitals(null);
            setVitals({ blood_pressure: '', heart_rate: '', temperature: '', spo2: '', weight: '' });
        } catch (error) {
            console.error(error);
            alert("Failed to save vitals");
        }
    };

    const stats = {
        totalOP: visits.length,
        revenue: visits.reduce((acc, curr) => acc + parseFloat(curr.consultation_fee), 0),
        waiting: visits.filter(v => v.status === 'Waiting').length,
        completed: visits.filter(v => v.status === 'Completed').length,
    };

    return (
        <div className="space-y-6">
            {/* Command Center Header */}
            <div className="card border-none bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-8 flex flex-col md:flex-row justify-between items-center animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-2">
                        Front Desk Command Center <Sparkles className="w-5 h-5 text-yellow-400" />
                    </h2>
                    <p className="text-blue-200 font-medium tracking-wide">Manage patient flow and registrations efficiently.</p>
                </div>
                <div className="flex flex-wrap gap-4 mt-6 md:mt-0 items-center">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                            <Calendar className="w-5 h-5 text-blue-300" />
                            <span className="font-semibold">{currentTime.toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                            <Clock className="w-5 h-5 text-yellow-300" />
                            <span className="font-mono font-bold text-lg">{currentTime.toLocaleTimeString('en-IN', { timeStyle: 'short' })}</span>
                        </div>
                    </div>
                    <Link to="/reception/register" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 px-6 py-2.5 rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2 border-none">
                        <Plus className="w-5 h-5" /> New Registration
                    </Link>
                </div>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card border-none bg-gradient-to-br from-blue-50/80 to-white/50 relative overflow-hidden group shadow-md hover:shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-200/40 rounded-full blur-2xl group-hover:bg-blue-300/50 transition-colors"></div>
                    <p className="text-xs text-blue-700 mb-2 flex items-center gap-2 font-bold relative z-10 uppercase tracking-widest"><Users className="w-4 h-4"/> Today's OP</p>
                    <h3 className="text-4xl font-black text-gray-800 relative z-10 tracking-tight">{stats.totalOP}</h3>
                </div>
                
                <div className="card border-none bg-gradient-to-br from-green-50/80 to-white/50 relative overflow-hidden group shadow-md hover:shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-200/40 rounded-full blur-2xl group-hover:bg-green-300/50 transition-colors"></div>
                    <p className="text-xs text-green-700 mb-2 flex items-center gap-2 font-bold relative z-10 uppercase tracking-widest"><CreditCard className="w-4 h-4"/> Revenue</p>
                    <h3 className="text-4xl font-black text-gray-800 relative z-10 tracking-tight">₹{stats.revenue}</h3>
                </div>

                <div className="card border-none bg-gradient-to-br from-orange-50/80 to-white/50 relative overflow-hidden group shadow-md hover:shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-200/40 rounded-full blur-2xl group-hover:bg-orange-300/50 transition-colors"></div>
                    <p className="text-xs text-orange-700 mb-2 flex items-center gap-2 font-bold relative z-10 uppercase tracking-widest"><Clock className="w-4 h-4"/> Waiting</p>
                    <h3 className="text-4xl font-black text-gray-800 relative z-10 tracking-tight">{stats.waiting}</h3>
                </div>

                <div className="card border-none bg-gradient-to-br from-purple-50/80 to-white/50 relative overflow-hidden group shadow-md hover:shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-200/40 rounded-full blur-2xl group-hover:bg-purple-300/50 transition-colors"></div>
                    <p className="text-xs text-purple-700 mb-2 flex items-center gap-2 font-bold relative z-10 uppercase tracking-widest"><CheckCircle className="w-4 h-4"/> Completed</p>
                    <h3 className="text-4xl font-black text-gray-800 relative z-10 tracking-tight">{stats.completed}</h3>
                </div>
            </div>

            {/* Today's Registrations Table */}
            <div className="card border-none shadow-md overflow-hidden p-0 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="p-6 border-b border-gray-100 bg-white">
                    <h3 className="text-lg font-bold text-gray-800">Today's Registrations</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                            <tr>
                                <th className="px-6 py-4">Token</th>
                                <th className="px-6 py-4">Patient Name</th>
                                <th className="px-6 py-4">Patient ID</th>
                                <th className="px-6 py-4">Mobile</th>
                                <th className="px-6 py-4">Doctor</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-12 text-gray-500 animate-pulse">Loading registrations...</td></tr>
                            ) : visits.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-12 text-gray-500 font-medium">No registrations today.</td></tr>
                            ) : (
                                visits.map(visit => (
                                    <tr key={visit.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-black text-primary text-lg">{visit.op_token}</td>
                                        <td className="px-6 py-4 font-bold text-gray-800">{visit.patient_name}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500 font-semibold bg-gray-100/50 rounded p-1 inline-block mt-2">{visit.patient_code}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{visit.mobile_number}</td>
                                        <td className="px-6 py-4 text-gray-800 font-semibold">{visit.doctor_name} <span className="text-[10px] uppercase tracking-widest text-gray-400 block mt-0.5">{visit.department_name}</span></td>
                                        <td className="px-6 py-4 text-gray-500 text-xs font-semibold">{visit.visit_time}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                visit.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                                            }`}>
                                                {visit.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vitals Modal */}
            {selectedVisitForVitals && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                        <div className="bg-primary text-white p-6 flex justify-between items-center">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <HeartPulse className="w-6 h-6 text-red-200" />
                                Patient Vitals
                            </h3>
                            <button onClick={() => setSelectedVisitForVitals(null)} className="p-2 hover:bg-black/20 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-8">
                            <p className="text-gray-500 mb-6 font-medium">Recording vitals for <span className="font-bold text-gray-800">{selectedVisitForVitals.patient_name}</span></p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Blood Pressure</label>
                                    <input type="text" value={vitals.blood_pressure} onChange={e=>setVitals({...vitals, blood_pressure: e.target.value})} className="input-field bg-gray-50" placeholder="120/80" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Heart Rate (bpm)</label>
                                    <input type="number" value={vitals.heart_rate} onChange={e=>setVitals({...vitals, heart_rate: e.target.value})} className="input-field bg-gray-50" placeholder="72" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Temperature (°F)</label>
                                    <input type="text" value={vitals.temperature} onChange={e=>setVitals({...vitals, temperature: e.target.value})} className="input-field bg-gray-50" placeholder="98.6" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">SpO2 (%)</label>
                                    <input type="number" value={vitals.spo2} onChange={e=>setVitals({...vitals, spo2: e.target.value})} className="input-field bg-gray-50" placeholder="99" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Weight (kg)</label>
                                    <input type="number" value={vitals.weight} onChange={e=>setVitals({...vitals, weight: e.target.value})} className="input-field bg-gray-50" placeholder="65" />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button onClick={() => setSelectedVisitForVitals(null)} className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                                <button onClick={handleSaveVitals} className="btn-primary px-6 py-2.5 flex items-center gap-2 rounded-xl shadow-md"><Save className="w-5 h-5"/> Save Vitals</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ReceptionDashboard;
