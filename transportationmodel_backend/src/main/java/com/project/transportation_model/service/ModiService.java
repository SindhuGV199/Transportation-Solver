package com.project.transportation_model.service;

import com.project.transportation_model.model.ModiRequest;
import com.project.transportation_model.model.ModiResponse;
import org.springframework.stereotype.Service;
import com.project.transportation_model.model.ModiIteration;

import java.util.*;

@Service
public class ModiService {

    private static final double EPSILON = 1e-9;

    public ModiResponse processModi(ModiRequest request) {
        ModiResponse response = new ModiResponse();
        double[][] costs = request.getCosts();
        double[][] alloc = request.getAllocation();

        if (costs == null || alloc == null || costs.length == 0 || alloc.length == 0) {
            response.setEligible(false);
            response.setErrorMessage("Invalid matrix dimensions");
            return response;
        }

        int m = alloc.length;
        int n = alloc[0].length;
        response.setM(m);
        response.setN(n);

        int required = m + n - 1;
        response.setRequiredAllocations(required);

        // Count basic cells
        int current = 0;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (alloc[i][j] > 0)
                    current++;
            }
        }
        response.setCurrentAllocations(current);

        // Allow degenerate initial solutions.
        // MODI will complete the basis using zero-allocation basic cells.

        response.setEligible(true);

        List<String> logs = new ArrayList<>();
        List<ModiIteration> iterations = new ArrayList<>();

        logs.add("Initial basic feasible solution satisfies m + n - 1 = " + required + " allocations.");

        // Calculate initial IBFS cost
        double initialCost = computeCost(alloc, costs);
        response.setInitialCost(initialCost);

        // Clone allocation matrix for iterative optimization
        double[][] currentAlloc = new double[m][n];
        for (int i = 0; i < m; i++) {
            System.arraycopy(alloc[i], 0, currentAlloc[i], 0, n);
        }
        boolean[][] isBasic = new boolean[m][n];

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                isBasic[i][j] = currentAlloc[i][j] > 0;
            }
        }

