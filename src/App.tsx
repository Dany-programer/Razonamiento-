import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Cpu, 
  BookOpen, 
  Trophy, 
  Settings, 
  Play, 
  Plus, 
  BrainCircuit, 
  Info,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Trash2,
  CheckSquare,
  XCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { LogicCanvas } from './components/LogicCanvas';
import { ExpressionAnalyzer } from './components/ExpressionAnalyzer';
import { ChallengeTruthTable } from './components/ChallengeTruthTable';
import { LogicEngine } from './lib/logicEngine';
import { geminiService } from './services/geminiService';
import { LogicNode, Connection, GateType } from './types';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'build' | 'analyze' | 'challenges'>('explore');
  const [nodes, setNodes] = useState<LogicNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [exercise, setExercise] = useState<any>(null);
  const [exerciseRevealed, setExerciseRevealed] = useState(false);
  const [circuitFormula, setCircuitFormula] = useState<string[]>([]);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean, message: string } | null>(null);

  const verifyCircuitAgainstChallenge = () => {
    if (!exercise || exercise.type !== 'circuit') return;
    
    // Get formula from current circuit
    const formulas = LogicEngine.generateFormulaFromCircuit(nodes, connections);
    if (formulas.length === 0) {
      setVerificationResult({ success: false, message: "Tu circuito no tiene salidas conectadas." });
      return;
    }

    // Usually challenges have one output Z = ...
    // Extract the expression part
    const userExpr = formulas[0].split('=')[1]?.trim() || formulas[0];
    const targetExpr = exercise.targetExpression;

    const isMatch = LogicEngine.compareExpressions(userExpr, targetExpr);
    
    if (isMatch) {
      setVerificationResult({ success: true, message: "¡Excelente! El circuito representa correctamente la proposición." });
      setExerciseRevealed(true);
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      setVerificationResult({ success: false, message: "El circuito no coincide con la proposición esperada. Revisa las conexiones." });
    }
  };

  const generateCircuitFormula = () => {
    const formulas = LogicEngine.generateFormulaFromCircuit(nodes, connections);
    setCircuitFormula(formulas);
    if (formulas.length > 0) {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  };

  const addNode = (type: GateType) => {
    const newNode: LogicNode = {
      id: `node-${Date.now()}`,
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      outputValue: false,
      value: type === 'INPUT' ? false : undefined
    };
    setNodes([...nodes, newNode]);
  };

  const loadExplanation = async (concept: string) => {
    setLoading(true);
    const text = await geminiService.explainLogic(concept);
    setExplanation(text || '');
    setLoading(false);
  };

  const loadExercise = async (level: 'easy' | 'medium' | 'hard') => {
    setLoading(true);
    setExerciseRevealed(false);
    const ex = await geminiService.generateExercise(level);
    if (ex) {
      setExercise({ ...ex, level });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'explore' && !explanation) {
      loadExplanation('Lógica Proposicional');
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
               <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 leading-none">
                Lógica<span className="text-indigo-600">Pro</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Sistema Educativo Interactivo</span>
            </div>
          </div>
          
          <nav className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'explore', icon: BookOpen, label: 'Explorar' },
              { id: 'build', icon: Cpu, label: 'Constructor' },
              { id: 'analyze', icon: Zap, label: 'Analizador' },
              { id: 'challenges', icon: Trophy, label: 'Desafíos' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex gap-2">
             <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Settings className="w-5 h-5 text-slate-500" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                <section className="logic-card p-10 bg-indigo-900 border-none relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/30 rounded-full -mr-48 -mt-48 blur-[100px] group-hover:bg-indigo-500/40 transition-colors duration-700"></div>
                  <div className="relative">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-800 text-indigo-200 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                      <Sparkles className="w-3 h-3" /> Potenciado por Gemini 1.5
                    </span>
                    <h2 className="text-4xl font-display font-bold text-white mb-6 leading-tight">
                      Domina el arte de la <br /><span className="text-indigo-400 font-black italic">Razón Pura.</span>
                    </h2>
                    <div className="prose prose-invert max-w-none text-indigo-100">
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <p>Generando conocimiento...</p>
                        </div>
                      ) : (
                        <p className="text-lg leading-relaxed opacity-90">{explanation}</p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Conectivos Lógicos', icon: Zap, concept: 'Conectivos Lógicos' },
                    { title: 'Tablas de Verdad', icon: BookOpen, concept: 'Tablas de Verdad' },
                    { title: 'Equivalencias', icon: BrainCircuit, concept: 'Equivalencias Lógicas' },
                    { title: 'Compuertas Digitales', icon: Cpu, concept: 'Compuertas Lógicas' }
                  ].map((item) => (
                    <button
                      key={item.title}
                      onClick={() => loadExplanation(item.concept)}
                      className="logic-card p-4 flex items-center gap-4 text-left group"
                    >
                      <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
                        <item.icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                 <div className="logic-card p-6 border-indigo-200">
                    <h3 className="font-display font-bold text-indigo-900 mb-2 flex items-center gap-2">
                       <Info className="w-5 h-5 text-indigo-600" />
                       ¿Sabías que?
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      "La lógica proposicional es la base de toda la computación moderna. Cada procesador en tu ordenador es, en esencia, una red gigante de estas pequeñas compuertas."
                    </p>
                 </div>
                 <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
                    <h3 className="font-display font-bold text-xl mb-4">Empieza hoy</h3>
                    <p className="text-sm text-indigo-100 mb-6">
                      Construye tu primer circuito lógico o analiza expresiones complejas usando nuestra IA asistida.
                    </p>
                    <button 
                      onClick={() => setActiveTab('build')}
                      className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                    >
                      Abrir Constructor
                    </button>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'build' && (
            <motion.div
              key="build"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative z-20">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg text-indigo-600 font-bold text-[10px] uppercase tracking-tighter mr-2 ring-1 ring-indigo-200">
                   <Sparkles className="w-3 h-3" /> Clásicas
                </div>
                {(['AND', 'OR', 'NOT'] as GateType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => addNode(type)}
                    className="px-4 py-2 bg-indigo-600 border border-indigo-500 rounded-lg text-xs font-bold text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
                  >
                    {type}
                  </button>
                ))}
                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                <button
                  onClick={() => addNode('INPUT')}
                  className="px-4 py-2 bg-emerald-600 border border-emerald-500 rounded-lg text-xs font-bold text-white hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
                >
                  ENTRADA
                </button>
                {(['XOR'] as GateType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => addNode(type)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm"
                  >
                    {type}
                  </button>
                ))}
                <button
                  onClick={() => addNode('OUTPUT')}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white hover:bg-slate-900 transition-all flex items-center gap-2 shadow-sm"
                >
                  SALIDA
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                <button
                  onClick={generateCircuitFormula}
                  className="px-4 py-2 bg-indigo-600 border border-indigo-500 rounded-lg text-xs font-bold text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Zap className="w-3 h-3" /> GENERAR FÓRMULA
                </button>
                <div className="ml-auto flex gap-2">
                   <button 
                    onClick={() => { setNodes([]); setConnections([]); }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Limpiar Lienzo"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>

              <LogicCanvas 
                nodes={nodes} 
                connections={connections} 
                onNodesChange={setNodes} 
                onConnectionsChange={setConnections} 
              />

              <AnimatePresence>
                {circuitFormula.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="logic-card p-6 bg-white border-2 border-indigo-100 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold text-indigo-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Lógica Extraída del Circuito
                      </h3>
                      <button 
                        onClick={() => setCircuitFormula([])}
                        className="text-xs font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest"
                      >
                        Cerrar
                      </button>
                    </div>
                    <div className="space-y-4">
                      {circuitFormula.map((formula, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 group">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">Salida #{idx + 1}</p>
                            <p className="font-mono text-xl text-slate-800 break-all select-all selection:bg-indigo-100">
                              {formula}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'analyze' && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <ExpressionAnalyzer onGenerateCircuit={(nodes, conns) => {
                setNodes(nodes);
                setConnections(conns);
                setActiveTab('build');
                confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 }
                });
              }} />
            </motion.div>
          )}

          {activeTab === 'challenges' && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="text-center space-y-4">
                 <h2 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Desafíos Lógicos</h2>
                 <p className="text-slate-500 text-lg">Resuelve problemas interactivos diseñados para potenciar tu razonamiento.</p>
              </div>

              {!exercise && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(['easy', 'medium', 'hard'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        setVerificationResult(null);
                        loadExercise(level);
                      }}
                      className="logic-card p-8 flex flex-col items-center text-center group hover:border-indigo-400 transition-all bg-white"
                    >
                      <div className={`p-4 rounded-2xl mb-4 ${
                        level === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                        level === 'medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        <Trophy className="w-8 h-8" />
                      </div>
                      <h3 className="font-display font-bold text-xl uppercase tracking-tighter mb-1 capitalize">
                        {level === 'easy' ? 'Fácil' : level === 'medium' ? 'Medio' : 'Difícil'}
                      </h3>
                      <p className="text-sm text-slate-500 mb-6 font-medium">Ejercicios de nivel {level}</p>
                      <span className="mt-auto px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        Seleccionar
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="logic-card p-12 text-center flex flex-col items-center gap-4 bg-white">
                   <div className="animate-spin text-indigo-600"><Zap /></div>
                   <p className="font-bold text-slate-800 animate-pulse">Diseñando tu próximo desafío...</p>
                </div>
              )}

              {exercise && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="logic-card p-8 space-y-6 bg-white shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-start">
                       <div className="flex gap-2">
                         <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase">
                           Meta: {
                             exercise.type === 'circuit' ? 'Construir Circuito' : 
                             exercise.type === 'table' ? 'Completar Tabla' :
                             exercise.type === 'simplify' ? 'Simplificar' : 'Cuestionario'
                           }
                         </span>
                         {exerciseRevealed && (
                           <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                             <CheckSquare className="w-3 h-3" /> ¡Logrado!
                           </span>
                         )}
                       </div>
                       <button onClick={() => { setExercise(null); setVerificationResult(null); }} className="text-slate-400 hover:text-slate-600">
                         <XCircle className="w-6 h-6" />
                       </button>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-2xl font-display font-bold text-gray-900 leading-tight">
                        {exercise.question}
                      </h3>
                      <div className="inline-block px-4 py-2 bg-slate-900 rounded-xl">
                        <code className="text-indigo-400 font-mono text-xl font-bold">{exercise.targetExpression}</code>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                      {exercise.type === 'circuit' ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-4 text-slate-600">
                             <div className="bg-white p-3 rounded-xl shadow-sm">
                               <Cpu className="w-6 h-6 text-indigo-600" />
                             </div>
                             <div>
                               <p className="text-sm font-medium">Instrucciones de Circuito:</p>
                               <p className="text-xs text-slate-500 italic">Ve a la pestaña "Constructor", diseña el circuito que corresponda a la fórmula y vuelve aquí para verificarlo.</p>
                             </div>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                            <button 
                              onClick={() => setActiveTab('build')}
                              className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
                            >
                              Ir al Constructor
                            </button>
                            <button 
                              onClick={verifyCircuitAgainstChallenge}
                              disabled={exerciseRevealed}
                              className={`btn-primary w-full py-4 flex items-center justify-center gap-2 ${exerciseRevealed ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Sparkles className="w-5 h-5" />
                              Verificar mi Circuito Actual
                            </button>
                          </div>
                        </div>
                      ) : exercise.type === 'table' ? (
                        <ChallengeTruthTable 
                          expression={exercise.targetExpression} 
                          variables={exercise.variables || ['A', 'B']}
                          onNewChallenge={() => {
                            const level = exercise.level || 'medium';
                            setExercise(null);
                            setVerificationResult(null);
                            setExerciseRevealed(false);
                            loadExercise(level);
                          }}
                          onComplete={() => {
                            setExerciseRevealed(true);
                            confetti({
                              particleCount: 150,
                              spread: 70,
                              origin: { y: 0.6 }
                            });
                          }}
                        />
                      ) : exercise.type === 'simplify' ? (
                        <div className="space-y-6">
                          <p className="text-sm text-slate-600 mb-4">Simplifica la expresión de arriba y escribe tu respuesta:</p>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              id="simplify-input"
                              placeholder="Ej: A ∧ ¬B"
                              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const input = (e.target as HTMLInputElement).value;
                                  if (input.trim() === exercise.correctAnswer) {
                                    setVerificationResult({ success: true, message: "¡Correcto! Has simplificado la expresión correctamente." });
                                    setExerciseRevealed(true);
                                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                                  } else {
                                    setVerificationResult({ success: false, message: "La respuesta no es correcta. Inténtalo de nuevo o usa la pista." });
                                  }
                                }
                              }}
                            />
                            <button 
                              onClick={() => {
                                const input = (document.getElementById('simplify-input') as HTMLInputElement).value;
                                if (input.trim() === exercise.correctAnswer) {
                                  setVerificationResult({ success: true, message: "¡Correcto! Has simplificado la expresión correctamente." });
                                  setExerciseRevealed(true);
                                  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                                } else {
                                  setVerificationResult({ success: false, message: "La respuesta no es correcta. Inténtalo de nuevo o usa la pista." });
                                }
                              }}
                              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold"
                            >
                              Validar
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400">Usa símbolos normales como: ¬, ^, v, -&gt;, &lt;-&gt; o palabras como NOT, AND, OR.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600 mb-4 font-medium italic">Selecciona la opción correcta:</p>
                          <div className="grid grid-cols-1 gap-3">
                            {exercise.options?.map((option: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (option === exercise.correctAnswer) {
                                    setVerificationResult({ success: true, message: "¡Exacto! Esa es la respuesta correcta." });
                                    setExerciseRevealed(true);
                                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                                  } else {
                                    setVerificationResult({ success: false, message: "Opción incorrecta. Analiza bien la pregunta." });
                                  }
                                }}
                                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-indigo-500 hover:bg-indigo-50 transition-all font-medium text-slate-700"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {verificationResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                          verificationResult.success 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          {verificationResult.success ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
                          <p className="font-semibold">{verificationResult.message}</p>
                        </div>
                        {!verificationResult.success && (
                          <button 
                            onClick={() => {
                              const currentLevel = exercise.level || 'medium';
                              setVerificationResult(null);
                              loadExercise(currentLevel);
                            }}
                            className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" /> Intentar con otro desafío
                          </button>
                        )}
                      </motion.div>
                    )}

                    <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl text-amber-800 text-sm">
                      <Info className="w-5 h-5 shrink-0" />
                      <p><strong>Pista:</strong> {exercise.hint}</p>
                    </div>

                    {exerciseRevealed && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100"
                      >
                        <h4 className="font-bold text-indigo-900 mb-2">Explicación:</h4>
                        <p className="text-sm text-indigo-800 leading-relaxed">{exercise.explanation}</p>
                        <button 
                          onClick={() => {
                            const level = exercise.level || 'medium';
                            setExercise(null);
                            setVerificationResult(null);
                            setExerciseRevealed(false);
                            loadExercise(level);
                          }}
                          className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                        >
                          Nuevo Desafío
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <BrainCircuit className="w-5 h-5" />
            <p className="text-xs font-bold tracking-widest uppercase">LógicaPro Educational Suite v1.0</p>
          </div>
          <div className="flex gap-4">
             <a href="#" className="p-2 text-slate-400 hover:text-slate-600"><MessageSquare className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
