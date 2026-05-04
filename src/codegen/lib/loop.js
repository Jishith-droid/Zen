import { SCALAR_TYPES } from '/src/config/config.js';

export class Loop {
  constructor(IRB, expr, variable, block) {
    this.IRB = IRB;
    this.variable = variable;
    this.block = block;
    this.expr = expr;
  }
  
  loop(node) {
    
    const { init, condition, update } = node;
    
    this.IRB.enterScope();
    
    // ===== init =====
    if (SCALAR_TYPES.includes(init.dataType)) {
      this.variable.scalarVariable(init, false);
    } else {
      this.variable.stringVariable(init, false);
    }
    
    const condLabel = this.IRB.newLabel("loopCond");
    const bodyLabel = this.IRB.newLabel("loopBody");
    const endLabel = this.IRB.newLabel("loopEnd");
    const updateLabel = this.IRB.newLabel("loopUpdate");
    
    this.IRB.loopStack.push({
      breakLabel: endLabel,
      continueLabel: updateLabel
    });
    
    // jump to condition first
    this.IRB.emit(`br label %${condLabel}`);
    
    // ===== condition =====
    this.IRB.emit(`${condLabel}:`);
    
    const expr = this.expr.handleExpression(condition, false);
    
    if (expr.local?.length) this.IRB.emit(expr.local.join("\n"));
    if (expr.global?.length) this.IRB.globals.push(expr.global.join("\n"));
    
    const condPtr =
      expr.llvmType === "i1" ?
      expr.ptr :
      this.IRB.toI1(expr.ptr, expr.llvmType);
    
    this.IRB.emit(`br i1 ${condPtr}, label %${bodyLabel}, label %${endLabel}`);
    
    // ===== body =====
    this.IRB.emit(`${bodyLabel}:`);
    
    this.block.block(node.body, false);
    
    
    this.IRB.emit(`br label %${updateLabel}`);
    
    this.IRB.emit(`${updateLabel}:`);
    
    let updateExpr;
    
    if (update.type === "ASSIGNMENT") {
      const ptr = this.IRB.getVar(update.name).ptr;
      const type = this.IRB.getVar(update.name).type;
      
      updateExpr = this.expr.handleExpression(update.value, false);
      
      if (type !== updateExpr.type) {
        this.IRB.emitError("TypeError", `variable ${update.name} expect ${type} but got ${updateExpr.type}`);
      }
      if (updateExpr.local.length) this.IRB.emit(updateExpr.local.join("\n"));
      if (updateExpr.global.length) this.IRB.globals.push(updateExpr.global.join("\n"));
      this.IRB.emitStore(updateExpr.llvmType, updateExpr.ptr, ptr);
      
    } else {
      updateExpr = this.expr.handleExpression(update, false);
      if (updateExpr.local.length) this.IRB.emit(updateExpr.local.join("\n"));
      if (updateExpr.global.length) this.IRB.globals.push(updateExpr.global.join("\n"));
    }
    
    // loop back
    this.IRB.emit(`br label %${condLabel}`);
    
    
    // ===== end =====
    this.IRB.emit(`${endLabel}:`);
    
    this.IRB.loopStack.pop();
    this.IRB.exitScope();
  }
  
  handleBreak() {
    const loop = this.IRB.loopStack[this.IRB.loopStack.length - 1];
    
    if (!loop) {
      this.IRB.emitError("SyntaxError", "break used outside loop");
    }
    
    this.IRB.loopBlockTerminated = true;
    this.IRB.emit(`br label %${loop.breakLabel}`);
  }
  
  handleContinue() {
    const loop = this.IRB.loopStack[this.IRB.loopStack.length - 1];
    
    if (!loop) {
      this.IRB.emitError("SyntaxError", "continue used outside loop");
    }
    
    this.IRB.loopIterationSkipped = true;
    this.IRB.emit(`br label %${loop.continueLabel}`);
  }
  
  whileLoop(node) {
    
    const condition = node.condition;
    const body = node.body;
    
    this.IRB.enterScope();
    
    const condLabel = this.IRB.newLabel("whileCond");
    const bodyLabel = this.IRB.newLabel("whileBody");
    const endLabel = this.IRB.newLabel("whileEnd");
    
    this.IRB.loopStack.push({
      breakLabel: endLabel,
      continueLabel: condLabel
    });
    
    // jump to condition first
    this.IRB.emit(`br label %${condLabel}`);
    
    // ===== condition =====
    this.IRB.emit(`${condLabel}:`);
    
    const expr = this.expr.handleExpression(condition, false);
    
    if (expr.local?.length) this.IRB.emit(expr.local.join("\n"));
    if (expr.global?.length) this.IRB.globals.push(expr.global.join("\n"));
    
    const condPtr =
      expr.llvmType === "i1" ?
      expr.ptr :
      this.IRB.toI1(expr.ptr, expr.llvmType);
    
    this.IRB.emit(`br i1 ${condPtr}, label %${bodyLabel}, label %${endLabel}`);
    
    // ===== body =====
    this.IRB.emit(`${bodyLabel}:`);
    
    this.block.block(body, false);
    
    // loop back to condition 
    this.IRB.emit(`br label %${condLabel}`);
    
    // ===== end =====
    this.IRB.emit(`${endLabel}:`);
    
    this.IRB.loopStack.pop();
    this.IRB.exitScope();
  }
}