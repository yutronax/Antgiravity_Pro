import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Zap, 
  FileText, 
  ChevronRight, 
  Activity, 
  Cpu, 
  RotateCcw, 
  Layout, 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  Search, 
  Box, 
  Share2, 
  Check, 
  X, 
  RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';

// --- TYPES ---
interface RuleDefinition {
  id: string;
  file: string;
  intent: string;
  triggers: string[];
  patterns: string[];
  dependencies: string[];
  successors: string[];
  priority: number;
  scope: string;
  role: string;
  tags: string[];
}

interface RuleMap {
  rules: RuleDefinition[];
  dependencies: Record<string, string[]>;
  global_rules: string[];
}

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
        get_rule_map: () => Promise<RuleMap>;
        save_rule_map: (map: RuleMap) => Promise<{ success: boolean; error?: string }>;
        add_rule: (data: any) => Promise<{ success: boolean; error?: string }>;
        delete_rule: (id: string) => Promise<{ success: boolean; error?: string }>;
        get_active_graph: (prompt: string) => Promise<{ nodes: any[]; edges: any[]; trace: any; suggestion?: string }>;
        update_node_position: (node_id: string, x: number, y: number) => Promise<boolean>;
        add_manual_connection: (source_id: string, target_id: string) => Promise<boolean>;
        clone_rule: (rule_id: string) => Promise<boolean>;
      }
    }
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'backups' | 'flow'>('dashboard');
  const [rules, setRules] = useState<string>('');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [ruleMap, setRuleMap] = useState<RuleMap>({ rules: [], dependencies: {}, global_rules: [] });
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

  useEffect(() => {
    const init = async () => {
      if (window.pywebview) {
        const [sysStatus, rulesContent, backupList, map] = await Promise.all([
          window.pywebview.api.get_system_status(),
          window.pywebview.api.read_rules(),
          window.pywebview.api.get_backups(),
          window.pywebview.api.get_rule_map()
        ]);
        setStatus(sysStatus);
        setRules(rulesContent);
        setBackups(backupList);
        setRuleMap(map);
        setLoading(false);
      } else {
        // Mock data for browser testing
        setRuleMap({
            rules: [],
            dependencies: {},
            global_rules: []
        });
        setLoading(false);
      }
    };
    
    if (window.pywebview) {
        init();
    } else {
        // Browser mock mode
        init();
    }
    
    return () => {};
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

  const handleAddRule = async (newRule: any) => {
    if (window.pywebview) {
        try {
            const res = await window.pywebview.api.add_rule(newRule);
            if (res.success) {
                addNotification('success', `Rule '${newRule.id}' added!`);
                const map = await window.pywebview.api.get_rule_map();
                setRuleMap(map);
            } else {
                addNotification('error', `Add failed: ${res.error}`);
            }
        } catch (err) {
            addNotification('error', 'API error adding rule.');
        }
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (window.pywebview) {
        try {
            const res = await window.pywebview.api.delete_rule(id);
            if (res.success) {
                addNotification('success', `Rule '${id}' deleted.`);
                const map = await window.pywebview.api.get_rule_map();
                setRuleMap(map);
            } else {
                addNotification('error', `Delete failed: ${res.error}`);
            }
        } catch (err) {
            addNotification('error', 'API error deleting rule.');
        }
    }
  };

  const handleReorder = async (newOrder: RuleDefinition[]) => {
      const updatedRules = newOrder.map((rule, idx) => ({
          ...rule,
          priority: 100 - (idx * 5)
      }));
      
      const newMap = { ...ruleMap, rules: updatedRules };
      setRuleMap(newMap);
      
      if (window.pywebview) {
          await window.pywebview.api.save_rule_map(newMap);
          addNotification('success', 'Rule sequence synchronized!');
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
          <NavItem 
            icon={<Layout size={20} />} 
            label="Flow Manager" 
            active={activeTab === 'flow'} 
            onClick={() => setActiveTab('flow')} 
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
                <FlowView 
                    ruleMap={ruleMap} 
                    onDelete={handleDeleteRule}
                    onAdd={handleAddRule}
                />
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

// --- FLOW VIEW COMPONENT ---
interface FlowViewProps {
    ruleMap: RuleMap;
    onDelete: (id: string) => void;
    onAdd: (data: any) => void;
}

interface RuleNodeProps {
    node: any;
    pos: { x: number; y: number };
    score: number;
    simulationPrompt: string;
    activeGraph: any;
    setActiveGraph: React.Dispatch<React.SetStateAction<any>>;
    setHoveredNode: (id: string | null) => void;
    hoveredNode: string | null;
    drawingEdge: { source: string, x: number, y: number } | null;
    setDrawingEdge: (val: { source: string, x: number, y: number } | null) => void;
    setSnapTarget: (val: {id: string, x: number, y: number} | null) => void;
    snapTarget: {id: string, x: number, y: number} | null;
    onDelete: (id: string) => void;
    onUpdatePos: (id: string, x: number, y: number) => void;
}

// --- COMPONENTS ---

const RuleNode: React.FC<RuleNodeProps> = ({ 
    node, pos, score, simulationPrompt, activeGraph, setActiveGraph, setHoveredNode, hoveredNode, drawingEdge, setDrawingEdge, setSnapTarget, snapTarget, onDelete, onUpdatePos
}) => {
    const bgColor = node.active ? (node.in_flow ? 'bg-green-500/10' : 'bg-accent/10') : 'bg-white/5';
    const borderColor = node.active ? (node.in_flow ? 'border-green-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-accent/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]') : 'border-white/10';
    const GRID_SIZE = 20;
    const isDraggingRef = React.useRef(false);
    const dragStartRef = React.useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
    const nodeRef = React.useRef<HTMLDivElement>(null);
    const didDragRef = React.useRef(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        // Don't start drag from buttons or connection handle
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[data-connection-handle]')) return;
        
        e.preventDefault(); // Prevent pywebview window drag
        e.stopPropagation();
        isDraggingRef.current = true;
        didDragRef.current = false;
        dragStartRef.current = { x: e.clientX, y: e.clientY, nodeX: pos.x, nodeY: pos.y };
        
        const handleMove = (ev: MouseEvent) => {
            if (!isDraggingRef.current || !nodeRef.current) return;
            ev.preventDefault();
            const dx = ev.clientX - dragStartRef.current.x;
            const dy = ev.clientY - dragStartRef.current.y;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDragRef.current = true;
            nodeRef.current.style.left = `${dragStartRef.current.nodeX + dx}px`;
            nodeRef.current.style.top = `${dragStartRef.current.nodeY + dy}px`;
        };

        const handleUp = (ev: MouseEvent) => {
            isDraggingRef.current = false;
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            
            if (didDragRef.current) {
                const dx = ev.clientX - dragStartRef.current.x;
                const dy = ev.clientY - dragStartRef.current.y;
                const rawX = dragStartRef.current.nodeX + dx;
                const rawY = dragStartRef.current.nodeY + dy;
                const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
                const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
                if (nodeRef.current) {
                    nodeRef.current.style.left = `${snappedX}px`;
                    nodeRef.current.style.top = `${snappedY}px`;
                }
                onUpdatePos(node.id, snappedX, snappedY);
            }
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
    };

    const isSnapHighlight = snapTarget?.id === node.id;

    return (
        <div
            ref={nodeRef}
            style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
            className={`absolute w-[180px] p-4 rounded-3xl border cursor-grab active:cursor-grabbing group/node select-none
                ${bgColor} ${borderColor} ${node.active ? '' : 'hover:border-white/20'} z-10
                ${isSnapHighlight ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-transparent shadow-[0_0_25px_rgba(0,255,157,0.4)]' : ''}
                ${node.active ? 'scale-[1.02]' : ''}
                transition-shadow`}
            onPointerDown={handlePointerDown}
            onMouseDown={(e) => {
                // Fallback for pywebview WebView2
                const target = e.target as HTMLElement;
                if (target.closest('button') || target.closest('[data-connection-handle]')) return;
                e.preventDefault();
            }}
            onPointerEnter={() => {
                setHoveredNode(node.id);
                if (drawingEdge && drawingEdge.source !== node.id) {
                    setSnapTarget({ id: node.id, x: pos.x, y: pos.y });
                }
            }}
            onPointerLeave={() => {
                setHoveredNode(null);
                if (drawingEdge) setSnapTarget(null);
            }}
            onPointerUp={() => {
                if (drawingEdge && drawingEdge.source !== node.id) {
                    setSnapTarget(null);
                    window.pywebview?.api?.add_manual_connection(drawingEdge.source, node.id).then(() => {
                        setDrawingEdge(null);
                        if (window.pywebview?.api?.get_active_graph) {
                            window.pywebview.api.get_active_graph(simulationPrompt).then((g: any) => setActiveGraph(g));
                        }
                    });
                }
            }}
        >
            {node.is_current && (
                <motion.div 
                    className="absolute inset-0 rounded-3xl border-2 border-accent pointer-events-none"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            )}
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${node.active ? (node.in_flow ? 'bg-green-500 text-white' : 'bg-accent text-white') : 'bg-white/10 text-white/40'}`}>
                    {node.role === 'global' ? <Box size={14} /> : <Share2 size={14} />}
                </div>
                <div className="flex items-center gap-2">
                    {node.active && score > 0 && typeof score === 'number' && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${node.in_flow ? 'text-green-400 bg-green-400/10' : 'text-accent bg-accent/10'}`}>
                            {Math.round(score * 100)}%
                        </span>
                    )}
                    <button 
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerUp={async (e) => { 
                            e.stopPropagation();
                            e.preventDefault();
                            if (window.pywebview?.api?.clone_rule) {
                                const success = await window.pywebview.api.clone_rule(node.id);
                                if (success && window.pywebview?.api?.get_active_graph) {
                                    const g = await window.pywebview.api.get_active_graph(simulationPrompt);
                                    setActiveGraph(g);
                                }
                            }
                        }}
                        className="p-1.5 rounded-lg hover:text-accent hover:bg-accent/10 transition-all cursor-pointer text-white/30"
                        title="Clone Rule"
                    >
                        <RotateCcw size={14} className="rotate-180" />
                    </button>
                    <button 
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault();
                            onDelete(node.id); 
                        }}
                        className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer text-white/30"
                        title="Delete Rule"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            
            <h3 className="font-black text-sm tracking-tight mb-1 truncate">{node.label}</h3>
            <p className="text-[9px] text-white/40 font-medium uppercase tracking-wider truncate">{node.file.split('/').pop()}</p>
            
            <div className="mt-3 flex flex-wrap gap-1">
                {node.tags?.map((t: string) => (
                    <span key={t} className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded-md text-white/30 border border-white/5 italic">#{t}</span>
                ))}
            </div>
            {/* Connection handle - LARGE visible hitbox */}
            <div 
                data-connection-handle="true"
                className="absolute top-1/2 -right-4 w-8 h-16 -translate-y-1/2 cursor-crosshair z-40 flex items-center justify-center"
                onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setDrawingEdge({ 
                        source: node.id, 
                        x: pos.x + 180, 
                        y: pos.y + 50 
                    });
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="w-4 h-4 rounded-full bg-accent/30 border-2 border-accent/60 hover:bg-accent hover:border-accent hover:scale-150 transition-all" />
            </div>
            {/* Left input dot */}
            <div className="absolute top-1/2 -left-2 w-4 h-4 rounded-full bg-white/10 border-2 border-white/20 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>
        </div>
    );
};

        
const FlowView: React.FC<FlowViewProps> = ({ ruleMap, onDelete, onAdd }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [simulationPrompt, setSimulationPrompt] = useState("");
    const [activeGraph, setActiveGraph] = useState<{nodes: any[], edges: any[], trace: any, suggestion?: string, layout?: Record<string, {x: number, y: number}>}>({nodes: [], edges: [], trace: {}});
    const [newRule, setNewRule] = useState({ id: '', file: 'memory/rules/', intent: '', patterns: '', dependencies: '', role: 'optional', tags: '' });
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [drawingEdge, setDrawingEdge] = useState<{ source: string, x: number, y: number } | null>(null);
    const [snapTarget, setSnapTarget] = useState<{id: string, x: number, y: number} | null>(null);
    const mousePosRef = React.useRef({ x: 0, y: 0 });
    const drawingLineRef = React.useRef<SVGPathElement>(null);

    const stringToHash = (s: string) => {
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
            hash = (hash << 5) - hash + s.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    };

    const [layoutCache, setLayoutCache] = useState<Record<string, {x: number, y: number}>>(() => {
        const saved = localStorage.getItem('antigravity_layout_cache');
        return saved ? JSON.parse(saved) : {};
    });

    // Stable position update handler — no re-render of the whole tree
    const handleUpdatePos = React.useCallback((id: string, x: number, y: number) => {
        window.pywebview?.api?.update_node_position(id, x, y);
        setLayoutCache(prev => {
            const next = { ...prev, [id]: { x, y } };
            localStorage.setItem('antigravity_layout_cache', JSON.stringify(next));
            return next;
        });
        setActiveGraph((prev: any) => ({
            ...prev,
            layout: { ...prev.layout, [id]: { x, y } }
        }));
    }, []);

    useEffect(() => {
        if (activeGraph.layout || activeGraph.nodes) {
            setLayoutCache(prev => {
                const next = { ...prev };
                let changed = false;
                // Only apply backend positions for nodes that DON'T already have a local position
                // This prevents overwriting user-dragged positions with stale backend data
                if (activeGraph.layout) {
                    Object.entries(activeGraph.layout).forEach(([id, p]: any) => {
                        if (p.x > 50 && p.y > 50 && !prev[id]) {
                            next[id] = p;
                            changed = true;
                        }
                    });
                }
                activeGraph.nodes?.forEach((n: any) => {
                    if (n.manual_pos && n.manual_pos.x > 50 && n.manual_pos.y > 50 && !prev[n.id]) {
                        next[n.id] = n.manual_pos;
                        changed = true;
                    }
                });
                if (changed) {
                    localStorage.setItem('antigravity_layout_cache', JSON.stringify(next));
                    return next;
                }
                return prev;
            });
        }
    }, [activeGraph.layout, activeGraph.nodes]);

    useEffect(() => {
        const fetchGraph = async () => {
            if (window.pywebview?.api?.get_active_graph) {
                const graph = await window.pywebview.api.get_active_graph(simulationPrompt);
                setActiveGraph(graph);
            } else {
                // Mock graph for browser testing
                setActiveGraph({
                    nodes: [
                        { id: 'workflow', label: 'Workflow', file: 'workflow.md', role: 'base', active: true, in_flow: true },
                        { id: 'logging', label: 'Logging', file: 'logging.md', role: 'global', active: true, in_flow: false }
                    ],
                    edges: [],
                    trace: {},
                    layout: {
                        'workflow': { x: 100, y: 100 },
                        'logging': { x: 400, y: 100 }
                    }
                });
            }
        };
        fetchGraph();
    }, [simulationPrompt, ruleMap]);

    return (
        <motion.div 
            key="flow-diagram-dynamic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col gap-6 p-2 overflow-hidden relative"
        >
            <header className="flex items-center justify-between z-20">
                <div className="flex-1">
                   <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                      <Zap className="text-accent fill-accent" size={24} />
                      Dynamic Execution Graph
                   </h2>
                   <div className="mt-4 flex items-center gap-4 max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={16} />
                            <input 
                                value={simulationPrompt}
                                onChange={e => setSimulationPrompt(e.target.value)}
                                placeholder="Simulate user input (e.g. 'araştırma yap')..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-accent outline-none focus:bg-white/10 transition-all font-medium"
                            />
                        </div>
                        {activeGraph.trace?.active_flow && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400">
                                <Activity size={14} className="animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Active Path: {activeGraph.trace.active_flow}</span>
                            </div>
                        )}
                        <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest bg-white/5 px-4 py-3 rounded-2xl border border-white/10">
                            Auto-Link Active
                        </div>
                   </div>
                   {activeGraph.suggestion && (
                       <motion.div 
                           initial={{ opacity: 0, y: -10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="mt-4 flex items-center gap-3 p-3 rounded-[1.5rem] bg-accent/20 border border-accent/40 text-accent w-fit"
                       >
                           <Zap size={14} className="fill-accent" />
                           <span className="text-[10px] font-black uppercase tracking-tighter">Next Suggested Step:</span>
                           <span className="px-2 py-0.5 bg-accent text-white rounded-lg text-[10px] font-black">{activeGraph.suggestion.toUpperCase()}</span>
                       </motion.div>
                   )}
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-accent text-white font-bold transition-all"
                >
                    <Plus size={18} />
                    {isAdding ? 'Cancel' : 'New Component'}
                </button>
            </header>

            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="glass rounded-[2rem] p-8 overflow-hidden border-accent/20 z-20 mb-4"
                    >
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2 px-1">Component ID</label>
                                    <input 
                                        value={newRule.id}
                                        onChange={e => setNewRule({...newRule, id: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2 px-1">Role Type</label>
                                    <select 
                                        value={newRule.role}
                                        onChange={e => setNewRule({...newRule, role: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none [&>option]:bg-[#1a1a1a]"
                                    >
                                        <option value="base">Base (Primary Logic)</option>
                                        <option value="global">Global (System Wide)</option>
                                        <option value="dependent">Dependent (Child Node)</option>
                                        <option value="optional">Optional (Analysis)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2 px-1">Global Triggers (Comma separated)</label>
                                    <input 
                                        value={newRule.intent}
                                        onChange={e => setNewRule({...newRule, intent: e.target.value})}
                                        placeholder="documentation, planning, log"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                                    />
                                </div>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2 px-1">Logic Dependencies</label>
                                        <input 
                                            value={newRule.dependencies}
                                            onChange={e => setNewRule({...newRule, dependencies: e.target.value})}
                                            placeholder="workflow, terminal"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                                        />
                                    </div>
                                    <button 
                            onClick={() => {
                                localStorage.removeItem('antigravity_layout_cache');
                                setLayoutCache({});
                                window.location.reload();
                            }}
                            className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 group"
                            title="Reset Layout"
                        >
                            <Layout className="w-4 h-4 text-white/40 group-hover:text-white" />
                            <span className="text-xs text-white/40 group-hover:text-white">Reset Layout</span>
                        </button>
                        <button 
                                        onClick={() => {
                                            onAdd({
                                                ...newRule,
                                                triggers: newRule.intent.split(',').map(s => s.trim()),
                                                patterns: newRule.intent.split(',').map(s => s.trim()),
                                                dependencies: newRule.dependencies.split(',').map(s => s.trim()).filter(s => s),
                                                tags: newRule.tags.split(',').map(s => s.trim())
                                            });
                                            setIsAdding(false);
                                        }}
                                        className="h-[46px] px-8 rounded-xl bg-accent text-white font-black text-xs hover:bg-accent/80 transition-all"
                                    >
                                        ADD COMPONENT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div 
                id="graph-canvas"
                className="flex-1 relative glass rounded-[3.5rem] overflow-hidden group select-none grid-bg"
                style={{ touchAction: 'none' }}
                onMouseMove={(e) => {
                    if (drawingEdge) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const mx = e.clientX - rect.left;
                        const my = e.clientY - rect.top;
                        mousePosRef.current = { x: mx, y: my };
                        // Direct DOM update — no state, no re-render
                        if (drawingLineRef.current) {
                            const tx = snapTarget ? snapTarget.x + 90 : mx;
                            const ty = snapTarget ? snapTarget.y + 40 : my;
                            drawingLineRef.current.setAttribute('d', `M ${drawingEdge.x} ${drawingEdge.y} L ${tx} ${ty}`);
                        }
                    }
                }}
                onMouseUp={() => {
                    if (drawingEdge && !snapTarget) {
                        setDrawingEdge(null);
                    }
                }}
                onMouseLeave={() => setDrawingEdge(null)}
            >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                        <filter id="activeGlow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    
                    {activeGraph.edges?.map((edge, i) => {
                        // Use layoutCache for edge stability as well
                        const start = layoutCache[edge.source] || activeGraph.layout?.[edge.source];
                        const end = layoutCache[edge.target] || activeGraph.layout?.[edge.target];
                        if (!start || !end) return null;

                        const sourceNode = activeGraph.nodes.find(n => n.id === edge.source);
                        const targetNode = activeGraph.nodes.find(n => n.id === edge.target);
                        const isActive = sourceNode?.active && targetNode?.active;
                        
                        // Color based on edge type
                        let strokeColor = "rgba(255,255,255,0.05)";
                        if (isActive) {
                            strokeColor = edge.type === 'flow' ? "#00ff9d" : "#00d2ff";
                        }

                        const d = `M ${start.x + 100} ${start.y + 40} C ${start.x + 200} ${start.y + 40}, ${end.x - 100} ${end.y + 40}, ${end.x} ${end.y + 40}`;
                        
                        return (
                            <motion.path
                                key={`edge-${i}`}
                                d={d}
                                stroke={strokeColor}
                                strokeWidth={isActive ? 4 : 2}
                                strokeDasharray={edge.type === 'flow' ? "0" : "6 4"}
                                fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8 }}
                                style={{ 
                                    filter: isActive ? 'drop-shadow(0 0 8px ' + strokeColor + ')' : 'none',
                                    opacity: isActive ? 1 : 0.1
                                }}
                            />
                        );
                    })}
                    {drawingEdge && (
                        <path 
                            ref={drawingLineRef}
                            d={`M ${drawingEdge.x} ${drawingEdge.y} L ${drawingEdge.x} ${drawingEdge.y}`}
                            stroke={snapTarget ? "#00ff9d" : "#3b82f6"} 
                            strokeWidth={snapTarget ? 6 : 4} 
                            fill="none"
                            strokeDasharray="10 5"
                            style={{ 
                                filter: snapTarget ? 'drop-shadow(0 0 15px #00ff9d)' : 'drop-shadow(0 0 12px #3b82f6)',
                                pointerEvents: 'none'
                            }}
                        />
                    )}
                </svg>

                {activeGraph.nodes?.map((node: any, idx: number) => {
                    // Deterministik Hash-based Fallback: Nodes will NEVER cluster at 0,0 even without order.
                    const hash = stringToHash(node.id);
                    const defaultPos = { 
                        x: (hash % 4) * 220 + 100, 
                        y: Math.floor((hash / 4) % 4) * 160 + 100 
                    };
                    const pos = layoutCache[node.id] || node.manual_pos || defaultPos;
                    const score = activeGraph.trace?.scores?.[node.id];
                    
                    return (
                        <RuleNode 
                            key={node.id}
                            node={node}
                            pos={pos}
                            score={score}
                            simulationPrompt={simulationPrompt}
                            activeGraph={activeGraph}
                            setActiveGraph={setActiveGraph}
                            setHoveredNode={setHoveredNode}
                            hoveredNode={hoveredNode}
                            drawingEdge={drawingEdge}
                            setDrawingEdge={setDrawingEdge}
                            setSnapTarget={setSnapTarget}
                            snapTarget={snapTarget}
                            onDelete={async (id: string) => {
                                // Call parent delete
                                onDelete(id);
                                // Also remove from local graph immediately for instant UI feedback
                                setActiveGraph((prev: any) => ({
                                    ...prev,
                                    nodes: prev.nodes.filter((n: any) => n.id !== id),
                                    edges: prev.edges.filter((e: any) => e.source !== id && e.target !== id)
                                }));
                                // Refresh from backend after a short delay
                                setTimeout(async () => {
                                    if (window.pywebview?.api?.get_active_graph) {
                                        const g = await window.pywebview.api.get_active_graph(simulationPrompt);
                                        setActiveGraph(g);
                                    }
                                }, 500);
                            }}
                            onUpdatePos={handleUpdatePos}
                        />
                    );
                })}
            </div>

            <div className="z-10 bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <div className="flex gap-8">
                        <div>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-1">Execution Order</span>
                            <div className="flex items-center gap-2">
                                {activeGraph.nodes?.map((n, i) => (
                                    <React.Fragment key={n.id}>
                                        <span className={`text-xs font-bold ${n.active ? (n.is_current ? 'text-accent' : 'text-white') : 'text-white/30'}`}>
                                            {n.is_current && "→ "}{n.id}
                                        </span>
                                        {i < activeGraph.nodes.length - 1 && <ChevronRight size={12} className="text-white/10" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        {activeGraph.trace?.state?.history?.length > 0 && (
                            <div className="h-full border-l border-white/10 pl-8 flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-1">State History</span>
                                <div className="text-[10px] text-white/40 truncate max-w-[200px]">
                                    {activeGraph.trace.state.history.slice(-3).map((h: any) => h.node).join(' » ')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default App;
