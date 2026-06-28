import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserPlus, Printer, Save, CheckCircle, HeartPulse, Activity } from 'lucide-react';

const OPRegistration = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [searchMobile, setSearchMobile] = useState('');
    const [searching, setSearching] = useState(false);
    const [patientExists, setPatientExists] = useState(false);
    const [existingPatientId, setExistingPatientId] = useState(null);
    const [existingPatientCode, setExistingPatientCode] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [formData, setFormData] = useState({
        name: '', age: '', gender: 'Male', dob: '', blood_group: '', 
        mobile_number: '', alternative_mobile: '', address: '', village: '', 
        city: '', district: '', state: '', occupation: '', emergency_contact: '',
        doctor_id: '', consultation_fee: '', payment_method: 'Cash', notes: ''
    });

    const [vitalsData, setVitalsData] = useState({
        blood_pressure: '', heart_rate: '', temperature: '', spo2: '', weight: ''
    });

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await api.get('/doctors/list');
                setDoctors(res.data);
            } catch (error) {
                console.error('Failed to fetch doctors', error);
            }
        };
        fetchDoctors();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'doctor_id') {
            const doc = doctors.find(d => d.id.toString() === value);
            if (doc) setFormData(prev => ({ ...prev, consultation_fee: doc.consultation_fee }));
        }
    };

    const handleSearchChange = async (e) => {
        const value = e.target.value;
        setSearchMobile(value);
        
        if (value.length >= 2) {
            try {
                const res = await api.get(`/patients/search?q=${value}`);
                setSuggestions(res.data);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Search failed', error);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setPatientExists(false);
            setExistingPatientId(null);
            setExistingPatientCode(null);
        }
    };

    const handleSelectSuggestion = (p) => {
        setSearchMobile(p.mobile_number || p.name);
        setPatientExists(true);
        setExistingPatientId(p.id);
        setExistingPatientCode(p.patient_id);
        setFormData(prev => ({
            ...prev,
            name: p.name, age: p.age, gender: p.gender, blood_group: p.blood_group || '',
            mobile_number: p.mobile_number, alternative_mobile: p.alternative_mobile || '',
            address: p.address || '', village: p.village || '', city: p.city || '', 
            district: p.district || '', state: p.state || '', 
            occupation: p.occupation || '', emergency_contact: p.emergency_contact || ''
        }));
        setShowSuggestions(false);
    };

    const handleMobileSearch = async () => {
        if (!searchMobile) return;
        setSearching(true);
        try {
            const res = await api.get(`/patients/search?q=${searchMobile}`);
            if (res.data.length > 0) {
                handleSelectSuggestion(res.data[0]);
            } else {
                setPatientExists(false);
                setExistingPatientId(null);
                setExistingPatientCode(null);
                setFormData(prev => ({ ...prev, mobile_number: searchMobile }));
            }
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let patientId = existingPatientId;
            let generatedPatientCode = existingPatientCode;

            // 1. Register Patient if new
            if (!patientExists) {
                const patientRes = await api.post('/patients', formData);
                patientId = patientRes.data.patientId;
                generatedPatientCode = patientRes.data.generated_patient_id;
            }

            // 2. Create Visit
            const visitRes = await api.post('/visits', {
                patient_id: patientId,
                doctor_id: formData.doctor_id,
                consultation_fee: formData.consultation_fee,
                payment_method: formData.payment_method,
                notes: formData.notes
            });

            // 3. Save Vitals
            const hasVitals = vitalsData.blood_pressure || vitalsData.heart_rate || vitalsData.temperature || vitalsData.spo2 || vitalsData.weight;
            if (hasVitals) {
                await api.post(`/visits/${visitRes.data.visitId}/vitals`, vitalsData);
            }

            const selectedDoctor = doctors.find(d => d.id.toString() === formData.doctor_id);
            setSuccessData({
                patientCode: generatedPatientCode || 'Existing',
                patientName: formData.name,
                patientAge: formData.age,
                patientGender: formData.gender,
                patientAddress: formData.address,
                opToken: visitRes.data.op_token,
                doctor: selectedDoctor?.name,
                doctorSpecialization: selectedDoctor?.specialization,
                fee: formData.consultation_fee,
                date: new Date().toLocaleString(),
                vitals: hasVitals ? vitalsData : null
            });

            // Reset form for next patient
            setFormData({
                name: '', age: '', gender: 'Male', dob: '', blood_group: '', 
                mobile_number: '', alternative_mobile: '', address: '', village: '', 
                city: '', district: '', state: '', occupation: '', emergency_contact: '',
                doctor_id: '', consultation_fee: '', payment_method: 'Cash', notes: ''
            });
            setVitalsData({
                blood_pressure: '', heart_rate: '', temperature: '', spo2: '', weight: ''
            });
            setSearchMobile('');
            setPatientExists(false);
            setExistingPatientId(null);
            setExistingPatientCode(null);

        } catch (error) {
            console.error(error);
            alert('Failed to register: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-6xl mx-auto print:max-w-full">
            
            {!successData ? (
                <>
                    <div className="flex justify-between items-center mb-6 print:hidden">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <UserPlus className="w-6 h-6 text-primary" />
                            OP Registration
                        </h2>
                    </div>

                    <div className="card mb-6 bg-blue-50 border-blue-100 print:hidden relative">
                        <label className="block text-sm font-bold text-blue-800 mb-2">Check Existing Patient (Search by Name, Mobile, or ID)</label>
                        <div className="flex gap-4 relative">
                            <input 
                                type="text" 
                                value={searchMobile}
                                onChange={handleSearchChange}
                                onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="e.g. 9876543210 or John"
                                className="input-field max-w-md bg-white"
                                onKeyDown={(e) => e.key === 'Enter' && handleMobileSearch()}
                            />
                            <button 
                                onClick={handleMobileSearch}
                                disabled={searching}
                                className="btn-primary bg-blue-600 hover:bg-blue-700"
                            >
                                {searching ? 'Searching...' : 'Search History'}
                            </button>

                            {/* Dropdown Suggestions */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 mt-1 max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                                    {suggestions.map((p) => (
                                        <div 
                                            key={p.id} 
                                            onClick={() => handleSelectSuggestion(p)}
                                            className="p-3 border-b hover:bg-blue-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-primary">{p.name}</span>
                                                <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{p.patient_id}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 flex justify-between">
                                                <span>{p.mobile_number}</span>
                                                <span>{p.age} Yrs • {p.gender}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {patientExists && (
                            <p className="text-green-600 font-bold mt-2 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Patient found! Details auto-filled.
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 print:hidden">
                        
                        {/* Demographics Section */}
                        <div className="card">
                            <h3 className="text-lg font-bold border-b pb-2 mb-4 text-primary">Patient Demographics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" readOnly={patientExists} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Mobile *</label>
                                    <input required type="text" name="mobile_number" value={formData.mobile_number} onChange={handleChange} className="input-field" readOnly={patientExists} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Age *</label>
                                    <input required type="number" name="age" value={formData.age} onChange={handleChange} className="input-field" readOnly={patientExists} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Gender *</label>
                                    <select required name="gender" value={formData.gender} onChange={handleChange} className="input-field" disabled={patientExists}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Blood Group</label>
                                    <input type="text" name="blood_group" value={formData.blood_group} onChange={handleChange} className="input-field" readOnly={patientExists} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">City/Village</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" readOnly={patientExists} />
                                </div>
                            </div>
                        </div>

                        {/* Visit Section */}
                        <div className="card">
                            <h3 className="text-lg font-bold border-b pb-2 mb-4 text-primary">Visit Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Consulting Doctor *</label>
                                    <select required name="doctor_id" value={formData.doctor_id} onChange={handleChange} className="input-field">
                                        <option value="">Select Doctor...</option>
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.name} - {doc.department}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                                    <input type="number" name="consultation_fee" value={formData.consultation_fee} readOnly className="input-field bg-gray-100 font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                                    <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="input-field">
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Card">Card</option>
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Remarks</label>
                                    <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="input-field" />
                                </div>
                            </div>
                        </div>

                        {/* Vitals Section */}
                        <div className="card">
                            <h3 className="text-lg font-bold border-b pb-2 mb-4 text-primary flex items-center gap-2">
                                <HeartPulse className="w-5 h-5" />
                                Vitals & Triage <span className="text-sm font-normal text-gray-500">(Optional)</span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Blood Pressure</label>
                                    <input type="text" value={vitalsData.blood_pressure} onChange={e=>setVitalsData({...vitalsData, blood_pressure: e.target.value})} className="input-field py-2" placeholder="120/80" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                                    <input type="number" value={vitalsData.heart_rate} onChange={e=>setVitalsData({...vitalsData, heart_rate: e.target.value})} className="input-field py-2" placeholder="72" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Temperature (°F)</label>
                                    <input type="text" value={vitalsData.temperature} onChange={e=>setVitalsData({...vitalsData, temperature: e.target.value})} className="input-field py-2" placeholder="98.6" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">SpO2 (%)</label>
                                    <input type="number" value={vitalsData.spo2} onChange={e=>setVitalsData({...vitalsData, spo2: e.target.value})} className="input-field py-2" placeholder="99" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                                    <input type="number" value={vitalsData.weight} onChange={e=>setVitalsData({...vitalsData, weight: e.target.value})} className="input-field py-2" placeholder="65" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={loading} className="btn-primary w-48 h-12 text-lg flex items-center justify-center gap-2">
                                {loading ? 'Saving...' : <><Save className="w-5 h-5"/> Register & Print</>}
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                
                // Printable OP Card & Receipt View
                <div className="max-w-2xl mx-auto">
                    <div className="flex justify-end gap-4 mb-4 print:hidden">
                        <button onClick={() => setSuccessData(null)} className="btn-secondary">New Registration</button>
                        <button onClick={handlePrint} className="btn-primary flex gap-2"><Printer className="w-5 h-5"/> Print Token</button>
                    </div>

                    <div className="card bg-white border-0 p-8 relative" id="print-section">
                        {/* Custom Header exactly as requested (Bilingual) */}
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
                                    <h2 className="text-xl font-bold text-primary mb-1">{successData.doctor || 'Dr. N. Naveen Kumar'}</h2>
                                    <p className="text-sm font-bold text-highlight mb-1 whitespace-pre-line">{successData.doctorSpecialization || 'MBBS, (DNB, General Medicine)\nB.P., Sugar & Emergency Specialist'}</p>
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
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-4 text-highlight font-bold pb-2 border-b border-dashed border-gray-300">
                            <div><span className="text-primary mr-1">Pt. Name:</span> <span className="border-b border-dotted border-gray-400 pb-1 px-2">{successData.patientName}</span></div>
                            <div><span className="text-primary mr-1">Age:</span> <span className="border-b border-dotted border-gray-400 pb-1 px-2">{successData.patientAge} Yrs</span></div>
                            <div><span className="text-primary mr-1">Sex:</span> <span className="border-b border-dotted border-gray-400 pb-1 px-2">{successData.patientGender?.charAt(0) || '-'}</span></div>
                            <div className="flex-1"><span className="text-primary mr-1">Address:</span> <span className="border-b border-dotted border-gray-400 pb-1 px-2 inline-block w-48">{successData.patientAddress || '-'}</span></div>
                            <div className="w-full mt-2"><span className="text-primary mr-1">Date & Time:</span> {successData.date}</div>
                        </div>

                        {/* Vitals Line */}
                        <div className="flex flex-wrap gap-4 text-sm mb-6 text-gray-700 border-b-2 border-gray-800 pb-6">
                            <div><span className="mr-1">Weight:</span> <span className="font-bold border-b border-dotted border-gray-400 px-2">{successData.vitals?.weight || '-'} kg</span></div>
                            <div><span className="mr-1">BP:</span> <span className="font-bold border-b border-dotted border-gray-400 px-2">{successData.vitals?.blood_pressure || '-'} mmHg</span></div>
                            <div><span className="mr-1">Pulse:</span> <span className="font-bold border-b border-dotted border-gray-400 px-2">{successData.vitals?.heart_rate || '-'} bpm</span></div>
                            <div><span className="mr-1">Temp:</span> <span className="font-bold border-b border-dotted border-gray-400 px-2">{successData.vitals?.temperature || '-'} °F</span></div>
                            <div><span className="mr-1">SpO2:</span> <span className="font-bold border-b border-dotted border-gray-400 px-2">{successData.vitals?.spo2 || '-'} %</span></div>
                        </div>

                        {/* Blank space for medicines */}
                        <div className="min-h-[500px]"></div>
                        
                        {/* Styles specifically for print view */}
                        <style>
                            {`
                            @media print {
                                body * { visibility: hidden; }
                                #print-section, #print-section * { visibility: visible; }
                                #print-section { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
                                .text-primary { color: #E32636 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                .text-highlight { color: #007FFF !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                .bg-primary { background-color: #E32636 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            }
                            `}
                        </style>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OPRegistration;
