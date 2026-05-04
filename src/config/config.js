// data type

const LLVM_TYPES_MAP = {
  int: "i32",
  double: "double",
  string: "i8*",
  bool: "i1"
};

const ZEN_TYPES_MAP = {
  "i32": "int",
  "double": "double",
  "i8*": "string",
  "i1": "bool"
}

const TYPES = ["int", "bool", "string", "double"];

const SCALAR_TYPES = ["int", "bool", "double"];

const NON_SCALAR_TYPES = ["string"];

const RESERVED_KEYWORDS = ["fn", "if", "else if", "else", "loop", "const", "int", "double", "string", "bool", "return", "while"];

// lexer tokens

const TokenTypes = {
  IDENTIFIER: "IDENTIFIER",
  ASSIGNMENT: "ASSIGNMENT",
  OPERATOR: "OPERATOR",
  CONSTANT: "CONSTANT",
  TYPE: "TYPE",
  INT: "int",
  LBRACKET: "LBRACKET",
  RBRACKET: "RBRACKET",
  STRING: "string",
  BOOLEAN: "bool",
  DOUBLE: "double",
  NEWLINE: "NEWLINE",
  LEFT_PARENTHESIS: "LEFT_PARENTHESIS",
  RIGHT_PARENTHESIS: "RIGHT_PARENTHESIS",
  KEYWORD: "KEYWORD",
  COMMA: "COMMA",
  BLOCK_START: "BLOCK_START",
  BLOCK_END: "BLOCK_END",
  COLON: "COLON",
  ARRAY: "ARRAY",
  EOF: "EOF"
};

// keywords

const KEYWORDS = ["if", "else if", "else", "loop", "break", "continue", "return", "fn", "const", "void", "while", "switch", "case", "default"];

const STDLIB = [
  // BASIC
  "isEven", "isOdd", "isPositive", "isNegative",
  "abs", "max", "min", "clamp", "sign",

  // MATH
  "pow", "sqrt", "square", "cube",

  // ROUNDING
  "floor", "ceil", "round", "toFixed",
  "mod",

  // NUMBER THEORY
  "gcd", "lcm", "factorial", "isPrime",

  // INTERPOLATION
  "lerp", "normalize",

  // UTILITY
  "between",

  // STRING
  "reverse", "indexOf", "slice", "charAt",
  "replace", "contains",
  "upperCase", "lowerCase",
  "startsWith", "endsWith",
  "trim", "splitAt"
];

// builtin functions

const BUILTIN_FUNCTIONS = [
  "screen", "input", "type", "Int", "Double", "Bool", "String", "length"];

const NOT_STANDALONE_BUILTIN_FUNCTIONS = ["input"];

const VOID_BUILTIN_FUNCTIONS = ["screen"];

// operators

const ASSIGNMENT_OPS = [
  "=",
  "+=",
  "-=",
  "*=",
  "/=",
  "%="
];

const ARITHMETIC_OPS = [
  "+",
  "-",
  "*",
  "/",
  "%"
];

const UNARY_OPS = [
  "++",
  "--",
  "!"
];

const COMPARISON_OPS = [
  "==",
  "!=",
  ">=",
  "<=",
  ">",
  "<"
];

const LOGICAL_OPS = [
  "&&",
  "||"
];

const OP_CODES = {
  int: {
    "+": "add",
    "-": "sub",
    "*": "mul",
    "/": "sdiv",
    "%": "srem"
  },
  double: {
    "+": "fadd",
    "-": "fsub",
    "*": "fmul",
    "/": "fdiv",
    "%": "frem"
  }
};

const cmpMap = {
  "==": "eq",
  "!=": "ne",
  ">": "sgt",
  "<": "slt",
  ">=": "sge",
  "<=": "sle"
};

const fcmpMap = {
  "==": "oeq",
  "!=": "one",
  ">": "ogt",
  "<": "olt",
  ">=": "oge",
  "<=": "ole"
};

const FORMAT_MAP = {
  int: {
    fmt: "@.scan_int",
    fmtType: "[3 x i8]",
    varType: "i32",
    decl: "scan_int",
    ir: '@.scan_int = private constant [3 x i8] c"%d\\00"',
    zero: "0"
  },
  double: {
    fmt: "@.scan_double",
    fmtType: "[4 x i8]",
    varType: "double",
    decl: "scan_double",
    ir: '@.scan_double = private constant [4 x i8] c"%lf\\00"',
    zero: "0.0"
  },
  string: {
    fmt: "@.scan_string",
    fmtType: "[6 x i8]",
    varType: "i8*",
    decl: "scan_string",
    ir: '@.scan_string = private constant [6 x i8] c"%[^\n]\\00"',
    zero: null
  }
}

const LOOKUP = {
  bool: 0,
  int: 1,
  double: 2
};

const OPERATORS = [
  ...ASSIGNMENT_OPS,
  ...ARITHMETIC_OPS,
  ...UNARY_OPS,
  ...COMPARISON_OPS,
  ...LOGICAL_OPS
];

// parser types

