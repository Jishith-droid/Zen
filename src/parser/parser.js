import { ParserTypes, BUILTIN_FUNCTIONS } from '/src/config/config.js';

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  
  // =========================
  // HELPERS
  // =========================
  
  current() {
    return this.tokens[this.pos];
  }
  
  advance() {
    return this.tokens[this.pos++];
  }
  
  match(type) {
    return this.current()?.type === type;
  }
  
  expect(type) {
    if (!this.match(type)) {
      throw new Error(`[Zen Error] parser: Expected ${type}, got ${this.current()?.type}`);
    }
    return this.advance();
  }
  
  skipNewlines() {
    while (this.match("NEWLINE")) {
      this.advance();
    }
  }
  
  matchKeyword(value) {
    return this.current()?.type === "KEYWORD" &&
      this.current()?.value === value;
  }
  
  expectKeyword(value) {
    if (!this.matchKeyword(value)) {
      throw new Error(`[Zen Error] parser: Expected keyword ${value}, got ${this.current()?.value}`);
    }
    return this.advance();
  }
  
  peek(type) {
    return this.tokens[this.pos + 1]?.type === type;
  }
  
  // =========================
  // ENTRY
  // =========================
  parse() {
    const body = [];
    
    while (this.current() && !this.match("EOF")) {
      
      //  SKIP EMPTY LINES
      if (this.match("NEWLINE")) {
        this.advance();
        continue;
      }
      
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      
      //  consume statement separator
      if (this.match("NEWLINE")) {
        this.advance();
      }
    }
    
    return body;
  }
  // =========================
  // STATEMENTS (IMPORTANT FIX)
  // =========================
  parseStatement() {
    if (this.match("TYPE")) {
      return this.parseVariableDeclaration();
    }
    
    if (this.match("BLOCK_END")) return null;
    
    if (this.matchKeyword("return")) {
      this.advance();
      
      if (
        this.match("NEWLINE") ||
        this.match("BLOCK_END") ||
        this.match("EOF")
      ) {
        return null;
      }
      const value = this.parseExpression();
      
      return {
        type: ParserTypes.RETURN,
        value
      };
    }
    
    if (this.matchKeyword("fn")) {
      return this.parseFunction();
    }
    
    if (this.matchKeyword("while")) {
      return this.parseWhileLoop();
    }
    
    if (this.matchKeyword("break")) {
      this.expectKeyword("break");
      return { type: ParserTypes.BREAK };
    }
    
    if (this.match("IDENTIFIER") && this.peek("LEFT_PARENTHESIS")) {
      const name = this.current().value;
      this.advance();
      return this.parseCall(name);
    }
    
    if (this.matchKeyword("continue")) {
      this.expectKeyword("continue");
      return { type: ParserTypes.CONTINUE };
    }
    
    if (this.matchKeyword("loop")) {
      return this.parseLoop();
    }
    
    
    if (this.match("BLOCK_START")) {
      return this.parseBlock();
    }
    
    if (this.matchKeyword("if")) {
      return this.parseConditional();
    }
    
    if (this.match("LBRACKET")) {
      return this.parseExpression(); // returns ARRAY_LITERAL
    }
    
    const expr = this.parseExpression();
    
    return {
      type: ParserTypes.VARIABLE_REFERENCE,
      expression: expr
    };
  }
  
  parseWhileLoop() {
    this.expectKeyword("while");
    
    this.expect("LEFT_PARENTHESIS");
    const condition = this.parseExpression();
    this.expect("RIGHT_PARENTHESIS");
    
    let body;
    if (this.match("BLOCK_START")) {
      body = this.parseBlock();
    } else {
      body = this.parseStatement();
    }
    
    return {
      type: ParserTypes.WHILE,
      condition,
      body
    };
  }
  
  parseFunction() {
    this.expectKeyword("fn");
    
    const name = this.expect("IDENTIFIER").value;
    
    this.expect("LEFT_PARENTHESIS");
    
    const params = [];
    
    while (!this.match("RIGHT_PARENTHESIS")) {
      
      const type = this.expect("TYPE").value;
      
      const name = this.expect("IDENTIFIER").value;
      
      let param = { type, name };
      
      if (this.match("ASSIGNMENT")) {
        this.advance();
        param.default = this.parseExpression();
      }
      
      params.push(param);
      
      if (this.match("COMMA")) this.advance();
    }
    
    this.expect("RIGHT_PARENTHESIS");
    
    const returnType = this.matchKeyword("void") ? this.expectKeyword("void").value : this.expect("TYPE").value;
    
    const body = this.parseBlock();
    
    return {
      type: ParserTypes.FUNCTION_DECLARATION,
      name,
      params,
      returnType,
      body
    };
  }
  
  parseLoop() {
    this.expectKeyword("loop");
    
    this.expect("LEFT_PARENTHESIS");
    
    // INIT
    let init;
    if (this.match("TYPE")) {
      init = this.parseVariableDeclaration();
    } else {
      init = this.parseExpression();
    }
    
    this.expect("COMMA");
    
    // CONDITION
    const condition = this.parseExpression();
    
    this.expect("COMMA");
    
    // UPDATE
    let update;
    if (
      this.match("IDENTIFIER") && ["PLUS_PLUS", "MINUS_MINUS"].includes(this.tokens[this.pos + 1]?.type)
    ) {
      const name = this.expect("IDENTIFIER").value;
      
      const opToken = this.advance();
      console.log(opToken)
      
      update = {
        type: ParserTypes.UNARY_EXPRESSION,
        operator: opToken.value,
        argument: {
          type: ParserTypes.VARIABLE,
          name
        }
      };
    } else {
      update = this.parseExpression();
    }
    this.expect("RIGHT_PARENTHESIS");
    
    // BODY
    let body;
    if (this.match("BLOCK_START")) {
      body = this.parseBlock();
    } else {
      body = this.parseStatement();
    }
    
    return {
      type: ParserTypes.LOOP,
      init,
      condition,
      update,
      body
    };
  }
  
  parseConditional() {
    this.expectKeyword("if");
    
    this.expect("LEFT_PARENTHESIS");
    const ifCondition = this.parseExpression();
    this.expect("RIGHT_PARENTHESIS");
    
    const ifBody = this.match("BLOCK_START") ?
      this.parseBlock() :
      this.parseStatement();
    
    const elseIf = [];
    let elseBody = null;
    
    this.skipNewlines();
    
    while (this.matchKeyword("else")) {
      this.expectKeyword("else");
      
      this.skipNewlines();
      
      if (this.matchKeyword("if")) {
        this.expectKeyword("if");
        
        this.expect("LEFT_PARENTHESIS");
        const condition = this.parseExpression();
        this.expect("RIGHT_PARENTHESIS");
        
        const body = this.match("BLOCK_START") ?
          this.parseBlock() :
          this.parseStatement();
        
        elseIf.push({
          condition,
          body
        });
        
      } else {
        // final else
        elseBody = this.match("BLOCK_START") ?
          this.parseBlock() :
          this.parseStatement();
        break;
      }
      
      this.skipNewlines();
    }
    
    return {
      type: "CONDITIONAL",
      if: {
        condition: ifCondition,
        body: ifBody
      },
      elseIf,
      else: elseBody ? { body: elseBody } : null
    };
  }
  
  parseBlock() {
    this.expect("BLOCK_START");
    
    const body = [];
    
    while (!this.match("BLOCK_END") && this.current()) {
      
      if (this.match("NEWLINE")) {
        this.advance();
        continue;
      }
      
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      
      if (this.match("NEWLINE")) {
        this.advance();
      }
    }
    
    this.expect("BLOCK_END");
    
    return {
      type: ParserTypes.BLOCK,
      body
    };
  }
  
  parseVariableDeclaration() {
    const dataType = this.advance().value;
    
    let isConst = false;
    if (this.match("KEYWORD")) {
      const keyVal = this.expect("KEYWORD").value;
      if (keyVal === "const") isConst = true;
    }
    
    const name = this.expect("IDENTIFIER").value;
    
    // ARRAY DIMENSIONS
    const dimensions = [];
    
    while (this.match("LBRACKET")) {
      this.advance();
      
      const dim = this.parseExpression();
      
      if (dim.type !== ParserTypes.INT) {
        throw new Error("[Zen Error] TypeError: array dimension must be int");
      }
      
      dimensions.push(dim);
      
      this.expect("RBRACKET");
    }
    
    let value = null;
    
    if (this.match("ASSIGNMENT")) {
      this.advance();
      value = this.parseExpression();
    }
    
    return {
      type: ParserTypes.VARIABLE_DECLARATION,
      dataType,
      isArray: dimensions.length > 0,
      isConstant: isConst,
      name,
      dimensions,
      value
    };
  }
  
  // =========================
  // EXPRESSIONS
  // =========================
  
  parseExpression() {
    this.unaryDepth = 0;
    return this.parseAssignment();
  }
  
  // =========================
  // ASSIGNMENT (=, +=, etc)
  // =========================
  parseAssignment() {
    let expr = this.parseLogical(); // CHANGE HERE
    
    if (this.match("ASSIGNMENT")) {
      const op = this.advance().value;
      const value = this.parseAssignment();
      
      if (expr.type === ParserTypes.ARRAY_ACCESS) {
        return {
          type: ParserTypes.ARRAY_ACCESS,
          array: expr.array,
          index: expr.index,
          operator: op,
          value
        };
      }
      
      if (expr.type === ParserTypes.VARIABLE) {
        return {
          type: ParserTypes.ASSIGNMENT,
          name: expr.name,
          operator: op,
          value
        };
      }
    }
    
    return expr;
    
  }
  
  parseLogical() {
    let expr = this.parseEquality();
    
    while (this.match("LOGICAL")) {
      const op = this.advance().value;
      const right = this.parseEquality();
      
      expr = {
        type: ParserTypes.BINARY_EXPRESSION,
        left: expr,
        operator: op,
        right
      };
    }
    
    return expr;
  }
  
  // =========================
  // COMPARISON
  // =========================
  parseEquality() {
    let expr = this.parseComparison();
    
    while (this.match("EQUALITY")) {
      const op = this.advance().value;
      const right = this.parseComparison();
      
      expr = {
        type: ParserTypes.BINARY_EXPRESSION,
        left: expr,
        operator: op,
        right
      };
    }
    
    return expr;
  }
  
  parseComparison() {
    let expr = this.parseTerm();
    
    while (this.match("COMPARISON")) {
      const op = this.advance().value;
      const right = this.parseTerm();
      
      expr = {
        type: ParserTypes.BINARY_EXPRESSION,
        left: expr,
        operator: op,
        right
      };
    }
    
    return expr;
  }
  
  // =========================
  // + -
  // =========================
  parseTerm() {
    let expr = this.parseFactor();
    
    while (this.match("PLUS") || this.match("MINUS")) {
      const op = this.advance().value;
      const right = this.parseFactor();
      
      expr = {
        type: ParserTypes.BINARY_EXPRESSION,
        left: expr,
        operator: op,
        right
      };
    }
    
    return expr;
  }
  
  
  
  
  // =========================
  // * / %
  // =========================
  parseFactor() {
    let expr = this.parseUnary();
    
    while (
      this.match("STAR") ||
      this.match("SLASH") ||
      this.match("MODULO")
    ) {
      const op = this.advance().value;
      const right = this.parseUnary();
      
      expr = {
        type: ParserTypes.BINARY_EXPRESSION,
        left: expr,
        operator: op,
        right
      };
    }
    
    return expr;
  }
  
  
  parseUnary() {
    if (
      this.match("MINUS") ||
      this.match("BANG") ||
      this.match("PLUS_PLUS") ||
      this.match("MINUS_MINUS")
    ) {
      const op = this.advance().value;
      const argument = this.parseUnary();
      
      return {
        type: ParserTypes.UNARY_EXPRESSION,
        operator: op,
        argument,
        isPostfix: false
      };
    }
    
    return this.parsePostfix();
  }
  
  parsePostfix() {
    let expr = this.parsePrimary();
    
    while (true) {
      
      // ARRAY ACCESS 
      if (this.match("LBRACKET")) {
        this.advance();
        
        const index = this.parseExpression();
        
        this.expect("RBRACKET");
        
        expr = {
          type: ParserTypes.ARRAY_ACCESS,
          array: expr,
          index
        };
        
        continue;
      }
      
      // existing postfix ++ --
      if (this.match("PLUS_PLUS") || this.match("MINUS_MINUS")) {
        const op = this.advance().value;
        
        expr = {
          type: ParserTypes.UNARY_EXPRESSION,
          operator: op,
          argument: expr,
          isPostfix: true
        };
        
        continue;
      }
      
      break;
    }
    
    return expr;
  }
  
  parseArrayLiteral() {
    this.expect("LBRACKET");
    
    const elements = [];
    
    this.skipNewlines(); //  important
    
    while (!this.match("RBRACKET")) {
      
      elements.push(this.parseExpression());
      
      this.skipNewlines(); // after element
      
      if (this.match("COMMA")) {
        this.advance();
        this.skipNewlines(); // after comma
      } else {
        break;
      }
    }
    
    this.expect("RBRACKET");
    
    return {
      type: ParserTypes.ARRAY,
      elements
    };
  }
  
  // =========================
  // PRIMARY (VALUES)
  // =========================
  parsePrimary() {
    const token = this.current();
    
    // NUMBER
    if (token.type === "int") {
      this.advance();
      return {
        type: ParserTypes.INT,
        value: token.value
      };
    }
    
    // DOUBLE
    if (token.type === "double") {
      this.advance();
      return {
        type: ParserTypes.DOUBLE,
        value: token.value
      };
    }
    
    // STRING
    if (token.type === "string") {
      this.advance();
      return {
        type: ParserTypes.STRING,
        value: token.value
      };
    }
    
    // BOOLEAN
    if (token.type === "bool") {
      this.advance();
      return {
        type: ParserTypes.BOOLEAN,
        value: token.value === true ? 1 : 0
      };
    }
    
    // VARIABLE
    if (token.type === "IDENTIFIER") {
      this.advance();
      
      // function call
      if (this.match("LEFT_PARENTHESIS")) {
        return this.parseCall(token.value);
      }
      
      return {
        type: ParserTypes.VARIABLE,
        name: token.value
      };
    }
    
    if (this.match("LBRACKET")) {
      return this.parseArrayLiteral();
    }
    
    // GROUPING ( )
    if (this.match("LEFT_PARENTHESIS")) {
      this.advance();
      const expr = this.parseExpression();
      this.expect("RIGHT_PARENTHESIS");
      return expr;
    }
    
    throw new Error("Unexpected token: " + JSON.stringify(token));
  }
  
  // =========================
  // FUNCTION CALL
  // =========================
  parseCall(name) {
    this.expect("LEFT_PARENTHESIS");
    
    const args = [];
    
    while (!this.match("RIGHT_PARENTHESIS")) {
      args.push(this.parseExpression());
      
      if (this.match("COMMA")) {
        this.advance();
      } else {
        break;
      }
    }
    
    this.expect("RIGHT_PARENTHESIS");
    
    return {
      isInbuilt: BUILTIN_FUNCTIONS.includes(name),
      type: ParserTypes.CALL,
      name,
      args
    };
  }
}