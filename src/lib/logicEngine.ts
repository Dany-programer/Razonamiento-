/**
 * Logic Engine for PropLogic
 * Handles expression parsing and truth table generation.
 */

import { LogicNode, Connection, GateType } from '../types';

export const OPERATORS = {
  NOT: ['NOT', '¬', '~', '!'],
  AND: ['AND', '∧', '&', '&&'],
  OR: ['OR', '∨', '|', '||'],
  XOR: ['XOR', '⊕', '^'],
  IMP: ['->', '=>', 'IMPLICA'],
  BI: ['<->', '<=>', 'BICONDICIONAL'],
};

export type Operator = 'NOT' | 'AND' | 'OR' | 'XOR' | 'IMP' | 'BI';

export class LogicEngine {
  static sanitize(expr: string): string {
    return expr
      .replace(/<->|<=>|↔/g, ' BI ')
      .replace(/->|=>|→/g, ' IMP ')
      .replace(/\*|∧/g, ' AND ')
      .replace(/\+|∨/g, ' OR ')
      .replace(/\/|¬|!|~/g, ' NOT ')
      .replace(/XOR|⊕|\^/g, ' XOR ')
      // Handle juxtaposition: A(B) -> A AND (B), (A)B -> (A) AND B, (A)(B) -> (A) AND (B)
      // We use a temporary marker to avoid double ANDs
      .replace(/([A-Z0-9])\s*\(/gi, '$1 _AND_ (')
      .replace(/\)\s*([A-Z0-9])/gi, ') _AND_ $1')
      .replace(/\)\s*\(/g, ') _AND_ (')
      // Clean up markers: don't add AND after a keyword that's already an operator
      .replace(/(AND|OR|XOR|IMP|BI|NOT)\s+_AND_\s+/gi, '$1 ')
      .replace(/_AND_/g, ' AND ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static evaluate(expression: string, values: Record<string, boolean>): boolean {
    const sanitized = this.sanitize(expression);
    const precedence: Record<string, number> = { 'BI': 1, 'IMP': 2, 'OR': 3, 'XOR': 4, 'AND': 5, 'NOT': 6 };
    const outputQueue: string[] = [];
    const operatorStack: string[] = [];
    
    // Improved regex to handle operands and operators correctly
    const tokens = sanitized.match(/\(|\)|BI|IMP|AND|OR|XOR|NOT|[A-Za-z][A-Za-z0-9]*/gi) || [];
    
    for (const token of tokens) {
      const upper = token.toUpperCase();
      if (upper === '(') {
        operatorStack.push(upper);
      } else if (upper === ')') {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
          outputQueue.push(operatorStack.pop()!);
        }
        operatorStack.pop();
      } else if (precedence[upper] !== undefined) {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== '(' &&
          precedence[operatorStack[operatorStack.length - 1]] >= precedence[upper]
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        operatorStack.push(upper);
      } else {
        outputQueue.push(token); // Keep original case for variables
      }
    }
    while (operatorStack.length > 0) outputQueue.push(operatorStack.pop()!);
    
    const stack: boolean[] = [];
    for (const token of outputQueue) {
      const upper = token.toUpperCase();
      if (precedence[upper] !== undefined) {
        if (upper === 'NOT') {
          const a = stack.pop();
          stack.push(!a);
        } else {
          const b = stack.pop();
          const a = stack.pop();
          if (a === undefined || b === undefined) {
            stack.push(false);
            continue;
          }
          switch (upper) {
            case 'AND': stack.push(a && b); break;
            case 'OR': stack.push(a || b); break;
            case 'XOR': stack.push(a !== b); break;
            case 'IMP': stack.push(!a || b); break;
            case 'BI': stack.push(a === b); break;
          }
        }
      } else {
        // Variable lookup (case insensitive)
        const val = values[token] ?? values[token.toLowerCase()] ?? values[token.toUpperCase()] ?? (upper === 'TRUE');
        stack.push(!!val);
      }
    }
    return stack[0] ?? false;
  }

  static getVariables(expr: string): string[] {
    const tokens = expr.match(/[A-Za-z][A-Za-z0-9]*/g) || [];
    const reserved = ['BI', 'IMP', 'AND', 'OR', 'XOR', 'NOT', 'TRUE', 'FALSE'];
    return [...new Set(tokens.filter(t => !reserved.includes((t as string).toUpperCase())))].sort();
  }

