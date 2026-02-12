#!/usr/bin/env bash
# RAG load test – run N queries with C concurrent workers.
# Usage: ./load-test.sh [concurrency] [num_queries] [query]
# Example: ./load-test.sh 5 20 "What is RAG?"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONCURRENCY="${1:-5}"
NUM_QUERIES="${2:-20}"
QUERY="${3:-What is RAG?}"
OUTPUT_DIR="${RAG_DIR}/.load-test"
RESULTS_FILE="${OUTPUT_DIR}/results.txt"

mkdir -p "$OUTPUT_DIR"
: > "$RESULTS_FILE"

echo "RAG Load Test: concurrency=$CONCURRENCY, queries=$NUM_QUERIES, question=\"$QUERY\""
echo "Output: $OUTPUT_DIR"
echo ""

run_one() {
  local start end
  start=$(date +%s.%N)
  if python3 "$RAG_DIR/rag.py" query "$QUERY" --no-cache 2>/dev/null | tail -1 > /dev/null; then
    end=$(date +%s.%N)
    echo "ok $start $end"
  else
    echo "fail $start $(date +%s.%N)"
  fi
}

export -f run_one
export RAG_DIR QUERY RESULTS_FILE

# Run queries in parallel batches
for ((i=0; i<NUM_QUERIES; i+=CONCURRENCY)); do
  batch=$((NUM_QUERIES - i))
  batch=$((batch < CONCURRENCY ? batch : CONCURRENCY))
  for ((j=0; j<batch; j++)); do
    run_one >> "$RESULTS_FILE" &
  done
  wait
done

# Summarize
ok=$(grep -c "^ok " "$RESULTS_FILE" 2>/dev/null || echo 0)
fail=$(grep -c "^fail " "$RESULTS_FILE" 2>/dev/null || echo 0)
total=$((ok + fail))

if [ "$ok" -gt 0 ]; then
  latencies=$(grep "^ok " "$RESULTS_FILE" | awk '{print $3-$2}' | sort -n)
  min=$(echo "$latencies" | head -1)
  max=$(echo "$latencies" | tail -1)
  mean=$(echo "$latencies" | awk '{s+=$1; n++} END {print (n>0 ? s/n : 0)}')
  p95_idx=$(echo "$ok" | awk '{n=int($1*0.95); print (n>0?n:1)}')
  p95=$(echo "$latencies" | sed -n "${p95_idx}p")
  echo ""
  echo "Results: $ok ok, $fail fail (total $total)"
  echo "Latency (s): min=$min max=$max mean=$mean p95=$p95"
else
  echo ""
  echo "Results: 0 ok, $fail fail (total $total)"
fi
