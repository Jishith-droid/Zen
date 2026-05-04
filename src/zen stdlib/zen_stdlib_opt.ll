; ModuleID = 'zen_stdlib.ll'
source_filename = "zen_stdlib.ll"
target datalayout = "e-m:e-p270:32:32-p271:32:32-p272:64:64-i8:8:32-i16:16:32-i64:64-i128:128-n32:64-S128-Fn32"
target triple = "aarch64-unknown-linux-android24"

@.str6 = private unnamed_addr constant [2 x i8] c"a\00"
@.str7 = private unnamed_addr constant [2 x i8] c"z\00"
@.str9 = private unnamed_addr constant [2 x i8] c"A\00"
@.str10 = private unnamed_addr constant [2 x i8] c"Z\00"
@.str21 = private unnamed_addr constant [1 x i8] zeroinitializer

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i1 @isEven(i32 %t0) local_unnamed_addr #0 {
entry:
  %0 = and i32 %t0, 1
  %t3 = icmp eq i32 %0, 0
  ret i1 %t3
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i1 @isOdd(i32 %t4) local_unnamed_addr #0 {
entry:
  %0 = and i32 %t4, 1
  %t7 = icmp ne i32 %0, 0
  ret i1 %t7
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i1 @isPositive(i32 %t8) local_unnamed_addr #0 {
entry:
  %t10 = icmp sgt i32 %t8, 0
  ret i1 %t10
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i1 @isNegative(i32 %t11) local_unnamed_addr #0 {
entry:
  %t13 = icmp slt i32 %t11, 0
  ret i1 %t13
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define range(i32 0, -2147483647) i32 @abs(i32 %t14) local_unnamed_addr #0 {
entry:
  %common.ret.op = tail call i32 @llvm.abs.i32(i32 %t14, i1 false)
  ret i32 %common.ret.op
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i32 @max(i32 %t20, i32 %t21) local_unnamed_addr #0 {
entry:
  %common.ret.op = tail call i32 @llvm.smax.i32(i32 %t20, i32 %t21)
  ret i32 %common.ret.op
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i32 @min(i32 %t27, i32 %t28) local_unnamed_addr #0 {
entry:
  %common.ret.op = tail call i32 @llvm.smin.i32(i32 %t27, i32 %t28)
  ret i32 %common.ret.op
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i32 @clamp(i32 %t34, i32 %t35, i32 %t36) local_unnamed_addr #0 {
entry:
  %t39 = icmp slt i32 %t34, %t35
  %t36.t34 = tail call i32 @llvm.smin.i32(i32 %t34, i32 %t36)
  %common.ret.op = select i1 %t39, i32 %t35, i32 %t36.t34
  ret i32 %common.ret.op
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define range(i32 -1, 2) i32 @sign(i32 %t46) local_unnamed_addr #0 {
entry:
  %t46.lobit = ashr i32 %t46, 31
  %t48.inv = icmp slt i32 %t46, 1
  %common.ret.op = select i1 %t48.inv, i32 %t46.lobit, i32 1
  ret i32 %common.ret.op
}

; Function Attrs: nofree norecurse nosync nounwind memory(none)
define double @pow(i32 %t52, i32 %t53) local_unnamed_addr #1 {
entry:
  %t55 = icmp eq i32 %t53, 0
  br i1 %t55, label %common.ret, label %end14

common.ret:                                       ; preds = %whileEnd20, %entry, %if22
  %common.ret.op = phi double [ %t77, %if22 ], [ 1.000000e+00, %entry ], [ %t72, %whileEnd20 ]
  ret double %common.ret.op

end14:                                            ; preds = %entry
  %t59 = icmp slt i32 %t53, 0
  br i1 %t59, label %end16, label %whileBody19.lr.ph

end16:                                            ; preds = %end14
  %t61 = sub i32 0, %t53
  %t685 = icmp sgt i32 %t61, 0
  br i1 %t685, label %whileBody19.lr.ph, label %if22

whileBody19.lr.ph:                                ; preds = %end14, %end16
  %exp.addr.011 = phi i32 [ %t61, %end16 ], [ %t53, %end14 ]
  %t71 = sitofp i32 %t52 to double
  br label %whileBody19

whileBody19:                                      ; preds = %whileBody19.lr.ph, %whileBody19
  %storemerge7 = phi i32 [ 0, %whileBody19.lr.ph ], [ %t74, %whileBody19 ]
  %t7246 = phi double [ 1.000000e+00, %whileBody19.lr.ph ], [ %t72, %whileBody19 ]
  %t72 = fmul double %t7246, %t71
  %t74 = add nuw nsw i32 %storemerge7, 1
  %exitcond.not = icmp eq i32 %t74, %exp.addr.011
  br i1 %exitcond.not, label %whileEnd20, label %whileBody19

whileEnd20:                                       ; preds = %whileBody19
  br i1 %t59, label %if22, label %common.ret

if22:                                             ; preds = %end16, %whileEnd20
  %t7613 = phi double [ %t72, %whileEnd20 ], [ 1.000000e+00, %end16 ]
  %t77 = fdiv double 1.000000e+00, %t7613
  br label %common.ret
}

; Function Attrs: nofree norecurse nosync nounwind memory(none)
define i32 @sqrt(i32 %t79) local_unnamed_addr #1 {
entry:
  %t81 = icmp slt i32 %t79, 0
  br i1 %t81, label %common.ret, label %whileCond25

common.ret:                                       ; preds = %entry, %whileEnd27
  %common.ret.op = phi i32 [ %t93, %whileEnd27 ], [ -1, %entry ]
  ret i32 %common.ret.op

whileCond25:                                      ; preds = %entry, %whileCond25
  %storemerge = phi i32 [ %t91, %whileCond25 ], [ 1, %entry ]
  %t87 = mul i32 %storemerge, %storemerge
  %t89.not = icmp sgt i32 %t87, %t79
  %t91 = add i32 %storemerge, 1
  br i1 %t89.not, label %whileEnd27, label %whileCond25

whileEnd27:                                       ; preds = %whileCond25
  %t93 = add i32 %storemerge, -1
  br label %common.ret
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i32 @square(i32 %t94) local_unnamed_addr #0 {
entry:
  %t97 = mul i32 %t94, %t94
  ret i32 %t97
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i32 @cube(i32 %t98) local_unnamed_addr #0 {
entry:
  %t101 = mul i32 %t98, %t98
  %t103 = mul i32 %t101, %t98
  ret i32 %t103
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i32 @floor(double %t104) local_unnamed_addr #0 {
entry:
  %t106 = fptosi double %t104 to i32
  %t111 = fcmp olt double %t104, 0.000000e+00
  %t117 = sitofp i32 %t106 to double
  %t116 = fcmp one double %t104, %t117
  %or.cond.not = select i1 %t111, i1 %t116, i1 false
  %t120 = sext i1 %or.cond.not to i32
  %common.ret.op = add i32 %t120, %t106
  ret i32 %common.ret.op
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i32 @ceil(double %t122) local_unnamed_addr #0 {
entry:
  %t124 = fptosi double %t122 to i32
  %t130 = sitofp i32 %t124 to double
  %t129 = fcmp une double %t122, %t130
  %t133 = fcmp ogt double %t122, 0.000000e+00
  %or.cond = and i1 %t133, %t129
  %t136 = zext i1 %or.cond to i32
  %spec.select = add i32 %t136, %t124
  ret i32 %spec.select
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i32 @round(double %t138) local_unnamed_addr #0 {
entry:
  %t140 = fptosi double %t138 to i32
  %t147 = sitofp i32 %t140 to double
  %t148 = fsub double %t138, %t147
  %t150 = fcmp ult double %t138, 0.000000e+00
  br i1 %t150, label %end37, label %if38

