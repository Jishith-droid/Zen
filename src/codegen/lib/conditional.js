export class Conditional {
  constructor(IRB, expr, block) {
    this.IRB = IRB;
    this.expr = expr;
    this.block = block;
  }
  
  conditional(node) {
    
    const endLabel = this.IRB.newLabel("end");
    
    const chain = [
      { condition: node.if.condition, body: node.if.body },
      ...(node.elseIf || [])
    ];
    
    let falseLabel = null;
    
    for (let i = 0; i < chain.length; i++) {
      const { condition, body } = chain[i];
      
      if (i !== 0) {
        this.IRB.emit(`${falseLabel}:`);
      }
      
      // ===== condition =====
      const expr = this.expr.handleExpression(condition, false);
      
      if (expr.local?.length) this.IRB.emit(expr.local.join("\n"));
      if (expr.global?.length) {
        this.IRB.globals.push(expr.global.join("\n"));
      }
      
      const cond =
        expr.llvmType === "i1" ?
        expr.ptr :
        this.IRB.toI1(expr.ptr, expr.llvmType);
      
      const trueLabel = this.IRB.newLabel("if");
      
      falseLabel =
        i === chain.length - 1 ?
        (node.else ? this.IRB.newLabel("else") : endLabel) :
        this.IRB.newLabel("elseif");
      
      // ===== branch =====
      this.IRB.emit(`br i1 ${cond}, label %${trueLabel}, label %${falseLabel}`);
      
      // ===== true block =====
      this.IRB.emit(`${trueLabel}:`);
      
      this.block.block(body, false);
      
      this.IRB.emit(`br label %${endLabel}`);
    }
    
    // ===== else block =====
    if (node.else) {
      
      this.IRB.emit(`${falseLabel}:`);
      
      this.block.block(node.else?.body);
      
      this.IRB.emit(`br label %${endLabel}`);
    } else {
      
      if (chain.length > 0) {
        
        this.IRB.emit(`${falseLabel}:`);
      }
    }
    
    // ===== end =====
    const last = this.IRB.currentFunction ? this.IRB.currentFunction.body[this.IRB.currentFunction.body.length - 1] : this.IRB.locals[this.IRB.locals.length - 1];
    
    if (last !== `${endLabel}:`) {
      this.IRB.emit(`${endLabel}:`);
    }
    
  }
}