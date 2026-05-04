import { LLVM_TYPES_MAP, ZEN_TYPES_MAP, STD_FUNCTIONS } from '/src/config/config.js';

export class IRBuilder {
  constructor() {
    this.globals = [];
    this.locals = [];
    
    this.currentFunction = null;
    this.functions = new Map();
    
    this.loopStack = [];
    this.loopBlockTerminated = false;
    this.loopIterationSkipped = false;
    
    this.DEBUG_IR = true; // debug mode
    
    this.formatMap = this.formatMap || new Map(); // format for screen() 
    
    this.tempCount = 0; // main counter
    this.labelCount = 0;
    this.strCount = 0;
    
    this.builtins = new Map();
    this.symbolTable = [new Map()];
  }
  
  setCall(expr) {
    this.expr = expr;
  }
  
  // templates
  emitAlloca(type, name) {
    this.emit(`${name} = alloca ${type}`);
  }
  
  emitStore(type, value, ptr) {
    this.emit(`store ${type} ${value}, ${type}* ${ptr}`);
  }
  
  emitLoad(type, ptr) {
    const t = this.newTemp();
    this.emit(`${t} = load ${type}, ${type}* ${ptr}`);
    return t;
  }
  
  setFunction(name, data) {
    if (this.functions.has(name)) {
      this.emitError("referenceError", `function ${name} is already defined`)
    }
    this.functions.set(name, data);
  }
  
  getFunction(name) {
    if (this.functions.has(name)) {
      return this.functions.get(name);
    }
    
    this.emitError("ReferenceError", `Function ${name} is not defined`);
  }
  
  utf8LenWithNull(str) {
    let bytes = 0;
    
    for (const ch of str) {
      const code = ch.codePointAt(0);
      
      if (code <= 0x7F) {
        bytes += 1;
      } else if (code <= 0x7FF) {
        bytes += 2;
      } else if (code <= 0xFFFF) {
        bytes += 3;
      } else {
        bytes += 4;
      }
    }
    
    return bytes + 1;
  }
  
  logSymbolTable() {
    console.log(this.symbolTable);
  }
  
  getSymbolTable() {
    return this.symbolTable;
  }
  
  declareOneTime(name, fn) {
    if (this.builtins.has(name)) {
      return;
    }
    
    this.builtins.set(name, fn);
    
    this.globals.push(fn);
  }
  
  emit(line) {
    const target =
      this.currentFunction ? this.currentFunction.body :
      this.locals;
    
    // debug flag
    if (this.DEBUG_IR) {
      if (target[target.length - 1] === line) {
        console.warn("Duplicate IR:", line);
      }
    }
    
    target.push(line);
  }
  
  getLLVMType(type) {
    return LLVM_TYPES_MAP[type];
  }
  
  revertType(type) {
    return ZEN_TYPES_MAP[type];
  }
  
  getIR() {
    return [
      ...this.globals,
      ...this.locals
    ].join("\n");
  }
  
  newTemp() {
    return `%t${this.tempCount++}`;
  }
  
  newGlobalTemp() {
    return `@t${this.tempCount++}`;
  }
  
  strTemp() {
    return `@.str${this.strCount++}`;
  }
  
  newLabel(name = "label") {
    return `${name}${this.labelCount++}`;
  }
  
  formatDouble(value) {
    const num = Number(value);
    
    // ensure decimal format
    return Number.isInteger(num) ? num.toFixed(1) : num.toString();
  }
  
  createData({
    ptr,
    llvmType,
    type,
    length,
    isConstant,
    isGlobal,
    isValue,
    kind,
    postOrPrefix,
    isArray,
    dimensionsData,
    dimensions
  }) {
    return {
      ptr,
      llvmType,
      type,
      length,
      isConstant,
      isGlobal,
      isValue,
      kind,
      postOrPrefix,
      isArray,
      dimensionsData,
      dimensions
    };
  }
  
