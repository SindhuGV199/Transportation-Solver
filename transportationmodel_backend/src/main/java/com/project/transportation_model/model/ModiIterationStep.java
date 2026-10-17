package com.project.transportation_model.model;

import java.util.List;

public class ModiIterationStep {
    private int iterationNumber;
    private double[][] allocation;
    private Double[] u;
    private Double[] v;
    private List<String> potentialCalculations;
    private Double[][] opportunityCosts;
    private int[] enteringCell; // [row, col]
    private double enteringValue;
    private List<int[]> loop; // coordinates: [[r1, c1], [r2, c2], ...]
    private double theta;
    private List<String> thetaCalculation;
    private double previousCost;
    private double newCost;
    private double costImprovement;
    private boolean optimal;

    public int getIterationNumber() { return iterationNumber; }
    public void setIterationNumber(int iterationNumber) { this.iterationNumber = iterationNumber; }

    public double[][] getAllocation() { return allocation; }
    public void setAllocation(double[][] allocation) { this.allocation = allocation; }

    public Double[] getU() { return u; }
    public void setU(Double[] u) { this.u = u; }

    public Double[] getV() { return v; }
    public void setV(Double[] v) { this.v = v; }

    public List<String> getPotentialCalculations() { return potentialCalculations; }
    public void setPotentialCalculations(List<String> potentialCalculations) { this.potentialCalculations = potentialCalculations; }

    public Double[][] getOpportunityCosts() { return opportunityCosts; }
    public void setOpportunityCosts(Double[][] opportunityCosts) { this.opportunityCosts = opportunityCosts; }

    public int[] getEnteringCell() { return enteringCell; }
    public void setEnteringCell(int[] enteringCell) { this.enteringCell = enteringCell; }

    public double getEnteringValue() { return enteringValue; }
    public void setEnteringValue(double enteringValue) { this.enteringValue = enteringValue; }

    public List<int[]> getLoop() { return loop; }
    public void setLoop(List<int[]> loop) { this.loop = loop; }

    public double getTheta() { return theta; }
    public void setTheta(double theta) { this.theta = theta; }

    public List<String> getThetaCalculation() { return thetaCalculation; }
    public void setThetaCalculation(List<String> thetaCalculation) { this.thetaCalculation = thetaCalculation; }

    public double getPreviousCost() { return previousCost; }
    public void setPreviousCost(double previousCost) { this.previousCost = previousCost; }

    public double getNewCost() { return newCost; }
    public void setNewCost(double newCost) { this.newCost = newCost; }

    public double getCostImprovement() { return costImprovement; }
    public void setCostImprovement(double costImprovement) { this.costImprovement = costImprovement; }

    public boolean isOptimal() { return optimal; }
    public void setOptimal(boolean optimal) { this.optimal = optimal; }
}
