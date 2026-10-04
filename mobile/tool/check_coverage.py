"""Fail CI if aggregate authored Dart line coverage is below 80%."""
from pathlib import Path
import sys

def coverage(path: Path) -> tuple[int, int]:
    hit = total = 0
    include = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("SF:"):
            source = line[3:].replace("\\", "/")
            include = not source.endswith((".g.dart", ".freezed.dart"))
        elif include and line.startswith("DA:"):
            total += 1
            hit += int(int(line.split(",")[1]) > 0)
    return hit, total

if __name__ == "__main__":
    hits, lines = coverage(Path(sys.argv[1] if len(sys.argv) > 1 else "coverage/lcov.info"))
    ratio = hits / lines if lines else 0
    sys.stdout.write(f"Authored Dart coverage: {ratio:.1%} ({hits}/{lines})\n")
    sys.exit(0 if ratio >= .8 else 1)
