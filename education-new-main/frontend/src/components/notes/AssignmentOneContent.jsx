/**
 * AssignmentOneContent.jsx
 *
 * Interactive chunked module for "Assignment One: Number Systems, Bitwise Operations,
 * Integer Representations & Truth Tables (30 Questions)".
 * Clean dark theme, properly formatted math symbols (→, ⊕, ∧), subscripts (₂), and responsive HTML truth tables.
 * Strict NO emojis, NO icon elements.
 */

import { useState } from "react";

export default function AssignmentOneContent() {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "part1" | "questions" | "solutions" | "tables"
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (id) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8 text-slate-200">
      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
        {[
          { id: "all", label: "Full Document" },
          { id: "part1", label: "Part 1: Formulas & Summary" },
          { id: "questions", label: "Part 2: 30 Questions" },
          { id: "solutions", label: "Part 3: Solutions (Q1 - Q20)" },
          { id: "tables", label: "Part 4: Truth Tables (Q21 - Q30)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PART 1 */}
      {(activeTab === "all" || activeTab === "part1") && (
        <section className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
                First Unit Core Theory
              </span>
              <h2 className="text-lg font-bold text-slate-100 mt-0.5">
                Part 1: Fundamentals & Formulas Summary
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
                <h3 className="font-bold text-indigo-300">Number Systems & Arithmetic</h3>
                <p className="text-slate-300">
                  Conversions via successive division (decimal to binary) and positional weighted sums:
                </p>
                <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-indigo-200 border border-slate-800">
                  Value = &Sigma; (bit<sub>i</sub> &times; 2<sup>i</sup>)
                </div>
                <p className="text-slate-400">
                  Basic addition, subtraction (with borrows), and multiplication by shifts in binary and decimal.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
                <h3 className="font-bold text-indigo-300">Bitwise Operators & Logic</h3>
                <ul className="space-y-1 text-slate-300">
                  <li><span className="font-mono text-indigo-300">AND (&amp;)</span>: 1 only if both bits are 1</li>
                  <li><span className="font-mono text-indigo-300">OR (|)</span>: 1 if at least one bit is 1</li>
                  <li><span className="font-mono text-indigo-300">XOR (^)</span>: 1 if bits differ (odd parity)</li>
                  <li><span className="font-mono text-indigo-300">NOT (~)</span>: Inverts every bit (~x = -(x + 1))</li>
                  <li><span className="font-mono text-indigo-300">NAND / NOR</span>: Inverted AND and OR functions</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
                <h3 className="font-bold text-indigo-300">Optimization Tricks</h3>
                <ul className="space-y-1.5 text-slate-300">
                  <li>
                    <span className="font-mono text-indigo-200">N &amp; 1 == 0</span>: Fast even/odd parity test.
                  </li>
                  <li>
                    <span className="font-mono text-indigo-200">x ^= y; y ^= x; x ^= y;</span>: In-place XOR swap without temporary variable.
                  </li>
                  <li>
                    <span className="font-mono text-indigo-200">N &amp; (N - 1)</span>: Brian Kernighan bit trick to clear the lowest set bit.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
                <h3 className="font-bold text-indigo-300">Integer Representations</h3>
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-slate-200">Unsigned (n bits):</strong> [0 to 2<sup>n</sup> - 1]</p>
                  <p><strong className="text-slate-200">Sign-Magnitude:</strong> [-(2<sup>n-1</sup> - 1) to +(2<sup>n-1</sup> - 1)] (dual zeros: +0, -0)</p>
                  <p><strong className="text-slate-200">1's Complement:</strong> [-(2<sup>n-1</sup> - 1) to +(2<sup>n-1</sup> - 1)] (invert bits)</p>
                  <p><strong className="text-slate-200">2's Complement:</strong> [-2<sup>n-1</sup> to 2<sup>n-1</sup> - 1] (invert + 1, unique zero)</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PART 2 */}
      {(activeTab === "all" || activeTab === "questions") && (
        <section className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
                  Assessment Section
                </span>
                <h2 className="text-lg font-bold text-slate-100 mt-0.5">
                  Part 2: Assignment Question Paper (30 Questions)
                </h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                Unit I Paper
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { q: 1, text: "Convert decimal 215 to binary." },
                { q: 2, text: "Convert binary 11011011₂ to decimal." },
                { q: 3, text: "Perform binary addition: 10111₂ + 1101₂." },
                { q: 4, text: "Perform binary subtraction: 11010₂ - 1011₂." },
                { q: 5, text: "Perform binary multiplication: 1011₂ × 101₂." },
                { q: 6, text: "Given A = 45 and B = 25, compute A & B and A | B." },
                { q: 7, text: "Compute bitwise XOR A ^ B and NOT ~A (8-bit) for Q6." },
                { q: 8, text: "Evaluate NAND and NOR for X = 12 and Y = 10." },
                { q: 9, text: "Calculate 19 << 3 and 76 >> 2 with equivalents." },
                { q: 10, text: "Write bitwise expression to check even/odd; test for N = 37." },
                { q: 11, text: "Demonstrate XOR swap algorithm for x = 14, y = 22." },
                { q: 12, text: "Trace Brian Kernighan's algorithm for N = 43." },
                { q: 13, text: "State 16-bit ranges for unsigned, sign-magnitude, 2's complement." },
                { q: 14, text: "Represent -68 in 8-bit Sign-Magnitude." },
                { q: 15, text: "Represent -68 in 8-bit 1's complement." },
                { q: 16, text: "Represent -68 in 8-bit 2's complement." },
                { q: 17, text: "Convert 8-bit 2's complement 10110101₂ to decimal." },
                { q: 18, text: "Compare Sign-Magnitude, 1's, and 2's complement." },
                { q: 19, text: "Explain signed overflow: +75 + +60 in 2's complement." },
                { q: 20, text: "Describe underflow/wrap-around for 3 - 10 (8-bit unsigned)." },
                { q: 21, text: "Construct the 2-input truth table for Bitwise AND (A & B)." },
                { q: 22, text: "Construct the 2-input truth table for Bitwise OR (A | B)." },
                { q: 23, text: "Construct the 2-input truth table for Bitwise XOR (A ^ B)." },
                { q: 24, text: "Construct the 1-input truth table for Bitwise NOT (~A)." },
                { q: 25, text: "Construct the 2-input truth table for NAND operation." },
                { q: 26, text: "Construct the 2-input truth table for NOR operation." },
                { q: 27, text: "Construct a 3-variable truth table for F = (A & B) | (~C)." },
                { q: 28, text: "Construct the truth table for Half-Adder Sum (A ⊕ B)." },
                { q: 29, text: "Construct the truth table for Half-Adder Carry (A ∧ B)." },
                { q: 30, text: "Verify De Morgan's Law via truth table: ~(A | B) ≡ ~A & ~B." },
              ].map((item) => (
                <div
                  key={item.q}
                  className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5"
                >
                  <span className="font-mono font-bold text-indigo-400 shrink-0">
                    Q{item.q}:
                  </span>
                  <span className="text-slate-300 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PART 3 */}
      {(activeTab === "all" || activeTab === "solutions") && (
        <section className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
                Step-by-Step Walkthrough
              </span>
              <h2 className="text-lg font-bold text-slate-100 mt-0.5">
                Part 3: Step-by-Step Solutions (Q1 to Q20)
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 block">Solutions 1 to 5: Number Systems & Arithmetic</span>
                <ul className="space-y-2 text-slate-300">
                  <li><strong>Sol 1:</strong> Successive division of 215 by 2 yields remainders from bottom to top: <span className="font-mono text-indigo-200">11010111₂</span>.</li>
                  <li><strong>Sol 2:</strong> Positional expansion of 11010111₂: 128 + 64 + 16 + 4 + 2 + 1 = <span className="font-mono text-indigo-200">215</span>.</li>
                  <li><strong>Sol 3:</strong> Binary addition: 10111₂ (23) + 1101₂ (13) = <span className="font-mono text-indigo-200">100100₂ (Decimal 36)</span>.</li>
                  <li><strong>Sol 4:</strong> Binary subtraction: 11010₂ (26) - 1011₂ (11) = <span className="font-mono text-indigo-200">01111₂ (Decimal 15)</span>.</li>
                  <li><strong>Sol 5:</strong> Binary multiplication: 1011₂ × 101₂ = <span className="font-mono text-indigo-200">110111₂ (Decimal 55)</span>.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 block">Solutions 6 to 10: Bitwise & Shift Operations</span>
                <ul className="space-y-2 text-slate-300">
                  <li><strong>Sol 6:</strong> A = 45 (00101101₂), B = 25 (00011001₂).<br />A &amp; B = <span className="font-mono text-indigo-200">00001001₂ (9)</span>; A | B = <span className="font-mono text-indigo-200">00111101₂ (61)</span>.</li>
                  <li><strong>Sol 7:</strong> A ^ B = <span className="font-mono text-indigo-200">00110100₂ (52)</span>; ~A (8-bit) = <span className="font-mono text-indigo-200">11010010₂ (-46 in 2's comp)</span>.</li>
                  <li><strong>Sol 8:</strong> X = 12 (1100₂), Y = 10 (1010₂). NAND = ~(1000) = <span className="font-mono text-indigo-200">0111₂ (7)</span>; NOR = ~(1110) = <span className="font-mono text-indigo-200">0001₂ (1)</span>.</li>
                  <li><strong>Sol 9:</strong> 19 &lt;&lt; 3 = 19 &times; 2³ = 19 &times; 8 = <span className="font-mono text-indigo-200">152</span>; 76 &gt;&gt; 2 = 76 / 4 = <span className="font-mono text-indigo-200">19</span>.</li>
                  <li><strong>Sol 10:</strong> Expression: <span className="font-mono text-indigo-200">(N &amp; 1) == 0</span>. For 37 (100101₂), 37 &amp; 1 = 1 &rarr; Odd.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 block">Solutions 11 to 15: Optimization, Ranges & Representations</span>
                <ul className="space-y-2 text-slate-300">
                  <li><strong>Sol 11:</strong> XOR swap for x = 14, y = 22: (1) x = x^y (24); (2) y = x^y (14); (3) x = x^y (22). Swapped without temporary variable.</li>
                  <li><strong>Sol 12:</strong> Brian Kernighan for N = 43 (101011₂): 43&amp;42 (101010₂), 42&amp;41 (101000₂), 40&amp;39 (100000₂), 32&amp;31 (0) &rarr; <span className="font-mono text-indigo-200">Total set bits = 4</span>.</li>
                  <li><strong>Sol 13:</strong> 16-bit ranges: Unsigned [0 to 65,535]; Sign-Magnitude [-32,767 to +32,767]; 2's Complement [-32,768 to +32,767].</li>
                  <li><strong>Sol 14:</strong> 8-bit Sign-Magnitude for -68: Magnitude 68 = 01000100₂, set MSB sign bit &rarr; <span className="font-mono text-indigo-200">11000100₂</span>.</li>
                  <li><strong>Sol 15:</strong> 8-bit 1's Complement for -68: Invert 01000100₂ &rarr; <span className="font-mono text-indigo-200">10111011₂</span>.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 block">Solutions 16 to 20: 2's Complement, Overflow & Underflow</span>
                <ul className="space-y-2 text-slate-300">
                  <li><strong>Sol 16:</strong> 8-bit 2's Complement for -68: Invert (10111011₂) + 1 = <span className="font-mono text-indigo-200">10111100₂</span>.</li>
                  <li><strong>Sol 17:</strong> Convert 10110101₂ (MSB=1, negative): Invert bits (01001010) + 1 = 01001011₂ (75) &rarr; <span className="font-mono text-indigo-200">-75</span>.</li>
                  <li><strong>Sol 18:</strong> Comparison: Sign-Magnitude and 1's complement suffer from dual zero representations (+0 and -0) requiring extra ALU logic. 2's complement has a single zero and permits standard addition circuitry.</li>
                  <li><strong>Sol 19:</strong> Signed Overflow: +75 (01001011₂) + +60 (00111100₂) = 10000111₂. Adding two positive numbers resulted in a negative sign bit (MSB=1, value -121), which exceeds the 8-bit signed ceiling of +127.</li>
                  <li><strong>Sol 20:</strong> Unsigned Underflow: 3 - 10 = -7. In 8-bit modulo arithmetic (modulo 256), wraps around to 256 - 7 = <span className="font-mono text-indigo-200">249 (11111001₂)</span>.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PART 4: TRUTH TABLES */}
      {(activeTab === "all" || activeTab === "tables") && (
        <section className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
                Logic Circuit Truth Tables
              </span>
              <h2 className="text-lg font-bold text-slate-100 mt-0.5">
                Part 4: Truth Tables (Q21 to Q30)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Q21: AND */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 block">Q21: Bitwise AND (A &amp; B)</span>
                <table className="w-full text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1">A</th>
                      <th className="py-1">B</th>
                      <th className="py-1 text-indigo-300">A &amp; B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr><td className="py-1">0</td><td>0</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">0</td><td>1</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">1</td><td>0</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">1</td><td>1</td><td className="text-emerald-400 font-bold">1</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Q22: OR */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 block">Q22: Bitwise OR (A | B)</span>
                <table className="w-full text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1">A</th>
                      <th className="py-1">B</th>
                      <th className="py-1 text-indigo-300">A | B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr><td className="py-1">0</td><td>0</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">0</td><td>1</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">1</td><td>0</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">1</td><td>1</td><td className="text-emerald-400 font-bold">1</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Q23: XOR */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 block">Q23: Bitwise XOR (A ^ B)</span>
                <table className="w-full text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1">A</th>
                      <th className="py-1">B</th>
                      <th className="py-1 text-indigo-300">A ^ B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr><td className="py-1">0</td><td>0</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">0</td><td>1</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">1</td><td>0</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">1</td><td>1</td><td className="text-slate-400">0</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Q24: NOT */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 block">Q24: Bitwise NOT (~A)</span>
                <table className="w-full text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1">A</th>
                      <th className="py-1 text-indigo-300">~A</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr><td className="py-1">0</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">1</td><td className="text-slate-400">0</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Q25: NAND */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 block">Q25: NAND ~(A &amp; B)</span>
                <table className="w-full text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1">A</th>
                      <th className="py-1">B</th>
                      <th className="py-1 text-indigo-300">NAND</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr><td className="py-1">0</td><td>0</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">0</td><td>1</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">1</td><td>0</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">1</td><td>1</td><td className="text-slate-400">0</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Q26: NOR */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 block">Q26: NOR ~(A | B)</span>
                <table className="w-full text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1">A</th>
                      <th className="py-1">B</th>
                      <th className="py-1 text-indigo-300">NOR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr><td className="py-1">0</td><td>0</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">0</td><td>1</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">1</td><td>0</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">1</td><td>1</td><td className="text-slate-400">0</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Q27: 3-Variable Truth Table */}
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
              <span className="font-bold text-indigo-300 block">
                Q27: 3-Variable Circuit: F = (A &amp; B) | (~C)
              </span>
              <div className="overflow-x-auto">
                <table className="w-full max-w-lg text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1.5">A</th>
                      <th className="py-1.5">B</th>
                      <th className="py-1.5">C</th>
                      <th className="py-1.5 text-slate-500">A &amp; B</th>
                      <th className="py-1.5 text-slate-500">~C</th>
                      <th className="py-1.5 text-indigo-300 font-bold">F</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr><td className="py-1">0</td><td>0</td><td>0</td><td>0</td><td>1</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">0</td><td>0</td><td>1</td><td>0</td><td>0</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">0</td><td>1</td><td>0</td><td>0</td><td>1</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">0</td><td>1</td><td>1</td><td>0</td><td>0</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">1</td><td>0</td><td>0</td><td>0</td><td>1</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">1</td><td>0</td><td>1</td><td>0</td><td>0</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">1</td><td>1</td><td>0</td><td>1</td><td>1</td><td className="text-emerald-400 font-bold">1</td></tr>
                    <tr><td className="py-1">1</td><td>1</td><td>1</td><td>1</td><td>0</td><td className="text-emerald-400 font-bold">1</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Q28 & Q29: Half-Adder */}
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
              <span className="font-bold text-indigo-300 block">
                Q28 &amp; Q29: Half-Adder: Sum = A &oplus; B, Carry = A &and; B
              </span>
              <div className="overflow-x-auto">
                <table className="w-full max-w-md text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1.5">A</th>
                      <th className="py-1.5">B</th>
                      <th className="py-1.5 text-indigo-300 font-bold">Sum (A &oplus; B)</th>
                      <th className="py-1.5 text-amber-300 font-bold">Carry (A &and; B)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr><td className="py-1">0</td><td>0</td><td className="text-slate-400">0</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">0</td><td>1</td><td className="text-emerald-400 font-bold">1</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">1</td><td>0</td><td className="text-emerald-400 font-bold">1</td><td className="text-slate-400">0</td></tr>
                    <tr><td className="py-1">1</td><td>1</td><td className="text-slate-400">0</td><td className="text-amber-400 font-bold">1</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Q30: De Morgan's Law Verification */}
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
              <span className="font-bold text-indigo-300 block">
                Q30: Verification of De Morgan's Law: ~(A | B) &equiv; ~A &amp; ~B
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1.5">A</th>
                      <th className="py-1.5">B</th>
                      <th className="py-1.5 text-slate-500">A | B</th>
                      <th className="py-1.5 text-emerald-400 font-bold bg-emerald-950/20">~(A | B) [Col 4]</th>
                      <th className="py-1.5 text-slate-500">~A</th>
                      <th className="py-1.5 text-slate-500">~B</th>
                      <th className="py-1.5 text-emerald-400 font-bold bg-emerald-950/20">~A &amp; ~B [Col 7]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr>
                      <td className="py-1">0</td>
                      <td>0</td>
                      <td>0</td>
                      <td className="text-emerald-400 font-bold bg-emerald-950/20">1</td>
                      <td>1</td>
                      <td>1</td>
                      <td className="text-emerald-400 font-bold bg-emerald-950/20">1</td>
                    </tr>
                    <tr>
                      <td className="py-1">0</td>
                      <td>1</td>
                      <td>1</td>
                      <td className="text-slate-400 bg-emerald-950/20">0</td>
                      <td>1</td>
                      <td>0</td>
                      <td className="text-slate-400 bg-emerald-950/20">0</td>
                    </tr>
                    <tr>
                      <td className="py-1">1</td>
                      <td>0</td>
                      <td>1</td>
                      <td className="text-slate-400 bg-emerald-950/20">0</td>
                      <td>0</td>
                      <td>1</td>
                      <td className="text-slate-400 bg-emerald-950/20">0</td>
                    </tr>
                    <tr>
                      <td className="py-1">1</td>
                      <td>1</td>
                      <td>1</td>
                      <td className="text-slate-400 bg-emerald-950/20">0</td>
                      <td>0</td>
                      <td>0</td>
                      <td className="text-slate-400 bg-emerald-950/20">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-emerald-400/90 font-medium pt-1">
                Since Column 4 [~(A | B)] and Column 7 [~A &amp; ~B] produce identical truth evaluations for all 4 states, De Morgan's Law is rigorously proven.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
