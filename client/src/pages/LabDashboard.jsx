import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Activity, Search, Save, CheckCircle, FileText, HeartPulse, Printer } from 'lucide-react';

const LabDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [resultValue, setResultValue] = useState('');
    const [remarks, setRemarks] = useState('');
    const [saving, setSaving] = useState(false);
    const [printData, setPrintData] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

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

    const handleSelectReport = (report) => {
        setSelectedReport(report);
        setResultValue(report.result_value || '');
        setRemarks(report.remarks || '');
    };

    const handleSaveResult = async () => {
        if (!selectedReport) return;
        setSaving(true);
        try {
            await api.put(`/lab/report/${selectedReport.id}`, {
                result_value: resultValue,
                remarks: remarks,
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

    if (loading) return <div className="p-8 text-center">Loading lab reports...</div>;

    const pendingReports = reports.filter(r => r.status === 'Pending');
    const completedReports = reports.filter(r => r.status === 'Completed');

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2 print:hidden">
                <Activity className="w-8 h-8 text-primary" /> Laboratory Dashboard
            </h1>

            {/* Print View */}
            {printData && (
                <div className="card bg-white border-0 p-8 relative hidden print:block" id="print-section">
                    {/* Bilingual Header identical to OP Registration */}
                    <div className="flex flex-col border-b-2 border-primary pb-4 mb-4 space-y-4">
                        {/* Top Row: Logo & Telugu Hospital Name */}
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

                        {/* Middle Row: Telugu Doctor Info & 24/7 Logo */}
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

                        {/* Bottom Row: English Doctor Info & Stethoscope Logo */}
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

                    {/* Patient Details Line */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-6 text-highlight font-bold pb-2 border-b border-dashed border-gray-300">
                        <div><span className="text-primary mr-1">Pt. Name:</span> <span className="border-b border-dotted border-gray-400 pb-1 px-2">{printData.patient_name} ({printData.patient_code})</span></div>
                        <div><span className="text-primary mr-1">Age:</span> <span className="border-b border-dotted border-gray-400 pb-1 px-2">{printData.age} Yrs</span></div>
                        <div><span className="text-primary mr-1">Sex:</span> <span className="border-b border-dotted border-gray-400 pb-1 px-2">{printData.gender?.charAt(0) || '-'}</span></div>
                        <div className="w-full mt-2"><span className="text-primary mr-1">Report Date:</span> {new Date(printData.updated_at).toLocaleString()}</div>
                    </div>

                    {/* Report Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold bg-gray-100 py-2 rounded uppercase tracking-widest border border-gray-300">Laboratory Report</h2>
                    </div>

                    {/* Test Results */}
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
                        <div className="mb-8">
                            <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Remarks</p>
                            <p className="text-gray-800 font-medium">{printData.remarks}</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-yellow-500"/> Pending Tests ({pendingReports.length})
                        </h2>
                        {pendingReports.length === 0 ? (
                            <p className="text-gray-500 p-4 text-center bg-gray-50 rounded-lg">No pending lab tests.</p>
                        ) : (
                            <div className="space-y-3">
                                {pendingReports.map(report => (
                                    <div key={report.id} onClick={() => handleSelectReport(report)} className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedReport?.id === report.id ? 'border-primary ring-2 ring-primary ring-opacity-20 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">{report.test_name}</h3>
                                                <p className="text-sm text-gray-500">Patient: <span className="font-semibold text-gray-700">{report.patient_name}</span> ({report.patient_code})</p>
                                                <p className="text-xs text-gray-400 mt-1">Prescribed by {report.doctor_name}</p>
                                            </div>
                                            <span className="badge bg-yellow-100 text-yellow-800 border-yellow-200">Pending</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500"/> Recently Completed
                        </h2>
                        {completedReports.length === 0 ? (
                            <p className="text-gray-500 p-4 text-center bg-gray-50 rounded-lg">No completed tests yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {completedReports.slice(0, 10).map(report => (
                                    <div key={report.id} className="p-4 rounded-xl border border-gray-200 bg-white flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-800">{report.test_name}</h3>
                                            <p className="text-sm text-gray-500">{report.patient_name} • {new Date(report.updated_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handlePrint(report)} className="btn-secondary text-xs flex items-center gap-1 p-2">
                                                <Printer className="w-4 h-4"/> Print Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    {selectedReport ? (
                        <div className="card sticky top-8">
                            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2 border-b pb-2">
                                <FileText className="w-5 h-5"/> Enter Lab Results
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Test Name</p>
                                    <p className="font-bold text-lg">{selectedReport.test_name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg border">
                                        <p className="text-xs text-gray-500 uppercase">Normal Range</p>
                                        <p className="font-bold text-gray-700">{selectedReport.normal_range || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border">
                                        <p className="text-xs text-gray-500 uppercase">Unit</p>
                                        <p className="font-bold text-gray-700">{selectedReport.unit !== '-' ? selectedReport.unit : '-'}</p>
                                    </div>
                                </div>

                                {selectedReport.remarks && (
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                        <p className="text-xs text-yellow-800 font-bold uppercase mb-1">Doctor's Remarks</p>
                                        <p className="text-sm text-yellow-900">{selectedReport.remarks}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Observed Result Value *</label>
                                    <input 
                                        type="text" 
                                        value={resultValue} 
                                        onChange={e => setResultValue(e.target.value)} 
                                        className="input-field font-bold text-lg py-3"
                                        placeholder="Enter result..."
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Lab Remarks / Notes (Optional)</label>
                                    <textarea 
                                        value={remarks} 
                                        onChange={e => setRemarks(e.target.value)} 
                                        className="input-field"
                                        rows="3"
                                        placeholder="Any additional observations..."
                                    ></textarea>
                                </div>

                                <button 
                                    onClick={handleSaveResult} 
                                    disabled={saving || !resultValue.trim()} 
                                    className="btn-primary w-full flex justify-center items-center gap-2 py-3"
                                >
                                    {saving ? 'Saving...' : <><Save className="w-5 h-5"/> Complete Test & Save Result</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card text-center py-12 px-4 sticky top-8 bg-gray-50 border-dashed">
                            <Activity className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-600 mb-2">No Test Selected</h3>
                            <p className="text-gray-500">Select a pending test from the list to enter its results.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabDashboard;
