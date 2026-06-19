import { useCallback, useMemo } from "react";
import { motion } from "motion/react";
import {
  Code2, Server, Database, Cloud, Plug, Globe, Zap, Shield,
} from "lucide-react";
import type { ArchitectureData } from "@/lib/store";

interface Props {
  architecture: ArchitectureData;
  view: "graph" | "card";
}

interface NodeDef {
  id: string;
  label: string;
  value: string;
  icon: any;
  color: string;
  x: number;
  y: number;
  layer: number;
}

interface EdgeDef {
  from: string;
  to: string;
  label?: string;
}

const ICON_MAP: Record<string, any> = {
  frontend: Code2, backend: Server, database: Database,
  hosting: Cloud, apis: Plug, realtime: Globe,
};
const COLOR_MAP: Record<string, string> = {
  frontend: "oklch(0.66 0.21 285)",
  backend:  "oklch(0.72 0.18 200)",
  database: "oklch(0.75 0.18 90)",
  hosting:  "oklch(0.7 0.22 25)",
  apis:     "oklch(0.6 0.22 305)",
  realtime: "oklch(0.68 0.20 170)",
};

function buildGraph(arch: ArchitectureData): { nodes: NodeDef[]; edges: EdgeDef[] } {
  const nodes: NodeDef[] = [];
  const edges: EdgeDef[] = [];

  // Layer 0: Frontend (left)
  if (arch.frontend) nodes.push({ id: "frontend", label: "Frontend", value: arch.frontend, icon: Code2, color: COLOR_MAP.frontend, x: 60, y: 160, layer: 0 });
  // Layer 1: API gateway (middle-left)
  nodes.push({ id: "api", label: "REST / GraphQL", value: "API Layer", icon: Globe, color: COLOR_MAP.realtime, x: 260, y: 160, layer: 1 });
  // Layer 2: Backend (middle)
  if (arch.backend) nodes.push({ id: "backend", label: "Backend", value: arch.backend, icon: Server, color: COLOR_MAP.backend, x: 460, y: 160, layer: 2 });
  // Layer 3: Database + Hosting (right)
  if (arch.database) nodes.push({ id: "database", label: "Database", value: arch.database, icon: Database, color: COLOR_MAP.database, x: 660, y: 80, layer: 3 });
  if (arch.hosting) nodes.push({ id: "hosting", label: "Hosting", value: arch.hosting, icon: Cloud, color: COLOR_MAP.hosting, x: 660, y: 240, layer: 3 });
  // APIs node
  const apiList = arch.apis || [];
  if (apiList.length > 0) {
    nodes.push({ id: "apis", label: "External APIs", value: apiList.slice(0, 3).join(", "), icon: Plug, color: COLOR_MAP.apis, x: 460, y: 300, layer: 2 });
  }

  // Edges
  if (arch.frontend) edges.push({ from: "frontend", to: "api", label: "HTTP" });
  if (arch.backend) {
    edges.push({ from: "api", to: "backend", label: "gRPC/REST" });
    if (arch.database) edges.push({ from: "backend", to: "database" });
    if (arch.hosting) edges.push({ from: "backend", to: "hosting" });
    if (apiList.length > 0) edges.push({ from: "backend", to: "apis" });
  }

  return { nodes, edges };
}

function GraphEdge({ nodes, edge }: { nodes: NodeDef[]; edge: EdgeDef }) {
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);
  if (!from || !to) return null;

  const x1 = from.x + 72;
  const y1 = from.y + 28;
  const x2 = to.x;
  const y2 = to.y + 28;
  const mx = (x1 + x2) / 2;

  return (
    <g>
      <path
        d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
        fill="none"
        stroke="oklch(0.66 0.21 285 / 0.35)"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
      {/* Animated dot */}
      <circle r={3} fill="oklch(0.66 0.21 285)">
        <animateMotion
          dur={`${1.8 + Math.random()}s`}
          repeatCount="indefinite"
          path={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
        />
      </circle>
      {edge.label && (
        <text x={mx} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize={9}
          fill="oklch(0.6 0.08 285)" fontFamily="Inter, sans-serif">
          {edge.label}
        </text>
      )}
    </g>
  );
}

function GraphNode({ node, index }: { node: NodeDef; index: number }) {
  const Icon = node.icon;
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
    >
      {/* Glow */}
      <rect x={node.x - 2} y={node.y - 2} width={148} height={60} rx={13}
        fill={`${node.color.replace(")", " / 0.08)")}`}
        style={{ filter: `drop-shadow(0 0 8px ${node.color.replace(")", " / 0.4)")})` }}
      />
      {/* Card bg */}
      <rect x={node.x} y={node.y} width={144} height={56} rx={11}
        fill="oklch(0.13 0.02 270 / 0.92)"
        stroke={`${node.color.replace(")", " / 0.4)")}`}
        strokeWidth={1}
      />
      {/* Icon bg */}
      <rect x={node.x + 8} y={node.y + 10} width={36} height={36} rx={8}
        fill={`${node.color.replace(")", " / 0.18)")}`}
      />
      <foreignObject x={node.x + 8} y={node.y + 10} width={36} height={36}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
          <Icon style={{ width: 16, height: 16, color: node.color }} />
        </div>
      </foreignObject>
      {/* Labels */}
      <text x={node.x + 52} y={node.y + 24} fontSize={9} fill="oklch(0.65 0.04 265)" fontFamily="Inter, sans-serif" fontWeight={500} letterSpacing="0.05em">
        {node.label.toUpperCase()}
      </text>
      <text x={node.x + 52} y={node.y + 38} fontSize={10.5} fill="oklch(0.92 0.01 260)" fontFamily="Inter, sans-serif" fontWeight={600}>
        {node.value.length > 16 ? node.value.slice(0, 16) + "…" : node.value}
      </text>
    </motion.g>
  );
}

export function ArchitectureCanvas({ architecture, view }: Props) {
  const { nodes, edges } = useMemo(() => buildGraph(architecture), [architecture]);

  if (view === "card") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {nodes.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="size-9 rounded-xl grid place-items-center flex-shrink-0"
              style={{ background: `${n.color.replace(")", " / 0.18)")}` }}>
              <n.icon className="size-4" style={{ color: n.color }} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{n.label}</div>
              <div className="text-sm font-medium truncate">{n.value}</div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Graph view
  const svgWidth = 820;
  const svgHeight = 380;

  return (
    <div className="w-full overflow-x-auto rounded-2xl glass p-3">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        style={{ minWidth: 560, maxHeight: 380 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Edges rendered behind nodes */}
        {edges.map((e, i) => (
          <GraphEdge key={i} nodes={nodes} edge={e} />
        ))}
        {/* Nodes */}
        {nodes.map((n, i) => (
          <GraphNode key={n.id} node={n} index={i} />
        ))}
      </svg>
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        ← Scroll to explore · Animated data paths show live service connections
      </p>
    </div>
  );
}
