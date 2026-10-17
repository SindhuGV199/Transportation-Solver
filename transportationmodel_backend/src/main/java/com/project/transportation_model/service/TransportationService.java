package com.project.transportation_model.service;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class TransportationService {

    // ================= BALANCE + RESTRICTIONS =================
    private Object[] balanceAndHandleRestrictions(int rows, int cols,
                                                  double[][] costs,
                                                  double[] supply,
                                                  double[] demand) {

        double totalSupply = Arrays.stream(supply).sum();
        double totalDemand = Arrays.stream(demand).sum();

        int R = rows;
        int C = cols;

        if (totalSupply > totalDemand) C++;
        else if (totalDemand > totalSupply) R++;

        double[][] newCost = new double[R][C];
        double[] newSupply = new double[R];
        double[] newDemand = new double[C];

        // copy cost + handle restriction
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                newCost[i][j] = (costs[i][j] == -1)
                        ? Double.MAX_VALUE
                        : costs[i][j];
            }
        }

        // dummy column
        if (totalSupply > totalDemand) {
            for (int i = 0; i < rows; i++) newCost[i][cols] = 0;
            newDemand[cols] = totalSupply - totalDemand;
        }

        // dummy row
        if (totalDemand > totalSupply) {
            for (int j = 0; j < cols; j++) newCost[rows][j] = 0;
            newSupply[rows] = totalDemand - totalSupply;
        }

        System.arraycopy(supply, 0, newSupply, 0, rows);
        System.arraycopy(demand, 0, newDemand, 0, cols);

        return new Object[]{R, C, newCost, newSupply, newDemand};
    }

    // ================= COMMON CHECK =================
    private boolean hasRemaining(double[] s, double[] d) {
        for (double val : s) if (val > 0) return true;
        for (double val : d) if (val > 0) return true;
        return false;
    }

    // ================= NORTH WEST =================
    public double[][] calculateNorthWest(int rows, int cols, double[][] costs, double[] supply, double[] demand) {

        Object[] balanced = balanceAndHandleRestrictions(rows, cols, costs, supply, demand);
        int bRows = (int) balanced[0], bCols = (int) balanced[1];
        double[][] bCosts = (double[][]) balanced[2];
        double[] s = (double[]) balanced[3], d = (double[]) balanced[4];

        double[][] alloc = new double[bRows][bCols];
        int i = 0, j = 0;

        // Phase 1: Strict Staircase (No going back)
        while (i < bRows && j < bCols) {
            if (bCosts[i][j] == Double.MAX_VALUE || d[j] <= 0) {
                j++;
                continue;
            }

            double qty = Math.min(s[i], d[j]);
            alloc[i][j] = qty;
            s[i] -= qty;
            d[j] -= qty;

            if (s[i] == 0) i++;
            else j++;
        }

        // Phase 2: Cleanup (Backfill skipped demand like W2 from remaining supply)
        for (int r = 0; r < bRows; r++) {
            for (int c = 0; c < bCols; c++) {
                if (s[r] > 0 && d[c] > 0 && bCosts[r][c] != Double.MAX_VALUE) {
                    double qty = Math.min(s[r], d[c]);
                    alloc[r][c] = qty;
                    s[r] -= qty;
                    d[c] -= qty;
                }
            }
        }
        return alloc;
    }



    // ================= LEAST COST =================
    public double[][] calculateLeastCost(int rows, int cols,
                                         double[][] costs,
                                         double[] supply,
                                         double[] demand) {

        Object[] b = balanceAndHandleRestrictions(rows, cols, costs, supply, demand);

        int R = (int) b[0];
        int C = (int) b[1];

        double[][] cost = (double[][]) b[2];
        double[] s = (double[]) b[3];
        double[] d = (double[]) b[4];

        double[][] alloc = new double[R][C];

        boolean[] rowDone = new boolean[R];
        boolean[] colDone = new boolean[C];

        while (true) {

            // ✅ CHECK IF FINISHED
            boolean finished = true;

            for (double val : s) {
                if (val > 0) {
                    finished = false;
                    break;
                }
            }

            if (finished) break;

            double min = Double.MAX_VALUE;
            int r = -1;
            int c = -1;

            // ✅ FIND MINIMUM VALID COST CELL
            for (int i = 0; i < R; i++) {

                if (rowDone[i]) continue;

                for (int j = 0; j < C; j++) {

                    if (colDone[j]) continue;

                    // restricted route
                    if (cost[i][j] == Double.MAX_VALUE) continue;

                    // exhausted supply/demand
                    if (s[i] == 0 || d[j] == 0) continue;

                    if (cost[i][j] < min) {
                        min = cost[i][j];
                        r = i;
                        c = j;
                    }
                }
            }

            // ✅ TRUE infeasible condition
            if (r == -1 || c == -1) {

                boolean pending = false;

                for (double val : s) {
                    if (val > 0) {
                        pending = true;
                        break;
                    }
                }

                if (pending) {
                    throw new RuntimeException("No feasible solution due to restricted routes");
                }

                break;
            }

            // ✅ ALLOCATION
            double qty = Math.min(s[r], d[c]);

            alloc[r][c] += qty;

            s[r] -= qty;
            d[c] -= qty;

            // ✅ MARK COMPLETED
            if (s[r] == 0) {
                rowDone[r] = true;
            }

            if (d[c] == 0) {
                colDone[c] = true;
            }
        }

        return alloc;
    }

    // ================= VOGEL =================
    private double calcPenalty(List<Double> v) {
        // 1. Remove the "Infinity" values and sort
        List<Double> x = v.stream()
                .filter(a -> a != Double.MAX_VALUE)
                .sorted()
                .toList();

        // 2. If no cells are available, return -1
        if (x.isEmpty()) return -1;

        // 3. If ONLY ONE cell is left, the penalty IS the cost of that cell
        // This will return 4.0 for Row 1 and 5.0 for Row 2
        if (x.size() == 1) {
            return x.get(0);
        }

        // 4. Standard VAM: Difference between two smallest
        return x.get(1) - x.get(0);
    }

    public double[][] calculateVogels(int rows, int cols,
                                      double[][] costs,
                                      double[] supply,
                                      double[] demand,
                                      List<String> steps) {

        Object[] b = balanceAndHandleRestrictions(rows, cols, costs, supply, demand);

        int R = (int) b[0];
        int C = (int) b[1];

        double[][] cost = (double[][]) b[2];
        double[] s = (double[]) b[3];
        double[] d = (double[]) b[4];

        double[][] alloc = new double[R][C];

        boolean[] rowDone = new boolean[R];
        boolean[] colDone = new boolean[C];

        while (true) {

            if (!hasRemaining(s, d)) break;

            double maxPenalty = -1;
            int pivot = -1;
            boolean isRow = true;

            // Row penalties
            for (int i = 0; i < R; i++) {
                if (rowDone[i]) continue;

                List<Double> vals = new ArrayList<>();
                for (int j = 0; j < C; j++) {
                    if (!colDone[j] && cost[i][j] != Double.MAX_VALUE) {
                        vals.add(cost[i][j]);
                    }
                }

                double p = calcPenalty(vals);
                steps.add("Row " + (i + 1) + " penalty = " + p);

                if (p > maxPenalty) {
                    maxPenalty = p;
                    pivot = i;
                    isRow = true;
                }
            }

            // Column penalties
            for (int j = 0; j < C; j++) {
                if (colDone[j]) continue;

                List<Double> vals = new ArrayList<>();
                for (int i = 0; i < R; i++) {
                    if (!rowDone[i] && cost[i][j] != Double.MAX_VALUE) {
                        vals.add(cost[i][j]);
                    }
                }

                double p = calcPenalty(vals);
                steps.add("Col " + (j + 1) + " penalty = " + p);

                if (p > maxPenalty) {
                    maxPenalty = p;
                    pivot = j;
                    isRow = false;
                }
            }

            int r = -1, c = -1;
            double min = Double.MAX_VALUE;

            if (isRow) {
                r = pivot;
                for (int j = 0; j < C; j++) {
                    if (!colDone[j] && cost[r][j] != Double.MAX_VALUE) {
                        if (cost[r][j] < min) {
                            min = cost[r][j];
                            c = j;
                        }
                    }
                }
            } else {
                c = pivot;
                for (int i = 0; i < R; i++) {
                    if (!rowDone[i] && cost[i][c] != Double.MAX_VALUE) {
                        if (cost[i][c] < min) {
                            min = cost[i][c];
                            r = i;
                        }
                    }
                }
            }

            if (r == -1 || c == -1) {
                throw new RuntimeException("No feasible solution due to restricted routes");
            }

            double qty = Math.min(s[r], d[c]);
            alloc[r][c] = qty;

            steps.add("Allocate " + qty + " at (" + (r + 1) + "," + (c + 1) + ")");

            s[r] -= qty;
            d[c] -= qty;

            if (s[r] == 0) rowDone[r] = true;
            if (d[c] == 0) colDone[c] = true;
        }

        return alloc;
    }

    // ================= TOTAL COST =================
    public double calculateTotalCost(double[][] allocation, double[][] costs) {

        double total = 0;

        for (int i = 0; i < costs.length; i++) {
            for (int j = 0; j < costs[0].length; j++) {

                if (costs[i][j] != -1 && allocation[i][j] > 0) {
                    total += allocation[i][j] * costs[i][j];
                }
            }
        }

        return total;
    }
}