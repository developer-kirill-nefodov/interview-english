import type { Tr } from "../lib/i18n";
export interface TestCase {
  args: unknown[];
  expected: unknown;
  /** Compare arrays ignoring order (deep, top-level only). */
  unordered?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: "easy" | "medium";
  fn: string;
  statement: string;
  tr: Tr;
  examples: string[];
  starter: string;
  tests: TestCase[];
  /** Good clarifying questions to ask before coding. */
  clarify: string[];
  hints: string[];
  /** Expected optimal complexity, used in offline feedback. */
  complexity: { time: string; space: string };
}

export const PROBLEMS: Problem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    fn: "twoSum",
    statement:
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. You may assume there is exactly one solution, and you may not use the same element twice.",
    tr: {
      ru: "Дан массив целых чисел nums и число target. Верните индексы двух чисел, сумма которых равна target. Решение ровно одно; один элемент нельзя использовать дважды.",
      uk: "Дано масив цілих чисел nums і число target. Поверніть індекси двох чисел, сума яких дорівнює target. Розв'язок рівно один; один елемент не можна використати двічі.",
    },
    examples: ["twoSum([2, 7, 11, 15], 9) → [0, 1]", "twoSum([3, 2, 4], 6) → [1, 2]"],
    starter: "function twoSum(nums, target) {\n  // your code here\n}\n",
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1], unordered: true },
      { args: [[3, 2, 4], 6], expected: [1, 2], unordered: true },
      { args: [[3, 3], 6], expected: [0, 1], unordered: true },
      { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], unordered: true },
    ],
    clarify: [
      "Can the array contain negative numbers or duplicates?",
      "Is there always exactly one solution?",
      "Does the order of the returned indices matter?",
    ],
    hints: [
      "The brute-force solution checks every pair — that's O(n²).",
      "For each number, what other number do you need? Can you look it up quickly?",
      "Store numbers you've already seen in a Map: value → index.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "easy",
    fn: "isValid",
    statement:
      "Given a string `s` containing only the characters `()[]{}`, return `true` if the brackets are balanced: every opening bracket is closed by a bracket of the same type in the correct order, and every closing bracket has a matching opening bracket.",
    tr: { ru: "Проверьте, что скобки в строке правильно сбалансированы.", uk: "Перевірте, що дужки в рядку правильно збалансовані." },
    examples: ['isValid("()[]{}") → true', 'isValid("(]") → false', 'isValid("([])") → true'],
    starter: "function isValid(s) {\n  // your code here\n}\n",
    tests: [
      { args: ["()"], expected: true },
      { args: ["()[]{}"], expected: true },
      { args: ["(]"], expected: false },
      { args: ["([)]"], expected: false },
      { args: ["{[]}"], expected: true },
      { args: [""], expected: true },
      { args: ["(("], expected: false },
    ],
    clarify: ["Is an empty string considered valid?", "Can the string contain any other characters?"],
    hints: [
      "The last bracket that was opened must be the first one to be closed.",
      "Which data structure works as “last in, first out”?",
      "Push opening brackets onto a stack; on a closing bracket, pop and compare.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
  },
  {
    id: "palindrome",
    title: "Valid Palindrome",
    difficulty: "easy",
    fn: "isPalindrome",
    statement:
      "Return `true` if the string `s` reads the same forward and backward after converting all letters to lowercase and removing all non-alphanumeric characters.",
    tr: {
      ru: "Проверьте, является ли строка палиндромом, игнорируя регистр и все символы, кроме букв и цифр.",
      uk: "Перевірте, чи є рядок паліндромом, ігноруючи регістр і всі символи, крім літер і цифр.",
    },
    examples: ['isPalindrome("A man, a plan, a canal: Panama") → true', 'isPalindrome("race a car") → false'],
    starter: "function isPalindrome(s) {\n  // your code here\n}\n",
    tests: [
      { args: ["A man, a plan, a canal: Panama"], expected: true },
      { args: ["race a car"], expected: false },
      { args: [" "], expected: true },
      { args: ["0P"], expected: false },
      { args: ["No 'x' in Nixon"], expected: true },
    ],
    clarify: ["Should digits count as characters?", "Is an empty string a palindrome?"],
    hints: [
      "You could clean the string and compare it with its reverse — that uses extra memory.",
      "Can you do it with two pointers moving toward the middle?",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
  },
  {
    id: "group-anagrams",
    title: "Group Anagrams",
    difficulty: "medium",
    fn: "groupAnagrams",
    statement:
      "Given an array of strings `words`, group the anagrams together. Return an array of groups; each group should be sorted alphabetically, and the order of the groups doesn't matter.",
    tr: {
      ru: "Сгруппируйте слова-анаграммы. Каждая группа отсортирована, порядок групп не важен.",
      uk: "Згрупуйте слова-анаграми. Кожна група відсортована, порядок груп не важливий.",
    },
    examples: ['groupAnagrams(["eat","tea","tan","ate","nat","bat"]) → [["ate","eat","tea"],["nat","tan"],["bat"]]'],
    starter: "function groupAnagrams(words) {\n  // your code here\n}\n",
    tests: [
      {
        args: [["eat", "tea", "tan", "ate", "nat", "bat"]],
        expected: [["ate", "eat", "tea"], ["nat", "tan"], ["bat"]],
        unordered: true,
      },
      { args: [[""]], expected: [[""]], unordered: true },
      { args: [["a"]], expected: [["a"]], unordered: true },
      { args: [["abc", "bca", "xyz"]], expected: [["abc", "bca"], ["xyz"]], unordered: true },
    ],
    clarify: ["Do the words contain only lowercase English letters?", "Does the order of the groups matter?", "How long can the words be?"],
    hints: [
      "Two words are anagrams if they have the same letters. What could be a common key for them?",
      "Sorting the letters of a word gives the same key for all its anagrams.",
      "Use a Map from the key to a list of words.",
    ],
    complexity: { time: "O(n · k log k)", space: "O(n · k)" },
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "medium",
    fn: "merge",
    statement:
      "Given an array of `intervals` where `intervals[i] = [start, end]`, merge all overlapping intervals and return the result sorted by start.",
    tr: {
      ru: "Объедините пересекающиеся интервалы и верните результат, отсортированный по началу.",
      uk: "Об'єднайте інтервали, що перетинаються, і поверніть результат, відсортований за початком.",
    },
    examples: ["merge([[1,3],[2,6],[8,10],[15,18]]) → [[1,6],[8,10],[15,18]]", "merge([[1,4],[4,5]]) → [[1,5]]"],
    starter: "function merge(intervals) {\n  // your code here\n}\n",
    tests: [
      {
        args: [
          [
            [1, 3],
            [2, 6],
            [8, 10],
            [15, 18],
          ],
        ],
        expected: [
          [1, 6],
          [8, 10],
          [15, 18],
        ],
      },
      {
        args: [
          [
            [1, 4],
            [4, 5],
          ],
        ],
        expected: [[1, 5]],
      },
      {
        args: [
          [
            [1, 4],
            [0, 4],
          ],
        ],
        expected: [[0, 4]],
      },
      {
        args: [
          [
            [1, 4],
            [2, 3],
          ],
        ],
        expected: [[1, 4]],
      },
      { args: [[]], expected: [] },
    ],
    clarify: [
      "Is the input already sorted?",
      "Do intervals that only touch, like [1,4] and [4,5], count as overlapping?",
      "Can I modify the input array?",
    ],
    hints: ["It's much easier if the intervals are sorted by start.", "After sorting, compare each interval with the last merged one."],
    complexity: { time: "O(n log n)", space: "O(n)" },
  },
  {
    id: "max-subarray",
    title: "Maximum Subarray",
    difficulty: "medium",
    fn: "maxSubArray",
    statement: "Given an integer array `nums`, find the contiguous subarray with the largest sum and return its sum.",
    tr: {
      ru: "Найдите непрерывный подмассив с максимальной суммой и верните эту сумму.",
      uk: "Знайдіть неперервний підмасив із максимальною сумою і поверніть цю суму.",
    },
    examples: ["maxSubArray([-2,1,-3,4,-1,2,1,-5,4]) → 6  // [4,-1,2,1]", "maxSubArray([-1]) → -1"],
    starter: "function maxSubArray(nums) {\n  // your code here\n}\n",
    tests: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1 },
      { args: [[5, 4, -1, 7, 8]], expected: 23 },
      { args: [[-3, -1, -2]], expected: -1 },
    ],
    clarify: ["Can all numbers be negative?", "Is the array guaranteed to be non-empty?", "Do I return the sum or the subarray itself?"],
    hints: [
      "Checking every subarray is O(n²) or worse.",
      "At each position: is it better to extend the current subarray or start a new one?",
      "This is Kadane's algorithm: keep a running sum and the best sum so far.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
  },
];

