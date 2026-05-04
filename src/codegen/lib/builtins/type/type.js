export class Type {
  constructor(IRB, expr) {
    this.IRB = IRB;
    this.expr = expr;
  }
  
  type(node, globalScope) {
    
    const isVarDecl = node.type === "VARIABLE_DECLARATION";
    const isVarRef = node.type === "VARIABLE_REFERENCE";
    
    const args = isVarDecl || isVarRef ? node.value.args : node.args;
    
    if (args[0].length > 1) {
      this.IRB.emitError("ArgumentError", "Function type() accept exactly 1 argument");
    }
    
    const expr = this.expr.handleExpression(args[0]);
    
    const type = expr.llvmType.startsWith("[") ? `array<${expr.type}>` : expr.type;
    const str = this.IRB.newGlobalString(type);
    if (str.local.length) this.IRB.emit(str.local.join("\n"));
    
    if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
    if (expr.global.length) this.IRB.emit(expr.global.join("\n"));
    
    if (isVarDecl) {
      const name = node.name;
      const gName = this.IRB.newGlobalTemp();
      const lName = this.IRB.newTemp();
      const declaredType = node.dataType;
      const llvmType = this.IRB.getLLVMType(declaredType);
      const isConstant = node.isConstant;
      let ptr = null;
      
      if (declaredType !== "string") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got string`);
      }
      
      if (globalScope) {
        ptr = gName;
        this.IRB.globals.push(`${gName} = global i8* null`);
        
        this.IRB.emit(`store i8* ${str.name}, i8** ${gName}`);
      } else {
        ptr = lName;
        
        this.IRB.emitAlloca("i8*", lName);
        
        this.IRB.emit(`store i8* ${str.name}, i8** ${lName}`);
        
      }
      
      this.IRB.setVar(name, this.IRB.createData({
        ptr,
        llvmType,
        type: declaredType,
        isConstant,
        isGlobal: globalScope
      }));
      this.IRB.logSymbolTable();
    }
    
    if (isVarRef) {
      
      const data = this.IRB.getVar(node.name);
      const ptr = data.ptr;
      const llvmType = data.llvmType;
      const declaredType = data.type;
      
      if (declaredType !== "string") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got string`);
      }
      
      this.IRB.emit(`store ${llvmType} ${str.name}, ${llvmType} ${ptr}`);
    }
    
    return {
      ptr: str.name,
      type: "string",
      llvmType: "i8*",
      local: [],
      global: [],
      isGlobal: globalScope,
      isConstant: true,
      postOrPrefix: false
    }
  }
  
  Int(node, globalScope) {
    const isVarDecl = node.type === "VARIABLE_DECLARATION";
    const isVarRef = node.type === "VARIABLE_REFERENCE";
    
    const args = isVarDecl || isVarRef ? node.value.args : node.args;
    
    if (args[0].length > 1) {
      this.IRB.emitError("ArgumentError", "Function Int() accept exactly 1 argument");
    }
    
    const expr = this.expr.handleExpression(args[0]);
    
    if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
    if (expr.global.length) this.IRB.emit(expr.global.join("\n"));
    
    if (expr.llvmType.startsWith("[")) {
      this.IRB.emitError("TypeError", `Int() cannot cast array to int`);
    }
    const cast = this.IRB.castExpression(expr, "int");
    
    if (isVarDecl) {
      const name = node.name;
      const gName = this.IRB.newGlobalTemp();
      const lName = this.IRB.newTemp();
      const declaredType = node.dataType;
      const llvmType = this.IRB.getLLVMType(declaredType);
      const isConstant = node.isConstant;
      let ptr = null;
      
      if (declaredType !== "int") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got int`);
      }
      
      if (globalScope) {
        ptr = gName;
        this.IRB.globals.push(`${gName} = global i32 0`);
        
        this.IRB.emit(`store i32 ${cast.ptr}, i32* ${gName}`);
      } else {
        ptr = lName;
        
        this.IRB.emitAlloca("i32", lName);
        
        this.IRB.emit(`store i32 ${cast.ptr}, i32* ${lName}`);
        
      }
      
      this.IRB.setVar(name, this.IRB.createData({
        ptr,
        llvmType,
        type: declaredType,
        isConstant,
        isGlobal: globalScope
      }));
      this.IRB.logSymbolTable();
    }
    
    if (isVarRef) {
      
      const data = this.IRB.getVar(node.name);
      const ptr = data.ptr;
      const llvmType = data.llvmType;
      const declaredType = data.type;
      
      if (declaredType !== "int") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got int`);
      }
      
      this.IRB.emit(`store ${llvmType} ${cast.ptr}, ${llvmType}* ${ptr}`);
    }
    
    return {
      ptr: cast.ptr,
      type: "int",
      llvmType: "i32",
      local: [],
      global: [],
      isGlobal: globalScope,
      isConstant: true,
      postOrPrefix: false
    }
  }
  
  Double(node, globalScope) {
    const isVarDecl = node.type === "VARIABLE_DECLARATION";
    const isVarRef = node.type === "VARIABLE_REFERENCE";
    
    const args = isVarDecl || isVarRef ? node.value.args : node.args;
    
    if (args[0].length > 1) {
      this.IRB.emitError("ArgumentError", "Function Double() accept exactly 1 argument");
    }
    
    const expr = this.expr.handleExpression(args[0]);
    if (expr.llvmType.startsWith("[")) {
      this.IRB.emitError("TypeError", `Double() cannot cast array to double`);
    }
    if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
    if (expr.global.length) this.IRB.emit(expr.global.join("\n"));
    
    const cast = this.IRB.castExpression(expr, "double");
    
    if (isVarDecl) {
      const name = node.name;
      const gName = this.IRB.newGlobalTemp();
      const lName = this.IRB.newTemp();
      const declaredType = node.dataType;
      const llvmType = this.IRB.getLLVMType(declaredType);
      const isConstant = node.isConstant;
      let ptr = null;
      
      if (declaredType !== "double") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got double`);
      }
      
      if (globalScope) {
        ptr = gName;
        this.IRB.globals.push(`${gName} = global double 0.0`);
        
        this.IRB.emit(`store double ${cast.ptr}, double* ${gName}`);
      } else {
        ptr = lName;
        
        this.IRB.emitAlloca("double", lName);
        
        this.IRB.emit(`store double ${cast.ptr}, double* ${lName}`);
        
      }
      
      this.IRB.setVar(name, this.IRB.createData({
        ptr,
        llvmType,
        type: declaredType,
        isConstant,
        isGlobal: globalScope
      }));
      this.IRB.logSymbolTable();
    }
    
    if (isVarRef) {
      
      const data = this.IRB.getVar(node.name);
      const ptr = data.ptr;
      const llvmType = data.llvmType;
      const declaredType = data.type;
      
      if (declaredType !== "double") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got double`);
      }
      
      this.IRB.emit(`store ${llvmType} ${cast.ptr}, ${llvmType}* ${ptr}`);
    }
    
    return {
      ptr: cast.ptr,
      type: "double",
      llvmType: "double",
      local: [],
      global: [],
      isGlobal: globalScope,
      isConstant: true,
      postOrPrefix: false
    }
  }
  
  Bool(node, globalScope) {
    const isVarDecl = node.type === "VARIABLE_DECLARATION";
    const isVarRef = node.type === "VARIABLE_REFERENCE";
    
    const args = isVarDecl || isVarRef ? node.value.args : node.args;
    
    if (args[0].length > 1) {
      this.IRB.emitError("ArgumentError", "Function Bool() accept exactly 1 argument");
    }
    
    const expr = this.expr.handleExpression(args[0]);
    if (expr.llvmType.startsWith("[")) {
      this.IRB.emitError("TypeError", `Bo() cannot cast array to bool`);
    }
    if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
    if (expr.global.length) this.IRB.emit(expr.global.join("\n"));
    
    const cast = this.IRB.castExpression(expr, "bool");
    
    if (isVarDecl) {
      const name = node.name;
      const gName = this.IRB.newGlobalTemp();
      const lName = this.IRB.newTemp();
      const declaredType = node.dataType;
      const llvmType = this.IRB.getLLVMType(declaredType);
      const isConstant = node.isConstant;
      let ptr = null;
      
      if (declaredType !== "bool") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got bool`);
      }
      
      if (globalScope) {
        ptr = gName;
        this.IRB.globals.push(`${gName} = global i1 0`);
        
        this.IRB.emit(`store i1 ${cast.ptr}, i1* ${gName}`);
      } else {
        ptr = lName;
        
        this.IRB.emitAlloca("i1", lName);
        
        this.IRB.emit(`store i1 ${cast.ptr}, i1* ${lName}`);
        
      }
      
      this.IRB.setVar(name, this.IRB.createData({
        ptr,
        llvmType,
        type: declaredType,
        isConstant,
        isGlobal: globalScope
      }));
      this.IRB.logSymbolTable();
    }
    
    if (isVarRef) {
      
      const data = this.IRB.getVar(node.name);
      const ptr = data.ptr;
      const llvmType = data.llvmType;
      const declaredType = data.type;
      
      if (declaredType !== "bool") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got bool`);
      }
      
      this.IRB.emit(`store ${llvmType} ${cast.ptr}, ${llvmType}* ${ptr}`);
    }
    
    return {
      ptr: cast.ptr,
      type: "bool",
      llvmType: "i1",
      local: [],
      global: [],
      isGlobal: globalScope,
      isConstant: true,
      postOrPrefix: false
    }
  }
  
  StringCast(node, globalScope) {
    const isVarDecl = node.type === "VARIABLE_DECLARATION";
    const isVarRef = node.type === "VARIABLE_REFERENCE";
    
    const args = isVarDecl || isVarRef ? node.value.args : node.args;
    
    if (args[0].length > 1) {
      this.IRB.emitError("ArgumentError", "Function Bool() accept exactly 1 argument");
    }
    
    const expr = this.expr.handleExpression(args[0]);
    if (expr.llvmType.startsWith("[")) {
      this.IRB.emitError("TypeError", `String() cannot cast array to string`);
    }
    if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
    if (expr.global.length) this.IRB.emit(expr.global.join("\n"));
    
    const cast = this.IRB.castExpression(expr, "string");
    
    if (isVarDecl) {
      const name = node.name;
      const gName = this.IRB.newGlobalTemp();
      const lName = this.IRB.newTemp();
      const declaredType = node.dataType;
      const llvmType = this.IRB.getLLVMType(declaredType);
      const isConstant = node.isConstant;
      let ptr = null;
      
      if (declaredType !== "string") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got string`);
      }
      
      if (globalScope) {
        ptr = gName;
        this.IRB.globals.push(`${gName} = global i8* null`);
        
        this.IRB.emit(`store i8* ${cast.ptr}, i8** ${gName}`);
      } else {
        ptr = lName;
        
        this.IRB.emitAlloca("i8*", lName);
        
        this.IRB.emit(`store i8* ${cast.ptr}, i8** ${lName}`);
        
      }
      
      this.IRB.setVar(name, this.IRB.createData({
        ptr,
        llvmType,
        type: declaredType,
        isConstant,
        isGlobal: globalScope
      }));
      this.IRB.logSymbolTable();
    }
    
    if (isVarRef) {
      
      const data = this.IRB.getVar(node.name);
      const ptr = data.ptr;
      const llvmType = data.llvmType;
      const declaredType = data.type;
      
      if (declaredType !== "string") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got string`);
      }
      
      this.IRB.emit(`store ${llvmType} ${cast.ptr}, ${llvmType}* ${ptr}`);
    }
    
    return {
      ptr: cast.ptr,
      type: "string",
      llvmType: "i8*",
      local: [],
      global: [],
      isGlobal: globalScope,
      isConstant: true,
      postOrPrefix: false
    }
  }
}