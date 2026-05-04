import { LOGICAL_OPS, COMPARISON_OPS, OP_CODES, LOOKUP, cmpMap, fcmpMap } from '/src/config/config.js';

export class Expression {
  constructor(IRB, call) {
    this.IRB = IRB;
  }
  
  setCall(call) {
    this.call = call;
  }
  
  handleExpression(node, globalScope = true) { // default globalScope true
    
    const op = node.operator;
    let local = [];
    let global = [];
    
    // scalar types
    
    if (node.type === "int" || node.type === "double" || node.type === "bool") {
      let value = node.value;
      
      if (node.type === "double") {
        value = this.IRB.formatDouble(value);
      }
      
      if (node.type === "bool") {
        value = node.value ? 1 : 0;
      }
      
      return {
        ptr: value,
        type: node.type,
        llvmType: this.IRB.getLLVMType(node.type),
        local: [],
        global: [],
        endLabel: null,
        postOrPrefix: false,
        isVarRef: false
      };
    }
    
    // non scalar type
    
    if (node.type === "string") {
      const str = node.value;
      const data = this.IRB.newGlobalString(str);
      
      return {
        ptr: data.name,
        type: "string",
        llvmType: "i8*",
        length: data.length,
        local: data.local,
        global: data.global,
        endLabel: null,
        postOrPrefix: false,
        isVarRef: false
      };
    }
    
    // variable reference 
    
    if (node.type === "variable") {
      const data = this.IRB.getVar(node.name);
      
      // check its array so no need load. we can load in array access 
      const isArray = data?.isArray;
      let t;
      if (!isArray) {
        t = this.IRB.newTemp();
        this.IRB.emit(`${t} = load ${data.llvmType}, ${data.llvmType}* ${data.ptr}`);
      } else {
        t = data.ptr;
      }
      
      return {
        ptr: t,
        addr: data.ptr, // only for unary
        type: data.type,
        llvmType: data.llvmType,
        local: [],
        global: [],
        length: data.llvmType.startsWith("[") ? data.length : null, //only for length() calcultion for arrays
        endLabel: null,
        isVarRef: true, // for ++ -- ref only
        postOrPrefix: data.postOrPrefix,
        dimData: isArray ? data.dimensionsData : null // only for array access bound checking 
      };
    }
    
    if (node.type === "ARRAY") {
      this.IRB.emitError("SyntaxError", "array standalone literals not yet supported yet");
    }
    
    if (node.type === "ARRAY_ACCESS") {
      
      const buildAccess = (n) => {
        if (n.type !== "ARRAY_ACCESS") {
          return this.handleExpression(n);
        }
        
        const base = buildAccess(n.array);
        
        const index = this.handleExpression(n.index);
        
        if (index.local.length) local.push(index.local.join("\n"))
        
        const ptr = this.IRB.newTemp();
        
        // string index access
        if (base.type === "string" && base.llvmType === "i8*") {
          
          if (base.local.length) local.push(...base.local);
          if (base.global.length) global.push(...base.global);
          
          local.push(
            `${ptr} = getelementptr i8, i8* ${base.ptr ?? base.addr}, i32 ${index.ptr}`
          );
          
          const t = this.IRB.newTemp();
          local.push(`${t} = load i8, i8* ${ptr}`);
          this.IRB.declareOneTime("zen_char_to_string", "declare i8* @zen_char_to_string(i8)");
          const tem = this.IRB.newTemp();
          local.push(`${tem} = call i8* @zen_char_to_string(i8 ${t})`);
          
          return {
            addr: tem,
            ptr: tem,
            llvmType: "i8*",
            type: "string",
            internalType: "char", // only for internal use
            local: base.local || [],
            global: []
          };
        }
        
        local.push(
          `${ptr} = getelementptr ${base.llvmType}, ${base.llvmType}* ${base.addr}, i32 0, i32 ${index.ptr}`
        );
        
        const nextType = this.IRB.getElementType(base.llvmType);
        
        return {
          addr: ptr,
          llvmType: nextType,
          type: base.type,
          local: base.local || []
        };
      };
      
      const final = buildAccess(node);
      
      const val = this.IRB.newTemp();
      const isStringCharAccess = final.internalType === "char";
      
      if (!isStringCharAccess) {
        local.push(
          
          `${val} = load ${final.llvmType}, ${final.llvmType}* ${final.addr}`
        );
      }
      
      return {
        ptr: isStringCharAccess ? final.ptr : val,
        raw: final.addr,
        type: final.type,
        llvmType: final.llvmType,
        local,
        global: [],
        endLabel: null,
        postOrPrefix: false,
        isArray: true // for fn return error usage only
      };
    }
    
    if (node.type === "CALL") {
      return this.call.handleCall(node, true, globalScope);
    }
    
    if (node.type === "UNARY_EXPRESSION") {
      
      const val = this.handleExpression(node.argument, globalScope);
      
      const local = [...(val.local || [])];
      const global = [...(val.global || [])];
      
      const v = val.ptr;
      
      if (node.argument.type === "string") {
        this.IRB.emitError("TypeError", "unary operators cannot be applied to type 'string'");
      }
      
      /* =========================
         LOGICAL NOT (!)
      ========================= */
      if (node.operator === "!") {
        let isValue;
        let boolVal;
        
        if (val.type === "int") {
          const t = this.IRB.newTemp();
          local.push(`${t} = icmp ne i32 ${v}, 0`);
          boolVal = t;
        }
        
        else if (val.type === "double") {
          const t = this.IRB.newTemp();
          local.push(`${t} = fcmp one double ${v}, 0.0`);
          boolVal = t;
        }
        
        else if (val.type === "bool") {
          boolVal = v;
        }
        
        else {
          this.IRB.emitError("TypeError", `Cannot apply ! to ${val.type}`);
        }
        
        const res = this.IRB.newTemp();
        local.push(`${res} = xor i1 ${boolVal}, true`);
        
        return {
          ptr: res,
          type: "bool",
          llvmType: "i1",
          local,
          global,
          endLabel: null,
          postOrPrefix: false,
          isVarRef: false
        };
      }
      
      /* =========================
         NEGATION (-)
      ========================= */
      if (node.operator === "-") {
        
        const res = this.IRB.newTemp();
        
        if (val.type === "int") {
          local.push(`${res} = sub i32 0, ${v}`);
          return {
            ptr: res,
            type: "int",
            llvmType: "i32",
            local,
            global,
            postOrPrefix: false,
            endLabel: null,
            isVarRef: false
          };
        }
        
        if (val.type === "double") {
          local.push(`${res} = fsub double 0.0, ${v}`);
          return {
            ptr: res,
            type: "double",
            llvmType: "double",
            local,
            global,
            endLabel: null,
            postOrPrefix: false,
            isVarRef: false
          };
        }
        
        this.IRB.emitError("TypeError", `Cannot apply - to ${val.type}`);
      }
      
      /* ===============================
         Increment or Decrement postfix 
         or prefix unary
         ===============================*/
      
      if (node.operator === "++" || node.operator === "--") {
        
        const isInt = val.type === "int";
        const isDouble = val.type === "double";
        
        if (!isInt && !isDouble) {
          this.IRB.emitError(
            "TypeError",
            `expected numeric type (int or double), got ${val.type}`
          );
        }
        
        if (!val.isVarRef) {
          this.IRB.emitError(
            "ReferenceError",
            "invalid assignment target: expected variable reference"
          );
        }
        
        const llvmType = isDouble ? "double" : "i32";
        const op = node.operator === "++" ? "add" : "sub";
        const one = isDouble ? "1.0" : "1";
        
        //  get variable address
        const old = val.ptr;
        
        //  compute new value
        const newVal = this.IRB.newTemp();
        local.push(`${newVal} = ${isDouble ? "f" : ""}${op} ${llvmType} ${old}, ${one}`);
        
        local.push(`store ${val.llvmType} ${newVal}, ${val.llvmType}* ${val.addr}`);
        
        //  return based on prefix/postfix
        return {
          ptr: node.isPostfix ? old : newVal,
          newVal: newVal, // for reference 
          type: val.type,
          llvmType,
          local,
          global,
          isVarRef: false,
          endLabel: null,
          isPostfix: node.isPostfix,
          postOrPrefix: true
        };
      }
      
      this.IRB.emitError("TypeError", `Unsupported unary operator ${node.operator}`);
    }
    
    /* =========================
       RECURSIVE RESOLVE
    ========================= */
    const resolve = (n) => {
      
      if (n.type === "BINARY_EXPRESSION") {
        
        this.IRB.containsUnary(n)
        return this.handleExpression(n, globalScope);
      }
      
      if (n.type === "string") {
        return this.handleExpression(n, globalScope);
      }
      
      if (n.type === "ARRAY_ACCESS") {
        return this.handleExpression(n, globalScope);
      }
      
      if (n.type === "ARRAY") {
        return this.handleExpression(n, globalScope);
      }
      
      if (n.type === "CALL") {
        return this.call.handleCall(n, false, globalScope); // false : mark as not a statement not to push emit
      }
      
      /* ===== VARIABLE ===== */
      if (n.type === "variable") {
        return this.handleExpression(n, globalScope)
      }
      
      if (n.type === "UNARY_EXPRESSION") {
        this.IRB.containsUnary(n);
        return this.handleExpression(n);
      }
      
      if (n.type === "int" || n.type === "bool" || n.type === "double") {
        return this.handleExpression(n, globalScope)
      }
    };
    
    let lPtr = null;
    let rPtr = null;
    
    let lType = null;
    let rType = null;
    
    let lLLVMtype = null;
    let rLLVMtype = null;
    
    if (!LOGICAL_OPS.includes(op)) {
      let LNode = resolve(node.left);
      let RNode = resolve(node.right);
      
      lPtr = LNode.ptr;
      rPtr = RNode.ptr;
      
      lType = LNode.type;
      rType = RNode.type;
      
      lLLVMtype = LNode.llvmType;
      rLLVMtype = RNode.llvmType;
      // merge child IR first
      local.push(...LNode.local || [], ...RNode.local || []);
      global.push(...LNode.global || [], ...RNode.global || []);
      
    }
    
    /* =========================
       1. STRING CASE 
    ========================= */
    if (lType === "string" && rType === "string") {
      
      
      if (["-", "/", "*", "%"].includes(op)) {
        this.IRB.emitError(
          "TypeError",
          `invalid string operator '${op}', expected '+'`
        )
      }
      
      if (op === "+") {
        this.IRB.declareOneTime("str_concat", "declare i8* @str_concat(i8*, i8*)");
        
        const resultPtr = this.IRB.newTemp();
        
        /* ---------- CONCAT --------*/
        local.push(
          `${resultPtr} = call i8* @str_concat(i8* ${lPtr}, i8* ${rPtr})`
        );
        
        return {
          ptr: resultPtr,
          type: "string",
          llvmType: "i8*",
          local: local,
          global: global,
          endLabel: null,
          postOrPrefix: false
        };
      }
      
      
      if (COMPARISON_OPS.includes(op)) {
        
        this.IRB.declareOneTime(
          "str_cmp",
          "declare i32 @strcmp(i8*, i8*)"
        );
        
        const resultPtr = this.IRB.newTemp();
        
        const l = lPtr;
        const r = rPtr;
        
        const cmp = this.IRB.newTemp();
        local.push(
          `${cmp} = call i32 @strcmp(i8* ${l}, i8* ${r})`
        );
        
        // convert strcmp result → boolean
        const boolPtr = this.IRB.newTemp();
        
        if (op === "==") {
          local.push(`${boolPtr} = icmp eq i32 ${cmp}, 0`);
        }
        else if (op === "!=") {
          local.push(`${boolPtr} = icmp ne i32 ${cmp}, 0`);
        }
        else if (op === ">") {
          local.push(`${boolPtr} = icmp sgt i32 ${cmp}, 0`);
        }
        else if (op === "<") {
          local.push(`${boolPtr} = icmp slt i32 ${cmp}, 0`);
        }
        else if (op === ">=") {
          local.push(`${boolPtr} = icmp sge i32 ${cmp}, 0`);
        }
        else if (op === "<=") {
          local.push(`${boolPtr} = icmp sle i32 ${cmp}, 0`);
        }
        
        return {
          ptr: boolPtr,
          type: "bool",
          llvmType: "i1",
          local,
          global,
          postOrPrefix: false,
          endLabel: null
        };
      }
      
    } else if (
      (lType === "string" &&
        rType !== "string") ||
      (rType === "string" && lType !== "string")
    ) {
      this.IRB.emitError(
        "TypeError",
        `cannot apply '${op}' to ${lType} and ${rType}`
      );
    }
    
    /* =========================
       2. NORMALIZE (bool → int)
    ========================= */
    const normalize = (type, val) => {
      
      if (type === "bool") {
        const t = this.IRB.newTemp();
        local.push(`${t} = zext i1 ${val} to i32`);
        return { type: "int", llvmType: "i32", value: t };
      }
      
      if (type === "int") {
        return { type, llvmType: "i32", value: val };
      }
      
      if (type === "double") {
        return { type, llvmType: "double", value: val };
      }
    };
    
    const L = normalize(lType, lPtr);
    const R = normalize(rType, rPtr);
    
    if (LOGICAL_OPS.includes(op)) {
      
      const result = this.IRB.newTemp();
      
      const rhsLabel = this.IRB.newLabel("rhs");
      const skipLabel = this.IRB.newLabel("skip");
      const endLabel = this.IRB.newLabel("end");
      
      /* ========= LEFT ========= */
      const LNode = resolve(node.left);
      
      local.push(...LNode.local || []);
      global.push(...LNode.global || []);
      
      const toBool = (val, type) => {
        if (type === "bool") {
          const t = this.IRB.newTemp();
          local.push(`${t} = add i1 ${val}, 0`);
          return t;
        }
        
        const t = this.IRB.newTemp();
        
        if (type === "int") {
          local.push(`${t} = icmp ne i32 ${val}, 0`);
        }
        else if (type === "double") {
          local.push(`${t} = fcmp one double ${val}, 0.0`);
        }
        else if (type === "string") {
          const t0 = this.IRB.newTemp();
          local.push(`${t0} = load i8, i8* ${val}`);
          local.push(`${t} = icmp ne i8 ${t0}, 0`);
        }
        else {
          this.IRB.emitError("TypeError", `Cannot convert ${type} to bool`);
        }
        
        return t;
      };
      
      const lBool = toBool(LNode.ptr, LNode.type);
      
      /* ========= BRANCH ========= */
      if (op === "&&") {
        local.push(`br i1 ${lBool}, label %${rhsLabel}, label %${skipLabel}`);
      } else {
        local.push(`br i1 ${lBool}, label %${skipLabel}, label %${rhsLabel}`);
      }
      
      /* ========= RHS ========= */
      local.push(`${rhsLabel}:`);
      
      const RNode = resolve(node.right);
      
      local.push(...RNode.local || []);
      global.push(...RNode.global || []);
      
      const rBool = toBool(RNode.ptr, RNode.type);
      
      // IMPORTANT: RHS may end in another block (nested short circuit)
      const rIncomingBlock = RNode.endLabel || rhsLabel;
      
      local.push(`br label %${endLabel}`);
      
      /* ========= SKIP ========= */
      local.push(`${skipLabel}:`);
      local.push(`br label %${endLabel}`);
      
      /* ========= END ========= */
      local.push(`${endLabel}:`);
      
      const skipValue = op === "&&" ? "false" : "true";
      
      local.push(
        `${result} = phi i1 [ ${skipValue}, %${skipLabel} ], [ ${rBool}, %${rIncomingBlock} ]`
      );
      
      return {
        ptr: result,
        type: "bool",
        llvmType: "i1",
        local,
        global,
        postOrPrefix: false,
        endLabel: endLabel
      };
    }
    
    
    if (COMPARISON_OPS.includes(op)) {
      const result = this.IRB.newTemp();
      
      const isDouble = L.type === "double" || R.type === "double";
      
      const llvmOp = isDouble ?
        `fcmp ${fcmpMap[op]}` :
        `icmp ${cmpMap[op]}`;
      
      const type = isDouble ? "double" : "int";
      
      // type promotion in comparison 
      if (type === "double") {
        
        if (L.type === "int") {
          const t = this.IRB.newTemp();
          local.push(`${t} = sitofp i32 ${L.value} to double`);
          L.value = t;
        }
        
        if (R.type === "int") {
          const t = this.IRB.newTemp();
          local.push(`${t} = sitofp i32 ${R.value} to double`);
          R.value = t;
        }
      }
      
      local.push(
        `${result} = ${llvmOp} ${this.IRB.getLLVMType(type)} ${L.value}, ${R.value}`
      );
      
      
      return {
        ptr: result,
        type: "bool",
        llvmType: "i1",
        local: local,
        global: global,
        endLabel: null,
        postOrPrefix: false
      };
    }
    
    /* =========================
       3. TYPE PROMOTION
    ========================= */
    let resultType =
      LOOKUP[L.type] > LOOKUP[R.type] ?
      L.type :
      R.type;
    
    if (resultType === "double") {
      
      if (L.type === "int") {
        const t = this.IRB.newTemp();
        local.push(`${t} = sitofp i32 ${L.value} to double`);
        L.value = t;
      }
      
      if (R.type === "int") {
        const t = this.IRB.newTemp();
        local.push(`${t} = sitofp i32 ${R.value} to double`);
        R.value = t;
      }
    }
    
    const opcode = OP_CODES[resultType][op];
    
    if (!opcode) {
      this.IRB.emitError(
        "TypeError",
        `cannot apply '${op}' to ${leftType} and ${rightType}`
      );
    }
    
    const result = this.IRB.newTemp();
    
    local.push(
      `${result} = ${opcode} ${this.IRB.getLLVMType(resultType)} ${L.value}, ${R.value}`
    );
    
    return {
      ptr: result,
      type: resultType,
      llvmType: this.IRB.getLLVMType(resultType),
      local,
      global,
      endLabel: null,
      postOrPrefix: false
    };
  }
}