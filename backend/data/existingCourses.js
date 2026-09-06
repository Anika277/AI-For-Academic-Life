// Hardcoded corpus of existing AUST CSE courses used for the Overlap Checker.
// Real syllabi would be pulled from a curriculum database; for the hackathon
// MVP we hand-author a small representative set (per the locked scope: no
// PDF parsing, no embeddings/vector DB — Grok compares these directly via prompt).
//
// Keep entries short: only code, title, and a compact topic/CLO summary.
// Grok doesn't need the full 20-section OBE doc to judge overlap — just
// enough signal to compare subject matter.

export const existingCourses = [
  {
    code: "CSE 3117",
    title: "Microprocessors and Microcontrollers",
    topics:
      "8086 architecture, addressing modes, assembly programming, interrupts, " +
      "8051 microcontroller architecture, timers, serial communication, ADC/DAC interfacing, " +
      "memory-mapped I/O, embedded C basics.",
    clos:
      "Explain microprocessor/microcontroller architecture; write and debug assembly programs; " +
      "design simple interrupt-driven embedded systems.",
  },
  {
    code: "CSE 3211",
    title: "Computer Networks",
    topics:
      "OSI/TCP-IP models, physical and data link layer, routing algorithms, " +
      "transport layer protocols (TCP/UDP), congestion control, application layer protocols (HTTP, DNS, SMTP), " +
      "basic network security, subnetting.",
    clos:
      "Explain layered network architecture; analyze routing and congestion control algorithms; " +
      "design simple subnetted network topologies.",
  },
  {
    code: "CSE 3200",
    title: "Software Development V (Group Project)",
    topics:
      "Full-stack web application development, requirement gathering, agile/scrum workflow, " +
      "database design, REST API development, deployment, version control, team-based software delivery.",
    clos:
      "Gather and analyze software requirements; design and implement a full-stack application; " +
      "work effectively in a team using agile practices.",
  },
  {
    code: "CSE 3521",
    title: "Artificial Intelligence",
    topics:
      "Search algorithms (BFS, DFS, A*, minimax), knowledge representation, propositional/predicate logic, " +
      "planning, probabilistic reasoning, basic machine learning concepts, intelligent agents.",
    clos:
      "Apply search and knowledge-representation techniques to AI problems; design intelligent agents; " +
      "evaluate reasoning under uncertainty.",
  },
  {
    code: "CSE 3411",
    title: "Database Systems II",
    topics:
      "Advanced SQL, query optimization, transaction management, concurrency control, " +
      "distributed databases, NoSQL systems, indexing strategies, database security.",
    clos:
      "Design optimized database schemas; implement transaction and concurrency control; " +
      "evaluate NoSQL vs relational trade-offs.",
  },
  {
    code: "CSE 3611",
    title: "Compiler Design",
    topics:
      "Lexical analysis, parsing (top-down/bottom-up), syntax-directed translation, " +
      "intermediate code generation, symbol tables, code optimization, runtime environments.",
    clos:
      "Implement lexical analyzers and parsers; generate intermediate code; " +
      "apply basic optimization techniques to compiler output.",
  },
  {
    code: "CSE 3711",
    title: "Operating Systems",
    topics:
      "Process management, CPU scheduling (FCFS, SJF, SRTN, Round Robin), memory management, " +
      "paging/segmentation, deadlock handling, file systems, synchronization (semaphores, mutexes).",
    clos:
      "Analyze and implement CPU scheduling algorithms; design memory management schemes; " +
      "apply synchronization primitives to avoid race conditions and deadlock.",
  },
  {
    code: "CSE 3811",
    title: "Machine Learning",
    topics:
      "Supervised/unsupervised learning, regression, classification (SVM, decision trees), " +
      "neural network fundamentals, model evaluation (cross-validation, precision/recall), " +
      "overfitting and regularization, clustering.",
    clos:
      "Implement and evaluate supervised/unsupervised learning models; select appropriate algorithms " +
      "for a given problem; diagnose and mitigate overfitting.",
  },
];