if38:                                             ; preds = %entry
  %t153 = fcmp ult double %t148, 5.000000e-01
  br i1 %t153, label %common.ret, label %if40

common.ret:                                       ; preds = %end37, %if38, %if42, %if40
  %common.ret.op = phi i32 [ %t155, %if40 ], [ %t161, %if42 ], [ %t140, %if38 ], [ %t140, %end37 ]
  ret i32 %common.ret.op

if40:                                             ; preds = %if38
  %t155 = add i32 %t140, 1
  br label %common.ret

end37:                                            ; preds = %entry
  %t159 = fcmp ugt double %t148, -5.000000e-01
  br i1 %t159, label %common.ret, label %if42

if42:                                             ; preds = %end37
  %t161 = add i32 %t140, -1
  br label %common.ret
}

; Function Attrs: nofree norecurse nosync nounwind memory(none)
define double @toFixed(double %t163, i32 %t164) local_unnamed_addr #1 {
entry:
  %t166 = icmp slt i32 %t164, 0
  br i1 %t166, label %common.ret, label %end43

common.ret:                                       ; preds = %entry, %round.exit
  %common.ret.op = phi double [ %t182, %round.exit ], [ %t163, %entry ]
  ret double %common.ret.op

end43:                                            ; preds = %entry
  %t55.i = icmp eq i32 %t164, 0                              br i1 %t55.i, label %pow.exit, label %whileBody19.i

whileBody19.i:                                    ; preds = %end43, %whileBody19.i
  %storemerge7.i = phi i32 [ %t74.i, %whileBody19.i ], [ 0, %end43 ]
  %t7246.i = phi double [ %t72.i, %whileBody19.i ], [ 1.000000e+00, %end43 ]
  %t72.i = fmul double %t7246.i, 1.000000e+01
  %t74.i = add nuw nsw i32 %storemerge7.i, 1
  %exitcond.not.i = icmp eq i32 %t74.i, %t164
  br i1 %exitcond.not.i, label %pow.exit, label %whileBody19.i

pow.exit:                                         ; preds = %whileBody19.i, %end43
  %common.ret.op.i = phi double [ 1.000000e+00, %end43 ], [ %t72.i, %whileBody19.i ]
  %t175 = fmul double %t163, %common.ret.op.i
  %t140.i = fptosi double %t175 to i32
  %t147.i = sitofp i32 %t140.i to double
  %t148.i = fsub double %t175, %t147.i
  %t150.i = fcmp ult double %t175, 0.000000e+00
  br i1 %t150.i, label %end37.i, label %if38.i

if38.i:                                           ; preds = %pow.exit
  %t153.i = fcmp ult double %t148.i, 5.000000e-01
  br i1 %t153.i, label %round.exit, label %if40.i

if40.i:                                           ; preds = %if38.i
  %t155.i = add i32 %t140.i, 1
  br label %round.exit

end37.i:                                          ; preds = %pow.exit
  %t159.i = fcmp ugt double %t148.i, -5.000000e-01
  br i1 %t159.i, label %round.exit, label %if42.i

if42.i:                                           ; preds = %end37.i
  %t161.i = add i32 %t140.i, -1
  br label %round.exit

round.exit:                                       ; preds = %if38.i, %if40.i, %end37.i, %if42.i
  %common.ret.op.i2 = phi i32 [ %t155.i, %if40.i ], [ %t161.i, %if42.i ], [ %t140.i, %if38.i ], [ %t140.i, %end37.i ]
  %t181 = sitofp i32 %common.ret.op.i2 to double
  %t182 = fdiv double %t181, %common.ret.op.i
  br label %common.ret
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i32 @mod(i32 %t183, i32 %t184) local_unnamed_addr #0 {
entry:
  %spec.select = tail call i32 @llvm.abs.i32(i32 %t184, i1 false)
  %t193 = srem i32 %t183, %spec.select
  %t195 = icmp slt i32 %t193, 0
  %t198 = select i1 %t195, i32 %spec.select, i32 0
  %common.ret.op = add i32 %t198, %t193
  ret i32 %common.ret.op
}

; Function Attrs: nofree norecurse nosync nounwind memory(none)
define range(i32 0, -2147483648) i32 @gcd(i32 %t200, i32 %t201) local_unnamed_addr #1 {
entry:
  %t203 = tail call i32 @llvm.abs.i32(i32 %t200, i1 true)
  %t207.not6 = icmp eq i32 %t201, 0
  br i1 %t207.not6, label %whileEnd51, label %whileBody50.preheader

whileBody50.preheader:                            ; preds = %entry
  %t205 = tail call i32 @llvm.abs.i32(i32 %t201, i1 true)
  br label %whileBody50

whileBody50:                                      ; preds = %whileBody50.preheader, %whileBody50
  %b.addr.08 = phi i32 [ %t213, %whileBody50 ], [ %t205, %whileBody50.preheader ]
  %a.addr.07 = phi i32 [ %b.addr.08, %whileBody50 ], [ %t203, %whileBody50.preheader ]
  %t213 = urem i32 %a.addr.07, %b.addr.08
  %t207.not = icmp eq i32 %t213, 0
  br i1 %t207.not, label %whileEnd51, label %whileBody50

whileEnd51:                                       ; preds = %whileBody50, %entry
  %a.addr.0.lcssa = phi i32 [ %t203, %entry ], [ %b.addr.08, %whileBody50 ]
  ret i32 %a.addr.0.lcssa
}

; Function Attrs: nofree norecurse nosync nounwind memory(none)
define range(i32 0, -2147483648) i32 @lcm(i32 %t216, i32 %t217) local_unnamed_addr #1 {
entry:
  %t220 = icmp eq i32 %t216, 0
  %t223 = icmp eq i32 %t217, 0
  %or.cond = select i1 %t220, i1 true, i1 %t223
  br i1 %or.cond, label %common.ret, label %whileBody50.preheader.i

common.ret:                                       ; preds = %entry, %gcd.exit
  %common.ret.op = phi i32 [ %t232, %gcd.exit ], [ 0, %entry ]
  ret i32 %common.ret.op

whileBody50.preheader.i:                          ; preds = %entry
  %t203.i = tail call i32 @llvm.abs.i32(i32 %t216, i1 true)
  %t205.i = tail call i32 @llvm.abs.i32(i32 %t217, i1 true)
  br label %whileBody50.i

whileBody50.i:                                    ; preds = %whileBody50.i, %whileBody50.preheader.i
  %b.addr.08.i = phi i32 [ %t213.i, %whileBody50.i ], [ %t205.i, %whileBody50.preheader.i ]
  %a.addr.07.i = phi i32 [ %b.addr.08.i, %whileBody50.i ], [ %t203.i, %whileBody50.preheader.i ]
  %t213.i = urem i32 %a.addr.07.i, %b.addr.08.i
  %t207.not.i = icmp eq i32 %t213.i, 0
  br i1 %t207.not.i, label %gcd.exit, label %whileBody50.i

