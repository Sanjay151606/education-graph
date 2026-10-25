import React, { useState } from 'react';
import { AssignmentQuestion } from '../../types/notes';

const QUESTIONS_DATA: AssignmentQuestion[] = [
  // Group 1: Number Systems and Arithmetic
  {
    id: 1,
    group: 'Number Systems & Arithmetic',
    title: 'Decimal to Binary Conversion',
    question: 'Convert decimal 215 to binary.',
    solution: 'Successive division of 215 by 2 yields remainders:\n215 / 2 = 107 rem 1\n107 / 2 = 53 rem 1\n53 / 2 = 26 rem 1\n26 / 2 = 13 rem 0\n13 / 2 = 6 rem 1\n6 / 2 = 3 rem 0\n3 / 2 = 1 rem 1\n1 / 2 = 0 rem 1\nReading remainders from bottom to top: 11010111 (base 2).'
  },
  {
    id: 2,
    group: 'Number Systems & Arithmetic',
    title: 'Binary to Decimal Conversion',
    question: 'Convert binary 11010111 (base 2) to decimal.',
    solution: 'Positional expansion of 11010111 (base 2):\n(1 × 2^7) + (1 × 2^6) + (0 × 2^5) + (1 × 2^4) + (0 × 2^3) + (1 × 2^2) + (1 × 2^1) + (1 × 2^0)\n= 128 + 64 + 0 + 16 + 0 + 4 + 2 + 1\n= 215.'
  },
  {
    id: 3,
    group: 'Number Systems & Arithmetic',
    title: 'Binary Addition',
    question: 'Perform binary addition: 10111 (base 2) + 1101 (base 2).',
    solution: '10111 (base 2) = Decimal 23\n01101 (base 2) = Decimal 13\nCarries:   1 1 1 1\n           1 0 1 1 1\n        +  0 1 1 0 1\n        ------------\nSum:       1 0 0 1 0 0 (base 2) = Decimal 36.'
  },
  {
    id: 4,
    group: 'Number Systems & Arithmetic',
    title: 'Binary Subtraction',
    question: 'Perform binary subtraction: 11010 (base 2) - 1011 (base 2).',
    solution: '11010 (base 2) = Decimal 26\n01011 (base 2) = Decimal 11\nSubtraction with borrows:\n  1 1 0 1 0\n- 0 1 0 1 1\n-----------\n  0 1 1 1 1 (base 2) = Decimal 15.'
  },
  {
    id: 5,
    group: 'Number Systems & Arithmetic',
    title: 'Binary Multiplication',
    question: 'Perform binary multiplication: 1011 (base 2) × 101 (base 2).',
    solution: '1011 (base 2) = Decimal 11\n101 (base 2) = Decimal 5\nPartial products:\n    1 0 1 1\n  ×   1 0 1\n  ---------\n    1 0 1 1\n   0 0 0 0 .\n+ 1 0 1 1 . .\n-------------\n  1 1 0 1 1 1 (base 2) = Decimal 55.'
  },

  // Group 2: Bitwise and Shift Operations
  {
    id: 6,
    group: 'Bitwise & Shift Operations',
    title: 'Bitwise AND and OR',
    question: 'Given A = 45 and B = 25, compute A & B and A | B.',
    solution: 'A = 45 = 00101101 (base 2)\nB = 25 = 00011001 (base 2)\nBitwise AND (A & B) = 00001001 (base 2) = Decimal 9\nBitwise OR  (A | B) = 00111101 (base 2) = Decimal 61.'
  },
  {
    id: 7,
    group: 'Bitwise & Shift Operations',
    title: 'Bitwise XOR and NOT',
    question: 'Compute bitwise XOR A ^ B and NOT ~A (8-bit) for A = 45, B = 25.',
    solution: 'A = 00101101 (base 2), B = 00011001 (base 2)\nA ^ B = 00110100 (base 2) = Decimal 52\n~A = 11010010 (base 2), which is 210 unsigned and -46 as a signed 8-bit value.'
  },
  {
    id: 8,
    group: 'Bitwise & Shift Operations',
    title: 'NAND and NOR Evaluation',
    question: 'Evaluate NAND and NOR for X = 12 and Y = 10 (4-bit representation).',
    solution: 'X = 1100 (base 2), Y = 1010 (base 2)\nX & Y = 1000 (base 2)\nResults are 4-bit:\nNAND = ~(X & Y) = ~(1000) = 0111 (base 2) = Decimal 7\nX | Y = 1110 (base 2)\nNOR = ~(X | Y) = ~(1110) = 0001 (base 2) = Decimal 1.'
  },
  {
    id: 9,
    group: 'Bitwise & Shift Operations',
    title: 'Bitwise Shift Operations',
    question: 'Calculate 19 << 3 and 76 >> 2 with mathematical equivalents.',
    solution: 'Left Shift:  19 << 3 = 19 × (2^3) = 19 × 8 = 152.\nRight Shift: 76 >> 2 = 76 / (2^2) = 76 / 4 = 19.'
  },
  {
    id: 10,
    group: 'Bitwise & Shift Operations',
    title: 'Even/Odd Check with Bitwise Operator',
    question: 'Write a bitwise expression to check even/odd; test for N = 37.',
    solution: 'Bitwise expression: (N & 1) == 0 evaluates to true for even, false for odd.\nFor N = 37:\n37 = 100101 (base 2)\n37 & 1 = 1 (Least Significant Bit is 1 ? Odd number).'
  },

  // Group 3: Optimization and Representations
  {
    id: 11,
    group: 'Optimization & Representations',
    title: 'XOR Swap Algorithm',
    question: 'Demonstrate XOR swap algorithm for x = 14, y = 22 without temp variables.',
    solution: 'Initial: x = 14 = 01110 (base 2), y = 22 = 10110 (base 2)\nStep 1: x = x ^ y ? 14 ^ 22 = 24 = 11000 (base 2)\nStep 2: y = x ^ y ? 24 ^ 22 = 14 = 01110 (base 2)\nStep 3: x = x ^ y ? 24 ^ 14 = 22 = 10110 (base 2)\nFinal values: x = 22, y = 14.'
  },
  {
    id: 12,
    group: 'Optimization & Representations',
    title: 'Brian Kernighan’s Bit-Counting Algorithm',
    question: 'Trace Brian Kernighan’s algorithm for N = 43 to count set bits.',
    solution: 'N = 43 = 101011 (base 2).\nBrian Kernighan’s algorithm clears the lowest set bit at each step: N = N & (N - 1).\nStep 1: 43 & 42 = 101011 & 101010 = 101010 (42) ? count = 1\nStep 2: 42 & 41 = 101010 & 101001 = 101000 (40) ? count = 2\nStep 3: 40 & 39 = 101000 & 100111 = 100000 (32) ? count = 3\nStep 4: 32 & 31 = 100000 & 011111 = 000000 (0)  ? count = 4\nTotal set bits = 4.'
  },
  {
    id: 13,
    group: 'Optimization & Representations',
    title: '16-bit Integer Numerical Ranges',
    question: 'State 16-bit ranges for unsigned, sign-magnitude, and 2’s complement.',
    solution: '16-bit word length (n = 16):\nUnsigned: [0 to 2^16 - 1] = [0 to 65535]\nSign-Magnitude: [-(2^15 - 1) to +(2^15 - 1)] = [-32767 to +32767]\n2\'s Complement: [-2^15 to +(2^15 - 1)] = [-32768 to +32767].'
  },
  {
    id: 14,
    group: 'Optimization & Representations',
    title: '8-bit Sign-Magnitude Representation',
    question: 'Represent -68 in 8-bit Sign-Magnitude.',
    solution: 'Magnitude 68 in 7 bits: 68 = 64 + 4 = 1000100 (base 2).\nSign bit for negative is 1.\nPrepend sign bit: 1 + 1000100 ? 11000100 (base 2).'
  },
  {
    id: 15,
    group: 'Optimization & Representations',
    title: '8-bit 1’s Complement Representation',
    question: 'Represent -68 in 8-bit 1’s complement.',
    solution: '+68 in 8 bits = 01000100 (base 2).\nInvert every bit (1’s complement) ? 10111011 (base 2).'
  },
  {
    id: 16,
    group: 'Optimization & Representations',
    title: '8-bit 2’s Complement Representation',
    question: 'Represent -68 in 8-bit 2’s complement.',
    solution: '+68 in 8 bits = 01000100 (base 2).\n1\'s complement = 10111011 (base 2).\nAdd 1 to 1\'s complement:\n  10111011\n+ 00000001\n----------\n  10111100 (base 2).'
  },
  {
    id: 17,
    group: 'Optimization & Representations',
    title: '2’s Complement to Decimal',
    question: 'Convert 8-bit 2’s complement 10110101 (base 2) to decimal.',
    solution: 'Most Significant Bit is 1 ? number is negative.\nTo find magnitude: invert all bits and add 1.\nInvert 10110101 ? 01001010\nAdd 1 ? 01001011 (base 2) = 64 + 8 + 2 + 1 = 75.\nTherefore, the value is -75.'
  },
  {
    id: 18,
    group: 'Optimization & Representations',
    title: 'Comparison of Signed Representations',
    question: 'Compare Sign-Magnitude, 1’s complement, and 2’s complement.',
    solution: 'Sign-Magnitude: Dual zero (+0 and -0), requires separate addition/subtraction circuits.\n1\'s Complement: Dual zero (+0 and -0), requires end-around carry during addition.\n2\'s Complement: Single unique zero (00000000), uniform hardware adder handles both addition and subtraction seamlessly.'
  },

  // Group 4: Overflow and Underflow
  {
    id: 19,
    group: 'Overflow & Underflow',
    title: 'Signed Overflow Explanation',
    question: 'Explain signed overflow: +75 + +60 in 2’s complement (8-bit).',
    solution: '+75 = 01001011 (base 2)\n+60 = 00111100 (base 2)\nSum = 10000111 (base 2) = Decimal -121.\nAnalysis: Adding two positive operands (sign bit 0) resulted in a negative sum (sign bit 1).\nBecause +135 exceeds the maximum 8-bit signed integer boundary of +127, overflow occurred.'
  },
  {
    id: 20,
    group: 'Overflow & Underflow',
    title: 'Unsigned Underflow / Wrap-around',
    question: 'Describe underflow/wrap-around for 3 - 10 (8-bit unsigned).',
    solution: 'In 8-bit unsigned arithmetic (range [0, 255]), values cannot be negative.\nMathematical result: 3 - 10 = -7.\nUnderflow wrap-around formula: 256 + (-7) = 249.\nIn binary: 249 = 11111001 (base 2).'
  },

  // Group 5: Truth Tables
  {
    id: 21,
    group: 'Truth Tables',
    title: 'Bitwise AND (A & B)',
    question: 'Construct the 2-input truth table for Bitwise AND (A & B).',
    solution: 'AND outputs 1 only when both inputs A and B are 1.',
    truthTableHeaders: { inputs: ['A', 'B'], outputs: ['A & B'] },
    truthTable: [
      { inputs: { A: 0, B: 0 }, outputs: { 'A & B': 0 } },
      { inputs: { A: 0, B: 1 }, outputs: { 'A & B': 0 } },
      { inputs: { A: 1, B: 0 }, outputs: { 'A & B': 0 } },
      { inputs: { A: 1, B: 1 }, outputs: { 'A & B': 1 } }
    ]
  },
  {
    id: 22,
    group: 'Truth Tables',
    title: 'Bitwise OR (A | B)',
    question: 'Construct the 2-input truth table for Bitwise OR (A | B).',
    solution: 'OR outputs 1 when at least one input is 1.',
    truthTableHeaders: { inputs: ['A', 'B'], outputs: ['A | B'] },
    truthTable: [
      { inputs: { A: 0, B: 0 }, outputs: { 'A | B': 0 } },
      { inputs: { A: 0, B: 1 }, outputs: { 'A | B': 1 } },
      { inputs: { A: 1, B: 0 }, outputs: { 'A | B': 1 } },
      { inputs: { A: 1, B: 1 }, outputs: { 'A | B': 1 } }
    ]
  },
  {
    id: 23,
    group: 'Truth Tables',
    title: 'Bitwise XOR (A ^ B)',
    question: 'Construct the 2-input truth table for Bitwise XOR (A ^ B).',
    solution: 'XOR outputs 1 when the inputs differ, and 0 when they are equal.',
    truthTableHeaders: { inputs: ['A', 'B'], outputs: ['A ^ B'] },
    truthTable: [
      { inputs: { A: 0, B: 0 }, outputs: { 'A ^ B': 0 } },
      { inputs: { A: 0, B: 1 }, outputs: { 'A ^ B': 1 } },
      { inputs: { A: 1, B: 0 }, outputs: { 'A ^ B': 1 } },
      { inputs: { A: 1, B: 1 }, outputs: { 'A ^ B': 0 } }
    ]
  },
  {
    id: 24,
    group: 'Truth Tables',
    title: 'Bitwise NOT (~A)',
    question: 'Construct the 1-input truth table for Bitwise NOT (~A).',
    solution: 'NOT inverts the input bit value.',
    truthTableHeaders: { inputs: ['A'], outputs: ['~A'] },
    truthTable: [
      { inputs: { A: 0 }, outputs: { '~A': 1 } },
      { inputs: { A: 1 }, outputs: { '~A': 0 } }
    ]
  },
  {
    id: 25,
    group: 'Truth Tables',
    title: 'NAND Operation',
    question: 'Construct the 2-input truth table for NAND operation (~(A & B)).',
    solution: 'NAND is the negation of AND; it outputs 0 only when both inputs are 1.',
    truthTableHeaders: { inputs: ['A', 'B'], outputs: ['NAND'] },
    truthTable: [
      { inputs: { A: 0, B: 0 }, outputs: { NAND: 1 } },
      { inputs: { A: 0, B: 1 }, outputs: { NAND: 1 } },
      { inputs: { A: 1, B: 0 }, outputs: { NAND: 1 } },
      { inputs: { A: 1, B: 1 }, outputs: { NAND: 0 } }
    ]
  },
  {
    id: 26,
    group: 'Truth Tables',
    title: 'NOR Operation',
    question: 'Construct the 2-input truth table for NOR operation (~(A | B)).',
    solution: 'NOR is the negation of OR; it outputs 1 only when both inputs are 0.',
    truthTableHeaders: { inputs: ['A', 'B'], outputs: ['NOR'] },
    truthTable: [
      { inputs: { A: 0, B: 0 }, outputs: { NOR: 1 } },
      { inputs: { A: 0, B: 1 }, outputs: { NOR: 0 } },
      { inputs: { A: 1, B: 0 }, outputs: { NOR: 0 } },
      { inputs: { A: 1, B: 1 }, outputs: { NOR: 0 } }
    ]
  },
  {
    id: 27,
    group: 'Truth Tables',
    title: '3-Variable Logic Function F = (A & B) | (~C)',
    question: 'Construct a 3-variable truth table for F = (A & B) | (~C).',
    solution: 'Evaluate (A & B) and (~C), then combine with logical OR.',
    truthTableHeaders: { inputs: ['A', 'B', 'C'], outputs: ['A & B', '~C', 'F'] },
    truthTable: [
      { inputs: { A: 0, B: 0, C: 0 }, outputs: { 'A & B': 0, '~C': 1, F: 1 } },
      { inputs: { A: 0, B: 0, C: 1 }, outputs: { 'A & B': 0, '~C': 0, F: 0 } },
      { inputs: { A: 0, B: 1, C: 0 }, outputs: { 'A & B': 0, '~C': 1, F: 1 } },
      { inputs: { A: 0, B: 1, C: 1 }, outputs: { 'A & B': 0, '~C': 0, F: 0 } },
      { inputs: { A: 1, B: 0, C: 0 }, outputs: { 'A & B': 0, '~C': 1, F: 1 } },
      { inputs: { A: 1, B: 0, C: 1 }, outputs: { 'A & B': 0, '~C': 0, F: 0 } },
      { inputs: { A: 1, B: 1, C: 0 }, outputs: { 'A & B': 1, '~C': 1, F: 1 } },
      { inputs: { A: 1, B: 1, C: 1 }, outputs: { 'A & B': 1, '~C': 0, F: 1 } }
    ]
  },
  {
    id: 28,
    group: 'Truth Tables',
    title: 'Half-Adder Sum (A ? B)',
    question: 'Construct the truth table for Half-Adder Sum (A ? B).',
    solution: 'Sum is computed via exclusive OR (A ? B).',
    truthTableHeaders: { inputs: ['A', 'B'], outputs: ['Sum (A ? B)'] },
    truthTable: [
      { inputs: { A: 0, B: 0 }, outputs: { 'Sum (A ? B)': 0 } },
      { inputs: { A: 0, B: 1 }, outputs: { 'Sum (A ? B)': 1 } },
      { inputs: { A: 1, B: 0 }, outputs: { 'Sum (A ? B)': 1 } },
      { inputs: { A: 1, B: 1 }, outputs: { 'Sum (A ? B)': 0 } }
    ]
  },
  {
    id: 29,
    group: 'Truth Tables',
    title: 'Half-Adder Carry (A ? B)',
    question: 'Construct the truth table for Half-Adder Carry (A ? B).',
    solution: 'Carry is generated only when both inputs are 1 (A ? B).',
    truthTableHeaders: { inputs: ['A', 'B'], outputs: ['Carry (A ? B)'] },
    truthTable: [
      { inputs: { A: 0, B: 0 }, outputs: { 'Carry (A ? B)': 0 } },
      { inputs: { A: 0, B: 1 }, outputs: { 'Carry (A ? B)': 0 } },
      { inputs: { A: 1, B: 0 }, outputs: { 'Carry (A ? B)': 0 } },
      { inputs: { A: 1, B: 1 }, outputs: { 'Carry (A ? B)': 1 } }
    ]
  },
  {
    id: 30,
    group: 'Truth Tables',
    title: 'De Morgan’s Law Verification',
    question: 'Verify De Morgan’s Law via truth table: ~(A | B) = ~A & ~B.',
    solution: 'Columns for ~(A | B) and (~A & ~B) produce identical outputs across all input states. De Morgan’s theorem is verified.',
    truthTableHeaders: { inputs: ['A', 'B'], outputs: ['A | B', '~(A | B)', '~A', '~B', '~A & ~B'] },
    truthTable: [
      { inputs: { A: 0, B: 0 }, outputs: { 'A | B': 0, '~(A | B)': 1, '~A': 1, '~B': 1, '~A & ~B': 1 } },
      { inputs: { A: 0, B: 1 }, outputs: { 'A | B': 1, '~(A | B)': 0, '~A': 1, '~B': 0, '~A & ~B': 0 } },
      { inputs: { A: 1, B: 0 }, outputs: { 'A | B': 1, '~(A | B)': 0, '~A': 0, '~B': 1, '~A & ~B': 0 } },
      { inputs: { A: 1, B: 1 }, outputs: { 'A | B': 1, '~(A | B)': 0, '~A': 0, '~B': 0, '~A & ~B': 0 } }
    ]
  }
];

