#!/bin/bash
# usage: tools/d6batch.sh jobs.txt outdir   (each line: label|mode|players|games|cfgjson|seedBase|flags) ; runs 2 at a time
cd "$(dirname "$0")/.."
OUT=$2; mkdir -p $OUT
run1() { IFS='|' read -r label mode n games cfg seed flags <<< "$1"; node tools/d6.js $mode $n $games "$cfg" ${seed:-30000} "$flags" > "$OUT/$label.txt" 2>&1; }
export -f run1; export OUT
grep -v '^#' $1 | xargs -d '\n' -P2 -I{} bash -c 'run1 "$@"' _ {}
