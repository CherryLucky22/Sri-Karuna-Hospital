import React, { useContext, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { LayoutDashboard, Users, UserPlus, Stethoscope, Pill, LogOut, Search, Activity, FileText, X, Phone, Mail, Shield, Bell, Calendar as CalendarIcon, Menu } from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children }) => (
    <NavLink 
        to={to} 
        className={({ isActive }) => 
            `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 mb-2 font-semibold text-sm
            ${isActive ? 'bg-[#d32f2f] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
        }
    >
        {({ isActive }) => (
            <>
                <div className={isActive ? "border border-white/50 rounded-full p-1" : ""}>
                    <Icon className={isActive ? "w-4 h-4" : "w-5 h-5"} />
                </div>
                <span>{children}</span>
            </>
        )}
    </NavLink>
);

const DashboardLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);

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

    const handleBlur = () => {
        setTimeout(() => setShowSuggestions(false), 200);
    };

    return (
        <div className="min-h-screen flex bg-[#f8f9fa]">
            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-[280px] bg-[#fdfdfd] border-r border-gray-100 flex flex-col fixed h-full z-40 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.03)] transition-transform duration-300 md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-8 pt-8 pb-6 border-b border-gray-100/50">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-7 h-7 text-[#fbc02d] stroke-[2.5]" />
                        <h1 className="text-xl font-bold text-[#d32f2f] tracking-tight">Sri Karuna</h1>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest pl-9">HOSPITAL MANAGEMENT</p>
                </div>
                
                <nav className="flex-1 px-4 pt-6 overflow-y-auto">
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

                <div className="p-6 border-t border-gray-100 bg-[#fdfdfd]">
                    <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => setShowProfileModal(true)}>
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-[#d32f2f] font-bold shadow-sm shrink-0">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-sm text-gray-800 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500">{user?.role}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Online</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={logout}
                        className="flex items-center gap-2 px-2 py-1 text-[#d32f2f] hover:bg-red-50 rounded-lg transition-colors text-sm font-bold"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-0 md:ml-[280px] flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="bg-white h-[84px] border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm shadow-gray-100/50 gap-4">
                    <div className="flex items-center gap-2 md:hidden">
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -ml-2 hover:bg-gray-50 rounded-lg text-gray-600">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="flex-1 max-w-[450px] relative hidden sm:block">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchSubmit}
                            onBlur={handleBlur}
                            placeholder="Search by Patient ID, Phone or Name..."
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 border border-gray-100 rounded-full focus:outline-none focus:border-gray-300 transition-all text-sm placeholder-gray-400 font-medium"
                        />
                        {showSuggestions && (
                            <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                                {suggestions.length > 0 ? (
                                    suggestions.map(p => (
                                        <div 
                                            key={p.id} 
                                            onClick={() => handleSuggestionClick(p)}
                                            className="p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer transition-colors"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-800 text-sm">{p.name}</span>
                                                <span className="text-xs text-[#d32f2f] font-mono font-bold bg-red-50 px-2 py-0.5 rounded-full">{p.patient_id}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px] font-medium text-gray-500">
                                                <span>{p.mobile_number}</span>
                                                <span>{p.age} Yrs / {p.gender}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm font-medium text-gray-500">
                                        No patients found.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 ml-auto">
                        <div className="flex items-center gap-2 bg-gray-50/80 border border-gray-100 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs font-bold text-gray-700">
                            <CalendarIcon className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                            <span className="hidden sm:inline">{today}</span>
                            <span className="sm:hidden">{today.split(' ')[0]}</span>
                        </div>
                        <div className="relative cursor-pointer ml-2" onClick={() => setShowProfileModal(true)}>
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-[#d32f2f] font-bold text-sm border border-red-200">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                    </div>
                </header>
                
                <div className="p-6 md:p-8 flex-1 overflow-x-hidden">
                    <Outlet />
                </div>
            </main>

            {/* User Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-gray-100">
                        <div className="bg-gradient-to-br from-[#d32f2f] to-[#b71c1c] p-5 text-white text-center relative">
                            <button 
                                onClick={() => setShowProfileModal(false)}
                                className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-1.5 rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/30 backdrop-blur-md shadow-inner">
                                <span className="text-2xl font-bold">{user?.name?.charAt(0)}</span>
                            </div>
                            <h2 className="text-xl font-bold mb-1">{user?.name}</h2>
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{user?.role}</span>
                        </div>
                        
                        <div className="p-4 space-y-2 bg-gray-50/50">
                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100/50">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Email Address</p>
                                    <p className="font-bold text-gray-800 text-xs truncate">{user?.email}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100/50">
                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Phone Number</p>
                                    <p className="font-bold text-gray-800 text-xs">{user?.phone || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100/50">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">System Role</p>
                                    <p className="font-bold text-gray-800 text-xs">{user?.role}</p>
                                </div>
                            </div>
                            
                            {user?.specialization && (
                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100/50">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#d32f2f] shrink-0">
                                        <Stethoscope className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Specialization</p>
                                        <p className="font-bold text-gray-800 text-xs">{user.specialization}</p>
                                    </div>
                                </div>
                            )}

                            {user?.qualifications && (
                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100/50">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600 shrink-0">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Qualifications</p>
                                        <p className="font-bold text-gray-800 text-xs">{user.qualifications}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 bg-white border-t border-gray-100">
                            <button 
                                onClick={logout}
                                className="w-full bg-[#d32f2f] hover:bg-[#b71c1c] text-white flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out from System
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
