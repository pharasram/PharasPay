import 'dart:io';

void main(List<String> arguments) {
  final path = arguments.isEmpty ? 'coverage/lcov.info' : arguments.first;
  var hit = 0;
  var total = 0;
  var include = false;
  for (final line in File(path).readAsLinesSync()) {
    if (line.startsWith('SF:')) {
      final source = line.substring(3).replaceAll(r'\', '/');
      include =
          !source.endsWith('.g.dart') && !source.endsWith('.freezed.dart');
    } else if (include && line.startsWith('DA:')) {
      total++;
      if (int.parse(line.split(',')[1]) > 0) {
        hit++;
      }
    }
  }
  final ratio = total == 0 ? 0.0 : hit / total;
  stdout.writeln(
      'Authored Dart coverage: ${(ratio * 100).toStringAsFixed(1)}% ($hit/$total)');
  exitCode = ratio >= .8 ? 0 : 1;
}
