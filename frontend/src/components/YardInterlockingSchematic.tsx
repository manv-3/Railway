/**
 * YardInterlockingSchematic - Interactive SVG Track Schematic
 * PS 26027 - Indian Railways AI Block Planning Platform
 *
 * Renders a simplified but realistic SVG interlocking yard schematic for
 * key junction stations (GZB - Ghaziabad, ALJN - Aligarh Junction).
 *
 * Features:
 * - Main lines (UP/DOWN), loop lines, crossovers, signal heads
 * - Signal aspects: RED, YELLOW, DOUBLE_YELLOW, GREEN (4-aspect signalling)
 * - Active block section highlighting in amber/red
 * - Signal aspect legend
 * - V3-06: P2 deliverable
 */

import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SignalAspect = 'RED' | 'YELLOW' | 'DOUBLE_YELLOW' | 'GREEN';
type StationCode = 'GZB' | 'ALJN';

interface YardInterlockingSchematicProps {
  /** Station to render: GZB (Ghaziabad) or ALJN (Aligarh Junction) */
  stationCode: StationCode;
  /** Optional active block identifier to highlight affected track section */
  activeBlock?: string;
  /** Map of signal ID → aspect color */
  signalAspects?: Record<string, SignalAspect>;
}

// ─── Signal Colors ────────────────────────────────────────────────────────────

