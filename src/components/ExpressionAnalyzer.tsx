import React, { useState } from 'react';
import { LogicEngine } from '../lib/logicEngine';
import { geminiService } from '../services/geminiService';
import { Table, CheckCircle2, XCircle, Zap, Cpu, Info, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LogicNode, Connection } from '../types';

interface Props {
  onGenerateCircuit?: (nodes: LogicNode[], connections: Connection[]) => void;
}

export const ExpressionAnalyzer: React.FC<Props> = ({ onGenerateCircuit }) => {
  const [expression, setExpression] = useState('A AND (B OR NOT C)');
  const [result, setResult] = useState<{ headers: string[], rows: boolean[][] } | null>(null);

  const [simplification, setSimplification] = useState<{ steps: any[], finalResult: string } | null>(null);
  const [isSimplifying, setIsSimplifying] = useState(false);

  const analyze = () => {
    const table = LogicEngine.generateTruthTable(expression);
    setResult(table);
    setSimplification(null);
  };

  const simplify = async () => {
    setIsSimplifying(true);
    try {
      const result = await geminiService.simplifyExpression(expression);
      setSimplification(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleGenerateCircuit = () => {
    const { nodes, connections } = LogicEngine.generateCircuitFromExpression(expression);
    if (onGenerateCircuit) {
      onGenerateCircuit(nodes, connections);
    }
  };

  return (
    <div className="space-y-6">
      <div className="logic-card p-6 border-indigo-100 bg-indigo-50/30">
        <h3 className="text-xl font-display font-bold text-indigo-900 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-indigo-600" />
          Editor de Expresiones
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Escribe expresiones lógicas usando palabras clave como <code className="bg-white px-1 rounded border border-gray-200">AND (∧)</code>, 
          <code className="bg-white px-1 rounded border border-gray-200">OR (∨)</code>, 
          <code className="bg-white px-1 rounded border border-gray-200">¬ (Negación)</code>, 
          <code className="bg-white px-1 rounded border border-gray-200">XOR (⊕)</code>, 
          <code className="bg-white px-1 rounded border border-gray-200">→</code>, 
          <code className="bg-white px-1 rounded border border-gray-200">↔</code>.
        </p>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="flex-1 min-w-[300px] px-4 py-3 bg-white border border-gray-300 rounded-xl font-mono text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="A AND (B OR NOT C)"
          />
          <div className="flex gap-2 font-display">
            <button onClick={analyze} className="btn-primary flex items-center gap-2 px-6">
              <Table className="w-5 h-5" />
              Tabla
            </button>
            <button onClick={handleGenerateCircuit} className="btn-secondary flex items-center gap-2 px-6 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
              <Cpu className="w-5 h-5" />
              Circuito
            </button>
            <button 
              onClick={simplify} 
              disabled={isSimplifying}
              className="btn-secondary flex items-center gap-2 px-6 border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
            >
              <Zap className={`w-5 h-5 ${isSimplifying ? 'animate-pulse' : ''}`} />
              {isSimplifying ? 'Simplificando...' : 'Simplificar'}
            </button>
          </div>
        </div>
        
        {simplification && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-6 bg-indigo-50 border border-indigo-200 rounded-xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> Proceso de Simplificación
              </h4>
              <button 
                onClick={() => {
                  setExpression(simplification.finalResult);
                  analyze();
                }}
                className="text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95"
              >
                Usar resultado final
              </button>
            </div>

            <div className="space-y-4">
              {simplification.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-white/60 p-4 rounded-lg border border-indigo-100 shadow-sm transition-all hover:bg-white">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    {step.step}
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-slate-700">{step.description}</p>
                    <div className="bg-slate-900 rounded px-3 py-2">
                      <code className="text-indigo-300 font-mono text-sm">{step.expression}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-indigo-200">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2">Resultado Final</p>
              <div className="bg-indigo-600 p-4 rounded-xl text-center shadow-lg transform hover:scale-[1.01] transition-all">
                <p className="font-mono text-2xl text-white font-bold">{simplification.finalResult}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            <div className="logic-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                <h4 className="font-display font-bold text-gray-800">Tabla de Verdad</h4>
                <span className="text-xs text-indigo-600 font-bold font-mono bg-indigo-50 px-2 py-1 rounded">Resultado: {expression}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {result.headers.map((h, i) => {
                        const isVar = i < LogicEngine.getVariables(expression).length;
                        const isLast = i === result.headers.length - 1;
                        return (
                          <th 
                            key={i} 
                            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest font-mono ${
                              isLast ? 'text-indigo-600 bg-indigo-50/50' : 
                              isVar ? 'text-gray-400' : 'text-slate-500 bg-slate-50/30'
                            }`}
                          >
                            <div className="flex flex-col">
                              {isVar ? 'Var' : isLast ? 'Final' : 'Paso'}
                              <span className="mt-1 text-[10px] text-inherit opacity-80 truncate max-w-[120px]" title={h}>
                                {h}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        {row.map((val, j) => (
                          <td key={j} className={`px-6 py-4 ${j === row.length - 1 ? 'bg-indigo-50/10' : ''}`}>
                            <div className="flex items-center gap-2">
                               {val ? (
                                 <span className="flex items-center gap-1.5 text-emerald-600 font-bold font-mono text-xs">
                                   <CheckCircle2 className="w-4 h-4" /> V
                                 </span>
                               ) : (
                                 <span className="flex items-center gap-1.5 text-rose-500 font-bold font-mono text-xs">
                                   <XCircle className="w-4 h-4" /> F
                                 </span>
                               )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="logic-card p-6 border-amber-100 bg-amber-50/30">
              <h4 className="font-display font-bold text-amber-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Info className="w-4 h-4" /> Leyes de Equivalencia Útiles
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                  <p className="font-bold text-amber-800 mb-1">Leyes de De Morgan</p>
                  <code className="block text-slate-600">¬(A ∧ B) ≡ ¬A ∨ ¬B</code>
                  <code className="block text-slate-600">¬(A ∨ B) ≡ ¬A ∧ ¬B</code>
                </div>
                <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                  <p className="font-bold text-amber-800 mb-1">Definición de Implicación</p>
                  <code className="block text-slate-600">A → B ≡ ¬A ∨ B</code>
                  <code className="block text-slate-600">¬(A → B) ≡ A ∧ ¬B</code>
                </div>
                <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                  <p className="font-bold text-amber-800 mb-1">Distributiva</p>
                  <code className="block text-slate-600">A ∧ (B ∨ C) ≡ (A ∧ B) ∨ (A ∧ C)</code>
                  <code className="block text-slate-600">A ∨ (B ∧ C) ≡ (A ∨ B) ∧ (A ∨ C)</code>
                </div>
                <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                  <p className="font-bold text-amber-800 mb-1">Bicondicional</p>
                  <code className="block text-slate-600">A ↔ B ≡ (A → B) ∧ (B → A)</code>
                  <code className="block text-slate-600">A ↔ B ≡ (A ∧ B) ∨ (¬A ∧ ¬B)</code>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
