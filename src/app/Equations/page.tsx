// app/equations/page.tsx
'use client';

import { useEffect } from 'react';
import {
  create,
  all,
  type MathNode,
  type Matrix,
  type MathType,
} from 'mathjs';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setEquationsMode,
  setEquationsSystem,
  setEquationsPolynomial,
  setEquationsCustom,
  setEquationsSolution,
} from '@/store/coreSlice';

const math = create(all, {});

// ---------- small helpers ----------

type VarName = 'x' | 'y' | 'z' | 't';

type EquationNode = {
  eqStr: string;
  exprStr: string;
  node: MathNode;
};

type MaybeSymbolNode = MathNode & {
  isSymbolNode?: boolean;
  name?: string;
};

function toNumberArray(value: MathType): number[] {
  if (Array.isArray(value)) {
    return (value as (number | string | bigint)[]).map((v) => Number(v));
  }

  if (math.typeOf(value) === 'Matrix') {
    const arr = (value as Matrix).toArray() as (number | string | bigint)[];
    return arr.map((v) => Number(v));
  }

  return [Number(value as number | string | bigint)];
}

function formatNumber(v: number): string {
  if (!Number.isFinite(v)) return String(v);
  if (Math.abs(v) < 1e-12) return '0';
  return Number(v.toFixed(8)).toString();
}

// ---------- helpers: linear system ----------

function solveLinearSystem(system: string[]): string {
  const raw = system.map((s) => s.trim()).filter((s) => s.length > 0);
  if (raw.length === 0) {
    return 'Enter at least one equation (e.g. 2x + 3y = 5).';
  }

  try {
    const eqNodes: EquationNode[] = raw.map((eqStr) => {
      const parts = eqStr.split('=');
      let exprStr: string;
      if (parts.length === 1) {
        exprStr = parts[0];
      } else {
        const lhs = parts[0];
        const rhs = parts.slice(1).join('='); // keep any extra '=' in RHS
        exprStr = `(${lhs}) - (${rhs})`;
      }
      const node = math.parse(exprStr) as MathNode;
      return { eqStr, node, exprStr };
    });

    const candidateVars: VarName[] = ['x', 'y', 'z', 't'];
    const varSet = new Set<string>();

    eqNodes.forEach(({ node }) => {
      const syms = node.filter(
        (n: MathNode) =>
          (n as MaybeSymbolNode).isSymbolNode === true,
      ) as MaybeSymbolNode[];

      syms.forEach((sym) => {
        const name = sym.name;
        if (name && (candidateVars as string[]).includes(name)) {
          varSet.add(name);
        }
      });
    });

    const vars = Array.from(varSet);
    if (vars.length === 0) {
      return 'No variables (x, y, z, t) detected in the system.';
    }
    if (vars.length !== eqNodes.length) {
      return `Need same number of independent equations and variables.\nEquations: ${eqNodes.length}\nVariables: ${vars.length}`;
    }

    const A: number[][] = [];
    const b: number[] = [];

    eqNodes.forEach(({ node }) => {
      const zeroScope: Record<string, number> = {};
      vars.forEach((v) => {
        zeroScope[v] = 0;
      });

      const row: number[] = [];
      vars.forEach((v) => {
        const d = math.derivative(node, v) as MathNode;
        const valRaw = d.evaluate(zeroScope) as MathType;
        const valNum =
          typeof valRaw === 'number' ? valRaw : Number(valRaw as number | string | bigint);
        row.push(valNum);
      });

      const cRaw = node.evaluate(zeroScope) as MathType;
      const cNum =
        typeof cRaw === 'number' ? cRaw : Number(cRaw as number | string | bigint);

      A.push(row);
      b.push(-cNum);
    });

    const solMatrix = math.lusolve(A, b) as Matrix | number[][];
    const squeezed = math.squeeze(solMatrix) as MathType;
    const arr = toNumberArray(squeezed);

    if (arr.length !== vars.length) {
      return 'Unexpected solution shape from solver.';
    }

    const lines = vars.map((v, i) => `${v} = ${formatNumber(arr[i])}`);
    return lines.join('\n');
  } catch {
    return 'Unable to solve system. Check syntax (e.g. "2x + 3y = 5", "x - y = 1").';
  }
}

// ---------- helpers: polynomial (up to degree 2) ----------