  initialValue(type) {
    return type === "int" || type === "bool" ?
      "0" :
      type === "double" ?
      "0.0" :
      type === "string" ?
      "null" :
      "";
  }
  
  checkType(declaredType, type) {
    if (declaredType !== type) {
      this.emitError("TypeError", `expected ${declaredType} but got ${type}`);
    }
  }
  
  // ===== SCOPES =====
  setVar(name, data) {
    const current = this.symbolTable[this.symbolTable.length - 1];
    current.set(name, data);
  }
  
  getVar(name) {
    for (let i = this.symbolTable.length - 1; i >= 0; i--) {
      if (this.symbolTable[i].has(name)) {
        return this.symbolTable[i].get(name);
      }
    }
    this.emitError("ReferenceError", `${name} is not defined`);
  }
  
  enterScope() {
    this.symbolTable.push(new Map());
  }
  
  exitScope() {
    this.symbolTable.pop();
  }
  
  hasVar(name) {
    for (let i = this.symbolTable.length - 1; i >= 0; i--) {
      if (this.symbolTable[i].has(name)) {
        return true;
      }
    }
    return false;
  }
  
  isDeclaredInCurrentScope(name) {
    return this.symbolTable[this.symbolTable.length - 1].has(name);
  }
  
  loadVar(name) {
    const v = this.getVar(name);
    const tmp = this.newTemp();
    
    this.emit(
      `${tmp} = load ${v.llvmType}, ${v.llvmType}* ${v.ptr}`
    );
    
    return tmp;
  }
  
  toBoolString(ptr) {
    const len = this.newTemp();
    const cmp = this.newTemp();
    
    this.declareOneTime("strlen", "declare i64 @strlen(i8*)");
    
    this.emit(`${len} = call i64 @strlen(i8* ${ptr})`);
    this.emit(`${cmp} = icmp ne i64 ${len}, 0`);
    
    return cmp;
  }
  
  toI1(ptr, type) {
    
    if (type === "i1") return ptr;
    
    const tmp = this.newTemp();
    
    switch (type) {
      case "i32":
      case "int":
        this.emit(`${tmp} = icmp ne i32 ${ptr}, 0`);
        return tmp;
        
      case "double":
        this.emit(`${tmp} = fcmp une double ${ptr}, 0.0`);
        return tmp;
        
      case "i8*":
      case "string":
        return this.toBoolString(ptr)
        
      default:
        this.emit(`${tmp} = icmp ne i32 ${ptr}, 0`);
        return tmp;
    }
  }
  
  emitError(type, error) {
    throw new Error(`[Zen Error] ${type}: ${error}`);
  }
  
  formatValue(value, type) {
    if (type === "double") {
      return value === 0 ? "0.0" : String(value);
    }
    
    return String(value);
  }
  
  buildParams(params) {
    const paramStr = [];
    const paramData = [];
    
    for (const p of params) {
      const llvmType = this.getLLVMType(p.type);
      const temp = this.newTemp(); // %t1
      
      paramStr.push(`${llvmType} ${temp}`);
      
      paramData.push({
        name: p.name, // original name (a, b)
        temp, // %t1 (incoming value)
        llvmType: llvmType,
        type: p.type,
        ptr: null
      });
    }
    
    return {
      ir: `(${paramStr.join(", ")})`,
      params: paramData
    };
  }
  
  getGlobalStringPtr(str) {
    const name = this.strTemp();
    const len = this.utf8LenWithNull(str);
    
    // create global string
    this.globals.push(
      `${name} = private unnamed_addr constant [${len} x i8] c"${str}\\00"`
    );
    
    // return constant GEP (no temp!)
    return `getelementptr inbounds ([${len} x i8], [${len} x i8]* ${name}, i32 0, i32 0)`;
  }
  
