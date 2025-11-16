// lib/store/coreTypes.ts



export type AngleMode = 'deg' | 'rad' | 'grad';
export type ComplexMode = 'a+bi' | 'r∠θ';

export type Settings = {
  angleMode: AngleMode;
  complexMode: ComplexMode;
};

// ========== CALC APP ==========

export type CalculationHistoryEntry = {
  id: string;
  expr: string;
  result: string;
  timestamp: number;
};

export type CalculationState = {
  input: string;
  secondary: string;
  history: CalculationHistoryEntry[];
};

// ========== GRAPHER APP ==========

export type GrapherEquation = {
  id: string;
  expr: string;
  visible: boolean;
  color: string;
};

export type GrapherView = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid: boolean;
  showAxes: boolean;
};

export type GrapherState = {
  equations: GrapherEquation[];
  view: GrapherView;
};

// ========== EQUATIONS APP ==========

export type EquationsMode = 'linear-system' | 'polynomial' | 'custom';

export type EquationsState = {
  mode: EquationsMode;
  // simple modelling: store raw strings, you can later parse them
  system: string[];       // e.g. ["2x+3y=5", "x-y=1"]
  polynomial: string;     // e.g. "x^3 + 2x + 1"
  custom: string;         // any custom equation text
  solution: string | null;
};



export type CoreState = {
  settings: Settings;

  calculation: CalculationState;
  grapher: GrapherState;
  equations: EquationsState;

};
