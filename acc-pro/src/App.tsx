import React, { useState, useEffect } from 'react';
import { Settings, Shield, Zap, FileText, ChevronRight, Activity, Cpu, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
interface SystemStatus {
  patchActive: boolean;
  rulesPath: string;
  backupCount: number;
  terminalPolicy: string;
}

interface Backup {
  filename: string;
  size: number;
  date: string;
  isFavorite: boolean;
}

declare global {
  interface Window {
    pywebview: {
      api: {
        get_system_status: () => Promise<SystemStatus>;
        read_rules: () => Promise<string>;
        save_rules: (content: string) => Promise<{ success: boolean; error?: string }>;
        apply_patch: () => Promise<{ success: boolean; error?: string }>;
        get_backups: () => Promise<Backup[]>;
        toggle_favorite: (filename: string) => Promise<{ success: boolean; isFavorite: boolean }>;
        restore_backup: (filename: string) => Promise<{ success: boolean; error?: string }>;
        set_terminal_policy: (policy: string) => Promise<{ success: boolean; error?: string }>;
      }
    }
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'backups'>('dashboard');
  const [rules, setRules] = useState<string>('');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [status, setStatus] = useState<SystemStatus>({
    patchActive: false,
    rulesPath: '-',
    backupCount: 0,
    terminalPolicy: 'Off'
  });
  const [loading, setLoading] = useState(true);
  const [patching, setPatching] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; type: 'success' | 'error'; message: string }[]>([]);

  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
      if (window.pywebview) {
        const [sysStatus, rulesContent, backupList] = await Promise.all([
          window.pywebview.api.get_system_status(),
          window.pywebview.api.read_rules(),
          window.pywebview.api.get_backups()
        ]);
        setStatus(sysStatus);
        setRules(rulesContent);
        setBackups(backupList);
        setLoading(false);
      } else {
        // Fallback for browser testing
        console.log("PyWebView not detected.");
        setTimeout(() => setLoading(false), 1000);
      }
    };
    
    // PyWebView might not be ready immediately
    const checkInterval = setInterval(() => {
        if(window.pywebview) {
            init();
            clearInterval(checkInterval);
        }
    }, 100);
    
    return () => clearInterval(checkInterval);
  }, []);

  const handleSave = async () => {
    if (window.pywebview) {
        try {
            const res = await window.pywebview.api.save_rules(rules);
            if (res.success) {
                addNotification('success', 'Rules synchronized successfully!');
            } else {
                addNotification('error', `Save failed: ${res.error}`);
            }
        } catch (err) {
            addNotification('error', 'Critical connection error.');
        }
    }
  };

  const handleApplyPatch = async () => {
    if (window.pywebview && !patching) {
        setPatching(true);
        addNotification('success', 'Patch deployment started in background...');
        
        try {
            const res = await window.pywebview.api.apply_patch();
            if (res.success) {
                addNotification('success', 'Core Patch deployed successfully!');
                const sysStatus = await window.pywebview.api.get_system_status();
                setStatus(sysStatus);
            } else {
                addNotification('error', `Patch failed: ${res.error}`);
            }
        } catch (err) {
            addNotification('error', 'Background patch process failed.');
        } finally {
            setPatching(false);
        }
    }
  };

  const handleSetPolicy = async (newPolicy: string) => {
    if (window.pywebview) {
        try {
            const res = await window.pywebview.api.set_terminal_policy(newPolicy);
            if (res.success) {
                addNotification('success', `Terminal policy updated to ${newPolicy}`);
                setStatus(prev => ({ ...prev, terminalPolicy: newPolicy }));
            } else {
                addNotification('error', `Update failed: ${res.error}`);
            }
        } catch (err) {
            addNotification('error', 'Failed to communicate with system.');
        }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-[#0a0a0c]">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <div className="text-accent font-bold tracking-widest animate-pulse">BOOTING ANTIGRAVITY</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen p-6 gap-6 select-none bg-transparent">
      {/* SIDEBAR */}
      <aside className="w-72 glass rounded-[2.5rem] p-8 flex flex-col gap-10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <span className="font-bold text-2xl tracking-tighter">ANTIGRAVITY</span>
        </div>

        <nav className="flex flex-col gap-3 flex-1">
          <NavItem 
            icon={<Activity size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Rules Editor" 
            active={activeTab === 'rules'} 
            onClick={() => setActiveTab('rules')} 
          />
        </nav>

        <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30 font-bold tracking-widest uppercase">PRO LICENSE</span>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          </div>
          <div className="text-sm font-semibold text-white/80">Premium Active</div>
          <div className="text-[10px] text-white/20">v1.5.0 Production Ready</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col gap-6">
        <header className="h-24 flex items-center justify-between px-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">{activeTab === 'dashboard' ? 'Control Panel' : 'Rules Config'}</h1>
            <p className="text-white/40 text-sm mt-1">{activeTab === 'dashboard' ? 'Real-time system monitoring and management.' : 'Define your agents behavior and core logic.'}</p>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => window.location.reload()}
                className="h-12 w-12 flex items-center justify-center glass rounded-2xl cursor-pointer hover:bg-white/10 transition-all active:scale-90"
             >
                <RotateCcw size={20} className="text-white/60" />
             </button>
             <div className="h-12 w-12 flex items-center justify-center glass rounded-2xl cursor-pointer hover:bg-white/10 transition-all active:scale-90 border-accent/20">
                <Settings size={20} className="text-white/60" />
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-12 gap-6 h-full p-2"
              >
                {/* Main Action Card */}
                <div className="col-span-8 glass rounded-[3rem] p-10 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-accent/5 rounded-full blur-[100px] group-hover:bg-accent/10 transition-all"></div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-12">
                      <div className="p-4 rounded-[1.5rem] bg-accent/10 border border-accent/20 text-accent shadow-inner">
                        <Shield size={32} />
                      </div>
                      <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border ${status.patchActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        <div className={`w-2 h-2 rounded-full ${status.patchActive ? 'bg-green-400' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)] animate-pulse'}`}></div>
                        {status.patchActive ? 'CORE PATCH ACTIVE' : 'PATCH INACTIVE'}
                      </div>
                    </div>
                    
                    <h2 className="text-5xl font-black mb-4 tracking-tighter leading-none">Dynamic Bridge<br/><span className="gradient-text">Protocol v4</span></h2>
                    <p className="text-white/40 text-lg max-w-md leading-relaxed">Your agent is currently bridged to the <span className="text-white/60 font-semibold">GEMINI.md</span> rule-set. Changes applied in the editor will take effect instantly across all active sessions.</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                        onClick={handleApplyPatch}
                        disabled={patching}
                        className={`px-10 py-5 rounded-2xl font-bold transition-all shadow-2xl active:scale-95 text-lg flex items-center gap-3 ${patching ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-accent hover:bg-blue-600 text-white shadow-accent/20'}`}
                    >
                        {patching && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        {patching ? 'Deploying...' : (status.patchActive ? 'Re-Apply Dynamic Patch' : 'Deploy Virtual Patch')}
                    </button>
                    <button className="px-10 py-5 rounded-2xl glass hover:bg-white/10 transition-all active:scale-95 font-bold text-lg">Diagnostics</button>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="col-span-4 flex flex-col gap-6">
                   <div className="glass rounded-[2rem] p-8 flex-1 flex flex-col justify-center gap-6 group">
                      <div className="flex items-center gap-5">
                         <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary group-hover:bg-secondary/20 transition-all">
                            <Cpu size={28} />
                         </div>
                         <div>
                            <div className="text-[10px] text-white/30 font-bold tracking-widest uppercase mb-1">REAL-TIME MEMORY</div>
                            <div className="text-2xl font-black">1.2 GB <span className="text-xs font-normal text-white/20 tracking-normal">/ NODE</span></div>
                         </div>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '42%' }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-secondary shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                         ></motion.div>
                      </div>
                   </div>

                   <div 
                        onClick={() => setActiveTab('backups')}
                        className="glass rounded-[2rem] p-8 flex-1 flex items-center justify-between group cursor-pointer hover:border-white/20 transition-all active:scale-[0.98]"
                   >
                      <div>
                        <div className="text-[10px] text-white/30 font-bold tracking-widest uppercase mb-1">RESTORATION SYSTEM</div>
                        <div className="text-3xl font-black">{status.backupCount} <span className="text-sm font-medium text-white/30">Snapshots</span></div>
                      </div>
                      <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 group-hover:bg-white/10 transition-all">
                        <ChevronRight className="text-white/40 group-hover:text-white" size={24} />
                      </div>
                   </div>

                   {/* Autonomy Policy Card */}
                   <div className="glass rounded-[2rem] p-8 flex-1 flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                         <div className="text-[10px] text-white/30 font-bold tracking-widest uppercase">Agent Autonomy</div>
                         <Zap size={14} className="text-accent" />
                      </div>
                      <div className="flex bg-white/5 p-1.5 rounded-2xl gap-1">
                         {['Off', 'Auto', 'Turbo'].map((p) => (
                            <button
                               key={p}
                               onClick={() => handleSetPolicy(p)}
                               className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all ${status.terminalPolicy === p ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/30 hover:bg-white/5 hover:text-white/60'}`}
                            >
                               {p.toUpperCase()}
                            </button>
                         ))}
                      </div>
                      <div className="text-[10px] text-white/20 leading-relaxed italic px-1">
                         {status.terminalPolicy === 'Turbo' ? 'Warning: Agent will execute all terminal commands automatically.' : 
                          status.terminalPolicy === 'Auto' ? 'Recommended: Agent auto-executes safe commands, asks for others.' :
                          'Strict: Permission required for every terminal interaction.'}
                      </div>
                   </div>
                </div>
              </motion.div>
            ) : activeTab === 'rules' ? (
              <motion.div 
                key="rules"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="h-full flex flex-col gap-6 p-2"
              >
                <div className="flex-1 glass rounded-[3rem] p-8 overflow-hidden flex flex-col relative">
                  <div className="absolute top-0 right-10 p-5">
                     <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-accent/50 group uppercase">
                        <div className="w-1 h-1 rounded-full bg-accent animate-ping"></div>
                        Live Sync: Active
                     </span>
                  </div>
                  
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-accent rounded-full"></div>
                    <div>
                        <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Target Resource</span>
                        <div className="text-white/60 font-mono text-sm">{status.rulesPath}</div>
                    </div>
                  </div>

                  <textarea 
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none resize-none font-mono text-white/70 p-6 leading-relaxed scrollbar-hide text-lg"
                    placeholder="# Define your global rules here..."
                    spellCheck={false}
                  />
                  
                  <div className="mt-4 flex items-center justify-between px-2">
                     <div className="text-[10px] text-white/20 font-mono italic">Changes will be cached before synchronization.</div>
                     <div className="text-[10px] text-white/40 font-bold">{rules.length} Characters</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={handleSave}
                    className="flex-1 h-20 rounded-[1.5rem] bg-gradient-to-r from-accent to-secondary font-black text-xl shadow-2xl shadow-accent/30 active:scale-95 transition-all hover:brightness-110 flex items-center justify-center gap-3"
                  >
                    <Zap className="fill-white" size={24} />
                    Push Rules to Core
                  </button>
                </div>
              </motion.div>
            ) : (
                <motion.div 
                    key="backups"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full flex flex-col gap-6 p-2"
                >
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setActiveTab('dashboard')} className="p-3 glass rounded-xl hover:bg-white/10 transition-all">
                                <RotateCcw size={18} className="rotate-[-45deg]" />
                            </button>
                            <h2 className="text-2xl font-black tracking-tight">System Snapshots</h2>
                        </div>
                        <div className="text-[10px] font-bold text-white/30 tracking-widest uppercase bg-white/5 px-4 py-2 rounded-full border border-white/5">Auto-protection: Enabled</div>
                    </header>

                    <div className="flex-1 glass rounded-[3rem] p-8 overflow-y-auto scrollbar-hide flex flex-col gap-3">
                        {backups.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-4">
                                <Shield size={48} className="opacity-20" />
                                <div className="font-bold tracking-widest uppercase text-xs">No snapshots found</div>
                            </div>
                        ) : (
                            backups.map(b => (
                                <div key={b.filename} className="p-6 glass rounded-2xl flex items-center justify-between group hover:border-accent/30 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-xl ${b.isFavorite ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/40'}`}>
                                            <Shield size={22} fill={b.isFavorite ? 'currentColor' : 'none'} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white/80">{b.filename}</div>
                                            <div className="text-[10px] text-white/30 font-medium mt-1">{b.date} • {(b.size / (1024 * 1024)).toFixed(2)} MB</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={async () => {
                                                const res = await window.pywebview.api.toggle_favorite(b.filename);
                                                if (res.success) {
                                                    const list = await window.pywebview.api.get_backups();
                                                    setBackups(list);
                                                }
                                            }}
                                            className={`p-3 rounded-xl transition-all ${b.isFavorite ? 'text-accent hover:bg-accent/10' : 'text-white/20 hover:bg-white/5 hover:text-white/60'}`}
                                        >
                                            <Zap size={18} fill={b.isFavorite ? 'currentColor' : 'none'} />
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                if (confirm(`Antigravity core file will be replaced by this backup (${b.filename}). Continue?`)) {
                                                    const res = await window.pywebview.api.restore_backup(b.filename);
                                                    if (res.success) {
                                                        addNotification('success', 'System restored successfully!');
                                                    } else {
                                                        addNotification('error', `Restore failed: ${res.error}`);
                                                    }
                                                }
                                            }}
                                            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                                        >
                                            RESTORE
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* NOTIFICATIONS */}
      <div className="fixed top-10 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
            {notifications.map(n => (
                <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    className={`p-6 rounded-[2rem] glass min-w-[300px] border-l-4 shadow-2xl pointer-events-auto ${n.type === 'success' ? 'border-l-green-500' : 'border-l-red-500'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${n.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {n.type === 'success' ? <Zap size={20} /> : <Shield size={20} />}
                        </div>
                        <div>
                            <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase">{n.type === 'success' ? 'Protocol Success' : 'System Error'}</div>
                            <div className="text-sm font-bold text-white/80">{n.message}</div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 px-8 py-5 rounded-[1.5rem] transition-all duration-500 relative group overflow-hidden ${active ? 'text-accent' : 'text-white/30 hover:text-white/70'}`}
  >
    {active && (
        <motion.div 
            layoutId="nav-bg" 
            className="absolute inset-0 bg-accent/10 border border-accent/20 rounded-[1.5rem]" 
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
    )}
    <div className={`relative transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
    </div>
    <span className="font-bold relative text-lg tracking-tight">{label}</span>
    {active && <motion.div layoutId="nav-glow" className="ml-auto w-1 h-4 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,1)]" />}
  </button>
)

export default App;
