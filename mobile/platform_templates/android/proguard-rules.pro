# Flutter plugins are registered reflectively. Retain JNI entry points.
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keepclasseswithmembernames class * { native <methods>; }
-keepattributes Signature,InnerClasses,EnclosingMethod,*Annotation*