  newGlobalString(str) {
    let local = []
    
    const name = this.strTemp();
    const len = this.utf8LenWithNull(str)
    
    this.globals.push(
      `${name} = private unnamed_addr constant [${len} x i8] c"${str}\\00"`
    );
    
    const tmp = this.newTemp();
    
    local.push(
      `${tmp} = getelementptr inbounds [${len} x i8], [${len} x i8]* ${name}, i32 0, i32 0`
    );
    
    return {
      name: tmp,
      local: local,
      global: []
    }
  }
  
  validateCallArgs(fn, args) {
    
    const params = fn.params;
    
    if (params.length !== args.length) {
      this.emitError(
        "TypeError",
        `${fn.name}() → expected ${params.length} arguments but got ${args.length}`
      );
    }
    
    for (let i = 0; i < params.length; i++) {
      const expected = params[i].type;
      const actual = args[i].type; // ✅ now real type
      
      if (expected !== actual) {
        this.emitError(
          "TypeError",
          `${fn.name}() → expected ${expected} but got ${actual}`
        );
      }
    }
  }
  
  emitScreenInt(val) {
    this.declareOneTime("fmt_int", '@.fmt_int = private constant [4 x i8] c"%d\\0A\\00"');
    
    this.declareOneTime("screen_int", `define void @screen_int(i32 %x) {
entry:
  call i32 (i8*, ...) @printf(
    i8* getelementptr ([4 x i8], [4 x i8]* @.fmt_int, i32 0, i32 0),
    i32 %x
  )
  call i32 @fflush(i8* null)
  ret void
}`);
    
    this.emit(`call void @screen_int(i32 ${val})`);
  }
  
  emitScreenDouble(val) {
    this.declareOneTime("fmt_double", '@.fmt_double = private constant [5 x i8] c"%lf\\0A\\00"');
    
    this.declareOneTime("screen_double", `define void @screen_double(double %x) {
entry:
  call i32 (i8*, ...) @printf(
    i8* getelementptr ([5 x i8], [5 x i8]* @.fmt_double, i32 0, i32 0),
    double %x
  )
  call i32 @fflush(i8* null)
  ret void
}`);
    
    this.emit(`call void @screen_double(double ${val})`);
  }
  
  toLLVMString(str) { // for screen string format 
    
    let result = "";
    let len = 0;
    
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      
      if (c === '\n') {
        result += "\\0A";
        len += 1;
      } else if (c === '\t') {
        result += "\\09";
        len += 1;
      } else if (c === '\\') {
        result += "\\5C";
        len += 1;
      } else if (c === '"') {
        result += "\\22";
        len += 1;
      } else {
        result += c;
        len += 1;
      }
    }
    
    result += "\\00"; // null terminator
    len += 1;
    
