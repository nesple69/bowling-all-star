import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    User as UserIcon,
    Mail,
    Lock,
    Shield,
    Save,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Calendar,
    Key
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const Profilo: React.FC = () => {
    const { user, setUser } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        nome: '',
        cognome: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                username: user.username || '',
                email: user.email || '',
                nome: user.nome || '',
                cognome: user.cognome || ''
            }));
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'Le nuove password non coincidono' });
            return;
        }

        setIsLoading(true);

        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.put(`${API_BASE_URL}/api/auth/update-profile`,
                {
                    username: formData.username,
                    email: formData.email,
                    nome: formData.nome,
                    cognome: formData.cognome,
                    password: formData.newPassword || undefined
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Aggiorna l'utente nel contesto
            const updatedUser = response.data.user;
            setUser({ ...user, ...updatedUser });

            setStatus({ type: 'success', message: 'Profilo aggiornato con successo!' });
            setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        } catch (err: any) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Errore durante l\'aggiornamento del profilo'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <UserIcon className="w-32 h-32" />
                </div>

                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-light-blue rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                        <UserIcon className="w-12 h-12" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-secondary text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                        <Shield className="w-4 h-4" />
                    </div>
                </div>

                <div className="text-center md:text-left space-y-1">
                    <h1 className="text-3xl font-black text-dark uppercase tracking-tight">
                        {user.nome} {user.cognome}
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <span className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-primary/20">
                            {user.ruolo}
                        </span>
                        <span className="text-gray-400 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest bg-gray-50 border border-gray-100 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            Membro dal {new Date(user.createdAt || Date.now()).toLocaleDateString('it-IT')}
                        </span>
                    </div>
                </div>
            </div>

            {status && (
                <div className={`p-4 rounded-2xl border-l-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
                    }`}>
                    <div className="flex items-center gap-3">
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="font-bold uppercase tracking-tight text-sm">{status.message}</p>
                    </div>
                    <button onClick={() => setStatus(null)} className="opacity-50 hover:opacity-100 transition-opacity">
                        <Save className="w-4 h-4 rotate-45" />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Informazioni Personali */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                            <UserIcon className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-black text-dark uppercase tracking-tight">Informazioni Profilo</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white outline-none transition-all text-sm font-bold text-dark"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white outline-none transition-all text-sm font-bold text-dark"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white outline-none transition-all text-sm font-bold text-dark"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cognome</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white outline-none transition-all text-sm font-bold text-dark"
                                    value={formData.cognome}
                                    onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sicurezza / Password */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                            <Key className="w-5 h-5 text-secondary" />
                            <h2 className="text-lg font-black text-dark uppercase tracking-tight">Sicurezza</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nuova Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="Lascia vuoto per non cambiare"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-secondary focus:bg-white outline-none transition-all text-sm font-bold text-dark placeholder:text-[10px] placeholder:font-medium"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Conferma Nuova Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="Conferma nuova password"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-secondary focus:bg-white outline-none transition-all text-sm font-bold text-dark placeholder:text-[10px] placeholder:font-medium"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5 text-secondary" />
                                Salva Modifiche
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profilo;
