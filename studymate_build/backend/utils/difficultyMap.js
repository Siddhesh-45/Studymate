// ─────────────────────────────────────────────────────────────────────────────
// utils/difficultyMap.js
//
// Maps topic keywords → difficulty level ('Easy' | 'Medium' | 'Hard')
//
// HOW IT WORKS:
//   1. EXACT MATCH — check if the full topic title matches a known keyword
//   2. PARTIAL MATCH — check if any keyword appears inside the topic title
//   3. DEFAULT — if nothing matches, return 'Medium'
//
// HOW TO ADD MORE:
//   Just add a new line in the correct difficulty section below.
//   Keys are case-insensitive — "Arrays", "arrays", "ARRAYS" all match.
//
// CUSTOM TOPICS (non-DSA):
//   Topics that don't match anything here get 'Medium' by default.
//   That is intentional — Medium is a safe middle-ground for unknown topics.
// ─────────────────────────────────────────────────────────────────────────────

// ── Keyword → Difficulty map ──────────────────────────────────────────────────
// Each keyword is checked against the topic TITLE (case-insensitive).
// More specific keywords should come first within each section.

const DIFFICULTY_KEYWORDS = {

  // ── EASY ────────────────────────────────────────────────────────────────────
  // Foundational concepts — beginner can pick these up quickly
  Easy: [
    // Programming basics
    'variables', 'variable', 'data types', 'data type', 'operators', 'operator',
    'conditionals', 'conditional', 'if else', 'if-else', 'loops', 'loop',
    'for loop', 'while loop', 'do while', 'functions', 'function', 'methods', 'method',
    'recursion basics', 'intro', 'introduction', 'basics', 'overview', 'fundamentals',
    'getting started', 'hello world', 'setup', 'installation', 'environment',

    // DS basics
    'arrays', 'array', 'strings', 'string',
    'time complexity basics', 'big o basics',

    // Web / general concepts
    'html', 'css', 'selectors', 'flexbox', 'grid basics',
    'http basics', 'rest basics', 'json', 'xml',

    // Math
    'basic math', 'arithmetic', 'algebra basics', 'number theory basics',
  ],

  // ── MEDIUM ──────────────────────────────────────────────────────────────────
  // Requires understanding of Easy concepts — mid-tier difficulty
  Medium: [
    // Data structures
    'linked list', 'linkedlist', 'doubly linked', 'circular linked',
    'stack', 'queue', 'deque', 'priority queue', 'heap',
    'hash table', 'hashing', 'hashmap', 'hash map', 'dictionary',
    'binary search', 'sorting', 'merge sort', 'quick sort', 'insertion sort',
    'selection sort', 'bubble sort', 'two pointer', 'sliding window',

    // Algorithms
    'recursion', 'backtracking basics', 'divide and conquer',
    'greedy', 'greedy algorithm',
    'bit manipulation', 'bitwise',
    'modular arithmetic', 'number theory',

    // OOP / Design
    'object oriented', 'oop', 'classes', 'inheritance', 'polymorphism',
    'encapsulation', 'abstraction', 'interfaces', 'generics',
    'design patterns basics', 'solid principles',

    // Web
    'react basics', 'vue basics', 'angular basics',
    'node basics', 'express basics', 'api design', 'rest api',
    'sql basics', 'database basics', 'nosql basics', 'mongodb basics',
    'authentication basics', 'jwt basics',

    // Systems
    'process', 'threads', 'concurrency basics', 'mutex', 'semaphore',
    'memory management basics', 'pointers',
  ],

  // ── HARD ────────────────────────────────────────────────────────────────────
  // Requires deep understanding — advanced / interview-level topics
  Hard: [
    // Advanced DS
    'tree', 'trees', 'binary tree', 'bst', 'avl', 'red black tree',
    'segment tree', 'fenwick tree', 'trie', 'suffix tree', 'b tree',
    'graph', 'graphs', 'directed graph', 'weighted graph',
    'adjacency matrix', 'adjacency list',

    // Hard Algorithms
    'dynamic programming', 'dp', 'memoization advanced', 'tabulation',
    'bfs', 'dfs', 'dijkstra', 'bellman ford', 'floyd warshall',
    'topological sort', 'minimum spanning tree', 'mst', 'kruskal', 'prim',
    'union find', 'disjoint set',
    'knapsack', 'longest common subsequence', 'lcs', 'edit distance',

    // Advanced concepts
    'nfa', 'dfa', 'automata', 'turing machine',
    'np complete', 'np hard', 'complexity theory',
    'network flow', 'max flow', 'min cut',
    'cryptography', 'encryption advanced', 'rsa', 'aes',

    // Systems / Architecture
    'distributed systems', 'consistency', 'cap theorem', 'raft', 'paxos',
    'load balancing advanced', 'sharding', 'replication',
    'compiler design', 'parsing', 'lexer', 'parser',
    'operating system advanced', 'virtual memory', 'page replacement',
    'concurrency advanced', 'deadlock', 'race condition', 'lock free',

    // ML / AI
    'neural network', 'deep learning', 'backpropagation',
    'transformer', 'attention mechanism', 'bert', 'gpt',
    'reinforcement learning', 'support vector machine', 'svm',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// getDifficulty(topicTitle)
//
// Returns 'Easy' | 'Medium' | 'Hard'
//
// Algorithm:
//   1. Normalize title to lowercase
//   2. Check HARD keywords first (most specific / highest priority)
//   3. Then check EASY keywords
//   4. Default to MEDIUM if no match found
//      (Medium is the safest assumption for unknown topics)
// ─────────────────────────────────────────────────────────────────────────────
function getDifficulty(topicTitle) {
  if (!topicTitle || typeof topicTitle !== 'string') return 'Medium';

  const title = topicTitle.toLowerCase().trim();

  // Check Hard first — most specific keywords live here
  for (const keyword of DIFFICULTY_KEYWORDS.Hard) {
    if (title.includes(keyword.toLowerCase())) return 'Hard';
  }

  // Check Easy
  for (const keyword of DIFFICULTY_KEYWORDS.Easy) {
    if (title.includes(keyword.toLowerCase())) return 'Easy';
  }

  // Check Medium
  for (const keyword of DIFFICULTY_KEYWORDS.Medium) {
    if (title.includes(keyword.toLowerCase())) return 'Medium';
  }

  // Default: Medium (safe assumption for custom / non-DSA topics)
  return 'Medium';
}

// ─────────────────────────────────────────────────────────────────────────────
// DIFFICULTY CONFIG
// Used by the scheduler to control topic-per-day limits
// ─────────────────────────────────────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
  Easy:   { maxTopicsPerDay: 3, color: '#22c55e'  },  // green  — lightweight
  Medium: { maxTopicsPerDay: 2, color: '#f59e0b'  },  // amber  — moderate
  Hard:   { maxTopicsPerDay: 1, color: '#ef4444'  },  // red    — cognitively heavy
};

// ─────────────────────────────────────────────────────────────────────────────
// DIFFICULTY ORDER — used for Easy → Medium → Hard sorting
// Lower number = scheduled first
// ─────────────────────────────────────────────────────────────────────────────
const DIFFICULTY_ORDER = { Easy: 1, Medium: 2, Hard: 3 };

module.exports = { getDifficulty, DIFFICULTY_CONFIG, DIFFICULTY_ORDER };
