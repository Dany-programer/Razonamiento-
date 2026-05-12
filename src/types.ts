export type GateType = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'XNOR' | 'BUFFER' | 'INPUT' | 'OUTPUT';

export interface LogicNode {
  id: string;
  type: GateType;
  x: number;
  y: number;
  value?: boolean; // For INPUT type
  outputValue: boolean;
  label?: string; // For INPUT/OUTPUT labels
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  inputSlot: number; // 0 for single input, 0/1 for dual inputs
}

export interface CircuitState {
  nodes: LogicNode[];
  connections: Connection[];
}

export interface TruthTable {
  headers: string[];
  rows: (boolean | string)[][];
}

export interface LogicExpression {
  raw: string;
  parsed: any; // AST or similar
}
