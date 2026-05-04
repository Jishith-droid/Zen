export class Block {
  constructor(IRB, codegen) {
    this.IRB = IRB;
    this.codegen = codegen;
  }
  
  block(blockNode, globalScope) {
    
    if (!blockNode) return;
    
    // REAL BLOCK (even empty)
    if (blockNode.type === "BLOCK") {
      this.IRB.enterScope();
      
      for (const stmt of blockNode.body || []) {
        this.codegen.dispatch(stmt, globalScope);
      }
      
      this.IRB.exitScope();
      return;
    }
    
    // SINGLE STATEMENT
    this.IRB.enterScope();
    this.codegen.dispatch(blockNode, globalScope);
    this.IRB.exitScope();
  }
}