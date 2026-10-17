package com.project.transportation_model.controller;

import com.project.transportation_model.model.TransportationRequest;
import com.project.transportation_model.model.TransportationResponse;
import com.project.transportation_model.model.ModiRequest;
import com.project.transportation_model.model.ModiResponse;
import com.project.transportation_model.service.TransportationService;
import com.project.transportation_model.service.ModiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;

@RestController
@RequestMapping("/api/transportation")
@CrossOrigin(origins = "*")
public class TransportationController {

    @Autowired
    private TransportationService service;

    @Autowired
    private ModiService modiService;

    @GetMapping("/test")
    public String test() {
        return "Backend is ready for Review 1!";
    }

    @PostMapping("/calculate")
    public TransportationResponse calculate(@RequestBody TransportationRequest request) {
        double[][] allocation;
        List<String> steps = new ArrayList<>();
        String method = (request.getMethod() != null) ? request.getMethod().toUpperCase() : "NW";
        System.out.println("=== COST MATRIX ===");

        for (double[] row : request.getCosts()) {
            System.out.println(Arrays.toString(row));
        }

        // Logic routing based on method string
        if (method.equals("VOGEL")) {
            allocation = service.calculateVogels(request.getSuppliers(), request.getCustomers(),
                    request.getCosts(), request.getSupply(), request.getDemand(), steps);
        } else if (method.contains("LEAST")) {
            allocation = service.calculateLeastCost(request.getSuppliers(), request.getCustomers(),
                    request.getCosts(), request.getSupply(), request.getDemand());
        } else {
            // Added costs to North-West call to support restriction checking
            allocation = service.calculateNorthWest(request.getSuppliers(), request.getCustomers(),
                    request.getCosts(), request.getSupply(), request.getDemand());
        }

        double finalCost = service.calculateTotalCost(allocation, request.getCosts());

        return new TransportationResponse(allocation, finalCost, steps);
    }

    @PostMapping("/modi")
    public ModiResponse calculateModi(@RequestBody ModiRequest request) {
        return modiService.processModi(request);
    }
}