import { FORMAT_MAP } from '/src/config/config.js';

export class IO {
  constructor(IRB, expr) {
    this.IRB = IRB;
    this.expr = expr;
  }
  
  screen(node) {
    const args = node.args;
    
    this.IRB.declareOneTime("printf", "declare i32 @printf(i8*, ...)");
    this.IRB.declareOneTime("fflush", "declare i32 @fflush(i8*)");
    
    if (args.length > 2) {
      this.IRB.emitError("ArgumentError", "screen() takes exactly upto 2 arguments");
    }
    
    let strFrmt = "%s\n"; // default str format
    const arg = args[0]; // first arg
    
    if (args.length === 2) {
      if (args[1].type === "string") {
        strFrmt = args[1].value;
      } else {
        this.IRB.emitError("ArgumentError", "screen() second parameter should be string");
      }
    }
    
    const expr = this.expr.handleExpression(arg, false)
    if (expr.local.length) this.IRB.emit(expr.local.join("\n"));
    if (expr.global.length) this.IRB.globals.push(expr.global.join("\n"));
    
    const type = expr.type;
    const valuePtr = expr.ptr;
    
    switch (type) {
      case "int":
        this.IRB.emitScreenInt(valuePtr);
        break;
        
      case "double":
        this.IRB.emitScreenDouble(valuePtr);
        break;
        
      case "string":
        this.IRB.emitScreenString(valuePtr, strFrmt);
        break;
        
      case "bool":
        this.IRB.emitScreenBool(valuePtr);
        break;
        
      default:
        this.IRB.emitError("TypeError", `screen() unsupported type: ${type}`);
    }
  }
  
  input(node, globalScope) {
    
    const name = node.name;
    const arg = node.value.args;
    const isVarDecl = node.type === "VARIABLE_DECLARATION";
    const dataType = node.dataType;
    
    this.IRB.declareOneTime(
      "scanf",
      "declare i32 @scanf(i8*, ...)"
    );
    
    // -------------------------
    // argument validation
    // -------------------------
    if (arg.length > 0) { // optional arg check
      
      if (arg.length > 1) { 
        this.IRB.emitError(
          "ArgumentError",
          "input takes exactly 1 parameter"
        );
      }
      
      const argType = arg[0].type;
      
      if (argType !== "string") {
        this.IRB.emitError(
          "TypeError",
          `input() expected type string but got ${argType}`
        );
      }
      
      this.screen(node.value);
    }
    
    const info = FORMAT_MAP[dataType];
    
    if (!info) {
      this.IRB.emitError(
        "TypeError",
        `input() unsupported type ${dataType}`
      );
    }
    
    const { varType, decl, ir, fmt, fmtType } = info;
    
    this.IRB.declareOneTime(decl, ir);
    
    let ptr;
    const temp = this.IRB.newTemp();
    
    // -------------------------
    // LOCAL SCOPE
    // -------------------------
    
    this.IRB.declareOneTime("getchar", "declare i32 @getchar()"); // flush left over \n
    
    if (!globalScope) {
      
      if (dataType === "string") {
        
        if (isVarDecl) {
          ptr = this.IRB.newTemp();
        } else {
          ptr = this.IRB.getVar(name).ptr;
        }
        
        this.IRB.emit(`${temp} = alloca [256 x i8]`);
        
        if (isVarDecl) {
          this.IRB.emit(`${ptr} = alloca i8*`);
        }
        
        const t = this.IRB.newTemp();
        
        this.IRB.emit(
          `${t} = getelementptr [256 x i8], [256 x i8]* ${temp}, i32 0, i32 0`
        );
        
        this.IRB.emit(
          `call i32 (i8*, ...) @scanf(
          i8* getelementptr (${fmtType}, ${fmtType}* ${fmt}, i32 0, i32 0),
          i8* ${t}
        )`
        );
        this.IRB.emit("call i32 @getchar()");
        this.IRB.emit(`store i8* ${t}, i8** ${ptr}`);
        
      } else {
        
        if (isVarDecl) {
          ptr = this.IRB.newTemp();
          this.IRB.emit(`${ptr} = alloca ${varType}`);
        } else {
          ptr = this.IRB.getVar(name).ptr;
        }
        
        this.IRB.emit(
          `call i32 (i8*, ...) @scanf(
          i8* getelementptr (${fmtType}, ${fmtType}* ${fmt}, i32 0, i32 0),
          ${varType}* ${ptr}
        )`
        );
        this.IRB.emit("call i32 @getchar()");
        
      }
      
    }
    
    // -------------------------
    // GLOBAL SCOPE
    // -------------------------
    else {
      
      if (isVarDecl) {
        ptr = this.IRB.newGlobalTemp()
      } else {
        ptr = this.IRB.getVar(name).ptr;
      }
      
      if (node.dataType === "string") {
        const temp = this.IRB.newGlobalTemp();
        
        if (isVarDecl) {
          this.IRB.globals.push(`${ptr} = ${node.isConstant ? "constant" : "global"} i8* null`);
        }
        
        this.IRB.globals.push(
          `${temp} = global [256 x i8] zeroinitializer`
        );
        
        const t = this.IRB.newTemp();
        
        this.IRB.emit(
          `${t} = getelementptr [256 x i8], [256 x i8]* ${temp}, i32 0, i32 0`
        );
        
        this.IRB.emit(
          `call i32 (i8*, ...) @scanf(
          i8* getelementptr (${fmtType}, ${fmtType}* ${fmt}, i32 0, i32 0),
          i8* ${t}
        )`
        );
        this.IRB.emit("call i32 @getchar()");
        this.IRB.emit(`store i8* ${t}, i8** ${ptr}`);
        
      } else {
        
        if (isVarDecl) {
          this.IRB.globals.push(
            `${ptr} = global ${varType} ${info.zero}`
          );
        }
        
        this.IRB.emit(
          `call i32 (i8*, ...) @scanf(
          i8* getelementptr (${fmtType}, ${fmtType}* ${fmt}, i32 0, i32 0),
          ${varType}* ${ptr}
        )`
        );
        this.IRB.emit("call i32 @getchar()");
      }
    }
    
    // -------------------------
    // SYMBOL TABLE
    // -------------------------
    this.IRB.setVar(
      name,
      this.IRB.createData({
        ptr,
        llvmType: varType,
        type: node.dataType,
        isConstant: node.isConstant,
        isGlobal: globalScope
      })
    );
    
    return {
      ptr,
      type: node.dataType,
      llvmType: varType,
      postOrPrefix: false
    };
  }
}