function solvePolynomial(poly: string): string {
  const expr = poly.trim();
  if (!expr) return 'Enter a polynomial in x (e.g. x^2 + 3x + 2).';

  try {
    const node = math.parse(expr) as MathNode;

    // coefficients via derivatives at 0:
    // p(0) = c, p'(0) = b, p''(0) = 2a
    const scope0: Record<string, number> = { x: 0 };

    const p0Raw = node.evaluate(scope0) as MathType;
    const p0 =
      typeof p0Raw === 'number' ? p0Raw : Number(p0Raw as number | string | bigint);

    const dp = math.derivative(node, 'x') as MathNode;
    const p1Raw = dp.evaluate(scope0) as MathType;
    const p1 =
      typeof p1Raw === 'number' ? p1Raw : Number(p1Raw as number | string | bigint);

    const d2p = math.derivative(dp, 'x') as MathNode;
    const p2Raw = d2p.evaluate(scope0) as MathType;
    const p2 =
      typeof p2Raw === 'number' ? p2Raw : Number(p2Raw as number | string | bigint);

    const a = p2 / 2;
    const b = p1;
    const c = p0;

    // check that the expression actually behaves like a quadratic (or lower)
    const testXs = [-2, -1, 1, 2];
    let maxDiff = 0;
    for (const x of testXs) {
      const trueValRaw = node.evaluate({ x }) as MathType;
      const trueVal =
        typeof trueValRaw === 'number'
          ? trueValRaw
          : Number(trueValRaw as number | string | bigint);

      const quadVal = a * x * x + b * x + c;
      const diff = Math.abs(trueVal - quadVal);
      if (diff > maxDiff) maxDiff = diff;
    }

    if (maxDiff > 1e-6) {
      return 'Polynomial solver currently supports polynomials in x up to degree 2.';
    }

    const eps = 1e-12;

    if (Math.abs(a) < eps && Math.abs(b) < eps) {
      if (Math.abs(c) < eps) {
        return 'Identity 0 = 0 → infinitely many solutions.';
      }
      return 'No solution (equation reduces to a non-zero constant).';
    }

    if (Math.abs(a) < eps) {
      // linear
      const x = -c / b;
      return `Linear equation\nx = ${formatNumber(x)}`;
    }

    const D = b * b - 4 * a * c;

    if (D > eps) {
      const sqrtD = Math.sqrt(D);
      const x1 = (-b + sqrtD) / (2 * a);
      const x2 = (-b - sqrtD) / (2 * a);
      return `Two distinct real roots:\n x₁ = ${formatNumber(
        x1,
      )}\n x₂ = ${formatNumber(x2)}`;
    }

    if (Math.abs(D) <= eps) {
      const x0 = -b / (2 * a);
      return `One real double root:\n x = ${formatNumber(x0)}`;
    }

    // complex roots
    const sqrtAbsD = Math.sqrt(-D);
    const re = -b / (2 * a);
    const imMag = sqrtAbsD / (2 * Math.abs(a));
    const reStr = formatNumber(re);
    const imStr = formatNumber(imMag);

    return `Complex roots:\n x₁ = ${reStr} + ${imStr}i\n x₂ = ${reStr} - ${imStr}i`;
  } catch {
    return 'Error parsing polynomial. Use variable x (e.g. x^2 + 3x + 2).';
  }
}

// ---------- helpers: custom ----------

function solveCustom(expr: string): string {
  const src = expr.trim();
  if (!src) return 'Enter an expression.';

  try {
    const simplified = math.simplify(src) as MathNode;
    const simpStr = simplified.toString();

    let numericStr = '';
    try {
      const val = simplified.evaluate() as MathType;
      if (
        typeof val !== 'function' &&
        val !== undefined &&
        val !== null
      ) {
        numericStr = `\n\nNumeric value (with current defaults):\n${val.toString()}`;
      } else {
        numericStr = '\n\nNumeric value depends on variable assignments.';
      }
    } catch {
      numericStr = '\n\nNumeric value depends on variable assignments.';
    }

    return `Simplified form:\n${simpStr}${numericStr}`;
  } catch {
    return 'Error parsing expression.';
  }
}

// ---------- UI ----------

const MODES = [
  {
    id: 'linear-system' as const,
    label: 'Linear system',
    subtitle: 'Solve x, y, z from simultaneous equations',
  },
  {
    id: 'polynomial' as const,
    label: 'Polynomial',
    subtitle: 'Roots of a polynomial in x (up to degree 2)',
  },
  {
    id: 'custom' as const,
    label: 'Custom',
    subtitle: 'Simplify / evaluate a general expression',
  },
];