    return { llvmStr: result, length: len };
  }
  
  emitScreenString(val, format) {
    this.formatMap = this.formatMap || new Map();
    
    let id;
    
    if (this.formatMap.has(format)) {
      id = this.formatMap.get(format);
    } else {
      id = this.formatMap.size;
      this.formatMap.set(format, id);
      
      const { llvmStr, length } = this.toLLVMString(format);
      
      const fmtName = `fmt_string_${id}`;
      const fnName = `screen_string_${id}`;
      
      this.declareOneTime(
        fmtName,
        `@.${fmtName} = private constant [${length} x i8] c"${llvmStr}"`
      );
      
      this.declareOneTime(
        fnName,
        `define void @${fnName}(i8* %x) {
entry:
  call i32 (i8*, ...) @printf(
    i8* getelementptr ([${length} x i8], [${length} x i8]* @.${fmtName}, i32 0, i32 0),
    i8* %x
  )
  call i32 @fflush(i8* null)
  ret void
}`
      );
    }
    
    const fnName = `screen_string_${id}`;
    
    this.emit(`call void @${fnName}(i8* ${val})`);
  }
  
  emitScreenBool(val) {
    this.declareOneTime("fmt_bool_t", '@.fmt_bool_t = private constant [6 x i8] c"true\\0A\\00"');
    this.declareOneTime("fmt_bool_f", '@.fmt_bool_f = private constant [7 x i8] c"false\\0A\\00"');
    
    this.declareOneTime("screen_bool", `define void @screen_bool(i1 %b) {
entry:
  br i1 %b, label %true, label %false

true:
  call i32 (i8*, ...) @printf(
    i8* getelementptr ([6 x i8], [6 x i8]* @.fmt_bool_t, i32 0, i32 0)
  )
  call i32 @fflush(i8* null)
  br label %end

false:
  call i32 (i8*, ...) @printf(
    i8* getelementptr ([7 x i8], [7 x i8]* @.fmt_bool_f, i32 0, i32 0)
  )
  call i32 @fflush(i8* null)
  br label %end

end:
  ret void
}`);
    
    this.emit(`call void @screen_bool(i1 ${val})`);
  }
  
  containsUnary(node) {
    if (!node) return false;
    
    if (
      node.type === "UNARY_EXPRESSION" &&
      (node.operator === "++" || node.operator === "--")
    ) {
      this.emitError("SyntaxError",
        "++ and -- are only allowed as assignments or standalone statements");
    }
    
    return (
      this.containsUnary(node.left) ||
      this.containsUnary(node.right) ||
      this.containsUnary(node.argument)
    );
  }
  
  normalizeNode(node) {
    
    // CASE 1: Variable Declaration
    if (node.type === "VARIABLE_DECLARATION") return node;
    
    // CASE 2: Assignment wrapped in VARIABLE_REFERENCE
    if (node.type === "VARIABLE_REFERENCE") {
      const expr = node.expression;
      const data = this.getVar(expr.name);
      
      return {
        type: "VARIABLE_REFERENCE",
        operation: "assign",
        dataType: data.type,
        isConstant: data.isConstant,
        name: expr.name,
        value: expr.value
      };
    }
    
    return node;
  }
  
  // array helpwers 
  
  validateArrayType(type, node, expectedZenType, path = []) {
    
    // ---------- LEAF ----------
    if (node.type !== "ARRAY") {
      
      const res = this.expr.handleExpression(node);
      const actualType = res.type;
      
      if (actualType !== expectedZenType) {
        this.emitError(
          "TypeError",
          `Type mismatch at index [${path.map(i => `[${i}]`).join("")}]: expected ${expectedZenType}, got ${actualType}`
        );
      }
      
      return;
    }
    
    // ---------- ARRAY ----------
    const match = type.match(/^\[(\d+) x (.*)\]$/);
    if (!match) this.emitError("Syntax Error", "Invalid array type");
    
    const size = parseInt(match[1]);
    const innerType = match[2];
    
    if (node.elements.length !== size) {
      this.emitError("Array size mismatch",
        `Array size mismatch at index [${path.map(i => `[${i}]`).join("")}]: expected ${size}, got ${node.elements.length}`
      );
    }
    
    node.elements.forEach((el, i) =>
      this.validateArrayType(innerType, el, expectedZenType, [...path, i])
    );
  }
  
  buildArrayType(baseType, dims) {
    let type = baseType;
    
    for (let i = dims.length - 1; i >= 0; i--) {
      type = `[${dims[i]} x ${type}]`;
    }
    
    return {
      full: type,
      base: baseType
    };
  }
  
  buildGlobalInit(type, node, baseType, zenType, isTop = false) {
    // ---------- LEAF ----------
    if (node.type !== "ARRAY") {
      
      if (node.type !== zenType) {
        this.emitError("TypeError", "Global array initializer must be constant");
      }
      
      if (zenType === "bool") {
        return `${baseType} ${node.value ? 1 : 0}`;
      }
      
      if (zenType === "string") {
        const gep = this.getGlobalStringPtr(node.value);
        return `i8* ${gep}`;
      }
      
      return `${baseType} ${node.value}`;
    }
    
    // ---------- ARRAY ----------
    const match = type.match(/^\[(\d+) x (.*)\]$/);
    const innerType = match[2];
    
    const elements = node.elements.map(el =>
      this.buildGlobalInit(innerType, el, baseType, zenType, false)
    );
    
    const body = `[${elements.join(", ")}]`;
    
    return isTop ? body : `${type} ${body}`;
  }
  
  validateArray(dimensions, node, depth = 0) {
    if (depth >= dimensions.length) return;
    
    if (node.type !== "ARRAY") {
      this.emitError("SyntaxError", "Invalid array structure");
    }
    
    const expected = dimensions[depth].value;
    
    if (node.elements.length !== expected) {
      this.emitError("Array size mismatch",
        `Array size mismatch at dimension ${depth}: expected ${expected}, got ${node.elements.length}`
      );
    }
    
    node.elements.forEach(el =>
      this.validateArray(dimensions, el, depth + 1)
    );
  }
  
  flattenArray(node, indices = [], out = []) {
    if (node.type !== "ARRAY") {
      out.push({ indices, node });
      return out;
    }
    
    node.elements.forEach((el, i) => {
      this.flattenArray(el, [...indices, i], out);
    });
    
    return out;
  }
  
  arrayInit(dimensions, value, isGlobal, baseType = "i32", zenType = "int", isConstant) {
    
    const dims = dimensions.map(d => d.value);
    
    if (dims[0] === 0) {
      this.emitError("SemanticError", "Array dimension cannot be zero");
    }
    
    const { full: arrayType, base: elementType } =
    this.buildArrayType(baseType, dims);
    const elementSize = this.getTypeSize(zenType);
    const length = value.elements.length;
    if (value && value.elements.length > 0) {
      this.validateArrayType(arrayType, value, zenType);
      this.validateArray(dimensions, value);
    }
    
    // ---------------- GLOBAL ----------------
    if (isGlobal) {
      const ptr = this.newGlobalTemp();
      
      if (!value || value.elements.length === 0) {
        
        return {
          ir: [`${ptr} = ${isConstant ? "constant" : "global"} ${arrayType} zeroinitializer`],
          ptr,
          llvmType: arrayType,
          length
        }
      }
      
      const init = this.buildGlobalInit(arrayType, value, baseType, zenType, true);
      return {
        ir: [`${ptr} = ${isConstant ? "constant" : "global"} ${arrayType} ${init}`],
        ptr,
        llvmType: arrayType,
        length
      }
    }
    
    // ---------------- LOCAL ----------------
    let ir = [];
    const ptr = this.newTemp();
    
    ir.push(`${ptr} = alloca ${arrayType}`);
    
    // zero init
    if (!value || value.elements.length === 0) {
      const totalSize = dims.reduce((a, b) => a * b, 1) * elementSize;
      
      const cast = this.newTemp();
      
      ir.push(
        `${cast} = bitcast ${arrayType}* ${ptr} to i8*`
      );
      
      ir.push(
        `call void @llvm.memset.p0i8.i64(i8* ${cast}, i8 0, i64 ${totalSize}, i1 false)`
      );
      
      return { ir, ptr, llvmType: arrayType, length };
    }
    
    const flat = this.flattenArray(value);
    
    flat.forEach((item) => {
      const gep = this.newTemp();
      
      const indices = ["i32 0", ...item.indices.map(i => `i32 ${i}`)].join(", ");
      
      ir.push(
        `${gep} = getelementptr ${arrayType}, ${arrayType}* ${ptr}, ${indices}`
      );
      
      // evaluate each element here
      const res = this.expr.handleExpression(item.node);
      
      if (res.local.length) ir.push(...res.local);
      if (res.global.length) ir.push(...res.global);
      
      ir.push(
        `store ${res.llvmType} ${res.ptr}, ${res.llvmType}* ${gep}`
      );
    });
    
    return { ir, ptr, llvmType: arrayType, length };
  }
  
  getTypeSize(type) {
    switch (type) {
      case "int":
        return 4;
      case "double":
        return 8;
      case "bool":
        return 1;
      case "string":
        return 8; // pointer size (64-bit)
      default:
        this.emitError("Internal Error", "Unknown type " + type);
    }
  }
  
  getElementType(typeStr) {
    
    // remove pointer layer
    if (typeStr.endsWith("*")) {
      return typeStr.slice(0, -1);
    }
    
    // array layer
    const match = typeStr.match(/^\[(\d+)\s+x\s+(.+)\]$/);
    if (match) {
      return match[2].trim();
    }
    
    return typeStr;
  }
  
  castExpression(expr, targetType) {
    if (expr.type === targetType) {
      return expr;
    }
    
    const t = this.newTemp(); // ONLY SSA name
    
    // ---------------------------
    // INT → BOOL
    // ---------------------------
    if (expr.type === "int" && targetType === "bool") {
      this.emit(`${t} = icmp ne i32 ${expr.ptr}, 0`);
      
      return {
        ptr: t,
        llvmType: "i1",
        type: "bool"
      };
    }
    
    // ---------------------------
    // BOOL → INT
    // ---------------------------
    if (expr.type === "bool" && targetType === "int") {
      this.emit(`${t} = zext i1 ${expr.ptr} to i32`);
      
      return {
        ptr: t,
        llvmType: "i32",
        type: "int"
      };
    }
    
    // ---------------------------
    // INT → DOUBLE
    // ---------------------------
    if (expr.type === "int" && targetType === "double") {
      this.emit(`${t} = sitofp i32 ${expr.ptr} to double`);
      
      return {
        ptr: t,
        llvmType: "double",
        type: "double"
      };
    }
    
    // ---------------------------
    // DOUBLE → INT
    // ---------------------------
    if (expr.type === "double" && targetType === "int") {
      this.emit(`${t} = fptosi double ${expr.ptr} to i32`);
      
      return {
        ptr: t,
        llvmType: "i32",
        type: "int"
      };
    }
    
    // ---------------------------
    // BOOL → DOUBLE
    // ---------------------------
    if (expr.type === "bool" && targetType === "double") {
      const intTemp = this.newTemp();
      
      // step 1: bool → int
      this.emit(`${intTemp} = zext i1 ${expr.ptr} to i32`);
      
      // step 2: int → double
      this.emit(`${t} = sitofp i32 ${intTemp} to double`);
      
      return {
        ptr: t,
        llvmType: "double",
        type: "double"
      };
    }
    
    // ---------------------------
    // DOUBLE → BOOL
    // ---------------------------
    if (expr.type === "double" && targetType === "bool") {
      const t = this.newTemp();
      
      this.emit(`${t} = fcmp une double ${expr.ptr}, 0.0`);
      
      return {
        ptr: t,
        llvmType: "i1",
        type: "bool"
      };
    }
    
    // ---------------------------
    // INT → STRING
    // ---------------------------
    if (expr.type === "int" && targetType === "string") {
      this.declareOneTime("int_to_string", "declare i8* @int_to_string(i32)");
      
      this.emit(`${t} = call i8* @int_to_string(i32 ${expr.ptr})`);
      
      return {
        ptr: t,
        llvmType: "i8*",
        type: "string"
      };
    }
    
    // ---------------------------
    // DOUBLE → STRING
    // ---------------------------
    if (expr.type === "double" && targetType === "string") {
      this.declareOneTime("double_to_string", "declare i8* @double_to_string(double)");
      
      this.emit(`${t} = call i8* @double_to_string(double ${expr.ptr})`);
      
      return {
        ptr: t,
        llvmType: "i8*",
        type: "string"
      };
    }
    
    // ---------------------------
    // BOOL → STRING
    // ---------------------------
    if (expr.type === "bool" && targetType === "string") {
      this.declareOneTime("bool_to_string", "declare i8* @bool_to_string(i1)");
      this.emit(`${t} = call i8* @bool_to_string(i1 ${expr.ptr})`);
      
      return {
        ptr: t,
        llvmType: "i8*",
        type: "string"
      };
    }
    
    // ---------------------------
    // STRING → INT
    // ---------------------------
    if (expr.type === "string" && targetType === "int") {
      this.declareOneTime("string_to_int", "declare i32 @string_to_int(i8*)");
      
      this.emit(`${t} = call i32 @string_to_int(i8* ${expr.ptr})`);
      
      return {
        ptr: t,
        llvmType: "i32",
        type: "int"
      };
    }
    
    // ---------------------------
    // STRING → DOUBLE
    // ---------------------------
    if (expr.type === "string" && targetType === "double") {
      this.declareOneTime("string_to_double", "declare double @string_to_double(i8*)");
      
      this.emit(`${t} = call double @string_to_double(i8* ${expr.ptr})`);
      
      return {
        ptr: t,
        llvmType: "double",
        type: "double"
      };
    }
    
    // ---------------------------
    // STRING → BOOL
    // ---------------------------
    if (expr.type === "string" && targetType === "bool") {
      const len = this.newTemp();
      const res = this.newTemp();
      this.declareOneTime("strlen", "declare i64 @strlen(i8*)");
      
      this.emit(`${len} = call i64 @strlen(i8* ${expr.ptr})`);
      this.emit(`${res} = icmp ne i64 ${len}, 0`);
      
      return {
        ptr: res,
        llvmType: "i1",
        type: "bool"
      };
    }
    
    throw new Error(
      `Zen TypeError: cannot cast ${expr.type} → ${targetType}`
    );
  }
  
  loadGlobalConstants() {
    
    const g = this.symbolTable[0]; // global scope
    
    // ─── Mathematical Constants ───────────────────────────────
    g.set("PI", this.createData({
      ptr: "@PI",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("TAU", this.createData({
      ptr: "@TAU",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("E", this.createData({
      ptr: "@E",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("PHI", this.createData({
      ptr: "@PHI",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("SQRT2", this.createData({
      ptr: "@SQRT2",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("LN2", this.createData({
      ptr: "@LN2",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("LN10", this.createData({
      ptr: "@LN10",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    
    // ─── Integer Limits ───────────────────────────────────────
    
    g.set("I32_MAX", this.createData({
      ptr: "@I32_MAX",
      llvmType: "i32",
      type: "int",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("I32_MIN", this.createData({
      ptr: "@I32_MIN",
      llvmType: "i32",
      type: "int",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    
    // ─── Floating Point Limits ────────────────────────────────
    
    g.set("F64_MAX", this.createData({
      ptr: "@F64_MAX",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("F64_MIN", this.createData({
      ptr: "@F64_MIN",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("F64_EPS", this.createData({
      ptr: "@F64_EPS",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    
    // ─── Special Float Values ─────────────────────────────────
    
    g.set("INF", this.createData({
      ptr: "@INF",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("NEG_INF", this.createData({
      ptr: "@NEG_INF",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
    
    g.set("NAN", this.createData({
      ptr: "@NAN",
      llvmType: "double",
      type: "double",
      isConstant: true,
      isGlobal: true,
      kind: "external"
    }));
  }
  
  setStdlibFunctions() {

  for (const [name, fn] of Object.entries(STD_FUNCTIONS)) {

    const params = fn.params.map((type, i) => ({
      type: this.revertType(type),
      name: `p${i}`   // dummy param names
    }));

    const data = {
      name,
      returnType: this.revertType(fn.ret),
      params
    };

    this.setFunction(name, data);
  }
}
  
}