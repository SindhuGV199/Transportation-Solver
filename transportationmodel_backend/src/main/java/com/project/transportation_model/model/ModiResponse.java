package com.project.transportation_model.model;

import java.util.List;
import com.project.transportation_model.model.ModiIteration;

public class ModiResponse {
    private boolean eligible;
    private boolean optimal;
    private int m;
    private int n;
    private int requiredAllocations;
    private int currentAllocations;
    private double[][] finalAllocation;
    private double finalCost;
    private double initialCost;
    private List<String> steps;
    private String errorMessage;
    private List<ModiIteration> iterations;

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }
    public boolean isOptimal() { return optimal; }
    public void setOptimal(boolean optimal) { this.optimal = optimal; }

    public int getM() { return m; }
    public void setM(int m) { this.m = m; }

    public int getN() { return n; }
    public void setN(int n) { this.n = n; }

    public int getRequiredAllocations() { return requiredAllocations; }
    public void setRequiredAllocations(int requiredAllocations) { this.requiredAllocations = requiredAllocations; }

    public int getCurrentAllocations() { return currentAllocations; }
    public void setCurrentAllocations(int currentAllocations) { this.currentAllocations = currentAllocations; }

    public double[][] getFinalAllocation() { return finalAllocation; }
    public void setFinalAllocation(double[][] finalAllocation) { this.finalAllocation = finalAllocation; }

    public double getFinalCost() { return finalCost; }
    public void setFinalCost(double finalCost) { this.finalCost = finalCost; }

    public double getInitialCost() { return initialCost; }
    public void setInitialCost(double initialCost) { this.initialCost = initialCost; }

    public List<String> getSteps() { return steps; }
    public void setSteps(List<String> steps) { this.steps = steps; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public List<ModiIteration> getIterations() {
        return iterations;
    }

    public void setIterations(List<ModiIteration> iterations) {
        this.iterations = iterations;
    }
}