import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Search, User, FileText, Activity, CreditCard, Stethoscope, Clock } from 'lucide-react';

const PatientSearch = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    
    const [searchQuery, setSearchQuery] = useState(query);
    const [results, setResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query) {
            handleSearch(query);
        }
    }, [query]);

    const handleSearch = async (q) => {
        if (!q.trim()) return;
        setLoading(true);
        try {
            const res = await api.get(`/patients/search?q=${q}`);
            setResults(res.data);
            if (res.data.length === 1) {
                fetchHistory(res.data[0].id);
            } else {
                setSelectedPatient(null);
                setHistory(null);
            }
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (id) => {
        setLoading(true);
        try {
            const res = await api.get(`/patients/${id}/history`);
            setHistory(res.data);
            setSelectedPatient(res.data.patient);
        } catch (error) {
            console.error('History fetch failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Global Patient Search</h2>
            </div>

            <div className="card">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            placeholder="Search by Mobile Number, Patient ID, or Name..."
                            className="input-field pl-10"
                        />
                    </div>
                    <button onClick={() => handleSearch(searchQuery)} className="btn-primary flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Search
                    </button>
                </div>
            </div>

            {loading && <div className="text-center py-10"><Activity className="w-8 h-8 animate-spin text-primary mx-auto" /></div>}

            {!loading && results.length === 0 && searchQuery && (
                <div className="text-center py-12 card border border-gray-100">
                    <User className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700">No patients found</h3>
                    <p className="text-gray-500 mt-2">We couldn't find anyone matching "{searchQuery}". Try a different ID, Name, or Mobile.</p>
                </div>
            )}

            {!loading && results.length > 1 && !selectedPatient && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map(patient => (
                        <div 
                            key={patient.id} 
                            onClick={() => fetchHistory(patient.id)}
                            className="card hover:shadow-md cursor-pointer transition-shadow border-l-4 border-l-primary"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-primary">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{patient.name}</h3>
                                    <p className="text-sm text-gray-500 font-mono">{patient.patient_id}</p>
                                    <p className="text-sm text-gray-500">{patient.mobile_number}</p>
                                    <p className="text-sm text-gray-500 mt-1">{patient.age} Yrs, {patient.gender}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && selectedPatient && history && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Patient Profile Widget */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-red-800"></div>
                            <div className="relative z-10 pt-12 pb-2">
                                <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg mx-auto flex items-center justify-center text-4xl text-gray-300 mb-4">
                                    <User />
                                </div>
                                <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                                <p className="text-primary font-mono font-medium">{selectedPatient.patient_id}</p>
                                
                                <div className="grid grid-cols-2 gap-4 mt-6 text-left border-t border-gray-100 pt-6">
                                    <div>
                                        <p className="text-xs text-gray-500">Age / Gender</p>
                                        <p className="font-medium">{selectedPatient.age} / {selectedPatient.gender}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Blood Group</p>
                                        <p className="font-medium text-red-600">{selectedPatient.blood_group || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Mobile</p>
                                        <p className="font-medium">{selectedPatient.mobile_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">City</p>
                                        <p className="font-medium">{selectedPatient.city || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {history.pharmacy_bills && history.pharmacy_bills.length > 0 && (
                            <div className="card">
                                <h4 className="font-bold flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-accent" /> Billing History</h4>
                                <div className="space-y-3">
                                    {history.pharmacy_bills.map(bill => (
                                        <div key={bill.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                                            <div>
                                                <p className="font-mono text-sm">{bill.bill_number}</p>
                                                <p className="text-xs text-gray-500">{new Date(bill.bill_date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="font-bold text-green-600">₹{bill.net_amount}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Visit History Timeline */}
                    <div className="lg:col-span-2">
                        <div className="card h-full">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Clock className="w-6 h-6 text-primary" />
                                Visit Timeline
                            </h3>
                            
                            {history.visits.length === 0 ? (
                                <p className="text-gray-500 text-center py-10">No visits recorded yet.</p>
                            ) : (
                                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                                    {history.visits.map((visit, index) => (
                                        <div key={visit.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-red-100 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                                                <Stethoscope className="w-5 h-5" />
                                            </div>

                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-lg text-primary">{visit.department_name}</span>
                                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{new Date(visit.visit_date).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-gray-600 text-sm mb-3">Consulted <b>{visit.doctor_name}</b></p>
                                                
                                                {visit.vitals && (
                                                    <div className="flex gap-2 flex-wrap mb-3">
                                                        {visit.vitals.blood_pressure && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">BP: {visit.vitals.blood_pressure}</span>}
                                                        {visit.vitals.heart_rate && <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">HR: {visit.vitals.heart_rate}</span>}
                                                        {visit.vitals.temperature && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">Temp: {visit.vitals.temperature}</span>}
                                                    </div>
                                                )}

                                                {visit.prescription && (
                                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                                        <h5 className="text-sm font-bold flex items-center gap-1 mb-2"><FileText className="w-4 h-4"/> Diagnosis & Rx</h5>
                                                        <p className="text-sm text-gray-700 mb-2">{visit.prescription.diagnosis}</p>
                                                        
                                                        {visit.prescription.medicines?.length > 0 && (
                                                            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                                                {visit.prescription.medicines.map(med => (
                                                                    <li key={med.id}>{med.medicine_name}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {visit.lab_reports && visit.lab_reports.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                                        <h5 className="text-sm font-bold flex items-center gap-1 mb-2"><Activity className="w-4 h-4 text-purple-500"/> Lab Tests</h5>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {visit.lab_reports.map(lab => (
                                                                <span key={lab.id} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">{lab.test_name} ({lab.status})</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {!loading && searchQuery && results.length === 0 && (
                <div className="card text-center py-16">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-500">No Patient Found</h3>
                    <p className="text-gray-400 mt-2">Try searching with a different mobile number or ID.</p>
                </div>
            )}
        </div>
    );
};

export default PatientSearch;
