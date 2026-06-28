import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, CreditCard, Clock, CheckCircle, HeartPulse, X, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReceptionDashboard = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
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
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Reception Dashboard</h2>
                <Link to="/reception/register" className="btn-primary">New OP Registration</Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500 text-white rounded-lg"><Users className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-gray-600 font-semibold">Today's OP</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.totalOP}</h3>
                        </div>
                    </div>
                </div>
                
                <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500 text-white rounded-lg"><CreditCard className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-gray-600 font-semibold">Today's Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900">₹{stats.revenue}</h3>
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500 text-white rounded-lg"><Clock className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-gray-600 font-semibold">Waiting</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.waiting}</h3>
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500 text-white rounded-lg"><CheckCircle className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-gray-600 font-semibold">Completed</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.completed}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Registrations Table */}
            <div className="card">
                <h3 className="text-lg font-bold mb-4">Today's Registrations</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Token</th>
                                <th className="px-4 py-3">Patient Name</th>
                                <th className="px-4 py-3">Patient ID</th>
                                <th className="px-4 py-3">Mobile</th>
                                <th className="px-4 py-3">Doctor</th>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Loading...</td></tr>
                            ) : visits.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-8 text-gray-500">No registrations today.</td></tr>
                            ) : (
                                visits.map(visit => (
                                    <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-bold text-primary font-mono">{visit.op_token}</td>
                                        <td className="px-4 py-3 font-semibold">{visit.patient_name}</td>
                                        <td className="px-4 py-3 font-mono text-gray-500">{visit.patient_code}</td>
                                        <td className="px-4 py-3">{visit.mobile_number}</td>
                                        <td className="px-4 py-3">{visit.doctor_name} <span className="text-xs text-gray-400 block">{visit.department_name}</span></td>
                                        <td className="px-4 py-3">{visit.visit_time}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                visit.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {visit.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => setSelectedVisitForVitals(visit)}
                                                className="btn-secondary py-1 px-2 text-xs flex items-center gap-1 justify-end ml-auto"
                                            >
                                                <HeartPulse className="w-4 h-4 text-red-500" />
                                                Add Vitals
                                            </button>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
                        <div className="bg-primary text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <HeartPulse className="w-5 h-5 text-red-400" />
                                Patient Vitals: {selectedVisitForVitals.patient_name}
                            </h3>
                            <button onClick={() => setSelectedVisitForVitals(null)} className="p-1 hover:bg-primary-dark rounded"><X /></button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Blood Pressure</label>
                                    <input type="text" value={vitals.blood_pressure} onChange={e=>setVitals({...vitals, blood_pressure: e.target.value})} className="input-field" placeholder="120/80" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Heart Rate (bpm)</label>
                                    <input type="number" value={vitals.heart_rate} onChange={e=>setVitals({...vitals, heart_rate: e.target.value})} className="input-field" placeholder="72" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Temperature (°F)</label>
                                    <input type="text" value={vitals.temperature} onChange={e=>setVitals({...vitals, temperature: e.target.value})} className="input-field" placeholder="98.6" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">SpO2 (%)</label>
                                    <input type="number" value={vitals.spo2} onChange={e=>setVitals({...vitals, spo2: e.target.value})} className="input-field" placeholder="99" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Weight (kg)</label>
                                    <input type="number" value={vitals.weight} onChange={e=>setVitals({...vitals, weight: e.target.value})} className="input-field" placeholder="65" />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={() => setSelectedVisitForVitals(null)} className="btn-secondary">Cancel</button>
                                <button onClick={handleSaveVitals} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4"/> Save Vitals</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ReceptionDashboard;
