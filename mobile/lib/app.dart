import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/router.dart';
import 'core/theme/theme.dart';
import 'shared/providers/providers.dart';
import 'shared/widgets/widgets.dart';

class PharasPayApp extends ConsumerStatefulWidget {
  const PharasPayApp({super.key});
  @override
  ConsumerState<PharasPayApp> createState() => _AppState();
}

class _AppState extends ConsumerState<PharasPayApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(authProvider.notifier).resumed();
    }
  }

  @override
  Widget build(BuildContext context) {
    final trusted = ref.watch(securityProvider);
    return MaterialApp.router(
        title: 'PharasPay',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.make(Brightness.light),
        darkTheme: AppTheme.make(Brightness.dark),
        themeMode: ref.watch(themeProvider),
        locale: Locale(ref.watch(languageProvider)),
        supportedLocales: const [Locale('en'), Locale('hi'), Locale('ta')],
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        routerConfig: ref.watch(routerProvider),
        builder: (context, child) => trusted.when(
              loading: () => const Scaffold(
                  body: SafeArea(
                      child: Padding(
                          padding: EdgeInsets.all(24), child: Skeleton()))),
              error: (_, __) => const Scaffold(
                  body: Center(
                      child: Text('Device security could not be verified.'))),
              data: (allowed) => allowed
                  ? Listener(
                      onPointerDown: (_) {
                        if (ref.read(authProvider).valueOrNull == true) {
                          ref.read(authProvider.notifier).touch();
                        }
                      },
                      child: Focus(
                          onKeyEvent: (_, __) {
                            if (ref.read(authProvider).valueOrNull == true) {
                              ref.read(authProvider.notifier).touch();
                            }
                            return KeyEventResult.ignored;
                          },
                          child: child!))
                  : const Scaffold(
                      body: Center(
                          child: Text(
                              'This device does not meet security requirements.'))),
            ));
  }
}
