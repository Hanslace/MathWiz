// Calc.tsx
'use client';

import { useRef, useState } from 'react';
import { create, all, type MathType, type Complex, type Unit } from 'mathjs';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCalculationInput,
  pushCalculationHistory,
  clearCalculation,
  setSettings,
} from '@/store/coreSlice';
import type { AngleMode, ComplexMode } from '@/store/coreTypes';
import FunctionToolbox from '@/components/FunctionToolbox';

const math = create(all, {});

const ANGLE_MODES: AngleMode[] = ['deg', 'rad', 'grad'];
const COMPLEX_MODES: ComplexMode[] = ['a+bi', 'r∠θ'];

type TrigArg = MathType;
type TrigFn = (x: TrigArg) => number;

type TrigScope = {
  sin: TrigFn;
  cos: TrigFn;
  tan: TrigFn;
  asin: TrigFn;
  acos: TrigFn;
  atan: TrigFn;
};

// ---------- helpers using settings ----------

function toRadians(x: MathType, angleMode: AngleMode): number {
  if (math.typeOf(x) === 'Unit') {
    return (x as Unit).toNumber('rad');
  }

  const n =
    typeof x === 'number'
      ? x
      : Number(x);

  if (Number.isNaN(n)) return NaN;

  if (angleMode === 'rad') return n;
  if (angleMode === 'deg') return (n * Math.PI) / 180;
  return (n * Math.PI) / 200; // grad
}

function fromRadians(v: number, angleMode: AngleMode): number {
  if (angleMode === 'rad') return v;
  if (angleMode === 'deg') return (v * 180) / Math.PI;
  return (v * 200) / Math.PI; // grad
}

function evalWithSettings(expr: string, angleMode: AngleMode): MathType {
  const scope: TrigScope = {
    sin: (x) => math.sin(toRadians(x, angleMode)) as number,
    cos: (x) => math.cos(toRadians(x, angleMode)) as number,
    tan: (x) => math.tan(toRadians(x, angleMode)) as number,
    asin: (x) => fromRadians(math.asin(x as number) as number, angleMode),
    acos: (x) => fromRadians(math.acos(x as number) as number, angleMode),
    atan: (x) => fromRadians(math.atan(x as number) as number, angleMode),
  };

  return math.evaluate(expr, scope) as MathType;
}

function formatNumber(x: number): string {
  if (Math.abs(x) < 1e-12) return '0';
  return math.format(x, { precision: 8 });
}

function formatResultWithSettings(
  value: MathType,
  angleMode: AngleMode,
  complexMode: ComplexMode,
): string {
  if (math.isComplex(value)) {
    const z = value as Complex;
    if (complexMode === 'a+bi') {
      const re = z.re as number;
      const im = z.im as number;
      const reStr = formatNumber(re);
      const imAbsStr = formatNumber(Math.abs(im));
      const sign = im >= 0 ? '+' : '-';
      return `${reStr} ${sign} ${imAbsStr}i`;
    } else {
      const r = math.abs(z) as number;
      const phiRad = math.arg(z) as number;
      const theta = fromRadians(phiRad, angleMode);
      return `${formatNumber(r)} ∠ ${formatNumber(theta)}`;
    }
  }

  try {
    return math.format(value, { precision: 12 });
  } catch {
    return String(value);
  }
}

// ---------- component ----------

