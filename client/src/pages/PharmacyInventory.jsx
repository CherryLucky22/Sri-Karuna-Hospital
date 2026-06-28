import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Pill, Search, Plus, AlertTriangle, FileText, ShoppingCart, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PharmacyInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Billing State
    const [billItems, setBillItems] = useState([]);
    const [searchMed, setSearchMed] = useState('');
    const [filteredMeds, setFilteredMeds] = useState([]);
    const [billDetails, setBillDetails] = useState({ patient_id: '', payment_method: 'Cash' });

    // Inventory Modal State
    const [inventoryModal, setInventoryModal] = useState({ open: false, mode: 'add', data: null });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await api.get('/pharmacy/inventory');
            setInventory(res.data);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveInventory = async (e) => {
        e.preventDefault();
        try {
            if (inventoryModal.mode === 'add') {
                await api.post('/pharmacy/inventory', inventoryModal.data);
                alert("Medicine added successfully!");
            } else {
                await api.put(`/pharmacy/inventory/${inventoryModal.data.id}`, inventoryModal.data);
                alert("Medicine updated successfully!");
            }
            setInventoryModal({ open: false, mode: 'add', data: null });
            fetchInventory();
        } catch (error) {
            console.error(error);
            alert("Failed to save medicine");
        }
    };

    const handleSearchMed = (val) => {
        setSearchMed(val);
        if (val.length > 1) {
            const filtered = inventory.filter(m => 
                m.name.toLowerCase().includes(val.toLowerCase()) || 
                m.category.toLowerCase().includes(val.toLowerCase())
            );
            setFilteredMeds(filtered.slice(0, 5));
        } else {
            setFilteredMeds([]);
        }
    };

    const addToBill = (med) => {
        if(med.current_stock <= 0) {
            alert('Out of stock!');
            return;
        }
        
        const existing = billItems.find(item => item.medicine_id === med.id);
        if (existing) {
            if (existing.quantity >= med.current_stock) {
                alert('Cannot exceed current stock limit');
                return;
            }
            setBillItems(billItems.map(item => 
                item.medicine_id === med.id 
                ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
                : item
            ));
        } else {
            setBillItems([...billItems, {
                medicine_id: med.id,
                name: med.name,
                price: parseFloat(med.selling_price),
                quantity: 1,
                total: parseFloat(med.selling_price)
            }]);
        }
        setSearchMed('');
        setFilteredMeds([]);
    };

    const updateQuantity = (id, newQty) => {
        const med = inventory.find(m => m.id === id);
        if(newQty > med.current_stock) {
            alert('Cannot exceed current stock');
            return;
        }
        if(newQty < 1) return;
        
        setBillItems(billItems.map(item => 
            item.medicine_id === id 
            ? { ...item, quantity: newQty, total: newQty * item.price }
            : item
        ));
    };

    const removeBillItem = (id) => {
        setBillItems(billItems.filter(item => item.medicine_id !== id));
    };

    const billTotal = billItems.reduce((acc, item) => acc + item.total, 0);
    const gst = billTotal * 0.05; // Assuming 5% GST
    const netAmount = billTotal + gst;

    const handleGenerateBill = async () => {
        if (billItems.length === 0) return;
        try {
            const payload = {
                patient_id: billDetails.patient_id || null,
                total_amount: billTotal,
                discount: 0,
                gst: gst,
                net_amount: netAmount,
                payment_method: billDetails.payment_method,
                items: billItems
            };
            const res = await api.post('/pharmacy/bill', payload);
            alert(`Bill ${res.data.bill_number} generated successfully!`);
            generateBillPDF(res.data.bill_number);
            
            // Reset
            setBillItems([]);
            setBillDetails({ patient_id: '', payment_method: 'Cash' });
            fetchInventory();
        } catch (error) {
            console.error("Billing error", error);
            alert('Failed to generate bill');
        }
    };

    const generateBillPDF = (billNo) => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("SRI KARUNA PHARMACY", 105, 20, null, null, "center");
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text("Indhira centre, Bus Stand Rd, opposite to Mahabubabad - Thorrur Road, Mahabubabad, Telangana 506101 | Ph: 096541 23709 | Open 24 hours", 105, 26, null, null, "center");
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Bill No: ${billNo}`, 15, 35);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 35);

        const tableColumn = ["S.No", "Medicine Name", "Qty", "Price", "Total"];
        const tableRows = [];

        billItems.forEach((item, index) => {
            const rowData = [
                index + 1,
                item.name,
                item.quantity,
                item.price.toFixed(2),
                item.total.toFixed(2)
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [179, 0, 0] }
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.text(`Sub Total: Rs. ${billTotal.toFixed(2)}`, 140, finalY);
        doc.text(`GST (5%): Rs. ${gst.toFixed(2)}`, 140, finalY + 8);
        doc.setFontSize(12);
        doc.text(`Net Amount: Rs. ${netAmount.toFixed(2)}`, 140, finalY + 18);
        
        doc.save(`${billNo}.pdf`);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Inventory List */}
            <div className="xl:col-span-2 space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Pill className="text-primary" /> Medicine Inventory
                    </h2>
                    <div className="flex gap-4 items-center">
                        <div className="relative w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search inventory..." 
                                className="input-field pl-9 py-1 text-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setInventoryModal({ open: true, mode: 'add', data: { name: '', category: '', mrp: '', selling_price: '', minimum_stock: 10, current_stock: 0, unit: 'Tablet' } })}
                            className="btn-primary text-sm flex gap-2 items-center"
                        >
                            <Plus className="w-4 h-4"/> Add Medicine
                        </button>
                    </div>
                </div>

                <div className="card p-0 overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600 sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="px-4 py-3">Medicine Name</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3 text-right">MRP (₹)</th>
                                    <th className="px-4 py-3 text-right">Stock</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3">Expiry</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {inventory
                                    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map(med => (
                                    <tr key={med.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-bold">{med.name}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500 bg-gray-100 rounded inline-block mt-2">{med.category}</td>
                                        <td className="px-4 py-3 text-right">{med.selling_price}</td>
                                        <td className="px-4 py-3 text-right font-mono">{med.current_stock}</td>
                                        <td className="px-4 py-3 text-center">
                                            {med.current_stock <= med.minimum_stock ? (
                                                <span className="text-red-500 flex items-center justify-center gap-1 text-xs font-bold bg-red-50 px-2 py-1 rounded">
                                                    <AlertTriangle className="w-3 h-3"/> Low Stock
                                                </span>
                                            ) : (
                                                <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">In Stock</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => setInventoryModal({ open: true, mode: 'edit', data: med })}
                                                className="text-primary hover:text-primary-dark text-xs underline"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Billing Station */}
            <div className="xl:col-span-1">
                <div className="card h-full flex flex-col">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-4">
                        <ShoppingCart className="text-primary"/> Billing Station
                    </h3>

                    <div className="mb-4 relative">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Add Medicine to Bill</label>
                        <div className="relative">
                            <Plus className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                value={searchMed} 
                                onChange={(e) => handleSearchMed(e.target.value)} 
                                className="input-field pl-9 border-primary" 
                                placeholder="Search medicine..." 
                            />
                        </div>
                        {filteredMeds.length > 0 && (
                            <div className="absolute z-20 w-full bg-white border shadow-xl max-h-60 overflow-y-auto rounded mt-1">
                                {filteredMeds.map(m => (
                                    <div key={m.id} onClick={() => addToBill(m)} className="p-3 border-b hover:bg-gray-50 cursor-pointer flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm">{m.name}</p>
                                            <p className="text-xs text-gray-500">₹{m.selling_price} | Stock: {m.current_stock}</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-primary" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 bg-gray-50 border rounded-lg p-2 overflow-y-auto mb-4 min-h-[250px]">
                        {billItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <FileText className="w-12 h-12 mb-2 opacity-50" />
                                <p className="text-sm">No items added to bill yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {billItems.map(item => (
                                    <div key={item.medicine_id} className="bg-white p-3 border rounded shadow-sm flex justify-between items-center">
                                        <div className="flex-1">
                                            <p className="font-bold text-sm truncate w-32 md:w-48">{item.name}</p>
                                            <p className="text-xs text-gray-500">₹{item.price.toFixed(2)} / unit</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={item.quantity} 
                                                onChange={(e) => updateQuantity(item.medicine_id, parseInt(e.target.value))}
                                                className="w-12 text-center border rounded py-1 text-sm font-mono" 
                                            />
                                            <p className="font-bold w-16 text-right">₹{item.total.toFixed(2)}</p>
                                            <button onClick={() => removeBillItem(item.medicine_id)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
                        <div className="flex justify-between text-sm mb-1 text-gray-700"><span>Sub Total:</span> <span>₹{billTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm mb-2 text-gray-700"><span>GST (5%):</span> <span>₹{gst.toFixed(2)}</span></div>
                        <div className="flex justify-between text-lg font-black text-primary border-t border-red-200 pt-2"><span>Net Amount:</span> <span>₹{netAmount.toFixed(2)}</span></div>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <select 
                            value={billDetails.payment_method} 
                            onChange={(e) => setBillDetails({...billDetails, payment_method: e.target.value})} 
                            className="input-field text-sm w-1/2"
                        >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                        </select>
                        <input 
                            type="text" 
                            placeholder="Patient ID (Optional)" 
                            value={billDetails.patient_id} 
                            onChange={(e) => setBillDetails({...billDetails, patient_id: e.target.value})} 
                            className="input-field text-sm w-1/2 font-mono" 
                        />
                    </div>

                    <button 
                        onClick={handleGenerateBill} 
                        disabled={billItems.length === 0}
                        className={`w-full py-3 text-lg font-bold rounded shadow transition flex items-center justify-center gap-2 ${
                            billItems.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'btn-primary'
                        }`}
                    >
                        Generate Bill & Print
                    </button>
                </div>
            </div>

            {/* Inventory Modal */}
            {inventoryModal.open && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-primary text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Pill className="w-5 h-5"/> 
                                {inventoryModal.mode === 'add' ? 'Add New Medicine' : 'Edit Medicine'}
                            </h3>
                            <button onClick={() => setInventoryModal({ open: false, data: null, mode: 'add' })} className="text-white hover:text-gray-200">
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveInventory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Medicine Name *</label>
                                <input required type="text" value={inventoryModal.data.name} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, name: e.target.value}})} className="input-field" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                                    <input type="text" value={inventoryModal.data.category || ''} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, category: e.target.value}})} className="input-field" placeholder="e.g. Antibiotic" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Unit Type</label>
                                    <select value={inventoryModal.data.unit || 'Tablet'} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, unit: e.target.value}})} className="input-field">
                                        <option value="Tablet">Tablet</option>
                                        <option value="Syrup">Syrup</option>
                                        <option value="Injection">Injection</option>
                                        <option value="Cream">Cream</option>
                                        <option value="Drops">Drops</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price (₹) *</label>
                                    <input required type="number" step="0.01" value={inventoryModal.data.selling_price || ''} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, selling_price: e.target.value}})} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">MRP (₹)</label>
                                    <input type="number" step="0.01" value={inventoryModal.data.mrp || ''} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, mrp: e.target.value}})} className="input-field" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Current Stock *</label>
                                    <input required type="number" value={inventoryModal.data.current_stock || 0} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, current_stock: e.target.value}})} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Min Stock Alert</label>
                                    <input type="number" value={inventoryModal.data.minimum_stock || 10} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, minimum_stock: e.target.value}})} className="input-field" />
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                                <button type="button" onClick={() => setInventoryModal({ open: false, data: null, mode: 'add' })} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary flex items-center gap-2">
                                    <Plus className="w-4 h-4"/> Save Medicine
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyInventory;
