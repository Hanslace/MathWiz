// lib/store/coreSlice.ts
'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  CoreState,
  VarType,
  Settings,
  CalculationHistoryEntry,
  GrapherView,
  GrapherEquation,
  RegressionPoint,
  RegressionModelType,
  FinanceMode,
  FinanceParams,
  DistributionType,
  DistributionMode,
  DistributionParams,
  TestType,
  AlphaMode
} from './coreTypes';

// Simple ID helper
function makeId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

const defaultSettings: Settings = {
  angleMode: 'deg',
  writeMode: 'natural',
  resultMode: 'line',
  complexMode: 'a+bi',
};

const defaultGrapherView: GrapherView = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
};

const initialState: CoreState = {
  shift: false,
  alphaMode: 'off',
  ans: null,
  vars: [],
  settings: defaultSettings,

  calculation: {
    input: '',
    secondary: '',
    history: [],
  },
  grapher: {
    equations: [],
    view: defaultGrapherView,
  },
  equations: {
    mode: 'linear-system',
    system: [],
    polynomial: '',
    custom: '',
    solution: null,
  },
  statistics: {
    datasets: [],
    selectedId: null,
    summary: null,
  },
  regression: {
    points: [],
    model: null,
    attachToGrapher: false,
  },
  sequences: {
    definition: '',
    nStart: 1,
    nEnd: 10,
    preview: [],
  },
  distribution: {
    distributionType: 'normal',
    mode: 'pdf',
    params: { mu: 0, sigma: 1 },
    lastEval: null,
  },
  inferences: {
    testType: 'z-test',
    alpha: 0.05,
    summary: null,
  },
  finance: {
    mode: 'simple-interest',
    params: {},
    result: null,
  },
  elements: {
    selectedAtomicNumber: null,
  },
  python: {
    scripts: [],
    activeScriptId: null,
    shellOutput: '',
  },
};

