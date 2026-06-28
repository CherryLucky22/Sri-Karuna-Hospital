import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Activity, Users, CheckCircle, FilePlus, HeartPulse, Save, X, Pill, UserPlus, FileText } from 'lucide-react';

const DoctorDashboard = () => {
    const { user } = useContext(AuthContext);
    const [dashboardData, setDashboardData] = useState({ todayTotal: 0, waiting: 0, completed: 0, patients: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('waiting');
    const [activeDashboardView, setActiveDashboardView] = useState('queue'); // 'queue', 'reception', 'laboratory', 'pharmacy'
    const [receptionFilter, setReceptionFilter] = useState('All'); // 'All', 'Cash', 'UPI'
    const [labFilter, setLabFilter] = useState('All');
    const [pharmacyFilter, setPharmacyFilter] = useState('All');
    
    // Consultation State
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [vitals, setVitals] = useState({});
    const [prescription, setPrescription] = useState({
        chief_complaint: '', history: '', clinical_findings: '', diagnosis: '', advice: '', follow_up_date: '', medicines: [], labTests: []
    });
    
    // Medicine form state
    const [currentMed, setCurrentMed] = useState({ name: '', duration: '', morning: false, afternoon: false, night: false, before_food: false, after_food: true });
    const [summaryModal, setSummaryModal] = useState({ open: false, data: null, loading: false });
    
    // Medicine Inventory for search
    const [inventory, setInventory] = useState([]);
    const [searchMed, setSearchMed] = useState('');
    const [filteredMeds, setFilteredMeds] = useState([]);

    // Lab tests state
    const [labCatalog, setLabCatalog] = useState([]);
    const [selectedLabTest, setSelectedLabTest] = useState('');
    const [labRemarks, setLabRemarks] = useState('');
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    useEffect(() => {
        fetchDashboard();
        fetchInventory();
        fetchLabCatalog();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/doctors/dashboard');
            setDashboardData(res.data);
        } catch (error) {
            console.error("Dashboard error", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await api.get('/pharmacy/inventory');
            setInventory(res.data);
        } catch (error) {}
    };

    const fetchLabCatalog = async () => {
        try {
            const res = await api.get('/lab/tests');
            setLabCatalog(res.data);
        } catch (error) {}
    };

    const handleSearchMed = (val) => {
        setSearchMed(val);
        if (val.length > 1) {
            const filtered = inventory.filter(m => m.name.toLowerCase().includes(val.toLowerCase()));
            setFilteredMeds(filtered.slice(0, 5));
        } else {
            setFilteredMeds([]);
        }
    };

    const selectMedicine = (med) => {
        setCurrentMed(prev => ({ ...prev, name: med.name, medicine_id: med.id }));
        setSearchMed(med.name);
        setFilteredMeds([]);
    };

    const addMedicine = () => {
        if (!currentMed.name) return;
        setPrescription(prev => ({
            ...prev,
            medicines: [...prev.medicines, { ...currentMed, medicine_name: currentMed.name }]
        }));
        setCurrentMed({ name: '', duration: '', morning: false, afternoon: false, night: false, before_food: false, after_food: true });
        setSearchMed('');
    };

    const removeMedicine = (index) => {
        setPrescription(prev => ({
            ...prev,
            medicines: prev.medicines.filter((_, i) => i !== index)
        }));
    };

    const addLabTest = () => {
        if (!selectedLabTest) return;
        const testObj = labCatalog.find(t => t.id.toString() === selectedLabTest);
        if (!testObj) return;
        setPrescription(prev => ({
            ...prev,
            labTests: [...prev.labTests, { testId: testObj.id, name: testObj.name, remarks: labRemarks }]
        }));
        setSelectedLabTest('');
        setLabRemarks('');
    };

    const removeLabTest = (index) => {
        setPrescription(prev => ({
            ...prev,
            labTests: prev.labTests.filter((_, i) => i !== index)
        }));
    };

    const handleSavePrescription = async () => {
        try {
            const res = await api.post('/doctors/prescribe', {
                visit_id: selectedPatient.id,
                ...prescription
            });
            
            // Save lab tests
            if (prescription.labTests && prescription.labTests.length > 0) {
                for (let t of prescription.labTests) {
                    await api.post('/lab/prescribe', { visitId: selectedPatient.id, testId: t.testId, remarks: t.remarks });
                }
            }
            alert("Prescription saved & sent to Pharmacy successfully!");
            setSelectedPatient(null);
            fetchDashboard();
        } catch (error) {
            console.error(error);
            alert("Failed to save prescription");
        }
    };

    const fetchSummary = async (visitId) => {
        setSummaryModal({ open: true, data: null, loading: true });
        try {
            const res = await api.get(`/doctors/prescription-summary/${visitId}`);
            setSummaryModal({ open: true, data: res.data, loading: false });
        } catch (error) {
            console.error(error);
            alert("Failed to load summary or no prescription found");
            setSummaryModal({ open: false, data: null, loading: false });
        }
    };





    const renderConsultation = () => (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="bg-primary text-white p-4 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="w-6 h-6" />
                        Consultation: {selectedPatient.patient_name}
                    </h3>
                    <p className="text-sm text-red-100 font-mono">Token: {selectedPatient.op_token} | ID: {selectedPatient.patient_code}</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-2 bg-red-800 rounded hover:bg-red-900"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {/* Vitals Section */}
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2"><HeartPulse className="w-5 h-5 text-red-500"/> Vitals & Triage</h4>
                        {/* Save Vitals button removed, vitals are now entered at reception */}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Blood Pressure</label>
                            <input type="text" value={vitals.blood_pressure || ''} readOnly className="input-field py-1 bg-gray-100" placeholder="120/80" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Heart Rate (bpm)</label>
                            <input type="number" value={vitals.heart_rate || ''} readOnly className="input-field py-1 bg-gray-100" placeholder="72" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Temperature (°F)</label>
                            <input type="text" value={vitals.temperature || ''} readOnly className="input-field py-1 bg-gray-100" placeholder="98.6" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">SpO2 (%)</label>
                            <input type="number" value={vitals.spo2 || ''} readOnly className="input-field py-1 bg-gray-100" placeholder="99" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
                            <input type="number" value={vitals.weight || ''} readOnly className="input-field py-1 bg-gray-100" placeholder="65" />
                        </div>
                    </div>
                </div>



                {/* Prescription */}
                <div className="card">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl font-serif italic pr-2">Rx</span> Prescription
                    </h4>
                    
                    {/* Add Medicine Form */}
                    <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="col-span-4 relative">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Medicine Name</label>
                                <input type="text" value={searchMed} onChange={(e) => handleSearchMed(e.target.value)} className="input-field" placeholder="Search medicine..." />
                                {filteredMeds.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white border shadow-lg max-h-40 overflow-y-auto rounded mt-1">
                                        {filteredMeds.map(m => (
                                            <div key={m.id} onClick={() => selectMedicine(m)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                                                {m.name} <span className="text-xs text-gray-400">({m.current_stock} in stock)</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="col-span-3">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Schedule</label>
                                <div className="flex gap-2">
                                    <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={currentMed.morning} onChange={e=>setCurrentMed({...currentMed, morning: e.target.checked})} /> M</label>
                                    <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={currentMed.afternoon} onChange={e=>setCurrentMed({...currentMed, afternoon: e.target.checked})} /> A</label>
                                    <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={currentMed.night} onChange={e=>setCurrentMed({...currentMed, night: e.target.checked})} /> N</label>
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Days</label>
                                <input type="number" value={currentMed.duration} onChange={e=>setCurrentMed({...currentMed, duration: e.target.value})} className="input-field px-1 text-center" />
                            </div>
                            <div className="col-span-2">
                                <button onClick={addMedicine} className="btn-primary w-full bg-blue-600 hover:bg-blue-700 border-none">Add</button>
                            </div>
                        </div>
                        <div className="mt-2 flex gap-4 text-sm">
                            <label className="flex items-center gap-1"><input type="radio" name="food" checked={currentMed.before_food} onChange={()=>setCurrentMed({...currentMed, before_food: true, after_food: false})} /> Before Food</label>
                            <label className="flex items-center gap-1"><input type="radio" name="food" checked={currentMed.after_food} onChange={()=>setCurrentMed({...currentMed, after_food: true, before_food: false})} /> After Food</label>
                        </div>
                    </div>

                    {/* Medicines List */}
                    {prescription.medicines.length > 0 && (
                        <div className="overflow-x-auto">
                        <table className="w-full text-sm border">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left">Medicine</th>
                                    <th className="p-2 text-left">Schedule</th>
                                    <th className="p-2 text-left">Days</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {prescription.medicines.map((med, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="p-2 font-medium">{med.medicine_name}</td>
                                        <td className="p-2">
                                            {med.morning?'1':'0'}-{med.afternoon?'1':'0'}-{med.night?'1':'0'} 
                                            <span className="text-xs text-gray-500 ml-1">({med.before_food ? 'BF' : 'AF'})</span>
                                        </td>
                                        <td className="p-2">{med.duration}</td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => removeMedicine(idx)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>

                <div className="card">
                    <label className="block text-sm font-bold text-gray-700 mb-1">General Advice</label>
                    <textarea rows="2" value={prescription.advice} onChange={e=>setPrescription({...prescription, advice: e.target.value})} className="input-field"></textarea>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 mb-6">
                <div className="card border">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Prescribe Lab Tests</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {prescription.labTests.map((t, idx) => (
                            <div key={idx} className="bg-purple-50 border border-purple-200 text-purple-800 px-3 py-2 rounded-lg flex items-center gap-2">
                                <div>
                                    <span className="font-bold">{t.name}</span>
                                    {t.remarks && <p className="text-xs text-purple-600">{t.remarks}</p>}
                                </div>
                                <button onClick={() => removeLabTest(idx)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex gap-2">
                        <select value={selectedLabTest} onChange={e=>setSelectedLabTest(e.target.value)} className="input-field w-1/3">
                            <option value="">Select Lab Test...</option>
                            {labCatalog.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.category}) - ₹{t.price}</option>
                            ))}
                        </select>
                        <input type="text" placeholder="Remarks/Instructions" value={labRemarks} onChange={e=>setLabRemarks(e.target.value)} className="input-field w-1/3" />
                        <button onClick={addLabTest} className="btn-secondary w-1/3 flex justify-center items-center gap-2">
                            <FilePlus className="w-4 h-4"/> Add Test
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="p-4 bg-gray-100 border-t flex justify-end gap-4">
                <button onClick={() => setSelectedPatient(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleSavePrescription} className="btn-primary flex gap-2">
                    <Save className="w-5 h-5"/> Complete & Send to Pharmacy
                </button>
            </div>
        </div>
    );
    // Revenue Calculations
    const receptionData = dashboardData.hospitalStats?.reception?.data || [];
    const receptionRevenue = receptionData.reduce((acc, curr) => acc + (parseFloat(curr.consultation_fee) || 0), 0);
    
    const laboratoryData = dashboardData.hospitalStats?.laboratory?.data || [];
    const labRevenue = laboratoryData.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
    
    const pharmacyData = dashboardData.hospitalStats?.pharmacy?.data || [];
    const pharmacyRevenue = pharmacyData.reduce((acc, curr) => acc + (parseFloat(curr.net_amount) || parseFloat(curr.total_amount) || 0), 0);
    
    const totalRevenue = receptionRevenue + labRevenue + pharmacyRevenue;

    return (
        <div className="h-full">
            {selectedPatient ? (
                renderConsultation()
            ) : (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900">Doctor Dashboard</h2>
                        <p className="text-sm font-medium text-gray-600 mt-1">{getGreeting()}, {user?.name || 'Doctor'} 👋</p>
                    </div>
                    
                    {dashboardData.hospitalStats && (
                        <div className="mb-8">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Hospital Overview (Today)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {/* OP Registered */}
                                <div onClick={() => setActiveDashboardView('reception')} className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all relative overflow-hidden group">
                                    <div className="flex gap-4 w-full">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                            <UserPlus className="w-7 h-7"/>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-bold text-blue-800">OP Registered</p>
                                            <p className="text-3xl font-black text-gray-900 my-1">{dashboardData.hospitalStats.reception?.count || 0}</p>
                                            <div className="flex justify-between items-end w-full">
                                                <p className="text-[11px] text-gray-500 font-medium">Revenue: ₹{receptionRevenue.toFixed(2)}</p>
                                                {/* Mini Chart SVG */}
                                                <svg width="40" height="20" viewBox="0 0 40 20" className="opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <path d="M0 15 Q 10 10 20 18 T 40 5" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Lab Reports */}
                                <div onClick={() => setActiveDashboardView('laboratory')} className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all relative overflow-hidden group">
                                    <div className="flex gap-4 w-full">
                                        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                            <FileText className="w-7 h-7"/>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-bold text-purple-800">Lab Reports</p>
                                            <p className="text-3xl font-black text-gray-900 my-1">{dashboardData.hospitalStats.laboratory?.count || 0}</p>
                                            <div className="flex justify-between items-end w-full">
                                                <p className="text-[11px] text-gray-500 font-medium">Revenue: ₹{labRevenue.toFixed(2)}</p>
                                                <svg width="40" height="20" viewBox="0 0 40 20" className="opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <path d="M0 15 Q 10 20 20 10 T 40 5" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pharmacy Bills */}
                                <div onClick={() => setActiveDashboardView('pharmacy')} className="bg-white border border-gray-100 rounded-2xl flex items-center justify-between p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all relative overflow-hidden group">
                                    <div className="flex gap-4 w-full">
                                        <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center text-[#d81b60] shrink-0">
                                            <Pill className="w-7 h-7"/>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-bold text-[#d81b60]">Pharmacy Bills</p>
                                            <p className="text-3xl font-black text-gray-900 my-1">{dashboardData.hospitalStats.pharmacy?.count || 0}</p>
                                            <div className="flex justify-between items-end w-full">
                                                <p className="text-[11px] text-gray-500 font-medium">Revenue: ₹{pharmacyRevenue.toFixed(2)}</p>
                                                <svg width="40" height="20" viewBox="0 0 40 20" className="opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <path d="M0 18 Q 15 5 25 15 T 40 5" fill="none" stroke="#d81b60" strokeWidth="2" strokeLinecap="round"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Revenue */}
                                <div className="bg-gradient-to-br from-green-50/50 to-green-100/50 border border-green-100 rounded-2xl flex items-center justify-between p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                                    <div className="flex gap-4 w-full">
                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-green-600 shrink-0">
                                            <span className="font-bold text-2xl">₹</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-bold text-green-800">Total Revenue</p>
                                            <p className="text-2xl font-black text-green-700 my-1 tracking-tight">₹{totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                                            <div className="flex justify-between items-end w-full">
                                                <p className="text-[11px] text-green-700/70 font-bold">Today's Earnings</p>
                                                <svg width="40" height="20" viewBox="0 0 40 20">
                                                    <path d="M0 15 Q 10 20 20 12 T 40 5" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeDashboardView === 'queue' ? (
                        <>
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-4">Your Queue (Today)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                                {/* Today's Total */}
                                <div className="bg-gradient-to-r from-[#eef2fa] to-[#e0eaf5] border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
                                    <Users className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-200/50 transform -rotate-12 pointer-events-none" />
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-16 h-16 rounded-full bg-white/60 shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                                            <Users className="w-8 h-8"/>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-blue-800 mb-1">Today's Total</h3>
                                            <p className="text-4xl font-black text-blue-900 leading-none">{dashboardData.todayTotal}</p>
                                            <p className="text-[11px] font-medium text-blue-700/80 mt-1">Total Patients</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Waiting */}
                                <div className="bg-gradient-to-r from-[#fff3e0] to-[#ffe0b2] border border-orange-200/50 rounded-2xl p-6 relative overflow-hidden">
                                    <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-orange-200/50 transform -rotate-12 pointer-events-none" />
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-16 h-16 rounded-full bg-white/60 shadow-sm flex items-center justify-center text-[#e65100] shrink-0">
                                            <Activity className="w-8 h-8"/>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[#e65100] mb-1">Waiting</h3>
                                            <p className="text-4xl font-black text-[#e65100] leading-none">{dashboardData.waiting}</p>
                                            <p className="text-[11px] font-medium text-orange-800/80 mt-1">Patients</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Completed */}
                                <div className="bg-gradient-to-r from-[#e8f5e9] to-[#c8e6c9] border border-green-200/50 rounded-2xl p-6 relative overflow-hidden">
                                    <CheckCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-green-200/50 transform -rotate-12 pointer-events-none" />
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-16 h-16 rounded-full bg-white/60 shadow-sm flex items-center justify-center text-green-700 shrink-0">
                                            <CheckCircle className="w-8 h-8"/>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-green-800 mb-1">Completed</h3>
                                            <p className="text-4xl font-black text-green-900 leading-none">{dashboardData.completed}</p>
                                            <p className="text-[11px] font-medium text-green-800/80 mt-1">Patients</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                                <div className="flex border-b border-gray-100 px-6 pt-4">
                                    <button 
                                        className={`px-6 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'waiting' ? 'text-[#d32f2f] border-[#d32f2f]' : 'text-gray-500 border-transparent hover:text-gray-700'}`} 
                                        onClick={() => setActiveTab('waiting')}
                                    >
                                        <Activity className="w-4 h-4"/> Waiting Queue
                                    </button>
                                    <button 
                                        className={`px-6 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'completed' ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-700'}`} 
                                        onClick={() => setActiveTab('completed')}
                                    >
                                        <CheckCircle className="w-4 h-4"/> Completed
                                    </button>
                                </div>
                                
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-sm text-left min-w-[600px]">
                                        <thead className="bg-gray-50/50 text-gray-500 text-[10px] uppercase tracking-wider font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Token No.</th>
                                                <th className="px-6 py-4">Patient ID</th>
                                                <th className="px-6 py-4">Patient Name</th>
                                                <th className="px-6 py-4">Age / Gender</th>
                                                <th className="px-6 py-4">Time</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {dashboardData.patients.filter(p => p.status.toLowerCase() === activeTab).length === 0 ? (
                                                <tr>
                                                    <td colSpan="7">
                                                        <div className="flex flex-col items-center justify-center py-16">
                                                            <div className="relative mb-4">
                                                                <FileText className="w-16 h-16 text-red-200" />
                                                                <div className="absolute -top-2 -right-2 text-red-400 opacity-50">✨</div>
                                                                <div className="absolute -bottom-1 -left-2 text-red-400 opacity-50">✨</div>
                                                            </div>
                                                            <h3 className="text-gray-800 font-bold text-lg mb-1">No patients in the {activeTab} queue</h3>
                                                            <p className="text-gray-500 text-sm">All caught up! Great job.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                dashboardData.patients.filter(p => p.status.toLowerCase() === activeTab).map(patient => (
                                                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="font-bold text-gray-800 text-base">{patient.op_token}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-mono font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">{patient.patient_code}</span>
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-gray-900">{patient.patient_name}</td>
                                                        <td className="px-6 py-4 text-gray-600 text-xs font-medium">{patient.age} Yrs • {patient.gender}</td>
                                                        <td className="px-6 py-4 text-gray-500 text-xs font-semibold">{patient.visit_time}</td>
                                                        <td className="px-6 py-4">
                                                            {activeTab === 'waiting' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-[#e65100]">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#e65100]"></div>
                                                                    Waiting
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                                    Completed
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {activeTab === 'waiting' && (
                                                                <button 
                                                                    onClick={() => {
                                                                        setSelectedPatient(patient);
                                                                        setVitals(patient.vitals || {});
                                                                        setPrescription({ chief_complaint: '', history: '', clinical_findings: '', diagnosis: '', advice: '', follow_up_date: '', medicines: [], labTests: [] });
                                                                        setSearchMed('');
                                                                        setFilteredMeds([]);
                                                                    }} 
                                                                    className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                                                                >
                                                                    Consult
                                                                </button>
                                                            )}
                                                            {activeTab === 'completed' && (
                                                                <button onClick={() => fetchSummary(patient.id)} className="border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                                                                    View
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>

                    ) : (
                        <div className="card">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800 capitalize">{activeDashboardView} Data</h3>
                                <button onClick={() => setActiveDashboardView('queue')} className="btn-secondary text-sm">Back to Queue</button>
                            </div>
                            
                            {activeDashboardView === 'reception' && (() => {
                                const filteredData = dashboardData.hospitalStats.reception.data.filter(item => receptionFilter === 'All' || (item.payment_method || 'Cash') === receptionFilter);
                                const totalFee = filteredData.reduce((sum, item) => sum + parseFloat(item.consultation_fee || 0), 0);
                                return (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex gap-2">
                                                <button onClick={() => setReceptionFilter('All')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${receptionFilter === 'All' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>All</button>
                                                <button onClick={() => setReceptionFilter('Cash')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${receptionFilter === 'Cash' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>Cash</button>
                                                <button onClick={() => setReceptionFilter('UPI')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${receptionFilter === 'UPI' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>UPI</button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Collection</p>
                                                <p className="text-lg font-black text-indigo-700">₹{totalFee.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left border">
                                                <thead className="bg-indigo-50 text-indigo-900 border-b">
                                                    <tr>
                                                        <th className="p-3">Patient Name</th>
                                                        <th className="p-3">Patient ID</th>
                                                        <th className="p-3">Token</th>
                                                        <th className="p-3">Doctor Assigned</th>
                                                        <th className="p-3">Payment Mode</th>
                                                        <th className="p-3">Fee</th>
                                                        <th className="p-3">Time</th>
                                                        <th className="p-3">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredData.map(item => (
                                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                                            <td className="p-3 font-bold">{item.patient_name}</td>
                                                            <td className="p-3 font-mono">{item.patient_code}</td>
                                                            <td className="p-3">{item.op_token}</td>
                                                            <td className="p-3">{item.doctor_name}</td>
                                                            <td className="p-3 text-xs font-bold text-gray-600">{item.payment_method || 'Cash'}</td>
                                                            <td className="p-3 font-bold text-gray-800">₹{item.consultation_fee}</td>
                                                            <td className="p-3">{item.visit_time}</td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {filteredData.length === 0 && (
                                                        <tr><td colSpan="8" className="p-4 text-center text-gray-500">No OP Registrations found.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}

                            {activeDashboardView === 'laboratory' && (() => {
                                const filteredData = dashboardData.hospitalStats.laboratory.data.filter(item => labFilter === 'All' || (item.payment_method || 'Cash') === labFilter);
                                const totalFee = filteredData.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
                                return (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex gap-2">
                                                <button onClick={() => setLabFilter('All')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${labFilter === 'All' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>All</button>
                                                <button onClick={() => setLabFilter('Cash')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${labFilter === 'Cash' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>Cash</button>
                                                <button onClick={() => setLabFilter('UPI')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${labFilter === 'UPI' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>UPI</button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Collection</p>
                                                <p className="text-lg font-black text-purple-700">₹{totalFee.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left border">
                                                <thead className="bg-purple-50 text-purple-900 border-b">
                                                    <tr>
                                                        <th className="p-3">Patient Name</th>
                                                        <th className="p-3">Test Name</th>
                                                        <th className="p-3">Payment Mode</th>
                                                        <th className="p-3">Cost</th>
                                                        <th className="p-3">Time</th>
                                                        <th className="p-3">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredData.map(item => (
                                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                                            <td className="p-3 font-bold">{item.patient_name}</td>
                                                            <td className="p-3">{item.test_name}</td>
                                                            <td className="p-3 text-xs font-bold text-gray-600">{item.payment_method || 'Cash'}</td>
                                                            <td className="p-3 font-bold text-gray-800">₹{item.price}</td>
                                                            <td className="p-3">{new Date(item.created_at).toLocaleTimeString()}</td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {filteredData.length === 0 && (
                                                        <tr><td colSpan="6" className="p-4 text-center text-gray-500">No Lab Reports found.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}

                            {activeDashboardView === 'pharmacy' && (() => {
                                const filteredData = dashboardData.hospitalStats.pharmacy.data.filter(item => pharmacyFilter === 'All' || (item.payment_method || 'Cash') === pharmacyFilter);
                                const totalFee = filteredData.reduce((sum, item) => sum + parseFloat(item.net_amount || item.total_amount || 0), 0);
                                return (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex gap-2">
                                                <button onClick={() => setPharmacyFilter('All')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${pharmacyFilter === 'All' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>All</button>
                                                <button onClick={() => setPharmacyFilter('Cash')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${pharmacyFilter === 'Cash' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>Cash</button>
                                                <button onClick={() => setPharmacyFilter('UPI')} className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${pharmacyFilter === 'UPI' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>UPI</button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Collection</p>
                                                <p className="text-lg font-black text-pink-700">₹{totalFee.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left border">
                                                <thead className="bg-pink-50 text-pink-900 border-b">
                                                    <tr>
                                                        <th className="p-3">Bill Number</th>
                                                        <th className="p-3">Patient Name</th>
                                                        <th className="p-3">Payment Mode</th>
                                                        <th className="p-3">Discount</th>
                                                        <th className="p-3">GST</th>
                                                        <th className="p-3">Amount Paid</th>
                                                        <th className="p-3">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredData.map((item, idx) => (
                                                        <tr key={idx} className="border-b hover:bg-gray-50">
                                                            <td className="p-3 font-mono font-bold text-pink-600">{item.bill_number}</td>
                                                            <td className="p-3 font-bold">{item.patient_name || 'Walk-in Customer'}</td>
                                                            <td className="p-3 text-xs font-bold text-gray-600">{item.payment_method || 'Cash'}</td>
                                                            <td className="p-3 text-green-600">{item.discount > 0 ? `₹${item.discount}` : '-'}</td>
                                                            <td className="p-3 text-red-600">{item.gst > 0 ? `₹${item.gst}` : '-'}</td>
                                                            <td className="p-3 font-bold text-gray-800">₹{item.net_amount || item.total_amount}</td>
                                                            <td className="p-3">{new Date(item.created_at).toLocaleTimeString()}</td>
                                                        </tr>
                                                    ))}
                                                    {filteredData.length === 0 && (
                                                        <tr><td colSpan="7" className="p-4 text-center text-gray-500">No Pharmacy Bills found.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}
            
            {/* Summary Modal */}
            {summaryModal.open && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-primary text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5"/> Prescription Summary</h3>
                            <button onClick={() => setSummaryModal({ open: false, data: null, loading: false })} className="text-white hover:text-gray-200">
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {summaryModal.loading ? (
                                <div className="flex justify-center items-center py-12 text-gray-500">Loading details...</div>
                            ) : summaryModal.data ? (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-4 rounded border">
                                        <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider border-b pb-2 mb-3">Clinical Findings & Diagnosis</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Chief Complaint</p>
                                                <p className="font-medium text-sm">{summaryModal.data.chief_complaint || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Diagnosis</p>
                                                <p className="font-bold text-primary text-sm">{summaryModal.data.diagnosis || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Prescribed Medicines</h4>
                                        {summaryModal.data.medicines?.length > 0 ? (
                                            <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left border">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="p-2 border-b">Medicine</th>
                                                        <th className="p-2 border-b">Dosage / Schedule</th>
                                                        <th className="p-2 border-b">Duration</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {summaryModal.data.medicines.map((m, i) => (
                                                        <tr key={i} className="border-b">
                                                            <td className="p-2 font-bold">{m.medicine_name}</td>
                                                            <td className="p-2 text-gray-600">
                                                                <span className="font-mono bg-gray-100 px-1 rounded">{m.morning?'1':'0'}-{m.afternoon?'1':'0'}-{m.night?'1':'0'}</span>
                                                                <span className="ml-2 text-xs">({m.before_food ? 'Before Food' : 'After Food'})</span>
                                                            </td>
                                                            <td className="p-2">{m.duration} Days</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No medicines prescribed.</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Laboratory Reports</h4>
                                        {summaryModal.data.lab_reports?.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {summaryModal.data.lab_reports.map(report => (
                                                    <div key={report.id} className="border rounded p-3 bg-white shadow-sm">
                                                        <p className="font-bold text-primary mb-1">{report.test_name}</p>
                                                        {report.status === 'Completed' ? (
                                                            <div>
                                                                <p className="text-sm">Result: <span className="font-bold">{report.result_value}</span> {report.unit}</p>
                                                                <p className="text-xs text-gray-500">Normal Range: {report.normal_range}</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-orange-500 font-bold">Pending Lab Processing</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No lab tests prescribed.</p>
                                        )}
                                    </div>
                                    
                                    {summaryModal.data.advice && (
                                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-yellow-800">
                                            <strong>Advice: </strong> {summaryModal.data.advice}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-red-500 py-4">Failed to load prescription data.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;
