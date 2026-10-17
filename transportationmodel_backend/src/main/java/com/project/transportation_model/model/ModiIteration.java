
package com.project.transportation_model.model;

public class ModiIteration {

    private int iterationNumber;
    private double[][] allocation;
    private double objectiveValue;

    private double[] u;
    private double[] v;
    private double[][] opportunityCosts;

    private int enteringRow;
    private int enteringCol;

    private double theta;
    private String message;
    private boolean optimal;

    public ModiIteration() {
    }

    public int getIterationNumber() {
        return iterationNumber;
    }

    public void setIterationNumber(int iterationNumber) {
        this.iterationNumber = iterationNumber;
    }

    public double[][] getAllocation() {
        return allocation;
    }

    public void setAllocation(double[][] allocation) {
        this.allocation = allocation;
    }

    public double getObjectiveValue() {
        return objectiveValue;
    }

    public void setObjectiveValue(double objectiveValue) {
        this.objectiveValue = objectiveValue;
    }

    public double[] getU() {
        return u;
    }

    public void setU(double[] u) {
        this.u = u;
    }

    public double[] getV() {
        return v;
    }

    public void setV(double[] v) {
        this.v = v;
    }

    public double[][] getOpportunityCosts() {
        return opportunityCosts;
    }

    public void setOpportunityCosts(double[][] opportunityCosts) {
        this.opportunityCosts = opportunityCosts;
    }

    public int getEnteringRow() {
        return enteringRow;
    }

    public void setEnteringRow(int enteringRow) {
        this.enteringRow = enteringRow;
    }

    public int getEnteringCol() {
        return enteringCol;
    }

    public void setEnteringCol(int enteringCol) {
        this.enteringCol = enteringCol;
    }

    public double getTheta() {
        return theta;
    }

    public void setTheta(double theta) {
        this.theta = theta;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isOptimal() {
        return optimal;
    }

    public void setOptimal(boolean optimal) {
        this.optimal = optimal;
    }
}

