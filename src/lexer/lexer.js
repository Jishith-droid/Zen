import { TYPES, TokenTypes, KEYWORDS, BUILTIN_FUNCTIONS, OPERATORS, ASSIGNMENT_OPS, ARITHMETIC_OPS, UNARY_OPS, COMPARISON_OPS, LOGICAL_OPS } from '/src/config/config.js';

const SORTED_OPERATORS = [...OPERATORS]
  .sort((a, b) => b.length - a.length);

export class Lexer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.currentChar = this.source[this.pos] || null;
    this.tokens = [];
    this.line = 1;
    this.column = 0;
  }
  
  
  tokenize() {
    while (this.currentChar !== null) {
      
      if (this.currentChar === '\n') {
        this.tokens.push({
          type: TokenTypes.NEWLINE,
          value: "\n"
        });
        this.advance();
        continue;
      }
      
      if (this.currentChar === ' ' || this.currentChar === '\t' || this.currentChar === '\r') {
        this.advance();
        continue;
      }
      if (this.currentChar === "/" && this.peek() === "/") {
        this.skipComment();
        continue;
      }
      if (this.currentChar === "/" && this.peek() === "*") {
        this.skipMultiLineComment();
        continue;
      }
      // identifier
      if (/[a-zA-Z_]/.test(this.currentChar)) {
        const word = this.identifier();
        if (word === "true" || word === "false") {
          this.tokens.push({ type: TokenTypes.BOOLEAN, value: word === "true" });
        } else if (KEYWORDS.includes(word)) {
          this.tokens.push({ type: TokenTypes.KEYWORD, value: word });
        } else if (TYPES.includes(word)) {
          this.tokens.push({ type: TokenTypes.TYPE, value: word });
        } else {
          this.tokens.push({ type: TokenTypes.IDENTIFIER, value: word });
        }
        continue;
      }
      if (this.currentChar === ":") {
        this.tokens.push({
          type: TokenTypes.COLON,
          value: ":"
        });
        this.advance();
        continue;
      }
      if (this.currentChar === "[") {
        this.tokens.push({
          type: TokenTypes.LBRACKET,
          value: "["
        });
        this.advance();
        continue;
      }
      if (this.currentChar === "]") {
        this.tokens.push({
          type: TokenTypes.RBRACKET,
          value: "]"
        });
        this.advance();
        continue;
      }
      if (/\d/.test(this.currentChar)) {
        
        const num = this.number();
        
        this.tokens.push({
          type: num.isFloat ? TokenTypes.DOUBLE : TokenTypes.INT,
          value: num.value
        });
        
        continue;
      }
      // string
      if (this.currentChar === '"' || this.currentChar === "'") {
        this.tokens.push({ type: TokenTypes.STRING, value: this.string() });
        continue;
      }
      // operators
      let matched = false;
      
      for (const op of SORTED_OPERATORS) {
        if (this.source.startsWith(op, this.pos)) {
          
          let type;
          
          if (ASSIGNMENT_OPS.includes(op)) {
            type = "ASSIGNMENT";
          } else if (ARITHMETIC_OPS.includes(op)) {
            if (op === "+") type = "PLUS";
            else if (op === "-") type = "MINUS";
            else if (op === "*") type = "STAR";
            else if (op === "/") type = "SLASH";
            else if (op === "%") type = "MODULO";
          } else if (COMPARISON_OPS.includes(op)) {
            type = "COMPARISON";
          } else if (LOGICAL_OPS.includes(op)) {
            type = "LOGICAL";
          } else if (UNARY_OPS.includes(op)) {
            type = op === "!" ? "BANG" :
              op === "++" ? "PLUS_PLUS" :
              "MINUS_MINUS";
          }
          
          this.tokens.push({ type, value: op });
          
          this.pos += op.length;
          this.currentChar = this.source[this.pos] || null;
          matched = true;
          break;
        }
      }
      
      if (matched) continue;
      
      // parentheses and blocks 
      if (this.currentChar === "(") {
        this.tokens.push({ type: TokenTypes.LEFT_PARENTHESIS, value: "(" });
        this.advance();
        continue;
      }
      
      if (this.currentChar === ")") {
        this.tokens.push({ type: TokenTypes.RIGHT_PARENTHESIS, value: ")" });
        this.advance();
        continue;
      }
      if (this.currentChar === "{") {
        this.tokens.push({ type: TokenTypes.BLOCK_START, value: "{" });
        this.advance();
        continue;
      }
      
      if (this.currentChar === "}") {
        this.tokens.push({ type: TokenTypes.BLOCK_END, value: "}" });
        this.advance();
        continue;
      }
      
      // constant
      if (this.currentChar === "^") {
        this.tokens.push({ type: TokenTypes.CONSTANT, value: "^" });
        this.advance();
        continue;
      }
      // comma
      if (this.currentChar === ",") {
        this.tokens.push({ type: TokenTypes.COMMA, value: "," });
        this.advance();
        continue;
      }
      
      throw new Error(`Unexpected character: ${this.currentChar} at line ${this.line}, column ${this.column}`);
    }
    // EOF
    this.tokens.push({ type: TokenTypes.EOF, value: null });
    return this.tokens;
  }
  
  advance() {
    if (this.currentChar === '\n') {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }
    this.pos++;
    this.currentChar = this.source[this.pos] || null;
  }
  
  
  peek() {
    return this.source[this.pos + 1] || null;
  }
  
  skipComment() {
    while (this.currentChar !== null && this.currentChar !== '\n') {
      this.advance();
    }
    this.advance();
  }
  
  skipMultiLineComment() {
    this.advance();
    this.advance();
    while (this.currentChar !== null) {
      if (this.currentChar === '*' && this.peek() === '/') {
        this.advance();
        this.advance();
        return;
      }
      this.advance();
    }
    
    throw new Error("Unterminated multi-line comment");
  }
  identifier() {
    let result = '';
    while (this.currentChar !== null && /[a-zA-Z_0-9]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return result;
  }
  
  number() {
    let result = '';
    let hasDot = false;
    
    while (
      this.currentChar !== null &&
      (/\d/.test(this.currentChar) || this.currentChar === '.')
    ) {
      if (this.currentChar === '.') {
        if (hasDot) break;
        hasDot = true;
        result += '.';
        this.advance();
        continue;
      }
      
      result += this.currentChar;
      this.advance();
    }
    
    if (result.startsWith('.')) {
      result = '0' + result;
      hasDot = true;
    }
    
    return {
      value: hasDot ? parseFloat(result) : parseInt(result, 10),
      isFloat: hasDot
    };
  }
  
  string() {
    let result = '';
    const quoteType = this.currentChar;
    this.advance();
    
    while (this.currentChar !== null && this.currentChar !== quoteType) {
      if (this.currentChar === '\\') {
        this.advance();
        if (this.currentChar === 'n') result += '\n';
        else if (this.currentChar === 't') result += '\t';
        else if (this.currentChar === '\\') result += '\\';
        else if (this.currentChar === 'r') result += '\r';
        else if (this.currentChar === '"') result += '"';
        else if (this.currentChar === "'") result += "'";
        else result += this.currentChar;
      } else {
        result += this.currentChar;
      }
      this.advance();
    }
    
    if (this.currentChar === quoteType) {
      this.advance();
    } else {
      throw new Error('Unterminated string literal');
    }
    
    return result;
  }
  
}