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
            alert("Prescription saved successfully!");
            alert("Prescription sent to Pharmacy successfully!");
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
    
    const pharmacyData = dashboardData.hospitalStats?.pharmacy?.data || [];
    const pharmacyRevenue = pharmacyData.reduce((acc, curr) => acc + (parseFloat(curr.net_amount) || parseFloat(curr.total_amount) || 0), 0);
    
    const totalRevenue = receptionRevenue + pharmacyRevenue;

    return (
        <div className="h-full">
            {selectedPatient ? (
                renderConsultation()
            ) : (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h2>
                    
                    {dashboardData.hospitalStats && (
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Hospital Overview (Today)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div onClick={() => setActiveDashboardView('reception')} className={`border rounded-xl flex items-center justify-between p-4 shadow-sm cursor-pointer transition ${activeDashboardView === 'reception' ? 'bg-indigo-100 border-indigo-300' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white bg-opacity-60 rounded-lg text-indigo-600"><UserPlus className="w-6 h-6"/></div>
                                        <div>
                                            <p className="text-sm font-bold text-indigo-900">OP Registered</p>
                                            <p className="text-2xl font-black text-indigo-900">{dashboardData.hospitalStats.reception?.count || 0}</p>
                                            <p className="text-xs text-indigo-700 font-medium">Rev: ₹{receptionRevenue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div onClick={() => setActiveDashboardView('laboratory')} className={`border rounded-xl flex items-center justify-between p-4 shadow-sm cursor-pointer transition ${activeDashboardView === 'laboratory' ? 'bg-purple-100 border-purple-300' : 'bg-purple-50 border-purple-100 hover:bg-purple-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white bg-opacity-60 rounded-lg text-purple-600"><FileText className="w-6 h-6"/></div>
                                        <div>
                                            <p className="text-sm font-bold text-purple-900">Lab Reports</p>
                                            <p className="text-2xl font-black text-purple-900">{dashboardData.hospitalStats.laboratory?.count || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div onClick={() => setActiveDashboardView('pharmacy')} className={`border rounded-xl flex items-center justify-between p-4 shadow-sm cursor-pointer transition ${activeDashboardView === 'pharmacy' ? 'bg-pink-100 border-pink-300' : 'bg-pink-50 border-pink-100 hover:bg-pink-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white bg-opacity-60 rounded-lg text-pink-600"><Pill className="w-6 h-6"/></div>
                                        <div>
                                            <p className="text-sm font-bold text-pink-900">Pharmacy Bills</p>
                                            <p className="text-2xl font-black text-pink-900">{dashboardData.hospitalStats.pharmacy?.count || 0}</p>
                                            <p className="text-xs text-pink-700 font-medium">Rev: ₹{pharmacyRevenue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border rounded-xl flex items-center justify-between p-4 shadow-sm bg-green-50 border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white bg-opacity-60 rounded-lg text-green-600">
                                            <span className="font-bold text-xl">₹</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-green-900">Total Revenue</p>
                                            <p className="text-2xl font-black text-green-900">₹{totalRevenue.toFixed(2)}</p>
                                            <p className="text-xs text-green-700 font-medium">Today's Earnings</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeDashboardView === 'queue' ? (
                        <>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Your Queue (Today)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="card bg-blue-50 border-blue-200">
                                    <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2"><Users /> Today's Total</h3>
                                    <p className="text-4xl font-black text-blue-900 mt-2">{dashboardData.todayTotal}</p>
                                </div>
                                <div className="card bg-orange-50 border-orange-200 cursor-pointer" onClick={() => setActiveTab('waiting')}>
                                    <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2"><Activity /> Waiting</h3>
                                    <p className="text-4xl font-black text-orange-900 mt-2">{dashboardData.waiting}</p>
                                </div>
                                <div className="card bg-green-50 border-green-200 cursor-pointer" onClick={() => setActiveTab('completed')}>
                                    <h3 className="text-lg font-bold text-green-800 flex items-center gap-2"><CheckCircle /> Completed</h3>
                                    <p className="text-4xl font-black text-green-900 mt-2">{dashboardData.completed}</p>
                                </div>
                            </div>

                            <div className="card">
                                <div className="flex border-b mb-4">
                                    <button className={`px-4 py-2 font-bold ${activeTab === 'waiting' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`} onClick={() => setActiveTab('waiting')}>Waiting Queue</button>
                                    <button className={`px-4 py-2 font-bold ${activeTab === 'completed' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`} onClick={() => setActiveTab('completed')}>Completed</button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {dashboardData.patients.filter(p => p.status.toLowerCase() === activeTab).length === 0 ? (
                                        <p className="text-gray-500 p-4">No patients in this list.</p>
                                    ) : (
                                        dashboardData.patients.filter(p => p.status.toLowerCase() === activeTab).map(patient => (
                                            <div key={patient.id} className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white relative">
                                                <div className="absolute top-0 right-0 bg-gray-100 text-xs font-mono px-2 py-1 rounded-bl-lg rounded-tr-lg border-b border-l text-gray-600">
                                                    {patient.visit_time}
                                                </div>
                                                <h3 className="font-bold text-lg text-primary">{patient.patient_name}</h3>
                                                <p className="text-sm font-mono text-gray-500 mb-2">{patient.patient_code} | Token: {patient.op_token}</p>
                                                <p className="text-xs text-gray-600 mb-4">{patient.age} Yrs • {patient.gender}</p>
                                                
                                                {activeTab === 'waiting' && (
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedPatient(patient);
                                                            setVitals(patient.vitals || {});
                                                        }} 
                                                        className="w-full btn-primary py-2 flex justify-center gap-2 text-sm"
                                                    >
                                                        <FilePlus className="w-4 h-4"/> Start Consultation
                                                    </button>
                                                )}
                                                {activeTab === 'completed' && (
                                                    <button onClick={() => fetchSummary(patient.id)} className="w-full btn-secondary py-2 text-sm text-green-700 border-green-600">
                                                        View Summary
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="card">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800 capitalize">{activeDashboardView} Data</h3>
                                <button onClick={() => setActiveDashboardView('queue')} className="btn-secondary text-sm">Back to Queue</button>
                            </div>
                            
                            {activeDashboardView === 'reception' && (
                                <table className="w-full text-sm text-left border">
                                    <thead className="bg-indigo-50 text-indigo-900 border-b">
                                        <tr>
                                            <th className="p-3">Patient Name</th>
                                            <th className="p-3">Patient ID</th>
                                            <th className="p-3">Token</th>
                                            <th className="p-3">Doctor Assigned</th>
                                            <th className="p-3">Time</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.hospitalStats.reception.data.map(item => (
                                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-bold">{item.patient_name}</td>
                                                <td className="p-3 font-mono">{item.patient_code}</td>
                                                <td className="p-3">{item.op_token}</td>
                                                <td className="p-3">{item.doctor_name}</td>
                                                <td className="p-3">{item.visit_time}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {dashboardData.hospitalStats.reception.data.length === 0 && (
                                            <tr><td colSpan="6" className="p-4 text-center text-gray-500">No OP Registrations today.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {activeDashboardView === 'laboratory' && (
                                <table className="w-full text-sm text-left border">
                                    <thead className="bg-purple-50 text-purple-900 border-b">
                                        <tr>
                                            <th className="p-3">Patient Name</th>
                                            <th className="p-3">Test Name</th>
                                            <th className="p-3">Time</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.hospitalStats.laboratory.data.map(item => (
                                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-bold">{item.patient_name}</td>
                                                <td className="p-3">{item.test_name}</td>
                                                <td className="p-3">{new Date(item.created_at).toLocaleTimeString()}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {dashboardData.hospitalStats.laboratory.data.length === 0 && (
                                            <tr><td colSpan="4" className="p-4 text-center text-gray-500">No Lab Reports generated today.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {activeDashboardView === 'pharmacy' && (
                                <table className="w-full text-sm text-left border">
                                    <thead className="bg-pink-50 text-pink-900 border-b">
                                        <tr>
                                            <th className="p-3">Bill Number</th>
                                            <th className="p-3">Patient Name</th>
                                            <th className="p-3">Discount</th>
                                            <th className="p-3">GST</th>
                                            <th className="p-3">Amount Paid</th>
                                            <th className="p-3">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.hospitalStats.pharmacy.data.map((item, idx) => (
                                            <tr key={idx} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-mono font-bold text-pink-600">{item.bill_number}</td>
                                                <td className="p-3 font-bold">{item.patient_name || 'Walk-in Customer'}</td>
                                                <td className="p-3 text-green-600">{item.discount > 0 ? `₹${item.discount}` : '-'}</td>
                                                <td className="p-3 text-red-600">{item.gst > 0 ? `₹${item.gst}` : '-'}</td>
                                                <td className="p-3 font-bold text-gray-800">₹{item.net_amount || item.total_amount}</td>
                                                <td className="p-3">{new Date(item.created_at).toLocaleTimeString()}</td>
                                            </tr>
                                        ))}
                                        {dashboardData.hospitalStats.pharmacy.data.length === 0 && (
                                            <tr><td colSpan="6" className="p-4 text-center text-gray-500">No Pharmacy Bills generated today.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
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
                                                                <p className="text-sm">Result: <span className="font-bold">{report.observed_value}</span> {report.unit}</p>
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
