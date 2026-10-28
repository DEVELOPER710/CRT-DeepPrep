// Question bank. Add your own: copy a question object, give it a new unique id.
// level: 1 = easy, 2 = medium, 3 = hard. "answer" is the index (starting at 0) of the correct option.
// "socratic" are guiding questions shown one at a time (Socratic mode) instead of the hint.
const TOPICS = [
  {
    id: "python", name: "Python basics",
    questions: [
      { id: "py1", level: 1, q: "What does print(type(3/2)) show in Python 3?",
        options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "An error"], answer: 1,
        hint: "Think about what the / operator does compared with //.",
        socratic: ["What does 3/2 evaluate to: 1 or 1.5?", "Which Python type stores a number with a decimal part?"],
        explain: "In Python 3, / always gives a float, even when both operands are integers. Use // for floor division." },
      { id: "py2", level: 1, q: "What is len([1, 2, [3, 4]])?",
        options: ["2", "3", "4", "5"], answer: 1,
        hint: "Count the items directly inside the outer list.",
        socratic: ["How many comma-separated items are at the outer level?", "Does len() look inside a nested list?"],
        explain: "The outer list has three items: 1, 2 and the inner list [3, 4]. len() counts only top-level items." },
      { id: "py3", level: 2, q: "If s = 'DeepPrep', what is s[1:4]?",
        options: ["'Dee'", "'eep'", "'eepP'", "'Deep'"], answer: 1,
        hint: "Indexing starts at 0 and the end index is not included.",
        socratic: ["Which character is at index 1?", "Does a slice include the character at its end index?"],
        explain: "Index 1 is 'e' and the slice stops before index 4, so you get indexes 1, 2, 3: 'eep'." },
      { id: "py4", level: 3, q: "def f(x, l=[]):\n    l.append(x)\n    return l\n\nAfter f(1) and then f(2), what does the second call return?",
        options: ["[2]", "[1, 2]", "[1]", "An error"], answer: 1,
        hint: "When is a default argument created: on each call or once?",
        socratic: ["When does Python evaluate the default value []?", "If the same list object is reused, what is already inside it at the second call?"],
        explain: "Default values are created once, when the function is defined. Both calls share the same list, so it grows to [1, 2]." }
    ]
  },
  {
    id: "ds", name: "Data structures",
    questions: [
      { id: "ds1", level: 1, q: "Which data structure follows Last In, First Out (LIFO)?",
        options: ["Queue", "Stack", "Array", "Linked list"], answer: 1,
        hint: "Picture a pile of plates.",
        socratic: ["Which plate do you take first from a pile?", "Which structure has push and pop at the same end?"],
        explain: "A stack adds and removes from the same end, so the most recent item leaves first." },
      { id: "ds2", level: 1, q: "What is the average time to look up a key in a hash table?",
        options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"], answer: 2,
        hint: "The hash function jumps straight to a position.",
        socratic: ["Does a lookup need to scan every element?", "What does the hash function compute from the key?"],
        explain: "A good hash function maps the key to a bucket directly, giving constant time on average." },
      { id: "ds3", level: 2, q: "Binary search only works correctly if the data is...",
        options: ["Unique", "Sorted", "Stored in a linked list", "Numeric"], answer: 1,
        hint: "Why can we throw away half of the data after one comparison?",
        socratic: ["After comparing with the middle, how do you know which half to drop?", "What would break if the data were in random order?"],
        explain: "Discarding half relies on order: everything on one side is smaller, the other side larger." },
      { id: "ds4", level: 3, q: "What is the worst-case time complexity of quicksort?",
        options: ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"], answer: 2,
        hint: "Think about the worst possible pivot choice every time.",
        socratic: ["What happens to the split if the pivot is always the smallest element?", "How many levels of recursion does that create?"],
        explain: "A consistently bad pivot splits the array into sizes n-1 and 0, giving n levels of n work each: O(n^2)." }
    ]
  },
  {
    id: "c", name: "C programming",
    questions: [
      { id: "c1", level: 1, q: "Which operator gives the address of a variable in C?",
        options: ["*", "&", "->", "%"], answer: 1,
        hint: "It is the one you use inside scanf.",
        socratic: ["What does scanf need to store a value into your variable?", "Which symbol do you put before the variable name there?"],
        explain: "& is the address-of operator. * dereferences a pointer, the opposite direction." },
      { id: "c2", level: 1, q: "On most modern systems, sizeof(int) is...",
        options: ["1 byte", "2 bytes", "4 bytes", "8 bytes"], answer: 2,
        hint: "32 bits is how many bytes?",
        socratic: ["How many bits are in one byte?", "How many bits does a typical int use today?"],
        explain: "Most current compilers use 32-bit ints, which is 4 bytes. The C standard only guarantees a minimum." },
      { id: "c3", level: 2, q: "int x = 10; printf(\"%d\", x / 3); prints...",
        options: ["3.33", "3", "4", "3.0"], answer: 1,
        hint: "Both operands are integers.",
        socratic: ["What types are x and 3?", "What happens to the fractional part in integer division?"],
        explain: "Integer division truncates toward zero, so 10 / 3 is 3." },
      { id: "c4", level: 3, q: "Given int arr[5], arr[2] is the same as...",
        options: ["*(arr + 2)", "&arr + 2", "*arr + 2", "arr(2)"], answer: 0,
        hint: "An array name usually decays to a pointer to its first element.",
        socratic: ["What does arr + 2 mean for a pointer to int?", "How do you read the value at that address?"],
        explain: "arr + 2 moves two elements forward and * reads the value there. arr[i] is defined as *(arr + i)." }
    ]
  }
];