const coreSlice = createSlice({
  name: 'core',
  initialState,
  reducers: {
    // ===== navigation + keyboard flags =====

    setShift(state: CoreState, action: PayloadAction<boolean>) {
      state.shift = action.payload;
    },
    toggleShift(state: CoreState) {
      state.shift = !state.shift;
    },
    setAlphaMode(state, action: PayloadAction<AlphaMode>) {
    state.alphaMode = action.payload;
    },

    toggleAlphaLower(state) {
    state.alphaMode = state.alphaMode === 'lower' ? 'off' : 'lower';
    },

    toggleAlphaUpper(state) {
    state.alphaMode = state.alphaMode === 'upper' ? 'off' : 'upper';
    },

    // ===== global settings + answer =====
    setSettings(state: CoreState, action: PayloadAction<Partial<Settings>>) {
      state.settings = { ...state.settings, ...action.payload };
    },
    setAns(state: CoreState, action: PayloadAction<number | null>) {
      state.ans = action.payload;
    },

    // ===== variables =====
    storeVar(
      state: CoreState,
      action: PayloadAction<{ name: string; type: VarType; value: unknown }>
    ) {
      const { name, type, value } = action.payload;
      const now = Date.now();
      const existing = state.vars.find(v => v.name === name);
      if (existing) {
        existing.type = type;
        existing.value = value;
        existing.updatedAt = now;
      } else {
        state.vars.push({
          id: makeId('var'),
          name,
          type,
          value,
          createdAt: now,
          updatedAt: now,
        });
      }
    },
    deleteVar(state: CoreState, action: PayloadAction<string>) {
      const name = action.payload;
      state.vars = state.vars.filter(v => v.name !== name);
    },
    renameVar(state: CoreState, action: PayloadAction<{ from: string; to: string }>) {
      const { from, to } = action.payload;
      const existing = state.vars.find(v => v.name === from);
      if (existing) {
        existing.name = to;
        existing.updatedAt = Date.now();
      }
    },

    // ===== CALC APP =====
    setCalculationInput(state: CoreState, action: PayloadAction<string>) {
      state.calculation.input = action.payload;
    },
    setCalculationSecondary(state: CoreState, action: PayloadAction<string>) {
      state.calculation.secondary = action.payload;
    },
    clearCalculation(state: CoreState) {
      state.calculation.input = '';
      state.calculation.secondary = '';
    },
    pushCalculationHistory(state: CoreState, action: PayloadAction<{ expr: string; result: string }>) {
      const entry: CalculationHistoryEntry = {
        id: makeId('hist'),
        expr: action.payload.expr,
        result: action.payload.result,
        timestamp: Date.now(),
      };
      state.calculation.history.unshift(entry);
      // limit history length if you want
      if (state.calculation.history.length > 100) {
        state.calculation.history.pop();
      }
    },
    clearCalculationHistory(state: CoreState) {
      state.calculation.history = [];
    },

    // ===== GRAPHER APP =====
    addGrapherEquation(state: CoreState, action: PayloadAction<{ expr: string; color?: string }>) {
      const { expr, color } = action.payload;
      const eq: GrapherEquation = {
        id: makeId('eq'),
        expr,
        visible: true,
        color: color ?? '#ff0000',
      };
      state.grapher.equations.push(eq);
    },
    updateGrapherEquation(
      state: CoreState,
      action: PayloadAction<{ id: string; patch: Partial<GrapherEquation> }>
    ) {
      const { id, patch } = action.payload;
      const eq = state.grapher.equations.find(e => e.id === id);
      if (eq) {
        Object.assign(eq, patch);
      }
    },
    removeGrapherEquation(state: CoreState, action: PayloadAction<string>) {
      state.grapher.equations = state.grapher.equations.filter(e => e.id !== action.payload);
    },
    setGrapherView(state: CoreState, action: PayloadAction<Partial<GrapherView>>) {
      state.grapher.view = { ...state.grapher.view, ...action.payload };
    },

    // ===== EQUATIONS APP =====
    setEquationsMode(state: CoreState, action: PayloadAction<'linear-system' | 'polynomial' | 'custom'>) {
      state.equations.mode = action.payload;
    },
    setEquationsSystem(state: CoreState, action: PayloadAction<string[]>) {
      state.equations.system = action.payload;
    },
    setEquationsPolynomial(state: CoreState, action: PayloadAction<string>) {
      state.equations.polynomial = action.payload;
    },
    setEquationsCustom(state: CoreState, action: PayloadAction<string>) {
      state.equations.custom = action.payload;
    },
    setEquationsSolution(state: CoreState, action: PayloadAction<string | null>) {
      state.equations.solution = action.payload;
    },

    // ===== STATS APP =====
    upsertStatisticsDataset(
      state: CoreState,
      action: PayloadAction<{ id?: string; label: string; values: number[]; frequencies?: number[] }>
    ) {
      const { id, label, values, frequencies } = action.payload;
      if (id) {
        const ds = state.statistics.datasets.find(d => d.id === id);
        if (ds) {
          ds.label = label;
          ds.values = values;
          ds.frequencies = frequencies;
          return;
        }
      }
      state.statistics.datasets.push({
        id: makeId('ds'),
        label,
        values,
        frequencies,
      });
    },
    removeStatisticsDataset(state: CoreState, action: PayloadAction<string>) {
      state.statistics.datasets = state.statistics.datasets.filter(d => d.id !== action.payload);
      if (state.statistics.selectedId === action.payload) {
        state.statistics.selectedId = null;
      }
    },
    setStatisticsSelected(state: CoreState, action: PayloadAction<string | null>) {
      state.statistics.selectedId = action.payload;
    },
    setStatisticsSummary(state: CoreState, action: PayloadAction<string | null>) {
      state.statistics.summary = action.payload;
    },

    // ===== REGRESSION APP =====
    setRegressionPoints(state: CoreState, action: PayloadAction<RegressionPoint[]>) {
      state.regression.points = action.payload;
    },
    addRegressionPoint(state: CoreState, action: PayloadAction<RegressionPoint>) {
      state.regression.points.push(action.payload);
    },
    clearRegressionPoints(state: CoreState) {
      state.regression.points = [];
      state.regression.model = null;
    },
    setRegressionModel(
      state: CoreState,
      action: PayloadAction<{
        type: RegressionModelType;
        coeffs: number[];
        r2: number | null;
      } | null>
    ) {
      state.regression.model = action.payload;
    },
    setRegressionAttachToGrapher(state: CoreState, action: PayloadAction<boolean>) {
      state.regression.attachToGrapher = action.payload;
    },

    // ===== sequenceUENCES APP =====
    setSequenceuenceDefinition(state: CoreState, action: PayloadAction<string>) {
      state.sequences.definition = action.payload;
    },
    setSequenceuenceRange(state: CoreState, action: PayloadAction<{ nStart: number; nEnd: number }>) {
      state.sequences.nStart = action.payload.nStart;
      state.sequences.nEnd = action.payload.nEnd;
    },
    setSequenceuencePreview(state: CoreState, action: PayloadAction<number[]>) {
      state.sequences.preview = action.payload;
    },

    // ===== DistributionS APP =====
    setDistributionType(state: CoreState, action: PayloadAction<DistributionType>) {
      state.distribution.distributionType = action.payload;
    },
    setDistributionMode(state: CoreState, action: PayloadAction<DistributionMode>) {
      state.distribution.mode = action.payload;
    },
    setDistributionParams(state: CoreState, action: PayloadAction<Partial<DistributionParams>>) {
      state.distribution.params = { ...state.distribution.params, ...action.payload };
    },
    setDistributionLastEval(state: CoreState, action: PayloadAction<string | null>) {
      state.distribution.lastEval = action.payload;
    },

    // ===== INFERENCE APP =====
    setInferenceTestType(state: CoreState, action: PayloadAction<TestType>) {
      state.inferences.testType = action.payload;
    },
    setInferenceAlpha(state: CoreState, action: PayloadAction<number>) {
      state.inferences.alpha = action.payload;
    },
    setInferenceSummary(state: CoreState, action: PayloadAction<string | null>) {
      state.inferences.summary = action.payload;
    },

    // ===== FINANCE APP =====
    setFinanceMode(state: CoreState, action: PayloadAction<FinanceMode>) {
      state.finance.mode = action.payload;
    },
    setFinanceParams(state: CoreState, action: PayloadAction<Partial<FinanceParams>>) {
      state.finance.params = { ...state.finance.params, ...action.payload };
    },
    setFinanceResult(state: CoreState, action: PayloadAction<string | null>) {
      state.finance.result = action.payload;
    },

    // ===== ELEMENTS APP =====
    setSelectedElement(state: CoreState, action: PayloadAction<number | null>) {
      state.elements.selectedAtomicNumber = action.payload;
    },

    // ===== PYTHON APP =====
    upsertPythonScript(
      state: CoreState,
      action: PayloadAction<{ id?: string; name: string; code: string }>
    ) {
      const { id, name, code } = action.payload;
      if (id) {
        const existing = state.python.scripts.find(s => s.id === id);
        if (existing) {
          existing.name = name;
          existing.code = code;
          return;
        }
      }
      const newScriptId = makeId('py');
      state.python.scripts.push({ id: newScriptId, name, code });
      if (!state.python.activeScriptId) {
        state.python.activeScriptId = newScriptId;
      }
    },
    deletePythonScript(state: CoreState, action: PayloadAction<string>) {
      const id = action.payload;
      state.python.scripts = state.python.scripts.filter(s => s.id !== id);
      if (state.python.activeScriptId === id) {
        state.python.activeScriptId = state.python.scripts[0]?.id ?? null;
      }
    },
    setActivePythonScript(state: CoreState, action: PayloadAction<string | null>) {
      state.python.activeScriptId = action.payload;
    },
    appendPythonShellOutput(state: CoreState, action: PayloadAction<string>) {
      state.python.shellOutput += action.payload;
    },
    clearPythonShellOutput(state: CoreState) {
      state.python.shellOutput = '';
    },
  },
});

