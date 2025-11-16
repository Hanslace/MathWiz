// app/grapher/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  create,
  all,
  type MathType,
  type Complex,
  type Unit,
} from 'mathjs';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addGrapherEquation,
  updateGrapherEquation,
  removeGrapherEquation,
  setGrapherView,
} from '@/store/coreSlice';
import type { AngleMode } from '@/store/coreTypes';
import FunctionToolbox from '@/components/FunctionToolbox';

const math = create(all, {});

type GrapherEquation = {
  id: string;
  expr: string;
  visible: boolean;
  color: string;
  thickness?: number;
};

type GrapherView = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid: boolean;
  showAxes: boolean;
};

const COLOR_PALETTE = ['#ff4b8b', '#007aff', '#34c759', '#ff9500', '#af52de'];

// ---------- helpers ----------

function niceStep(range: number): number {
  const raw = range / 10;
  const pow10 = Math.pow(10, Math.floor(Math.log10(raw) || 0));
  const f = raw / pow10;
  let step = pow10;
  if (f < 1.5) step = 1 * pow10;
  else if (f < 3) step = 2 * pow10;
  else if (f < 7) step = 5 * pow10;
  else step = 10 * pow10;
  return step;
}

function formatTick(v: number): string {
  if (Math.abs(v) < 1e-10) return '0';
  const abs = Math.abs(v);
  if (abs >= 1000 || abs < 0.001) {
    return v.toExponential(2);
  }
  return parseFloat(v.toFixed(4)).toString();
}

function toRadians(
  x: number | Unit | MathType,
  angleMode: AngleMode,
): number {
  if (math.typeOf(x) === 'Unit') {
    return (x as Unit).toNumber('rad');
  }

  const n = typeof x === 'number' ? x : Number(x as number | string | bigint);
  if (Number.isNaN(n)) return NaN;

  if (angleMode === 'rad') return n;
  if (angleMode === 'deg') return (n * Math.PI) / 180;
  return (n * Math.PI) / 200; // grad
}