const ASPECT_COLORS: Record<SignalAspect, string> = {
  RED: '#e53935',
  YELLOW: '#fbc02d',
  DOUBLE_YELLOW: '#fbc02d',
  GREEN: '#43a047',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SignalHeadProps {
  x: number;
  y: number;
  id: string;
  aspect: SignalAspect;
  label?: string;
  isDoubleYellow?: boolean;
}

const SignalHead: React.FC<SignalHeadProps> = ({ x, y, id, aspect, label, isDoubleYellow }) => {
  const color = ASPECT_COLORS[aspect];
  return (
    <g id={`signal-${id}`}>
      {/* Signal post */}
      <line x1={x} y1={y} x2={x} y2={y + 16} stroke="#37474f" strokeWidth={2} />
      {/* Primary lamp */}
      <circle cx={x} cy={y} r={6} fill={color} stroke="#fff" strokeWidth={1.5} opacity={0.95} />
      {/* Double yellow: second lamp offset above */}
      {isDoubleYellow && aspect === 'DOUBLE_YELLOW' && (
        <circle cx={x} cy={y - 14} r={6} fill={ASPECT_COLORS.YELLOW} stroke="#fff" strokeWidth={1.5} opacity={0.95} />
      )}
      {/* Signal ID label */}
      {label && (
        <text x={x + 8} y={y + 4} fontSize={8} fill="#455a64" fontFamily="monospace">
          {label}
        </text>
      )}
    </g>
  );
};

interface TrackLineProps {
  x1: number; y1: number;
  x2: number; y2: number;
  isActive?: boolean;
  label?: string;
}

const TrackLine: React.FC<TrackLineProps> = ({ x1, y1, x2, y2, isActive, label }) => (
  <g>
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={isActive ? '#e65100' : '#455a64'}
      strokeWidth={isActive ? 5 : 3}
      strokeLinecap="round"
    />
    {isActive && (
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#ff6d00"
        strokeWidth={2}
        strokeDasharray="8 6"
        strokeLinecap="round"
        opacity={0.7}
      />
    )}
    {label && (
      <text x={(x1 + x2) / 2} y={y1 - 6} fontSize={9} fill="#546e7a" textAnchor="middle" fontFamily="sans-serif">
        {label}
      </text>
    )}
  </g>
);

// ─── GZB Schematic ───────────────────────────────────────────────────────────

const GZBSchematic: React.FC<{ activeBlock?: string; aspects: Record<string, SignalAspect> }> = ({
  activeBlock,
  aspects,
}) => {
  const isActive = !!activeBlock;

  return (
    <g>
      {/* Station name */}
      <text x={300} y={20} fontSize={13} fontWeight="bold" fill="#1a237e" textAnchor="middle" fontFamily="sans-serif">
        GZB — Ghaziabad Junction
      </text>
      <text x={300} y={34} fontSize={9} fill="#78909c" textAnchor="middle" fontFamily="sans-serif">
        UP + DOWN + 3 Loop Lines | Delhi–Kanpur Corridor
      </text>

      {/* ── UP Main Line ── */}
      <TrackLine x1={20} y1={75} x2={580} y2={75} isActive={isActive} label="UP MAIN LINE" />

      {/* ── DOWN Main Line ── */}
      <TrackLine x1={20} y1={105} x2={580} y2={105} label="DOWN MAIN LINE" />

      {/* ── Loop Line 1 ── */}
      <TrackLine x1={60} y1={135} x2={520} y2={135} label="LOOP 1" />

      {/* ── Loop Line 2 ── */}
      <TrackLine x1={80} y1={160} x2={500} y2={160} label="LOOP 2" />

      {/* ── Loop Line 3 ── */}
      <TrackLine x1={100} y1={185} x2={480} y2={185} label="LOOP 3" />

      {/* ── Entry Crossovers (left) ── */}
      <line x1={60} y1={75} x2={80} y2={135} stroke="#455a64" strokeWidth={2} />
      <line x1={70} y1={105} x2={80} y2={135} stroke="#455a64" strokeWidth={2} />
      <line x1={80} y1={135} x2={100} y2={160} stroke="#455a64" strokeWidth={2} />
      <line x1={90} y1={160} x2={100} y2={185} stroke="#455a64" strokeWidth={2} />

      {/* ── Exit Crossovers (right) ── */}
      <line x1={520} y1={75} x2={500} y2={135} stroke="#455a64" strokeWidth={2} />
      <line x1={510} y1={105} x2={500} y2={135} stroke="#455a64" strokeWidth={2} />
      <line x1={500} y1={135} x2={480} y2={160} stroke="#455a64" strokeWidth={2} />
      <line x1={490} y1={160} x2={480} y2={185} stroke="#455a64" strokeWidth={2} />

      {/* ── Signals — Entry (left side) ── */}
      <SignalHead x={55} y={60} id="GZB-UP-HOME" aspect={aspects['GZB-UP-HOME'] ?? 'GREEN'} label="UP HOME" />
      <SignalHead x={55} y={90} id="GZB-DN-HOME" aspect={aspects['GZB-DN-HOME'] ?? 'GREEN'} label="DN HOME" />
      <SignalHead x={55} y={120} id="GZB-L1-HOME" aspect={aspects['GZB-L1-HOME'] ?? 'RED'} label="LP1 HOME" />

      {/* ── Signals — Exit (right side) ── */}
      <SignalHead x={525} y={60} id="GZB-UP-STARTER" aspect={aspects['GZB-UP-STARTER'] ?? 'GREEN'} label="UP STARTER" isDoubleYellow />
      <SignalHead x={525} y={90} id="GZB-DN-STARTER" aspect={aspects['GZB-DN-STARTER'] ?? 'YELLOW'} label="DN STARTER" isDoubleYellow />
      <SignalHead x={505} y={120} id="GZB-L1-STARTER" aspect={aspects['GZB-L1-STARTER'] ?? 'RED'} label="LP1 STARTER" />
      <SignalHead x={485} y={145} id="GZB-L2-STARTER" aspect={aspects['GZB-L2-STARTER'] ?? 'RED'} label="LP2 STARTER" />

      {/* ── Active block overlay text ── */}
      {activeBlock && (
        <text x={300} y={210} fontSize={10} fill="#e65100" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
          ⚠ ACTIVE BLOCK: {activeBlock} — UP MAIN CLOSED
        </text>
      )}
    </g>
  );
};

// ─── ALJN Schematic ───────────────────────────────────────────────────────────

const ALJNSchematic: React.FC<{ activeBlock?: string; aspects: Record<string, SignalAspect> }> = ({
  activeBlock,
  aspects,
}) => {
  const isActive = !!activeBlock;

  return (
    <g>
      {/* Station name */}
      <text x={300} y={20} fontSize={13} fontWeight="bold" fill="#1a237e" textAnchor="middle" fontFamily="sans-serif">
        ALJN — Aligarh Junction
      </text>
      <text x={300} y={34} fontSize={9} fill="#78909c" textAnchor="middle" fontFamily="sans-serif">
        UP + DOWN + 2 Loop Lines | NR–NCR Division Boundary
      </text>

      {/* ── UP Main Line ── */}
      <TrackLine x1={20} y1={80} x2={580} y2={80} isActive={isActive} label="UP MAIN LINE" />

      {/* ── DOWN Main Line ── */}
      <TrackLine x1={20} y1={110} x2={580} y2={110} label="DOWN MAIN LINE" />

      {/* ── Loop Line 1 ── */}
      <TrackLine x1={70} y1={140} x2={520} y2={140} label="LOOP 1" />

      {/* ── Loop Line 2 ── */}
      <TrackLine x1={90} y1={165} x2={500} y2={165} label="LOOP 2" />

      {/* ── Entry Crossovers ── */}
      <line x1={70} y1={80} x2={90} y2={140} stroke="#455a64" strokeWidth={2} />
      <line x1={75} y1={110} x2={90} y2={140} stroke="#455a64" strokeWidth={2} />
      <line x1={90} y1={140} x2={100} y2={165} stroke="#455a64" strokeWidth={2} />

      {/* ── Exit Crossovers ── */}
      <line x1={520} y1={80} x2={500} y2={140} stroke="#455a64" strokeWidth={2} />
      <line x1={515} y1={110} x2={500} y2={140} stroke="#455a64" strokeWidth={2} />
      <line x1={500} y1={140} x2={490} y2={165} stroke="#455a64" strokeWidth={2} />

      {/* ── Signals — Entry ── */}
      <SignalHead x={65} y={65} id="ALJN-UP-HOME" aspect={aspects['ALJN-UP-HOME'] ?? 'GREEN'} label="UP HOME" />
      <SignalHead x={65} y={95} id="ALJN-DN-HOME" aspect={aspects['ALJN-DN-HOME'] ?? 'GREEN'} label="DN HOME" />

      {/* ── Signals — Exit ── */}
      <SignalHead x={525} y={65} id="ALJN-UP-STARTER" aspect={aspects['ALJN-UP-STARTER'] ?? 'DOUBLE_YELLOW'} label="UP STARTER" isDoubleYellow />
      <SignalHead x={525} y={95} id="ALJN-DN-STARTER" aspect={aspects['ALJN-DN-STARTER'] ?? 'GREEN'} label="DN STARTER" isDoubleYellow />
      <SignalHead x={505} y={125} id="ALJN-L1-STARTER" aspect={aspects['ALJN-L1-STARTER'] ?? 'RED'} label="L1 STARTER" />
      <SignalHead x={485} y={150} id="ALJN-L2-STARTER" aspect={aspects['ALJN-L2-STARTER'] ?? 'RED'} label="L2 STARTER" />

      {/* ── NR/NCR Division Boundary marker ── */}
      <line x1={300} y1={60} x2={300} y2={185} stroke="#7b1fa2" strokeWidth={1} strokeDasharray="4 4" />
      <text x={304} y={75} fontSize={8} fill="#7b1fa2" fontFamily="sans-serif">NR | NCR</text>

      {/* ── Active block overlay text ── */}
      {activeBlock && (
        <text x={300} y={195} fontSize={10} fill="#e65100" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
          ⚠ ACTIVE BLOCK: {activeBlock} — UP MAIN CLOSED
        </text>
      )}
    </g>
  );
};

// ─── Legend ───────────────────────────────────────────────────────────────────

const SignalLegend: React.FC = () => (
  <g transform="translate(20, 215)">
    <text fontSize={9} fill="#546e7a" fontFamily="sans-serif" fontWeight="bold">Signal Aspects (4-Aspect ABS):</text>
    {(['GREEN', 'DOUBLE_YELLOW', 'YELLOW', 'RED'] as SignalAspect[]).map((aspect, i) => (
      <g key={aspect} transform={`translate(${i * 130}, 12)`}>
        <circle cx={6} cy={0} r={5} fill={ASPECT_COLORS[aspect]} />
        <text x={14} y={4} fontSize={8} fill="#546e7a" fontFamily="sans-serif">
          {aspect.replace('_', ' ')}
        </text>
      </g>
    ))}
  </g>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const YardInterlockingSchematic: React.FC<YardInterlockingSchematicProps> = ({
  stationCode,
  activeBlock,
  signalAspects = {},
}) => {
  const svgHeight = stationCode === 'GZB' ? 250 : 240;

  return (
    <svg
      width="100%"
      viewBox={`0 0 600 ${svgHeight}`}
      style={{ background: '#f9fbe7', border: '1px solid #c8e6c9', borderRadius: 4 }}
      role="img"
      aria-label={`Yard interlocking schematic for ${stationCode}`}
    >
      {stationCode === 'GZB' ? (
        <GZBSchematic activeBlock={activeBlock} aspects={signalAspects} />
      ) : (
        <ALJNSchematic activeBlock={activeBlock} aspects={signalAspects} />
      )}
      <SignalLegend />
    </svg>
  );
};

export default YardInterlockingSchematic;