export default function InteractiveAssignmentOne(): React.ReactElement {
  const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({});
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  const toggleSolution = (id: number): void => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const groups = [
    'All',
    'Number Systems & Arithmetic',
    'Bitwise & Shift Operations',
    'Optimization & Representations',
    'Overflow & Underflow',
    'Truth Tables'
  ];

  const filteredQuestions =
    selectedGroup === 'All'
      ? QUESTIONS_DATA
      : QUESTIONS_DATA.filter((q) => q.group === selectedGroup);

  return (
    <div className="space-y-8 text-slate-200">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <span className="text-xs uppercase tracking-wider font-bold text-sky-400 bg-sky-950/60 px-3 py-1 rounded-md border border-sky-800/40">
            Interactive Study Module
          </span>
          <span className="text-xs text-slate-400">Unit I • Computer Fundamentals / Digital Logic</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-2">
          Assignment One: Number Systems, Bitwise Operations, Integer Representations & Truth Tables
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Self-paced interactive workbook with formula summaries, progressive disclosure solutions, and mobile-friendly truth tables.
        </p>
      </div>

      {/* Part 1: Fundamentals & Formulas */}
      <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">
          Part 1: Fundamentals & Formulas Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-semibold text-sky-300 mb-1">Number Systems & Arithmetic</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Base conversions execute via successive integer division by 2 (remainders read bottom-to-top) and positional weighting (sum of bit × 2^i).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-semibold text-sky-300 mb-1">Bitwise Operators & Logic</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Standard operations: AND (&), OR (|), XOR (^), NOT (~), NAND (~(A & B)), NOR (~(A | B)). Truth tables map every combination of binary inputs to defined outputs.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-semibold text-sky-300 mb-1">Optimization Tricks</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              • Even/Odd Check: (N & 1) == 0.<br />
              • In-Place Swap: x = x ^ y; y = x ^ y; x = x ^ y.<br />
              • Brian Kernighan: N = N & (N - 1) clears lowest set bit in O(set bits).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="font-semibold text-sky-300 mb-1">Integer Ranges & Overflow</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              • Unsigned 16-bit: [0, 65535].<br />
              • Sign-Magnitude 16-bit: [-32767, 32767].<br />
              • 2’s Complement 16-bit: [-32768, 32767]. Overflow occurs when two same-sign inputs produce a different-sign output.
            </p>
          </div>
        </div>
      </section>

      {/* Part 2: Interactive Questions Header & Filters */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-100">
            Part 2 & 3: Questions & Solutions (Q1 to Q30)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {groups.map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedGroup === grp
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isExpanded = !!expandedSolutions[q.id];
            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 transition-colors hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-sky-400 mr-2">Q{q.id}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mr-2">
                      [{q.group}]
                    </span>
                    <h4 className="inline text-base font-semibold text-slate-100">{q.title}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSolution(q.id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
                  >
                    {isExpanded ? 'Hide Solution' : 'Show Solution'}
                  </button>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed font-mono bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
                  {q.question}
                </p>

                {/* Collapsible Solution */}
                {isExpanded && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-sky-900/40 space-y-3">
                    <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Solution:</div>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {q.solution}
                    </pre>

                    {/* Real HTML Truth Table if present */}
                    {q.truthTable && q.truthTableHeaders && (
                      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                            <tr>
                              {q.truthTableHeaders.inputs.map((header) => (
                                <th key={header} className="px-4 py-2 font-semibold">
                                  {header}
                                </th>
                              ))}
                              {q.truthTableHeaders.outputs.map((header) => (
                                <th key={header} className="px-4 py-2 font-semibold text-sky-300">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-mono">
                            {q.truthTable.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/50">
                                {q.truthTableHeaders!.inputs.map((header) => (
                                  <td key={header} className="px-4 py-2 text-slate-300">
                                    {row.inputs[header]}
                                  </td>
                                ))}
                                {q.truthTableHeaders!.outputs.map((header) => (
                                  <td key={header} className="px-4 py-2 text-sky-400 font-bold">
                                    {row.outputs[header]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
