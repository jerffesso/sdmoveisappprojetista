
import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, ToolMode, ViewportMode, ProjectDimensions, FurnitureModule, Contract } from './types';
import { generateRealisticRender, generateDesignFromPrompt, generateProjectVideo, generateAiChatResponse } from './services/geminiService';
import ThreePreview from './components/ThreePreview';

const MODULE_LIBRARY = [
  { type: 'Balcão Base 2P', category: 'Cozinha', price: 1250, icon: 'border-bottom', w: 800, h: 720, d: 580 },
  { type: 'Aéreo Lux Basculante', category: 'Cozinha', price: 980, icon: 'border-top', w: 800, h: 400, d: 350 },
  { type: 'Painel Ripado SD', category: 'Sala', price: 1800, icon: 'align-justify', w: 1200, h: 2600, d: 45 },
  { type: 'Torre Fornos 2P', category: 'Cozinha', price: 2450, icon: 'columns', w: 600, h: 2200, d: 580 },
  { type: 'Sofá Living SD', category: 'Decoração', price: 3500, icon: 'couch', w: 2200, h: 450, d: 900 },
  { type: 'Ilha Gourmet', category: 'Cozinha', price: 4200, icon: 'square', w: 1800, h: 900, d: 900 },
];

const FINISHES = [
  { name: 'Branco Tx', color: '#ffffff' },
  { name: 'Louredo Matt', color: '#d4af37' },
  { name: 'Grafite Silk', color: '#444444' },
  { name: 'Carvalho SD', color: '#a67b5b' },
  { name: 'Preto Absoluto', color: '#1a1a1a' },
];

const INITIAL_CONTRACTS: Contract[] = [
  { id: '1', clientName: 'Ricardo Almeida', document: '123.456.789-00', projectName: 'Cozinha Gourmet Lux', value: 45000, status: 'Produção', date: '10/02/2024', email: 'ricardo@email.com', phone: '(11) 98888-7777', paymentStatus: 'Parcial' },
  { id: '2', clientName: 'Juliana Silva', document: '987.654.321-11', projectName: 'Apartamento Integrado', value: 82000, status: 'Assinado', date: '15/02/2024', email: 'juliana@email.com', phone: '(11) 97777-6666', paymentStatus: 'Pago' },
  { id: '3', clientName: 'Marcos Oliveira', document: '555.444.333-22', projectName: 'Suíte Master SD', value: 32000, status: 'Em Negociação', date: '18/02/2024', email: 'marcos@email.com', phone: '(11) 96666-5555', paymentStatus: 'Pendente' },
];

