'use client';

import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathFormulaProps {
  formula: string;
  inline?: boolean;
}

const MathFormula: React.FC<MathFormulaProps> = ({ formula, inline = false }) => {
  return inline ? <InlineMath math={formula} /> : <BlockMath math={formula} />;
};

export default MathFormula;