// evaluate expr at x, honoring angleMode
function evalAt(
  expr: string,
  xVal: number,
  angleMode: AngleMode,
): number | null {
  try {
    const scope: Record<
      string,
      number | ((x: number | Unit | MathType) => number)
    > = {
      x: xVal,
      sin: (xArg) => math.sin(toRadians(xArg, angleMode)) as number,
      cos: (xArg) => math.cos(toRadians(xArg, angleMode)) as number,
      tan: (xArg) => math.tan(toRadians(xArg, angleMode)) as number,
      asin: (xArg) => math.asin(xArg as number) as number,
      acos: (xArg) => math.acos(xArg as number) as number,
      atan: (xArg) => math.atan(xArg as number) as number,
    };

    const v = math.evaluate(expr, scope) as MathType;

    if (math.isComplex(v)) {
      const complex = v as Complex;
      const re = complex.re as number;
      return Number.isFinite(re) ? re : null;
    }

    if (typeof v === 'number') {
      return Number.isFinite(v) ? v : null;
    }

    const n = Number(v as number | string | bigint);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

// ---------- component ----------

export default function GrapherPage() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.core.settings);
  const equations = useAppSelector(
    (s) => s.core.grapher.equations as GrapherEquation[],
  );
  const view = useAppSelector(
    (s) => s.core.grapher.view as GrapherView,
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [toolOpen, setToolOpen] = useState<boolean>(false);
  const [activeEquationId, setActiveEquationId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ---------- drawing ----------

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 380;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const { xMin, xMax, yMin, yMax, showGrid, showAxes } = view;
    if (xMax <= xMin || yMax <= yMin) return;

    const padding = 32;
    const plotW = width - padding * 2;
    const plotH = height - padding * 2;

    const xToPx = (x: number): number =>
      padding + ((x - xMin) / (xMax - xMin)) * plotW;
    const yToPx = (y: number): number =>
      height - padding - ((y - yMin) / (yMax - yMin)) * plotH;

    // background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const xStep = niceStep(xMax - xMin);
    const yStep = niceStep(yMax - yMin);

    // grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;

      // vertical lines
      const xStart = Math.ceil(xMin / xStep) * xStep;
      for (let x = xStart; x <= xMax; x += xStep) {
        const px = xToPx(x);
        ctx.beginPath();
        ctx.moveTo(px, padding);
        ctx.lineTo(px, height - padding);
        ctx.stroke();
      }

      // horizontal lines
      const yStart = Math.ceil(yMin / yStep) * yStep;
      for (let y = yStart; y <= yMax; y += yStep) {
        const py = yToPx(y);
        ctx.beginPath();
        ctx.moveTo(padding, py);
        ctx.lineTo(width - padding, py);
        ctx.stroke();
      }
    }

    // axes + axis labels + tick labels
    if (showAxes) {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#222';

      // axis positions
      let yAxisX: number | null = null;
      if (xMin < 0 && xMax > 0) {
        const px = xToPx(0);
        yAxisX = px;
        ctx.beginPath();
        ctx.moveTo(px, padding);
        ctx.lineTo(px, height - padding);
        ctx.stroke();
      }

      let xAxisY: number | null = null;
      if (yMin < 0 && yMax > 0) {
        const py = yToPx(0);
        xAxisY = py;
        ctx.beginPath();
        ctx.moveTo(padding, py);
        ctx.lineTo(width - padding, py);
        ctx.stroke();
      }

      ctx.fillStyle = '#333';
      ctx.font =
        '11px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

      // x axis letter
      const xLabelY =
        xAxisY !== null ? xAxisY + 10 : height - padding + 6;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('x', width - padding + 4, xLabelY);

      // y axis letter
      const yLabelX =
        yAxisX !== null ? yAxisX - 10 : padding - 6;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('y', yLabelX, padding - 4);

      // tick labels on x axis
      {
        const axisY =
          xAxisY !== null ? xAxisY : height - padding;
        ctx.strokeStyle = '#444';
        ctx.fillStyle = '#555';
        ctx.font =
          '10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const xStart = Math.ceil(xMin / xStep) * xStep;
        for (let x = xStart; x <= xMax; x += xStep) {
          const px = xToPx(x);
          // tick
          ctx.beginPath();
          ctx.moveTo(px, axisY - 4);
          ctx.lineTo(px, axisY + 4);
          ctx.stroke();

          // label
          const label = formatTick(x);
          ctx.fillText(label, px, axisY + 6);
        }
      }

      // tick labels on y axis
      {
        const axisX =
          yAxisX !== null ? yAxisX : padding;
        ctx.strokeStyle = '#444';
        ctx.fillStyle = '#555';
        ctx.font =
          '10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const yStart = Math.ceil(yMin / yStep) * yStep;
        for (let y = yStart; y <= yMax; y += yStep) {
          const py = yToPx(y);
          // tick
          ctx.beginPath();
          ctx.moveTo(axisX - 4, py);
          ctx.lineTo(axisX + 4, py);
          ctx.stroke();

          // label
          const label = formatTick(y);
          ctx.fillText(label, axisX - 6, py);
        }
      }
    }

    // plot equations
    const samples = Math.max(200, plotW);

    equations.forEach((eq) => {
      if (!eq.visible || !eq.expr.trim()) return;

      ctx.beginPath();
      ctx.lineWidth = eq.thickness ?? 2;
      ctx.strokeStyle = eq.color || '#ff4b8b';

      let penDown = false;
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const x = xMin + t * (xMax - xMin);
        const yVal = evalAt(eq.expr, x, settings.angleMode);
        if (yVal == null || !Number.isFinite(yVal)) {
          penDown = false;
          continue;
        }
        const px = xToPx(x);
        const py = yToPx(yVal);

        if (!penDown) {
          ctx.moveTo(px, py);
          penDown = true;
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.stroke();
    });
  }, [equations, view, settings.angleMode]);

  // ---------- handlers using store ----------

  const updateView = (patch: Partial<GrapherView>): void => {
    dispatch(setGrapherView(patch));
  };

  const updateEquation = (
    id: string,
    patch: Partial<GrapherEquation>,
  ): void => {
    dispatch(updateGrapherEquation({ id, patch }));
  };

  const addEquation = (): void => {
    const idx = equations.length % COLOR_PALETTE.length;
    dispatch(
      addGrapherEquation({
        expr: '',
        color: COLOR_PALETTE[idx],
      }),
    );
  };

  const zoom = (factor: number): void => {
    const { xMin, xMax, yMin, yMax } = view;
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;

    const newHalfX = ((xMax - xMin) * factor) / 2;
    const newHalfY = ((yMax - yMin) * factor) / 2;

    updateView({
      xMin: cx - newHalfX,
      xMax: cx + newHalfX,
      yMin: cy - newHalfY,
      yMax: cy + newHalfY,
    });
  };

  const resetView = (): void => {
    updateView({
      xMin: -10,
      xMax: 10,
      yMin: -5,
      yMax: 5,
      showAxes: true,
      showGrid: true,
    });
  };

  // ---------- toolbox insertion for equations (inline in sidebar) ----------

  const insertSnippet = (snippet: string, cursorOffset: number): void => {
    if (!activeEquationId) return;
    const el = inputRefs.current[activeEquationId];
    const eq = equations.find((e) => e.id === activeEquationId);
    if (!eq) return;

    const current = eq.expr ?? '';

    if (el && typeof el.selectionStart === 'number') {
      const start = el.selectionStart;
      const end = el.selectionEnd ?? start;
      const before = current.slice(0, start);
      const after = current.slice(end);
      const next = before + snippet + after;

      updateEquation(activeEquationId, { expr: next });

      requestAnimationFrame(() => {
        const pos = start + snippet.length + cursorOffset;
        const clampedPos = Math.max(0, Math.min(next.length, pos));
        el.selectionStart = el.selectionEnd = clampedPos;
        el.focus();
      });
    } else {
      const next = current + snippet;
      updateEquation(activeEquationId, { expr: next });
    }
  };

  return (
    <div className="graph-root">
      <div className="graph-card">
        <div className="graph-header">Grapher</div>

        <div className="graph-main">
          <div className="graph-canvas-shell" ref={containerRef}>
            <canvas ref={canvasRef} />
          </div>

          <div className="graph-sidebar">
            <div className="view-panel">
              <div className="panel-title">View window</div>
              <div className="range-grid">
                <div className="range-row">
                  <span>X min</span>
                  <input
                    type="number"
                    value={view.xMin}
                    onChange={(e) =>
                      updateView({ xMin: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="range-row">
                  <span>X max</span>
                  <input
                    type="number"
                    value={view.xMax}
                    onChange={(e) =>
                      updateView({ xMax: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="range-row">
                  <span>Y min</span>
                  <input
                    type="number"
                    value={view.yMin}
                    onChange={(e) =>
                      updateView({ yMin: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="range-row">
                  <span>Y max</span>
                  <input
                    type="number"
                    value={view.yMax}
                    onChange={(e) =>
                      updateView({ yMax: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="view-toggles">
                <label>
                  <input
                    type="checkbox"
                    checked={view.showGrid}
                    onChange={(e) =>
                      updateView({ showGrid: e.target.checked })
                    }
                  />
                  Grid
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={view.showAxes}
                    onChange={(e) =>
                      updateView({ showAxes: e.target.checked })
                    }
                  />
                  Axes
                </label>
              </div>

              <div className="view-actions">
                <button type="button" onClick={() => zoom(0.5)}>
                  Zoom in
                </button>
                <button type="button" onClick={() => zoom(2)}>
                  Zoom out
                </button>
                <button type="button" onClick={resetView}>
                  Reset
                </button>
              </div>
            </div>

            <div className="func-panel">
              <div className="panel-title">Functions y = f(x)</div>

              {toolOpen && activeEquationId && (
                <div className="inline-tool-wrapper">
                  <FunctionToolbox
                    open={toolOpen}
                    onClose={() => {
                      setToolOpen(false);
                      setActiveEquationId(null);
                    }}
                    onInsert={insertSnippet}
                  />
                </div>
              )}

              <div className="func-list">
                {equations.map((eq, idx) => (
                  <div key={eq.id} className="func-row">
                    <button
                      type="button"
                      className={
                        'vis-toggle' + (eq.visible ? ' vis-on' : ' vis-off')
                      }
                      onClick={() =>
                        updateEquation(eq.id, { visible: !eq.visible })
                      }
                    >
                      ●
                    </button>
                    <button
                      type="button"
                      className="func-tool"
                      onClick={() => {
                        setActiveEquationId(eq.id);
                        setToolOpen(true);
                        const el = inputRefs.current[eq.id];
                        if (el) {
                          const len = el.value.length;
                          requestAnimationFrame(() => {
                            el.focus();
                            el.setSelectionRange(len, len);
                          });
                        }
                      }}
                    >
                      fx
                    </button>
                    <input
                      className="func-input"
                      placeholder="sin(x), x^2, exp(-x^2), …"
                      value={eq.expr}
                      ref={(el) => {
                        inputRefs.current[eq.id] = el;
                      }}
                      onChange={(e) =>
                        updateEquation(eq.id, { expr: e.target.value })
                      }
                    />
                    <input
                      type="color"
                      className="func-color"
                      value={
                        eq.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]
                      }
                      onChange={(e) =>
                        updateEquation(eq.id, { color: e.target.value })
                      }
                    />
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={eq.thickness ?? 2}
                      onChange={(e) =>
                        updateEquation(eq.id, {
                          thickness: Number(e.target.value),
                        })
                      }
                      className="thick-slider"
                    />
                    <button
                      type="button"
                      className="func-remove"
                      onClick={() => {
                        if (activeEquationId === eq.id) {
                          setToolOpen(false);
                          setActiveEquationId(null);
                        }
                        dispatch(removeGrapherEquation(eq.id));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="add-func" onClick={addEquation}>
                + Add function
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .graph-root {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f7;
        }

        .graph-card {
          width: min(900px, 100% - 32px);
          height: min(560px, 95vh);
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
          padding: 14px 16px 16px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .graph-header {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #555;
          margin-bottom: 8px;
        }

        .graph-main {
          flex: 1;
          display: flex;
          gap: 12px;
          min-height: 0;
        }

        .graph-canvas-shell {
          flex: 3;
          border-radius: 10px;
          border: 1px solid #e0e0e0;
          background: #fafafa;
          position: relative;
          overflow: hidden;
        }

        .graph-canvas-shell canvas {
          width: 100%;
          height: 100%;
          display: block;
        }

        .graph-sidebar {
          flex: 2;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .panel-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.7;
          margin-bottom: 4px;
        }

        .view-panel {
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid #ececec;
          background: #fafafa;
        }

        .range-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px 8px;
          margin-bottom: 6px;
        }

        .range-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          font-size: 12px;
        }

        .range-row input {
          width: 70px;
          padding: 3px 4px;
          border-radius: 6px;
          border: 1px solid #d0d0d0;
          font-size: 12px;
        }

        .view-toggles {
          display: flex;
          gap: 12px;
          font-size: 12px;
          margin-bottom: 6px;
        }

        .view-toggles label {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .view-actions {
          display: flex;
          gap: 6px;
        }

        .view-actions button {
          flex: 1;
          padding: 4px 0;
          border-radius: 999px;
          border: 1px solid #d0d0d0;
          background: #ffffff;
          font-size: 12px;
        }

        .func-panel {
          flex: 1;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid #ececec;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .inline-tool-wrapper {
          margin-bottom: 6px;
        }

        .func-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 4px;
          margin-bottom: 8px;
        }

        .func-row {
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr) auto auto auto;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .vis-toggle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1px solid #ccc;
          background: #f5f5f5;
          font-size: 10px;
          line-height: 1;
        }

        .vis-on {
          background: #ff69b4;
          border-color: #ff69b4;
          color: #fff;
        }

        .vis-off {
          opacity: 0.3;
        }

        .func-tool {
          width: 28px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid #d0d0d0;
          background: #fff0fb;
          font-size: 10px;
          font-weight: 600;
        }

        .func-input {
          padding: 4px 6px;
          border-radius: 6px;
          border: 1px solid #d0d0d0;
          font-size: 12px;
        }

        .func-color {
          width: 24px;
          height: 24px;
          padding: 0;
          border: none;
          background: transparent;
        }

        .thick-slider {
          width: 60px;
        }

        .func-remove {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          border: 1px solid #d0d0d0;
          background: #ffffff;
          font-size: 12px;
        }

        .add-func {
          align-self: flex-start;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #d0d0d0;
          background: #ffffff;
          font-size: 12px;
        }

        @media (max-width: 800px) {
          .graph-main {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
