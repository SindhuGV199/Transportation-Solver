package com.project.transportation_model;

import com.project.transportation_model.model.ModiRequest;
import com.project.transportation_model.model.ModiResponse;
import com.project.transportation_model.service.ModiService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TransportationModelApplicationTests {

    @Autowired
    private ModiService modiService;

    @Test
    void testModiOptimization() {
        ModiRequest request = new ModiRequest();
        request.setObjective("MIN");

        // 3x3 cost matrix
        double[][] costs = {
                {8, 5, 6},
                {15, 10, 12},
                {3, 9, 10}
        };
        request.setCosts(costs);

        // Initial basic feasible solution (allocation with 5 basic cells: m + n - 1 = 3 + 3 - 1 = 5)
        double[][] initialAllocation = {
                {50, 0, 0},
                {10, 60, 10},
                {0, 0, 20}
        };
        request.setAllocation(initialAllocation);

        // Call processModi instead of checkAndOptimize
        ModiResponse response = modiService.processModi(request);

        assertTrue(response.isEligible());
        assertEquals(3, response.getM());
        assertEquals(3, response.getN());
        assertEquals(5, response.getRequiredAllocations());
        assertEquals(5, response.getCurrentAllocations());

        System.out.println("Initial Cost: " + response.getInitialCost());
        System.out.println("Final Cost: " + response.getFinalCost());
        System.out.println("Trace Steps: " + response.getSteps());
    }
}