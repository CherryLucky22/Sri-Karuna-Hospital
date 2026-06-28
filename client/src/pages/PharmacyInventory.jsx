import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Pill, Search, Plus, AlertTriangle, FileText, ShoppingCart, X, MoreVertical, Trash2, ChevronDown, ChevronLeft, ChevronRight, FlaskConical, Circle } from 'lucide-react';
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

    const handleClearBill = () => {
        setBillItems([]);
        setBillDetails({ patient_id: '', payment_method: 'Cash' });
        setSearchMed('');
        setFilteredMeds([]);
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
            handleClearBill();
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

    const getIconTheme = (index, category) => {
        if (category?.toLowerCase() === 'syrup') {
            return { bg: 'bg-orange-50', text: 'text-orange-600', icon: <FlaskConical className="w-5 h-5" /> };
        }
        const themes = [
            { bg: 'bg-red-50', text: 'text-red-500' },
            { bg: 'bg-purple-50', text: 'text-purple-500' },
            { bg: 'bg-indigo-50', text: 'text-indigo-400' },
            { bg: 'bg-green-50', text: 'text-green-500' },
            { bg: 'bg-blue-50', text: 'text-blue-500' },
        ];
        return { ...themes[index % themes.length], icon: <Pill className="w-5 h-5 -rotate-45" /> };
    };

    const getCategoryTheme = (category) => {
        if (category?.toLowerCase() === 'syrup') return 'bg-orange-50 text-orange-600';
        return 'bg-blue-50 text-blue-600';
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1.3fr] gap-3 lg:gap-4 p-3 lg:p-4 bg-gray-50/50 min-h-screen">
            
            {/* Inventory List */}
            <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-center bg-white p-3 lg:p-4 rounded-xl shadow-sm border border-gray-100 flex-wrap gap-3">
                    <h2 className="text-base lg:text-lg font-extrabold text-[#0a192f] flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shrink-0">
                            <Pill className="w-4 h-4 -rotate-45" />
                        </div>
                        Medicine Inventory
                    </h2>
                    <div className="flex gap-2 items-center w-full sm:w-auto flex-1 sm:flex-none">
                        <div className="relative w-full sm:w-56">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search inventory..." 
                                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setInventoryModal({ open: true, mode: 'add', data: { name: '', category: '', mrp: '', selling_price: '', minimum_stock: 10, current_stock: 0, unit: 'Tablet' } })}
                            className="bg-[#b71c1c] hover:bg-[#9a1717] text-white text-xs font-bold flex gap-1.5 items-center px-3 py-1.5 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                        >
                            <Plus className="w-3.5 h-3.5"/> <span className="hidden sm:inline">Add Medicine</span><span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="text-gray-700 bg-white border-b border-gray-100">
                                <tr>
                                    <th className="px-3 lg:px-4 py-2.5 font-bold">
                                        Medicine Name <ChevronDown className="w-3 h-3 inline ml-0.5 text-gray-400" />
                                    </th>
                                    <th className="px-3 lg:px-4 py-2.5 font-bold text-center">
                                        Category <ChevronDown className="w-3 h-3 inline ml-0.5 text-gray-400" />
                                    </th>
                                    <th className="px-3 lg:px-4 py-2.5 font-bold text-center">
                                        MRP (₹) <ChevronDown className="w-3 h-3 inline ml-0.5 text-gray-400" />
                                    </th>
                                    <th className="px-3 lg:px-4 py-2.5 font-bold text-center">
                                        Stock <ChevronDown className="w-3 h-3 inline ml-0.5 text-gray-400" />
                                    </th>
                                    <th className="px-3 lg:px-4 py-2.5 font-bold text-center">
                                        Status <ChevronDown className="w-3 h-3 inline ml-0.5 text-gray-400" />
                                    </th>
                                    <th className="px-3 lg:px-4 py-2.5 font-bold text-center">
                                        Expiry <ChevronDown className="w-3 h-3 inline ml-0.5 text-gray-400" />
                                    </th>
                                    <th className="px-3 lg:px-4 py-2.5 font-bold text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {inventory
                                    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .slice(0, 7) // Show slightly more if we reduced size
                                    .map((med, idx) => {
                                        const theme = getIconTheme(idx, med.category);
                                        return (
                                            <tr key={med.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-3 lg:px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg ${theme.bg} ${theme.text} flex items-center justify-center shrink-0`}>
                                                            {theme.icon}
                                                        </div>
                                                        <span className="font-extrabold text-[#0a192f] text-xs lg:text-sm">{med.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 lg:px-4 py-2 text-center">
                                                    <span className={`px-2 py-1 rounded text-[10px] lg:text-xs font-bold ${getCategoryTheme(med.category)}`}>
                                                        {med.category || 'Tablet'}
                                                    </span>
                                                </td>
                                                <td className="px-3 lg:px-4 py-2 text-center font-bold text-gray-700">{Number(med.selling_price).toFixed(2)}</td>
                                                <td className="px-3 lg:px-4 py-2 text-center font-bold text-gray-800">{med.current_stock}</td>
                                                <td className="px-3 lg:px-4 py-2">
                                                    <div className="flex justify-center">
                                                        {med.current_stock <= med.minimum_stock ? (
                                                            <span className="text-red-600 flex items-center gap-1 text-[10px] lg:text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-100">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Low Stock
                                                            </span>
                                                        ) : (
                                                            <span className="text-green-600 flex items-center gap-1 text-[10px] lg:text-xs font-bold bg-green-50 px-2 py-1 rounded border border-green-100">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> In Stock
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 lg:px-4 py-2 text-center font-bold text-gray-500">{med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'N/A'}</td>
                                                <td className="px-3 lg:px-4 py-2 text-center">
                                                    <button 
                                                        onClick={() => setInventoryModal({ open: true, mode: 'edit', data: med })}
                                                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors inline-flex justify-center"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row justify-between items-center p-3 border-t border-gray-100 bg-white gap-2">
                        <p className="text-[11px] lg:text-xs text-gray-500 font-medium">Showing 1 to {Math.min(7, inventory.length)} of {inventory.length} items</p>
                        <div className="flex items-center gap-1">
                            <button className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronLeft className="w-3.5 h-3.5" /></button>
                            <button className="w-6 h-6 flex items-center justify-center rounded bg-[#b71c1c] text-white font-bold text-[11px] lg:text-xs">1</button>
                            <button className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 text-[11px] lg:text-xs">2</button>
                            <button className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 text-[11px] lg:text-xs">3</button>
                            <span className="w-6 h-6 flex items-center justify-center text-gray-400 text-xs">...</span>
                            <button className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 text-[11px] lg:text-xs">5</button>
                            <button className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronRight className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing Station */}
            <div className="flex flex-col">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col p-3 lg:p-4">
                    <h3 className="text-base lg:text-lg font-extrabold text-[#0a192f] mb-3 lg:mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shrink-0">
                            <ShoppingCart className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap">Billing Station</span>
                    </h3>

                    <div className="mb-3 relative">
                        <label className="block text-[11px] lg:text-xs font-bold text-[#0a192f] mb-1.5">Add Medicine to Bill</label>
                        <div className="relative">
                            <Plus className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-red-500" />
                            <input 
                                type="text" 
                                value={searchMed} 
                                onChange={(e) => handleSearchMed(e.target.value)} 
                                className="w-full pl-8 pr-3 py-1.5 border border-red-200 rounded-lg text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                                placeholder="Search medicine..." 
                            />
                        </div>
                        {filteredMeds.length > 0 && (
                            <div className="absolute z-20 w-full bg-white border border-gray-200 shadow-xl max-h-60 overflow-y-auto rounded-lg mt-1">
                                {filteredMeds.map(m => (
                                    <div key={m.id} onClick={() => addToBill(m)} className="p-2 border-b border-gray-50 hover:bg-red-50 cursor-pointer flex justify-between items-center transition-colors">
                                        <div>
                                            <p className="font-bold text-xs text-[#0a192f]">{m.name}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">₹{m.selling_price} | Stock: {m.current_stock}</p>
                                        </div>
                                        <Plus className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 bg-gray-50/50 border border-gray-100 rounded-xl p-2 lg:p-3 overflow-y-auto mb-3 lg:mb-4 min-h-[120px] lg:min-h-[180px]">
                        {billItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <ShoppingCart className="w-10 h-10 lg:w-12 lg:h-12 mb-2 text-gray-300" />
                                <p className="text-[11px] lg:text-xs font-medium text-center">No items added to<br className="lg:hidden"/> bill yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {billItems.map(item => (
                                    <div key={item.medicine_id} className="bg-white p-2 lg:p-3 border border-gray-100 rounded-lg shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div className="flex-1 w-full sm:w-auto">
                                            <p className="font-extrabold text-[#0a192f] text-xs truncate">{item.name}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">₹{item.price.toFixed(2)} / unit</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 lg:gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={item.quantity} 
                                                onChange={(e) => updateQuantity(item.medicine_id, parseInt(e.target.value))}
                                                className="w-10 lg:w-12 text-center border border-gray-200 rounded py-1 text-xs font-bold text-gray-700 focus:outline-none focus:border-red-500" 
                                            />
                                            <p className="font-extrabold w-12 lg:w-16 text-right text-[#0a192f] text-xs">₹{item.total.toFixed(2)}</p>
                                            <button onClick={() => removeBillItem(item.medicine_id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-red-50/50 border border-red-50 rounded-xl p-3 lg:p-4 mb-3 lg:mb-4">
                        <div className="flex justify-between text-[11px] lg:text-xs mb-1.5 text-gray-600 font-medium"><span>Sub Total</span> <span>₹{billTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-[11px] lg:text-xs mb-2 lg:mb-3 text-gray-600 font-medium"><span>GST (5%)</span> <span>₹{gst.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center text-sm lg:text-base font-black text-[#0a192f] border-t border-red-100 pt-2 lg:pt-3 flex-wrap gap-1">
                            <span>Net Amount</span> 
                            <span className="text-red-600 text-base lg:text-lg">₹{netAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-3 lg:mb-4">
                        <button 
                            onClick={() => setBillDetails({...billDetails, payment_method: 'Cash'})}
                            className={`flex-1 py-2 rounded-lg text-[11px] lg:text-xs font-bold border transition-colors ${billDetails.payment_method === 'Cash' ? 'bg-[#b71c1c] text-white border-[#b71c1c]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            Cash
                        </button>
                        <button 
                            onClick={() => setBillDetails({...billDetails, payment_method: 'UPI'})}
                            className={`flex-1 py-2 rounded-lg text-[11px] lg:text-xs font-bold border transition-colors ${billDetails.payment_method === 'UPI' ? 'bg-[#b71c1c] text-white border-[#b71c1c]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            UPI
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <button 
                            onClick={handleClearBill}
                            className="w-full py-2 lg:py-2.5 text-[11px] lg:text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5"/> Clear Bill
                        </button>
                        <button 
                            onClick={handleGenerateBill} 
                            disabled={billItems.length === 0}
                            className={`w-full py-2 lg:py-2.5 text-[11px] lg:text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 ${
                                billItems.length === 0 ? 'bg-gray-300 text-white cursor-not-allowed shadow-none' : 'bg-[#b71c1c] hover:bg-[#9a1717] text-white'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5"/> Generate Bill
                        </button>
                    </div>
                </div>
            </div>

            {/* Inventory Modal */}
            {inventoryModal.open && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                            <h3 className="font-extrabold text-xl text-[#0a192f] flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                                    <Pill className="w-5 h-5 -rotate-45"/>
                                </div>
                                {inventoryModal.mode === 'add' ? 'Add New Medicine' : 'Edit Medicine'}
                            </h3>
                            <button onClick={() => setInventoryModal({ open: false, data: null, mode: 'add' })} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveInventory} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Medicine Name *</label>
                                <input required type="text" value={inventoryModal.data.name} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, name: e.target.value}})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-red-500 transition-colors text-[#0a192f]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                    <input type="text" value={inventoryModal.data.category || ''} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, category: e.target.value}})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-red-500 transition-colors text-[#0a192f]" placeholder="e.g. Antibiotic" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unit Type</label>
                                    <select value={inventoryModal.data.unit || 'Tablet'} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, unit: e.target.value}})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-red-500 transition-colors text-[#0a192f]">
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
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selling Price (₹) *</label>
                                    <input required type="number" step="0.01" value={inventoryModal.data.selling_price || ''} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, selling_price: e.target.value}})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-red-500 transition-colors text-[#0a192f]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">MRP (₹)</label>
                                    <input type="number" step="0.01" value={inventoryModal.data.mrp || ''} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, mrp: e.target.value}})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-red-500 transition-colors text-[#0a192f]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Stock *</label>
                                    <input required type="number" value={inventoryModal.data.current_stock || 0} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, current_stock: e.target.value}})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-red-500 transition-colors text-[#0a192f]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Stock Alert</label>
                                    <input type="number" value={inventoryModal.data.minimum_stock || 10} onChange={e => setInventoryModal({...inventoryModal, data: {...inventoryModal.data, minimum_stock: e.target.value}})} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-red-500 transition-colors text-[#0a192f]" />
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setInventoryModal({ open: false, data: null, mode: 'add' })} className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" className="bg-[#b71c1c] hover:bg-[#9a1717] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors">
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
