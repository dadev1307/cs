function cyclicLeftShift(value: number, shift: number): number {
  return (value << shift) | (value >>> (32 - shift));
}

function cyclicRightShift(value: number, shift: number): number {
  return (value >>> shift) | (value << (32 - shift));
}

// Биты отбрасываемые из-за переполнения слева дополняются справа
console.log(
  cyclicLeftShift(0b10000000_00000000_00000000_00000001, 1) ===
    0b00000000_00000000_00000000_00000011
);

// Биты отбрасываемые из-за переполнения cправа дополняются слева
console.log(
  cyclicRightShift(0b10000000_00000000_00000000_00000001, 2) ===
    0b01100000_00000000_00000000_00000000
);
