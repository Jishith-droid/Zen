export class ZenString {
  constructor(IRB, expr) {
    this.IRB = IRB;
    this.expr = expr;
  }
  
  length(node, globalScope) {
    
    const isVarDecl = node.type === "VARIABLE_DECLARATION";
    const isVarRef = node.type === "VARIABLE_REFERENCE";
    
    const args = isVarDecl || isVarRef ? node.value.args : node.args;
    
    if (args[0].length > 1) {
      this.IRB.emitError("ArgumentError", "Function type() accept exactly 1 argument");
    }
    
    const expr = this.expr.handleExpression(args[0]);
    
    const isArray = expr.llvmType.startsWith("[");
    const isString = expr.type === "string";
    
    if (!isString && !isArray) {
      this.IRB.emitError(
        "TypeError",
        "The length() function expects a string or array argument."
      );
    }
    console.log(expr)
    
    if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
    if (expr.global.length) this.IRB.emit(expr.global.join("\n"));
    
    this.IRB.declareOneTime("strlen", "declare i32 @strlen(i8*)");
    
    let finalPtr = null;
    
    if (isVarDecl) {
      const name = node.name;
      const gName = this.IRB.newGlobalTemp();
      const lName = this.IRB.newTemp();
      const declaredType = node.dataType;
      const llvmType = this.IRB.getLLVMType(declaredType);
      const isConstant = node.isConstant;
      
      if (declaredType !== "int") {
        this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got int`);
      }
      
      if (globalScope) {
        
        this.IRB.globals.push(`${gName} = global i32 0`);
        
        if (!isArray) {
          const t = this.IRB.newTemp();
          this.IRB.emit(`${t} = call i32 @strlen(i8* ${expr.ptr})`);
          
          this.IRB.emit(`store i32 ${t}, i32* ${gName}`);
        } else {
          this.IRB.emit(`store i32 ${expr.length}, i32* ${gName}`);
        }
        
        finalPtr = gName;
      } else {
        
        this.IRB.emitAlloca("i32", lName);
        if (!isArray) {
          const t = this.IRB.newTemp();
          this.IRB.emit(`${t} = call i32 @strlen(i8* ${expr.ptr})`);
          this.IRB.emit(`store i32 ${t}, i32* ${lName}`);
        } else {
          this.IRB.emit(`store i32 ${expr.length}, i32* ${lName}`);
        }
        finalPtr = lName;
        
      }
      
      this.IRB.setVar(name, this.IRB.createData({
        ptr: finalPtr,
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
      if (!isArray) {
        const t = this.IRB.newTemp();
        this.IRB.emit(`${t} = call i32 @strlen(i8* ${expr.ptr})`);
        this.IRB.emit(`store i32 ${t}, i32* ${expr.ptr}`);
        finalPtr = expr.ptr;
        //this.IRB.emit(`store ${llvmType} ${t}, ${llvmType}* ${expr.ptr}`);
      } else {
        this.IRB.emit(`store i32 ${expr.length}, i32* ${expr.ptr}`);
      }
    }
    
    return {
      ptr: finalPtr,
      type: "int",
      llvmType: "i32",
      local: [],
      global: [],
      isGlobal: globalScope,
      isConstant: true,
      postOrPrefix: false
    }
    
  }
}