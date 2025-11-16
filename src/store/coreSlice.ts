// lib/store/coreSlice.ts
'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  CoreState,
  Settings,
  CalculationHistoryEntry,
  GrapherView,
  GrapherEquation,

} from './coreTypes';

// Simple ID helper
function makeId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

const defaultSettings: Settings = {
  angleMode: 'deg',
  complexMode: 'a+bi',
};

const defaultGrapherView: GrapherView = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  showGrid: true,   // was false / missing
  showAxes: true,
};

const initialState: CoreState = {
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

};

const coreSlice = createSlice({
  name: 'core',
  initialState,
  reducers: {
    // ===== global settings + answer =====
    setSettings(state: CoreState, action: PayloadAction<Partial<Settings>>) {
      state.settings = { ...state.settings, ...action.payload };
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

  },
});

export const {
  setSettings,
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
} = coreSlice.actions;

export default coreSlice.reducer;