gcd.exit:                                         ; preds = %whileBody50.i
  %t229 = sdiv i32 %t216, %b.addr.08.i
  %t231 = mul i32 %t229, %t217
  %t232 = tail call i32 @llvm.abs.i32(i32 %t231, i1 true)
  br label %common.ret
}

; Function Attrs: nofree norecurse nosync nounwind memory(none)
define double @factorial(i32 %t233) local_unnamed_addr #1 {
entry:
  %t235 = icmp slt i32 %t233, 0
  br i1 %t235, label %common.ret, label %end57

common.ret:                                       ; preds = %whileBody62, %entry, %end57
  %common.ret.op = phi double [ 1.000000e+00, %end57 ], [ -1.000000e+00, %entry ], [ %t249, %whileBody62 ]
  ret double %common.ret.op

end57:                                            ; preds = %entry
  %t238 = icmp eq i32 %t233, 0
  br i1 %t238, label %common.ret, label %whileBody62

whileBody62:                                      ; preds = %end57, %whileBody62
  %storemerge6 = phi i32 [ %t251, %whileBody62 ], [ 1, %end57 ]
  %t24935 = phi double [ %t249, %whileBody62 ], [ 1.000000e+00, %end57 ]
  %t248 = sitofp i32 %storemerge6 to double
  %t249 = fmul double %t24935, %t248
  %t251 = add i32 %storemerge6, 1
  %t245.not = icmp sgt i32 %t251, %t233
  br i1 %t245.not, label %common.ret, label %whileBody62
}

; Function Attrs: nofree norecurse nosync nounwind memory(none)
define noundef i1 @isPrime(i32 %t253) local_unnamed_addr #1 {
entry:
  %t255 = icmp slt i32 %t253, 2
  br i1 %t255, label %common.ret, label %end64

common.ret:                                       ; preds = %whileEnd27.i, %whileBody71, %end66, %end64, %entry
  %common.ret.op = phi i1 [ false, %entry ], [ true, %end64 ], [ false, %end66 ], [ %t265.not, %whileBody71 ], [ %t265.not, %whileEnd27.i ]
  ret i1 %common.ret.op

end64:                                            ; preds = %entry
  %t257 = icmp eq i32 %t253, 2
  br i1 %t257, label %common.ret, label %end66

end66:                                            ; preds = %end64
  %0 = and i32 %t253, 1
  %t3.i = icmp eq i32 %0, 0
  br i1 %t3.i, label %common.ret, label %whileCond70

whileCond70:                                      ; preds = %end66, %whileBody71
  %storemerge = phi i32 [ %t271, %whileBody71 ], [ 3, %end66 ]
  br label %whileCond25.i

whileCond25.i:                                    ; preds = %whileCond70, %whileCond25.i
  %storemerge.i = phi i32 [ %t91.i, %whileCond25.i ], [ 1, %whileCond70 ]
  %t87.i = mul i32 %storemerge.i, %storemerge.i
  %t89.not.i = icmp sgt i32 %t87.i, %t253
  %t91.i = add i32 %storemerge.i, 1
  br i1 %t89.not.i, label %whileEnd27.i, label %whileCond25.i

whileEnd27.i:                                     ; preds = %whileCond25.i
  %t93.i = add i32 %storemerge.i, -1
  %t265.not = icmp sgt i32 %storemerge, %t93.i
  br i1 %t265.not, label %common.ret, label %whileBody71

whileBody71:                                      ; preds = %whileEnd27.i
  %t268 = srem i32 %t253, %storemerge
  %t269 = icmp eq i32 %t268, 0
  %t271 = add i32 %storemerge, 2
  br i1 %t269, label %common.ret, label %whileCond70
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define double @lerp(double %t272, double %t273, double %t274) local_unnamed_addr #0 {
entry:
  %t278 = fsub double %t273, %t272
  %t280 = fmul double %t278, %t274
  %t281 = fadd double %t272, %t280
  ret double %t281
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define double @normalize(double %t282, double %t283, double %t284) local_unnamed_addr #0 {
entry:
  %t287 = fcmp oeq double %t283, %t284
  br i1 %t287, label %common.ret, label %end75

common.ret:                                       ; preds = %entry, %end75
  %common.ret.op = phi double [ %t294, %end75 ], [ 0.000000e+00, %entry ]
  ret double %common.ret.op

end75:                                            ; preds = %entry
  %t290 = fsub double %t282, %t283
  %t293 = fsub double %t284, %t283
  %t294 = fdiv double %t290, %t293
  br label %common.ret
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define i1 @between(i32 %t295, i32 %t296, i32 %t297) local_unnamed_addr #0 {
entry:
  %t301.not = icmp sge i32 %t295, %t296
  %t305 = icmp sle i32 %t295, %t297
  %spec.select = select i1 %t301.not, i1 %t305, i1 false
  ret i1 %spec.select
}

declare i32 @strlen(ptr) local_unnamed_addr

declare ptr @zen_char_to_string(i8) local_unnamed_addr

declare ptr @str_concat(ptr, ptr) local_unnamed_addr

define ptr @reverse(ptr %t307) local_unnamed_addr {
entry:
  %t311 = tail call i32 @strlen(ptr %t307)
  %t316.03 = add i32 %t311, -1
  %t3204 = icmp sgt i32 %t316.03, -1
  br i1 %t3204, label %whileBody81.preheader, label %whileEnd82

whileBody81.preheader:                            ; preds = %entry
  %0 = zext nneg i32 %t316.03 to i64
  br label %whileBody81

whileBody81:                                      ; preds = %whileBody81.preheader, %whileBody81
  %indvars.iv = phi i64 [ %0, %whileBody81.preheader ], [ %indvars.iv.next, %whileBody81 ]
  %t313.05 = phi ptr [ @.str21, %whileBody81.preheader ], [ %t328, %whileBody81 ]
  %t324 = getelementptr i8, ptr %t307, i64 %indvars.iv
  %t325 = load i8, ptr %t324, align 1
  %t326 = tail call ptr @zen_char_to_string(i8 %t325)
  %t328 = tail call ptr @str_concat(ptr %t313.05, ptr %t326)
  %indvars.iv.next = add nsw i64 %indvars.iv, -1
  %t320.not = icmp eq i64 %indvars.iv, 0
  br i1 %t320.not, label %whileEnd82, label %whileBody81

whileEnd82:                                       ; preds = %whileBody81, %entry
  %t313.0.lcssa = phi ptr [ @.str21, %entry ], [ %t328, %whileBody81 ]
  ret ptr %t313.0.lcssa
}

; Function Attrs: mustprogress nocallback nofree nounwind willreturn memory(argmem: read)
declare i32 @strcmp(ptr captures(none), ptr captures(none)) local_unnamed_addr #2

