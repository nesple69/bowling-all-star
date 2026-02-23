import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Trophy, Users, Home, Settings, CreditCard } from 'lucide-react';

const Header: React.FC = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/', label: 'HOME', icon: <Home className="w-4 h-4" /> },
        { path: '/tornei', label: 'TORNEI', icon: <Trophy className="w-4 h-4" /> },
        { path: '/giocatori', label: 'GIOCATORI', icon: <Users className="w-4 h-4" /> },
    ];

    if (isAdmin()) {
        navItems.push({ path: '/admin/tornei', label: 'GESTIONE', icon: <Settings className="w-4 h-4" /> });
        navItems.push({ path: '/admin/import', label: 'IMPORT DATI', icon: <Settings className="w-4 h-4" /> });
        navItems.push({ path: '/admin/contabilita', label: 'CONTABILITÀ', icon: <CreditCard className="w-4 h-4" /> });
        navItems.push({ path: '/admin/utenti', label: 'UTENTI', icon: <Users className="w-4 h-4" /> });
    }

    return (
        <header className="bg-gradient-to-r from-primary to-light-blue shadow-lg">
            <div className="container mx-auto px-4 md:px-6 lg:px-12">
                <div className="flex justify-between items-center h-20">

                    {/* Logo & Title */}
                    <Link to="/" className="flex items-center gap-3 group relative z-30">
                        <div className="group-hover:scale-110 transition-transform w-56 h-56 flex items-center justify-center -my-16 overflow-visible">
                            <img src="/logo All Star.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-2xl" onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0Y4QjUwMCIgZD0iTTEyIDFsMy4zOSA2LjY4IDcuNjEgMS4xLTUuNSA1LjM2IDEuMyA3LjYyLTkuOC0zLjY2LTYuOCA0Ljk2IDEuMy03LjYyLTUuNS01LjM2IDcuNjEtMS4xTDEyIDFsMy4zOSA2LjY4eiIvPjwvc3ZnPg==';
                            }} />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-white text-xl md:text-2xl font-bold font-heading uppercase tracking-wide flex items-center gap-2">
                                ALL STAR TEAM
                            </h1>
                            <p className="text-white/90 text-sm font-medium tracking-wide italic uppercase">bowling asd</p>
                        </div>
                    </Link>

                    {/* Navigation - Desktop */}
                    <nav className="hidden lg:flex items-center gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-2 text-white font-semibold uppercase text-xs px-4 py-2 transition-all duration-200 rounded-md ${isActive(item.path)
                                    ? 'bg-white/30 shadow-inner'
                                    : 'hover:bg-white/20'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile / Logout / Login */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <div className="hidden md:flex flex-col items-end mr-2">
                                    <span className="text-white font-bold text-sm uppercase">{user.nome} {user.cognome}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isAdmin() ? 'bg-secondary text-white' : 'bg-white/20 text-white'}`}>
                                        {user.ruolo}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate('/profilo')}
                                        className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                                        title="Profilo"
                                    >
                                        <UserIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-white text-primary font-bold px-6 py-2 rounded-md hover:bg-secondary hover:text-white transition-all duration-200 uppercase text-xs shadow-md"
                            >
                                Accedi
                            </button>
                        )}
                    </div>
                </div>
            </div >

            {/* Navigation - Mobile (Horizontal Scrollable) */}
            < div className="lg:hidden bg-white/10 overflow-x-auto no-scrollbar border-t border-white/10" >
                <div className="flex px-4 py-2 min-w-max gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-1.5 text-white font-bold uppercase text-[10px] px-3 py-1.5 transition-all rounded ${isActive(item.path) ? 'bg-white/30' : 'hover:bg-white/10'
                                }`}
                        >
                            {item.icon} {item.label}
                        </Link>
                    ))}
                </div>
            </div >
        </header >
    );
};

export default Header;
