import { useCallback } from "react";


// Function to calculate total allocation
export const calculateTotalAllocation = (allocations: string[]) => {
    return allocations.reduce((total, value) => total + (parseFloat(value) || 0), 0);
};

// Function to calculate percentage for each allocation
export const calculateAllocationPercentages = (allocations: string[]) => {
    const total = calculateTotalAllocation(allocations);
    return allocations.map(value => {
        const numValue = parseFloat(value) || 0;
        return total > 0 ? (numValue / total) * 100 : 0;
    });
};
 // Non-recursive GCD calculation
export const gcd = (a: number, b: number): number => {
    while (b !== 0) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
};