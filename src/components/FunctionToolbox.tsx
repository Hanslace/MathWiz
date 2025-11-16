// FunctionToolbox.tsx
'use client';

import { useState } from 'react';

type ToolboxItem = {
  id: string;
  label: string;
  snippet: string;
  cursorOffset: number;
  description?: string;
};

type ToolboxSection = {
  id: string;
  label: string;
  items: ToolboxItem[];
};

type ToolboxCategory = {
  id: string;
  label: string;
  sections: ToolboxSection[];
};

const TOOLBOX: ToolboxCategory[] = [
  {
    id: 'arith',
    label: 'Arithmetic',
    sections: [
      {
        id: 'basic',
        label: 'Basic operations',
        items: [
          {
            id: 'add',
            label: 'a + b',
            snippet: ' + ',
            cursorOffset: 0,
            description: 'Addition',
          },
          {
            id: 'sub',
            label: 'a - b',
            snippet: ' - ',
            cursorOffset: 0,
            description: 'Subtraction',
          },
          {
            id: 'mul',
            label: 'a * b',
            snippet: ' * ',
            cursorOffset: 0,
            description: 'Multiplication',
          },
          {
            id: 'div',
            label: 'a / b',
            snippet: ' / ',
            cursorOffset: 0,
            description: 'Division',
          },
        ],
      },
      {
        id: 'pow-root',
        label: 'Powers & roots',
        items: [
          {
            id: 'pow',
            label: 'pow(a, b)',
            snippet: 'pow()',
            cursorOffset: -1,
            description: 'a^b',
          },
          {
            id: 'sqrt',
            label: 'sqrt(x)',
            snippet: 'sqrt()',
            cursorOffset: -1,
            description: 'Square root',
          },
          {
            id: 'log',
            label: 'log(x)',
            snippet: 'log()',
            cursorOffset: -1,
            description: 'Natural logarithm',
          },
          {
            id: 'log10',
            label: 'log10(x)',
            snippet: 'log10()',
            cursorOffset: -1,
            description: 'Base-10 log',
          },
          {
            id: 'exp',
            label: 'exp(x)',
            snippet: 'exp()',
            cursorOffset: -1,
            description: 'e^x',
          },
        ],
      },
    ],
  },
  {
    id: 'prob',
    label: 'Probability',
    sections: [
      {
        id: 'prob-core',
        label: 'Core',
        items: [
          {
            id: 'fact',
            label: 'factorial(n)',
            snippet: 'factorial()',
            cursorOffset: -1,
            description: 'n!',
          },
          {
            id: 'comb',
            label: 'combinations(n, k)',
            snippet: 'combinations()',
            cursorOffset: -1,
          },
          {
            id: 'perm',
            label: 'permutations(n, k)',
            snippet: 'permutations()',
            cursorOffset: -1,
          },
          {
            id: 'rand',
            label: 'random()',
            snippet: 'random()',
            cursorOffset: 0,
            description: 'Uniform [0,1)',
          },
          {
            id: 'randInt',
            label: 'randomInt(n)',
            snippet: 'randomInt()',
            cursorOffset: -1,
          },
        ],
      },
    ],
  },
  {
    id: 'lists',
    label: 'Lists',
    sections: [
      {
        id: 'agg',
        label: 'Aggregates',
        items: [
          { id: 'sum', label: 'sum(list)', snippet: 'sum()', cursorOffset: -1 },
          { id: 'mean', label: 'mean(list)', snippet: 'mean()', cursorOffset: -1 },
          {
            id: 'median',
            label: 'median(list)',
            snippet: 'median()',
            cursorOffset: -1,
          },
          { id: 'min', label: 'min(list)', snippet: 'min()', cursorOffset: -1 },
          { id: 'max', label: 'max(list)', snippet: 'max()', cursorOffset: -1 },
        ],
      },
      {
        id: 'stats',
        label: 'Statistics',
        items: [
          {
            id: 'var',
            label: 'variance(list)',
            snippet: 'variance()',
            cursorOffset: -1,
          },
          { id: 'std', label: 'std(list)', snippet: 'std()', cursorOffset: -1 },
        ],
      },
    ],
  },
  {
    id: 'calc',
    label: 'Calculus',
    sections: [
      {
        id: 'diff',
        label: 'Derivatives',
        items: [
          {
            id: 'deriv',
            label: "derivative('f(x)', 'x')",
            snippet: "derivative('', 'x')",
            cursorOffset: -6,
            description: 'Symbolic derivative',
          },
          {
            id: 'simplify',
            label: "simplify('expr')",
            snippet: "simplify('')",
            cursorOffset: -2,
            description: 'Simplify expression',
          },
        ],
      },
    ],
  },
  {
    id: 'logic',
    label: 'Logic',
    sections: [
      {
        id: 'bool',
        label: 'Boolean',
        items: [
          { id: 'and', label: 'and(a, b)', snippet: 'and()', cursorOffset: -1 },
          { id: 'or', label: 'or(a, b)', snippet: 'or()', cursorOffset: -1 },
          { id: 'not', label: 'not(x)', snippet: 'not()', cursorOffset: -1 },
          { id: 'xor', label: 'xor(a, b)', snippet: 'xor()', cursorOffset: -1 },
        ],
      },
    ],
  },
  {
    id: 'trig',
    label: 'Trigonometry',
    sections: [
      {
        id: 'circ',
        label: 'Circular',
        items: [
          { id: 'sin', label: 'sin(x)', snippet: 'sin()', cursorOffset: -1 },
          { id: 'cos', label: 'cos(x)', snippet: 'cos()', cursorOffset: -1 },
          { id: 'tan', label: 'tan(x)', snippet: 'tan()', cursorOffset: -1 },
          { id: 'asin', label: 'asin(x)', snippet: 'asin()', cursorOffset: -1 },
          { id: 'acos', label: 'acos(x)', snippet: 'acos()', cursorOffset: -1 },
          { id: 'atan', label: 'atan(x)', snippet: 'atan()', cursorOffset: -1 },
        ],
      },
      {
        id: 'hyp',
        label: 'Hyperbolic',
        items: [
          { id: 'sinh', label: 'sinh(x)', snippet: 'sinh()', cursorOffset: -1 },
          { id: 'cosh', label: 'cosh(x)', snippet: 'cosh()', cursorOffset: -1 },
          { id: 'tanh', label: 'tanh(x)', snippet: 'tanh()', cursorOffset: -1 },
        ],
      },
    ],
  },
  {
    id: 'decimal',
    label: 'Decimal numbers',
    sections: [
      {
        id: 'rounding',
        label: 'Rounding',
        items: [
          {
            id: 'round',
            label: 'round(x, n?)',
            snippet: 'round()',
            cursorOffset: -1,
          },
          { id: 'floor', label: 'floor(x)', snippet: 'floor()', cursorOffset: -1 },
          { id: 'ceil', label: 'ceil(x)', snippet: 'ceil()', cursorOffset: -1 },
          { id: 'fix', label: 'fix(x)', snippet: 'fix()', cursorOffset: -1 },
        ],
      },
    ],
  },
  {
    id: 'matvec',
    label: 'Matrices & vectors',
    sections: [
      {
        id: 'ops',
        label: 'Operations',
        items: [
          {
            id: 'matrix',
            label: 'matrix([...])',
            snippet: 'matrix()',
            cursorOffset: -1,
          },
          {
            id: 'transpose',
            label: 'transpose(M)',
            snippet: 'transpose()',
            cursorOffset: -1,
          },
          { id: 'det', label: 'det(M)', snippet: 'det()', cursorOffset: -1 },
          { id: 'inv', label: 'inv(M)', snippet: 'inv()', cursorOffset: -1 },
          { id: 'dot', label: 'dot(a, b)', snippet: 'dot()', cursorOffset: -1 },
          { id: 'cross', label: 'cross(a, b)', snippet: 'cross()', cursorOffset: -1 },
        ],
      },
    ],
  },
  {
    id: 'units',
    label: 'Units & constants',
    sections: [
      {
        id: 'consts',
        label: 'Constants',
        items: [
          { id: 'pi', label: 'pi', snippet: 'pi', cursorOffset: 0 },
          { id: 'e', label: 'e', snippet: 'e', cursorOffset: 0 },
          { id: 'i', label: 'i (√-1)', snippet: 'i', cursorOffset: 0 },
        ],
      },
      {
        id: 'units-core',
        label: 'Units',
        items: [
          { id: 'cm', label: '1 cm', snippet: '1 cm', cursorOffset: 0 },
          { id: 'm', label: '1 m', snippet: '1 m', cursorOffset: 0 },
          { id: 'kg', label: '1 kg', snippet: '1 kg', cursorOffset: 0 },
          { id: 's', label: '1 s', snippet: '1 s', cursorOffset: 0 },
        ],
      },
    ],
  },
  {
    id: 'complex',
    label: 'Complex numbers',
    sections: [
      {
        id: 'core',
        label: 'Core',
        items: [
          {
            id: 'complex',
            label: 'complex(a, b)',
            snippet: 'complex()',
            cursorOffset: -1,
          },
          { id: 're', label: 're(z)', snippet: 're()', cursorOffset: -1 },
          { id: 'im', label: 'im(z)', snippet: 'im()', cursorOffset: -1 },
          { id: 'abs', label: 'abs(z)', snippet: 'abs()', cursorOffset: -1 },
          { id: 'arg', label: 'arg(z)', snippet: 'arg()', cursorOffset: -1 },
          { id: 'conj', label: 'conj(z)', snippet: 'conj()', cursorOffset: -1 },
        ],
      },
      {
        id: 'convert',
        label: 'Conversion',
        items: [
          {
            id: 'rect2polar',
            label: 'rect2polar(re, im) / rect2polar(z)',
            snippet: 'rect2polar()',
            cursorOffset: -1,
            description:
              'Rectangular → polar [r, θ] (θ in current angle mode)',
          },
          {
            id: 'polar2rect',
            label: 'polar2rect(r, θ)',
            snippet: 'polar2rect()',
            cursorOffset: -1,
            description: 'Polar (r, θ) → rectangular complex',
          },
        ],
      },
    ],
  },
];

