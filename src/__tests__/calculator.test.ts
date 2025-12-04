import { describe, it, expect } from 'vitest';
import { calculateLoan, formatCurrency, parseCurrency } from '@/lib/calculator';

describe('calculateLoan', () => {
    it('should calculate monthly payment with standard interest rate', () => {
        const result = calculateLoan({
            homePrice: 60000,
            downPayment: 6000,
            annualInterestRate: 9,
            loanTermYears: 20,
        });

        // Expected monthly payment for $54,000 at 9% for 20 years
        expect(result.monthlyPayment).toBeCloseTo(485.85, 0);
        expect(result.principal).toBe(54000);
        expect(result.totalPaid).toBeGreaterThan(result.principal);
        expect(result.totalInterest).toBeGreaterThan(0);
    });

    it('should handle zero interest rate', () => {
        const result = calculateLoan({
            homePrice: 60000,
            downPayment: 10000,
            annualInterestRate: 0,
            loanTermYears: 10,
        });

        const principal = 50000;
        const expectedMonthly = principal / (10 * 12);

        expect(result.monthlyPayment).toBeCloseTo(expectedMonthly, 2);
        expect(result.totalInterest).toBe(0);
        expect(result.totalPaid).toBe(principal);
    });

    it('should handle 100% down payment', () => {
        const result = calculateLoan({
            homePrice: 60000,
            downPayment: 60000,
            annualInterestRate: 9,
            loanTermYears: 20,
        });

        expect(result.monthlyPayment).toBe(0);
        expect(result.totalPaid).toBe(0);
        expect(result.totalInterest).toBe(0);
        expect(result.principal).toBe(0);
    });

    it('should handle zero loan term', () => {
        const result = calculateLoan({
            homePrice: 60000,
            downPayment: 6000,
            annualInterestRate: 9,
            loanTermYears: 0,
        });

        expect(result.monthlyPayment).toBe(0);
    });

    it('should calculate correctly for different loan amounts', () => {
        const result = calculateLoan({
            homePrice: 100000,
            downPayment: 20000,
            annualInterestRate: 7.5,
            loanTermYears: 15,
        });

        expect(result.principal).toBe(80000);
        expect(result.monthlyPayment).toBeGreaterThan(0);
        expect(result.totalPaid).toBeCloseTo(result.monthlyPayment * 15 * 12, 0);
    });

    it('should round results to 2 decimal places', () => {
        const result = calculateLoan({
            homePrice: 55555,
            downPayment: 5555,
            annualInterestRate: 8.888,
            loanTermYears: 18,
        });

        // Check that all values are rounded to 2 decimals
        expect(result.monthlyPayment.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
        expect(result.totalPaid.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
        expect(result.totalInterest.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('should match example preset calculation', () => {
        // Example: $60,000, 10% down, 9% interest, 20 years
        const result = calculateLoan({
            homePrice: 60000,
            downPayment: 6000, // 10% of 60000
            annualInterestRate: 9,
            loanTermYears: 20,
        });

        expect(result.principal).toBe(54000);
        expect(result.monthlyPayment).toBeCloseTo(485.85, 0);
        expect(result.totalPaid).toBeCloseTo(116604, 0);
        expect(result.totalInterest).toBeCloseTo(62604, 0);
    });
});

describe('formatCurrency', () => {
    it('should format numbers as USD currency', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
        expect(formatCurrency(1000000)).toBe('$1,000,000.00');
        expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should handle negative values', () => {
        expect(formatCurrency(-500)).toBe('-$500.00');
    });
});

describe('parseCurrency', () => {
    it('should parse currency strings to numbers', () => {
        expect(parseCurrency('$1,234.56')).toBe(1234.56);
        expect(parseCurrency('1234.56')).toBe(1234.56);
        expect(parseCurrency('$1,000,000')).toBe(1000000);
    });

    it('should handle invalid input', () => {
        expect(parseCurrency('')).toBe(0);
        expect(parseCurrency('abc')).toBe(0);
    });
});
