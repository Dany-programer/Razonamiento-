import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { LogicEngine } from '../lib/logicEngine';

interface ChallengeTruthTableProps {
  expression: string;
  variables: string[];
  onComplete: () => void;
  onNewChallenge: () => void;
}

export function ChallengeTruthTable({ expression, variables, onComplete, onNewChallenge }: ChallengeTruthTableProps) {
  const [userInputs, setUserInputs] = useState<boolean[]>([]);
  const [expectedResults, setExpectedResults] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<boolean[][]>([]);

  useEffect(() => {
    const { headers, rows } = LogicEngine.generateTable(expression);
    setHeaders(headers);
    setRows(rows);
    
    // The last column is the final result
    const results = rows.map(row => row[row.length - 1]);
    setExpectedResults(results);
    setUserInputs(new Array(results.length).fill(null));
    setShowFeedback(false);
  }, [expression]);

  const handleInput = (index: number, value: boolean) => {
    const newInputs = [...userInputs];
    newInputs[index] = value;
    setUserInputs(newInputs);
  };

  const checkResults = () => {
    setShowFeedback(true);
    const isCorrect = userInputs.every((val, idx) => val === expectedResults[idx]);
    if (isCorrect) {
      onComplete();
    }
  };

  const isComplete = userInputs.every(val => val !== null);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              {variables.map(v => (
                <th key={v} className="px-4 py-3 border-b border-slate-200">{v}</th>
              ))}
              <th className="px-4 py-3 border-b border-slate-200 text-indigo-600 bg-indigo-50/30">
                Resultado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                {variables.map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 font-mono">
                    <span className={row[colIndex] ? 'text-emerald-600' : 'text-rose-500'}>
                      {row[colIndex] ? 'V' : 'F'}
                    </span>
                  </td>
                ))}
                <td className="px-4 py-3 bg-indigo-50/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInput(rowIndex, true)}
                      className={`w-8 h-8 rounded flex items-center justify-center font-bold transition-all ${
                        userInputs[rowIndex] === true
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      V
                    </button>
                    <button
                      onClick={() => handleInput(rowIndex, false)}
                      className={`w-8 h-8 rounded flex items-center justify-center font-bold transition-all ${
                        userInputs[rowIndex] === false
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      F
                    </button>
                    {showFeedback && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        {userInputs[rowIndex] === expectedResults[rowIndex] ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </motion.div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={checkResults}
          disabled={!isComplete}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            isComplete
              ? 'bg-indigo-600 text-white shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {showFeedback ? <RefreshCw className="w-4 h-4" /> : null}
          {showFeedback ? 'Reintentar Verificar' : 'Verificar Tabla'}
        </button>

        {showFeedback && (
          <button
            onClick={onNewChallenge}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200"
          >
            Nuevo Desafío
          </button>
        )}
      </div>
    </div>
  );
}
