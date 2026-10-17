package com.project.transportation_model.model;

public class ModiRequest {
    private double[][] costs;
    private double[][] allocation;
    private String objective; // "MIN" or "MAX"

    public double[][] getCosts() { return costs; }
    public void setCosts(double[][] costs) { this.costs = costs; }

    public double[][] getAllocation() { return allocation; }
    public void setAllocation(double[][] allocation) { this.allocation = allocation; }

    public String getObjective() { return objective; }
    public void setObjective(String objective) { this.objective = objective; }
}