/** The steps of a live coding round, with phrases to say out loud at each step. */
export const CODING_STEPS = [
  {
    key: "clarify",
    title: "1. Clarify",
    goal: "Repeat the problem in your own words and ask 1–3 questions about edge cases.",
    phrases: [
      "Just to make sure I understand: …",
      "Can I assume that …?",
      "What should happen if the input is empty?",
      "Let me walk through the example to check.",
    ],
  },
  {
    key: "approach",
    title: "2. Approach",
    goal: "Say the brute-force idea first, then a better one. Agree on it before coding.",
    phrases: [
      "The most straightforward approach would be …, which is O(n²).",
      "We can do better by using a hash map / two pointers / sorting.",
      "The idea is to …",
      "Does that sound good before I start coding?",
    ],
  },
  {
    key: "code",
    title: "3. Code",
    goal: "Narrate what you write. Long silences are the most common mistake.",
    phrases: [
      "First, I'll create a … to store …",
      "Now I'm iterating over …",
      "Here I'm checking whether …",
      "I'll handle the edge case where …",
    ],
  },
  {
    key: "test",
    title: "4. Test",
    goal: "Walk through an example by hand, then edge cases. Run the tests.",
    phrases: [
      "Let me trace through the example.",
      "On the first iteration, i is 0, so …",
      "Let's also check an edge case, like an empty array.",
      "Oops, I see a bug here — I need to …",
    ],
  },
  {
    key: "complexity",
    title: "5. Complexity",
    goal: "State time and space complexity and explain why.",
    phrases: [
      "The time complexity is O(n), because we go through the array once.",
      "The space complexity is O(n) for the map in the worst case.",
      "If memory were a concern, we could …",
    ],
  },
] as const;
