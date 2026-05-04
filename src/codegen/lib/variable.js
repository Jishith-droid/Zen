 import { TYPES } from '/src/config/config.js';
 
 export class Variable {
   constructor(IRB, expr, call) {
     this.IRB = IRB;
     this.expr = expr;
     this.call = call;
   }
   
   // scalar variable handling 
   scalarVariable(node, globalScope) {
     
     const name = node.name;
     const gName = this.IRB.newGlobalTemp()
     const lName = this.IRB.newTemp();
     const valueType = node.value.type;
     const declaredType = node.dataType;
     const llvmType = this.IRB.getLLVMType(declaredType);
     const isConstant = node.isConstant;
     let ptr = null;
     
     const expr = this.expr.handleExpression(node.value, globalScope);
     
     if (this.IRB.isDeclaredInCurrentScope(name)) {
       this.IRB.emitError("ReferenceError", `variable ${name} already defined`);
     }
     
     if (declaredType !== expr.type) {
       this.IRB.emitError("TypeError", `variable ${name} expect ${declaredType} but got ${expr.type}`);
     }
     
     if (globalScope) { // global
       ptr = gName;
       
       const initialValue = this.IRB.initialValue(declaredType);
       
       if (isConstant) {
         if (valueType === "UNARY_EXPRESSION") {
           this.IRB.globals.push(`${gName} = global ${llvmType} ${initialValue}`);
         } else {
         this.IRB.globals.push(`${gName} = ${"constant"} ${llvmType} ${expr.ptr}`);
         }
       } else {
         this.IRB.globals.push(`${gName} = ${isConstant ? "constant" : "global"} ${llvmType} ${initialValue}`);
       }
       
       if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
       if (expr.global.length) this.IRB.globals.push(expr.global.join("\n"));
       
       if (valueType === "UNARY_EXPRESSION" && globalScope && isConstant) {
         this.IRB.emitStore(llvmType, expr.ptr, gName);
       }
       
       if (!isConstant) {
         this.IRB.emitStore(llvmType, expr.ptr, gName);
       }
       
     } else { // local
       ptr = lName;
       
       this.IRB.emitAlloca(llvmType, lName);
       
       if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
       if (expr.global.length) this.IRB.globals.push(expr.global.join("\n"));
       
       this.IRB.emitStore(llvmType, expr.ptr, lName);
       
     }
     
     this.IRB.setVar(name, this.IRB.createData({
       ptr,
       llvmType,
       type: declaredType,
       isConstant,
       isGlobal: globalScope
     }));
   }
   
   // string variable handling 
   
   stringVariable(node, globalScope) {
     
     const name = node.name;
     const gName = this.IRB.newGlobalTemp();
     const lName = this.IRB.newTemp();
     let valueTtype = node.value.type;
     const declaredType = node.dataType;
     const llvmType = this.IRB.getLLVMType(declaredType);
     const isConstant = node.isConstant;
     let ptr = null;
     
     const expr = this.expr.handleExpression(node.value, globalScope);
     
     if (declaredType !== expr.type) {
       this.IRB.emitError("TypeError", `variable ${name} expect string but got ${expr.type}`);
     }
     
     if (globalScope) {
       ptr = gName;
       
       this.IRB.globals.push(`${gName} = global i8* null`);
       
       if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
       if (expr.global.length) this.IRB.globals.push(expr.global.join("\n"));
       
       this.IRB.emit(`store i8* ${expr.ptr}, i8** ${gName}`);
       
     } else {
       ptr = lName;
       
       this.IRB.emitAlloca("i8*", lName);
       
       if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
       if (expr.global.length) this.IRB.globals.push(expr.global.join("\n"));
       
       this.IRB.emit(`store i8* ${expr.ptr}, i8** ${lName}`);
       
     }
     
     this.IRB.setVar(name, this.IRB.createData({
       ptr,
       length: expr.length,
       llvmType,
       type: declaredType,
       isConstant,
       isGlobal: globalScope
     }));
   }
   
   // variable refference 
   
   variableReference(node) {
     
     const name = node.expression.name;
     
     const isUnary = node.expression?.value?.type === "UNARY_EXPRESSION";
     const isCall = node.expression?.value?.type === "CALL";
     
     const isArrayReassignment = node.expression?.array;
     
     if (isArrayReassignment) {
       
       const getBaseArray = (node) => {
         if (node.type === "variable") {
           return node;
         }
         
         if (node.type === "ARRAY_ACCESS") {
           return getBaseArray(node.array);
         }
         
         return null;
       }
       
       const base = getBaseArray(node.expression.array);
       
       if (base) {
         
         const varInfo = this.IRB.getVar(base.name);
         
         const isStringReassignment = varInfo.type === "string" && !varInfo.llvmType.startsWith("[");
         
         if (isStringReassignment) {
           this.IRB.emitError("SemanticError", "string reassignment not allowed");
         }
       }
       
       const expr = this.expr.handleExpression(node.expression);
       
       const ptr = expr.raw;
       
       if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
       if (expr.global.length) this.IRB.globals.push(expr.global.join("\n"));
       
       const valExpr = this.expr.handleExpression(node.expression.value);
       
       if (valExpr.local.length) this.IRB.emit(valExpr.local.join("\n"));
       if (valExpr.global.length) this.IRB.globals.push(valExpr.global.join("\n"));
       
       this.IRB.emit(`store ${valExpr.llvmType} ${valExpr.ptr}, ${valExpr.llvmType}* ${ptr}`)
       return;
     }
     
     if (isUnary && (node.expression.operator === "++" || node.expression.operator === "--")) { // unary 
       return this.handleUnary(node.expression.value, true);
     }
     
     if (isCall) {
       const isGlobal = this.IRB.getVar(name).isGlobal;
       return this.callVariable(this.IRB.normalizeNode(node), isGlobal);
     }
     
     const orgData = this.IRB.getVar(name);
     const isConstant = orgData.isConstant;
     
     if (isConstant) {
       this.IRB.emitError("ImmutableError", `modifying const ${name}`);
     }
     
     const orgPtr = orgData.ptr;
     const orgType = orgData.type;
     const llvmType = orgData.llvmType;
     const destType = node.expression.value.type;
     const destValue = this.IRB.formatValue(node.expression.value.value, destType);
     
     
     if (!this.IRB.hasVar(name)) {
       this.IRB.emitError("ReferenceError", `${name} is not defined`);
     }
     
     const expr = this.expr.handleExpression(node.expression.value, false);
     
     if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
     if (expr.global.length) this.IRB.globals.push(expr.global.join("\n"));
     
     this.IRB.emitStore(llvmType, expr.ptr, orgPtr);
   }
   
   handleUnary(node, fromVarRef) {
     const expr = this.expr.handleExpression(node);
     const ptr = this.IRB.getVar(node.argument.name).ptr;
     
     if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
     if (expr.global.length) this.IRB.globals.push(expr.global.join("\n"));
     
     if (fromVarRef) {
       this.IRB.emitStore(expr.llvmType, expr.ptr, ptr);
     }
     
   }
   
   callVariable(node, globalScope) {
     
     const isVarDecl = node.type === "VARIABLE_DECLARATION";
     
     if (node.value.isInbuilt) {
       this.call.handleBuiltInCall(node, globalScope);
       return;
     }
     
     const name = node.name;
     
     const dataType = node.dataType;
     const llvmType = this.IRB.getLLVMType(dataType);
     
     // evaluate RHS (call)
     const val = this.expr.handleExpression(node.value, globalScope);
     
     // void check
     if (val === null) {
       this.IRB.emitError(
         "TypeError",
         `${node.value.name}() → void function cannot be assigned`
       );
     }
     
     // type mismatch
     if (val.type !== dataType) {
       this.IRB.emitError(
         "TypeError",
         `${name} → expected ${dataType} but got ${val.type}`
       );
     }
     
     let ptr;
     
     if (globalScope) {
       if (isVarDecl) {
         ptr = this.IRB.newGlobalTemp();
       } else {
         ptr = this.IRB.getVar(name).ptr;
       }
       
       let value;
       if (["int", "bool"].includes(dataType)) {
         value = "0";
       } else if (dataType === "double") {
         value = "0.0";
       } else {
         value = "null";
       }
       if (isVarDecl) {
         this.IRB.globals.push(`${ptr} = global ${llvmType} ${value}`);
       }
       
     } else {
       if (isVarDecl) {
         ptr = this.IRB.newTemp();
         this.IRB.emitAlloca(llvmType, ptr);
       } else {
         ptr = this.IRB.getVar(name).ptr;
       }
       
     }
     
     // store result
     this.IRB.emitStore(llvmType, val.ptr, ptr);
     
     this.IRB.setVar(name, this.IRB.createData({
       ptr,
       llvmType,
       type: dataType,
       isConstant: false,
       isGlobal: globalScope
     }));
   }
   
   arrayVariable(node, globalScope) {
     
     const { name, dataType, isConstant, dimensions, value } = node;
     const llvmType = this.IRB.getLLVMType(dataType);
     const dimSizes = dimensions.map(d => d.value);
     
     const init = this.IRB.arrayInit(dimensions, value, globalScope, llvmType, dataType, isConstant);
     
     if (globalScope) {
       if (init.ir.length) this.IRB.globals.push(init.ir.join("\n"))
     } else {
       if (init.ir.length) this.IRB.emit(init.ir.join("\n"));
     }
     
     this.IRB.setVar(name, this.IRB.createData({
       ptr: init.ptr,
       llvmType: init.llvmType,
       type: dataType,
       internalType: `array<${dataType}>`,
       length: init.length,
       isConstant,
       isGlobal: globalScope,
       postOrPrefix: false,
       isArray: true,
       dimensions: dimensions.length,
       dimensionsData: dimSizes
     }));
     this.IRB.logSymbolTable()
   }
   
   arrayAccessVariable(node, globalScope) {
     
     const { name, dataType, isConstant, value } = node;
     const llvmType = this.IRB.getLLVMType(dataType);
     const ptr = globalScope ? this.IRB.newGlobalTemp() : this.IRB.newTemp();
     
     const expr = this.expr.handleExpression(value);
     
     if (globalScope) { // global
       const initialValue = this.IRB.initialValue(dataType);
       
       this.IRB.globals.push(`${ptr} = ${isConstant ? "constant" : "global"} ${llvmType} ${initialValue}`);
     } else {
       this.IRB.emitAlloca(llvmType, ptr);
     }
     
     if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
     if (expr.global.length) this.IRB.globals.push(expr.global.join("\n"));
     
     this.IRB.emit(`store ${expr.llvmType} ${expr.ptr}, ${expr.llvmType}* ${ptr}`);
     
     this.IRB.setVar(name, this.IRB.createData({
       ptr,
       llvmType,
       type: dataType,
       isConstant,
       isGlobal: globalScope,
       postOrPrefix: false,
       isArray: false
     }));
     this.IRB.logSymbolTable()
   }
 }