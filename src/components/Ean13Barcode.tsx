import React from 'react';

const leftPatterns = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const middlePatterns = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const rightPatterns = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const parityPatterns = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

export const createEan13 = () => {
  const payload = `50${Date.now().toString().slice(-9)}${Math.floor(Math.random() * 10)}`;
  const sum = payload.split('').reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return `${payload}${(10 - (sum % 10)) % 10}`;
};

export const isEan13 = (value: string) => /^\d{13}$/.test(value) && value.split('').reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0) % 10 === 0;

// Older catalog imports use a 12-digit EAN payload. Append its check digit so
// those existing records can immediately be displayed and scanned as EAN-13.
export const toEan13 = (value: string) => {
  if (isEan13(value)) return value;
  if (!/^\d{12}$/.test(value)) return null;
  const sum = value.split('').reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return `${value}${(10 - (sum % 10)) % 10}`;
};

export const Ean13Barcode: React.FC<{ 
  value: string; 
  height?: number | string; 
  width?: number | string;
  className?: string;
  showText?: boolean;
}> = ({ value, height = 110, width = '100%', className, showText = true }) => {
  const ean13 = toEan13(value);
  if (!ean13) return <span style={{ fontSize: '0.75rem', color: '#64748b' }}>A valid EAN-13 barcode is required.</span>;
  const digits = ean13.split('').map(Number);
  const encoded = ['101', ...digits.slice(1, 7).map((digit, index) => (parityPatterns[digits[0]][index] === 'L' ? leftPatterns[digit] : middlePatterns[digit])), '01010', ...digits.slice(7).map(digit => rightPatterns[digit]), '101'].join('');
  
  // Standard GS1 quiet zones (11 modules left, 9 modules right for optical scanner detection)
  const leftQuiet = 11;
  const rightQuiet = 9;
  const totalWidth = 95 + leftQuiet + rightQuiet; // 115 modules

  return (
    <svg
      role="img"
      aria-label={`EAN-13 barcode ${ean13}`}
      viewBox={`0 0 ${totalWidth} 68`}
      shapeRendering="crispEdges"
      className={className}
      style={{
        display: 'block',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        background: '#ffffff',
        margin: '0 auto',
        maxWidth: '100%'
      }}
    >
      <rect width={totalWidth} height="68" fill="#ffffff" />
      {encoded.split('').map((bit, index) => {
        if (bit !== '1') return null;
        const isGuard = index < 3 || (index >= 45 && index < 50) || index >= 92;
        return (
          <rect
            key={index}
            x={leftQuiet + index}
            y={0}
            width="1"
            height={isGuard ? 54 : 48}
            fill="#000000"
          />
        );
      })}
      {showText && (
        <text
          x={totalWidth / 2}
          y="63"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="'Courier New', Courier, monospace"
          letterSpacing="1.8"
          fill="#000000"
          shapeRendering="auto"
        >
          {ean13}
        </text>
      )}
    </svg>
  );
};
