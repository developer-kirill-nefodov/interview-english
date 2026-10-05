/** Algorithm patterns: the reusable ideas behind most interview problems. */
export interface Pattern {
  id: string;
  name: string;
  /** A one-sentence problem that calls for this pattern. */
  problem: string;
  /** Short answer for the flashcard. */
  answer: string;
  complexity: string;
  /** How a strong candidate would explain the approach out loud. */
  explain: string;
}

export const PATTERNS: Pattern[] = [
  {
    id: "hash-map",
    name: "Hash map lookup",
    problem: "Given an array and a target, find two numbers that add up to the target.",
    answer: "Store the numbers you've seen in a hash map and look up target minus the current number.",
    complexity: "O(n) time, O(n) space",
    explain:
      "The brute-force approach checks every pair, which is O(n squared). Instead, I'll go through the array once and keep a hash map from each value to its index. For every number, I check whether target minus that number is already in the map. If it is, I've found the pair. That's O(n) time and O(n) extra space.",
  },
  {
    id: "two-pointers",
    name: "Two pointers",
    problem: "Check whether a string is a palindrome, ignoring punctuation.",
    answer: "One pointer at each end; skip non-letters, compare, move both toward the middle.",
    complexity: "O(n) time, O(1) space",
    explain:
      "I could build a cleaned, reversed copy of the string and compare, but that needs extra memory. Instead, I'll use two pointers, one at the start and one at the end. I skip characters that aren't letters or digits, compare the two characters in lowercase, and move both pointers toward the middle. If any pair doesn't match, it's not a palindrome. This is O(n) time and constant space, because I don't build a new string.",
  },
  {
    id: "sliding-window",
    name: "Sliding window",
    problem: "Find the length of the longest substring without repeating characters.",
    answer: "Grow the window on the right; when a character repeats, move the left edge past its last position.",
    complexity: "O(n) time, O(k) space",
    explain:
      "Checking every substring would be O(n squared) or worse. Instead, I'll keep a window between a left and a right pointer that never contains duplicates. I move the right pointer one step at a time and remember the last index of each character in a map. If the new character is already inside the window, I move the left pointer just past its previous position. The answer is the largest window I see. Each pointer moves at most n times, so it's O(n) time, and the map takes O(k) space for k distinct characters.",
  },
  {
    id: "stack",
    name: "Stack",
    problem: "Check whether the brackets in a string are balanced.",
    answer: "Push opening brackets; on a closing bracket, pop and check that it matches.",
    complexity: "O(n) time, O(n) space",
    explain:
      "Just counting brackets isn't enough, because the order matters: a closing bracket must match the last unclosed one. Instead of counting, I'll use a stack. I push every opening bracket. When I see a closing bracket, I pop from the stack and check that the types match. At the end, the stack must be empty. It's O(n) time and O(n) space in the worst case.",
  },
  {
    id: "sort-sweep",
    name: "Sort, then sweep",
    problem: "Merge all overlapping intervals.",
    answer: "Sort by start, then walk through and extend the last merged interval when they overlap.",
    complexity: "O(n log n) time",
    explain:
      "Comparing every pair of intervals would be O(n squared). Instead, I'll first sort the intervals by their start. After sorting, overlapping intervals are next to each other. I go through them and compare each one with the last interval in my result: if it starts before the last one ends, I extend the end; otherwise, I add it as a new interval. Sorting dominates, so it's O(n log n) time, plus O(n) space for the result.",
  },
  {
    id: "binary-search",
    name: "Binary search",
    problem: "Find the position of a number in a sorted array.",
    answer: "Compare with the middle element and discard half of the range each step.",
    complexity: "O(log n) time",
    explain:
      "A linear scan works in O(n), but since the array is sorted, we can do better with binary search. I look at the middle element: if it's the target, I'm done; if it's smaller, the target must be in the right half, otherwise in the left half. Each step cuts the range in half, so it's O(log n). It uses O(1) extra space. I need to be careful with the boundaries to avoid an off-by-one error.",
  },
  {
    id: "kadane",
    name: "Running best (Kadane)",
    problem: "Find the largest sum of a contiguous subarray.",
    answer: "Keep a running sum; restart it when it would only hurt; track the best sum seen.",
    complexity: "O(n) time, O(1) space",
    explain:
      "Checking every subarray would be O(n squared). A better idea: at each position, the best subarray ending here either extends the previous one or starts fresh at this element. So I keep a running sum: current equals the maximum of the number itself and current plus the number. I also track the best value I've seen. That's one pass, O(n) time and O(1) space.",
  },
  {
    id: "bfs",
    name: "Breadth-first search",
    problem: "Find the shortest path between two cells in a grid with walls.",
    answer: "BFS from the start with a queue; the first time you reach the target is the shortest path.",
    complexity: "O(rows × cols) time",
    explain:
      "A depth-first search would find a path, but not necessarily the shortest one. Instead, since all moves have the same cost, breadth-first search gives the shortest path. I put the start cell in a queue and explore neighbors level by level, marking cells as visited. The first time I reach the target, the number of levels is the shortest distance. Every cell is visited at most once, so it's linear in the size of the grid. The queue and the visited set take O(rows times cols) memory.",
  },
  {
    id: "dfs",
    name: "Depth-first search / flood fill",
    problem: "Count the number of islands in a grid of land and water.",
    answer: "For each unvisited land cell, start a DFS that marks the whole island; count the starts.",
    complexity: "O(rows × cols) time",
    explain:
      "The naive idea of looking at each cell on its own doesn't work, because an island can have any shape. Instead, I'll scan the grid. When I find a land cell that I haven't visited, that's a new island, so I increase the counter and run a depth-first search from it to mark all connected land as visited. In the end, the counter is the number of islands. Each cell is processed a constant number of times, so it's O(rows times cols) time, and the recursion stack can take that much space in the worst case.",
  },
  {
    id: "heap",
    name: "Heap",
    problem: "Find the k largest numbers in a big array.",
    answer: "Keep a min-heap of size k; push each number and pop the smallest when the heap grows past k.",
    complexity: "O(n log k) time, O(k) space",
    explain:
      "Sorting the whole array would be O(n log n). Instead, I keep a min-heap with at most k elements. For each number, I push it, and if the heap has more than k elements, I remove the smallest. At the end, the heap contains the k largest. That's O(n log k) time and O(k) space, which is better when k is small.",
  },
  {
    id: "prefix-sum",
    name: "Prefix sums",
    problem: "Answer many queries: what is the sum of the elements between index i and j?",
    answer: "Precompute prefix sums once; each query is prefix[j + 1] minus prefix[i].",
    complexity: "O(n) setup, O(1) per query",
    explain:
      "If we recalculated every query, it would be O(n) each time. Instead, I precompute an array where each position stores the sum of everything before it. Then the sum from i to j is just the difference of two prefix values. Setup is O(n) time and O(n) space, and each query is O(1).",
  },
  {
    id: "group-by-key",
    name: "Group by a canonical key",
    problem: "Group words that are anagrams of each other.",
    answer: "Use the sorted letters of each word as a key in a map from key to list of words.",
    complexity: "O(n · k log k) time",
    explain:
      "Comparing every pair of words would be O(n squared). Instead, I use the fact that anagrams have the same letters: if I sort the letters of each word, all anagrams get the same key. I use a map from that key to a list of words and add each word to its group. Sorting each word costs k log k, so the total is O(n times k log k) time, and the map takes O(n times k) space.",
  },
  {
    id: "frequency",
    name: "Frequency counter",
    problem: "Check whether two strings are anagrams.",
    answer: "Count each character in the first string, subtract counts for the second, check all are zero.",
    complexity: "O(n) time",
    explain:
      "Sorting both strings and comparing them works in O(n log n), but counting is better. Two strings are anagrams if every character appears the same number of times. I count characters of the first string in a map, then go through the second string and decrease the counts. If a count goes below zero or the lengths differ, they're not anagrams. That's linear time, and the map takes space proportional to the number of distinct characters.",
  },
  {
    id: "fast-slow",
    name: "Fast and slow pointers",
    problem: "Detect whether a linked list has a cycle.",
    answer: "Move one pointer one step and another two steps; if they ever meet, there's a cycle.",
    complexity: "O(n) time, O(1) space",
    explain:
      "I could store visited nodes in a set, but that uses O(n) memory. A better way is Floyd's algorithm: a slow pointer moves one step and a fast pointer moves two steps. If there's a cycle, the fast pointer eventually catches up with the slow one. If the fast pointer reaches the end, there's no cycle. It's O(n) time and O(1) space.",
  },
  {
    id: "backtracking",
    name: "Backtracking",
    problem: "Generate all subsets of a set of numbers.",
    answer: "For each element, branch twice: include it or skip it; record the subset at the end.",
    complexity: "O(2ⁿ · n) time",
    explain:
      "Every element is either in a subset or not, so there are 2 to the n subsets. I'll write a recursive function that, for each index, first includes the element and recurses, then removes it and recurses again. When I reach the end of the array, I save a copy of the current subset. The output itself is exponential, so we can't do better than that; apart from the output, the recursion uses O(n) space.",
  },
];