define i32 @indexOf(ptr %t332, ptr %t333) local_unnamed_addr {
entry:
  %t337 = tail call i32 @strlen(ptr %t332)
  %t341 = tail call i32 @strlen(ptr %t333)
  %t343 = icmp eq i32 %t341, 0
  br i1 %t343, label %common.ret, label %whileCond85.preheader

whileCond85.preheader:                            ; preds = %entry
  %t349 = sub i32 %t337, %t341
  %t350.not6 = icmp slt i32 %t349, 0
  br i1 %t350.not6, label %common.ret, label %whileBody86.lr.ph

whileBody86.lr.ph:                                ; preds = %whileCond85.preheader
  %t3574 = icmp sgt i32 %t341, 0
  %wide.trip.count = zext nneg i32 %t341 to i64
  br label %whileBody86

common.ret:                                       ; preds = %whileBody86, %end93, %whileEnd90, %whileCond85.preheader, %entry
  %common.ret.op = phi i32 [ 0, %entry ], [ -1, %whileCond85.preheader ], [ %storemerge7, %whileBody86 ], [ -1, %end93 ], [ %storemerge7, %whileEnd90 ]
  ret i32 %common.ret.op

whileBody86:                                      ; preds = %whileBody86.lr.ph, %end93
  %storemerge7 = phi i32 [ 0, %whileBody86.lr.ph ], [ %t380, %end93 ]
  br i1 %t3574, label %whileBody89, label %common.ret

whileBody89:                                      ; preds = %whileBody86, %whileBody89
  %indvars.iv = phi i64 [ %indvars.iv.next, %whileBody89 ], [ 0, %whileBody86 ]
  %0 = phi i1 [ %spec.select, %whileBody89 ], [ true, %whileBody86 ]
  %1 = trunc nuw nsw i64 %indvars.iv to i32
  %t361 = add i32 %storemerge7, %1
  %2 = sext i32 %t361 to i64
  %t362 = getelementptr i8, ptr %t332, i64 %2
  %t363 = load i8, ptr %t362, align 1
  %t364 = tail call ptr @zen_char_to_string(i8 %t363)
  %t368 = getelementptr i8, ptr %t333, i64 %indvars.iv
  %t369 = load i8, ptr %t368, align 1
  %t370 = tail call ptr @zen_char_to_string(i8 %t369)
  %t373 = tail call i32 @strcmp(ptr noundef nonnull dereferenceable(1) %t364, ptr noundef nonnull dereferenceable(1) %t370)
  %t374.not = icmp eq i32 %t373, 0
  %spec.select = select i1 %t374.not, i1 %0, i1 false
  %indvars.iv.next = add nuw nsw i64 %indvars.iv, 1
  %exitcond.not = icmp eq i64 %indvars.iv.next, %wide.trip.count
  br i1 %exitcond.not, label %whileEnd90, label %whileBody89

whileEnd90:                                       ; preds = %whileBody89
  br i1 %spec.select, label %common.ret, label %end93

end93:                                            ; preds = %whileEnd90
  %t380 = add i32 %storemerge7, 1
  %t350.not = icmp sgt i32 %t380, %t349
  br i1 %t350.not, label %common.ret, label %whileBody86
}

define ptr @slice(ptr %t382, i32 %t383, i32 %t384) local_unnamed_addr {
entry:
  %t388 = tail call i32 @strlen(ptr %t382)
  %spec.store.select = tail call i32 @llvm.smax.i32(i32 %t383, i32 0)
  %spec.select = tail call i32 @llvm.smin.i32(i32 %t384, i32 %t388)
  %t397 = icmp sgt i32 %spec.store.select, %spec.select
  br i1 %t397, label %common.ret, label %end99

common.ret:                                       ; preds = %whileBody102, %end99, %entry
  %common.ret.op = phi ptr [ @.str21, %entry ], [ @.str21, %end99 ], [ %t415, %whileBody102 ]
  ret ptr %common.ret.op

end99:                                            ; preds = %entry
  %t4077 = icmp samesign ult i32 %spec.store.select, %spec.select
  br i1 %t4077, label %whileBody102.preheader, label %common.ret

whileBody102.preheader:                           ; preds = %end99
  %0 = zext nneg i32 %spec.store.select to i64
  %wide.trip.count = zext nneg i32 %spec.select to i64
  br label %whileBody102

whileBody102:                                     ; preds = %whileBody102.preheader, %whileBody102
  %indvars.iv = phi i64 [ %0, %whileBody102.preheader ], [ %indvars.iv.next, %whileBody102 ]
  %t41568 = phi ptr [ @.str21, %whileBody102.preheader ], [ %t415, %whileBody102 ]
  %t411 = getelementptr i8, ptr %t382, i64 %indvars.iv
  %t412 = load i8, ptr %t411, align 1
  %t413 = tail call ptr @zen_char_to_string(i8 %t412)
  %t415 = tail call ptr @str_concat(ptr %t41568, ptr %t413)
  %indvars.iv.next = add nuw nsw i64 %indvars.iv, 1
  %exitcond.not = icmp eq i64 %indvars.iv.next, %wide.trip.count
  br i1 %exitcond.not, label %common.ret, label %whileBody102
}

define ptr @charAt(ptr %t419, i32 %t420) local_unnamed_addr {
entry:
  %t424 = tail call i32 @strlen(ptr %t419)
  %t427 = icmp slt i32 %t420, 0
  %t431 = icmp sge i32 %t420, %t424
  %or.cond = select i1 %t427, i1 true, i1 %t431
  br i1 %or.cond, label %common.ret, label %end104

common.ret:                                       ; preds = %entry, %end104
  %common.ret.op = phi ptr [ %t438, %end104 ], [ @.str21, %entry ]
  ret ptr %common.ret.op

end104:                                           ; preds = %entry
  %0 = zext nneg i32 %t420 to i64
  %t436 = getelementptr i8, ptr %t419, i64 %0
  %t437 = load i8, ptr %t436, align 1
  %t438 = tail call ptr @zen_char_to_string(i8 %t437)
  br label %common.ret
}