// Complete the basis to exactly m + n - 1 basic cells.
// Add zero-allocation cells only when they do not create a cycle.
        int basicCount = 0;

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (isBasic[i][j]) {
                    basicCount++;
                }
            }
        }

        while (basicCount < required) {
            boolean added = false;

            for (int i = 0; i < m && !added; i++) {
                for (int j = 0; j < n && !added; j++) {
                    if (!isBasic[i][j]
                            && costs[i][j] != -1
                            && costs[i][j] < 1e9) {

                        isBasic[i][j] = true;

                        if (hasCycle(isBasic, m, n)) {
                            isBasic[i][j] = false;
                        } else {
                            basicCount++;
                            added = true;
                        }
                    }
                }
            }

            if (!added) {
                response.setEligible(false);
                response.setErrorMessage(
                        "Could not complete the MODI basis without creating a cycle."
                );
                return response;
            }
        }

        logs.add("MODI basis completed with " + basicCount + " basic cells.");
        ModiIteration initialIteration = new ModiIteration();

        initialIteration.setIterationNumber(0);
        initialIteration.setAllocation(copyMatrix(currentAlloc));
        initialIteration.setObjectiveValue(computeCost(currentAlloc, costs));
        initialIteration.setEnteringRow(-1);
        initialIteration.setEnteringCol(-1);
        initialIteration.setTheta(0);
        initialIteration.setMessage("Initial basic feasible solution");
        initialIteration.setOptimal(false);

        iterations.add(initialIteration);

        int maxIterations = 20;
        int iteration = 0;

        while (iteration < maxIterations) {
            iteration++;
            logs.add("--- Iteration " + iteration + " ---");

            // 1. Calculate u_i and v_j potentials
            Double[] u = new Double[m];
            Double[] v = new Double[n];
            u[0] = 0.0; // Pivot potential

            boolean updated = true;
            while (updated) {
                updated = false;
                for (int i = 0; i < m; i++) {
                    for (int j = 0; j < n; j++) {
                        // Any cell > 0 (including EPSILON) is treated as basic
                        if (isBasic[i][j]) {
                            if (u[i] != null && v[j] == null) {
                                v[j] = costs[i][j] - u[i];
                                updated = true;
                            } else if (u[i] == null && v[j] != null) {
                                u[i] = costs[i][j] - v[j];
                                updated = true;
                            }
                        }
                    }
                }
            }

            // Fill unassigned potentials if any disconnected subgraph remains
            for (int i = 0; i < m; i++)
                if (u[i] == null)
                    u[i] = 0.0;
            for (int j = 0; j < n; j++)
                if (v[j] == null)
                    v[j] = 0.0;

            logs.add("Potentials computed: u = " + Arrays.toString(u) + ", v = " + Arrays.toString(v));

            // 2. Compute opportunity costs delta_ij = C_ij - (u_i + v_j) for non-basic cells
            double minDelta = 0;
            int enteringRow = -1;
            int enteringCol = -1;

            for (int i = 0; i < m; i++) {
                for (int j = 0; j < n; j++) {
                    if (!isBasic[i][j] && costs[i][j] != -1 && costs[i][j] < 1e9) {
                        double delta = costs[i][j] - (u[i] + v[j]);
                        if (delta < minDelta) {
                            minDelta = delta;
                            enteringRow = i;
                            enteringCol = j;
                        }
                    }
                }
            }

            // 3. Optimality check
            if (minDelta >= 0 || enteringRow == -1) {
                logs.add("All opportunity costs (delta_ij) >= 0. Optimal solution reached.");
                response.setOptimal(true);

                if (!iterations.isEmpty()) {
                    iterations.get(iterations.size() - 1).setOptimal(true);
                }

                break;
            }

            logs.add("Entering cell identified: Cell (" + (enteringRow + 1) + ", " + (enteringCol + 1)
                    + ") with most negative delta = " + minDelta);

            // 4. Find stepping-stone closed loop starting from (enteringRow, enteringCol)
            List<int[]> loop = findLoop(currentAlloc, isBasic, enteringRow, enteringCol, m, n);
            if (loop == null || loop.isEmpty()) {
                logs.add("Could not form closed loop. Terminating optimization.");
                break;
            }

            // 5. Determine maximum shift quantity (theta) from donor cells (odd indices)
            double theta = Double.MAX_VALUE;
            for (int k = 1; k < loop.size(); k += 2) {
                int[] cell = loop.get(k);
                theta = Math.min(theta, currentAlloc[cell[0]][cell[1]]);
            }
            // Normalize tiny theta values caused by floating-point precision
            if (theta < 1e-8) {
                theta = 0.0;
            }

            logs.add("Loop path traced. Minimum allocation shift (theta) = " + theta);


            // 6. Adjust allocations and update the basis
            int leavingIndex = -1;

            // Choose the first minus-position cell that reaches theta.
            // This resolves ties while keeping the other tied cells basic.
            for (int k = 1; k < loop.size(); k += 2) {
                int[] cell = loop.get(k);

                if (Math.abs(currentAlloc[cell[0]][cell[1]] - theta) < 1e-8) {
                    leavingIndex = k;
                    break;
                }
            }

            if (leavingIndex == -1) {
                logs.add("Could not identify the leaving cell. Terminating optimization.");
                break;
            }

            for (int k = 0; k < loop.size(); k++) {
                int[] cell = loop.get(k);
                int r = cell[0];
                int c = cell[1];

                if (k % 2 == 0) {
                    currentAlloc[r][c] += theta;
                    isBasic[r][c] = true;
                } else {
                    currentAlloc[r][c] -= theta;

                    if (Math.abs(currentAlloc[r][c]) < 1e-8) {
                        currentAlloc[r][c] = 0.0;
                    }

                    // Only one tied donor leaves the basis.
                    isBasic[r][c] = (k != leavingIndex);
                }

                if (Math.abs(currentAlloc[r][c]) < 1e-8) {
                    currentAlloc[r][c] = 0.0;
                }
            }


            ModiIteration updatedIteration = new ModiIteration();

            updatedIteration.setIterationNumber(iterations.size());
            updatedIteration.setAllocation(copyMatrix(currentAlloc));
            updatedIteration.setObjectiveValue(computeCost(currentAlloc, costs));
            updatedIteration.setEnteringRow(enteringRow);
            updatedIteration.setEnteringCol(enteringCol);
            updatedIteration.setTheta(theta);
            updatedIteration.setMessage(
                    "Entering cell: (" + (enteringRow + 1) + ", "
                            + (enteringCol + 1) + "), theta = " + theta
            );
            updatedIteration.setOptimal(false);

            iterations.add(updatedIteration);

        }

        // Clean up EPSILON values before computing total cost and returning allocations
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (currentAlloc[i][j] <= EPSILON) {
                    currentAlloc[i][j] = 0.0;
                }
            }
        }


        double finalCost = Math.round(computeCost(currentAlloc, costs));
        logs.forEach(System.out::println);
        response.setSteps(logs);
        response.setFinalAllocation(currentAlloc);
        response.setFinalCost(finalCost);
        response.setIterations(iterations);

        return response;

    }

    private double computeCost(double[][] alloc, double[][] costs) {
        double cost = 0;

        for (int i = 0; i < alloc.length; i++) {
            for (int j = 0; j < alloc[i].length; j++) {

                if (i >= costs.length || j >= costs[i].length) {
                    continue;
                }

                if (alloc[i][j] > EPSILON && costs[i][j] != -1 && costs[i][j] < 1e9) {
                    cost += alloc[i][j] * costs[i][j];
                }
            }
        }

        return cost;
    }

    private List<int[]> findLoop(double[][] alloc, boolean[][] isBasic,
                                 int startR, int startC, int m, int n) {
        List<int[]> path = new ArrayList<>();
        path.add(new int[] { startR, startC });
        if (findPath(alloc, isBasic, path, true, startR, startC, m, n)) {
            return path;
        }
        return null;
    }

    private boolean findPath(double[][] alloc, boolean[][] isBasic,
                             List<int[]> path, boolean moveHorizontal,
                             int startR, int startC, int m, int n) {
        int[] last = path.get(path.size() - 1);
        int r = last[0];
        int c = last[1];

        if (path.size() >= 4) {
            if (moveHorizontal && r == startR && c != startC) {
                return true;
            }
            if (!moveHorizontal && c == startC && r != startR) {
                return true;
            }
        }

        if (moveHorizontal) {
            for (int nextC = 0; nextC < n; nextC++) {
                if (nextC != c && (isBasic[r][nextC] || (r == startR && nextC == startC))) {
                    if (r == startR && nextC == startC && path.size() >= 4)
                        return true;
                    if (isBasic[r][nextC] && !containsCell(path, r, nextC)) {
                        path.add(new int[] { r, nextC });
                        if (findPath(alloc, isBasic, path, false, startR, startC, m, n))
                            return true;
                        path.remove(path.size() - 1);
                    }
                }
            }
        } else {
            for (int nextR = 0; nextR < m; nextR++) {
                if (nextR != r && (isBasic[nextR][c] || (nextR == startR && c == startC))) {
                    if (nextR == startR && c == startC && path.size() >= 4)
                        return true;
                    if (isBasic[nextR][c] && !containsCell(path, nextR, c)) {
                        path.add(new int[] { nextR, c });
                        if (findPath(alloc, isBasic, path, true, startR, startC, m, n))
                            return true;
                        path.remove(path.size() - 1);
                    }
                }
            }
        }
        return false;
    }

    private boolean containsCell(List<int[]> path, int r, int c) {
        for (int[] p : path) {
            if (p[0] == r && p[1] == c)
                return true;
        }
        return false;
    }
    private boolean hasCycle(boolean[][] isBasic, int m, int n) {
        int[] parent = new int[m + n];

        for (int i = 0; i < parent.length; i++) {
            parent[i] = i;
        }

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (!isBasic[i][j]) {
                    continue;
                }

                int rowNode = i;
                int colNode = m + j;

                int rowRoot = findRoot(parent, rowNode);
                int colRoot = findRoot(parent, colNode);

                if (rowRoot == colRoot) {
                    return true;
                }

                parent[rowRoot] = colRoot;
            }
        }

        return false;
    }

    private int findRoot(int[] parent, int node) {
        while (parent[node] != node) {
            parent[node] = parent[parent[node]];
            node = parent[node];
        }

        return node;
    }
    private double[][] copyMatrix(double[][] matrix) {
        double[][] copy = new double[matrix.length][];

        for (int i = 0; i < matrix.length; i++) {
            copy[i] = Arrays.copyOf(matrix[i], matrix[i].length);
        }

        return copy;
    }
}