export const STORY_PROMPTS = [
  {
    id: "bug",
    prompt: "Tell me about the most difficult bug you've fixed.",
    tr: { ru: "Самый сложный баг, который вы исправили.", uk: "Найскладніший баг, який ви виправили." },
  },
  {
    id: "conflict",
    prompt: "Tell me about a time you disagreed with a colleague.",
    tr: { ru: "Случай, когда вы не согласились с коллегой.", uk: "Випадок, коли ви не погодилися з колегою." },
  },
  {
    id: "mistake",
    prompt: "Tell me about a mistake you made and what you learned.",
    tr: { ru: "Ошибка, которую вы допустили, и чему она вас научила.", uk: "Помилка, якої ви припустилися, і чого вона вас навчила." },
  },
  {
    id: "proud",
    prompt: "What project are you most proud of, and why?",
    tr: { ru: "Каким проектом вы гордитесь больше всего и почему?", uk: "Яким проєктом ви пишаєтеся найбільше і чому?" },
  },
  {
    id: "deadline",
    prompt: "Tell me about a time you had to deliver under a tight deadline.",
    tr: { ru: "Случай, когда нужно было успеть в сжатые сроки.", uk: "Випадок, коли треба було встигнути в стислі терміни." },
  },
  {
    id: "learn",
    prompt: "Tell me about a time you had to learn something new quickly.",
    tr: { ru: "Случай, когда пришлось быстро освоить что-то новое.", uk: "Випадок, коли довелося швидко освоїти щось нове." },
  },
];