define ptr @replace(ptr %t440, ptr %t441, ptr %t442) local_unnamed_addr {
entry:
  %t446 = tail call i32 @strlen(ptr %t440)
  %t450 = tail call i32 @strlen(ptr %t441)
  %t452 = icmp eq i32 %t450, 0
  br i1 %t452, label %common.ret, label %end109

common.ret:                                       ; preds = %end122, %end109, %entry
  %common.ret.op = phi ptr [ %t440, %entry ], [ @.str21, %end109 ], [ %t51012.lcssa20, %end122 ]
  ret ptr %common.ret.op

end109:                                           ; preds = %entry
  %t46121 = icmp sgt i32 %t446, 0
  br i1 %t46121, label %whileBody112.lr.ph, label %common.ret

whileBody112.lr.ph:                               ; preds = %end109
  %t469 = sub i32 %t446, %t450
  %t4738 = icmp sgt i32 %t450, 0
  br label %whileBody112

whileBody112:                                     ; preds = %whileBody112.lr.ph, %end122
  %storemerge523 = phi i32 [ 0, %whileBody112.lr.ph ], [ %t525, %end122 ]
  %t51012.lcssa1922 = phi ptr [ @.str21, %whileBody112.lr.ph ], [ %t51012.lcssa20, %end122 ]
  %t470.not = icmp sgt i32 %storemerge523, %t469
  br i1 %t470.not, label %else124, label %whileCond117.preheader

whileCond117.preheader:                           ; preds = %whileBody112
  br i1 %t4738, label %whileBody118, label %if123

whileBody118:                                     ; preds = %whileCond117.preheader, %whileBody118
  %indvars.iv = phi i64 [ %indvars.iv.next, %whileBody118 ], [ 0, %whileCond117.preheader ]
  %0 = phi i1 [ %spec.select, %whileBody118 ], [ true, %whileCond117.preheader ]
  %1 = trunc nsw i64 %indvars.iv to i32
  %t477 = add i32 %storemerge523, %1
  %2 = sext i32 %t477 to i64
  %t478 = getelementptr i8, ptr %t440, i64 %2
  %t479 = load i8, ptr %t478, align 1
  %t480 = tail call ptr @zen_char_to_string(i8 %t479)
  %t484 = getelementptr i8, ptr %t441, i64 %indvars.iv
  %t485 = load i8, ptr %t484, align 1
  %t486 = tail call ptr @zen_char_to_string(i8 %t485)
  %t489 = tail call i32 @strcmp(ptr noundef nonnull dereferenceable(1) %t480, ptr noundef nonnull dereferenceable(1) %t486)
  %t490.not = icmp eq i32 %t489, 0
  %spec.select = select i1 %t490.not, i1 %0, i1 false
  %indvars.iv.next = add nuw nsw i64 %indvars.iv, 1
  %lftr.wideiv = trunc i64 %indvars.iv.next to i32
  %exitcond.not = icmp eq i32 %t450, %lftr.wideiv
  br i1 %exitcond.not, label %end114, label %whileBody118

end114:                                           ; preds = %whileBody118
  br i1 %spec.select, label %if123, label %else124

if123:                                            ; preds = %whileCond117.preheader, %end114
  %t499 = tail call i32 @strlen(ptr %t442)
  %t50213 = icmp sgt i32 %t499, 0
  br i1 %t50213, label %whileBody126.preheader, label %end122

whileBody126.preheader:                           ; preds = %if123
  %wide.trip.count = zext nneg i32 %t499 to i64
  br label %whileBody126

whileBody126:                                     ; preds = %whileBody126.preheader, %whileBody126
  %indvars.iv26 = phi i64 [ 0, %whileBody126.preheader ], [ %indvars.iv.next27, %whileBody126 ]
  %t5101214 = phi ptr [ %t51012.lcssa1922, %whileBody126.preheader ], [ %t510, %whileBody126 ]
  %t506 = getelementptr i8, ptr %t442, i64 %indvars.iv26
  %t507 = load i8, ptr %t506, align 1
  %t508 = tail call ptr @zen_char_to_string(i8 %t507)
  %t510 = tail call ptr @str_concat(ptr %t5101214, ptr %t508)
  %indvars.iv.next27 = add nuw nsw i64 %indvars.iv26, 1
  %exitcond29.not = icmp eq i64 %indvars.iv.next27, %wide.trip.count
  br i1 %exitcond29.not, label %end122, label %whileBody126

else124:                                          ; preds = %whileBody112, %end114
  %3 = sext i32 %storemerge523 to i64
  %t519 = getelementptr i8, ptr %t440, i64 %3
  %t520 = load i8, ptr %t519, align 1
  %t521 = tail call ptr @zen_char_to_string(i8 %t520)
  %t523 = tail call ptr @str_concat(ptr %t51012.lcssa1922, ptr %t521)
  br label %end122

end122:                                           ; preds = %whileBody126, %if123, %else124
  %.sink = phi i32 [ 1, %else124 ], [ %t450, %if123 ], [ %t450, %whileBody126 ]
  %t51012.lcssa20 = phi ptr [ %t523, %else124 ], [ %t51012.lcssa1922, %if123 ], [ %t510, %whileBody126 ]
  %t525 = add i32 %storemerge523, %.sink
  %t461 = icmp slt i32 %t525, %t446
  br i1 %t461, label %whileBody112, label %common.ret
}

define noundef i1 @contains(ptr %t527, ptr %t528) local_unnamed_addr {
entry:
  %t532 = tail call i32 @strlen(ptr %t527)
  %t536 = tail call i32 @strlen(ptr %t528)
  %t538 = icmp eq i32 %t536, 0
  br i1 %t538, label %common.ret, label %whileCond130.preheader

whileCond130.preheader:                           ; preds = %entry
  %t544 = sub i32 %t532, %t536
  %t545.not6 = icmp slt i32 %t544, 0
  br i1 %t545.not6, label %common.ret, label %whileBody131.lr.ph

whileBody131.lr.ph:                               ; preds = %whileCond130.preheader
  %t5524 = icmp sgt i32 %t536, 0
  %wide.trip.count = zext nneg i32 %t536 to i64
  br label %whileBody131

common.ret:                                       ; preds = %whileBody131, %whileEnd135, %whileCond130, %whileCond130.preheader, %entry
  %common.ret.op = phi i1 [ true, %entry ], [ false, %whileCond130.preheader ], [ true, %whileBody131 ], [ true, %whileEnd135 ], [ false, %whileCond130 ]
  ret i1 %common.ret.op                                    
whileCond130:                                     ; preds = %whileEnd135
  %t574 = add i32 %storemerge7, 1
  %t545.not = icmp sgt i32 %t574, %t544
  br i1 %t545.not, label %common.ret, label %whileBody131

whileBody131:                                     ; preds = %whileBody131.lr.ph, %whileCond130
  %storemerge7 = phi i32 [ 0, %whileBody131.lr.ph ], [ %t574, %whileCond130 ]
  br i1 %t5524, label %whileBody134, label %common.ret

whileBody134:                                     ; preds = %whileBody131, %whileBody134
  %indvars.iv = phi i64 [ %indvars.iv.next, %whileBody134 ], [ 0, %whileBody131 ]
  %0 = phi i1 [ %spec.select, %whileBody134 ], [ true, %whileBody131 ]
  %1 = trunc nuw nsw i64 %indvars.iv to i32
  %t556 = add i32 %storemerge7, %1
  %2 = sext i32 %t556 to i64
  %t557 = getelementptr i8, ptr %t527, i64 %2
  %t558 = load i8, ptr %t557, align 1
  %t559 = tail call ptr @zen_char_to_string(i8 %t558)
  %t563 = getelementptr i8, ptr %t528, i64 %indvars.iv
  %t564 = load i8, ptr %t563, align 1
  %t565 = tail call ptr @zen_char_to_string(i8 %t564)
  %t568 = tail call i32 @strcmp(ptr noundef nonnull dereferenceable(1) %t559, ptr noundef nonnull dereferenceable(1) %t565)
  %t569.not = icmp eq i32 %t568, 0
  %spec.select = select i1 %t569.not, i1 %0, i1 false
  %indvars.iv.next = add nuw nsw i64 %indvars.iv, 1
  %exitcond.not = icmp eq i64 %indvars.iv.next, %wide.trip.count
  br i1 %exitcond.not, label %whileEnd135, label %whileBody134

whileEnd135:                                      ; preds = %whileBody134
  br i1 %spec.select, label %common.ret, label %whileCond130
}

