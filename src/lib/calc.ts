export type CalcResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

type Op = '+' | '-' | '*' | '/' | 'u-' | 'u+';
type Token =
  | { t: 'num'; v: number }
  | { t: 'op'; v: Op }
  | { t: 'lp' }
  | { t: 'rp' };

function isDigit(ch: string) {
  return ch >= '0' && ch <= '9';
}

function tokenize(expr: string): CalcResult & { tokens?: Token[] } {
  const s = expr.replace(/\s+/g, '');
  if (!s) return { ok: false, error: 'Empty' };
  if (s.length > 200) return { ok: false, error: 'Too long' };

  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i]!;
    if (isDigit(ch) || ch === '.') {
      let j = i;
      let seenDot = false;
      while (j < s.length) {
        const c = s[j]!;
        if (isDigit(c)) {
          j += 1;
          continue;
        }
        if (c === '.') {
          if (seenDot) break;
          seenDot = true;
          j += 1;
          continue;
        }
        break;
      }
      const raw = s.slice(i, j);
      const n = Number.parseFloat(raw);
      if (!Number.isFinite(n)) return { ok: false, error: 'Invalid number' };
      tokens.push({ t: 'num', v: n });
      i = j;
      continue;
    }

    if (ch === '(') {
      tokens.push({ t: 'lp' });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ t: 'rp' });
      i += 1;
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ t: 'op', v: ch });
      i += 1;
      continue;
    }

    return { ok: false, error: `Unexpected "${ch}"` };
  }

  return { ok: true, value: 0, tokens };
}

function precedence(op: Op): number {
  if (op === 'u-' || op === 'u+') return 3;
  if (op === '*' || op === '/') return 2;
  return 1;
}

function rightAssociative(op: Op): boolean {
  return op === 'u-' || op === 'u+';
}

export function evaluateExpression(expr: string): CalcResult {
  const tok = tokenize(expr);
  if (!tok.ok) return tok;
  const tokens = tok.tokens ?? [];

  // Shunting-yard to RPN, with unary +/- support.
  const output: Token[] = [];
  const ops: Op[] = [];

  let prev: Token | null = null;
  for (const t of tokens) {
    if (t.t === 'num') {
      output.push(t);
      prev = t;
      continue;
    }
    if (t.t === 'lp') {
      ops.push('(' as unknown as Op);
      prev = t;
      continue;
    }
    if (t.t === 'rp') {
      while (ops.length > 0 && ops[ops.length - 1] !== ('(' as unknown as Op)) {
        output.push({ t: 'op', v: ops.pop()! });
      }
      if (ops.length === 0) return { ok: false, error: 'Mismatched parentheses' };
      ops.pop(); // '('
      prev = t;
      continue;
    }
    if (t.t === 'op') {
      let op: Op = t.v;
      const isUnary =
        prev == null ||
        prev.t === 'op' ||
        prev.t === 'lp';
      if (isUnary && (op === '+' || op === '-')) {
        op = op === '-' ? 'u-' : 'u+';
      } else if (isUnary) {
        return { ok: false, error: 'Operator position' };
      }

      while (ops.length > 0) {
        const top = ops[ops.length - 1]!;
        if (top === ('(' as unknown as Op)) break;
        const p1 = precedence(op);
        const p2 = precedence(top);
        if (p2 > p1 || (p2 === p1 && !rightAssociative(op))) {
          output.push({ t: 'op', v: ops.pop()! });
          continue;
        }
        break;
      }
      ops.push(op);
      prev = { t: 'op', v: op };
      continue;
    }
  }

  while (ops.length > 0) {
    const op = ops.pop()!;
    if (op === ('(' as unknown as Op)) return { ok: false, error: 'Mismatched parentheses' };
    output.push({ t: 'op', v: op });
  }

  // Evaluate RPN.
  const stack: number[] = [];
  for (const t of output) {
    if (t.t === 'num') {
      stack.push(t.v);
      continue;
    }
    if (t.t === 'op') {
      if (t.v === 'u-' || t.v === 'u+') {
        const a = stack.pop();
        if (a == null) return { ok: false, error: 'Invalid expression' };
        stack.push(t.v === 'u-' ? -a : a);
        continue;
      }

      const b = stack.pop();
      const a = stack.pop();
      if (a == null || b == null) return { ok: false, error: 'Invalid expression' };
      let r: number;
      if (t.v === '+') r = a + b;
      else if (t.v === '-') r = a - b;
      else if (t.v === '*') r = a * b;
      else {
        if (b === 0) return { ok: false, error: 'Division by zero' };
        r = a / b;
      }
      if (!Number.isFinite(r)) return { ok: false, error: 'Invalid result' };
      stack.push(r);
    }
  }

  if (stack.length !== 1) return { ok: false, error: 'Invalid expression' };
  const value = stack[0]!;
  return { ok: true, value };
}

