import React, { useContext, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { LayoutDashboard, Users, UserPlus, Stethoscope, Pill, LogOut, Search, Activity, FileText } from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children }) => (
    <NavLink 
        to={to} 
        className={({ isActive }) => 
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 mb-2
            ${isActive ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-red-50 hover:text-primary'}`
        }
    >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{children}</span>
    </NavLink>
);

const DashboardLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSearchChange = async (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (val.length >= 2) {
            try {
                const res = await api.get(`/patients/search?q=${val}`);
                setSuggestions(res.data);
                setShowSuggestions(true);
            } catch (err) {
                console.error("Search error", err);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSearchSubmit = (e) => {
        if(e.key === 'Enter' && searchQuery.trim() !== '') {
            navigate(`/patient-search?q=${searchQuery}`);
            setSearchQuery('');
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (patient) => {
        navigate(`/patient-search?q=${patient.patient_id}`);
        setSearchQuery('');
        setShowSuggestions(false);
    };

    // Close suggestions when clicking outside (simple blur handle)
    const handleBlur = () => {
        setTimeout(() => setShowSuggestions(false), 200);
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex fixed h-full z-10">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Activity className="w-8 h-8 text-accent" />
                        Sri Karuna
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Hospital Management</p>
                </div>
                
                <nav className="flex-1 p-4 overflow-y-auto">
                    {user?.role === 'Admin' && (
                        <>
                            <SidebarLink to="/admin/dashboard" icon={LayoutDashboard}>Dashboard</SidebarLink>
                            <SidebarLink to="/admin/users" icon={Users}>Manage Users</SidebarLink>
                        </>
                    )}
                    {user?.role === 'Reception' && (
                        <>
                            <SidebarLink to="/reception/dashboard" icon={LayoutDashboard}>Dashboard</SidebarLink>
                            <SidebarLink to="/reception/register" icon={UserPlus}>OP Registration</SidebarLink>
                        </>
                    )}
                    {user?.role === 'Doctor' && (
                        <>
                            <SidebarLink to="/doctor/dashboard" icon={Stethoscope}>Consultations</SidebarLink>
                            <SidebarLink to="/doctor/analysis" icon={Activity}>Hospital Analysis</SidebarLink>
                        </>
                    )}
                    {user?.role === 'Pharmacy' && (
                        <>
                            <SidebarLink to="/pharmacy/inventory" icon={Pill}>Inventory</SidebarLink>
                            <SidebarLink to="/pharmacy/billing" icon={FileText}>Billing</SidebarLink>
                        </>
                    )}
                    {user?.role === 'Laboratory' && (
                        <>
                            <SidebarLink to="/lab/dashboard" icon={Activity}>Lab Reports</SidebarLink>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-primary font-bold">
                            {user?.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-gray-800">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.role}</p>
                        </div>
                    </div>
                    <button 
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
                    <div className="w-96 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchSubmit}
                            onBlur={handleBlur}
                            placeholder="Global Search: Patient ID, Phone or Name..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                        {showSuggestions && (
                            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                                {suggestions.length > 0 ? (
                                    suggestions.map(p => (
                                        <div 
                                            key={p.id} 
                                            onClick={() => handleSuggestionClick(p)}
                                            className="p-3 hover:bg-gray-50 border-b last:border-0 cursor-pointer transition-colors"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-800 text-sm">{p.name}</span>
                                                <span className="text-xs text-primary font-mono">{p.patient_id}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                                <span>{p.mobile_number}</span>
                                                <span>{p.age} Yrs / {p.gender}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        No patients found.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>
                
                <div className="p-6 flex-1 overflow-x-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
