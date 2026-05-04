@t0 = constant i32 999999
@t2 = global [5 x i32] zeroinitializer
declare i32 @printf(i8*, ...)
declare i32 @fflush(i8*)
@.fmt_int = private constant [4 x i8] c"%d\0A\00"
define void @screen_int(i32 %x) {
entry:
  call i32 (i8*, ...) @printf(
    i8* getelementptr ([4 x i8], [4 x i8]* @.fmt_int, i32 0, i32 0),
    i32 %x
  )
  call i32 @fflush(i8* null)
  ret void
}
define void @findMax (i32 %t3) {
entry:
%n.addr = alloca i32
store i32 %t3, i32* %n.addr
%t4 = alloca i32
%t5 = getelementptr [5 x i32], [5 x i32]* @t2, i32 0, i32 0
%t6 = load i32, i32* %t5
store i32 %t6, i32* %t4
%t8 = alloca i32
store i32 1, i32* %t8
br label %loopCond0
loopCond0:
%t9 = load i32, i32* %t8
%t10 = load i32, i32* %n.addr
%t11 = icmp slt i32 %t9, %t10
br i1 %t11, label %loopBody1, label %loopEnd2
loopBody1:
%t12 = load i32, i32* %t8
%t15 = load i32, i32* %t4
%t13 = getelementptr [5 x i32], [5 x i32]* @t2, i32 0, i32 %t12
%t14 = load i32, i32* %t13
%t16 = icmp sgt i32 %t14, %t15
br i1 %t16, label %if5, label %end4
if5:
%t17 = load i32, i32* %t8
%t18 = getelementptr [5 x i32], [5 x i32]* @t2, i32 0, i32 %t17
%t19 = load i32, i32* %t18
store i32 %t19, i32* %t4
br label %end4
end4:
br label %loopUpdate3
loopUpdate3:
%t20 = load i32, i32* %t8
%t21 = add i32 %t20, 1
store i32 %t21, i32* %t8
br label %loopCond0
loopEnd2:
%t22 = load i32, i32* %t4
call void @screen_int(i32 %t22)
ret void
}
define void @main() { 
entry:

ret void 
}