export const {
  setShift,
  toggleShift,
  toggleAlphaLower,
  toggleAlphaUpper,
  setAlphaMode,
  setSettings,
  setAns,
  storeVar,
  deleteVar,
  renameVar,
  setCalculationInput,
  setCalculationSecondary,
  clearCalculation,
  pushCalculationHistory,
  clearCalculationHistory,
  addGrapherEquation,
  updateGrapherEquation,
  removeGrapherEquation,
  setGrapherView,
  setEquationsMode,
  setEquationsSystem,
  setEquationsPolynomial,
  setEquationsCustom,
  setEquationsSolution,
  upsertStatisticsDataset,
  removeStatisticsDataset,
  setStatisticsSelected,
  setStatisticsSummary,
  setRegressionPoints,
  addRegressionPoint,
  clearRegressionPoints,
  setRegressionModel,
  setRegressionAttachToGrapher,
  setSequenceuenceDefinition,
  setSequenceuenceRange,
  setSequenceuencePreview,
  setDistributionType,
  setDistributionMode,
  setDistributionParams,
  setDistributionLastEval,
  setInferenceTestType,
  setInferenceAlpha,
  setInferenceSummary,
  setFinanceMode,
  setFinanceParams,
  setFinanceResult,
  setSelectedElement,
  upsertPythonScript,
  deletePythonScript,
  setActivePythonScript,
  appendPythonShellOutput,
  clearPythonShellOutput,
} = coreSlice.actions;

export default coreSlice.reducer;
