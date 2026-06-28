import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Plus, Edit, Trash2, X } from 'lucide-react';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Reception',
        phone: ''
    });

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'Reception', phone: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/admin/users/${editingUser.id}`, formData);
            } else {
                await api.post('/admin/users', formData);
            }
            handleCloseModal();
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert(error.response?.data?.message || 'Error saving user');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/admin/users/${id}`);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Error deleting user');
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Loading users...</div>;

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" /> Manage Users
                </h2>
                <button 
                    onClick={() => handleOpenModal()} 
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add User
                </button>
            </div>

            <div className="card flex-1 overflow-hidden flex flex-col p-0">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 border-b sticky top-0">
                            <tr>
                                <th className="p-4 font-bold">Name</th>
                                <th className="p-4 font-bold">Email</th>
                                <th className="p-4 font-bold">Role</th>
                                <th className="p-4 font-bold">Phone</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="p-4 text-gray-600">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                            ${user.role === 'Admin' ? 'bg-red-100 text-red-700' : 
                                              user.role === 'Doctor' ? 'bg-blue-100 text-blue-700' : 
                                              user.role === 'Pharmacy' ? 'bg-green-100 text-green-700' : 
                                              'bg-gray-100 text-gray-700'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{user.phone || '-'}</td>
                                    <td className="p-4 flex gap-2 justify-end">
                                        <button onClick={() => handleOpenModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Name *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Password {editingUser && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>}
                                    {!editingUser && '*'}
                                </label>
                                <input required={!editingUser} type="password" name="password" value={formData.password} onChange={handleInputChange} className="input-field" placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role *</label>
                                <select name="role" value={formData.role} onChange={handleInputChange} className="input-field">
                                    <option value="Admin">Admin</option>
                                    <option value="Reception">Reception</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Laboratory">Laboratory</option>
                                    <option value="Pharmacy">Pharmacy</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="input-field" placeholder="+91 9876543210" />
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn btn-primary">
                                    {editingUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
