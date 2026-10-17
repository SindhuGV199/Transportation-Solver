package com.project.transportation_model.model;

import java.util.List;

public class TransportationResponse {
    private double[][] allocation;
    private double totalCost;
    private List<String> steps; // This is what was missing!

    // The Constructor MUST have 3 arguments now
    public TransportationResponse(double[][] allocation, double totalCost, List<String> steps) {
        this.allocation = allocation;
        this.totalCost = totalCost;
        this.steps = steps;
    }

    // Getters
    public double[][] getAllocation() { return allocation; }
    public double getTotalCost() { return totalCost; }
    public List<String> getSteps() { return steps; }
}