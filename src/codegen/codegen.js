import { IRBuilder } from './helper/helper.js';
import { Conditional } from '/src/codegen/lib/conditional.js';
import { Block } from '/src/codegen/lib/block.js';
import { Variable } from './lib/variable.js';
import { Loop } from './lib/loop.js';
import { HandleFunction } from './lib/function.js';
import { Call } from './lib/call.js';
import { Expression } from './lib/expression.js';
import { Type } from './lib/builtins/type/type.js';
import { IO } from './lib/builtins/io/io.js';
import { ZenString } from './lib/builtins/string/string.js';

import { SCALAR_TYPES, VOID_BUILTIN_FUNCTIONS, GLOBAL_EXTERNAL, STD_FUNCTIONS, BUILTIN_FUNCTIONS, STDLIB } from '/src/config/config.js';

export class CodeGen {
  constructor(ast) {
    this.ast = ast;
    this.IRB = new IRBuilder();
    this.expr = new Expression(this.IRB);
    
    this.IRB.setCall(this.expr);
    
    this.io = new IO(this.IRB, this.expr);
    this.type = new Type(this.IRB, this.expr);
    this.string = new ZenString(this.IRB, this.expr);
    this.call = new Call(this.IRB, this.expr, this.io, this.type, this.string, STDLIB);
    
    this.expr.setCall(this.call);
    this.call.setExpression(this.expr);
    
    this.block = new Block(this.IRB, this);
    this.conditional = new Conditional(this.IRB, this.expr, this.block);
    this.fn = new HandleFunction(this.IRB, this.expr, this.block);
    this.variable = new Variable(this.IRB, this.expr, this.call);
    this.loop = new Loop(this.IRB, this.expr, this.variable, this.block);
  }
  
  // main entry
  generateLLVM() {
    
    this.IRB.loadGlobalConstants();
    
    this.IRB.emit("define void @main() { \nentry:\n");
    
    // insert stdlib functions
    this.IRB.setStdlibFunctions();
    
    // function hoisting 
    
    for (const node of this.ast) {
      if (node.type === "FUNCTION_DECLARATION") {
        
        const stdlibSet = new Set(STDLIB);
        
        if (stdlibSet.has(node.name)) {
          this.IRB.emitError(
            "ReservedFunctionError",
            `${node.name} is a reserved function name`
          );
        }
        
        const returnType = node.returnType === "void" ?
          "void" :
          node.returnType;
        
        const data = { name: node.name, returnType, params: node.params }
        
        this.IRB.setFunction(node.name, data);
        console.log(this.IRB.functions)
      }
    }
    
    for (const node of this.ast) this.dispatch(node);
    
    this.IRB.emit("ret void \n}");
    
    for (const [name, type] of Object.entries(GLOBAL_EXTERNAL)) {
      this.IRB.globals.unshift(`@${name} = external constant ${type}`);
    }
    
    for (const [name, fn] of Object.entries(STD_FUNCTIONS)) {
      const params = fn.params.join(", ");
      this.IRB.globals.unshift(
        `declare ${fn.ret} @${name}(${params})`
      );
    }
    
    return this.IRB.getIR();
  }
  
  dispatch(node, globalScope = true) {
    const type = node.type;
    
    switch (type) {
      case 'VARIABLE_DECLARATION':
        this.handleVariable(node, globalScope);
        break;
        
      case 'VARIABLE_REFERENCE':
        this.handleVariableRef(node);
        break;
        
      case 'CONDITIONAL':
        this.conditional.conditional(node);
        break;
        
      case 'LOOP':
        this.loop.loop(node);
        break;
        
      case 'WHILE_LOOP':
        this.loop.whileLoop(node);
        break;
        
      case 'RETURN':
        this.fn.handleReturn(node);
        break;
        
      case 'BREAK':
        this.loop.handleBreak();
        break;
        
      case 'CONTINUE':
        this.loop.handleContinue();
        break;
        
      case 'FUNCTION_DECLARATION':
        this.fn.handleFunction(node);
        break;
        
      case 'BLOCK':
        this.block.block(node, false);
        break;
        
      case 'CALL':
        this.call.handleCall(node, true);
        break;
        
      default:
        this.IRB.emitError("InternalError", `Unknown node type ${type}`);
    }
  }
  
  // variable declaration rooting 
  
  handleVariable(node, globalScope) {
    
    const type = node.dataType;
    const isCall = node.value.type === "CALL";
    const isArrayAccess = node.value.type === "ARRAY_ACCESS";
    
    const isArray = node.isArray;
    
    if (isArray) {
      this.variable.arrayVariable(node, globalScope);
      return;
    }
    
    if (isArrayAccess) {
      this.variable.arrayAccessVariable(node, globalScope);
      return;
    }
    
    if (isCall) {
      
      if (VOID_BUILTIN_FUNCTIONS.includes(node.value.name)) {
        this.IRB.emitError("TypeError", `${node.value.name}() void function cannot be used in expression`);
      }
      
      this.variable.callVariable(node, globalScope);
      
    } else if (SCALAR_TYPES.includes(type)) {
      this.variable.scalarVariable(node, globalScope);
      
    } else if (type === "string") {
      this.variable.stringVariable(node, globalScope);
    }
  }
  
  handleVariableRef(node) {
    const isUnary = node.expression.type === "UNARY_EXPRESSION";
    
    if (isUnary) {
      return this.variable.handleUnary(node.expression);
    }
    
    return this.variable.variableReference(node);
  }
  
}