const ParserTypes = {
  BINARY_EXPRESSION: "BINARY_EXPRESSION",
  ASSIGNMENT: "ASSIGNMENT",
  VARIABLE_REFERENCE: "VARIABLE_REFERENCE",
  UNARY_EXPRESSION: "UNARY_EXPRESSION",
  FUNCTION_DECLARATION: "FUNCTION_DECLARATION",
  VARIABLE_DECLARATION: "VARIABLE_DECLARATION",
  BLOCK: "BLOCK",
  IF: "CONDITIONAL",
  LOOP: "LOOP",
  BREAK: "BREAK",
  CONTINUE: "CONTINUE",
  RETURN: "RETURN",
  INT: "int",
  DOUBLE: "double",
  STRING: "string",
  BOOLEAN: "bool",
  VOID: "void",
  VARIABLE: "variable",
  CALL: "CALL",
  WHILE: "WHILE_LOOP",
  CONDITIONAL: "CONDITIONAL",
  ARRAY: "ARRAY",
  ARRAY_ACCESS: "ARRAY_ACCESS",
  DATA_TYPE: "DATA_TYPE"
};

const GLOBAL_EXTERNAL = {
  PI: "double",
  TAU: "double",
  E: "double",
  PHI: "double",
  SQRT2: "double",
  LN2: "double",
  LN10: "double",

  I32_MAX: "i32",
  I32_MIN: "i32",

  F64_MAX: "double",
  F64_MIN: "double",
  F64_EPS: "double",

  INF: "double",
  NEG_INF: "double",
  NAN: "double"
};

const STD_FUNCTIONS = {
  // ===== BASIC =====
  isEven:      { ret: "i1", params: ["i32"] },
  isOdd:       { ret: "i1", params: ["i32"] },
  isPositive:  { ret: "i1", params: ["i32"] },
  isNegative:  { ret: "i1", params: ["i32"] },

  abs:         { ret: "i32", params: ["i32"] },
  max:         { ret: "i32", params: ["i32", "i32"] },
  min:         { ret: "i32", params: ["i32", "i32"] },
  clamp:       { ret: "i32", params: ["i32", "i32", "i32"] },
  sign:        { ret: "i32", params: ["i32"] },

  pow:         { ret: "double", params: ["i32", "i32"] },
  sqrt:        { ret: "i32", params: ["i32"] },
  square:      { ret: "i32", params: ["i32"] },
  cube:        { ret: "i32", params: ["i32"] },

  // ===== ROUNDING =====
  floor:       { ret: "i32", params: ["double"] },
  ceil:        { ret: "i32", params: ["double"] },
  round:       { ret: "i32", params: ["double"] },
  toFixed:     { ret: "double", params: ["double", "i32"] },

  mod:         { ret: "i32", params: ["i32", "i32"] },

  // ===== NUMBER THEORY =====
  gcd:         { ret: "i32", params: ["i32", "i32"] },
  lcm:         { ret: "i32", params: ["i32", "i32"] },
  factorial:   { ret: "double", params: ["i32"] },
  isPrime:     { ret: "i1", params: ["i32"] },

  // ===== INTERPOLATION =====
  lerp:        { ret: "double", params: ["double", "double", "double"] },
  normalize:   { ret: "double", params: ["double", "double", "double"] },

  // ===== UTILITY =====
  between:     { ret: "i1", params: ["i32", "i32", "i32"] },

  // ===== STRING =====
  reverse:     { ret: "i8*", params: ["i8*"] },
  indexOf:     { ret: "i32", params: ["i8*", "i8*"] },
  slice:       { ret: "i8*", params: ["i8*", "i32", "i32"] },
  charAt:      { ret: "i8*", params: ["i8*", "i32"] },
  replace:     { ret: "i8*", params: ["i8*", "i8*", "i8*"] },
  contains:    { ret: "i1",  params: ["i8*", "i8*"] },
  upperCase:   { ret: "i8*", params: ["i8*"] },
  lowerCase:   { ret: "i8*", params: ["i8*"] },
  startsWith:  { ret: "i1",  params: ["i8*", "i8*"] },
  endsWith:    { ret: "i1",  params: ["i8*", "i8*"] },
  trim:        { ret: "i8*", params: ["i8*"] },
  splitAt:     { ret: "i8*", params: ["i8*", "i8*", "i32"] }
};

export { LLVM_TYPES_MAP, TYPES, SCALAR_TYPES, NON_SCALAR_TYPES, TokenTypes, KEYWORDS, BUILTIN_FUNCTIONS, ASSIGNMENT_OPS, ARITHMETIC_OPS, UNARY_OPS, COMPARISON_OPS, LOGICAL_OPS, OPERATORS, OP_CODES, LOOKUP, cmpMap, fcmpMap, VOID_BUILTIN_FUNCTIONS, NOT_STANDALONE_BUILTIN_FUNCTIONS, ParserTypes, FORMAT_MAP, RESERVED_KEYWORDS, ZEN_TYPES_MAP, GLOBAL_EXTERNAL, STD_FUNCTIONS, STDLIB }