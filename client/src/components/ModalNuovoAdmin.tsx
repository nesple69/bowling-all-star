import React, { useState } from 'react';
import { X, User, Mail, Lock, Plus } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface ModalNuovoAdminProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ModalNuovoAdmin: React.FC<ModalNuovoAdminProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confermaPassword: '',
        nome: '',
        cognome: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confermaPassword) {
            setError('Le password non coincidono');
            return;
        }

        if (formData.password.length < 6) {
            setError('La password deve essere di almeno 6 caratteri');
            return;
        }

        setIsLoading(true);

        try {
            const token = sessionStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/users/create-admin`,
                {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    nome: formData.nome,
                    cognome: formData.cognome
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess();
            onClose();
            setFormData({
                username: '',
                email: '',
                password: '',
                confermaPassword: '',
                nome: '',
                cognome: ''
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Errore nella creazione dell\'amministratore');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-primary p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Plus className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-tight">Nuovo Admin</h2>
                            <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Aggiungi amministratore</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold border-l-4 border-red-500 flex items-center gap-2">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nome</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
                                placeholder="Ees. Mario"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cognome</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
                                placeholder="Ees. Rossi"
                                value={formData.cognome}
                                onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
                                placeholder="mario_rossi"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email (Opzionale)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
                                placeholder="mario@email.it"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Conferma Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
                                placeholder="••••••••"
                                value={formData.confermaPassword}
                                onChange={(e) => setFormData({ ...formData, confermaPassword: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-100 text-gray-500 font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 py-3 px-4 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Creazione...' : 'Crea Admin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalNuovoAdmin;