const App: React.FC = () => {
  const [authState, setAuthState] = useState<'SELECT' | 'LOGIN' | 'ADMIN' | 'CLIENT'>('SELECT');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'CLIENT'>('ADMIN');
  const [password, setPassword] = useState("");
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [tool, setTool] = useState<ToolMode>(ToolMode.SELECT);
  const [viewport, setViewport] = useState<ViewportMode>(ViewportMode.PERSPECTIVE);
  
  const [activeProject, setActiveProject] = useState<ProjectDimensions>({
    id: '1', name: 'Projeto Residencial SD', clientName: 'Ricardo Almeida',
    modules: [], floorWidth: 6000, floorDepth: 5000, wallHeight: 2700,
    settings: { floorTexture: 'porcelanato', wallColor: '#ffffff', ceilingVisible: false }
  });
  
  const [contracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLoadingMessage, setAiLoadingMessage] = useState("Iniciando IA...");
  const [renderResult, setRenderResult] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'PROPS' | 'AMBIENTE' | 'LIST'>('PROPS');
  
  // CRM State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: '1', sender: 'client', text: 'Oi! O projeto está indo para a fábrica quando?', time: '14:32' }
  ]);

  const selectedModule = useMemo(() => activeProject.modules.find(m => m.id === selectedId), [activeProject.modules, selectedId]);

  const updateSelectedModule = (updates: Partial<FurnitureModule>) => {
    if (!selectedId) return;
    setActiveProject(p => ({
      ...p,
      modules: p.modules.map(m => m.id === selectedId ? { ...m, ...updates } : m)
    }));
  };

  const moveModule = (axis: 'x' | 'y' | 'z', amount: number) => {
    if (!selectedModule) return;
    updateSelectedModule({ [axis]: (selectedModule[axis as keyof FurnitureModule] as number) + amount });
  };

  const addModule = (item: any) => {
    const mod: FurnitureModule = {
      id: Math.random().toString(36).substr(2, 9),
      type: item.type, category: item.category, price: item.price,
      width: item.w, height: item.h, depth: item.d, 
      x: 0, y: 0, z: 0,
      finish: 'Branco Tx', isRipado: item.type.includes('Ripado'), rotation: 0
    };
    setActiveProject(p => ({ ...p, modules: [...p.modules, mod] }));
    setSelectedId(mod.id);
    setView(ViewMode.PROMOB);
  };

  const handleLogin = () => {
    if (selectedRole === 'ADMIN') {
      setAuthState('ADMIN');
      setView(ViewMode.DASHBOARD);
    } else {
      setAuthState('CLIENT');
      setView(ViewMode.CLIENT_PORTAL);
    }
  };

  const handleAiDesign = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoadingMessage("IA SD projetando seu ambiente...");
    setIsAiLoading(true);
    try {
      const result = await generateDesignFromPrompt(aiPrompt);
      if (result && result.modules) {
        const newModules: FurnitureModule[] = result.modules.map((m: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: m.type || 'Módulo IA',
          category: 'IA Generated',
          width: Number(m.width) || 800,
          height: Number(m.height) || 720,
          depth: Number(m.depth) || 580,
          x: Number(m.x) || 0,
          y: Number(m.y) || 0,
          z: Number(m.z) || 0,
          rotation: Number(m.rotation) || 0,
          finish: 'Branco Tx',
          isRipado: String(m.type || '').toLowerCase().includes('ripado'),
          price: 1500
        }));
        setActiveProject(p => ({ ...p, modules: [...p.modules, ...newModules] }));
        setAiPrompt("");
      }
    } catch (error) {
      console.error("AI Design process failed", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleVideoGeneration = async () => {
    try {
      // @ts-ignore
      if (!(await window.aistudio.hasSelectedApiKey())) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
      setAiLoadingMessage("Gerando Vídeo 3D Realista... Isso pode levar alguns minutos.");
      setIsAiLoading(true);
      const url = await generateProjectVideo(activeProject.name);
      setVideoResult(url);
    } catch (error) {
      alert("Erro ao gerar vídeo. Certifique-se de ter uma chave API com cobrança ativada.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiReply = async () => {
    if (chatMessages.length === 0) return;
    const lastClientMsg = [...chatMessages].reverse().find(m => m.sender === 'client');
    if (!lastClientMsg) return;

    setAiLoadingMessage("IA SD formulando resposta profissional...");
    setIsAiLoading(true);
    const reply = await generateAiChatResponse(lastClientMsg.text, `Cliente: ${activeProject.clientName}, Projeto: ${activeProject.name}`);
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai_suggest', text: reply, time: 'Agora' }]);
    setIsAiLoading(false);
  };

  const projectTotal = useMemo(() => activeProject.modules.reduce((acc, m) => acc + m.price, 0), [activeProject.modules]);
  const totalSales = useMemo(() => contracts.reduce((acc, c) => acc + c.value, 0), [contracts]);

  if (authState === 'SELECT') {
    return (
      <div className="login-screen font-sans p-6">
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full animate-fade-in">
          <SelectionCard 
            title="Área Projetista" 
            desc="Painel do Projetista: Promob 3D, IA Designer, Gestão de Vendas e CRM WhatsApp." 
            icon="drafting-compass" 
            onClick={() => { setSelectedRole('ADMIN'); setAuthState('LOGIN'); }}
          />
          <SelectionCard 
            title="Área Cliente" 
            desc="Acompanhe sua obra, visualize renders ultra-realistas e vídeos do seu projeto." 
            icon="hand-holding-heart" 
            gold
            onClick={() => { setSelectedRole('CLIENT'); setAuthState('LOGIN'); }}
          />
        </div>
      </div>
    );
  }

  if (authState === 'LOGIN') {
    return (
      <div className="login-screen font-sans p-6">
        <div className="glass-card w-full max-w-[480px] p-12 flex flex-col items-center animate-fade-in">
          <div className="sd-logo-box mb-10 shadow-2xl w-28 h-28">
             <span className="text-5xl sd-gold-text">SD</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">SD Móveis Pro</h2>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-12 opacity-60">SISTEMA INTELIGENTE</p>
          
          <div className="w-full space-y-6">
            <input 
              type="password" 
              placeholder="Digite sua senha" 
              className="w-full h-16 bg-white border border-blue-100 rounded-3xl px-8 font-bold text-gray-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-center placeholder:opacity-40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button 
              onClick={handleLogin}
              className="w-full h-16 btn-blue text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl active:scale-[0.98] transition-all"
            >
              Acessar Sistema
            </button>
          </div>
          <button onClick={() => setAuthState('SELECT')} className="mt-10 text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] hover:text-blue-500 transition-colors">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      {/* Sidebar Principal */}
      <aside className="w-24 bg-white border-r border-amber-50 flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-14 h-14 sd-logo-box rounded-[20px] cursor-pointer hover:scale-105 transition-all shadow-md" onClick={() => setView(authState === 'ADMIN' ? ViewMode.DASHBOARD : ViewMode.CLIENT_PORTAL)}>
          <span className="text-2xl sd-gold-text">SD</span>
        </div>
        
        <div className="flex flex-col gap-6">
          {authState === 'ADMIN' ? (
            <>
              <NavIcon icon="chart-line" label="Dash" active={view === ViewMode.DASHBOARD} onClick={() => setView(ViewMode.DASHBOARD)} />
              <NavIcon icon="cube" label="Promob" active={view === ViewMode.PROMOB} onClick={() => setView(ViewMode.PROMOB)} />
              <NavIcon icon="file-contract" label="Vendas" active={view === ViewMode.CONTRACTS} onClick={() => setView(ViewMode.CONTRACTS)} />
              <NavIcon icon="whatsapp" label="CRM" active={view === ViewMode.CRM} onClick={() => setView(ViewMode.CRM)} isFab />
            </>
          ) : (
            <>
              <NavIcon icon="tachometer-alt" label="Home" active={view === ViewMode.CLIENT_PORTAL} onClick={() => setView(ViewMode.CLIENT_PORTAL)} />
              <NavIcon icon="camera-retro" label="3D" active={view === ViewMode.PORTFOLIO} onClick={() => setView(ViewMode.PORTFOLIO)} />
              <NavIcon icon="headset" label="Suporte" active={view === ViewMode.CRM} onClick={() => setView(ViewMode.CRM)} />
            </>
          )}
        </div>
        
        <button 
          onClick={() => { setAuthState('SELECT'); setPassword(""); }} 
          className="mt-auto w-12 h-12 rounded-2xl text-gray-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
        >
          <i className="fas fa-power-off text-2xl"></i>
        </button>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white">
        {view === ViewMode.DASHBOARD && (
          <div className="flex-1 p-16 md:p-20 overflow-y-auto animate-fade-in">
             <header className="mb-16 flex justify-between items-end">
               <div>
                 <h1 className="text-6xl font-black text-gray-900 mb-2 uppercase tracking-tighter leading-none">Painel</h1>
                 <p className="text-amber-600 font-black uppercase tracking-[0.6em] text-[10px]">Visão Estratégica SD Móveis</p>
               </div>
               <div className="bg-gray-50 px-8 py-5 rounded-3xl flex items-center gap-6 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm shadow-md"><i className="fas fa-bolt"></i></div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Status</p>
                    <p className="text-sm font-bold text-gray-900">Online</p>
                  </div>
               </div>
             </header>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
               <DashboardStat title="Faturamento" value={`R$ ${totalSales.toLocaleString('pt-BR')}`} icon="wallet" dark />
               <DashboardStat title="Fábrica" value="14" icon="industry" />
               <DashboardStat title="Logística" value="06" icon="truck-loading" />
               <DashboardStat title="CRM Aberto" value="23" icon="comment-alt" color="text-blue-500" />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="bg-[#fcfcfc] border border-gray-100 p-10 rounded-[40px] shadow-sm">
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Negociações Recentes</h3>
                  <div className="space-y-4">
                    {contracts.map(c => (
                      <div key={c.id} className="bg-white p-6 rounded-2xl flex justify-between items-center border border-gray-50 hover:border-amber-200 transition-all cursor-pointer shadow-sm">
                        <div className="flex gap-6 items-center">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><i className="fas fa-file-invoice-dollar"></i></div>
                          <p className="font-black text-gray-900 text-lg uppercase tracking-tighter leading-none">{c.clientName}</p>
                        </div>
                        <span className="text-amber-600 font-black text-xl font-mono">R$ {(c.value/1000).toFixed(0)}k</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-gray-900 text-white p-10 rounded-[40px] relative overflow-hidden group shadow-2xl">
                  <i className="fas fa-robot absolute -right-12 -bottom-12 text-[150px] opacity-10"></i>
                  <h3 className="text-2xl font-black uppercase mb-6 tracking-tighter">SD IA Insights</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-sm">Você tem 5 orçamentos pendentes de resposta no WhatsApp. A IA sugere uma campanha de 10% OFF para fechamento imediato.</p>
                  <div className="flex gap-4 relative z-10">
                    <button className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-700 shadow-xl transition-all">Iniciar Campanha</button>
                    <button onClick={() => setView(ViewMode.CRM)} className="bg-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all">Ir para CRM</button>
                  </div>
               </div>
             </div>
          </div>
        )}

        {view === ViewMode.PROMOB && (
          <>
            <div className="h-20 bg-white border-b flex items-center px-8 gap-8 shadow-sm z-40">
              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                <ToolBtn icon="mouse-pointer" label="Seta" active={tool === ToolMode.SELECT} onClick={() => setTool(ToolMode.SELECT)} />
                <ToolBtn icon="arrows-alt" label="Mover" active={tool === ToolMode.MOVE} onClick={() => setTool(ToolMode.MOVE)} />
                <ToolBtn icon="sync" label="Girar" active={tool === ToolMode.ROTATE} onClick={() => setTool(ToolMode.ROTATE)} />
              </div>
              
              <div className="flex bg-amber-50 p-1.5 rounded-2xl border border-amber-100 shadow-inner">
                <ToolBtn icon="video" label="Persp" active={viewport === ViewportMode.PERSPECTIVE} onClick={() => setViewport(ViewportMode.PERSPECTIVE)} color="amber" />
                <ToolBtn icon="map" label="Topo" active={viewport === ViewportMode.TOP} onClick={() => setViewport(ViewportMode.TOP)} color="amber" />
                <ToolBtn icon="ruler-combined" label="Cotas" active={viewport === ViewportMode.ENGINEER} onClick={() => setViewport(ViewportMode.ENGINEER)} color="amber" />
              </div>
              
              <div className="flex gap-4">
                <button onClick={async () => {
                  setIsAiLoading(true);
                  setAiLoadingMessage("Gerando Render de Alta Qualidade...");
                  const base64 = await generateRealisticRender({ room: activeProject.name, finish: "Luxo SD" });
                  if (base64) setRenderResult(`data:image/png;base64,${base64}`);
                  setIsAiLoading(false);
                }} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-3">
                  <i className="fas fa-camera-retro text-amber-500"></i> Render IA
                </button>

                <button onClick={handleVideoGeneration} className="bg-amber-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-amber-700 transition-all flex items-center gap-3">
                  <i className="fas fa-video"></i> Gerar Vídeo 3D
                </button>
              </div>

              <div className="ml-auto flex items-center gap-8">
                <div className="relative group hidden xl:block">
                  <input 
                    type="text" 
                    placeholder="Sugestão IA: 'Cozinha moderna com ilha'..." 
                    className="bg-gray-50 border-2 border-gray-100 px-10 py-3 rounded-2xl w-80 text-xs font-bold outline-none focus:border-amber-400 focus:bg-white transition-all shadow-inner"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiDesign()}
                  />
                  <button onClick={handleAiDesign} className="absolute right-2 top-2 bg-amber-600 text-white w-8 h-8 rounded-xl flex items-center justify-center hover:bg-amber-700 shadow-lg"><i className="fas fa-magic text-[10px]"></i></button>
                </div>
                <div className="text-right border-l pl-8 border-gray-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Projeto</p>
                  <p className="text-xl font-black text-gray-900 font-mono">R$ {projectTotal.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <aside className="w-80 bg-white border-r flex flex-col shadow-inner z-30">
                <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Módulos SD</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {MODULE_LIBRARY.map(item => (
                    <div key={item.type} onClick={() => addModule(item)} className="group p-5 bg-white border-2 border-gray-50 rounded-3xl hover:border-amber-500 hover:shadow-xl cursor-pointer transition-all flex items-center gap-6">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-amber-500 group-hover:bg-amber-50 transition-colors shadow-inner">
                        <i className={`fas fa-${item.icon} text-xl`}></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase text-gray-800 leading-none mb-1">{item.type}</span>
                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-0.5 rounded-full w-fit uppercase">{item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              <div className="flex-1 relative bg-white overflow-hidden promob-grid">
                <ThreePreview 
                  modules={activeProject.modules}
                  floorWidth={activeProject.floorWidth}
                  floorDepth={activeProject.floorDepth}
                  wallHeight={activeProject.wallHeight}
                  selectedModuleId={selectedId}
                  viewportMode={viewport}
                  toolMode={tool}
                  onSelectModule={setSelectedId}
                />
              </div>

              <aside className="w-96 bg-white border-l p-8 shadow-2xl flex flex-col z-30">
                <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-10 shadow-inner">
                  <InspectorTab active={rightPanelTab === 'PROPS'} label="Módulo" onClick={() => setRightPanelTab('PROPS')} />
                  <InspectorTab active={rightPanelTab === 'AMBIENTE'} label="Ambiente" onClick={() => setRightPanelTab('AMBIENTE')} />
                  <InspectorTab active={rightPanelTab === 'LIST'} label="Itens" onClick={() => setRightPanelTab('LIST')} />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {rightPanelTab === 'PROPS' && (
                    selectedModule ? (
                      <div className="space-y-8 animate-fade-in">
                        <header className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-black tracking-tighter text-gray-900 uppercase leading-none mb-2">{selectedModule.type}</h3>
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">ID: {selectedModule.id}</span>
                          </div>
                          <button onClick={() => { setActiveProject(p => ({ ...p, modules: p.modules.filter(m => m.id !== selectedId) })); setSelectedId(null); }} className="w-12 h-12 rounded-2xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fas fa-trash-alt"></i></button>
                        </header>

                        <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 shadow-inner">
                           <div className="grid grid-cols-3 gap-4 max-w-[180px] mx-auto mb-10">
                              <div></div>
                              <MoveBtn icon="chevron-up" onClick={() => moveModule('z', -100)} />
                              <div></div>
                              <MoveBtn icon="chevron-left" onClick={() => moveModule('x', -100)} />
                              <div className="flex items-center justify-center bg-white rounded-full shadow-lg text-amber-600"><i className="fas fa-arrows-alt"></i></div>
                              <MoveBtn icon="chevron-right" onClick={() => moveModule('x', 100)} />
                              <div></div>
                              <MoveBtn icon="chevron-down" onClick={() => moveModule('z', 100)} />
                              <div></div>
                           </div>
                        </div>

                        <div className="space-y-6">
                          <PropInput label="Largura" value={selectedModule.width} unit="mm" onChange={(v) => updateSelectedModule({ width: v })} />
                          <PropInput label="Altura" value={selectedModule.height} unit="mm" onChange={(v) => updateSelectedModule({ height: v })} />
                          <PropInput label="Profundidade" value={selectedModule.depth} unit="mm" onChange={(v) => updateSelectedModule({ depth: v })} />
                        </div>

                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Acabamento</p>
                           <div className="flex flex-wrap gap-4 px-2">
                              {FINISHES.map(f => (
                                <button key={f.name} onClick={() => updateSelectedModule({ finish: f.name })} className={`w-10 h-10 rounded-full border-4 transition-all ${selectedModule.finish === f.name ? 'border-amber-500 scale-115 shadow-lg' : 'border-transparent shadow-sm'}`} style={{ backgroundColor: f.color }} title={f.name} />
                              ))}
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                        <i className="fas fa-mouse-pointer text-4xl mb-6"></i>
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 leading-relaxed">Arraste módulos para iniciar</p>
                      </div>
                    )
                  )}

                  {rightPanelTab === 'AMBIENTE' && (
                    <div className="space-y-10 animate-fade-in">
                      <header>
                        <h3 className="text-2xl font-black tracking-tighter text-gray-900 mb-2 uppercase">Medidas</h3>
                      </header>
                      <div className="space-y-8">
                        <PropInput label="Largura Sala" value={activeProject.floorWidth} unit="mm" max={15000} onChange={(v) => setActiveProject(p => ({...p, floorWidth: v}))} />
                        <PropInput label="Profundidade" value={activeProject.floorDepth} unit="mm" max={15000} onChange={(v) => setActiveProject(p => ({...p, floorDepth: v}))} />
                        <PropInput label="Pé Direito" value={activeProject.wallHeight} unit="mm" max={6000} onChange={(v) => setActiveProject(p => ({...p, wallHeight: v}))} />
                      </div>
                    </div>
                  )}

                  {rightPanelTab === 'LIST' && (
                    <div className="space-y-4 animate-fade-in">
                       {activeProject.modules.map(mod => (
                         <div key={mod.id} className="p-6 bg-white border border-gray-50 rounded-3xl flex justify-between items-center shadow-sm hover:border-amber-200 transition-all">
                            <div>
                                <p className="text-[11px] font-black uppercase text-gray-900 leading-none mb-1">{mod.type}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{mod.width}x{mod.height}mm</p>
                            </div>
                            <span className="text-amber-600 font-black text-base">R$ {mod.price}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}

        {view === ViewMode.CONTRACTS && (
          <div className="flex-1 p-16 md:p-20 overflow-y-auto animate-fade-in">
             <header className="mb-16">
               <h1 className="text-6xl font-black text-gray-900 mb-2 uppercase tracking-tighter leading-none">Vendas</h1>
               <p className="text-amber-600 font-black uppercase tracking-[0.6em] text-[10px]">Gestão de Contratos e Pagamentos</p>
             </header>

             <div className="grid grid-cols-1 gap-8">
               {contracts.map(contract => (
                 <div key={contract.id} className="bg-white border-2 border-gray-50 p-10 rounded-[40px] shadow-sm flex flex-col md:flex-row justify-between items-center gap-10 hover:border-amber-200 transition-all">
                    <div className="flex gap-8 items-center flex-1">
                       <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-amber-600 text-3xl shadow-inner">
                          <i className="fas fa-file-contract"></i>
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-1">{contract.clientName}</h3>
                          <p className="text-amber-600 font-black uppercase text-[10px] tracking-widest">{contract.projectName}</p>
                          <div className="flex gap-6 mt-4">
                             <span className="text-[10px] font-bold text-gray-400 uppercase"><i className="fas fa-calendar-alt mr-2"></i> {contract.date}</span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase"><i className="fas fa-id-card mr-2"></i> {contract.document}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-2">
                       <p className="text-4xl font-black text-gray-900 font-mono tracking-tighter">R$ {contract.value.toLocaleString('pt-BR')}</p>
                       <span className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${contract.paymentStatus === 'Pago' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                          Status: {contract.paymentStatus}
                       </span>
                    </div>
                    <div className="flex gap-4">
                       <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black">Emitir Contrato</button>
                       <button className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-amber-700">Ver Projeto</button>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {view === ViewMode.CLIENT_PORTAL && (
          <div className="flex-1 p-16 md:p-20 overflow-y-auto animate-fade-in">
             <header className="mb-16">
               <h1 className="text-6xl font-black text-gray-900 mb-2 uppercase tracking-tighter leading-none">Minha Casa SD</h1>
               <p className="text-amber-600 font-black uppercase tracking-[0.8em] text-[10px]">Portal VIP • {activeProject.clientName}</p>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
               <div className="bg-white border-2 border-gray-50 p-12 rounded-[50px] text-center shadow-sm">
                  <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 shadow-md border-4 border-white"><i className="fas fa-hammer"></i></div>
                  <h3 className="text-3xl font-black uppercase mb-4 tracking-tighter">Status: Produção</h3>
                  <div className="w-full bg-gray-100 h-3 rounded-full mt-12 overflow-hidden border border-gray-50 p-0.5">
                    <div className="bg-amber-600 h-full w-[75%] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase mt-4 text-gray-400 tracking-widest">
                    <span>Iniciado</span>
                    <span className="text-amber-600">Entrega Prevista: 15/03</span>
                  </div>
               </div>

               <div className="bg-gray-900 p-12 rounded-[50px] text-white flex flex-col justify-between group overflow-hidden relative shadow-2xl">
                  <i className="fas fa-video absolute -right-8 -bottom-8 text-9xl opacity-10 group-hover:scale-110 transition-transform duration-1000"></i>
                  <div>
                    <h3 className="text-3xl font-black uppercase mb-4 tracking-tighter leading-none">Galeria 3D</h3>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-xs">Veja os renders fotorrealistas e vídeos gerados pela nossa IA para o seu ambiente.</p>
                  </div>
                  <button onClick={() => setView(ViewMode.PORTFOLIO)} className="bg-amber-600 text-white px-10 py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest mt-12 self-start shadow-2xl hover:bg-amber-700 transition-all">Abrir Galeria</button>
               </div>
             </div>

             <div className="bg-gray-50 p-12 rounded-[50px] border border-gray-100">
                <h3 className="text-2xl font-black uppercase mb-10 tracking-tighter">Últimos Projetos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {[1,2,3].map(i => (
                     <div key={i} onClick={() => setView(ViewMode.PORTFOLIO)} className="aspect-video bg-gray-200 rounded-3xl cursor-pointer hover:opacity-80 transition-all border-4 border-white shadow-lg overflow-hidden relative group">
                        <div className="absolute inset-0 bg-amber-600/0 group-hover:bg-amber-600/20 transition-all flex items-center justify-center">
                           <i className="fas fa-image text-white opacity-0 group-hover:opacity-100 text-2xl"></i>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {view === ViewMode.PORTFOLIO && (
          <div className="flex-1 p-16 md:p-20 overflow-y-auto animate-fade-in">
             <header className="mb-16 flex justify-between items-end">
               <div>
                 <h1 className="text-6xl font-black text-gray-900 mb-2 uppercase tracking-tighter leading-none">Minha Galeria</h1>
                 <p className="text-amber-600 font-black uppercase tracking-[0.8em] text-[10px]">Realismo Fotorrealista SD</p>
               </div>
               {videoResult && (
                  <button onClick={() => window.open(videoResult)} className="bg-amber-600 text-white px-10 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3">
                     <i className="fas fa-play"></i> Assistir Vídeo do Projeto
                  </button>
               )}
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="group relative rounded-[40px] overflow-hidden shadow-2xl bg-gray-100 aspect-square border-8 border-white">
                     <img src={`https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800&auto=format&fit=crop`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[8s]" />
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-10 text-center backdrop-blur-sm">
                        <p className="text-white text-lg font-black uppercase mb-6 tracking-tighter">Cozinha de Luxo</p>
                        <button className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Baixar em 4K</button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === ViewMode.CRM && (
          <div className="flex-1 flex animate-fade-in">
             <aside className="w-96 border-r flex flex-col bg-gray-50/20">
                <div className="p-10 border-b bg-white">
                   <h2 className="text-3xl font-black uppercase mb-6 tracking-tighter">Atendimento</h2>
                   <div className="relative">
                    <input type="text" placeholder="Pesquisar..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none shadow-inner" />
                    <i className="fas fa-search absolute right-6 top-1/2 -translate-y-1/2 text-gray-300"></i>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                   <div className="p-8 border-b bg-white border-l-8 border-amber-600 flex gap-6 items-center cursor-pointer shadow-sm">
                      <div className="w-14 h-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">RA</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-black text-gray-900 uppercase truncate text-base leading-none">Ricardo Almeida</p>
                          <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">AGORA</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate font-medium italic">"Gostaria de ver o render..."</p>
                      </div>
                   </div>
                   <div className="p-8 border-b bg-white/50 opacity-60 flex gap-6 items-center cursor-pointer">
                      <div className="w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-500 font-black text-lg">JS</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 uppercase truncate text-base leading-none">Juliana Silva</p>
                        <p className="text-xs text-gray-400 truncate font-medium">Contrato assinado.</p>
                      </div>
                   </div>
                </div>
             </aside>
             <div className="flex-1 flex flex-col bg-[#f1f3f5] relative overflow-hidden">
                <header className="h-20 bg-white border-b flex items-center px-12 justify-between shadow-sm z-10">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-amber-600 text-white rounded-2xl flex items-center justify-center font-black shadow-xl relative">
                        RA
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div>
                        <p className="font-black text-gray-900 uppercase tracking-tighter text-xl leading-none mb-1">{activeProject.clientName}</p>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest opacity-60">Status: Aguardando Feedback</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={handleAiReply} className="bg-amber-100 text-amber-600 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:bg-amber-200 flex items-center gap-3">
                         <i className="fas fa-robot"></i> Responder com IA SD
                      </button>
                   </div>
                </header>
                <div className="flex-1 p-12 flex flex-col justify-end space-y-8 overflow-y-auto custom-scrollbar relative z-0">
                   {chatMessages.map(msg => (
                     <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`${msg.sender === 'client' ? 'bg-white text-gray-700' : msg.sender === 'ai_suggest' ? 'bg-amber-50 border-2 border-amber-200 text-amber-900' : 'bg-gray-900 text-white'} p-8 rounded-[40px] ${msg.sender === 'client' ? 'rounded-tl-none' : 'rounded-tr-none'} shadow-xl max-w-lg`}>
                           {msg.sender === 'ai_suggest' && <p className="text-[8px] font-black uppercase text-amber-600 mb-2 tracking-widest"><i className="fas fa-magic mr-2"></i> Sugestão IA Manager</p>}
                           <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                           <span className="text-[9px] font-black opacity-30 uppercase block mt-4 text-right">{msg.time}</span>
                           {msg.sender === 'ai_suggest' && (
                              <button 
                                onClick={() => {
                                   setChatMessages(prev => [...prev.filter(m => m.id !== msg.id), { id: Date.now().toString(), sender: 'admin', text: msg.text, time: 'Agora' }]);
                                }} 
                                className="mt-4 w-full bg-amber-600 text-white py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg"
                              >
                                Aprovar e Enviar no WhatsApp
                              </button>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
                <div className="h-32 bg-white border-t px-12 flex items-center gap-8 shadow-2xl z-10">
                   <button className="text-gray-300 hover:text-amber-600 transition-colors text-2xl"><i className="fas fa-paperclip"></i></button>
                   <input 
                     type="text" 
                     placeholder="Digite sua resposta..." 
                     className="flex-1 bg-gray-50 border-2 border-transparent focus:border-amber-400 rounded-3xl px-10 py-5 font-bold outline-none shadow-inner text-sm transition-all"
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && chatInput.trim()) {
                           setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'admin', text: chatInput, time: 'Agora' }]);
                           setChatInput("");
                        }
                     }}
                   />
                   <button 
                     onClick={() => {
                        if (chatInput.trim()) {
                           setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'admin', text: chatInput, time: 'Agora' }]);
                           setChatInput("");
                        }
                     }}
                     className="bg-amber-600 text-white w-20 h-16 rounded-[24px] flex items-center justify-center text-2xl shadow-2xl hover:bg-amber-700 transition-all active:scale-95"
                   >
                     <i className="fas fa-paper-plane"></i>
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* RENDER MODAL */}
      {renderResult && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-12 animate-fade-in duration-500">
           <div className="max-w-6xl w-full bg-white rounded-[80px] overflow-hidden relative border-[20px] border-white shadow-2xl group">
              <img src={renderResult} className="w-full h-full object-cover rounded-[60px] group-hover:scale-105 transition-transform duration-[15s]" />
              <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center bg-white/95 backdrop-blur-2xl px-12 py-8 rounded-[50px] shadow-2xl border border-amber-100">
                 <div>
                   <h3 className="text-3xl font-black tracking-tighter text-gray-900 uppercase mb-1">Design Realista SD</h3>
                   <p className="text-[10px] font-black text-amber-600 uppercase tracking-[1em] opacity-60">Visualização IA Ativa</p>
                 </div>
                 <div className="flex gap-6">
                    <button onClick={() => setRenderResult(null)} className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-amber-500 text-3xl hover:scale-110 shadow-lg transition-all border border-amber-50"><i className="fas fa-times"></i></button>
                    <button className="bg-green-500 text-white px-10 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-4 hover:bg-green-600 transition-all"><i className="fab fa-whatsapp text-xl"></i> Compartilhar WhatsApp</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {videoResult && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-12 animate-fade-in">
           <div className="max-w-6xl w-full bg-white rounded-[80px] overflow-hidden relative border-[20px] border-white shadow-2xl">
              <video src={videoResult} controls autoPlay className="w-full h-full object-cover rounded-[60px]" />
              <button onClick={() => setVideoResult(null)} className="absolute top-10 right-10 w-16 h-16 bg-white/20 hover:bg-white text-white hover:text-red-500 rounded-full flex items-center justify-center text-3xl transition-all"><i className="fas fa-times"></i></button>
           </div>
        </div>
      )}

      {/* LOADING IA */}
      {isAiLoading && (
        <div className="fixed inset-0 z-[300] bg-white/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-fade-in text-center p-20">
           <div className="w-48 h-48 bg-white border-[15px] border-amber-500 border-t-transparent rounded-[80px] animate-spin mb-16 shadow-2xl"></div>
           <h2 className="text-5xl font-black text-gray-900 uppercase tracking-tighter animate-pulse leading-tight max-w-4xl">{aiLoadingMessage}</h2>
           <p className="text-amber-600 font-black text-sm tracking-[1.5em] uppercase mt-10">Processamento SD PRO IA</p>
        </div>
      )}
    </div>
  );
};

// UI COMPONENTS
const SelectionCard: React.FC<{ title: string, desc: string, icon: string, gold?: boolean, onClick: () => void }> = ({ title, desc, icon, gold, onClick }) => (
  <div onClick={onClick} className={`flex-1 glass-card p-12 flex flex-col items-center text-center cursor-pointer hover:scale-[1.03] transition-all group ${gold ? 'border-4 border-amber-100' : 'border-4 border-transparent hover:border-blue-100'}`}>
    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl mb-10 shadow-xl transition-all duration-500 ${gold ? 'bg-amber-600 text-white group-hover:rotate-12' : 'bg-gray-900 text-white group-hover:bg-blue-600 group-hover:-rotate-12'}`}>
      <i className={`fas fa-${icon}`}></i>
    </div>
    <h3 className="text-3xl font-black text-gray-900 mb-6 leading-none uppercase tracking-tighter">{title}</h3>
    <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[260px]">{desc}</p>
    <div className={`mt-10 w-12 h-1 rounded-full ${gold ? 'bg-amber-500' : 'bg-gray-900 group-hover:bg-blue-500'} transition-all`}></div>
  </div>
);

const NavIcon: React.FC<{ icon: string, label: string, active?: boolean, onClick: () => void, isFab?: boolean }> = ({ icon, label, active, onClick, isFab }) => (
  <button onClick={onClick} className={`group flex flex-col items-center gap-2 transition-all ${active ? 'scale-110' : 'hover:scale-105'}`}>
    <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center text-xl transition-all duration-500 ${isFab ? 'bg-green-500 text-white shadow-xl' : active ? 'bg-amber-600 text-white shadow-xl' : 'text-amber-200 hover:bg-amber-50 hover:text-amber-600'}`}>
      <i className={`fab fa-${icon} ${icon.startsWith('fa') ? '' : 'fas fa-'+icon}`}></i>
    </div>
    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${active ? 'text-amber-600' : 'text-gray-300'}`}>{label}</span>
  </button>
);

const ToolBtn: React.FC<{ icon: string, label: string, active?: boolean, color?: 'gray'|'amber', onClick?: () => void }> = ({ icon, label, active, color = 'gray', onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-18 h-16 rounded-[18px] transition-all ${active 
    ? (color === 'amber' ? 'bg-amber-600 text-white shadow-lg scale-105' : 'bg-gray-900 text-white shadow-lg scale-105') 
    : 'text-gray-400 hover:bg-white hover:shadow-sm'}`}>
    <i className={`fas fa-${icon} text-lg mb-1`}></i>
    <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const InspectorTab: React.FC<{ active: boolean, label: string, onClick: () => void }> = ({ active, label, onClick }) => (
  <button onClick={onClick} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all tracking-widest ${active ? 'bg-white text-amber-600 shadow-md scale-105' : 'text-gray-400'}`}>{label}</button>
);

const MoveBtn: React.FC<{ icon: string, onClick: () => void }> = ({ icon, onClick }) => (
  <button onClick={onClick} className="w-12 h-12 bg-white rounded-2xl border-2 border-transparent flex items-center justify-center text-gray-400 hover:border-amber-500 hover:text-amber-600 transition-all shadow-md active:scale-90">
    <i className={`fas fa-${icon} text-xl`}></i>
  </button>
);

const PropInput: React.FC<{ label: string, value: number, unit: string, max?: number, onChange: (v: number) => void }> = ({ label, value, unit, max = 5000, onChange }) => (
  <div className="space-y-4 px-2">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-2">
         <span className="text-xl font-black text-gray-900 font-mono tracking-tighter">{value}</span>
         <span className="text-[9px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-full">{unit}</span>
      </div>
    </div>
    <input type="range" min={0} max={max} step={10} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-amber-600 shadow-inner" />
  </div>
);

const DashboardStat: React.FC<{ title: string, value: string, icon: string, dark?: boolean, color?: string }> = ({ title, value, icon, dark, color }) => (
  <div className={`${dark ? 'bg-gray-900 text-white shadow-2xl' : 'bg-white border-2 border-gray-50 text-gray-900 shadow-sm'} p-10 rounded-[40px] flex flex-col justify-between group transition-all hover:-translate-y-2`}>
    <div className="flex justify-between items-start">
       <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${dark ? 'opacity-40' : 'text-gray-400'}`}>{title}</span>
       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${dark ? 'bg-white/10' : 'bg-gray-50'} group-hover:bg-amber-500 group-hover:text-white transition-all`}>
         <i className={`fas fa-${icon} text-lg ${color || (dark ? 'text-amber-500' : 'text-amber-600')}`}></i>
       </div>
    </div>
    <h3 className="text-3xl font-black mt-10 font-mono leading-none tracking-tighter">{value}</h3>
  </div>
);

export default App;
