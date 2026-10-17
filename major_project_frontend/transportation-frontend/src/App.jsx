import React, { useState } from 'react';
import axios from 'axios';
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Sliders,
  Layers,
  Grid,
  ShieldCheck,
  XCircle,
  TrendingUp,
  TrendingDown,
  Calculator,
  Box,
  Check,
  ChevronRight
} from 'lucide-react';

const App = () => {
  const [step, setStep] = useState(1);
  const [suppliers, setSuppliers] = useState('');
  const [customers, setCustomers] = useState('');
  const [objective, setObjective] = useState('MIN');

  const [costs, setCosts] = useState([]);
  const [supply, setSupply] = useState([]);
  const [demand, setDemand] = useState([]);

  const [result, setResult] = useState(null);
  const [modiResult, setModiResult] = useState(null);
  const [ibfsTotalCost, setIbfsTotalCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [method, setMethod] = useState('');
  const [vamSteps, setVamSteps] = useState([]);
  const [showVamModal, setShowVamModal] = useState(false);

  const [showUnbalancedModal, setShowUnbalancedModal] = useState(false);
  const [unbalancedInfo, setUnbalancedInfo] = useState({});

  const [modiData, setModiData] = useState(null);
  const [showModiEligibilityModal, setShowModiEligibilityModal] = useState(false);
  const [showDegeneracyModal, setShowDegeneracyModal] = useState(false);
  const [modiIterations, setModiIterations] = useState([]);
const [currentModiIteration, setCurrentModiIteration] = useState(0);
const selectedModiIteration = modiIterations[currentModiIteration];
const displayedAllocation = selectedModiIteration?.allocation || modiResult;

  // Step 1 -> Step 2: Initialize Grids
  const handleSetup = () => {
    if (!suppliers || !customers) return;
    const r = parseInt(suppliers) || 0;
    const c = parseInt(customers) || 0;
    if (r <= 0 || c <= 0) return;

    setCosts(Array(r).fill('').map(() => Array(c).fill('')));
    setSupply(Array(r).fill(''));
    setDemand(Array(c).fill(''));
    setStep(2);
  };

  // Find Maximum Value for Maximization Matrix
  const getMaxProfitValue = () => {
    let maxVal = -Infinity;
    if (!Array.isArray(costs)) return 0;
    costs.forEach(row => {
      if (Array.isArray(row)) {
        row.forEach(val => {
          if (val !== '-' && val !== '' && val !== undefined && val !== null) {
            const num = parseFloat(val);
            if (!isNaN(num) && num > maxVal) maxVal = num;
          }
        });
      }
    });
    return maxVal === -Infinity ? 0 : maxVal;
  };

  // Generate Opportunity Loss / Maximized Matrix
  // Generate Opportunity Loss / Maximized Matrix
  const getProcessedCosts = () => {
    if (!Array.isArray(costs) || costs.length === 0) return [];

    if (objective === 'MAX') {
      const maxVal = getMaxProfitValue();

      return costs.map(row => {
        if (!Array.isArray(row)) return [];

        return row.map(val => {
          if (
            val === '-' ||
            val === '' ||
            val === undefined ||
            val === null
          ) {
            return '-';
          }

          const num = parseFloat(val);

          if (isNaN(num)) return '-';

          return (maxVal - num).toString();
        });
      });
    }

    return costs;
  };

  const handleCalcClick = (m) => {
    const sTotal = Array.isArray(supply) ? supply.reduce((a, b) => a + (parseFloat(b) || 0), 0) : 0;
    const dTotal = Array.isArray(demand) ? demand.reduce((a, b) => a + (parseFloat(b) || 0), 0) : 0;
    setMethod(m);

    if (sTotal !== dTotal) {
      setUnbalancedInfo({
        diff: Math.abs(sTotal - dTotal),
        type: sTotal > dTotal ? "Dummy Warehouse" : "Dummy Factory",
        sTotal,
        dTotal
      });
      setShowUnbalancedModal(true);
    } else {
      runCalculation(m);
    }
  };

  const runCalculation = async (m = method) => {
    setShowUnbalancedModal(false);
    const matrixToSend = getProcessedCosts();

    try {
      const origRows = parseInt(suppliers) || 0;
      const origCols = parseInt(customers) || 0;

      const response = await axios.post('http://localhost:8080/api/transportation/calculate', {
        suppliers: origRows,
        customers: origCols,
        costs: (Array.isArray(matrixToSend) ? matrixToSend : []).map(r =>
          (Array.isArray(r) ? r.map(v => (v === '-' || v === '' || v === undefined) ? -1 : (parseFloat(v) || 0)) : [])
        ),
        supply: (Array.isArray(supply) ? supply : []).map(v => parseFloat(v) || 0),
        demand: (Array.isArray(demand) ? demand : []).map(v => parseFloat(v) || 0),
        method: m,
        objective: objective
      });

      setResult(response.data.allocation);
      setVamSteps(response.data.steps || []);

      if (objective === 'MAX') {
        let profitSum = 0;
        const alloc = response.data.allocation;

        if (Array.isArray(alloc)) {
          for (let i = 0; i < alloc.length; i++) {
            for (let j = 0; j < (alloc[i]?.length || 0); j++) {
              const allocatedUnits = alloc[i]?.[j] || 0;
              // Only calculate profit for original non-dummy cells with positive allocations
              if (allocatedUnits > 0 && i < origRows && j < origCols) {
                const costVal = costs[i]?.[j];
                if (costVal !== '-' && costVal !== '' && costVal !== undefined && costVal !== null) {
                  const cellProfit = parseFloat(costVal) || 0;
                  profitSum += allocatedUnits * cellProfit;
                }
              }
            }
          }
        }
        setTotalCost(Math.round(profitSum));
        setIbfsTotalCost(Math.round(profitSum));
              } else {
                setTotalCost(Math.round(response.data.totalCost || 0));
                setIbfsTotalCost(Math.round(response.data.totalCost || 0));
              }
              

      setStep(3);

      // Auto-show VAM penalty modal if Vogel method was selected and steps exist
      if (m === 'VOGEL' && response.data.steps && response.data.steps.length > 0) {
        setShowVamModal(true);
      }
    } catch (e) {
      alert("Backend connection failed. Ensure Spring Boot is running on port 8080.");
    }
  };

  // Check MODI Optimality
  // Check MODI Optimality
  const checkModiOptimality = async () => {
    if (!result) return;

    try {
      const processedCosts = getProcessedCosts();

      console.log("MODI allocation:", result.length, "x", result[0]?.length);
      console.log("MODI processed costs:", processedCosts.length, "x", processedCosts[0]?.length);

      const response = await axios.post('http://localhost:8080/api/transportation/modi', {
        costs: (() => {
          const processed = Array.isArray(processedCosts) ? processedCosts : [];
          const allocationCols = Array.isArray(result?.[0]) ? result[0].length : 0;

          return processed.map((row, i) => {
            const newRow = Array.isArray(row)
              ? row.map(v =>
                  (v === '-' || v === '' || v === undefined || v === null)
                    ? -1
                    : (parseFloat(v) || 0)
                )
              : [];

            // Add dummy column cost = 0 when allocation has an extra column
            while (newRow.length < allocationCols) {
              newRow.push(0);
            }

            return newRow;
          });
        })(),
        allocation: result,
        objective: objective
      });

      setModiData(response.data);
      console.log("MODI optimality status:", response.data.optimal);

      if (response.data.eligible) {
        setShowModiEligibilityModal(true);
      } else {
        setShowDegeneracyModal(true);
      }

    } catch (err) {
      console.error("MODI Error:", err.response?.data || err);
      alert("Error contacting MODI endpoint.");
    }
  };

  const handleProceedToModi = () => {
    setShowModiEligibilityModal(false);
        setModiIterations(modiData?.iterations || []);
    setCurrentModiIteration(0);
    if (modiData?.finalAllocation) {
      setModiResult(modiData.finalAllocation);
      if (objective === 'MAX') {
        let profitSum = 0;
        const alloc = modiData.finalAllocation;
        const origRows = parseInt(suppliers) || 0;
        const origCols = parseInt(customers) || 0;

        if (Array.isArray(alloc)) {
          for (let i = 0; i < alloc.length; i++) {
            for (let j = 0; j < (alloc[i]?.length || 0); j++) {
              const allocatedUnits = alloc[i]?.[j] || 0;
              if (allocatedUnits > 0 && i < origRows && j < origCols) {
                const costVal = costs[i]?.[j];
                if (costVal !== '-' && costVal !== '' && costVal !== undefined && costVal !== null) {
                  const cellProfit = parseFloat(costVal) || 0;
                  profitSum += allocatedUnits * cellProfit;
                }
              }
            }
          }
        }
        setTotalCost(Math.round(profitSum));
        
              } else {
                setTotalCost(Math.round(modiData.finalCost || 0));
                
              }
    }
    setStep(4);
  };

  const numSuppliers = parseInt(suppliers) || 0;
  const numCustomers = parseInt(customers) || 0;
  const sTotal = Array.isArray(supply) ? supply.reduce((a, b) => a + (parseFloat(b) || 0), 0) : 0;
  const dTotal = Array.isArray(demand) ? demand.reduce((a, b) => a + (parseFloat(b) || 0), 0) : 0;
  const maxMValue = getMaxProfitValue();
  const maximizedMatrix = getProcessedCosts();

  return (
    <div className="min-vh-100 bg-slate-50 py-4 px-3 px-md-4">
      <div className="container" style={{ maxWidth: '1020px' }}>
        
        {/* HEADER HERO */}
        <div className="card border-0 shadow-subtle rounded-4 bg-white p-4 mb-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-4 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <Truck size={30} />
              </div>
              <div>
                <h3 className="fw-bold mb-1 text-dark tracking-tight d-flex align-items-center gap-2">
                  Transportation & MODI Solver
                </h3>
                <p className="text-muted mb-0 small">
                  IBFS Allocation • MODI Optimality Suite
                </p>
              </div>
            </div>

            {/* STATUS BADGES */}
            <div className="d-flex flex-wrap gap-2 align-items-center">
              {objective === 'MIN' ? (
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1">
                  <TrendingDown size={14} /> Minimization Mode
                </span>
              ) : (
                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1">
                  <TrendingUp size={14} /> Maximization Mode
                </span>
              )}

              {step >= 2 && (
                sTotal === dTotal ? (
                  <span className="badge bg-emerald-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1">
                    <CheckCircle size={14} /> Balanced ({sTotal} units)
                  </span>
                ) : (
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1">
                    <AlertTriangle size={14} /> Unbalanced (S:{sTotal} ≠ D:{dTotal})
                  </span>
                )
              )}

              {step >= 3 && method && (
                <span className="badge bg-indigo-subtle text-indigo border border-indigo-subtle px-3 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1">
                  <Sparkles size={14} /> {method === 'VOGEL' ? 'VAM' : method} Method
                </span>
              )}
            </div>
          </div>

          {/* STEP PROGRESS BAR */}
          <div className="mt-4 pt-3 border-top">
            <div className="row g-2 text-center position-relative">
              {[
                { s: 1, title: 'Step 1', sub: 'Setup Problem' },
                { s: 2, title: 'Step 2', sub: 'Matrix Input' },
                { s: 3, title: 'Step 3', sub: 'IBFS Solution' },
                { s: 4, title: 'Step 4', sub: 'MODI Optimal' },
              ].map(({ s, title, sub }) => {
                const isActive = step === s;
                const isDone = step > s;
                return (
                  <div key={s} className="col-3">
                    <div
                      className={`p-2 rounded-3 transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-sm fw-bold'
                          : isDone
                          ? 'bg-primary-subtle text-primary fw-medium'
                          : 'bg-light text-muted opacity-75'
                      }`}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-1 small">
                        {isDone ? <Check size={14} className="fw-bold" /> : <span>{s}.</span>}
                        <span className="d-none d-sm-inline">{title}:</span> {sub}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* STEP 1: SETUP */}
        {step === 1 && (
          <div className="card shadow-card border-0 p-4 p-md-5 mx-auto rounded-4 bg-white" style={{ maxWidth: '520px' }}>
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary p-3 rounded-circle mb-3">
                <Sliders size={28} />
              </div>
              <h4 className="fw-bold text-dark mb-1">Step 1: Setup Problem</h4>
              <p className="text-muted small mb-0">Select optimization objective and matrix dimensions</p>
            </div>

            {/* Objective Selector */}
            <div className="mb-4 bg-light p-3 rounded-4 border border-light-subtle">
              <label className="fw-bold mb-2 small text-uppercase tracking-wider text-muted d-block">
                Optimization Objective
              </label>
              <div className="row g-2">
                <div className="col-6">
                  <div
                    className={`card h-100 p-3 rounded-3 text-center cursor-pointer transition-all border ${
                      objective === 'MIN'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary fw-bold shadow-xs'
                        : 'border-white bg-white text-muted'
                    }`}
                    onClick={() => setObjective('MIN')}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      className="form-check-input d-none"
                      type="radio"
                      id="minObj"
                      checked={objective === 'MIN'}
                      onChange={() => setObjective('MIN')}
                    />
                    <TrendingDown size={22} className="mx-auto mb-1 d-block" />
                    <label className="form-check-label cursor-pointer mb-0 small fw-bold" htmlFor="minObj">
                      Minimization
                    </label>
                    <span className="d-block text-xs text-muted opacity-75 mt-1">Cost Reduction</span>
                  </div>
                </div>
                <div className="col-6">
                  <div
                    className={`card h-100 p-3 rounded-3 text-center cursor-pointer transition-all border ${
                      objective === 'MAX'
                        ? 'border-success bg-success bg-opacity-10 text-success fw-bold shadow-xs'
                        : 'border-white bg-white text-muted'
                    }`}
                    onClick={() => setObjective('MAX')}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      className="form-check-input d-none"
                      type="radio"
                      id="maxObj"
                      checked={objective === 'MAX'}
                      onChange={() => setObjective('MAX')}
                    />
                    <TrendingUp size={22} className="mx-auto mb-1 d-block" />
                    <label className="form-check-label cursor-pointer mb-0 small fw-bold" htmlFor="maxObj">
                      Maximization
                    </label>
                    <span className="d-block text-xs text-muted opacity-75 mt-1">Profit Optimization</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="mb-3">
              <label className="fw-bold small text-muted text-uppercase mb-2 d-flex align-items-center gap-1">
                <Layers size={16} className="text-primary" /> Factories (Rows $F_i$)
              </label>
              <input
                type="number"
                min="1"
                className="form-control form-control-lg rounded-3 fs-6 bg-light border-light-subtle shadow-none px-3"
                value={suppliers}
                onChange={(e) => setSuppliers(e.target.value)}
                placeholder="e.g. 3"
              />
            </div>

            <div className="mb-4">
              <label className="fw-bold small text-muted text-uppercase mb-2 d-flex align-items-center gap-1">
                <Grid size={16} className="text-primary" /> Warehouses (Columns $W_j$)
              </label>
              <input
                type="number"
                min="1"
                className="form-control form-control-lg rounded-3 fs-6 bg-light border-light-subtle shadow-none px-3"
                value={customers}
                onChange={(e) => setCustomers(e.target.value)}
                placeholder="e.g. 3"
              />
            </div>

            <button
              className="btn btn-primary btn-lg w-100 fw-bold rounded-pill shadow-sm py-3 d-flex align-items-center justify-content-center gap-2"
              onClick={handleSetup}
            >
              Enter Matrix Inputs <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 2: MATRIX INPUT */}
        {step === 2 && (
          <div className="card shadow-card border-0 p-4 p-md-4 rounded-4 bg-white">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-3 border-bottom gap-2">
              <div>
                <h4 className="fw-bold text-dark mb-1">
                  Step 2: Enter {objective === 'MAX' ? 'Profit' : 'Cost'} Matrix
                </h4>
                <p className="text-muted small mb-0">
                  Input unit costs/profits, supply totals per factory, and demand totals per warehouse.
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 align-self-start align-self-md-auto d-flex align-items-center gap-1"
              >
                <RotateCcw size={14} /> Reset Setup
              </button>
            </div>

            <div className="table-responsive mb-4 rounded-3 border">
              <table className="table table-bordered text-center align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th className="bg-slate-900 text-slate-300 py-3" style={{ width: '110px' }}>
                      Sources
                    </th>
                    {[...Array(numCustomers)].map((_, j) => (
                      <th key={j} className="bg-slate-800 text-white py-3">
                        <span className="badge bg-cyan-subtle text-info border border-info-subtle px-2 py-1 rounded-2 fw-bold">
                          W{j + 1}
                        </span>
                      </th>
                    ))}
                    <th className="bg-primary text-white py-3" style={{ width: '130px' }}>
                      SUPPLY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(costs) && costs.map((row, i) => (
                    <tr key={i}>
                      <th className="bg-dark text-white fw-bold py-2 text-center align-middle" style={{ width: '80px' }}>
                        <span className="badge bg-primary px-2 py-1 rounded-2">
                          F{i + 1}
                        </span>
                      </th>
                      {Array.isArray(row) && row.map((val, j) => (
                        <td key={j} className="p-0 bg-white">
                          <input
                            type="text"
                            className="form-control border-0 text-center fw-bold py-3 shadow-none bg-transparent"
                            value={val}
                            placeholder="-"
                            onChange={(e) => {
                              const n = [...costs];
                              if (n[i]) {
                                n[i] = [...n[i]];
                                n[i][j] = e.target.value;
                                setCosts(n);
                              }
                            }}
                          />
                        </td>
                      ))}
                      <td className="p-0 bg-primary bg-opacity-10">
                        <input
                          type="number"
                          className="form-control border-0 text-center fw-bold py-3 text-primary shadow-none bg-transparent"
                          value={supply[i] || ''}
                          placeholder="S"
                          onChange={(e) => {
                            const n = [...supply];
                            n[i] = e.target.value;
                            setSupply(n);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="border-top border-2">
                    <th className="bg-warning bg-opacity-20 text-warning-emphasis fw-bold py-3 text-center align-middle">
                      DEMAND
                    </th>
                    {Array.isArray(demand) && demand.map((val, j) => (
                      <td key={j} className="p-0 bg-warning bg-opacity-10">
                        <input
                          type="number"
                          className="form-control border-0 text-center fw-bold py-3 text-warning-emphasis shadow-none bg-transparent"
                          value={val || ''}
                          placeholder="D"
                          onChange={(e) => {
                            const n = [...demand];
                            n[j] = e.target.value;
                            setDemand(n);
                          }}
                        />
                      </td>
                    ))}
                    <td className={`fw-bold py-3 ${sTotal !== dTotal ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                      {sTotal === dTotal ? (
                        <span className="d-flex align-items-center justify-content-center gap-1 small">
                          <CheckCircle size={14} /> BAL: {sTotal}
                        </span>
                      ) : (
                        <span className="d-flex align-items-center justify-content-center gap-1 small text-nowrap">
                          <AlertTriangle size={14} /> UNBALANCED
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Converted Minimized Matrix Display for Maximization Objective */}
            {objective === 'MAX' && (
              <div className="card border-primary border-opacity-25 bg-primary bg-opacity-10 p-3 rounded-4 mb-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Info size={18} className="text-primary" />
                  <h6 className="fw-bold text-primary mb-0">
                    ℹ️ Minimized Matrix
                  </h6>
                </div>
                <p className="text-muted small mb-2">
                  Maximum profit value found: <strong>{maxMValue}</strong>. Maximization matrix converted for minimization solver:
                </p>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered text-center align-middle bg-white rounded-3 overflow-hidden mb-0">
                    <thead className="table-secondary">
                      <tr>
                        <th style={{ width: '90px' }}>Sources</th>
                        {[...Array(numCustomers)].map((_, j) => (
                          <th key={j}>W{j + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(maximizedMatrix) && maximizedMatrix.map((row, i) => (
                        <tr key={i}>
                          <th className="table-secondary">F{i + 1}</th>
                          {Array.isArray(row) && row.map((val, j) => (
                            <td key={j} className="fw-bold text-secondary py-2">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Method Selectors */}
            <div className="text-center bg-light p-4 rounded-4 border">
              <label className="fw-bold mb-3 small text-muted text-uppercase tracking-wider d-block">
                Select Initial Basic Feasible Solution (IBFS) Method:
              </label>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <button
                  onClick={() => handleCalcClick('NW')}
                  className="btn btn-dark fw-bold px-4 py-2.5 rounded-pill d-inline-flex align-items-center gap-2 shadow-sm"
                >
                  <Grid size={16} /> North-West Corner
                </button>
                <button
                  onClick={() => handleCalcClick('LEAST')}
                  className="btn btn-primary fw-bold px-4 py-2.5 rounded-pill d-inline-flex align-items-center gap-2 shadow-sm"
                >
                  <Calculator size={16} /> Least Cost Method
                </button>
                <button
                  onClick={() => handleCalcClick('VOGEL')}
                  className="btn btn-info text-white fw-bold px-4 py-2.5 rounded-pill d-inline-flex align-items-center gap-2 shadow-sm"
                >
                  <Sparkles size={16} /> Vogel's Method (VAM)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: IBFS RESULTS */}
        {step === 3 && result && (
          <div className="card shadow-card border-0 p-4 p-md-4 rounded-4 bg-white">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-3 border-bottom gap-2">
              <div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1.5 rounded-pill fw-semibold mb-2 d-inline-flex align-items-center gap-1">
                  <Sparkles size={14} /> Initial Allocation
                </span>
                <h4 className="fw-bold text-dark mb-0">
                  INITIAL BASIC FEASIBLE ALLOCATION ({method})
                </h4>
              </div>
              <button
                onClick={() => setStep(2)}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 align-self-start align-self-md-auto d-flex align-items-center gap-1"
              >
                <RotateCcw size={14} /> Modify Inputs
              </button>
            </div>

            {/* Matrix Allocation Display */}
            <div className="table-responsive mb-4 rounded-3 border">
              <table className="table table-bordered text-center align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th className="py-3" style={{ width: '120px' }}>Sources</th>
                    {Array.isArray(result) && result[0] && result[0].map((_, j) => (
                      <th key={j} className="py-3">
                        {j < numCustomers ? (
                          <span className="badge bg-cyan-subtle text-info border border-info-subtle px-2.5 py-1 rounded-2 fw-bold">
                            W{j + 1}
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1 rounded-2 fw-bold">
                            DUMMY
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(result) && result.map((row, i) => (
                    <tr key={i}>
                      <th className="bg-slate-900 text-white fw-bold py-3">
                        {i < numSuppliers ? (
                          <span className="badge bg-indigo bg-opacity-20 text-white px-2.5 py-1 rounded-2">
                            Factory {i + 1}
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1 rounded-2">
                            DUMMY
                          </span>
                        )}
                      </th>
                      {Array.isArray(row) && row.map((val, j) => (
                        <td key={j} className={`py-3 ${val > 0 ? "bg-success bg-opacity-10" : "bg-white text-muted opacity-25"}`}>
                          {val > 0 ? (
                            <div className="d-inline-flex flex-column align-items-center bg-success text-white px-3 py-1.5 rounded-3 shadow-xs fw-bold">
                              <span className="fs-5 lh-1">{val}</span>
                              <span className="text-xs text-white-50 opacity-75">units</span>
                            </div>
                          ) : (
                            <span className="fs-5">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Logistics Summary Breakdown */}
            <div className="bg-light p-3.5 rounded-4 mb-4 border">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <Truck size={18} className="text-primary" /> Logistics Route Breakdown:
              </h6>
              <div className="row g-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {Array.isArray(result) && result.map((row, i) =>
                  Array.isArray(row) && row.map((val, j) => val > 0 && (
                    <div key={`${i}-${j}`} className="col-12 col-md-6">
                      <div className="p-2.5 rounded-3 bg-white border shadow-2xs d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2 small fw-semibold text-secondary">
                          <span className="badge bg-light text-dark border">
                            {i < numSuppliers ? `Factory ${i + 1}` : "Dummy Source"}
                          </span>
                          <ArrowRight size={14} className="text-primary" />
                          <span className="badge bg-light text-dark border">
                            {j < numCustomers ? `Warehouse ${j + 1}` : "Dummy Storage"}
                          </span>
                        </div>
                        <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 fw-bold">
                          {Math.round(val)} units
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Result Metric Card */}
            <div className="text-center p-4 rounded-4 bg-primary bg-gradient text-white shadow-sm mb-4">
              <span className="small text-white-50 text-uppercase fw-bold tracking-wider d-block mb-1">
                {objective === 'MAX' ? 'Initial Total Profit' : 'Initial Total Shipping Cost'}
              </span>
              <h1 className="fw-bold mb-0 display-5">
  ₹{Math.round(ibfsTotalCost)}
</h1>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {method === 'VOGEL' && Array.isArray(vamSteps) && vamSteps.length > 0 && (
                <button
                  onClick={() => setShowVamModal(true)}
                  className="btn btn-outline-info fw-bold px-4 py-2.5 rounded-pill d-inline-flex align-items-center gap-2"
                >
                  <Info size={16} /> View VAM Penalty Logs
                </button>
              )}
              <button
                onClick={checkModiOptimality}
                className="btn btn-warning fw-bold px-4 py-2.5 rounded-pill d-inline-flex align-items-center gap-2 shadow-sm text-dark"
              >
                <ShieldCheck size={16} /> Check Optimality (MODI)
              </button>
              <button
                onClick={() => setStep(2)}
                className="btn btn-outline-secondary fw-bold px-4 py-2.5 rounded-pill"
              >
                Edit Inputs
              </button>
              <button
                onClick={() => { setStep(1); setResult(null); }}
                className="btn btn-dark fw-bold px-4 py-2.5 rounded-pill"
              >
                Start New Problem
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: MODI OPTIMAL SOLUTION */}
        {step === 4 && modiResult && (
          <div className="card shadow-card border-0 p-4 p-md-4 rounded-4 bg-white">
            <div className="d-flex align-items-center justify-content-center gap-2 mb-3 pb-3 border-bottom">
              <CheckCircle className="text-success" size={32} />
              <h4 className="fw-bold mb-0 text-success">MODI OPTIMAL SOLUTION</h4>
              {modiData?.optimal === true &&
  currentModiIteration === modiIterations.length - 1 && (
  <div className="alert alert-success text-center fw-bold mt-3 mb-0">
    <CheckCircle size={18} className="me-2" />
    Optimality Reached — All opportunity costs satisfy the optimality condition.
  </div>
)}
            </div>
            
            {/* MODI Iteration Navigation */}
            {modiIterations.length > 0 && selectedModiIteration && (
              <div className="border rounded-4 p-3 mb-4 bg-light">
                <div className="text-center mb-3">
                  <h5 className="fw-bold mb-1">
                    MODI Iteration {currentModiIteration}
                  </h5>
                  <p className="text-muted small mb-1">
                    {selectedModiIteration.message}
                  </p>
                  
<div className="fw-bold text-primary">
  {objective === 'MAX'
    ? 'Objective value (total profit)'
    : 'Objective value (total cost)'}
  : ₹{Math.round(
      objective === 'MAX'
        ? (maxMValue * (supply.reduce((a, b) => a + (parseFloat(b) || 0), 0)) -
            (selectedModiIteration?.objectiveValue ?? 0))
        : (selectedModiIteration?.objectiveValue ?? 0)
    )}
</div>

                </div>

                <div className="d-flex justify-content-center align-items-center gap-3">
                  <button
                    className="btn btn-outline-primary rounded-pill px-4"
                    disabled={currentModiIteration === 0}
                    onClick={() =>
                      setCurrentModiIteration(currentModiIteration - 1)
                    }
                  >
                    Previous
                  </button>

                  <span className="small text-muted">
                    {currentModiIteration + 1} of {modiIterations.length}
                  </span>

                  <button
                    className="btn btn-primary rounded-pill px-4"
                    disabled={currentModiIteration >= modiIterations.length - 1}
                    onClick={() =>
                      setCurrentModiIteration(currentModiIteration + 1)
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            )}


            {/* Matrix Allocation Display */}
            <div className="table-responsive mb-4 rounded-3 border">
              <table className="table table-bordered text-center align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th className="py-3" style={{ width: '120px' }}>Sources</th>
                    {Array.isArray(displayedAllocation) && displayedAllocation[0] && displayedAllocation[0].map((_, j) => (
                      <th key={j} className="py-3">
                        {j < numCustomers ? (
                          <span className="badge bg-cyan-subtle text-info border border-info-subtle px-2.5 py-1 rounded-2 fw-bold">
                            W{j + 1}
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1 rounded-2 fw-bold">
                            DUMMY
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(displayedAllocation) && displayedAllocation.map((row, i) => (
                    <tr key={i}>
                      <th className="bg-slate-900 text-white fw-bold py-3">
                        {i < numSuppliers ? (
                          <span className="badge bg-indigo bg-opacity-20 text-white px-2.5 py-1 rounded-2">
                            Factory {i + 1}
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1 rounded-2">
                            DUMMY
                          </span>
                        )}
                      </th>
                      {Array.isArray(row) && row.map((val, j) => (
                        <td key={j} className={`py-3 ${val > 0 ? "bg-success bg-opacity-10" : "bg-white text-muted opacity-25"}`}>
                          {val > 0 ? (
                            <div className="d-inline-flex flex-column align-items-center bg-success text-white px-3 py-1.5 rounded-3 shadow-xs fw-bold">
                              <span className="fs-5 lh-1">{val}</span>
                              <span className="text-xs text-white-50 opacity-75">units</span>
                            </div>
                          ) : (
                            <span className="fs-5">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Final Logistics Summary */}
            <div className="bg-light p-3.5 rounded-4 mb-4 border">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <Truck size={18} className="text-success" /> Final Optimal Logistics Summary:
              </h6>
              <div className="row g-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {Array.isArray(displayedAllocation) && displayedAllocation.map((row, i) =>
                  Array.isArray(row) && row.map((val, j) => val > 0 && (
                    <div key={`${i}-${j}`} className="col-12 col-md-6">
                      <div className="p-2.5 rounded-3 bg-white border shadow-2xs d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2 small fw-semibold text-secondary">
                          <span className="badge bg-light text-dark border">
                            {i < numSuppliers ? `Factory ${i + 1}` : "Dummy Source"}
                          </span>
                          <ArrowRight size={14} className="text-success" />
                          <span className="badge bg-light text-dark border">
                            {j < numCustomers ? `Warehouse ${j + 1}` : "Dummy Storage"}
                          </span>
                        </div>
                        <span className="badge bg-success text-white rounded-pill px-2.5 py-1 fw-bold">
                          {Math.round(val)} units
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Metric Emphasis Container */}
            <div className="text-center p-4 rounded-4 bg-success bg-gradient text-white shadow-sm mb-4">
              <span className="small text-white-50 text-uppercase fw-bold tracking-wider d-block mb-1">
                {objective === 'MAX' ? 'Final Optimal Profit' : 'Final Optimal Shipping Cost'}
              </span>
              
<h1 className="fw-bold mb-0 display-5">
  ₹{Math.round(
    objective === 'MAX'
      ? (displayedAllocation || []).reduce(
          (profit, row, i) =>
            profit +
            (row || []).reduce(
              (rowProfit, units, j) =>
                rowProfit +
                (i < numSuppliers && j < numCustomers
                  ? (Number(units) || 0) * (Number(costs[i]?.[j]) || 0)
                  : 0),
              0
            ),
          0
        )
      : (selectedModiIteration?.objectiveValue ?? totalCost)
  )}
</h1>

            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-center gap-2">
              <button
                onClick={() => setStep(3)}
                className="btn btn-outline-secondary fw-bold px-4 py-2.5 rounded-pill"
              >
                Back to IBFS
              </button>
              <button
                onClick={() => {
  setStep(1);
  setResult(null);
  setModiResult(null);
  setModiData(null);
  setModiIterations([]);
  setCurrentModiIteration(0);
}}
                className="btn btn-dark fw-bold px-4 py-2.5 rounded-pill"
              >
                Start New Problem
              </button>
            </div>
          </div>
        )}

        {/* MODAL: VOGEL'S PENALTY STEPS */}
        {showVamModal && (
          <div className="modal show d-block backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content p-4 rounded-4 shadow-card border-0">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                    <Info size={22} /> Vogel's Approximation Method (VAM) Penalty Logs
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowVamModal(false)}></button>
                </div>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-3 border mb-3 font-monospace" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {Array.isArray(vamSteps) && vamSteps.map((st, idx) => (
                    <div key={idx} className="small py-1 border-bottom border-secondary border-opacity-25">
                      <span className="text-cyan-emphasis me-2">[{idx + 1}]</span> {st}
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary fw-bold rounded-pill py-2" onClick={() => setShowVamModal(false)}>
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: UNBALANCED PROBLEM */}
        {showUnbalancedModal && (
          <div className="modal show d-block backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content text-center p-4 rounded-4 shadow-card border-0">
                <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger p-3 rounded-circle mx-auto mb-3">
                  <AlertTriangle size={32} />
                </div>
                <h4 className="fw-bold text-danger mb-2">UNBALANCED PROBLEM</h4>
                <p className="text-muted small mb-3">
                  Total Supply ({unbalancedInfo.sTotal}) ≠ Total Demand ({unbalancedInfo.dTotal})
                </p>
                <div className="alert alert-warning border-warning border-opacity-50 fw-semibold small rounded-3 mb-4 text-start">
                  System will automatically add a <strong>{unbalancedInfo.type}</strong> with <strong>{unbalancedInfo.diff} units</strong> at cost 0 to balance supply and demand.
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-light w-50 fw-bold rounded-pill py-2.5"
                    onClick={() => setShowUnbalancedModal(false)}
                  >
                    CANCEL
                  </button>
                  <button
                    className="btn btn-danger w-50 fw-bold rounded-pill py-2.5 shadow-sm"
                    onClick={() => runCalculation()}
                  >
                    SOLVE PROBLEM
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: MODI ELIGIBILITY */}
        {showModiEligibilityModal && modiData && (
          <div className="modal show d-block backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content p-4 rounded-4 text-center shadow-card border-0">
                <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success p-3 rounded-circle mx-auto mb-3">
                  <ShieldCheck size={32} />
                </div>
                <h4 className="fw-bold text-success mb-3">MODI ELIGIBILITY CHECK</h4>
                <div className="text-start bg-light p-3 rounded-3 border mb-3 small">
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Grid Dimensions:</span>
                    <strong>{modiData.m} Rows × {modiData.n} Cols</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Required Allocations ($m + n - 1$):</span>
                    <strong>{modiData.requiredAllocations}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">Current Basic Allocations:</span>
                    <strong>{modiData.currentAllocations}</strong>
                  </div>
                </div>
                {modiData.currentAllocations === modiData.requiredAllocations ? (
  <div className="alert alert-success border-success border-opacity-50 py-2.5 mb-4 small fw-bold">
    <CheckCircle size={18} /> Non-Degenerate Solution: Condition satisfied. Ready for MODI optimization.
  </div>
) : (
  <div className="alert alert-warning border-warning border-opacity-50 py-2.5 mb-4 small fw-bold">
    <AlertTriangle size={18} /> Degenerate Solution: Additional zero-allocation basic cells are needed to complete the MODI basis.
  </div>
)}
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-light w-50 fw-bold rounded-pill py-2.5"
                    onClick={() => setShowModiEligibilityModal(false)}
                  >
                    CANCEL
                  </button>
                  <button
                    className="btn btn-primary w-50 fw-bold rounded-pill py-2.5 shadow-sm"
                    onClick={handleProceedToModi}
                  >
                    PROCEED TO MODI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DEGENERACY WARNING */}
        {showDegeneracyModal && modiData && (
          <div className="modal show d-block backdrop-blur-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content p-4 rounded-4 text-center shadow-card border-0">
                <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger p-3 rounded-circle mx-auto mb-3">
                  <XCircle size={32} />
                </div>
                <h4 className="fw-bold text-danger mb-3">DEGENERATE SOLUTION</h4>
                <div className="text-start bg-light p-3 rounded-3 border mb-3 small">
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Required Allocations ($m + n - 1$):</span>
                    <strong>{modiData.requiredAllocations}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">Current Basic Allocations:</span>
                    <strong>{modiData.currentAllocations}</strong>
                  </div>
                </div>
                <div className="alert alert-danger border-danger border-opacity-50 text-start py-2.5 mb-4 small">
                  <div className="fw-bold mb-1 d-flex align-items-center gap-1">
                    <AlertTriangle size={16} /> Condition not satisfied
                  </div>
                  <div>The number of basic allocations must equal $m + n - 1$ to perform MODI optimization.</div>
                </div>
                <button
                  className="btn btn-danger w-100 fw-bold rounded-pill py-2.5 shadow-sm"
                  onClick={() => setShowDegeneracyModal(false)}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;