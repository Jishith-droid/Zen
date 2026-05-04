import { NOT_STANDALONE_BUILTIN_FUNCTIONS } from '/src/config/config.js';

export class Call {
  constructor(IRB, expr, io, type, string, stdlib) {
    this.IRB = IRB;
    this.io = io;
    this.type = type;
    this.string = string;
    this.STDLIB = stdlib;
  }
  
  setExpression(expr) {
    this.expr = expr;
  }
  
  handleCall(node, asStatement = false, globalScope) {
    
    const name = node.name;
    
    if (node.isInbuilt) {
      if (asStatement) {
        if (NOT_STANDALONE_BUILTIN_FUNCTIONS.includes(name)) {
          this.IRB.emitError(
            "SemanticError",
            `Cannot use ${name}() in statement context`
          );
        }
      }
      
      // speacial case for input()
      if (name === "input") {
        this.IRB.emitError(
          "SemanticError",
          `Cannot use input() in statement context or binary expressions`
        );
      }
      
      // safe check stdlib doest required handleBuiltincall
       if (this.STDLIB.includes(name)) return;
       
      return this.handleBuiltInCall(node, globalScope);
      
    }
    
    const fn = this.IRB.getFunction(name);
    const args = [];
    let global = [];
    let local = [];
    
    for (const arg of node.args) {
      const val = this.expr.handleExpression(arg, false);
      
      if (val.type === "void") {
        this.IRB.emitError("TypeError", "void value used in expression");
      }
      
      if (val.global.length !== 0) {
        global.push(...val.global)
      }
      if (val.local.length !== 0) {
        local.push(...val.local);
      }
      
      args.push(val);
    }
    
    this.IRB.validateCallArgs(fn, args);
    
    const argStr = args
      .map(a => `${a.llvmType} ${a.ptr}`)
      .join(", ");
    
    if (fn.returnType === "void") {
      local.push(`call void @${node.name}(${argStr})`);
      
      if (asStatement) {
        this.IRB.emit(local.join("\n"));
        this.IRB.globals.push(global.join("\n"));
      }
      return {
        ptr: null,
        type: "void",
        llvmType: "void",
        local: asStatement === false ? local : [],
        global: asStatement === false ? global : [],
        endLabel: null,
        isVarRef: false,
        postOrPrefix: false
      };
      
    }
    
    const tmp = this.IRB.newTemp();
    
    local.push(
      `${tmp} = call ${this.IRB.getLLVMType(fn.returnType)} @${node.name}(${argStr})`
    );
    
    if (asStatement) {
      this.IRB.emit(local.join("\n"));
      this.IRB.globals.push(global.join("\n"));
    }
    
    return {
      ptr: tmp,
      type: fn.returnType,
      llvmType: this.IRB.getLLVMType(fn.returnType),
      local: asStatement === false ? local : [],
      global: asStatement === false ? global : [],
      endLabel: null,
      isVarRef: false,
      postOrPrefix: false
    };
  }
  
  
  // built in function routing
  
  handleBuiltInCall(node, globalScope) {
    
    let name = null;
    const type = node?.type;
    
    if (type === "VARIABLE_DECLARATION" || type === "VARIABLE_REFERENCE") {
      name = node.value.name;
    } else {
      name = node.name;
    }
    
    switch (name) {
      case 'screen':
        this.io.screen(node);
        break;
        
      case 'input':
        this.io.input(node, globalScope);
        break;
        
      case 'type':
        return this.type.type(node, globalScope);
        
      case 'Int':
        return this.type.Int(node, globalScope);
        
      case 'Double':
        return this.type.Double(node, globalScope);
        
      case 'Bool':
        return this.type.Bool(node, globalScope);
        
      case 'String':
        return this.type.StringCast(node, globalScope);
        
      case 'length':
        return this.string.length(node, globalScope);
        
      default:
        this.IRB.emitError("InternalError", `unknown inbuilt function ${name}`);
    }
  }
}