export default function EquationsPage() {
  const dispatch = useAppDispatch();
  const { mode, system, polynomial, custom, solution } = useAppSelector(
    (s) => s.core.equations,
  );

  // ensure at least two blank rows for system input
  useEffect(() => {
    if (mode === 'linear-system' && system.length === 0) {
      dispatch(setEquationsSystem(['', '']));
    }
  }, [mode, system.length, dispatch]);

  const handleModeClick = (m: (typeof MODES)[number]['id']): void => {
    dispatch(setEquationsMode(m));
    dispatch(setEquationsSolution(null));
  };

  const handleSolve = (): void => {
    let text: string;
    if (mode === 'linear-system') {
      text = solveLinearSystem(system);
    } else if (mode === 'polynomial') {
      text = solvePolynomial(polynomial);
    } else {
      text = solveCustom(custom);
    }
    dispatch(setEquationsSolution(text));
  };

  const handleClear = (): void => {
    if (mode === 'linear-system') {
      dispatch(setEquationsSystem(['', '']));
    } else if (mode === 'polynomial') {
      dispatch(setEquationsPolynomial(''));
    } else {
      dispatch(setEquationsCustom(''));
    }
    dispatch(setEquationsSolution(null));
  };

  return (
    <div className="eq-root">
      <div className="eq-card">
        <div className="eq-header">Equations</div>

        <div className="mode-bar">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleModeClick(m.id)}
              className={
                'mode-chip' + (mode === m.id ? ' mode-chip-active' : '')
              }
            >
              <div className="mode-chip-label">{m.label}</div>
              <div className="mode-chip-sub">{m.subtitle}</div>
            </button>
          ))}
        </div>

        <div className="eq-main">
          <div className="eq-input-panel">
            {mode === 'linear-system' && (
              <div className="panel-block">
                <div className="panel-title">Linear system</div>
                <div className="panel-sub">
                  One equation per line, using variables x, y, z, t. Example:
                  2x + 3y = 5
                </div>
                <textarea
                  className="eq-textarea"
                  rows={6}
                  value={system.join('\n')}
                  onChange={(e) =>
                    dispatch(
                      setEquationsSystem(
                        e.target.value.split(/\r?\n/),
                      ),
                    )
                  }
                />
              </div>
            )}

            {mode === 'polynomial' && (
              <div className="panel-block">
                <div className="panel-title">Polynomial in x</div>
                <div className="panel-sub">
                  Example: x^2 + 3x + 2 (solver supports degree ≤ 2)
                </div>
                <input
                  className="eq-input"
                  value={polynomial}
                  onChange={(e) =>
                    dispatch(setEquationsPolynomial(e.target.value))
                  }
                  placeholder="x^2 + 3x + 2"
                />
              </div>
            )}

            {mode === 'custom' && (
              <div className="panel-block">
                <div className="panel-title">Custom expression</div>
                <div className="panel-sub">
                  Any valid math.js expression. Variables without values stay
                  symbolic.
                </div>
                <textarea
                  className="eq-textarea"
                  rows={6}
                  value={custom}
                  onChange={(e) =>
                    dispatch(setEquationsCustom(e.target.value))
                  }
                  placeholder="sin(pi/4)^2 + cos(pi/4)^2"
                />
              </div>
            )}

            <div className="eq-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={handleSolve}
              >
                Solve
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="eq-solution-panel">
            <div className="panel-title">Solution</div>
            <div className="solution-shell">
              <pre className="solution-body">
                {solution ?? 'Solution will appear here.'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .eq-root {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f7;
        }

        .eq-card {
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

        .eq-header {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #555;
          margin-bottom: 8px;
        }

        .mode-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .mode-chip {
          flex: 1;
          min-width: 0;
          padding: 6px 8px;
          border-radius: 999px;
          border: 1px solid #e0e0e0;
          background: #fafafa;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }

        .mode-chip-active {
          border-color: #ff69b4;
          background: #ffe4f4;
        }

        .mode-chip-label {
          font-size: 12px;
          font-weight: 600;
        }

        .mode-chip-sub {
          font-size: 11px;
          opacity: 0.7;
        }

        .eq-main {
          flex: 1;
          display: flex;
          gap: 12px;
          min-height: 0;
        }

        .eq-input-panel {
          flex: 3;
          border-radius: 10px;
          border: 1px solid #ececec;
          background: #fafafa;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .eq-solution-panel {
          flex: 2;
          border-radius: 10px;
          border: 1px solid #ececec;
          background: #fafafa;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .panel-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .panel-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.7;
        }

        .panel-sub {
          font-size: 11px;
          opacity: 0.75;
        }

        .eq-textarea {
          margin-top: 4px;
          resize: vertical;
          min-height: 80px;
          border-radius: 8px;
          border: 1px solid #d0d0d0;
          padding: 6px 8px;
          font-size: 12px;
          font-family: SFMono-Regular, Menlo, Monaco, Consolas,
            'Liberation Mono', 'Courier New', monospace;
        }

        .eq-input {
          margin-top: 4px;
          border-radius: 8px;
          border: 1px solid #d0d0d0;
          padding: 6px 8px;
          font-size: 12px;
          font-family: SFMono-Regular, Menlo, Monaco, Consolas,
            'Liberation Mono', 'Courier New', monospace;
        }

        .eq-actions {
          margin-top: auto;
          display: flex;
          gap: 8px;
          justify-content: flex-start;
        }

        .primary-btn,
        .secondary-btn {
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          border: 1px solid #d0d0d0;
          background: #ffffff;
          cursor: pointer;
        }

        .primary-btn {
          background: #ff69b4;
          border-color: #ff69b4;
          color: #ffffff;
        }

        .secondary-btn {
          background: #ffffff;
        }

        .solution-shell {
          margin-top: 6px;
          flex: 1;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          background: #ffffff;
          padding: 8px 10px;
          overflow: auto;
        }

        .solution-body {
          margin: 0;
          font-size: 12px;
          white-space: pre-wrap;
          font-family: SFMono-Regular, Menlo, Monaco, Consolas,
            'Liberation Mono', 'Courier New', monospace;
        }

        @media (max-width: 800px) {
          .eq-main {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
