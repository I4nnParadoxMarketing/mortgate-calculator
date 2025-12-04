/**
 * Loan calculation utility for Mobile Home Chattel Loans
 */

export interface LoanInputs {
  homePrice: number;
  downPayment: number;
  annualInterestRate: number;
  loanTermYears: number;
}

export interface LoanResults {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  principal: number;
}

/**
 * Calculate loan payment using standard amortization formula
 * 
 * Formula:
 * - Monthly rate (r) = annual rate / 12
 * - Number of payments (n) = years * 12
 * - Monthly payment = P * r(1+r)^n / ((1+r)^n - 1)
 * - If r = 0, monthly payment = P / n
 * 
 * @param inputs - Loan input parameters
 * @returns Calculated loan results
 */
export function calculateLoan(inputs: LoanInputs): LoanResults {
  const { homePrice, downPayment, annualInterestRate, loanTermYears } = inputs;

  // Calculate principal (loan amount after down payment)
  const principal = homePrice - downPayment;

  // Validate inputs
  if (principal <= 0) {
    return {
      monthlyPayment: 0,
      totalPaid: 0,
      totalInterest: 0,
      principal: 0,
    };
  }

  if (loanTermYears <= 0) {
    return {
      monthlyPayment: 0,
      totalPaid: 0,
      totalInterest: 0,
      principal,
    };
  }

  // Convert annual rate to monthly decimal
  const monthlyRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;

  let monthlyPayment: number;

  // Handle zero interest rate case
  if (monthlyRate === 0) {
    monthlyPayment = principal / numberOfPayments;
  } else {
    // Standard amortization formula
    const powerTerm = Math.pow(1 + monthlyRate, numberOfPayments);
    monthlyPayment = principal * (monthlyRate * powerTerm) / (powerTerm - 1);
  }

  const totalPaid = monthlyPayment * numberOfPayments;
  const totalInterest = totalPaid - principal;

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    principal: Math.round(principal * 100) / 100,
  };
}

/**
 * Format number as currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number as percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0;
}