  static extractSubExpressions(expr: string): string[] {
    const sanitized = this.sanitize(expr);
    const precedence: Record<string, number> = { 'BI': 1, 'IMP': 2, 'OR': 3, 'XOR': 4, 'AND': 5, 'NOT': 6 };
    const outputQueue: string[] = [];
    const operatorStack: string[] = [];
    
    const tokens = sanitized.match(/\(|\)|BI|IMP|AND|OR|XOR|NOT|[A-Za-z][A-Za-z0-9]*/gi) || [];
    
    for (const token of tokens) {
      const upper = token.toUpperCase();
      if (upper === '(') {
        operatorStack.push(upper);
      } else if (upper === ')') {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
          outputQueue.push(operatorStack.pop()!);
        }
        operatorStack.pop();
      } else if (precedence[upper] !== undefined) {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== '(' &&
          precedence[operatorStack[operatorStack.length - 1]] >= precedence[upper]
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        operatorStack.push(upper);
      } else {
        outputQueue.push(token);
      }
    }
    while (operatorStack.length > 0) outputQueue.push(operatorStack.pop()!);

    const stack: string[] = [];
    const subExprs: string[] = [];

    const getSymbol = (op: string) => {
      switch(op.toUpperCase()) {
        case 'NOT': return '¬';
        case 'AND': return '∧';
        case 'OR': return '∨';
        case 'XOR': return '⊕';
        case 'IMP': return '→';
        case 'BI': return '↔';
        default: return op;
      }
    };

    for (const token of outputQueue) {
      const upper = token.toUpperCase();
      if (precedence[upper] !== undefined) {
        if (upper === 'NOT') {
          const a = stack.pop();
          if (a === undefined) continue;
          const res = `¬(${a})`;
          stack.push(res);
          subExprs.push(res);
        } else {
          const b = stack.pop();
          const a = stack.pop();
          if (a === undefined || b === undefined) {
            // Put it back or handle error
            if (b !== undefined) stack.push(b);
            if (a !== undefined) stack.push(a);
            continue;
          }
          const res = `(${a} ${getSymbol(token)} ${b})`;
          stack.push(res);
          subExprs.push(res);
        }
      } else {
        stack.push(token);
      }
    }

