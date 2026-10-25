import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Activity, Search, Save, CheckCircle, FileText, HeartPulse, Printer, Plus, X, Calendar, Clock, Sparkles } from 'lucide-react';

const LabDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [resultValue, setResultValue] = useState('');
    const [labRemarks, setLabRemarks] = useState('');
    const [saving, setSaving] = useState(false);
    const [printData, setPrintData] = useState(null);
    const [testsCatalog, setTestsCatalog] = useState([]);
    const [showWalkInModal, setShowWalkInModal] = useState(false);
    const [walkInSaving, setWalkInSaving] = useState(false);
    const [showAllPendingModal, setShowAllPendingModal] = useState(false);
    const [showAllCompletedModal, setShowAllCompletedModal] = useState(false);
    const [walkInForm, setWalkInForm] = useState({
        name: '',
        mobile_number: '',
        age: '',
        gender: 'Male',
        payment_method: 'Cash',
        tests: []
    });

    const fetchReports = async () => {
        try {
            const res = await api.get('/lab/reports');
            setReports(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch lab reports', error);
            setLoading(false);
        }
    };

    const fetchTests = async () => {
        try {
            const res = await api.get('/lab/tests');
            setTestsCatalog(res.data);
        } catch (error) {
            console.error('Failed to fetch lab tests catalog', error);
        }
    };

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchReports();
        fetchTests();
        
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSelectReport = (report) => {
        setSelectedReport(report);
        setResultValue(report.result_value || '');
        setLabRemarks(report.lab_remarks || '');
        setShowAllPendingModal(false);
    };

    const handleSaveResult = async () => {
        if (!selectedReport) return;
        setSaving(true);
        try {
            await api.put(`/lab/report/${selectedReport.id}`, {
                result_value: resultValue,
                labRemarks: labRemarks,
                status: 'Completed'
            });
            await fetchReports();
            setSelectedReport(null);
        } catch (error) {
            console.error('Failed to save result', error);
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = (report) => {
        setPrintData(report);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleWalkInSubmit = async (e) => {
        e.preventDefault();
        if (walkInForm.tests.length === 0) return alert('Please select at least one test.');
        if (!walkInForm.mobile_number || !walkInForm.name) return alert('Name and Mobile Number are required.');
        
        setWalkInSaving(true);
        try {
            await api.post('/lab/walkin', walkInForm);
            await fetchReports();
            setShowWalkInModal(false);
            setWalkInForm({ name: '', mobile_number: '', age: '', gender: 'Male', payment_method: 'Cash', tests: [] });
        } catch (error) {
            console.error('Failed to create walk-in test', error);
            alert('Failed to create walk-in test.');
        } finally {
            setWalkInSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading lab reports...</div>;

    const pendingReports = reports.filter(r => r.status === 'Pending');
    const completedReports = reports.filter(r => r.status === 'Completed');
    const todayStr = new Date().toDateString();
    const completedToday = completedReports.filter(r => new Date(r.updated_at).toDateString() === todayStr);

    return (
        <div className="p-8 space-y-6 bg-gray-50/30 min-h-screen">
            {/* Command Center Header */}
            <div className="card border-none bg-gradient-to-r from-red-900 to-[#0a192f] text-white p-8 flex flex-col md:flex-row justify-between items-center animate-fade-in-up print:hidden" style={{ animationDelay: '0ms' }}>
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-2">
                        Laboratory Command Center <Sparkles className="w-5 h-5 text-red-400" />
                    </h2>
                    <p className="text-red-100 font-medium tracking-wide">Manage pending tests and print reports efficiently.</p>
                </div>
                <div className="flex flex-wrap gap-4 mt-6 md:mt-0 items-center">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                            <Calendar className="w-5 h-5 text-red-200" />
                            <span className="font-semibold">{currentTime.toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                            <Clock className="w-5 h-5 text-red-200" />
                            <span className="font-mono font-bold text-lg">{currentTime.toLocaleTimeString('en-IN', { timeStyle: 'short' })}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowWalkInModal(true)} 
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2 border-none"
                    >
                        <Plus className="w-5 h-5" /> New Walk-in Test
                    </button>
                </div>
            </div>

            {/* Print View */}
            {printData && (
                <div className="card bg-white border-0 p-8 relative hidden print:block" id="print-section">
                    <div className="flex flex-col border-b-2 border-primary pb-4 mb-4 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="w-1/4">
                                <div className="w-20 h-20 rounded-full border-2 border-highlight flex items-center justify-center text-highlight">
                                    <HeartPulse className="w-10 h-10" />
                                </div>
                            </div>
                            <div className="w-3/4 text-right">
                                <h1 className="text-4xl font-extrabold text-primary mb-2" style={{fontFamily: 'sans-serif'}}>శ్రీ కరుణ హాస్పిటల్</h1>
                                <p className="text-sm font-bold text-highlight">ఇందిరా సెంటర్, M.R.O. ఆఫీస్ రోడ్, మహబూబాబాద్.</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="w-1/2">
                                <h2 className="text-xl font-bold text-primary mb-1">డా|| ఎన్. నవీన్ కుమార్</h2>
                                <p className="text-sm font-bold text-highlight mb-0">MBBS, (DNB, General Medicine)</p>
                                <p className="text-sm font-bold text-highlight mb-0">బి.పి., షుగర్ మరియు ఎమర్జెన్సీ స్పెషలిస్ట్</p>
                                <p className="text-sm font-bold text-highlight mb-0">రి.నెం. 12855</p>
                            </div>
                            <div className="w-1/2 flex justify-center">
                                <div className="text-highlight font-black italic text-2xl border-4 border-highlight rounded-full w-24 h-24 flex flex-col items-center justify-center text-center">
                                    <span>24/7</span>
                                    <span className="text-[10px] leading-none mt-1 uppercase">Emergency<br/>Services</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                            <div className="w-2/3">
                                <h2 className="text-xl font-bold text-primary mb-1">{printData.doctor_name || 'Dr. N. Naveen Kumar'}</h2>
                                <p className="text-xs font-bold text-gray-700">Reg. No.: 12855</p>
                            </div>
                            <div className="w-1/3 flex justify-end">
                                <div className="text-highlight">
                                    <Activity className="w-16 h-16" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-6 text-highlight font-bold pb-2 border-b border-dashed border-gray-300">
                        <div><span className="text-primary mr-1">Pt. Name:</span> <span className="border-b border-dotted border-gray-400 pb-1 px-2">{printData.patient_name} ({printData.patient_code})</span></div>
                        <div><span className="text-primary mr-1">Age:</span> <span className="border-b border-dotted border-gray-400 pb-1 px-2">{printData.age} Yrs</span></div>
                        <div><span className="text-primary mr-1">Sex:</span> <span className="border-b border-dotted border-gray-400 pb-1 px-2">{printData.gender?.charAt(0) || '-'}</span></div>
                        <div className="w-full mt-2"><span className="text-primary mr-1">Report Date:</span> {new Date(printData.updated_at).toLocaleString()}</div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold bg-gray-100 py-2 rounded uppercase tracking-widest border border-gray-300">Laboratory Report</h2>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8">
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Test Name</p>
                            <p className="text-2xl font-black text-primary">{printData.test_name}</p>
                            <p className="text-sm text-gray-600 font-bold">{printData.category}</p>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-blue-200 pt-4 mt-4">
                            <div className="w-1/2 border-r border-blue-200 pr-4">
                                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Observed Result</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {printData.result_value} <span className="text-lg text-gray-500">{printData.unit !== '-' ? printData.unit : ''}</span>
                                </p>
                            </div>
                            <div className="w-1/2 pl-4">
                                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Normal Range</p>
                                <p className="text-lg font-bold text-gray-600">{printData.normal_range} {printData.unit !== '-' ? printData.unit : ''}</p>
                            </div>
                        </div>
                    </div>

                    {printData.remarks && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Doctor's Remarks</p>
                            <p className="text-gray-800 font-medium">{printData.remarks}</p>
                        </div>
                    )}

                    {printData.lab_remarks && (
                        <div className="mb-8">
                            <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Lab Remarks</p>
                            <p className="text-gray-800 font-medium">{printData.lab_remarks}</p>
                        </div>
                    )}

                    <div className="border-t border-gray-400 pt-6 mt-6 flex justify-between items-end text-xs text-gray-500">
                        <div>
                            <p>This is a computer generated report.</p>
                            <p>Please consult your doctor for clinical correlation.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-32 h-10 border-b border-gray-800 mb-2"></div>
                            <p>Lab Technician Sign</p>
                        </div>
                    </div>
                    
                    <style>
                        {`
                        @media print {
                            body * { visibility: hidden; }
                            #print-section, #print-section * { visibility: visible; }
                            #print-section { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
                            .print-hidden-print { display: none !important; }
                            .print-block-print { display: block !important; }
                            .text-primary { color: #E32636 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .text-highlight { color: #007FFF !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .bg-blue-50 { background-color: #eff6ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                        `}
                    </style>
                </div>
            )}

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:hidden">
                <div className="card border-none bg-gradient-to-br from-red-50/80 to-white/50 relative overflow-hidden group shadow-md hover:shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-red-200/40 rounded-full blur-2xl group-hover:bg-red-300/50 transition-colors"></div>
                    <p className="text-xs text-red-700 mb-2 flex items-center gap-2 font-bold relative z-10 uppercase tracking-widest"><Activity className="w-4 h-4"/> Pending</p>
                    <h3 className="text-4xl font-black text-gray-800 relative z-10 tracking-tight">{pendingReports.length}</h3>
                </div>
                
                <div className="card border-none bg-gradient-to-br from-blue-50/80 to-white/50 relative overflow-hidden group shadow-md hover:shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-200/40 rounded-full blur-2xl group-hover:bg-blue-300/50 transition-colors"></div>
                    <p className="text-xs text-blue-700 mb-2 flex items-center gap-2 font-bold relative z-10 uppercase tracking-widest"><CheckCircle className="w-4 h-4"/> Completed Today</p>
                    <h3 className="text-4xl font-black text-gray-800 relative z-10 tracking-tight">{completedToday.length}</h3>
                </div>

                <div className="card border-none bg-gradient-to-br from-green-50/80 to-white/50 relative overflow-hidden group shadow-md hover:shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-200/40 rounded-full blur-2xl group-hover:bg-green-300/50 transition-colors"></div>
                    <p className="text-xs text-green-700 mb-2 flex items-center gap-2 font-bold relative z-10 uppercase tracking-widest"><FileText className="w-4 h-4"/> Total Tests</p>
                    <h3 className="text-4xl font-black text-gray-800 relative z-10 tracking-tight">{reports.length}</h3>
                </div>

                <div className="card border-none bg-gradient-to-br from-purple-50/80 to-white/50 relative overflow-hidden group shadow-md hover:shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-200/40 rounded-full blur-2xl group-hover:bg-purple-300/50 transition-colors"></div>
                    <p className="text-xs text-purple-700 mb-2 flex items-center gap-2 font-bold relative z-10 uppercase tracking-widest"><Printer className="w-4 h-4"/> Printed</p>
                    <h3 className="text-4xl font-black text-gray-800 relative z-10 tracking-tight">{completedReports.length}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-extrabold text-[#0a192f] flex items-center gap-2">
                                <Activity className="w-5 h-5 text-yellow-500"/> Pending Tests ({pendingReports.length})
                            </h2>
                            <button onClick={() => setShowAllPendingModal(true)} className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                View All
                            </button>
                        </div>
                        {pendingReports.length === 0 ? (
                            <div className="bg-[#fffdf7] border border-yellow-100 rounded-2xl p-8 flex items-center gap-6 relative overflow-hidden shadow-sm">
                                <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500 border border-yellow-200 shrink-0">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-gray-800 font-bold text-lg mb-1">No pending lab tests.</h3>
                                    <p className="text-gray-500 text-sm">All caught up! Great job.</p>
                                </div>
                                <Activity className="absolute right-4 top-4 w-32 h-32 text-yellow-500 opacity-5 transform rotate-12 pointer-events-none" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingReports.slice(0, 5).map(report => (
                                    <div key={report.id} onClick={() => handleSelectReport(report)} className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedReport?.id === report.id ? 'border-yellow-400 ring-2 ring-yellow-400 ring-opacity-20 bg-[#fffdf7]' : 'border-gray-200 hover:border-gray-300 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)]'}`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center text-yellow-600">
                                                    <Activity className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-gray-900">{report.test_name}</h3>
                                                    <p className="text-xs text-gray-500 mt-1">{report.patient_name} • PID: {report.patient_code}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">Pending</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-extrabold text-[#0a192f] flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500"/> Recently Completed
                            </h2>
                            <button onClick={() => setShowAllCompletedModal(true)} className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg transition-colors">
                                View All
                            </button>
                        </div>
                        {completedReports.length === 0 ? (
                            <p className="text-gray-500 p-8 text-center bg-white border border-gray-100 rounded-2xl shadow-sm">No completed tests yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {completedReports.slice(0, 5).map(report => (
                                    <div key={report.id} className="p-4 rounded-2xl border border-gray-100 bg-white flex justify-between items-center shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:border-gray-200 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                                                <div className="w-4 h-4 bg-green-500 rounded-full opacity-60"></div>
                                                <div className="w-2 h-2 bg-green-600 rounded-full absolute"></div>
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-gray-900">{report.test_name}</h3>
                                                <p className="text-xs text-gray-500 mt-1">{report.patient_name} • PID: {report.patient_code}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <p className="text-xs text-gray-400 font-medium">{new Date(report.updated_at).toLocaleString()}</p>
                                            <button onClick={() => handlePrint(report)} className="bg-white border border-red-200 text-[#d32f2f] hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors">
                                                <Printer className="w-3.5 h-3.5"/> Print Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {completedReports.length > 0 && (
                                    <div className="pt-4 pb-2 text-center">
                                        <button onClick={() => setShowAllCompletedModal(true)} className="text-green-600 font-bold text-sm hover:text-green-700 transition-colors flex items-center gap-1 mx-auto">
                                            View All Completed Tests <span className="text-lg">→</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    {selectedReport ? (
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 sticky top-8">
                            <h2 className="text-xl font-extrabold text-[#0a192f] mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <FileText className="w-5 h-5 text-blue-500"/> Enter Lab Results
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Test Name</p>
                                    <p className="font-black text-xl text-primary">{selectedReport.test_name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Normal Range</p>
                                        <p className="font-bold text-gray-800 text-lg">{selectedReport.normal_range || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Unit</p>
                                        <p className="font-bold text-gray-800 text-lg">{selectedReport.unit !== '-' ? selectedReport.unit : '-'}</p>
                                    </div>
                                </div>

                                {selectedReport.remarks && (
                                    <div className="bg-[#fffdf7] p-4 rounded-xl border border-yellow-100">
                                        <p className="text-xs text-yellow-600 font-bold uppercase tracking-wider mb-1">Doctor's Remarks</p>
                                        <p className="text-sm text-yellow-900 font-medium">{selectedReport.remarks}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Observed Result Value *</label>
                                    <input 
                                        type="text" 
                                        value={resultValue} 
                                        onChange={e => setResultValue(e.target.value)} 
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                        placeholder="Enter result..."
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lab Remarks / Notes (Optional)</label>
                                    <textarea 
                                        value={labRemarks} 
                                        onChange={e => setLabRemarks(e.target.value)} 
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                                        rows="3"
                                        placeholder="Any additional observations..."
                                    ></textarea>
                                </div>

                                <button 
                                    onClick={handleSaveResult} 
                                    disabled={saving || !resultValue.trim()} 
                                    className="w-full bg-[#15803d] hover:bg-[#166534] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 mt-4"
                                >
                                    {saving ? 'Saving...' : <><CheckCircle className="w-5 h-5"/> Complete Test & Save Result</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center py-20 px-8 sticky top-8">
                            <div className="relative mb-6 inline-block">
                                <div className="absolute inset-0 bg-blue-50 rounded-full scale-150 opacity-50 blur-xl"></div>
                                <FileText className="w-20 h-20 mx-auto text-gray-200 relative z-10" />
                                <div className="absolute top-0 right-0 w-6 h-6 bg-red-400 rounded-full border-4 border-white animate-pulse"></div>
                            </div>
                            <h3 className="text-xl font-extrabold text-[#0a192f] mb-3">No Test Selected</h3>
                            <p className="text-gray-500 font-medium text-sm">Select a pending test from the list<br/>to enter its results.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Walk-in Test Modal */}
            {showWalkInModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Plus className="w-6 h-6 text-primary" /> New Walk-in Lab Test
                            </h2>
                            <button onClick={() => setShowWalkInModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleWalkInSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        maxLength="10"
                                        className="input-field" 
                                        value={walkInForm.mobile_number}
                                        onChange={e => setWalkInForm({...walkInForm, mobile_number: e.target.value})}
                                        placeholder="10-digit mobile"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Patient Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="input-field" 
                                        value={walkInForm.name}
                                        onChange={e => setWalkInForm({...walkInForm, name: e.target.value})}
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
                                    <input 
                                        type="number" 
                                        className="input-field" 
                                        value={walkInForm.age}
                                        onChange={e => setWalkInForm({...walkInForm, age: e.target.value})}
                                        placeholder="Years"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
                                    <select 
                                        className="input-field"
                                        value={walkInForm.gender}
                                        onChange={e => setWalkInForm({...walkInForm, gender: e.target.value})}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Payment Mode</label>
                                    <select 
                                        className="input-field"
                                        value={walkInForm.payment_method}
                                        onChange={e => setWalkInForm({...walkInForm, payment_method: e.target.value})}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Card">Card</option>
                                    </select>
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Select Lab Tests</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
                                {testsCatalog.map(test => (
                                    <label key={test.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                                            checked={walkInForm.tests.includes(test.id)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setWalkInForm(prev => ({
                                                    ...prev,
                                                    tests: checked 
                                                        ? [...prev.tests, test.id]
                                                        : prev.tests.filter(id => id !== test.id)
                                                }));
                                            }}
                                        />
                                        <div>
                                            <span className="font-bold text-gray-700">{test.name}</span>
                                            <span className="block text-xs text-gray-500">₹{test.price}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowWalkInModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={walkInSaving} className="btn-primary px-8">
                                    {walkInSaving ? 'Creating...' : 'Create Walk-in Test'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View All Pending Modal */}
            {showAllPendingModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h2 className="text-2xl font-bold text-[#0a192f] flex items-center gap-2">
                                <Activity className="w-6 h-6 text-yellow-500" /> All Pending Tests
                            </h2>
                            <button onClick={() => setShowAllPendingModal(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                            {pendingReports.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 font-medium">No pending tests available.</div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingReports.map(report => (
                                        <div key={report.id} onClick={() => handleSelectReport(report)} className={`p-5 rounded-2xl border transition-all cursor-pointer border-gray-200 hover:border-yellow-400 bg-white shadow-sm hover:shadow-md`}>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center text-yellow-600">
                                                        <Activity className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-extrabold text-gray-900 text-lg">{report.test_name}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">{report.patient_name} • PID: {report.patient_code}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100 block mb-2">Pending</span>
                                                    <p className="text-xs text-gray-400 font-medium">{new Date(report.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View All Completed Modal */}
            {showAllCompletedModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h2 className="text-2xl font-bold text-[#0a192f] flex items-center gap-2">
                                <CheckCircle className="w-6 h-6 text-green-500" /> All Completed Tests
                            </h2>
                            <button onClick={() => setShowAllCompletedModal(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                            {completedReports.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 font-medium">No completed tests available.</div>
                            ) : (
                                <div className="space-y-3">
                                    {completedReports.map(report => (
                                        <div key={report.id} className="p-5 rounded-2xl border border-gray-100 bg-white flex justify-between items-center shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                                                    <div className="w-4 h-4 bg-green-500 rounded-full opacity-60"></div>
                                                    <div className="w-2 h-2 bg-green-600 rounded-full absolute"></div>
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-gray-900 text-lg">{report.test_name}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{report.patient_name} • PID: {report.patient_code}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 text-right">
                                                <p className="text-sm text-gray-500 font-medium">{new Date(report.updated_at).toLocaleString()}</p>
                                                <button onClick={() => handlePrint(report)} className="bg-white border border-red-200 text-[#d32f2f] hover:bg-red-50 text-sm font-bold flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors">
                                                    <Printer className="w-4 h-4"/> Print Report
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabDashboard;
