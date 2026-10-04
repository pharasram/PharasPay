import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/auth_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/kyc/kyc_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/loan/loan_screens.dart';
import '../../features/repayment/repayment_screens.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/support/support_screen.dart';
import '../../shared/providers/providers.dart';
import 'package:flutter/foundation.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(authProvider, (_, __) => refresh.value++);
  ref.listen(onboardedProvider, (_, __) => refresh.value++);
  final router = GoRouter(
      initialLocation: '/home',
      refreshListenable: refresh,
      redirect: (_, state) {
        final path = state.uri.path;
        if (path == '/privacy') {
          return null;
        }
        if (!ref.read(onboardedProvider)) {
          return path == '/intro' ? null : '/intro';
        }
        final loggedIn = ref.read(authProvider).valueOrNull == true;
        final public = ['/login', '/register'].contains(path);
        if (!loggedIn && !public) {
          return '/login';
        }
        if (loggedIn && (public || path == '/intro')) {
          return '/home';
        }
        return null;
      },
      routes: [
        GoRoute(path: '/intro', builder: (_, __) => const OnboardingScreen()),
        GoRoute(path: '/login', builder: (_, __) => const AuthScreen()),
        GoRoute(
            path: '/register',
            builder: (_, __) => const AuthScreen(register: true)),
        GoRoute(path: '/home', builder: (_, __) => const DashboardScreen()),
        GoRoute(path: '/kyc', builder: (_, __) => const KycScreen()),
        GoRoute(path: '/apply', builder: (_, __) => const ApplyScreen()),
        GoRoute(path: '/offer', builder: (_, __) => const OfferScreen()),
        GoRoute(
            path: '/agreement', builder: (_, __) => const AgreementScreen()),
        GoRoute(path: '/status', builder: (_, __) => const LoanStatusScreen()),
        GoRoute(
            path: '/repayment', builder: (_, __) => const RepaymentScreen()),
        GoRoute(path: '/history', builder: (_, __) => const HistoryScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        GoRoute(path: '/support', builder: (_, __) => const SupportScreen()),
        GoRoute(path: '/privacy', builder: (_, __) => const PrivacyScreen()),
      ]);
  ref.onDispose(() {
    router.dispose();
    refresh.dispose();
  });
  return router;
});
