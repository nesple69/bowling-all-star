import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

import { supabase } from './supabaseClient';
import PlayerForm from './components/PlayerForm';
import TournamentForm from './components/TournamentForm';
import PlayerDetail from './components/PlayerDetail';
import ResultForm from './components/ResultForm';
import TransactionForm from './components/TransactionForm';
import AccountingPlayerDetail from './components/AccountingPlayerDetail';
import TournamentImportV2 from './components/TournamentImportV2';
import {
  LayoutDashboard, Users, Trophy, Wallet, LogIn, LogOut,
  AlertTriangle, Plus, Search, TrendingUp, Target, MapPin,
  ArrowUpCircle, ArrowDownCircle, FileText, Pencil, X, Calendar, Upload,
  Database, Download, ExternalLink, Globe, ShieldCheck, MessageCircle, MessageSquare
} from 'lucide-react';

const App = () => {
  useEffect(() => {
    console.log('All Star Project - UI v2.0 (Tournament Import)');
  }, []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [results, setResults] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals / Form States
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [showResultForm, setShowResultForm] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showTournamentImportForm, setShowTournamentImportForm] = useState(false);
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState(null);
  const [selectedAccountingPlayer, setSelectedAccountingPlayer] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedDashboardCategory, setSelectedDashboardCategory] = useState(null);
  const [searchPlayers, setSearchPlayers] = useState('');
  const [searchAccounting, setSearchAccounting] = useState('');
  const [searchTournaments, setSearchTournaments] = useState('');
  const [searchTournamentResults, setSearchTournamentResults] = useState('');
  const [searchRanking, setSearchRanking] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tutte');
  const [filterSenior, setFilterSenior] = useState(false);
  const [filterAziendale, setFilterAziendale] = useState(false);
  const [viewMode, setViewMode] = useState('united'); // 'united' | 'tris'

  // Calendar PDF States
  const [calendarPdfUrl, setCalendarPdfUrl] = useState(null);
  const [showCalendarUpload, setShowCalendarUpload] = useState(false);
  const [uploadingCalendar, setUploadingCalendar] = useState(false);
  // Directive PDF States
  const [directivePdfUrl, setDirectivePdfUrl] = useState(null);
  const [showDirectiveUpload, setShowDirectiveUpload] = useState(false);
  const [uploadingDirective, setUploadingDirective] = useState(false);

  // Broadcast States
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('Ciao, volevo informarti che...');

  // Archiving/Season State
  const [selectedYear, setSelectedYear] = useState('Tutte');

  // Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data
  const fetchData = async () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || url === '' || url.includes('YOUR_')) {
      alert('ERRORE CRITICO: URL di Supabase mancante o non valido su Vercel!');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: p, error: ep } = await supabase.from('players').select('*');
      const { data: t, error: et } = await supabase.from('tournaments').select('*');
      const { data: r, error: er } = await supabase.from('results').select('*');
      const { data: trx, error: etrx } = await supabase.from('transactions').select('*');

      // Fetch Admins List if user is authenticated
      if (isAdmin) {
        const { data: al, error: eal } = await supabase.from('app_admins').select('*').order('created_at', { ascending: false });
        if (al) setAdminsList(al);

        // Self-Registration: Ensure current admin is in the list
        const { data: { user } } = await supabase.auth.getUser();
        if (user && al && !al.find(a => a.id === user.id)) {
          // Auto-add current user to admins list if missing (migration/init step)
          try {
            // Extract username from email if possible, or use a default
            const username = user.email ? user.email.replace('@allstar.team', '') : 'admin';
            const { error: insertError } = await supabase.from('app_admins').insert({
              id: user.id,
              username: username
            });
            if (!insertError) {
              // Refresh list
              const { data: alRefreshed } = await supabase.from('app_admins').select('*').order('created_at', { ascending: false });
              if (alRefreshed) setAdminsList(alRefreshed);
            }
          } catch (err) {
            console.error('Self-registration failed', err);
          }
        }
      }

      if (ep || et || er || etrx) {
        console.error('Fetch Error:', { ep, et, er, etrx });
      }

      if (p) setPlayers(p);
      if (t) setTournaments(t);
      if (r) setResults(r);
      if (trx) setTransactions(trx);
    } catch (err) {
      console.error('System Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImportedResults = async (importedResults) => {
    console.group('🔵 IMPORT DEBUG');
    console.log('Received:', importedResults);
    console.log('Is Array:', Array.isArray(importedResults));
    console.log('Length:', importedResults?.length);
    console.log('First item:', importedResults?.[0]);
    console.groupEnd();

    if (!importedResults?.length) {
      alert('❌ No data received! Check TournamentImportV2 component.');
      return;
    }

    try {
      setLoading(true);

      console.log('📤 Sending to Supabase:', importedResults.length, 'items');

      const { data, error } = await supabase
        .from('results')
        .upsert(importedResults.map(r => ({
          ...r,
          categoria_risultato: r.categoria_risultato || null
        })));

      console.log('✅ Supabase data:', data);
      console.log('❌ Supabase error:', error);

      if (error) throw error;

      await fetchData();
      setShowTournamentImportForm(false);
      alert(`✅ Imported ${importedResults.length} results!`);

    } catch (error) {
      console.error('🔴 Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testDirectImport = async () => {
    if (!tournaments[0] || !players[0]) {
      alert('⚠️ Need at least 1 tournament and 1 player');
      return;
    }

    const test = [{
      id_torneo: tournaments[0].id,
      id_giocatore: players[0].id,
      birilli: 999,
      posizione: 99,
      media: 166.5,
      partite: 6
    }];

    console.log('🧪 Test insert:', test);

    const { data, error } = await supabase.from('results').insert(test);

    if (error) {
      alert('❌ DB Error: ' + error.message);
      console.error(error);
    } else {
      alert('✅ Test OK! Problem is in TournamentImportV2');
      await fetchData();
    }
  };

  useEffect(() => {
    fetchData();
    fetchCalendarPDF();
    fetchDirectivePDF();
  }, []);

  // Calendar PDF Management Functions
  const fetchCalendarPDF = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('tournament-calendars')
        .list('', { limit: 1, search: 'calendario-tornei.pdf' });

      if (error) {
        console.error('Error fetching calendar PDF:', error);
        return;
      }

      if (data && data.length > 0) {
        const { data: { publicUrl } } = supabase.storage
          .from('tournament-calendars')
          .getPublicUrl('calendario-tornei.pdf');
        setCalendarPdfUrl(publicUrl);
      }
    } catch (err) {
      console.error('Error in fetchCalendarPDF:', err);
    }
  };

  const uploadCalendarPDF = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Per favore seleziona un file PDF valido');
      return;
    }

    setUploadingCalendar(true);
    try {
      // Delete existing file if present
      if (calendarPdfUrl) {
        await supabase.storage
          .from('tournament-calendars')
          .remove(['calendario-tornei.pdf']);
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('tournament-calendars')
        .upload('calendario-tornei.pdf', file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tournament-calendars')
        .getPublicUrl('calendario-tornei.pdf');

      setCalendarPdfUrl(publicUrl);
      setShowCalendarUpload(false);
      alert('Calendario caricato con successo!');
    } catch (err) {
      console.error('Error uploading calendar PDF:', err);
      alert('Errore durante il caricamento del PDF');
    } finally {
      setUploadingCalendar(false);
    }
  };

  const deleteCalendarPDF = async () => {
    if (!confirm('Sei sicuro di voler eliminare il calendario?')) return;

    setUploadingCalendar(true);
    try {
      const { error } = await supabase.storage
        .from('tournament-calendars')
        .remove(['calendario-tornei.pdf']);

      if (error) throw error;

      setCalendarPdfUrl(null);
      setShowCalendarUpload(false);
      alert('Calendario eliminato con successo!');
    } catch (err) {
      console.error('Error deleting calendar PDF:', err);
      alert('Errore durante l\'eliminazione del PDF');
    } finally {
      setUploadingCalendar(false);
    }
  };

  // Directive PDF Management Functions
  const fetchDirectivePDF = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('board-members')
        .list('', { limit: 1, search: 'direttivo.pdf' });

      if (error) {
        console.error('Error fetching directive PDF:', error);
        return;
      }

      if (data && data.length > 0) {
        const { data: { publicUrl } } = supabase.storage
          .from('board-members')
          .getPublicUrl('direttivo.pdf');
        setDirectivePdfUrl(publicUrl);
      }
    } catch (err) {
      console.error('Error in fetchDirectivePDF:', err);
    }
  };

  const uploadDirectivePDF = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Per favore seleziona un file PDF valido');
      return;
    }

    setUploadingDirective(true);
    try {
      // Delete existing file if present
      if (directivePdfUrl) {
        await supabase.storage
          .from('board-members')
          .remove(['direttivo.pdf']);
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('board-members')
        .upload('direttivo.pdf', file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('board-members')
        .getPublicUrl('direttivo.pdf');

      setDirectivePdfUrl(publicUrl);
      setShowDirectiveUpload(false);
      alert('Direttivo caricato con successo!');
    } catch (err) {
      console.error('Error uploading directive PDF:', err);
      alert('Errore durante il caricamento del PDF');
    } finally {
      setUploadingDirective(false);
    }
  };

  const deleteDirectivePDF = async () => {
    if (!confirm('Sei sicuro di voler eliminare il direttivo?')) return;

    setUploadingDirective(true);
    try {
      const { error } = await supabase.storage
        .from('board-members')
        .remove(['direttivo.pdf']);

      if (error) throw error;

      setDirectivePdfUrl(null);
      setShowDirectiveUpload(false);
      alert('Direttivo eliminato con successo!');
    } catch (err) {
      console.error('Error deleting directive PDF:', err);
      alert('Errore durante l\'eliminazione del PDF');
    } finally {
      setUploadingDirective(false);
    }
  };

  // Archiving / Season Logic
  const availableYears = useMemo(() => {
    const years = new Set();
    tournaments.forEach(t => {
      if (t.data_inizio) years.add(new Date(t.data_inizio).getFullYear().toString());
    });
    transactions.forEach(t => {
      if (t.data) years.add(new Date(t.data).getFullYear().toString());
    });
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => b - a);
  }, [tournaments, transactions]);

  const filteredTournaments = useMemo(() => {
    if (selectedYear === 'Tutte') return tournaments;
    return tournaments.filter(t => t.data_inizio && new Date(t.data_inizio).getFullYear().toString() === selectedYear);
  }, [tournaments, selectedYear]);

  const filteredResults = useMemo(() => {
    if (selectedYear === 'Tutte') return results;
    const tIds = new Set(filteredTournaments.map(t => t.id));
    return results.filter(r => tIds.has(r.id_torneo));
  }, [results, filteredTournaments, selectedYear]);

  const filteredTransactions = useMemo(() => {
    if (selectedYear === 'Tutte') return transactions;
    return transactions.filter(t => t.data && new Date(t.data).getFullYear().toString() === selectedYear);
  }, [transactions, selectedYear]);

  // Dashboard Alerts Logic (Certificates)
  const expiringCertificates = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return players.filter(p => {
      if (!p.data_scadenza_medica) return false;
      const expiry = new Date(p.data_scadenza_medica);
      return expiry >= today && expiry <= thirtyDaysFromNow;
    });
  }, [players]);

  // Accounting Logic
  const balance = useMemo(() => {
    const income = filteredTransactions.filter(t => t.tipo === 'entrate').reduce((sum, t) => sum + t.importo, 0);
    const expenses = filteredTransactions.filter(t => t.tipo === 'uscite').reduce((sum, t) => sum + t.importo, 0);
    return { income, expenses, total: income - expenses };
  }, [filteredTransactions]);

  // Rankings Logic
  const playersWithStats = useMemo(() => {
    return players.map(p => {
      const pResults = filteredResults.filter(r => r.id_giocatore === p.id);
      const totalPins = pResults.reduce((sum, r) => sum + r.birilli, 0);
      const totalGames = pResults.reduce((sum, r) => sum + r.partite, 0);
      const totalTournaments = new Set(pResults.map(r => r.id_torneo)).size;
      return {
        ...p,
        media: totalGames > 0 ? (totalPins / totalGames).toFixed(2) : '0.00',
        totaleBirilli: totalPins,
        totalePartite: totalGames,
        totaleTornei: totalTournaments
      };
    }).sort((a, b) => {
      const mediaA = parseFloat(a.media);
      const mediaB = parseFloat(b.media);
      if (mediaB !== mediaA) return mediaB - mediaA;
      return b.totaleBirilli - a.totaleBirilli;
    });
  }, [players, filteredResults]);

  // Dashboard Stats - Last 2 Tournaments
  const recentTournamentsStats = useMemo(() => {
    const sortedT = [...filteredTournaments].sort((a, b) => new Date(b.data_inizio) - new Date(a.data_inizio));
    const lastTwo = sortedT.slice(0, 2);

    return lastTwo.map(t => {
      const tResults = results
        .filter(r => r.id_torneo === t.id)
        .map(r => {
          const player = players.find(p => p.id === r.id_giocatore);
          return { ...r, player };
        })
        .filter(r => r.player)
        .sort((a, b) => {
          const posA = a.posizione || 999;
          const posB = b.posizione || 999;
          if (posA !== posB) return posA - posB;
          return (b.birilli || 0) - (a.birilli || 0);
        });

      // Group by Rank (posizione)
      const groups = [];
      tResults.forEach(res => {
        const lastGroup = groups[groups.length - 1];
        // Raggruppiamo se hanno la stessa posizione. 
        // Se uno ha il totale_squadra e l'altro no (0), li uniamo comunque prendendo il valore > 0.
        if (lastGroup && lastGroup.posizione === res.posizione) {
          lastGroup.members.push(res);
          if (res.totale_squadra > 0 && lastGroup.totale_squadra === 0) {
            lastGroup.totale_squadra = res.totale_squadra;
          }
        } else {
          groups.push({
            posizione: res.posizione,
            totale_squadra: res.totale_squadra || 0,
            members: [res]
          });
        }
      });

      return { ...t, topGroups: groups.slice(0, 5) }; // Top 5 Groups
    });
  }, [tournaments, results, players]);

  const selectedTournamentGroups = useMemo(() => {
    if (!selectedTournament) return [];

    const tResults = results
      .filter(r => r.id_torneo === selectedTournament.id)
      .map(r => {
        const player = players.find(p => p.id === r.id_giocatore);
        return { ...r, player };
      })
      .filter(r => r.player)
      .sort((a, b) => {
        const posA = a.posizione || 999;
        const posB = b.posizione || 999;
        if (posA !== posB) return posA - posB;
        return (b.birilli || 0) - (a.birilli || 0);
      });

    const groups = [];
    tResults.forEach(res => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.posizione === res.posizione) {
        lastGroup.members.push(res);
        if (res.totale_squadra > 0 && lastGroup.totale_squadra === 0) {
          lastGroup.totale_squadra = res.totale_squadra;
        }
      } else {
        groups.push({
          posizione: res.posizione,
          totale_squadra: res.totale_squadra || 0,
          members: [res]
        });
      }
    });

    const search = searchTournamentResults.toLowerCase();
    if (!search) return groups;

    return groups.filter(g =>
      g.members.some(m =>
        m.player.nome.toLowerCase().includes(search) ||
        m.player.cognome.toLowerCase().includes(search)
      )
    );
  }, [selectedTournament, results, players, searchTournamentResults]);

  // UNIVERSAL CATEGORY / GROUPING LOGIC (Rules Engine)
  const categorizedResults = useMemo(() => {
    if (!selectedTournament) return [];

    const tournamentResults = results.filter(r => r.id_torneo === selectedTournament.id);
    const type = selectedTournament.tipo || 'Singolo';

    // 1. Group by Position first to find all available Team Totals per rank
    const rankToTotals = {};
    tournamentResults.forEach(r => {
      if (r.totale_squadra > 0) {
        if (!rankToTotals[r.posizione]) rankToTotals[r.posizione] = new Set();
        rankToTotals[r.posizione].add(r.totale_squadra);
      }
    });

    // 2. GROUP BY SECTION & TEAM
    const sectionsMap = new Map();

    tournamentResults.forEach(r => {
      const player = players.find(p => p.id === r.id_giocatore);
      if (!player) return;

      // Determine Section Name
      let sectionName = r.categoria_risultato || null;

      // Fallback logic for existing data if no categoria_risultato is set
      if (!sectionName) {
        if (type === 'Tris') {
          const isEcc = ['M/A', 'M/B'].includes(player.categoria);
          const isFem = player.categoria && player.categoria.startsWith('F/');
          if (isFem) sectionName = 'TRIS FEMMINILE';
          else sectionName = isEcc ? 'TRIS ECCELLENZA (M/A - M/B)' : 'TRIS CADETTI (M/C - M/D)';
        } else if (type === 'Squadra') {
          const isEcc = ['M/A', 'M/B', 'F/A', 'F/B'].includes(player.categoria);
          sectionName = isEcc ? 'GIRONE ECCELLENZA (MISTO)' : 'GIRONE CADETTI (MISTO)';
        } else if (type === 'Doppio') {
          const isFem = player.categoria && player.categoria.startsWith('F/');
          const isEcc = ['M/A', 'M/B', 'F/A', 'F/B'].includes(player.categoria);
          if (isFem) sectionName = isEcc ? 'DOPPIO FEMMINILE ECCELLENZA' : 'DOPPIO FEMMINILE CADETTI';
          else sectionName = isEcc ? 'DOPPIO MASCHILE ECCELLENZA' : 'DOPPIO MASCHILE CADETTI';
        } else {
          sectionName = 'CLASSIFICA GENERALE';
        }
      }

      if (!sectionsMap.has(sectionName)) {
        sectionsMap.set(sectionName, new Map());
      }

      const teamsMap = sectionsMap.get(sectionName);

      // Group Key within section: Position + Total
      let effectiveTotal = r.totale_squadra || 0;
      if (effectiveTotal === 0 && rankToTotals[r.posizione]?.size === 1) {
        effectiveTotal = Array.from(rankToTotals[r.posizione])[0];
      }

      const key = `${r.posizione}-${effectiveTotal}`;
      if (!teamsMap.has(key)) {
        teamsMap.set(key, {
          posizione: r.posizione,
          totale_squadra: effectiveTotal,
          members: []
        });
      }
      const group = teamsMap.get(key);
      group.members.push({ ...r, player });

      if (r.totale_squadra > group.totale_squadra) {
        group.totale_squadra = r.totale_squadra;
      }
    });

    // 3. Convert to Array of Sections for Rendering
    const sectionOrder = [
      'TRIS ECCELLENZA', 'GIRONE ECCELLENZA', 'DOPPIO MASCHILE ECCELLENZA', 'ECCELLENZA',
      'TRIS CADETTI', 'GIRONE CADETTI', 'DOPPIO MASCHILE CADETTI', 'CADETTI',
      'DOPPIO FEMMINILE ECCELLENZA', 'DOPPIO FEMMINILE CADETTI', 'TRIS FEMMINILE', 'FEMMINILE', 'FEMMINILE UNICA',
      'CLASSIFICA GENERALE'
    ];

    const sortedSectionNames = Array.from(sectionsMap.keys()).sort((a, b) => {
      const idxA = sectionOrder.findIndex(s => a.toUpperCase().includes(s.toUpperCase()));
      const idxB = sectionOrder.findIndex(s => b.toUpperCase().includes(s.toUpperCase()));
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedSectionNames.map(name => {
      const teams = Array.from(sectionsMap.get(name).values()).sort((a, b) => a.posizione - b.posizione);
      let color = 'text-blue-400', border = 'border-blue-500/20', bg = 'bg-blue-500/5';
      const n = name.toUpperCase();
      if (n.includes('ECCELLENZA')) { color = 'text-yellow-400'; border = 'border-yellow-500/20'; bg = 'bg-yellow-500/5'; }
      else if (n.includes('FEMMINILE')) { color = 'text-pink-400'; border = 'border-pink-500/20'; bg = 'bg-pink-500/5'; }
      else if (n.includes('CADETTI')) { color = 'text-blue-400'; border = 'border-blue-500/20'; bg = 'bg-blue-500/5'; }

      return { title: name.toUpperCase(), data: teams, color, border, bg };
    });
  }, [selectedTournament, results, players]);

  // Dashboard Stats - Categories

  // Dashboard Stats - Categories
  const categoryStats = useMemo(() => {
    const existingCategories = [...new Set(players.map(p => p.categoria))].filter(Boolean).sort();
    return existingCategories.map(cat => ({
      name: cat,
      count: players.filter(p => p.categoria === cat).length
    }));
  }, [players]);

  // Handlers
  const handleSavePlayer = async (formData) => {
    // Rimuoviamo i campi calcolati (media, totaleBirilli, etc.) che non esistono nel database
    const { media, totaleBirilli, totalePartite, totaleTornei, ...dbData } = formData;

    const cleanedData = {
      ...dbData,
      data_scadenza_medica: dbData.data_scadenza_medica === '' ? null : dbData.data_scadenza_medica
    };

    const { error } = editingPlayer
      ? await supabase.from('players').update(cleanedData).eq('id', editingPlayer.id)
      : await supabase.from('players').insert([cleanedData]);
    if (error) alert(error.message);
    else { fetchData(); setShowPlayerForm(false); setEditingPlayer(null); }
  };

  const handleSaveTournament = async (formData) => {
    // Clean dates to avoid "invalid input syntax for type date: \"\""
    const cleanedData = {
      ...formData,
      data_inizio: formData.data_inizio === '' ? null : formData.data_inizio,
      data_fine: formData.data_fine === '' ? null : formData.data_fine
    };

    const { error } = editingTournament
      ? await supabase.from('tournaments').update(cleanedData).eq('id', editingTournament.id)
      : await supabase.from('tournaments').insert([cleanedData]);
    if (error) alert(error.message);
    else { fetchData(); setShowTournamentForm(false); setEditingTournament(null); }
  };

  const handleSaveResult = async (formData) => {
    const { error } = editingResult
      ? await supabase.from('results').update(formData).eq('id', editingResult.id)
      : await supabase.from('results').insert([formData]);
    if (error) alert(error.message);
    else { fetchData(); setShowResultForm(false); setEditingResult(null); }
  };

  const handleSaveTransaction = async (formData) => {
    const { error } = editingTransaction
      ? await supabase.from('transactions').update(formData).eq('id', editingTransaction.id)
      : await supabase.from('transactions').insert([formData]);
    if (error) alert(error.message);
    else { fetchData(); setShowTransactionForm(false); setEditingTransaction(null); }
  };

  const handleSavePlayerTransaction = async (formData) => {
    const { error } = await supabase.from('transactions').insert([formData]);
    if (error) alert(error.message);
    else fetchData();
  };

  const handleDeletePlayer = async (id) => {
    if (!window.confirm('Eliminare definitivamente questo giocatore?')) return;
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  const handleDeleteTournament = async (id) => {
    if (!window.confirm('Eliminare definitivamente questo torneo?')) return;
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  const handleDeleteResult = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Eliminare questo punteggio?')) return;
    const { error } = await supabase.from('results').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Eliminare definitivamente questa operazione?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  const handleExportData = async () => {
    try {
      const [p, t, r, tr] = await Promise.all([
        supabase.from('players').select('*'),
        supabase.from('tournaments').select('*'),
        supabase.from('results').select('*'),
        supabase.from('transactions').select('*')
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        players: p.data,
        tournaments: t.data,
        results: r.data,
        transactions: tr.data
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AllStarBowling_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Errore durante il backup: ' + error.message);
    }
  };

  const handleLogin = async () => {
    const userInput = prompt('Inserisci Nome Utente Admin:'.replace(':', ' (o Email):'));
    if (!userInput) return;
    const password = prompt('Inserisci Password Admin:');
    if (!password) return;

    // Support both Legacy Email and New Username Login
    const email = userInput.includes('@') ? userInput.trim() : `${userInput.trim()}@allstar.team`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('Errore di accesso: ' + error.message);
      return;
    }

    // Check Whitelist (app_admins)
    if (data.user) {
      // BOOTSTRAP CHECK: If app_admins is empty, allow login to auto-register current user
      const { count } = await supabase.from('app_admins').select('*', { count: 'exact', head: true });

      if (count > 0) {
        const { data: adminEntry } = await supabase.from('app_admins').select('id').eq('id', data.user.id).single();
        if (!adminEntry) {
          await supabase.auth.signOut();
          alert('ACCESSO NEGATO: Questo utente non è nella lista degli amministratori autorizzati.');
        }
      }
    }
  };

  const handleDeleteAdmin = async (id, username) => {
    if (!confirm(`ATTENZIONE: Stai per eliminare DEFINITIVAMENTE l'admin "${username}".\n\nQuesta azione libererà il nome utente per un nuovo utilizzo.\n\nSei sicuro?`)) return;

    try {
      setLoading(true);
      // HARD DELETE via RPC (removes from both app_admins and auth.users)
      const { error } = await supabase.rpc('delete_admin_user', { target_user_id: id });

      if (error) throw error;

      alert(`Admin "${username}" eliminato definitivamente.`);
      // Refresh list
      const { data: al } = await supabase.from('app_admins').select('*').order('created_at', { ascending: false });
      if (al) setAdminsList(al);
    } catch (error) {
      alert('Errore eliminazione admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdmin = async (id, currentUsername) => {
    const newUsername = prompt(`Inserisci il nuovo nome utente per "${currentUsername}":`, currentUsername);
    if (!newUsername || newUsername === currentUsername) return;

    if (newUsername.includes('@') || newUsername.includes(' ')) {
      alert('Il nome utente non può contenere spazi o il simbolo @');
      return;
    }

    try {
      setLoading(true);
      // Call RPC to update both public list and auth email
      const { error } = await supabase.rpc('update_admin_username', {
        target_user_id: id,
        new_username: newUsername
      });

      if (error) throw error;

      alert(`Admin rinominato con successo in "${newUsername}".`);
      // Refresh list
      const { data: al } = await supabase.from('app_admins').select('*').order('created_at', { ascending: false });
      if (al) setAdminsList(al);
    } catch (error) {
      alert('Errore modifica admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    // Basic validation for username
    if (username.includes('@') || username.includes(' ')) {
      alert('Il nome utente non può contenere spazi o il simbolo @');
      return;
    }

    if (!confirm(`Vuoi creare un nuovo admin con utente: ${username}?`)) return;

    const email = `${username}@allstar.team`;

    try {
      setLoading(true);
      // Create a temporary client to avoid overwriting the current session
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false // Don't persist this session
          }
        }
      );

      const { data, error } = await tempSupabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {


        // Add to public admin list
        const { error: dbError } = await supabase.from('app_admins').insert({
          id: data.user.id,
          username: username
        });

        if (dbError) {
          console.error('Error adding to admin list:', dbError);
          alert('Attenzione: Utente auth creato ma errore nell\'aggiunta alla lista: ' + dbError.message);
        } else {
          // Success
        }

        // Refresh list
        const { data: al, error: refreshError } = await supabase.from('app_admins').select('*').order('created_at', { ascending: false });
        if (refreshError) alert('Refresh Error: ' + refreshError.message);
        if (al) {
          setAdminsList(al);
        }
      }

      alert(`Admin "${username}" creato con successo!`);
      e.target.reset();
    } catch (error) {
      alert('Errore creazione admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /*
    const handleCreateAdmin = async (e) => {
      ...
    };
  */

  return (
    <div className="min-h-screen bg-background text-gray-200 md:flex">
      {/* Sidebar Navigation - Hidden when in detail view on mobile */}
      {!selectedPlayerForDetail && (
        <nav className="fixed bottom-0 left-0 w-full md:relative md:w-64 md:min-h-screen p-0 md:p-4 bg-background z-50 flex flex-col md:justify-start md:pt-80">
          <div className="rounded-3xl neumorphic-out flex flex-col md:p-6 p-2 justify-around md:justify-start gap-6">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'players', icon: Users, label: 'Giocatori' },
              { id: 'tournaments', icon: Trophy, label: 'Tornei' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col md:flex-row items-center gap-3 p-4 rounded-xl transition-all ${activeTab === tab.id ? 'neumorphic-in text-blue-400' : 'neumorphic-btn'}`}>
                <tab.icon className="w-6 h-6" /> <span className="text-xs md:text-base font-medium">{tab.label}</span>
              </button>
            ))}

            {isAdmin && (
              <>
                <button onClick={() => setActiveTab('accounting')} className={`flex flex-col md:flex-row items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'accounting' ? 'neumorphic-in text-blue-400' : 'neumorphic-btn'}`}>
                  <Wallet className="w-6 h-6" /> <span className="text-xs md:text-base font-medium">Contabilità</span>
                </button>
                <button onClick={() => setActiveTab('admins')} className={`flex flex-col md:flex-row items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'admins' ? 'neumorphic-in text-blue-400' : 'neumorphic-btn'}`}>
                  <ShieldCheck className="w-6 h-6" /> <span className="text-xs md:text-base font-medium">Gestione Admin</span>
                </button>
                <button onClick={handleExportData} className="flex flex-col md:flex-row items-center gap-3 p-4 rounded-xl neumorphic-btn hover:text-green-400 transition-all mt-4">
                  <Download className="w-6 h-6" /> <span className="text-xs md:text-base font-medium">Backup Dati</span>
                </button>
              </>
            )}

            {/* TEAM LOGO */}
            <div className="flex-1 hidden md:flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity py-6">
              <img src="/team-logo.png" alt="All Star Team Logo" className="w-full max-w-[180px] object-contain mx-auto" />
            </div>

            <div className="md:mt-0">
              {isAdmin ? (
                <button onClick={() => supabase.auth.signOut()} className="w-full flex flex-col md:flex-row items-center gap-3 p-4 rounded-xl neumorphic-btn text-red-400">
                  <LogOut className="w-6 h-6" /> <span className="text-xs md:text-base">Logout</span>
                </button>
              ) : (
                <button onClick={handleLogin} className="w-full flex flex-col md:flex-row items-center gap-3 p-4 rounded-xl neumorphic-btn text-green-400">
                  <LogIn className="w-6 h-6" /> <span className="text-xs md:text-base text-center">Admin Login</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      <main className={`flex-1 ${selectedPlayerForDetail ? 'p-4 md:p-10' : 'pb-32 md:pb-32 p-0 md:pt-6 md:px-6'} min-w-0 tracking-tight`}>
        {selectedPlayerForDetail && (
          <PlayerDetail
            player={selectedPlayerForDetail}
            results={filteredResults}
            tournaments={filteredTournaments}
            onBack={() => setSelectedPlayerForDetail(null)}
            isAdmin={isAdmin}
            onDeleteResult={handleDeleteResult}
            onEditResult={(r) => { setEditingResult(r); setShowResultForm(true); }}
            onEditPlayer={(p) => { setEditingPlayer(p); setShowPlayerForm(true); }}
          />
        )}

        {!selectedPlayerForDetail && loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-400"></div>
          </div>
        )}

        {!selectedPlayerForDetail && !loading && (
          <>

            {/* Header with Season Selector */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 px-4 md:px-6 mt-6">
              <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                  {activeTab === 'dashboard' ? 'Dashboard' :
                    activeTab === 'players' ? 'Giocatori' :

                      activeTab === 'tournaments' ? 'Tornei' :
                        activeTab === 'admins' ? 'Gestione Admin' : 'Contabilità'}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                    {selectedYear === 'Tutte' ? 'Archivio Storico Completo' : `Visualizzazione Stagione ${selectedYear}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-[1.5rem] bg-white/5 border border-white/5 backdrop-blur-xl shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                {['Tutte', ...availableYears].slice(0, 6).map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${selectedYear === year
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 translate-y-[-1px]'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                  >
                    {year}
                  </button>
                ))}

              </div>
            </div>

            {/* Admin Management Tab */}
            {activeTab === 'admins' && isAdmin && (
              <div className="max-w-2xl mx-auto">
                <div className="p-8 rounded-[2rem] glass-card border border-white/5 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/0 via-purple-500/40 to-purple-500/0 opacity-50"></div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Crea Nuovo Amministratore</h2>
                      <p className="text-gray-400 text-sm">Aggiungi un nuovo utente con permessi di amministrazione</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateAdmin} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nome Utente</label>
                      <input
                        type="text"
                        name="username"
                        required
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-gray-600"
                        placeholder="nomeutente"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                      <input
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-gray-600"
                        placeholder="••••••••"
                      />
                      <p className="text-[10px] text-gray-500 pl-1">Minimo 6 caratteri</p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest transition-all transform hover:scale-[1.02] shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Creazione in corso...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>Crea Admin</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-12">
                  <h3 className="text-xl font-bold text-white mb-4 px-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    Admin Attivi ({adminsList.length})
                  </h3>
                  <div className="rounded-2xl neumorphic-out overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-[#050505] text-gray-400 text-xs uppercase tracking-widest border-b border-white/5">
                        <tr>
                          <th className="p-4 pl-6">Utente</th>
                          <th className="p-4 hidden md:table-cell">Data Creazione</th>
                          <th className="p-4 text-right pr-6">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-[#0a0a0a]">
                        {adminsList.length > 0 ? (
                          adminsList.map(admin => (
                            <tr key={admin.id} className="hover:bg-white/5 transition-colors group">
                              <td className="p-4 pl-6 font-bold text-white">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                    <ShieldCheck className="w-4 h-4" />
                                  </div>
                                  <span className="font-mono text-sm tracking-wide">{admin.username}</span>
                                </div>
                              </td>
                              <td className="p-4 text-gray-400 text-xs hidden md:table-cell font-mono">
                                {new Date(admin.created_at).toLocaleDateString()} <span className="text-gray-600 ml-1">{new Date(admin.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <div className="flex justify-end items-center gap-2">
                                  <button
                                    onClick={() => handleEditAdmin(admin.id, admin.username)}
                                    className="text-gray-500 hover:text-blue-400 p-2 hover:bg-blue-500/10 rounded-lg transition-all"
                                    title="Modifica Nome Utente"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                                    className="text-gray-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Elimina Definitivamente"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="p-8 text-center text-gray-500 italic text-sm">
                              Nessun admin trovato nella lista pubblica.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}



            <div className="animate-fadeIn px-4 md:px-6">
              {/* Dashboard */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8 pt-0">
                  <div className="mb-12">
                    <div className="p-3 sm:p-4 md:p-5 rounded-[2rem] bg-blue-500/5 border border-blue-500/20 shadow-2xl backdrop-blur-sm">
                      <h2 className="text-base sm:text-lg font-black text-white tracking-widest uppercase mb-3 drop-shadow-md text-center">
                        {selectedYear === 'Tutte' ? `Anagrafica Generale - ${players.length} ISCRITTI` : `Atleti Attivi nel ${selectedYear} - ${playersWithStats.filter(p => p.totalePartite > 0).length} SOCI`}
                      </h2>
                      <div className="flex flex-row flex-nowrap gap-1.5 sm:gap-3 justify-between items-stretch">
                        {categoryStats.map(cat => (
                          <div key={cat.name} className="flex-1 min-w-0 h-16 sm:h-20 md:h-22 rounded-lg sm:rounded-xl glass-card flex flex-col items-center justify-center border border-white/10 group shadow-xl">
                            <span className="text-[8px] sm:text-[9px] md:text-xs font-black text-blue-400 uppercase tracking-tighter mb-0.5 truncate w-full text-center px-1">{cat.name}</span>
                            <span className="text-base sm:text-lg md:text-2xl font-black text-white leading-none">{cat.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>


                  <div className="p-4 md:p-6 rounded-[2rem] glass-card border border-white/5 relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <h2 className="text-xl font-black text-blue-400 uppercase tracking-tight mb-5 text-center">Ultimi Tornei Giocati</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* Tournaments Section - 2 columns */}
                      <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {recentTournamentsStats.map(t => (
                          <div key={t.id} className="p-4 rounded-[2rem] glass-card relative group min-w-0">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-base font-black text-white tracking-tight group-hover:text-blue-400 transition-colors uppercase text-left">{t.nome}</h3>
                              <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
                                {new Date(t.data_inizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="px-2 mb-3 flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-1.5">
                              <div className="flex gap-4 items-center">
                                <span className="w-10 text-center">Pos.</span>
                                <span className="w-56 text-left">Giocatore</span>
                              </div>
                              <div className="flex shrink-0 pr-8">
                                <span className="w-16 text-center">Birilli</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {t.topGroups.map((group, gIdx) => (
                                <div key={gIdx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group/row">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner transition-transform group-hover/row:scale-110 ${group.posizione === 1 ? 'bg-yellow-500/20 text-yellow-500 shadow-yellow-500/10' :
                                        group.posizione === 2 ? 'bg-slate-400/20 text-slate-300' :
                                          group.posizione === 3 ? 'bg-orange-600/20 text-orange-500' :
                                            'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        {group.posizione}
                                      </div>
                                      {group.totale_squadra > 0 && (
                                        <div className="flex items-center gap-3 bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20">
                                          <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Totale Squadra:</span>
                                          <span className="text-base font-black text-white uppercase tracking-widest">{group.totale_squadra}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    {group.members.map((r, mIdx) => (
                                      <div key={mIdx} className="flex items-center justify-between pl-14 pr-8">
                                        <span className="font-black text-gray-100 text-base tracking-tight whitespace-nowrap w-56 text-left shrink-0">{r.player.nome} {r.player.cognome}</span>
                                        <div className="flex items-center shrink-0">
                                          <div className="flex flex-col items-center gap-0.5 w-16">
                                            <span className="text-base font-black text-blue-400 leading-none">{r.birilli}</span>
                                            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">birilli</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {t.topGroups.length === 0 && (
                                <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                  <p className="text-gray-500 italic text-xs">In attesa di risultati...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Links Section - 1 column */}
                      <div className="lg:col-span-1">
                        <div className="p-5 rounded-[2.5rem] glass-card relative group h-full border border-green-500/20 overflow-hidden">
                          {/* Background Glow Effect */}
                          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/0 via-green-500/40 to-green-500/0 opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-green-500/20">
                              <ExternalLink className="w-4 h-4 text-green-400" />
                            </div>
                            <h3 className="text-base font-black text-green-400 tracking-tight uppercase">Link Utili</h3>
                          </div>

                          <div className="space-y-3">
                            <a href="https://www.fisb.it" target="_blank" rel="noopener noreferrer" className="block p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-green-500/10 hover:border-green-500/30 transition-all duration-300 group/link relative overflow-hidden">
                              <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center group-hover/link:bg-green-500/20 transition-all duration-300 border border-white/5 group-hover/link:border-green-500/30">
                                    <img src="https://www.google.com/s2/favicons?domain=fisb.it&sz=64" alt="FISB" className="w-7 h-7 object-contain filter group-hover/link:brightness-125" />
                                  </div>
                                  <div>
                                    <span className="text-base font-bold text-gray-200 group-hover/link:text-green-400 transition-colors block leading-tight">Sito FISB</span>
                                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Federazione Italiana</span>
                                  </div>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover/link:bg-green-500/20 transition-all">
                                  <span className="text-sm text-gray-500 group-hover/link:text-green-400 group-hover/link:translate-x-0.5 transition-all">→</span>
                                </div>
                              </div>
                            </a>

                            <div className="relative">
                              <a
                                href={calendarPdfUrl || "javascript:void(0)"}
                                target={calendarPdfUrl ? "_blank" : "_self"}
                                rel={calendarPdfUrl ? "noopener noreferrer" : ""}
                                className="block p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-green-500/10 hover:border-green-500/30 transition-all duration-300 group/link"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center group-hover/link:bg-green-500/20 transition-colors">
                                      <Calendar className="w-6 h-6 text-gray-400 group-hover/link:text-green-400" />
                                    </div>
                                    <div>
                                      <span className="text-base font-bold text-gray-200 group-hover/link:text-green-400 transition-colors block leading-tight">Calendario</span>
                                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Prossimi Tornei</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {calendarPdfUrl && <span className="text-sm text-gray-600 group-hover/link:translate-x-1 transition-transform">→</span>}
                                    {isAdmin && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setShowCalendarUpload(true);
                                        }}
                                        className="p-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors border border-green-500/20"
                                        title="Gestisci calendario PDF"
                                      >
                                        <Upload className="w-4 h-4 text-green-400" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </a>
                            </div>

                            <a href="https://www.fisb.it/repository/Modulistica/Regolamento-Tecnico-Sportivo-2025-2026/" target="_blank" rel="noopener noreferrer" className="block p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-green-500/10 hover:border-green-500/30 transition-all duration-300 group/link">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center group-hover/link:bg-green-400/20 transition-colors">
                                    <FileText className="w-6 h-6 text-gray-400 group-hover/link:text-green-400" />
                                  </div>
                                  <div>
                                    <span className="text-base font-bold text-gray-200 group-hover/link:text-green-400 transition-colors block leading-tight">Regolamenti</span>
                                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Norme Tecniche</span>
                                  </div>
                                </div>
                                <span className="text-sm text-gray-600 group-hover/link:translate-x-1 transition-transform">→</span>
                              </div>
                            </a>

                            <div className="relative">
                              <a
                                href={directivePdfUrl || "javascript:void(0)"}
                                target={directivePdfUrl ? "_blank" : "_self"}
                                rel={directivePdfUrl ? "noopener noreferrer" : ""}
                                className="block p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-green-500/10 hover:border-green-500/30 transition-all duration-300 group/link"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center group-hover/link:bg-green-500/20 transition-colors">
                                      <ShieldCheck className="w-6 h-6 text-gray-400 group-hover/link:text-green-400" />
                                    </div>
                                    <div>
                                      <span className="text-base font-bold text-gray-200 group-hover/link:text-green-400 transition-colors block leading-tight">Direttivo</span>
                                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Organigramma</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {directivePdfUrl && <span className="text-sm text-gray-600 group-hover/link:translate-x-1 transition-transform">→</span>}
                                    {isAdmin && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setShowDirectiveUpload(true);
                                        }}
                                        className="p-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors border border-green-500/20 shadow-lg shadow-green-500/5"
                                        title="Gestisci direttivo PDF"
                                      >
                                        <Upload className="w-4.5 h-4.5 text-green-400" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </a>
                            </div>

                            {/* Admin only WhatsApp Broadcast */}
                            {isAdmin && (
                              <button
                                onClick={() => setShowBroadcastModal(true)}
                                className="w-full text-left block p-4 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 transition-all duration-300 group/link"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center group-hover/link:bg-green-500/30 transition-colors border border-green-500/20">
                                      <MessageCircle className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                      <span className="text-base font-bold text-green-400 block leading-tight">Messaggio a Tutti</span>
                                      <span className="text-[11px] text-green-500/60 font-bold uppercase tracking-widest mt-0.5">Invio WhatsApp</span>
                                    </div>
                                  </div>
                                  <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center group-hover/link:bg-green-500/20 transition-all">
                                    <span className="text-sm text-green-400 group-hover/link:translate-x-0.5 transition-all">→</span>
                                  </div>
                                </div>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recent Tournaments Stats Grid continues... */}
                    </div>
                  </div>


                  {expiringCertificates.length > 0 && (
                    <div className="mb-8 p-7 rounded-[2.5rem] bg-red-500/5 border border-red-500/10 backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/40 to-red-500/0 opacity-50"></div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-red-500/20">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <h3 className="text-lg font-black text-red-400 uppercase tracking-wider">Certificati in Scadenza</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {expiringCertificates.map(p => {
                          const expiryDate = new Date(p.data_scadenza_medica).toLocaleDateString('it-IT');
                          const message = `Ciao ${p.nome}, il giorno ${expiryDate} ti scadrà il certificato medico. Per poter continuare la tua attività sportiva devi avere un certificato medico in corso di validità. Ti prego di prendere un appuntamento per aggiornare il tuo certificato e di farmelo avere. Grazie per la collaborazione.\n\nIl Presidente\nNedo Splendiani`;
                          const emailSubject = 'Scadenza Certificato Medico';
                          const emailBody = `Ciao ${p.nome},\n\nIl giorno ${expiryDate} ti scadrà il certificato medico. Per poter continuare la tua attività sportiva devi avere un certificato medico in corso di validità.\n\nTi prego di prendere un appuntamento per aggiornare il tuo certificato e di farmelo avere.\n\nGrazie per la collaborazione.\n\nIl Presidente\nNedo Splendiani`;

                          return (
                            <div key={p.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/cert">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="font-bold text-gray-200">{p.nome} {p.cognome}</p>
                                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Scadenza Medica</p>
                                </div>
                                <p className="text-xs font-black text-red-400 bg-red-400/10 px-2 py-1 rounded-lg">{expiryDate}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {p.telefono && (
                                  <a
                                    href={`https://wa.me/39${p.telefono.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-3 py-2.5 rounded-xl glass-btn text-green-400 text-xs font-bold flex items-center justify-center gap-1.5"
                                    title="Invia WhatsApp"
                                  >
                                    WhatsApp
                                  </a>
                                )}
                                {p.email && (
                                  <a
                                    href={`mailto:${p.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                                    className="flex-1 px-3 py-2.5 rounded-xl glass-btn text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5"
                                    title="Invia Email"
                                  >
                                    Email
                                  </a>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={() => { setEditingPlayer(p); setShowPlayerForm(true); }}
                                    className="p-2.5 rounded-xl glass-btn text-gray-400 hover:text-white"
                                    title="Modifica"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Ranking */}


              {/* Players Area */}
              {activeTab === 'players' && (
                <div className="space-y-6 pt-0">
                  <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                    <div className="relative w-full xl:max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cerca atleta..."
                        value={searchPlayers}
                        onChange={(e) => setSearchPlayers(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl neumorphic-in focus:outline-none"
                      />
                    </div>

                    {/* FILTERS BAR */}
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="flex-1 md:flex-none px-5 py-3 rounded-xl neumorphic-btn bg-transparent text-base font-bold text-gray-300 focus:outline-none cursor-pointer"
                      >
                        <option value="Tutte" className="bg-[#1a1b26]">Tutte le Categorie</option>
                        <option value="M/A" className="bg-[#1a1b26]">M/A</option>
                        <option value="M/B" className="bg-[#1a1b26]">M/B</option>
                        <option value="M/C" className="bg-[#1a1b26]">M/C</option>
                        <option value="M/D" className="bg-[#1a1b26]">M/D</option>
                        <option value="M/ES" className="bg-[#1a1b26]">M/ES</option>
                        <option value="F/A" className="bg-[#1a1b26]">F/A</option>
                        <option value="F/B" className="bg-[#1a1b26]">F/B</option>
                        <option value="F/C" className="bg-[#1a1b26]">F/C</option>
                        <option value="F/D" className="bg-[#1a1b26]">F/D</option>
                        <option value="F/ES" className="bg-[#1a1b26]">F/ES</option>
                      </select>

                      <button
                        onClick={() => setFilterSenior(!filterSenior)}
                        className={`flex-1 md:flex-none px-5 py-3 rounded-xl transition-all text-base font-bold flex items-center justify-center gap-2 ${filterSenior
                          ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                          : 'neumorphic-btn text-gray-400 hover:text-yellow-500'
                          }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${filterSenior ? 'bg-yellow-500' : 'bg-gray-600'}`}></span>
                        Senior
                      </button>

                      <button
                        onClick={() => setFilterAziendale(!filterAziendale)}
                        className={`flex-1 md:flex-none px-5 py-3 rounded-xl transition-all text-base font-bold flex items-center justify-center gap-2 ${filterAziendale
                          ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                          : 'neumorphic-btn text-gray-400 hover:text-purple-500'
                          }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${filterAziendale ? 'bg-purple-500' : 'bg-gray-600'}`}></span>
                        Aziendale
                      </button>
                    </div>
                  </div>
                  <div className="p-4 md:p-6 rounded-3xl neumorphic-out overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-gray-400 border-b border-white/5">
                          <th className="pb-4 pl-4 font-medium text-xs md:text-base">Pos.</th>
                          <th className="pb-4 pl-4 font-medium text-xs md:text-base">Atleta</th>
                          <th className="pb-4 font-medium text-xs md:text-base text-center">Tessera</th>
                          <th className="pb-4 font-medium text-xs md:text-base text-center">Cat.</th>
                          <th className="pb-4 font-medium text-xs md:text-base text-center">Tornei</th>
                          <th className="pb-4 font-medium text-xs md:text-base text-center">Birilli</th>
                          <th className="pb-4 font-medium text-xs md:text-base text-center">Media</th>
                          <th className="pb-4 font-medium text-xs md:text-base text-center">Senior</th>
                          <th className="pb-4 font-medium text-xs md:text-base text-center">Aziendale</th>
                          {isAdmin && <th className="pb-4 pr-4 text-right"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {playersWithStats
                          .filter(p => {
                            const search = searchPlayers.toLowerCase();
                            const matchesSearch = (p.nome?.toLowerCase() || '').includes(search) || (p.cognome?.toLowerCase() || '').includes(search);
                            const matchesCategory = filterCategory === 'Tutte' || p.categoria === filterCategory;
                            const matchesSenior = !filterSenior || p.settore_seniores;
                            const matchesAziendale = !filterAziendale || p.settore_aziendale;

                            return matchesSearch && matchesCategory && matchesSenior && matchesAziendale;
                          })
                          .map((p, idx) => (
                            <tr key={p.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedPlayerForDetail(p)}>
                              <td className="py-4 pl-4 font-bold text-gray-500">#{idx + 1}</td>
                              <td className="py-4 pl-4 font-bold">{p.nome} {p.cognome}</td>
                              <td className="py-4 text-center font-mono text-sm text-gray-400">{p.numero_tessera || '-'}</td>
                              <td className="py-4 text-center text-xs font-bold text-blue-400">{p.categoria}</td>
                              <td className="py-4 text-center font-mono">{p.totaleTornei}</td>
                              <td className="py-4 text-center font-mono">{p.totaleBirilli}</td>
                              <td className="py-4 text-center font-black text-blue-400">{p.media}</td>
                              <td className="py-4 text-center">
                                {p.settore_seniores ? <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-lg border border-yellow-500/20">SI</span> : '-'}
                              </td>
                              <td className="py-4 text-center">
                                {p.settore_aziendale ? <span className="text-[10px] bg-purple-500/10 text-purple-500 px-2 py-1 rounded-lg border border-purple-500/20">SI</span> : '-'}
                              </td>
                              {isAdmin && (
                                <td className="py-4 pr-4">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditingPlayer(p); setShowPlayerForm(true); }}
                                      className="p-2 rounded-lg neumorphic-btn text-blue-400 hover:scale-110 transition-transform"
                                      title="Modifica"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeletePlayer(p.id); }}
                                      className="p-2 rounded-lg neumorphic-btn text-red-500 hover:scale-110 transition-transform"
                                      title="Elimina"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        {playersWithStats.filter(p => {
                          const search = searchPlayers.toLowerCase();
                          const matchesSearch = (p.nome?.toLowerCase() || '').includes(search) || (p.cognome?.toLowerCase() || '').includes(search);
                          const matchesCategory = filterCategory === 'Tutte' || p.categoria === filterCategory;
                          const matchesSenior = !filterSenior || p.settore_seniores;
                          const matchesAziendale = !filterAziendale || p.settore_aziendale;

                          return !(matchesSearch && matchesCategory && matchesSenior && matchesAziendale);
                        }).length === 0 && (
                            <tr>
                              <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-gray-500 italic">
                                Nessun atleta trovato {searchPlayers ? 'per questa ricerca' : 'registrato'}.
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tournaments Area */}
              {activeTab === 'tournaments' && (
                selectedTournament ? (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <button
                        onClick={() => { setSelectedTournament(null); setSearchTournamentResults(''); }}
                        className="px-4 py-2 rounded-lg neumorphic-btn text-blue-400 hover:scale-105 transition-transform flex items-center gap-2 w-fit"
                      >
                        ← Torna ai Tornei
                      </button>
                      <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cerca atleta..."
                          value={searchTournamentResults}
                          onChange={(e) => setSearchTournamentResults(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-xl neumorphic-in focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="p-4 md:p-6 rounded-3xl neumorphic-out">
                      <div className="flex items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
                        <h2 className="text-2xl font-black text-blue-400 uppercase tracking-tight whitespace-nowrap shrink-0">{selectedTournament.nome}</h2>
                        <div className="flex items-center gap-6 md:gap-10 text-base font-black text-gray-200 whitespace-nowrap">
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="text-lg">📅</span> {new Date(selectedTournament.data_inizio).toLocaleDateString('it-IT')}
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="text-lg">📍</span> {selectedTournament.sede}
                          </span>
                          <span className="flex items-center gap-2 text-blue-400 bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10 shrink-0">
                            <span className="text-lg">🎳</span> {selectedTournament.numero_partite} PARTITE
                          </span>
                        </div>
                      </div>

                      {/* RESULTS AREA - DYNAMIC CATEGORIZED VIEW */}
                      <div className="space-y-12">
                        {categorizedResults.map((section, idx) => (
                          section.data.length > 0 && (
                            <div key={idx} className={`rounded-3xl p-6 ${section.bg} border ${section.border}`}>
                              <h3 className={`text-2xl font-black ${section.color} uppercase tracking-tight mb-6 flex items-center gap-3`}>
                                <Trophy className="w-6 h-6" /> {section.title}
                              </h3>
                              <div className="space-y-4">
                                {section.data.map((team, i) => (
                                  <div key={i} className="p-4 rounded-2xl bg-black/20 border border-white/5 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group hover:bg-white/5 transition-colors">

                                    {/* LEFT: RANK */}
                                    <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center font-black text-3xl shadow-inner ${team.posizione === 1 ? 'bg-yellow-500 text-black' : team.posizione === 2 ? 'bg-slate-300 text-black' : team.posizione === 3 ? 'bg-orange-600 text-white' : 'bg-white/10 text-white'}`}>
                                      {team.posizione}
                                    </div>

                                    {/* MIDDLE: PLAYERS LIST */}
                                    <div className="flex-1 w-full space-y-3 border-l border-white/5 pl-0 md:pl-6">
                                      {team.members.map((m, mi) => (
                                        <div key={mi} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                          <div className="flex items-center gap-4">
                                            <div className="text-white text-lg md:text-xl font-bold whitespace-nowrap">{m.player.nome} {m.player.cognome}</div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">{m.player.categoria}</span>
                                          </div>
                                          <div className="flex items-center gap-6">
                                            <div className="hidden lg:flex gap-1.5 opacity-40 text-[10px] font-mono">
                                              {(Array.isArray(m.punteggi_partite) ? m.punteggi_partite : (typeof m.punteggi_partite === 'string' ? JSON.parse(m.punteggi_partite) : [])).map((s, si) => (
                                                <span key={si} className="bg-white/5 px-1.5 py-0.5 rounded">{s}</span>
                                              ))}
                                            </div>
                                            <div className="font-mono text-blue-400 font-bold text-lg w-16 text-right leading-none">
                                              {m.birilli} <span className="text-[9px] text-gray-600 font-sans block uppercase">totale</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* RIGHT: TEAM TOTAL */}
                                    {team.totale_squadra > 0 && (
                                      <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-40 border-l border-white/10 pl-0 md:pl-6 gap-1 pt-4 md:pt-0 border-t md:border-t-0">
                                        <span className="text-4xl font-black text-white leading-none tracking-tighter shadow-orange-500/20 drop-shadow-lg">{team.totale_squadra}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Totale Squadra</span>
                                      </div>
                                    )}

                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                        {categorizedResults.every(s => s.data.length === 0) && (
                          <div className="text-center py-20 text-gray-500 italic">
                            <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
                            <p>Nessun risultato categorizzabile trovato.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cerca torneo..."
                        value={searchTournaments}
                        onChange={(e) => setSearchTournaments(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl neumorphic-in focus:outline-none"
                      />
                    </div>
                    <div className="p-4 md:p-6 rounded-3xl neumorphic-out overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-gray-400 border-b border-white/5">
                            <th className="pb-4 pl-4 font-medium text-xs md:text-base">Torneo</th>
                            <th className="pb-4 font-medium text-xs md:text-base text-center">Data</th>
                            <th className="pb-4 font-medium text-xs md:text-base text-center">Sede</th>
                            <th className="pb-4 font-medium text-xs md:text-base text-center">Partite</th>
                            <th className="pb-4 font-medium text-xs md:text-base text-center text-blue-400">PDF</th>
                            {isAdmin && <th className="pb-4 pr-4"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredTournaments
                            .filter(t => t.nome.toLowerCase().includes(searchTournaments.toLowerCase()))
                            .sort((a, b) => new Date(b.data_inizio) - new Date(a.data_inizio)).map(t => (
                              <tr
                                key={t.id}
                                className="group hover:bg-white/5 transition-colors cursor-pointer"
                                onClick={() => setSelectedTournament(t)}
                              >
                                <td className="py-4 pl-4 font-bold">{t.nome}</td>
                                <td className="py-4 text-center font-mono text-xs">
                                  {new Date(t.data_inizio).toLocaleDateString()}
                                </td>
                                <td className="py-4 text-center text-sm text-gray-400">{t.sede}</td>
                                <td className="py-4 text-center font-mono">{t.numero_partite}</td>
                                <td className="py-4 text-center">
                                  {t.locandina_url ? (
                                    <a
                                      href={t.locandina_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-2 inline-block rounded-lg neumorphic-btn text-blue-400 scale-75"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <FileText className="w-4 h-4" />
                                    </a>
                                  ) : '-'}
                                </td>
                                {isAdmin && (
                                  <td className="py-4 pr-4">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setEditingTournament(t); setShowTournamentForm(true); }}
                                        className="p-2 rounded-lg neumorphic-btn text-blue-400 hover:scale-110 transition-transform"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteTournament(t.id); }}
                                        className="p-2 rounded-lg neumorphic-btn text-red-500 hover:scale-110 transition-transform"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          {filteredTournaments.filter(t => t.nome.toLowerCase().includes(searchTournaments.toLowerCase())).length === 0 && (
                            <tr>
                              <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-gray-500 italic">
                                Nessun torneo trovato {searchTournaments ? 'per questa ricerca' : 'registrato'}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}

              {/* Accounting (Admin Only) */}
              {activeTab === 'accounting' && isAdmin && (
                selectedAccountingPlayer ? (
                  <AccountingPlayerDetail
                    player={selectedAccountingPlayer}
                    transactions={transactions}
                    onBack={() => setSelectedAccountingPlayer(null)}
                    onAddTransaction={handleSavePlayerTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cerca atleta..."
                        value={searchAccounting}
                        onChange={(e) => setSearchAccounting(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl neumorphic-in focus:outline-none"
                      />
                    </div>
                    <div className="p-4 md:p-6 rounded-3xl neumorphic-out overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-gray-400 border-b border-white/5">
                            <th className="pb-4 pl-4 font-medium text-xs md:text-base">Atleta</th>
                            <th className="pb-4 font-medium text-xs md:text-base text-right">Saldo</th>
                            <th className="pb-4 pr-4 font-medium text-xs md:text-base text-center">Azioni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {players.filter(p => {
                            const search = searchAccounting.toLowerCase();
                            return p.nome.toLowerCase().includes(search) || p.cognome.toLowerCase().includes(search);
                          }).map(p => {
                            const balance = transactions
                              .filter(t => t.id_giocatore === p.id)
                              .reduce((acc, t) => t.tipo === 'entrate' ? acc + t.importo : acc - t.importo, 0);

                            const needsRecharge = balance < 15.01;
                            const hasPhone = p.telefono && p.telefono.trim() !== '';

                            // Clean phone number (remove spaces and ensure country code)
                            const cleanPhone = hasPhone ? p.telefono.replace(/\s/g, '').replace(/^(\+39)?/, '+39') : '';
                            const whatsappMessage = encodeURIComponent(
                              `Ciao ${p.nome}! Il tuo credito è a €${balance.toFixed(2)}. Ti ricordo di ricaricare per poter continuare a partecipare ai tornei! 🎳`
                            );
                            const whatsappLink = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;

                            return (
                              <tr key={p.id} className="group hover:bg-white/5 transition-colors">
                                <td
                                  className="py-4 pl-4 font-bold cursor-pointer"
                                  onClick={() => setSelectedAccountingPlayer(p)}
                                >
                                  {p.nome} {p.cognome}
                                </td>
                                <td
                                  className={`py-4 text-right font-black font-mono cursor-pointer ${balance < 10 ? 'text-red-500' : 'text-green-500'}`}
                                  onClick={() => setSelectedAccountingPlayer(p)}
                                >
                                  € {balance.toFixed(2)}
                                </td>
                                <td className="py-4 pr-4 text-center">
                                  {needsRecharge && hasPhone && (
                                    <a
                                      href={whatsappLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors text-xs font-bold"
                                      title="Invia promemoria WhatsApp"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                      </svg>
                                      Ricarica
                                    </a>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {players.filter(p => {
                            const search = searchAccounting.toLowerCase();
                            return p.nome.toLowerCase().includes(search) || p.cognome.toLowerCase().includes(search);
                          }).length === 0 && (
                              <tr>
                                <td colSpan="3" className="py-12 text-center text-gray-500 italic">
                                  Nessun atleta trovato {searchAccounting ? 'per questa ricerca' : 'registrato'}.
                                </td>
                              </tr>
                            )
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </main >

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>

      {/* GLOBAL ADD BUTTON (FIXED BOTTOM RIGHT) */}
      {
        isAdmin && (activeTab === 'players' || activeTab === 'tournaments') && (
          <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-3 pointer-events-none">
            {activeTab === 'tournaments' && (
              <button
                onClick={() => setShowTournamentImportForm(true)}
                className="pointer-events-auto p-4 rounded-xl neumorphic-btn text-green-400 font-bold flex items-center gap-2 shadow-2xl scale-90 md:scale-100"
                title="Importa Risultati FISB"
              >
                <Upload className="w-5 h-5" /> <span>+ aggiungi torneo</span>
              </button>
            )}
            {isAdmin && (
              <button onClick={testDirectImport} className="pointer-events-auto px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl font-bold border border-yellow-500/20 scale-90 md:scale-100">
                🧪 TEST INSERT
              </button>
            )}
            <button
              onClick={() => {
                if (activeTab === 'players') { setEditingPlayer(null); setShowPlayerForm(true); }
                if (activeTab === 'tournaments') { setEditingTournament(null); setShowTournamentForm(true); }
              }}
              className="pointer-events-auto p-4 rounded-xl neumorphic-btn text-blue-400 font-bold flex items-center gap-2 shadow-2xl scale-90 md:scale-100"
            >
              <Plus className="w-5 h-5" /> <span>Aggiungi</span>
            </button>
          </div>
        )
      }

      {/* MODALS */}
      {
        (showPlayerForm || showTournamentForm || showResultForm || showTransactionForm || showTournamentImportForm || showCalendarUpload || showDirectiveUpload || showBroadcastModal) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
              setShowPlayerForm(false);
              setShowTournamentForm(false);
              setShowResultForm(false);
              setShowTransactionForm(false);
              setShowTournamentImportForm(false);
              setShowCalendarUpload(false);
              setShowDirectiveUpload(false);
              setShowBroadcastModal(false);
            }}></div>
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {showTournamentImportForm && (
                <TournamentImportV2
                  players={players}
                  tournaments={tournaments}
                  onSave={handleSaveImportedResults}
                  onCancel={() => setShowTournamentImportForm(false)}
                />
              )}
              {showPlayerForm && (
                <PlayerForm player={editingPlayer} onSave={handleSavePlayer} onCancel={() => setShowPlayerForm(false)} />
              )}
              {showTournamentForm && (
                <TournamentForm tournament={editingTournament} onSave={handleSaveTournament} onCancel={() => setShowTournamentForm(false)} />
              )}
              {showResultForm && (
                <ResultForm
                  result={editingResult}
                  players={players}
                  tournaments={tournaments}
                  onSave={handleSaveResult}
                  onCancel={() => setShowResultForm(false)}
                />
              )}
              {showTransactionForm && (
                <TransactionForm
                  transaction={editingTransaction}
                  onSave={handleSaveTransaction}
                  onCancel={() => setShowTransactionForm(false)}
                />
              )}
              {showCalendarUpload && (
                <div className="p-8 rounded-[2.5rem] glass-card border border-green-500/20 max-w-2xl w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-green-400 uppercase tracking-tight">Gestisci Calendario Tornei</h2>
                    <button
                      onClick={() => setShowCalendarUpload(false)}
                      className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {calendarPdfUrl && (
                    <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-sm font-bold text-green-400">PDF Attuale</p>
                            <p className="text-xs text-gray-400">calendario-tornei.pdf</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={calendarPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-bold"
                          >
                            <Download className="w-4 h-4 inline mr-1" />
                            Scarica
                          </a>
                          <button
                            onClick={deleteCalendarPDF}
                            disabled={uploadingCalendar}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-bold disabled:opacity-50"
                          >
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">
                        {calendarPdfUrl ? 'Sostituisci PDF' : 'Carica PDF'}
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) uploadCalendarPDF(file);
                        }}
                        disabled={uploadingCalendar}
                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500/20 file:text-green-400 file:font-bold hover:file:bg-green-500/30 disabled:opacity-50"
                      />
                    </div>

                    {uploadingCalendar && (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-400">Caricamento in corso...</span>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      Formati accettati: PDF. Il file sarà disponibile pubblicamente a tutti gli utenti.
                    </p>
                  </div>
                </div>
              )}
              {showDirectiveUpload && (
                <div className="p-8 rounded-[2.5rem] glass-card border border-green-500/20 max-w-2xl w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-green-400 uppercase tracking-tight">Gestisci Direttivo</h2>
                    <button
                      onClick={() => setShowDirectiveUpload(false)}
                      className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {directivePdfUrl && (
                    <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-sm font-bold text-green-400">PDF Attuale</p>
                            <p className="text-xs text-gray-400">direttivo.pdf</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={directivePdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-bold"
                          >
                            <Download className="w-4 h-4 inline mr-1" />
                            Scarica
                          </a>
                          <button
                            onClick={deleteDirectivePDF}
                            disabled={uploadingDirective}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-bold disabled:opacity-50"
                          >
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">
                        {directivePdfUrl ? 'Sostituisci PDF' : 'Carica PDF'}
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) uploadDirectivePDF(file);
                        }}
                        disabled={uploadingDirective}
                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500/20 file:text-green-400 file:font-bold hover:file:bg-green-500/30 disabled:opacity-50"
                      />
                    </div>

                    {uploadingDirective && (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-400">Caricamento in corso...</span>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      Formati accettati: PDF. Il file sarà disponibile pubblicamente a tutti gli utenti.
                    </p>
                  </div>
                </div>
              )}
              {showBroadcastModal && (
                <div className="p-8 rounded-[2.5rem] glass-card border border-green-500/20 max-w-4xl w-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-green-500/20">
                        <MessageSquare className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-green-400 uppercase tracking-tight">Messaggio a Tutti</h2>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Broadcast WhatsApp</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowBroadcastModal(false)}
                      className="p-3 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <X className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Message Area */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Messaggio da inviare</label>
                        <textarea
                          value={broadcastMsg}
                          onChange={(e) => setBroadcastMsg(e.target.value)}
                          className="w-full h-48 px-5 py-4 rounded-2xl bg-black/40 border border-white/10 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all outline-none text-gray-200 font-medium resize-none"
                          placeholder="Scrivi qui il messaggio..."
                        />
                      </div>
                      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-400 font-bold leading-relaxed">
                          <span className="block mb-1">Nota:</span>
                          WhatsApp non permette l'invio automatico a più persone contemporaneamente per evitare spam. Dovrai cliccare "Invia" per ogni giocatore; il messaggio sarà già pre-compilato.
                        </p>
                      </div>
                    </div>

                    {/* Patients/Players List */}
                    <div className="space-y-4">
                      <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Lista Iscritti ({players.filter(p => p.telefono).length})</label>
                      <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {players
                          .filter(p => p.telefono)
                          .sort((a, b) => a.cognome.localeCompare(b.cognome))
                          .map(player => (
                            <div key={player.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                              <div>
                                <p className="font-bold text-gray-200">{player.cognome} {player.nome}</p>
                                <p className="text-xs text-gray-500">{player.telefono}</p>
                              </div>
                              <a
                                href={`https://wa.me/39${player.telefono.replace(/\s/g, '')}?text=${encodeURIComponent(broadcastMsg)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all border border-green-500/20"
                                title={`Invia a ${player.nome}`}
                              >
                                <MessageCircle className="w-5 h-5" />
                              </a>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div >
  );
};

export default App;