declare i32 @string_to_int(ptr) local_unnamed_addr

declare ptr @int_to_string(i32) local_unnamed_addr

define ptr @upperCase(ptr %t575) local_unnamed_addr {
entry:
  %t579 = tail call i32 @strlen(ptr %t575)
  %t5873 = icmp sgt i32 %t579, 0
  br i1 %t5873, label %whileBody141.preheader, label %whileEnd142

whileBody141.preheader:                           ; preds = %entry
  %wide.trip.count = zext nneg i32 %t579 to i64
  br label %whileBody141

whileBody141:                                     ; preds = %whileBody141.preheader, %end143
  %indvars.iv = phi i64 [ 0, %whileBody141.preheader ], [ %indvars.iv.next, %end143 ]
  %t581.04 = phi ptr [ @.str21, %whileBody141.preheader ], [ %t617, %end143 ]
  %t591 = getelementptr i8, ptr %t575, i64 %indvars.iv
  %t592 = load i8, ptr %t591, align 1
  %t593 = tail call ptr @zen_char_to_string(i8 %t592)
  %t596 = tail call i32 @string_to_int(ptr %t593)
  %t602 = tail call i32 @string_to_int(ptr nonnull @.str6)
  %t607 = tail call i32 @string_to_int(ptr nonnull @.str7)
  %t603 = icmp sge i32 %t596, %t602
  %t608 = icmp sle i32 %t596, %t607
  %or.cond = select i1 %t603, i1 %t608, i1 false
  br i1 %or.cond, label %if147, label %end143

if147:                                            ; preds = %whileBody141
  %t612 = add i32 %t596, -32
  %t613 = tail call ptr @int_to_string(i32 %t612)            br label %end143

end143:                                           ; preds = %whileBody141, %if147
  %t593.sink = phi ptr [ %t613, %if147 ], [ %t593, %whileBody141 ]
  %t617 = tail call ptr @str_concat(ptr %t581.04, ptr %t593.sink)
  %indvars.iv.next = add nuw nsw i64 %indvars.iv, 1
  %exitcond.not = icmp eq i64 %indvars.iv.next, %wide.trip.count
  br i1 %exitcond.not, label %whileEnd142, label %whileBody141

whileEnd142:                                      ; preds = %end143, %entry
  %t581.0.lcssa = phi ptr [ @.str21, %entry ], [ %t617, %end143 ]
  ret ptr %t581.0.lcssa
}

define ptr @lowerCase(ptr %t621) local_unnamed_addr {
entry:
  %t625 = tail call i32 @strlen(ptr %t621)
  %t6333 = icmp sgt i32 %t625, 0
  br i1 %t6333, label %whileBody150.preheader, label %whileEnd151

whileBody150.preheader:                           ; preds = %entry
  %wide.trip.count = zext nneg i32 %t625 to i64
  br label %whileBody150

whileBody150:                                     ; preds = %whileBody150.preheader, %end152
  %indvars.iv = phi i64 [ 0, %whileBody150.preheader ], [ %indvars.iv.next, %end152 ]
  %t627.04 = phi ptr [ @.str21, %whileBody150.preheader ], [ %t663, %end152 ]
  %t637 = getelementptr i8, ptr %t621, i64 %indvars.iv
  %t638 = load i8, ptr %t637, align 1
  %t639 = tail call ptr @zen_char_to_string(i8 %t638)
  %t642 = tail call i32 @string_to_int(ptr %t639)
  %t648 = tail call i32 @string_to_int(ptr nonnull @.str9)
  %t653 = tail call i32 @string_to_int(ptr nonnull @.str10)
  %t649 = icmp sge i32 %t642, %t648
  %t654 = icmp sle i32 %t642, %t653
  %or.cond = select i1 %t649, i1 %t654, i1 false
  br i1 %or.cond, label %if156, label %end152

if156:                                            ; preds = %whileBody150
  %t658 = add i32 %t642, 32
  %t659 = tail call ptr @int_to_string(i32 %t658)
  br label %end152

end152:                                           ; preds = %whileBody150, %if156
  %t639.sink = phi ptr [ %t659, %if156 ], [ %t639, %whileBody150 ]
  %t663 = tail call ptr @str_concat(ptr %t627.04, ptr %t639.sink)
  %indvars.iv.next = add nuw nsw i64 %indvars.iv, 1
  %exitcond.not = icmp eq i64 %indvars.iv.next, %wide.trip.count
  br i1 %exitcond.not, label %whileEnd151, label %whileBody150

whileEnd151:                                      ; preds = %end152, %entry
  %t627.0.lcssa = phi ptr [ @.str21, %entry ], [ %t663, %end152 ]
  ret ptr %t627.0.lcssa
}

define noundef i1 @startsWith(ptr %t667, ptr %t668) local_unnamed_addr {
entry:
  %t672 = tail call i32 @strlen(ptr %t667)
  %t676 = tail call i32 @strlen(ptr %t668)
  %t679 = icmp sgt i32 %t676, %t672
  br i1 %t679, label %common.ret, label %whileCond160.preheader

whileCond160.preheader:                           ; preds = %entry
  %t6842 = icmp sgt i32 %t676, 0
  br i1 %t6842, label %whileBody161.preheader, label %common.ret

whileBody161.preheader:                           ; preds = %whileCond160.preheader
  %wide.trip.count = zext nneg i32 %t676 to i64
  br label %whileBody161

common.ret:                                       ; preds = %whileBody161, %whileCond160.preheader, %entry
  %common.ret.op = phi i1 [ false, %entry ], [ true, %whileCond160.preheader ], [ %t699.not, %whileBody161 ]
  ret i1 %common.ret.op

whileBody161:                                     ; preds = %whileBody161, %whileBody161.preheader
  %indvars.iv = phi i64 [ 0, %whileBody161.preheader ], [ %indvars.iv.next, %whileBody161 ]
  %t687 = getelementptr i8, ptr %t667, i64 %indvars.iv
  %t688 = load i8, ptr %t687, align 1
  %t689 = tail call ptr @zen_char_to_string(i8 %t688)
  %t693 = getelementptr i8, ptr %t668, i64 %indvars.iv
  %t694 = load i8, ptr %t693, align 1
  %t695 = tail call ptr @zen_char_to_string(i8 %t694)
  %t698 = tail call i32 @strcmp(ptr noundef nonnull dereferenceable(1) %t689, ptr noundef nonnull dereferenceable(1) %t695)
  %t699.not = icmp eq i32 %t698, 0
  %indvars.iv.next = add nuw nsw i64 %indvars.iv, 1
  %exitcond.not = icmp ne i64 %indvars.iv.next, %wide.trip.count
  %or.cond.not = select i1 %t699.not, i1 %exitcond.not, i1 false
  br i1 %or.cond.not, label %whileBody161, label %common.ret
}

