// lib/store/coreTypes.ts

// ========== APP + GLOBAL TYPES ==========
export type VarType =
  | 'scalar'
  | 'matrix'
  | 'sequence'

export type VarBinding = {
  id: string;
  name: string;
  type: VarType;
  value: unknown;
  createdAt: number;
  updatedAt: number;
};

export type AngleMode = 'deg' | 'rad' | 'grad';
export type WriteMode = 'natural' | 'linear';
export type ResultMode = 'line' | 'math';
export type ComplexMode = 'a+bi' | 'r∠θ';

export type Settings = {
  angleMode: AngleMode;
  writeMode: WriteMode;
  resultMode: ResultMode;
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

// ========== STATS APP ==========

export type StatisticsDataset = {
  id: string;
  label: string;
  values: number[];
  frequencies?: number[];  // optional for grouped data
};

export type StatisticsState = {
  datasets: StatisticsDataset[];
  selectedId: string | null;
  summary: string | null;  // formatted summary / last computation
};

// ========== REGRESSION APP ==========

export type RegressionPoint = { x: number; y: number };
export type RegressionModelType = 'linear' | 'quadratic' | 'exp' | 'log';

export type RegressionModel = {
  type: RegressionModelType;
  coeffs: number[];         // [a,b] or [a,b,c]
  r2: number | null;
};

export type RegressionState = {
  points: RegressionPoint[];
  model: RegressionModel | null;
  attachToGrapher: boolean;
};

// ========== SEQUENCES APP ==========

export type SequencesState = {
  definition: string;  // "u(n)=..."
  nStart: number;
  nEnd: number;
  preview: number[];   // last computed values
};

// ========== DISTRIBUTIONS APP ==========

export type DistributionType =
  | 'normal'
  | 'binomial'
  | 'poisson'
  | 't'
  | 'chi2'
  | 'f';

export type DistributionMode = 'pdf' | 'cdf';

export type DistributionParams = {
  mu?: number;
  sigma?: number;
  n?: number;
  p?: number;
  lambda?: number;
  df1?: number;
  df2?: number;
};

export type DistributionState = {
  distributionType: DistributionType;
  mode: DistributionMode;
  params: DistributionParams;
  lastEval: string | null;
};

// ========== INFERENCE APP ==========

export type TestType =
  | 'z-test'
  | 't-test'
  | 'chi2-goodness'
  | 'chi2-independence'
  | 'anova';

export type InferenceState = {
  testType: TestType;
  alpha: number;
  summary: string | null;
};

// ========== FINANCE APP ==========

export type FinanceMode = 'simple-interest' | 'compound-interest' | 'annuity' | 'loan';

export type FinanceParams = {
  principal?: number;
  rate?: number;   // per period
  n?: number;      // periods
  payment?: number;
  futureValue?: number;
};

export type FinanceState = {
  mode: FinanceMode;
  params: FinanceParams;
  result: string | null;
};

// ========== ELEMENTS APP ==========

export type ElementsState = {
  selectedAtomicNumber: number | null;
};

// ========== PYTHON APP ==========

export type PythonScript = {
  id: string;
  name: string;
  code: string;
};

export type PythonState = {
  scripts: PythonScript[];
  activeScriptId: string | null;
  shellOutput: string;
};

// ========== CORE STATE ==========

export type AlphaMode = 'off' | 'lower' | 'upper';

export type CoreState = {
  shift: boolean;
  alphaMode: AlphaMode;
  ans: number | null;
  vars: VarBinding[];
  settings: Settings;

  calculation: CalculationState;
  grapher: GrapherState;
  equations: EquationsState;
  statistics: StatisticsState;
  regression: RegressionState;
  sequences: SequencesState;
  distribution: DistributionState;
  inferences: InferenceState;
  finance: FinanceState;
  elements: ElementsState;
  python: PythonState;
};