    return [...new Set(subExprs)];
  }

  static generateTable(expr: string): { headers: string[], rows: boolean[][] } {
    return this.generateTruthTable(expr);
  }

  static generateTruthTable(expr: string): { headers: string[], rows: boolean[][] } {
    const vars = this.getVariables(expr);
    const subExprs = this.extractSubExpressions(expr);
    const headers = [...vars, ...subExprs];
    const numRows = Math.pow(2, vars.length);
    const rows: boolean[][] = [];

    // User wants V V V first, so we iterate backwards from 2^n - 1 to 0
    for (let i = numRows - 1; i >= 0; i--) {
      const values: Record<string, boolean> = {};
      const row: boolean[] = [];
      
      for (let j = 0; j < vars.length; j++) {
        const val = !!((i >> (vars.length - 1 - j)) & 1);
        values[vars[j]] = val;
        row.push(val);
      }
      
      for (const sub of subExprs) {
        try {
          row.push(this.evaluate(sub, values));
        } catch (e) {
          row.push(false);
        }
      }
      rows.push(row);
    }
    return { headers, rows };
  }

  static compareExpressions(expr1: string, expr2: string): boolean {
    const vars1 = this.getVariables(expr1);
    const vars2 = this.getVariables(expr2);
    const allVars = [...new Set([...vars1, ...vars2])].sort();
    const numRows = Math.pow(2, allVars.length);

    for (let i = 0; i < numRows; i++) {
      const values: Record<string, boolean> = {};
      for (let j = 0; j < allVars.length; j++) {
        values[allVars[j]] = !!((i >> (allVars.length - 1 - j)) & 1);
      }
      
      if (this.evaluate(expr1, values) !== this.evaluate(expr2, values)) {
        return false;
      }
    }
    return true;
  }

  static generateCircuitFromExpression(expr: string): { nodes: LogicNode[], connections: Connection[] } {
    const sanitized = this.sanitize(expr);
    const tokens = sanitized.match(/\(|\)|BI|IMP|AND|OR|XOR|NOT|[A-Za-z0-9]+/g) || [];
    
    const precedence: Record<string, number> = { 'BI': 1, 'IMP': 2, 'OR': 3, 'XOR': 4, 'AND': 5, 'NOT': 6 };
    const outputQueue: string[] = [];
    const operatorStack: string[] = [];

    for (const token of tokens) {
      if (token === '(') operatorStack.push(token);
      else if (token === ')') {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') outputQueue.push(operatorStack.pop()!);
        operatorStack.pop();
      } else if (precedence[token]) {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(' && precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]) {
          outputQueue.push(operatorStack.pop()!);
        }
        operatorStack.push(token);
      } else outputQueue.push(token);
    }
    while (operatorStack.length > 0) outputQueue.push(operatorStack.pop()!);

    const nodeStack: string[] = [];
    const nodes: LogicNode[] = [];
    const connections: Connection[] = [];
    let idCounter = 0;
    const vars = this.getVariables(expr);
    const varNodes: Record<string, string> = {};

    vars.forEach((v, i) => {
      const id = `input-${v}`;
      nodes.push({ id, type: 'INPUT', x: 50, y: 100 + i * 150, outputValue: false, label: v, value: false });
      varNodes[v] = id;
    });

    let currentX = 250;
    let baselineY = 100;

    outputQueue.forEach(token => {
      if (precedence[token]) {
        const id = `gate-${idCounter++}`;
        const type = token as GateType;
        nodes.push({ id, type, x: currentX, y: baselineY + (nodes.length % 3) * 50, outputValue: false });
        currentX += 180;

        if (token === 'NOT') {
          const inputId = nodeStack.pop()!;
          connections.push({ id: `c-${idCounter++}`, fromId: inputId, toId: id, inputSlot: 0 });
        } else {
          const bId = nodeStack.pop()!;
          const aId = nodeStack.pop()!;
          connections.push({ id: `c-${idCounter++}`, fromId: aId, toId: id, inputSlot: 0 });
          connections.push({ id: `c-${idCounter++}`, fromId: bId, toId: id, inputSlot: 1 });
        }
        nodeStack.push(id);
      } else {
        nodeStack.push(varNodes[token] || `const-${token}`);
      }
    });

    const finalId = nodeStack.pop();
    if (finalId) {
      nodes.push({ id: 'output-z', type: 'OUTPUT', x: currentX + 50, y: baselineY, outputValue: false, label: 'Z' });
      connections.push({ id: 'c-final', fromId: finalId, toId: 'output-z', inputSlot: 0 });
    }

    return { nodes, connections };
  }

  static generateFormulaFromCircuit(nodes: LogicNode[], connections: Connection[]): string[] {
    const outputs = nodes.filter(n => n.type === 'OUTPUT');
    const inputs = nodes.filter(n => n.type === 'INPUT');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const inputLabels: Record<string, string> = {};
    inputs.forEach((node, idx) => {
      inputLabels[node.id] = node.label || alphabet[idx % alphabet.length];
    });
    
    const getFormulaForNode = (node: LogicNode): string => {
      if (node.type === 'INPUT') return inputLabels[node.id];
      const nodeInputs = connections.filter(c => c.toId === node.id);
      if (nodeInputs.length === 0) return '?';
      const inputFormulas = nodeInputs.map(c => {
        const fromNode = nodes.find(n => n.id === c.fromId);
        return fromNode ? getFormulaForNode(fromNode) : '?';
      });
      switch (node.type) {
        case 'AND': return `(${inputFormulas.join(' ∧ ')})`;
        case 'OR': return `(${inputFormulas.join(' ∨ ')})`;
        case 'NOT': return `¬(${inputFormulas[0]})`;
        case 'XOR': return `(${inputFormulas.join(' ⊕ ')})`;
        case 'NAND': return `¬(${inputFormulas.join(' ∧ ')})`;
        case 'NOR': return `¬(${inputFormulas.join(' ∨ ')})`;
        case 'BUFFER': return inputFormulas[0];
        case 'OUTPUT': return inputFormulas[0];
        default: return '?';
      }
    };
    return outputs.map((out, idx) => `Z${outputs.length > 1 ? idx + 1 : ''} = ${getFormulaForNode(out)}`);
  }
}