export default function Calc() {
  const dispatch = useAppDispatch();
  const { input, history } = useAppSelector((s) => s.core.calculation);
  const settings = useAppSelector((s) => s.core.settings);

  const [toolOpen, setToolOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const tmp = document.createElement('textarea');
      tmp.value = text;
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      try {
        document.execCommand('copy');
      } catch {
        // ignore
      }
      document.body.removeChild(tmp);
    }
  };

  const enter = () => {
    const expr = input.trim();
    if (!expr) return;

    try {
      const raw = evalWithSettings(expr, settings.angleMode);
      const result = formatResultWithSettings(
        raw,
        settings.angleMode,
        settings.complexMode,
      );

      dispatch(
        pushCalculationHistory({
          expr,
          result,
        }),
      );
      dispatch(setCalculationInput(''));
    } catch {
      dispatch(clearCalculation());
    }
  };

  const insertSnippet = (snippet: string, cursorOffset: number) => {
    const el = inputRef.current;
    const current = input ?? '';

    if (el && typeof el.selectionStart === 'number') {
      const start = el.selectionStart;
      const end = el.selectionEnd ?? start;
      const before = current.slice(0, start);
      const after = current.slice(end);
      const next = before + snippet + after;

      dispatch(setCalculationInput(next));

      requestAnimationFrame(() => {
        const pos = start + snippet.length + cursorOffset;
        const clampedPos = Math.max(0, Math.min(next.length, pos));
        el.selectionStart = el.selectionEnd = clampedPos;
        el.focus();
      });
    } else {
      const next = current + snippet;
      dispatch(setCalculationInput(next));
    }
  };

  return (
    <div className="calc-root">
      <div className="calc-card">
        <div className="calc-header">Calculation</div>

        <div className="settings-bar">
          <div className="settings-group">
            <span className="settings-label">Angle</span>
            <div className="settings-options">
              {ANGLE_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => dispatch(setSettings({ angleMode: mode }))}
                  className={
                    'settings-chip' +
                    (settings.angleMode === mode ? ' settings-chip-active' : '')
                  }
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-group">
            <span className="settings-label">Complex</span>
            <div className="settings-options">
              {COMPLEX_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => dispatch(setSettings({ complexMode: mode }))}
                  className={
                    'settings-chip' +
                    (settings.complexMode === mode ? ' settings-chip-active' : '')
                  }
                >
                  {mode === 'a+bi' ? 'a + bi' : 'r ∠ θ'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="hist">
          {history.map((h) => (
            <div key={h.id} className="row">
              <span
                className="expr"
                onClick={() => copyToClipboard(h.expr)}
                title="Click to copy expression"
              >
                {h.expr}
              </span>
              <span
                className="res"
                onClick={() => copyToClipboard(h.result)}
                title="Click to copy result"
              >
                {h.result}
              </span>
            </div>
          ))}
        </div>

        <div className="input-bar">
          <button
            type="button"
            className="tool-btn"
            onClick={() => setToolOpen(true)}
          >
            fx
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => dispatch(setCalculationInput(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') enter();
            }}
            className="inp"
            placeholder="Enter expression"
          />
        </div>
      </div>

      <FunctionToolbox
        open={toolOpen}
        onClose={() => setToolOpen(false)}
        onInsert={insertSnippet}
      />

      <style jsx>{`
        .calc-root {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f7;
        }

        .calc-card {
          width: min(520px, 100% - 32px);
          height: min(520px, 90vh);
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
          padding: 14px 16px 16px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .calc-header {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #555;
          margin-bottom: 6px;
        }

        .settings-bar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 6px 8px;
          border-radius: 10px;
          background: #fafafa;
          border: 1px solid #ececec;
          margin-bottom: 8px;
        }

        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .settings-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.7;
        }

        .settings-options {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .settings-chip {
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid #d0d0d0;
          background: #ffffff;
          font-size: 11px;
          cursor: pointer;
        }

        .settings-chip-active {
          background: #ff69b4;
          border-color: #ff69b4;
          color: #ffffff;
        }

        .hist {
          flex: 1;
          overflow-y: auto;
          border-radius: 8px;
          padding: 8px 10px;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-family: SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
            'Courier New', monospace;
        }

        .row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          padding: 2px 0;
        }

        .row:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .expr {
          flex: 1;
          font-size: 13px;
          color: #555;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }

        .res {
          min-width: 80px;
          text-align: right;
          font-weight: 600;
          font-size: 13px;
          color: #111;
          cursor: pointer;
        }

        .input-bar {
          margin-top: 10px;
          border-top: 1px solid #e2e2e2;
          padding-top: 10px;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .tool-btn {
          flex-shrink: 0;
          width: 36px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #d0d0d0;
          background: #fff0fb;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .inp {
          flex: 1;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #d0d0d0;
          font-family: SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
            'Courier New', monospace;
          font-size: 13px;
          outline: none;
        }

        .inp:focus {
          border-color: #888;
        }
      `}</style>
    </div>
  );
}
