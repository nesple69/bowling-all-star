import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Calendar, Plus, Trash2, CheckCircle2, AlertCircle, Save, ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface Stagione {
    id: string;
    nome: string;
    dataInizio: string;
    dataFine: string;
    attiva: boolean;
}

const GestioneStagioni: React.FC = () => {
    const [stagioni, setStagioni] = useState<Stagione[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    // Form per nuova stagione
    const [showForm, setShowForm] = useState(false);
    const [newStagione, setNewStagione] = useState({
        nome: '',
        dataInizio: format(new Date(), 'yyyy-MM-dd'),
        dataFine: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
        attiva: false
    });

    useEffect(() => {
        fetchStagioni();
    }, []);

    const fetchStagioni = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/stagioni`);
            setStagioni(response.data);
        } catch (err) {
            console.error('Errore nel caricamento delle stagioni:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = sessionStorage.getItem('token');
        try {
            await axios.post(`${API_BASE_URL}/api/stagioni`, newStagione, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', message: 'Stagione creata con successo!' });
            setShowForm(false);
            setNewStagione({
                nome: '',
                dataInizio: format(new Date(), 'yyyy-MM-dd'),
                dataFine: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
                attiva: false
            });
            fetchStagioni();
        } catch (err: any) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Errore nella creazione.' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Eliminare questa stagione?')) return;
        const token = sessionStorage.getItem('token');
        try {
            await axios.delete(`${API_BASE_URL}/api/stagioni/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', message: 'Stagione eliminata.' });
            fetchStagioni();
        } catch (err: any) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Errore nell\'eliminazione.' });
        }
    };

    const handleSetAttiva = async (id: string) => {
        const token = sessionStorage.getItem('token');
        const stagione = stagioni.find(s => s.id === id);
        if (!stagione) return;

        try {
            await axios.put(`${API_BASE_URL}/api/stagioni/${id}`, { ...stagione, attiva: true }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', message: 'Stagione attiva aggiornata.' });
            fetchStagioni();
        } catch (err: any) {
            setStatus({ type: 'error', message: 'Errore nell\'attivazione.' });
        }
    };

    const handleDownloadBackup = async (stagioneId: string, stagioneName: string) => {
        const token = sessionStorage.getItem('token');
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/backup/genera/${stagioneId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            // Crea un link temporaneo e triggera il download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `backup-${stagioneName}-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setStatus({ type: 'success', message: 'Backup PDF scaricato!' });
        } catch (err: any) {
            setStatus({ type: 'error', message: 'Errore nel download del backup.' });
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 text-dark">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin/tornei" className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary transition-all shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Calendar className="text-secondary w-7 h-7" />
                            Gestione Stagioni
                        </h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 italic">Definisci i periodi agonistici (es. 2025/2026)</p>
                    </div>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-primary text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nuova Stagione
                    </button>
                )}
            </div>

            {status.type && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-slide-up ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-black uppercase tracking-tight">{status.message}</p>
                </div>
            )}

            {showForm && (
                <form onSubmit={handleCreate} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm animate-slide-up space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome (es. 2025/2026)</label>
                            <input
                                required
                                value={newStagione.nome}
                                onChange={e => setNewStagione({ ...newStagione, nome: e.target.value })}
                                placeholder="2025/2026"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data Inizio</label>
                            <input
                                required
                                type="date"
                                value={newStagione.dataInizio}
                                onChange={e => setNewStagione({ ...newStagione, dataInizio: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data Fine</label>
                            <input
                                required
                                type="date"
                                value={newStagione.dataFine}
                                onChange={e => setNewStagione({ ...newStagione, dataFine: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newStagione.attiva}
                                onChange={e => setNewStagione({ ...newStagione, attiva: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-[10px] font-black uppercase text-gray-500">Imposta come stagione attiva</span>
                        </label>
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-black uppercase text-[10px] text-gray-400 hover:text-dark transition-colors tracking-widest">Annulla</button>
                            <button type="submit" className="bg-primary text-white font-black px-8 py-3 rounded-2xl flex items-center gap-2 uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                                <Save className="w-4 h-4" />
                                Salva Stagione
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-5">Nome</th>
                            <th className="px-8 py-5">Periodo</th>
                            <th className="px-8 py-5 text-center">Stato</th>
                            <th className="px-8 py-5 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {stagioni.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="px-8 py-5">
                                    <span className="font-black text-dark uppercase tracking-tight">{s.nome}</span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-xs font-bold text-gray-500 uppercase">
                                        {format(new Date(s.dataInizio), 'dd/MM/yy')} - {format(new Date(s.dataFine), 'dd/MM/yy')}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    {s.attiva ? (
                                        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-200">Attiva</span>
                                    ) : (
                                        <button
                                            onClick={() => handleSetAttiva(s.id)}
                                            className="text-[10px] font-black uppercase text-gray-300 hover:text-primary transition-colors tracking-widest"
                                        >
                                            Rendi Attiva
                                        </button>
                                    )}
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleDownloadBackup(s.id, s.nome)}
                                            className="p-2 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all"
                                            title="Scarica Backup PDF"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(s.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Elimina Stagione"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {stagioni.length === 0 && (
                    <div className="p-20 text-center space-y-4">
                        <Calendar className="w-16 h-16 text-gray-100 mx-auto" />
                        <p className="text-sm font-black text-gray-300 uppercase">Nessuna stagione configurata</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GestioneStagioni;
