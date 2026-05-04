export class HandleFunction {
  constructor(IRB, expr, block) {
    this.IRB = IRB;
    this.block = block;
    this.expr = expr;
  }
  
  handleReturn(node) {
    
    if (this.IRB.currentFunction === null) {
      this.IRB.emitError("SemanticError", "return outside function");
    }
    
    const funcType = this.IRB.currentFunction.returnType;
    
    this.IRB.currentFunction.hasReturn = true;
    
    if (funcType === "void") {
      this.IRB.emit("ret void");
      return;
    }
    
    const expr = this.expr.handleExpression(node.value, false);
    
    if (expr.llvmType.startsWith("[")) {
      this.IRB.emitError(
        "SemanticError",
        `function ${this.IRB.currentFunction.name} cannot return array`)
      }
      
      // type check (minimal)
      if (expr.type !== funcType) {
        this.IRB.emitError("TypeError", `function ${this.IRB.currentFunction.name} expected ${funcType} but got ${expr.type}`);
      }
      
      if (expr.local?.length) {
        this.IRB.emit(expr.local.join("\n"));
      }
      
      if (expr.global?.length) {
        this.IRB.globals.push(expr);
      }
      
      this.IRB.emit(`ret ${expr.llvmType} ${expr.ptr}`);
    }
    
    handleFunction(node) {
      
      if (node.name === "main") {
        this.IRB.emitError(
          "ReservedFunctionError",
          "'main' is a reserved function name"
        );
      }
      
      if (this.IRB.currentFunction !== null) {
        this.IRB.emitError("SemanticError", "Nested functions are not supported");
      }
      
      const prevFunction = this.IRB.currentFunction;
      
      const name = node.name;
      const returnType = node.returnType;
      const llvmReturnType = returnType === "void" ?
        "void" :
        this.IRB.getLLVMType(returnType);
      
      const params = node.params;
      
      const { ir, params: paramData } = this.IRB.buildParams(params);
      
      this.IRB.currentFunction = {
        name,
        body: [],
        returnType,
        hasReturn: false
      };
      
      this.IRB.enterScope();
      
      this.IRB.emit(`define ${llvmReturnType} @${name} ${ir} {`);
      this.IRB.emit("entry:");
      
      for (const p of paramData) {
        const ptr = `%${p.name}.addr`;
        
        // alloca
        this.IRB.emitAlloca(p.llvmType, ptr);
        
        // store incoming param (p.temp)
        this.IRB.emitStore(p.llvmType, p.temp, ptr);
        
        // update symbol table
        this.IRB.setVar(p.name, this.IRB.createData({
          ptr: ptr,
          llvmType: p.llvmType,
          type: p.type,
          isConstant: false,
          isGlobal: false
        }));
      }
      
      this.block.block(node.body, false);
      
      if (!this.IRB.currentFunction.hasReturn) {
        if (returnType === "int") {
          this.IRB.emit("ret i32 0");
        } else if (returnType === "bool") {
          this.IRB.emit("ret i1 0");
        } else if (returnType === "double") {
          this.IRB.emit("ret double 0.0");
        } else if (returnType === "string") {
          this.IRB.emit("ret i8* null");
        } else {
          this.IRB.emit("ret void");
        }
      }
      
      this.IRB.emit("}");
      
      this.IRB.exitScope();
      
      this.IRB.globals.push(this.IRB.currentFunction.body.join("\n"));
      
      this.IRB.currentFunction = prevFunction;
    }
  }