define noundef i1 @endsWith(ptr %t702, ptr %t703) local_unnamed_addr {
entry:
  %t707 = tail call i32 @strlen(ptr %t702)
  %t711 = tail call i32 @strlen(ptr %t703)
  %t714 = icmp sgt i32 %t711, %t707
  br i1 %t714, label %common.ret, label %whileCond167.preheader

whileCond167.preheader:                           ; preds = %entry
  %t723 = sub i32 %t707, %t711
  %t7194 = icmp sgt i32 %t711, 0
  br i1 %t7194, label %whileBody168.preheader, label %common.ret

whileBody168.preheader:                           ; preds = %whileCond167.preheader
  %wide.trip.count = zext nneg i32 %t711 to i64
  br label %whileBody168

common.ret:                                       ; preds = %whileBody168, %whileCond167.preheader, %entry              %common.ret.op = phi i1 [ false, %entry ], [ true, %whileCond167.preheader ], [ %t738.not, %whileBody168 ]
  ret i1 %common.ret.op

whileBody168:                                     ; preds = %whileBody168, %whileBody168.preheader                      %indvars.iv = phi i64 [ 0, %whileBody168.preheader ], [ %indvars.iv.next, %whileBody168 ]
  %0 = trunc nuw nsw i64 %indvars.iv to i32
  %t725 = add i32 %t723, %0
  %1 = sext i32 %t725 to i64
  %t726 = getelementptr i8, ptr %t702, i64 %1
  %t727 = load i8, ptr %t726, align 1
  %t728 = tail call ptr @zen_char_to_string(i8 %t727)
  %t732 = getelementptr i8, ptr %t703, i64 %indvars.iv
  %t733 = load i8, ptr %t732, align 1
  %t734 = tail call ptr @zen_char_to_string(i8 %t733)
  %t737 = tail call i32 @strcmp(ptr noundef nonnull dereferenceable(1) %t728, ptr noundef nonnull dereferenceable(1) %t734)
  %t738.not = icmp eq i32 %t737, 0
  %indvars.iv.next = add nuw nsw i64 %indvars.iv, 1
  %exitcond.not = icmp ne i64 %indvars.iv.next, %wide.trip.count
  %or.cond.not = select i1 %t738.not, i1 %exitcond.not, i1 false
  br i1 %or.cond.not, label %whileBody168, label %common.ret
}

define ptr @trim(ptr %t741) local_unnamed_addr {
entry:
  %t745 = tail call i32 @strlen(ptr %t741)
  %t75424 = icmp sgt i32 %t745, 0
  br i1 %t75424, label %whileBody173.preheader, label %whileEnd174

whileBody173.preheader:                           ; preds = %entry
  %wide.trip.count = zext nneg i32 %t745 to i64
  br label %whileBody173

whileBody173:                                     ; preds = %whileBody173.preheader, %if182
  %indvars.iv = phi i64 [ 0, %whileBody173.preheader ], [ %indvars.iv.next, %if182 ]
  %t758 = getelementptr i8, ptr %t741, i64 %indvars.iv
  %t759 = load i8, ptr %t758, align 1
  %t760 = tail call ptr @zen_char_to_string(i8 %t759)
  %0 = load i8, ptr %t760, align 1
  switch i8 %0, label %rhs176.tail.thread [
    i8 32, label %whileBody173.tail
    i8 10, label %rhs179.tail
    i8 9, label %rhs176.tail
  ]

whileBody173.tail:                                ; preds = %whileBody173
  %1 = getelementptr inbounds nuw i8, ptr %t760, i64 1
  %2 = load i8, ptr %1, align 1
  %3 = icmp eq i8 %2, 0
  br i1 %3, label %if182, label %rhs176.tail.thread        
rhs179.tail:                                      ; preds = %whileBody173
  %4 = getelementptr inbounds nuw i8, ptr %t760, i64 1
  %5 = load i8, ptr %4, align 1
  %6 = icmp eq i8 %5, 0
  br i1 %6, label %if182, label %rhs176.tail.thread

rhs176.tail.thread:                               ; preds = %whileBody173, %whileBody173.tail, %rhs179.tail
  %7 = trunc nuw nsw i64 %indvars.iv to i32
  br label %whileEnd174

rhs176.tail:                                      ; preds = %whileBody173
  %8 = getelementptr inbounds nuw i8, ptr %t760, i64 1
  %9 = load i8, ptr %8, align 1
  %10 = icmp eq i8 %9, 0
  br i1 %10, label %if182, label %whileEnd174.loopexit.split.loop.exit

if182:                                            ; preds = %whileBody173.tail, %rhs179.tail, %rhs176.tail
  %indvars.iv.next = add nuw nsw i64 %indvars.iv, 1
  %exitcond.not = icmp eq i64 %indvars.iv.next, %wide.trip.count
  br i1 %exitcond.not, label %whileEnd174, label %whileBody173

whileEnd174.loopexit.split.loop.exit:             ; preds = %rhs176.tail
  %11 = trunc nuw nsw i64 %indvars.iv to i32
  br label %whileEnd174

whileEnd174:                                      ; preds = %if182, %whileEnd174.loopexit.split.loop.exit, %rhs176.tail.thread, %entry
  %t747.0.lcssa = phi i32 [ 0, %entry ], [ %7, %rhs176.tail.thread ], [ %11, %whileEnd174.loopexit.split.loop.exit ], [ %t745, %if182 ]
  %t749.027 = add i32 %t745, -1
  %t787.not28 = icmp slt i32 %t749.027, %t747.0.lcssa
  br i1 %t787.not28, label %whileEnd186, label %whileBody185

whileBody185:                                     ; preds = %whileEnd174, %if194
  %t749.029 = phi i32 [ %t749.0, %if194 ], [ %t749.027, %whileEnd174 ]
  %12 = sext i32 %t749.029 to i64
  %t791 = getelementptr i8, ptr %t741, i64 %12
  %t792 = load i8, ptr %t791, align 1
  %t793 = tail call ptr @zen_char_to_string(i8 %t792)
  %13 = load i8, ptr %t793, align 1
  switch i8 %13, label %whileEnd186 [
    i8 32, label %whileBody185.tail
    i8 10, label %rhs191.tail
    i8 9, label %rhs188.tail
  ]

whileBody185.tail:                                ; preds = %whileBody185
  %14 = getelementptr inbounds nuw i8, ptr %t793, i64 1
  %15 = load i8, ptr %14, align 1
  %16 = icmp eq i8 %15, 0
  br i1 %16, label %if194, label %whileEnd186

rhs191.tail:                                      ; preds = %whileBody185
  %17 = getelementptr inbounds nuw i8, ptr %t793, i64 1
  %18 = load i8, ptr %17, align 1
  %19 = icmp eq i8 %18, 0
  br i1 %19, label %if194, label %whileEnd186

rhs188.tail:                                      ; preds = %whileBody185
  %20 = getelementptr inbounds nuw i8, ptr %t793, i64 1
  %21 = load i8, ptr %20, align 1
  %22 = icmp eq i8 %21, 0
  br i1 %22, label %if194, label %whileEnd186

if194:                                            ; preds = %whileBody185.tail, %rhs191.tail, %rhs188.tail
  %t749.0 = add i32 %t749.029, -1
  %t787.not = icmp slt i32 %t749.0, %t747.0.lcssa
  br i1 %t787.not, label %whileEnd186, label %whileBody185

whileEnd186:                                      ; preds = %rhs191.tail, %whileBody185.tail, %if194, %rhs188.tail, %whileBody185, %whileEnd174
  %t749.0.lcssa = phi i32 [ %t749.027, %whileEnd174 ], [ %t749.029, %rhs191.tail ], [ %t749.029, %whileBody185.tail ], [ %t749.029, %rhs188.tail ], [ %t749.0, %if194 ], [ %t749.029, %whileBody185 ]
  %t826.not33 = icmp sgt i32 %t747.0.lcssa, %t749.0.lcssa
  br i1 %t826.not33, label %whileEnd198, label %whileBody197

whileBody197:                                     ; preds = %whileEnd186, %whileBody197
  %storemerge35 = phi i32 [ %t836, %whileBody197 ], [ %t747.0.lcssa, %whileEnd186 ]
  %t8343234 = phi ptr [ %t834, %whileBody197 ], [ @.str21, %whileEnd186 ]
  %23 = sext i32 %storemerge35 to i64
  %t830 = getelementptr i8, ptr %t741, i64 %23
  %t831 = load i8, ptr %t830, align 1
  %t832 = tail call ptr @zen_char_to_string(i8 %t831)
  %t834 = tail call ptr @str_concat(ptr %t8343234, ptr %t832)
  %t836 = add i32 %storemerge35, 1
  %t826.not = icmp sgt i32 %t836, %t749.0.lcssa
  br i1 %t826.not, label %whileEnd198, label %whileBody197

whileEnd198:                                      ; preds = %whileBody197, %whileEnd186
  %t83432.lcssa = phi ptr [ @.str21, %whileEnd186 ], [ %t834, %whileBody197 ]
  ret ptr %t83432.lcssa
}

