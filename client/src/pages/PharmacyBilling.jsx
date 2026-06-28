import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Pill, User, Clock, FileText, CheckCircle } from 'lucide-react';

const PharmacyBilling = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [billItems, setBillItems] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [gst, setGst] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (selectedPrescription && selectedPrescription.medicines) {
            const items = selectedPrescription.medicines
                .filter(m => m.medicine_id) // Only billable inventory items
                .map(med => {
                    const perDay = (med.morning ? 1 : 0) + (med.afternoon ? 1 : 0) + (med.night ? 1 : 0);
                    const duration = med.duration || 1;
                    const qty = perDay > 0 ? perDay * duration : duration;
                    const price = parseFloat(med.price || 0);
                    return {
                        ...med,
                        quantity: qty,
                        price: price,
                        total: qty * price,
                        selected: true
                    };
                });
            setBillItems(items);
            setDiscount(0);
            setGst(0);
            setPaymentMethod('Cash');
        } else {
            setBillItems([]);
        }
    }, [selectedPrescription]);

    const totalAmount = billItems.filter(i => i.selected).reduce((sum, item) => sum + item.total, 0);
    const netAmount = totalAmount - discount + gst;

    const handleItemChange = (index, field, value) => {
        const newItems = [...billItems];
        const val = parseFloat(value) || 0;
        newItems[index][field] = val;
        if (field === 'quantity' || field === 'price') {
            newItems[index].total = newItems[index].quantity * newItems[index].price;
        }
        setBillItems(newItems);
    };

    const toggleItemSelection = (index) => {
        const newItems = [...billItems];
        newItems[index].selected = !newItems[index].selected;
        setBillItems(newItems);
    };

    const handleGenerateBill = async () => {
        const selectedItems = billItems.filter(i => i.selected);
        if (selectedItems.length === 0) return alert("Please select at least one medicine to bill.");
        
        setGenerating(true);
        try {
            const payload = {
                patient_id: selectedPrescription.patient_id, 
                prescription_id: selectedPrescription.id,
                total_amount: totalAmount,
                discount: discount,
                gst: gst,
                net_amount: netAmount,
                payment_method: paymentMethod,
                items: selectedItems.map(i => ({
                    medicine_id: i.medicine_id,
                    quantity: i.quantity,
                    price: i.price,
                    total: i.total
                }))
            };
            
            const res = await api.post('/pharmacy/bill', payload);
            alert(`Bill ${res.data.bill_number} generated successfully!`);
            setSelectedPrescription(null);
            fetchPendingPrescriptions();
        } catch (error) {
            console.error("Billing failed", error);
            alert("Failed to generate bill.");
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        fetchPendingPrescriptions();
    }, []);

    const fetchPendingPrescriptions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/pharmacy/pending-prescriptions');
            setPrescriptions(res.data);
        } catch (error) {
            console.error("Failed to fetch prescriptions", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Pill className="text-primary w-6 h-6" />
                Pharmacy Billing & Prescriptions
            </h2>

            <div className="flex flex-col md:flex-row gap-6">
                
                {/* Pending Prescriptions List */}
                <div className="md:w-1/3 flex flex-col gap-4">
                    <div className="bg-white rounded-xl shadow-md border overflow-hidden">
                        <div className="bg-blue-50 border-b p-4 flex justify-between items-center">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                <Clock className="w-5 h-5"/> Today's Prescriptions
                            </h3>
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                                {prescriptions.length}
                            </span>
                        </div>
                        <div className="p-4 flex flex-col gap-3 max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <p className="text-gray-500 text-sm text-center py-4">Loading prescriptions...</p>
                            ) : prescriptions.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No prescriptions found for today.</p>
                            ) : (
                                prescriptions.map(pr => (
                                    <div 
                                        key={pr.id} 
                                        onClick={() => setSelectedPrescription(pr)}
                                        className={`p-3 border rounded-lg cursor-pointer transition ${selectedPrescription?.id === pr.id ? 'border-primary bg-red-50' : 'hover:border-gray-400 hover:shadow-sm'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-800">{pr.patient_name}</h4>
                                            <span className="text-xs text-gray-500 font-mono">{pr.op_token}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 font-mono mb-2">ID: {pr.patient_code}</p>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 flex items-center gap-1"><User className="w-3 h-3"/> {pr.doctor_name}</span>
                                            <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{pr.medicines?.length || 0} Meds</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Prescription Details View */}
                <div className="md:w-2/3">
                    {selectedPrescription ? (
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 p-6 border-b flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">{selectedPrescription.patient_name}</h3>
                                    <p className="text-gray-500 font-mono mt-1">ID: {selectedPrescription.patient_code} | Token: {selectedPrescription.op_token}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-700">{selectedPrescription.doctor_name}</p>
                                    <p className="text-xs text-gray-500">Prescribed: {new Date(selectedPrescription.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <h4 className="font-bold text-lg text-primary flex items-center gap-2 mb-4 border-b pb-2">
                                    <FileText className="w-5 h-5"/> Direct Billing
                                </h4>
                                
                                {billItems.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto mb-6">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-700">
                                                    <tr>
                                                        <th className="p-3 rounded-tl-lg">Bill?</th>
                                                        <th className="p-3">Medicine Name</th>
                                                        <th className="p-3">Qty</th>
                                                        <th className="p-3">Price (₹)</th>
                                                        <th className="p-3 rounded-tr-lg">Total (₹)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {billItems.map((med, idx) => (
                                                        <tr key={idx} className={`border-b ${med.selected ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                                                            <td className="p-3">
                                                                <input type="checkbox" checked={med.selected} onChange={() => toggleItemSelection(idx)} className="w-4 h-4 cursor-pointer" />
                                                            </td>
                                                            <td className="p-3 font-bold text-gray-800">
                                                                {med.medicine_name}
                                                                <p className="text-xs text-gray-500 font-normal">Stock: {med.current_stock || 0}</p>
                                                            </td>
                                                            <td className="p-3">
                                                                <input type="number" value={med.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} disabled={!med.selected} className="border p-1 w-16 rounded text-center" />
                                                            </td>
                                                            <td className="p-3">
                                                                <input type="number" value={med.price} onChange={e => handleItemChange(idx, 'price', e.target.value)} disabled={!med.selected} className="border p-1 w-20 rounded text-center" />
                                                            </td>
                                                            <td className="p-3 font-bold text-primary">₹{med.total.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h5 className="font-bold text-gray-700 mb-3 border-b pb-2">Payment Details</h5>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">Total Amount:</span>
                                                        <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">Discount (₹):</span>
                                                        <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="border p-1 w-24 rounded text-right" />
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">GST (₹):</span>
                                                        <input type="number" value={gst} onChange={e => setGst(parseFloat(e.target.value) || 0)} className="border p-1 w-24 rounded text-right" />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col justify-end">
                                                <div className="bg-white p-4 rounded-lg border-2 border-primary mb-4 shadow-sm">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-gray-600 font-bold uppercase text-xs">Net Payable</span>
                                                        <span className="text-3xl font-black text-primary">₹{netAmount.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input-field w-1/3 border-gray-300">
                                                        <option value="Cash">Cash</option>
                                                        <option value="UPI">UPI</option>
                                                        <option value="Card">Card</option>
                                                    </select>
                                                    <button onClick={handleGenerateBill} disabled={generating} className="btn-primary w-2/3 flex justify-center items-center gap-2">
                                                        {generating ? 'Processing...' : <><CheckCircle className="w-5 h-5"/> Generate Bill</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-500 py-8 text-center bg-gray-50 rounded-xl border border-dashed">No billable medicines found in this prescription.</p>
                                )}

                                <div className="mt-4 flex justify-end">
                                    <button onClick={() => setSelectedPrescription(null)} className="text-sm text-gray-500 hover:text-gray-800 underline">Cancel / Close</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400">
                            <FileText className="w-16 h-16 mb-4 text-gray-300" />
                            <p className="text-lg font-medium">Select a prescription to view details</p>
                            <p className="text-sm mt-1">Click on any patient card from the left panel</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PharmacyBilling;