type FunctionToolboxProps = {
  open: boolean;
  onClose: () => void;
  onInsert: (snippet: string, cursorOffset: number) => void;
};

export default function FunctionToolbox({
  open,
  onClose,
  onInsert,
}: FunctionToolboxProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const handleClose = () => {
    setActiveCategoryId(null);
    onClose();
  };

  const activeCategory = activeCategoryId
    ? TOOLBOX.find((c) => c.id === activeCategoryId) || null
    : null;

  if (!open) return null;

  return (
    <div className="tool-bg" onClick={handleClose}>
      <div
        className="tool-modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {!activeCategory && (
          <div className="tool-cat-view">
            <div className="tool-title">Function toolbox</div>
            <div className="tool-subtitle">
              Choose a category to insert math.js functions
            </div>
            <div className="tool-cat-grid">
              {TOOLBOX.map((cat) => (
                <button
                  key={cat.id}
                  className="tool-cat"
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                >
                  <div className="tool-cat-label">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeCategory && (
          <div className="tool-detail">
            <div className="tool-detail-header">
              <button
                type="button"
                className="tool-back"
                onClick={() => setActiveCategoryId(null)}
              >
                ← Categories
              </button>
              <div className="tool-detail-title">{activeCategory.label}</div>
            </div>

            <div className="tool-sections">
              {activeCategory.sections.map((sec) => (
                <div key={sec.id} className="tool-section">
                  <div className="tool-section-title">{sec.label}</div>
                  <div className="tool-items">
                    {sec.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="tool-item"
                        onClick={() => {
                          onInsert(item.snippet, item.cursorOffset);
                          handleClose(); // close modal after inserting
                        }}
                      >
                        <div className="tool-item-label">{item.label}</div>
                        {item.description && (
                          <div className="tool-item-desc">
                            {item.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .tool-bg {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 40;
        }

        .tool-modal {
          width: min(640px, 100% - 32px);
          max-height: min(520px, 90vh);
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
          padding: 14px 16px 16px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tool-title {
          font-size: 14px;
          font-weight: 600;
        }

        .tool-subtitle {
          font-size: 12px;
          opacity: 0.7;
          margin-bottom: 8px;
        }

        .tool-cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
        }

        .tool-cat {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          background: #fafafa;
          text-align: left;
          font-size: 13px;
          cursor: pointer;
        }

        .tool-cat-label {
          font-weight: 500;
        }

        .tool-detail {
          display: flex;
          flex-direction: column;
          max-height: 100%;
        }

        .tool-detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;
        }

        .tool-back {
          border: none;
          background: transparent;
          font-size: 12px;
          padding: 4px 0;
          cursor: pointer;
          color: #555;
        }

        .tool-detail-title {
          font-size: 14px;
          font-weight: 600;
          text-align: right;
          flex: 1;
        }

        .tool-sections {
          overflow-y: auto;
          padding-right: 4px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tool-section-title {
          font-size: 12px;
          text-transform: uppercase;
          opacity: 0.7;
          margin-bottom: 4px;
        }

        .tool-items {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tool-item {
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          background: #fafafa;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          min-width: 140px;
        }

        .tool-item-label {
          font-weight: 500;
        }

        .tool-item-desc {
          font-size: 11px;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