define ptr @splitAt(ptr %t838, ptr %t839, i32 %t840) local_unnamed_addr {
entry:
  %t844 = tail call i32 @strlen(ptr %t838)
  %t848 = tail call i32 @strlen(ptr %t839)
  %t850 = icmp eq i32 %t848, 0
  br i1 %t850, label %common.ret, label %end199

common.ret:                                       ; preds = %if213, %whileEnd203, %entry
  %common.ret.op = phi ptr [ @.str21, %entry ], [ %spec.select, %whileEnd203 ], [ %t9111620, %if213 ]
  ret ptr %common.ret.op

end199:                                           ; preds = %entry
  %t86119 = icmp sgt i32 %t844, 0
  br i1 %t86119, label %whileBody202.lr.ph, label %whileEnd203

whileBody202.lr.ph:                               ; preds = %end199
  %t869 = sub i32 %t844, %t848
  %t8738 = icmp sgt i32 %t848, 0
  br label %whileBody202

whileBody202:                                     ; preds = %whileBody202.lr.ph, %end212
  %storemerge1122 = phi i32 [ 0, %whileBody202.lr.ph ], [ %t913, %end212 ]
  %t8991421 = phi i32 [ 0, %whileBody202.lr.ph ], [ %t89913, %end212 ]
  %t9111620 = phi ptr [ @.str21, %whileBody202.lr.ph ], [ %t91117, %end212 ]
  %t870.not = icmp sgt i32 %storemerge1122, %t869
  br i1 %t870.not, label %else214, label %whileCond207.preheader

whileCond207.preheader:                           ; preds = %whileBody202
  br i1 %t8738, label %whileBody208, label %if213

whileBody208:                                     ; preds = %whileCond207.preheader, %whileBody208
  %indvars.iv = phi i64 [ %indvars.iv.next, %whileBody208 ], [ 0, %whileCond207.preheader ]
  %0 = phi i1 [ %spec.select26, %whileBody208 ], [ true, %whileCond207.preheader ]
  %1 = trunc nsw i64 %indvars.iv to i32
  %t877 = add i32 %storemerge1122, %1
  %2 = sext i32 %t877 to i64
  %t878 = getelementptr i8, ptr %t838, i64 %2
  %t879 = load i8, ptr %t878, align 1
  %t880 = tail call ptr @zen_char_to_string(i8 %t879)
  %t884 = getelementptr i8, ptr %t839, i64 %indvars.iv
  %t885 = load i8, ptr %t884, align 1
  %t886 = tail call ptr @zen_char_to_string(i8 %t885)
  %t889 = tail call i32 @strcmp(ptr noundef nonnull dereferenceable(1) %t880, ptr noundef nonnull dereferenceable(1) %t886)
  %t890.not = icmp eq i32 %t889, 0
  %spec.select26 = select i1 %t890.not, i1 %0, i1 false
  %indvars.iv.next = add nuw nsw i64 %indvars.iv, 1
  %lftr.wideiv = trunc i64 %indvars.iv.next to i32
  %exitcond.not = icmp eq i32 %t848, %lftr.wideiv
  br i1 %exitcond.not, label %end204, label %whileBody208

end204:                                           ; preds = %whileBody208
  br i1 %spec.select26, label %if213, label %else214

if213:                                            ; preds = %whileCond207.preheader, %end204
  %t896 = icmp eq i32 %t8991421, %t840
  br i1 %t896, label %common.ret, label %end215

end215:                                           ; preds = %if213
  %t899 = add i32 %t8991421, 1
  br label %end212

else214:                                          ; preds = %whileBody202, %end204
  %3 = sext i32 %storemerge1122 to i64
  %t907 = getelementptr i8, ptr %t838, i64 %3
  %t908 = load i8, ptr %t907, align 1
  %t909 = tail call ptr @zen_char_to_string(i8 %t908)
  %t911 = tail call ptr @str_concat(ptr %t9111620, ptr %t909)
  br label %end212

end212:                                           ; preds = %else214, %end215
  %.sink = phi i32 [ 1, %else214 ], [ %t848, %end215 ]
  %t91117 = phi ptr [ %t911, %else214 ], [ @.str21, %end215 ]
  %t89913 = phi i32 [ %t8991421, %else214 ], [ %t899, %end215 ]
  %t913 = add i32 %storemerge1122, %.sink
  %t861 = icmp slt i32 %t913, %t844
  br i1 %t861, label %whileBody202, label %whileEnd203

whileEnd203:                                      ; preds = %end212, %end199
  %t91116.lcssa = phi ptr [ @.str21, %end199 ], [ %t91117, %end212 ]
  %t89914.lcssa = phi i32 [ 0, %end199 ], [ %t89913, %end212 ]
  %t916 = icmp eq i32 %t89914.lcssa, %t840
  %spec.select = select i1 %t916, ptr %t91116.lcssa, ptr @.str21
  br label %common.ret
}

; Function Attrs: nocallback nofree nosync nounwind speculatable willreturn memory(none)
declare i32 @llvm.abs.i32(i32, i1 immarg) #3

; Function Attrs: nocallback nofree nosync nounwind speculatable willreturn memory(none)
declare i32 @llvm.smax.i32(i32, i32) #3

; Function Attrs: nocallback nofree nosync nounwind speculatable willreturn memory(none)
declare i32 @llvm.smin.i32(i32, i32) #3

attributes #0 = { mustprogress nofree norecurse nosync nounwind willreturn memory(none) }
attributes #1 = { nofree norecurse nosync nounwind memory(none) }
attributes #2 = { mustprogress nocallback nofree nounwind willreturn memory(argmem: read) }
attributes #3 = { nocallback nofree nosync nounwind speculatable willreturn memory(none) }