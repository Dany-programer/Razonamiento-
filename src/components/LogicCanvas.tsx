import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Text, Line, Group, Circle, Path } from 'react-konva';
import { LogicNode, Connection, GateType } from '../types';
import { Trash2, Maximize2, Minimize2, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface Props {
  nodes: LogicNode[];
  connections: Connection[];
  onNodesChange: (nodes: LogicNode[]) => void;
  onConnectionsChange: (connections: Connection[]) => void;
}

const GATE_WIDTH = 100;
const GATE_HEIGHT = 60;

const GateShape: React.FC<{ type: GateType; color: string; stroke: string }> = ({ type, color, stroke }) => {
  switch (type) {
    case 'AND':
      return (
        <Path
          data="M 0,0 L 50,0 C 85,0 100,15 100,30 C 100,45 85,60 50,60 L 0,60 Z"
          fill={color}
          stroke={stroke}
          strokeWidth={2}
        />
      );
    case 'OR':
      return (
        <Path
          data="M 0,0 C 15,10 15,50 0,60 C 20,60 50,60 60,60 C 85,60 100,30 100,30 C 100,30 85,0 60,0 C 50,0 20,0 0,0 Z"
          fill={color}
          stroke={stroke}
          strokeWidth={2}
        />
      );
    case 'NOT':
      return (
        <Group>
          <Path
            data="M 0,0 L 90,30 L 0,60 Z"
            fill={color}
            stroke={stroke}
            strokeWidth={2}
          />
          <Circle x={95} y={30} radius={5} fill={color} stroke={stroke} strokeWidth={2} />
        </Group>
      );
    default:
      return (
        <Rect
          width={GATE_WIDTH}
          height={GATE_HEIGHT}
          fill={color}
          stroke={stroke}
          strokeWidth={2}
          cornerRadius={8}
        />
      );
  }
};

export const LogicCanvas: React.FC<Props> = ({ nodes, connections, onNodesChange, onConnectionsChange }) => {
  const [connectingFrom, setConnectingFrom] = useState<{ id: string; type: 'output' | 'input'; slot?: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 1000, height: 600 });
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  const handleMouseMove = (e: any) => {
    const stage = stageRef.current;
    if (stage) {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        // Transform stage coordinates back to coordinate space of elements
        const mouseX = (pointer.x - stage.x()) / stage.scaleX();
        const mouseY = (pointer.y - stage.y()) / stage.scaleY();
        setMousePos({ x: mouseX, y: mouseY });
      }
    }
  };

  const handleDragPosition = (id: string, x: number, y: number) => {
    onNodesChange(nodes.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const computeNodeOutput = (node: LogicNode, allNodes: LogicNode[], allConnections: Connection[]): boolean => {
    if (node.type === 'INPUT') return node.value || false;

    const inputs = allConnections.filter(c => c.toId === node.id);
    const inputValues = inputs.map(c => {
      const fromNode = allNodes.find(n => n.id === c.fromId);
      return fromNode ? computeNodeOutput(fromNode, allNodes, allConnections) : false;
    });

    switch (node.type) {
      case 'AND': return inputValues.length >= 2 ? inputValues.every(v => v) : false;
      case 'OR': return inputValues.some(v => v);
      case 'NOT': return inputValues.length > 0 ? !inputValues[0] : true;
      case 'XOR': return inputValues.reduce((acc, v) => acc !== v, false);
      case 'NAND': return !(inputValues.length >= 2 && inputValues.every(v => v));
      case 'NOR': return !inputValues.some(v => v);
      case 'XNOR': return inputValues.length >= 2 ? inputValues[0] === inputValues[1] : true;
      case 'BUFFER': return inputValues[0] || false;
      case 'OUTPUT': return inputValues[0] || false;
      default: return false;
    }
  };

  useEffect(() => {
    const newNodes = nodes.map(n => ({
      ...n,
      outputValue: computeNodeOutput(n, nodes, connections)
    }));
    if (JSON.stringify(newNodes) !== JSON.stringify(nodes)) {
      onNodesChange(newNodes);
    }
  }, [nodes, connections]);

  const handleSocketClick = (nodeId: string, type: 'output' | 'input', slot?: number) => {
    if (!connectingFrom) {
      setConnectingFrom({ id: nodeId, type, slot });
    } else {
      if (connectingFrom.id !== nodeId && connectingFrom.type !== type) {
        const fromId = type === 'output' ? nodeId : connectingFrom.id;
        const toId = type === 'input' ? nodeId : connectingFrom.id;
        const inputSlot = type === 'input' ? slot || 0 : connectingFrom.slot || 0;

        // Add connection
        const newConn: Connection = {
          id: `conn-${Date.now()}`,
          fromId,
          toId,
          inputSlot
        };
        
        // Remove existing connections to that slot
        const filtered = connections.filter(c => !(c.toId === toId && c.inputSlot === inputSlot));
        onConnectionsChange([...filtered, newConn]);
      }
      setConnectingFrom(null);
    }
  };

  const deleteNode = (id: string) => {
    onNodesChange(nodes.filter(n => n.id !== id));
    onConnectionsChange(connections.filter(c => c.fromId !== id && c.toId !== id));
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 2));
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full bg-slate-900 overflow-hidden border border-slate-800 relative shadow-inner transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-[100] h-screen w-screen rounded-none' : 'h-[600px] rounded-xl'
      }`}
    >
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-800/80 p-2 rounded-lg backdrop-blur-sm border border-slate-700 pointer-events-auto flex flex-col gap-2 shadow-lg">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-1">Monitor</p>
          <div className="flex flex-col gap-1 text-[10px] text-slate-300">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Verde: 1</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-600"></div> Gris: 0</div>
          </div>
        </div>

        <div className="bg-slate-800/80 p-1 rounded-lg backdrop-blur-sm border border-slate-700 pointer-events-auto flex items-center gap-1 shadow-lg">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-300 hover:bg-slate-700 rounded transition-colors"
            title={isFullscreen ? "Minimizar" : "Pantalla Completa"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1"></div>
          <button 
            onClick={() => handleZoom(0.1)}
            className="p-1.5 text-slate-300 hover:bg-slate-700 rounded transition-colors"
            title="Aumentar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleZoom(-0.1)}
            className="p-1.5 text-slate-300 hover:bg-slate-700 rounded transition-colors"
            title="Disminuir"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1"></div>
          <div className="px-2 text-[10px] font-mono text-slate-400">
            {Math.round(scale * 100)}%
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
        <div className="bg-slate-800/80 px-3 py-1.5 rounded-full backdrop-blur-sm border border-slate-700 text-[10px] text-slate-400 font-medium">
          Arrastra el fondo para moverte
        </div>
      </div>

      <Stage 
        width={stageSize.width} 
        height={stageSize.height} 
        ref={stageRef}
        onMouseMove={handleMouseMove}
        draggable
        scaleX={scale}
        scaleY={scale}
      >
        <Layer>
          {connectingFrom && (
            <Line
              points={[
                nodes.find(n => n.id === connectingFrom.id)!.x + (connectingFrom.type === 'output' ? GATE_WIDTH : 0),
                nodes.find(n => n.id === connectingFrom.id)!.y + (connectingFrom.type === 'output' ? (GATE_HEIGHT / 2) : (connectingFrom.slot === 0 ? 20 : 40)),
                mousePos.x,
                mousePos.y
              ]}
              stroke="#6366f1"
              strokeWidth={2 / scale}
              dash={[5 / scale, 5 / scale]}
            />
          )}
          {connections.map(conn => {
            const from = nodes.find(n => n.id === conn.fromId);
            const to = nodes.find(n => n.id === conn.toId);
            if (!from || !to) return null;

            const startX = from.x + GATE_WIDTH;
            const startY = from.y + GATE_HEIGHT / 2;
            const endX = to.x;
            const endY = to.y + (to.type === 'NOT' || to.type === 'OUTPUT' || to.type === 'BUFFER' ? GATE_HEIGHT / 2 : (conn.inputSlot === 0 ? 20 : 40));

            return (
              <Line
                key={conn.id}
                points={[startX, startY, startX + 20, startY, endX - 20, endY, endX, endY]}
                stroke={from.outputValue ? '#22c55e' : '#475569'}
                strokeWidth={3 / scale}
                tension={0.5}
                onClick={() => onConnectionsChange(connections.filter(c => c.id !== conn.id))}
              />
            );
          })}

          {nodes.map(node => (
            <Group
              key={node.id}
              x={node.x}
              y={node.y}
              draggable
              onDragMove={(e) => handleDragPosition(node.id, e.target.x(), e.target.y())}
            >
              <GateShape 
                type={node.type} 
                color="#1e293b" 
                stroke={connectingFrom?.id === node.id ? '#6366f1' : '#334155'} 
              />
              <Text
                text={node.type === 'INPUT' 
                  ? nodes.filter(n => n.type === 'INPUT').findIndex(n => n.id === node.id) !== -1
                    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[nodes.filter(n => n.type === 'INPUT').findIndex(n => n.id === node.id) % 26]
                    : node.type
                  : node.type === 'OUTPUT' ? 'Z' : node.type}
                width={GATE_WIDTH}
                height={GATE_HEIGHT}
                align="center"
                verticalAlign="middle"
                fill="#f8fafc"
                fontFamily="Space Grotesk"
                fontStyle="bold"
                fontSize={node.type === 'INPUT' || node.type === 'OUTPUT' ? 24 : 12}
                opacity={node.type === 'INPUT' || node.type === 'OUTPUT' ? 1 : 0.6}
                pointerEvents="none"
              />
              
              {/* Output Socket */}
              {node.type !== 'OUTPUT' && (
                <Circle
                  x={GATE_WIDTH}
                  y={GATE_HEIGHT / 2}
                  radius={8}
                  fill={node.outputValue ? '#22c55e' : '#475569'}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                  }}
                  onClick={() => handleSocketClick(node.id, 'output')}
                />
              )}

              {/* Input Sockets */}
              {node.type !== 'INPUT' && (
                <>
                  {node.type === 'NOT' || node.type === 'OUTPUT' || node.type === 'BUFFER' ? (
                    <Circle
                      x={0}
                      y={GATE_HEIGHT / 2}
                      radius={8}
                      fill="#3b82f6"
                      onClick={() => handleSocketClick(node.id, 'input', 0)}
                    />
                  ) : (
                    <>
                      <Circle
                        x={0}
                        y={20}
                        radius={8}
                        fill="#3b82f6"
                        onClick={() => handleSocketClick(node.id, 'input', 0)}
                      />
                      <Circle
                        x={0}
                        y={40}
                        radius={8}
                        fill="#3b82f6"
                        onClick={() => handleSocketClick(node.id, 'input', 1)}
                      />
                    </>
                  )}
                </>
              )}

              {/* Input Controls */}
              {node.type === 'INPUT' && (
                <Group x={0} y={GATE_HEIGHT + 5}>
                   <Rect 
                    width={GATE_WIDTH} 
                    height={30} 
                    fill={node.value ? '#22c55e' : '#ef4444'} 
                    cornerRadius={6}
                    shadowBlur={2}
                    onClick={() => {
                        onNodesChange(nodes.map(n => n.id === node.id ? { ...n, value: !n.value } : n));
                    }}
                  />
                  <Text 
                    text={node.value ? 'ACTIVADO (1)' : 'DESACTIVADO (0)'} 
                    width={GATE_WIDTH} 
                    align="center" 
                    y={9} 
                    fill="#fff" 
                    fontSize={10} 
                    fontStyle="bold"
                    pointerEvents="none"
                  />
                </Group>
              )}

              <Group x={GATE_WIDTH - 20} y={-10} onClick={() => deleteNode(node.id)}>
                <Circle radius={8} fill="#ef4444" />
                <Text text="x" x={-3} y={-5} fill="white" fontSize={10} fontStyle="bold" />
              </Group>
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
