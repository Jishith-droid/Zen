; ModuleID = 'test.ll'
source_filename = "test.ll"

@t0 = local_unnamed_addr constant i32 999999
@t2 = local_unnamed_addr global [5 x i32] zeroinitializer
@.fmt_int = private constant [4 x i8] c"%d\0A\00"

; Function Attrs: nofree nounwind
declare noundef i32 @printf(ptr noundef readonly captures(none), ...) local_unnamed_addr #0

; Function Attrs: nofree nounwind
declare noundef i32 @fflush(ptr noundef captures(none)) local_unnamed_addr #0

; Function Attrs: nofree nounwind
define void @screen_int(i32 %x) local_unnamed_addr #0 {
entry:
  %0 = tail call i32 (ptr, ...) @printf(ptr nonnull dereferenceable(1) @.fmt_int, i32 %x)
  %1 = tail call i32 @fflush(ptr null)
  ret void
}

; Function Attrs: nofree nounwind
define void @findMax(i32 %t3) local_unnamed_addr #0 {
entry:
  %t6 = load i32, ptr @t2, align 16
  %t115 = icmp sgt i32 %t3, 1
  br i1 %t115, label %loopBody1, label %loopEnd2

loopBody1:                                        ; preds = %entry, %loopBody1
  %t8.07 = phi i32 [ %t21, %loopBody1 ], [ 1, %entry ]
  %t4.06 = phi i32 [ %spec.select, %loopBody1 ], [ %t6, %entry ]
  %0 = zext nneg i32 %t8.07 to i64
  %t13 = getelementptr [5 x i32], ptr @t2, i64 0, i64 %0
  %t14 = load i32, ptr %t13, align 4
  %spec.select = tail call i32 @llvm.smax.i32(i32 %t14, i32 %t4.06)
  %t21 = add nuw nsw i32 %t8.07, 1
  %t11 = icmp slt i32 %t21, %t3
  br i1 %t11, label %loopBody1, label %loopEnd2

loopEnd2:                                         ; preds = %loopBody1, %entry
  %t4.0.lcssa = phi i32 [ %t6, %entry ], [ %spec.select, %loopBody1 ]
  %1 = tail call i32 (ptr, ...) @printf(ptr nonnull dereferenceable(1) @.fmt_int, i32 %t4.0.lcssa)
  %2 = tail call i32 @fflush(ptr null)
  ret void
}

; Function Attrs: mustprogress nofree norecurse nosync nounwind willreturn memory(none)
define void @main() local_unnamed_addr #1 {
entry:
  ret void
}

; Function Attrs: nocallback nofree nosync nounwind speculatable willreturn memory(none)
declare i32 @llvm.smax.i32(i32, i32) #2

attributes #0 = { nofree nounwind }
attributes #1 = { mustprogress nofree norecurse nosync nounwind willreturn memory(none) }
attributes #2 = { nocallback nofree nosync nounwind speculatable willreturn memory(none) }
