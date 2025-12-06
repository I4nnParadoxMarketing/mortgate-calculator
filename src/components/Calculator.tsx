'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { calculateLoan, formatCurrency, parseCurrency, type LoanInputs, type LoanResults } from '@/lib/calculator';
import { Download, Calculator as CalcIcon } from 'lucide-react';
import Image from 'next/image';
import jsPDF from 'jspdf';

export default function Calculator() {
    const [homePrice, setHomePrice] = useState<string>('');
    const [downPayment, setDownPayment] = useState<string>('');
    const [isDownPaymentPercent, setIsDownPaymentPercent] = useState<boolean>(true);
    const [interestRate, setInterestRate] = useState<string>('');
    const [loanTerm, setLoanTerm] = useState<string>('');
    const [results, setResults] = useState<LoanResults | null>(null);

    // Validation states
    const [errors, setErrors] = useState<{
        homePrice?: string;
        downPayment?: string;
        interestRate?: string;
        loanTerm?: string;
    }>({});

    const validateInputs = (): boolean => {
        const newErrors: typeof errors = {};
        const price = parseCurrency(homePrice);
        const dpValue = parseCurrency(downPayment);
        const rate = parseFloat(interestRate);
        const term = parseFloat(loanTerm);

        if (!homePrice || price <= 0) {
            newErrors.homePrice = 'Home price must be greater than $0';
        }

        if (!downPayment) {
            newErrors.downPayment = 'Down payment is required';
        } else if (isDownPaymentPercent) {
            if (dpValue < 0 || dpValue > 100) {
                newErrors.downPayment = 'Percentage must be between 0 and 100';
            }
        } else {
            if (dpValue < 0 || dpValue > price) {
                newErrors.downPayment = 'Down payment cannot exceed home price';
            }
        }

        if (!interestRate || rate < 0) {
            newErrors.interestRate = 'Interest rate must be 0 or greater';
        }

        if (!loanTerm || term <= 0) {
            newErrors.loanTerm = 'Loan term must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCalculate = () => {
        if (!validateInputs()) return;

        const price = parseCurrency(homePrice);
        const dpValue = parseCurrency(downPayment);
        const rate = parseFloat(interestRate);
        const term = parseFloat(loanTerm);

        const downPaymentAmount = isDownPaymentPercent
            ? (dpValue / 100) * price
            : dpValue;

        const inputs: LoanInputs = {
            homePrice: price,
            downPayment: downPaymentAmount,
            annualInterestRate: rate,
            loanTermYears: term,
        };

        const calculatedResults = calculateLoan(inputs);
        setResults(calculatedResults);
    };

    const loadExample = () => {
        setHomePrice('60000');
        setDownPayment('10');
        setIsDownPaymentPercent(true);
        setInterestRate('9');
        setLoanTerm('20');
        setErrors({});

        // Auto-calculate the example
        setTimeout(() => {
            const inputs: LoanInputs = {
                homePrice: 60000,
                downPayment: 6000,
                annualInterestRate: 9,
                loanTermYears: 20,
            };
            setResults(calculateLoan(inputs));
        }, 100);
    };

    const downloadPDF = () => {
        if (!results) return;

        const doc = new jsPDF();
        const price = parseCurrency(homePrice);
        const dpValue = parseCurrency(downPayment);
        const downPaymentAmount = isDownPaymentPercent
            ? (dpValue / 100) * price
            : dpValue;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Bedrock Communities', 105, 20, { align: 'center' });

        doc.setFontSize(16);
        doc.text('Loan Payment Summary', 105, 30, { align: 'center' });

        // Date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });

        // Line separator
        doc.setLineWidth(0.5);
        doc.line(20, 45, 190, 45);

        // Loan Details
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Loan Details', 20, 55);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        let y = 65;
        doc.text(`Home Price:`, 20, y);
        doc.text(formatCurrency(price), 100, y);

        y += 8;
        doc.text(`Down Payment:`, 20, y);
        doc.text(
            isDownPaymentPercent
                ? `${dpValue}% (${formatCurrency(downPaymentAmount)})`
                : formatCurrency(downPaymentAmount),
            100,
            y
        );

        y += 8;
        doc.text(`Loan Amount:`, 20, y);
        doc.text(formatCurrency(results.principal), 100, y);

        y += 8;
        doc.text(`Interest Rate:`, 20, y);
        doc.text(`${interestRate}% per year`, 100, y);

        y += 8;
        doc.text(`Loan Term:`, 20, y);
        doc.text(`${loanTerm} years`, 100, y);

        // Line separator
        y += 10;
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);

        // Payment Summary
        y += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Summary', 20, y);

        y += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Monthly Payment:`, 20, y);
        doc.text(formatCurrency(results.monthlyPayment), 100, y);

        y += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Amount Paid:`, 20, y);
        doc.text(formatCurrency(results.totalPaid), 100, y);

        y += 8;
        doc.text(`Total Interest:`, 20, y);
        doc.text(formatCurrency(results.totalInterest), 100, y);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            'This is an estimate only. Actual payments may vary.',
            105,
            280,
            { align: 'center' }
        );

        doc.save('bedrock-loan-summary.pdf');
    };

    const formatCurrencyInput = (value: string): string => {
        const num = parseCurrency(value);
        if (isNaN(num) || num === 0) return '';
        return num.toLocaleString('en-US');
    };

    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Image
                            src="/logo.png"
                            alt="Bedrock Communities Logo"
                            width={200}
                            height={200}
                            className="drop-shadow-lg"
                            priority
                        />
                    </div>
                    <p className="text-gray-600 text-lg">
                        Mobile Home Chattel Loan Calculator
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Input Card */}
                    <Card className="bg-[#2a65a7] border-[#1e4d8b] shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <CalcIcon className="w-5 h-5" />
                                Loan Details
                            </CardTitle>
                            <CardDescription className="text-gray-200">
                                Enter your loan information below
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Home Price */}
                            <div className="space-y-2">
                                <Label htmlFor="homePrice" className="text-white">
                                    Home Price
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        $
                                    </span>
                                    <Input
                                        id="homePrice"
                                        type="text"
                                        value={homePrice}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            setHomePrice(value);
                                            setErrors({ ...errors, homePrice: undefined });
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value) {
                                                setHomePrice(formatCurrencyInput(e.target.value));
                                            }
                                        }}
                                        placeholder="60,000"
                                        className="pl-7 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                                        aria-invalid={!!errors.homePrice}
                                        aria-describedby={errors.homePrice ? 'homePrice-error' : undefined}
                                    />
                                </div>
                                {errors.homePrice && (
                                    <p id="homePrice-error" className="text-sm text-red-400" role="alert">
                                        {errors.homePrice}
                                    </p>
                                )}
                            </div>

                            {/* Down Payment */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="downPayment" className="text-white">
                                        Down Payment
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-300">$</span>
                                        <Switch
                                            checked={isDownPaymentPercent}
                                            onCheckedChange={setIsDownPaymentPercent}
                                            aria-label="Toggle down payment type"
                                        />
                                        <span className="text-sm text-gray-300">%</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {isDownPaymentPercent ? '%' : '$'}
                                    </span>
                                    <Input
                                        id="downPayment"
                                        type="text"
                                        value={downPayment}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            setDownPayment(value);
                                            setErrors({ ...errors, downPayment: undefined });
                                        }}
                                        placeholder={isDownPaymentPercent ? '10' : '6,000'}
                                        className="pl-7 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                                        aria-invalid={!!errors.downPayment}
                                        aria-describedby={errors.downPayment ? 'downPayment-error' : undefined}
                                    />
                                </div>
                                {errors.downPayment && (
                                    <p id="downPayment-error" className="text-sm text-red-400" role="alert">
                                        {errors.downPayment}
                                    </p>
                                )}
                            </div>

                            {/* Interest Rate */}
                            <div className="space-y-2">
                                <Label htmlFor="interestRate" className="text-white">
                                    Annual Interest Rate
                                </Label>
                                <div className="relative">
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        %
                                    </span>
                                    <Input
                                        id="interestRate"
                                        type="text"
                                        value={interestRate}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            setInterestRate(value);
                                            setErrors({ ...errors, interestRate: undefined });
                                        }}
                                        placeholder="9.0"
                                        className="pr-7 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                                        aria-invalid={!!errors.interestRate}
                                        aria-describedby={errors.interestRate ? 'interestRate-error' : undefined}
                                    />
                                </div>
                                {errors.interestRate && (
                                    <p id="interestRate-error" className="text-sm text-red-400" role="alert">
                                        {errors.interestRate}
                                    </p>
                                )}
                            </div>

                            {/* Loan Term */}
                            <div className="space-y-2">
                                <Label htmlFor="loanTerm" className="text-white">
                                    Loan Term
                                </Label>
                                <div className="relative">
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        years
                                    </span>
                                    <Input
                                        id="loanTerm"
                                        type="text"
                                        value={loanTerm}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            setLoanTerm(value);
                                            setErrors({ ...errors, loanTerm: undefined });
                                        }}
                                        placeholder="20"
                                        className="pr-16 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                                        aria-invalid={!!errors.loanTerm}
                                        aria-describedby={errors.loanTerm ? 'loanTerm-error' : undefined}
                                    />
                                </div>
                                {errors.loanTerm && (
                                    <p id="loanTerm-error" className="text-sm text-red-400" role="alert">
                                        {errors.loanTerm}
                                    </p>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="pt-4">
                                <Button
                                    onClick={handleCalculate}
                                    className="w-full bg-gradient-to-r from-[#1a5a9e] to-[#154a85] hover:from-[#154a85] hover:to-[#103d6f] text-white font-semibold"
                                >
                                    Calculate
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Card */}
                    <Card className="bg-[#2a65a7] border-[#1e4d8b] shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-white">Payment Summary</CardTitle>
                            <CardDescription className="text-gray-200">
                                Your estimated monthly payment
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {results ? (
                                <div className="space-y-6">
                                    {/* Monthly Payment - Highlighted */}
                                    <div className="bg-[#2167b5]/20 rounded-lg p-6 border border-[#2167b5]/40">
                                        <p className="text-sm text-gray-300 mb-1">Monthly Payment</p>
                                        <p className="text-4xl font-bold text-white">
                                            {formatCurrency(results.monthlyPayment)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Principal + Interest
                                        </p>
                                    </div>

                                    {/* Other Details */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                            <span className="text-gray-300">Loan Amount</span>
                                            <span className="text-white font-semibold">
                                                {formatCurrency(results.principal)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                            <span className="text-gray-300">Total Amount Paid</span>
                                            <span className="text-white font-semibold">
                                                {formatCurrency(results.totalPaid)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                            <span className="text-gray-300">Total Interest</span>
                                            <span className="text-white font-semibold">
                                                {formatCurrency(results.totalInterest)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Download PDF Button */}
                                    <Button
                                        onClick={downloadPDF}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                                        variant="outline"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF Summary
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <CalcIcon className="w-16 h-16 text-gray-600 mb-4" />
                                    <p className="text-gray-400">
                                        Enter loan details and click Calculate to see your payment summary
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-600 text-sm">
                    <p>
                        This calculator provides estimates only. Actual loan terms may vary.
                    </p>
                </div>
            </div>
        </div>
    );
}
