import { Lexer } from './src/lexer/lexer.js';
import { Parser } from './src/parser/parser.js';
import { CodeGen } from './src/codegen/codegen.js';
import { IRBuilder } from './src/codegen/helper/helper.js';

const code = document.querySelector(".code");
const btn = document.querySelector(".generate");

const tokenDiv = document.querySelector(".tokens");
const astDiv = document.querySelector(".ast");
const llvmDiv = document.getElementById("llvm");

btn.addEventListener("click", () => {
  // reset UI
  llvmDiv.textContent = "";
  tokenDiv.textContent = "";
  astDiv.textContent = "";
  
  const source = code.value;
  const IR = new IRBuilder();
  
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  tokenDiv.textContent = JSON.stringify(tokens, null, 2);
  
  const parser = new Parser(tokens);
  const ast = parser.parse();
  astDiv.textContent = JSON.stringify(ast, null, 2);
  
  const codegen = new CodeGen(ast, IR);
  const llvm = codegen.generateLLVM();
  
  llvmDiv.textContent = llvm;
});

document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const target = btn.dataset.copy;
    
    let text = "";
    
    if (target === "tokens") {
      text = document.querySelector(".tokens")?.innerText || "";
    }
    
    if (target === "ast") {
      text = document.querySelector(".ast")?.innerText || "";
    }
    
    if (target === "llvm") {
      text = document.querySelector("#llvm")?.innerText || "";
    }
    
    try {
      await navigator.clipboard.writeText(text);
      
      const oldText = btn.textContent;
      btn.textContent = "Copied!";
      
      setTimeout(() => {
        btn.textContent = oldText;
      }, 1000);
      
    } catch (err) {
      console.error("Clipboard failed:", err);
      alert("Copy failed (browser permission issue)");
    }
  });
});

const downloadBtn = document.querySelector(".download-llvm");

downloadBtn.addEventListener("click", () => {
  const llvm = document.getElementById("llvm").textContent;

  if (!llvm) {
    alert("No LLVM IR to download");
    return;
  }

  // create file blob
  const blob = new Blob([llvm], { type: "text/plain" });

  // create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "output.ll";

  document.body.appendChild(a);
  a.click();

  // cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});