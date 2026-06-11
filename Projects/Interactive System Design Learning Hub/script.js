// script.js - Interactive Simulator, Quizzes, and Progression state

// --- LEARNING HUB MODULES DATABASE ---
const MODULES_DATA = {
  "load-balancer": {
    title: "Load Balancers",
    badge: "Traffic Management",
    notes: `
      <h4>Introduction</h4>
      <p>A <strong>Load Balancer (LB)</strong> acts as a reverse proxy that distributes network or application traffic across multiple servers. By doing so, it prevents any single server from becoming a bottleneck, improving overall system availability, reliability, and responsiveness.</p>
      
      <h4>How it Works</h4>
      <p>When clients send requests, they hit the Load Balancer first. The LB uses a predefined algorithm to evaluate the requests and direct them to an active backend server node.</p>
      
      <h4>Core Balancing Algorithms</h4>
      <ul>
        <li><strong>Round Robin</strong>: Requests are distributed sequentially across the server pool. Simple, but assumes all servers have equal capacity.</li>
        <li><strong>Random Selection</strong>: Distributes requests randomly. Surprisingly effective for large, uniform pools.</li>
        <li><strong>Least Connections</strong>: Directs traffic to the server with the fewest active sessions. Ideal for long-lived connections (like database connections or websocket channels).</li>
      </ul>

      <div class="tradeoff-grid">
        <div class="tradeoff-box pros">
          <h5>Advantages</h5>
          <p>Enables horizontal scaling, eliminates single point of failure (SPOF) when redundant LBs are used, and facilitates zero-downtime deployments.</p>
        </div>
        <div class="tradeoff-box cons">
          <h5>Trade-offs</h5>
          <p>Adds operational complexity, introduces a single entry bottleneck, and requires careful session persistence (sticky sessions) configuration.</p>
        </div>
      </div>
    `,
    quiz: [
      {
        q: "Which load balancing algorithm is best suited for application pools with varying session lengths?",
        options: ["Round Robin", "Least Connections", "IP Hashing", "Random Selection"],
        answer: 1,
        explain: "Least Connections evaluates active session loads in real-time, preventing servers from being overwhelmed by long-duration connections."
      },
      {
        q: "What is a major trade-off of using a Load Balancer in system architecture?",
        options: ["It reduces security", "It can become a Single Point of Failure (SPOF) if not clustered", "It prevents servers from shutting down", "It increases database size"],
        answer: 1,
        explain: "Because all client traffic routes through the load balancer, it represents a SPOF unless paired with active-passive redundancy clustering."
      },
      {
        q: "How does Round Robin distribute incoming connections?",
        options: ["Based on geographic location", "To the server with the highest CPU usage", "Sequentially across the active list of servers", "Randomly choosing any server"],
        answer: 2,
        explain: "Round Robin loops through the server array sequentially, directing each new request to the next server in line."
      }
    ],
    controls: `
      <label for="lb-algo">Routing Algorithm:</label>
      <select id="lb-algo">
        <option value="round-robin">Round Robin</option>
        <option value="random">Random Selection</option>
        <option value="least-conn">Least Connections</option>
      </select>
    `
  },
  "caching": {
    title: "Caching Systems",
    badge: "Speed & Memory",
    notes: `
      <h4>Introduction</h4>
      <p>A <strong>Cache</strong> is a high-speed, temporary data storage layer that stores subset data, typically in-memory (RAM), so that future requests for that data are served much faster than querying the database.</p>
      
      <h4>Cache Hit vs Cache Miss</h4>
      <ul>
        <li><strong>Cache Hit</strong>: The requested data is found in the cache. The request resolves almost instantly (e.g., &lt;5ms).</li>
        <li><strong>Cache Miss</strong>: The data is not found in the cache. The application must query the slower disk database, retrieve it, return it to the user, and write it into the cache for next time.</li>
      </ul>

      <h4>Cache Eviction Policies</h4>
      <p>As RAM is expensive and limited, caches must evict old entries. The most common eviction policy is <strong>Least Recently Used (LRU)</strong>, which deletes the items that haven't been accessed for the longest time.</p>

      <div class="tradeoff-grid">
        <div class="tradeoff-box pros">
          <h5>Advantages</h5>
          <p>Dramatically reduces database read loads, lowers latency, and boosts app scalability.</p>
        </div>
        <div class="tradeoff-box cons">
          <h5>Trade-offs</h5>
          <p>Risk of data inconsistency (stale cache) and increased RAM cost infrastructure.</p>
        </div>
      </div>
    `,
    quiz: [
      {
        q: "What does a Cache Miss indicate in a system query flow?",
        options: ["The cache is corrupted", "The requested data was successfully found in RAM", "The requested data was not found in cache and must be fetched from the database", "The network connection dropped"],
        answer: 2,
        explain: "A cache miss occurs when queried keys do not reside in cache memory, forcing the server to read from the primary database."
      },
      {
        q: "Which cache eviction strategy removes the item that has not been accessed for the longest time?",
        options: ["FIFO (First In First Out)", "LRU (Least Recently Used)", "LFU (Least Frequently Used)", "Random Eviction"],
        answer: 1,
        explain: "Least Recently Used (LRU) keeps track of read histories and evicts the entry that hasn't been accessed for the longest duration."
      },
      {
        q: "What is a critical architectural challenge when implementing cache?",
        options: ["Increasing write operations", "Maintaining cache invalidation and data consistency", "Lowering memory consumption", "Simplifying deployment structures"],
        answer: 1,
        explain: "Cache invalidation is notoriously difficult; keeping data in cache consistent with updates in the master database is a core challenge."
      }
    ],
    controls: `
      <label for="cache-key">Query ID (1 to 5):</label>
      <input type="number" id="cache-key" min="1" max="5" value="1">
    `
  },
  "databases": {
    title: "Databases & Sharding",
    badge: "Data Scale",
    notes: `
      <h4>Horizontal vs Vertical Scaling</h4>
      <p>Vertical scaling (adding more CPU/RAM to a single server) has physical limits. Databases must eventually scale horizontally (across multiple servers).</p>
      
      <h4>Database Sharding</h4>
      <p><strong>Sharding</strong> is a horizontal scaling technique where a large database is split into smaller, faster, and more manageable parts called shards. Each shard contains a subset of the data.</p>
      
      <h4>Sharding Strategies</h4>
      <ul>
        <li><strong>Range-Based Sharding</strong>: Splitting data by ranges of a key (e.g., user IDs 1-100 on Shard A, 101-200 on Shard B).</li>
        <li><strong>Hash-Based Sharding</strong>: Applying a hash function to the partition key (e.g., ID % Number of Shards) to distribute records evenly.</li>
      </ul>

      <div class="tradeoff-grid">
        <div class="tradeoff-box pros">
          <h5>Advantages</h5>
          <p>Overcomes hardware storage limits of a single machine, and isolates server failures to individual shards.</p>
        </div>
        <div class="tradeoff-box cons">
          <h5>Trade-offs</h5>
          <p>Extremely complex multi-shard joins, and difficult re-sharding operations when shards become unbalanced.</p>
        </div>
      </div>
    `,
    quiz: [
      {
        q: "What is Database Sharding?",
        options: ["Creating backups of all tables", "Splitting a database horizontally across multiple servers", "Encrypting database column keys", "Merging tables into a flat model"],
        answer: 1,
        explain: "Sharding divides rows of a database horizontally, distributing segments (shards) onto independent database hardware."
      },
      {
        q: "What hashing function distributes IDs evenly across 3 database shards?",
        options: ["ID % 3", "ID * 3", "ID / 3", "ID + 3"],
        answer: 0,
        explain: "Modulo division (ID % Shards) guarantees that data is mapped cyclically across the shards (0, 1, or 2), balancing the storage load."
      },
      {
        q: "Why are cross-shard joins avoided in sharded architectures?",
        options: ["They are security risks", "They trigger syntax errors", "They require querying multiple network-decoupled servers, severely impacting performance", "They double storage usage"],
        answer: 2,
        explain: "Since shards reside on different physical servers, joining data across shards requires slow network queries, killing performance."
      }
    ],
    controls: `
      <label for="db-user-id">Query User ID (1 to 999):</label>
      <input type="number" id="db-user-id" min="1" max="999" value="10">
    `
  },
  "cdn": {
    title: "Content Delivery Networks",
    badge: "Geographic Delivery",
    notes: `
      <h4>Introduction</h4>
      <p>A <strong>Content Delivery Network (CDN)</strong> is a geographically distributed group of servers (edge servers) that work together to provide fast delivery of static internet content (HTML, CSS, JS, images, videos).</p>
      
      <h4>Edge Servers and Origin</h4>
      <p>Instead of routing all global requests to a single Central Origin Server, a CDN directs users to the physically closest edge server, minimizing round-trip latency.</p>

      <div class="tradeoff-grid">
        <div class="tradeoff-box pros">
          <h5>Advantages</h5>
          <p>Drastically reduces load times globally, decreases origin bandwidth costs, and offers DDoS mitigation protection.</p>
        </div>
        <div class="tradeoff-box cons">
          <h5>Trade-offs</h5>
          <p>Potential file caching synchronization latency, and extra configuration cost layers.</p>
        </div>
      </div>
    `,
    quiz: [
      {
        q: "What is the primary objective of a Content Delivery Network?",
        options: ["To store primary user passwords", "To reduce latency by serving static assets from geographically close edge servers", "To run complex application computations", "To backup relational database logs"],
        answer: 1,
        explain: "CDNs cache copies of static files closer to users physically, avoiding round-trips to the central origin server."
      },
      {
        q: "What is the 'Origin Server' in a CDN setup?",
        options: ["The browser requesting files", "The database backup file", "The central server hosting the master version of content files", "A regional router"],
        answer: 2,
        explain: "The origin server is the primary web host where the original files are deployed; CDNs fetch from the Origin when cache expires."
      },
      {
        q: "How does a CDN improve app security?",
        options: ["By encrypting client cookies", "By acting as a distributed buffer shield to absorb DDoS attack floods", "By removing server access points", "By validating user identity certificates"],
        answer: 1,
        explain: "CDNs absorb high-bandwidth traffic spikes and block malicious traffic at the edge before it reaches the core application servers."
      }
    ],
    controls: `
      <label for="cdn-region">Requester Location:</label>
      <select id="cdn-region">
        <option value="us">United States (West)</option>
        <option value="eu">Europe (London)</option>
        <option value="as">Asia (Tokyo)</option>
      </select>
    `
  },
  "message-queue": {
    title: "Message Queues",
    badge: "Asynchronous Flow",
    notes: `
      <h4>Introduction</h4>
      <p>A <strong>Message Queue (MQ)</strong> provides asynchronous, decoupled communication between different software services. A message producer pushes a job/message onto a queue buffer, and a consumer pulls and processes it when available.</p>
      
      <h4>Why Decouple?</h4>
      <p>If a task is slow (e.g., rendering video, sending emails, generating reports), handling it synchronously forces the client to wait. An MQ lets the system accept the request immediately, place it in a queue, and process it in the background.</p>

      <div class="tradeoff-grid">
        <div class="tradeoff-box pros">
          <h5>Advantages</h5>
          <p>Absorbs traffic spikes (load leveling), handles component failures gracefully, and simplifies horizontal scaling of workers.</p>
        </div>
        <div class="tradeoff-box cons">
          <h5>Trade-offs</h5>
          <p>Requires managing message ordering, deduplication (exactly-once processing), and complicates system debugging.</p>
        </div>
      </div>
    `,
    quiz: [
      {
        q: "What is the main benefit of using a Message Queue?",
        options: ["It keeps databases clean", "It enables asynchronous decoupling of producers and consumers", "It increases network speeds", "It replaces the API layer"],
        answer: 1,
        explain: "Message queues allow components to interact without direct synchronous calls, increasing fault tolerance and response times."
      },
      {
        q: "In Message Queue terminology, what does a 'Consumer' represent?",
        options: ["The user browsing the website", "The component that generates and pushes messages to the queue", "The server process that retrieves and handles messages from the queue", "The physical database storage block"],
        answer: 2,
        explain: "Consumers subscribe to queues, pulling and executing backend work tasks in asynchronous threads."
      },
      {
        q: "How does a Message Queue handle sudden traffic spikes (load leveling)?",
        options: ["By blocking client requests", "By acting as a buffer, storing incoming tasks safely until consumers can process them", "By upgrading CPU hardware", "By duplicating database records"],
        answer: 1,
        explain: "A queue acts as a temporary buffer to prevent database crash overflows during high-volume events."
      }
    ],
    controls: `
      <label for="mq-job-type">Task Type:</label>
      <select id="mq-job-type">
        <option value="email">Send Notification Email</option>
        <option value="video">Render 1080p Video</option>
        <option value="report">Generate PDF Report</option>
      </select>
    `
  },
  "microservices": {
    title: "Microservices",
    badge: "Architecture Strategy",
    notes: `
      <h4>Introduction</h4>
      <p>A <strong>Microservices Architecture</strong> structures an application as a collection of loosely coupled, independently deployable services organized around business capabilities.</p>
      
      <h4>The API Gateway</h4>
      <p>An API Gateway is the single entry point for all client requests. It aggregates calls and routes requests to the appropriate downstream microservice.</p>

      <div class="tradeoff-grid">
        <div class="tradeoff-box pros">
          <h5>Advantages</h5>
          <p>Different teams can work on different services independently, services can scale separately, and technology stacks can be mixed.</p>
        </div>
        <div class="tradeoff-box cons">
          <h5>Trade-offs</h5>
          <p>Distributed system complexity, hard-to-maintain transaction consistency (Saga patterns), and high network latency overhead.</p>
        </div>
      </div>
    `,
    quiz: [
      {
        q: "What is the primary role of an API Gateway in a microservices pattern?",
        options: ["To store user profile records", "To act as a single entry point that routes requests to appropriate services", "To replace database systems", "To compile application build bundles"],
        answer: 1,
        explain: "The API Gateway routes client traffic, handles cross-cutting concerns (authentication, rate-limiting), and aggregates service APIs."
      },
      {
        q: "Why is a database-per-service pattern recommended in microservices?",
        options: ["It reduces query counts", "To ensure tight decoupling and let teams evolve data structures independently without breaking other systems", "To lower cloud subscription costs", "It makes joins easier"],
        answer: 1,
        explain: "If microservices share a database, changes to schemas in one service risk breaking others, violating the principle of independent deployment."
      },
      {
        q: "What is a major trade-off of microservice patterns over monolithic setups?",
        options: ["Limits service scaling", "Impedes local testing", "Introduces complex distributed management, higher network latency, and transactional overhead", "Forces all code into a single repository"],
        answer: 2,
        explain: "Microservices introduce distributed system issues: network failures, tracing queries, and resolving transactions across databases."
      }
    ],
    controls: `
      <label for="service-route">Request Route:</label>
      <select id="service-route">
        <option value="auth">POST /login (Auth Service)</option>
        <option value="orders">GET /orders (Orders Service)</option>
        <option value="inventory">PUT /stock (Inventory Service)</option>
      </select>
    `
  }
};

// --- INITIAL STATE MANAGEMENT ---
let STATE = {
  completed: {
    "load-balancer": false,
    "caching": false,
    "databases": false,
    "cdn": false,
    "message-queue": false,
    "microservices": false
  },
  bookmarks: [],
  streak: 1,
  lastVisit: 0,
  quizScores: {},
  achievements: {
    "hello-world": { name: "Architect Apprentice", desc: "First visit to the System Design Hub.", unlocked: false, icon: "🎓" },
    "halfway": { name: "System Engineer", desc: "Complete 3 modules.", unlocked: false, icon: "⚙️" },
    "expert": { name: "Principal Architect", desc: "Complete all 6 learning modules.", unlocked: false, icon: "👑" },
    "quiz-king": { name: "Perfect Score", desc: "Get 100% on any topic quiz.", unlocked: false, icon: "💯" }
  },
  activeModule: "load-balancer",
  activeTab: "simulator",
  theme: "dark"
};

// Load/Save state helpers
function loadState() {
  const saved = localStorage.getItem("system_design_hub_state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      STATE = {
        ...STATE,
        ...parsed,
        completed: { ...STATE.completed, ...parsed.completed },
        quizScores: parsed.quizScores || {},
        achievements: { ...STATE.achievements, ...parsed.achievements }
      };
    } catch(e) {}
  }
  
  // Apply theme on load
  document.documentElement.setAttribute('data-theme', STATE.theme);
  
  // Track daily visit streak
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (STATE.lastVisit > 0) {
    const diff = now - STATE.lastVisit;
    if (diff > oneDayMs && diff < 2 * oneDayMs) {
      STATE.streak += 1;
    } else if (diff >= 2 * oneDayMs) {
      STATE.streak = 1;
    }
  }
  STATE.lastVisit = now;
  
  // Unlock first achievement instantly
  STATE.achievements["hello-world"].unlocked = true;
  
  saveState();
  syncUI();
}

function saveState() {
  localStorage.setItem("system_design_hub_state", JSON.stringify(STATE));
  updateProgressIndicators();
}

// --- TAB TRANSITIONS ---
function switchTab(tabName) {
  STATE.activeTab = tabName;
  document.querySelectorAll(".tab-triggers .tab-trigger").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-content-container .tab-panel").forEach(p => {
    p.classList.toggle("active", p.id === `tab-${tabName}`);
  });
  
  if (tabName === "simulator") {
    renderActiveSimulator();
  } else if (tabName === "notes") {
    renderActiveNotes();
  } else if (tabName === "quiz") {
    startActiveQuiz();
  }
}

// --- MODULE TRANSITIONS ---
function switchModule(moduleName) {
  STATE.activeModule = moduleName;
  document.querySelectorAll("#module-nav-list .nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.module === moduleName);
  });
  
  const modData = MODULES_DATA[moduleName];
  document.getElementById("active-module-title").textContent = modData.title;
  document.querySelector(".module-meta .module-badge").textContent = modData.badge;
  
  // Populate simulator control panel
  document.getElementById("sim-controls-panel").innerHTML = modData.controls;
  
  // Reset active tab to Simulator view
  switchTab("simulator");
}

// --- STUDY NOTES RENDERING & EXPORTS ---
function renderActiveNotes() {
  const modData = MODULES_DATA[STATE.activeModule];
  const container = document.getElementById("notes-content");
  container.innerHTML = modData.notes;
  
  // Sync Bookmark Button
  const btn = document.getElementById("bookmark-topic-btn");
  const isBookmarked = STATE.bookmarks.includes(STATE.activeModule);
  btn.classList.toggle("active", isBookmarked);
  btn.querySelector(".bookmark-icon").textContent = isBookmarked ? "★" : "☆";
  btn.querySelector(".bookmark-label").textContent = isBookmarked ? "Bookmarked" : "Bookmark";
}

function toggleBookmark() {
  const idx = STATE.bookmarks.indexOf(STATE.activeModule);
  if (idx > -1) {
    STATE.bookmarks.splice(idx, 1);
  } else {
    STATE.bookmarks.push(STATE.activeModule);
  }
  saveState();
  syncBookmarksUI();
  renderActiveNotes();
}

function downloadStudyNotes() {
  const modData = MODULES_DATA[STATE.activeModule];
  // Convert basic HTML markup back to markdown-like text structure
  const rawText = modData.notes
    .replace(/<h4>(.*?)<\/h4>/g, '\n# $1\n')
    .replace(/<h5>(.*?)<\/h5>/g, '\n## $1\n')
    .replace(/<p>(.*?)<\/p>/g, '\n$1\n')
    .replace(/<li>(.*?)<\/li>/g, '- $1')
    .replace(/<.*?>/g, ''); // strip remaining tags
    
  const blob = new Blob([`ArchitectHub Study Guide: ${modData.title}\n========================================${rawText}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${modData.title.toLowerCase().replace(/ /g, '_')}_notes.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

// --- QUIZ GAME SYSTEM ---
let activeQuizState = {
  currentQIndex: 0,
  score: 0,
  answers: [] // indices of user inputs
};

function startActiveQuiz() {
  activeQuizState.currentQIndex = 0;
  activeQuizState.score = 0;
  activeQuizState.answers = [];
  
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const questions = MODULES_DATA[STATE.activeModule].quiz;
  const currQ = questions[activeQuizState.currentQIndex];
  
  const progressPercent = ((activeQuizState.currentQIndex) / questions.length) * 100;
  document.getElementById("quiz-progress").style.width = `${progressPercent}%`;
  
  document.getElementById("quiz-counter").textContent = `Question ${activeQuizState.currentQIndex + 1} of ${questions.length}`;
  
  const container = document.getElementById("quiz-content");
  container.innerHTML = `
    <h3>${currQ.q}</h3>
    <div class="quiz-choices">
      ${currQ.options.map((opt, i) => `
        <button class="choice-option" onclick="handleQuizAnswerSelection(${i})">${opt}</button>
      `).join('')}
    </div>
    <div class="quiz-explanation hidden" id="quiz-explanation-box"></div>
  `;
  
  document.getElementById("quiz-next-btn").disabled = true;
  document.getElementById("quiz-next-btn").textContent = activeQuizState.currentQIndex === questions.length - 1 ? "Finish Quiz" : "Next Question";
}

window.handleQuizAnswerSelection = function(choiceIdx) {
  const questions = MODULES_DATA[STATE.activeModule].quiz;
  const currQ = questions[activeQuizState.currentQIndex];
  
  // Disable all options
  document.querySelectorAll(".quiz-choices .choice-option").forEach((btn, i) => {
    btn.disabled = true;
    if (i === currQ.answer) {
      btn.classList.add("correct");
    } else if (i === choiceIdx) {
      btn.classList.add("incorrect");
    }
  });
  
  const isCorrect = choiceIdx === currQ.answer;
  if (isCorrect) activeQuizState.score += 1;
  
  // Show explanation
  const explanationBox = document.getElementById("quiz-explanation-box");
  explanationBox.innerHTML = `<strong>${isCorrect ? 'Correct!' : 'Incorrect.'}</strong> ${currQ.explain}`;
  explanationBox.classList.remove("hidden");
  
  document.getElementById("quiz-next-btn").disabled = false;
};

function handleQuizNextButton() {
  const questions = MODULES_DATA[STATE.activeModule].quiz;
  if (activeQuizState.currentQIndex < questions.length - 1) {
    activeQuizState.currentQIndex += 1;
    renderQuizQuestion();
  } else {
    // Complete Quiz
    const totalQ = questions.length;
    const finalScorePercent = Math.round((activeQuizState.score / totalQ) * 100);
    
    // Save quiz score
    STATE.quizScores[STATE.activeModule] = Math.max(STATE.quizScores[STATE.activeModule] || 0, finalScorePercent);
    
    // Check module completion (must score >= 60% or simply complete quiz)
    if (finalScorePercent >= 66) {
      STATE.completed[STATE.activeModule] = true;
    }
    
    // Achievements check
    if (finalScorePercent === 100) {
      STATE.achievements["quiz-king"].unlocked = true;
    }
    
    let completedCount = Object.values(STATE.completed).filter(Boolean).length;
    if (completedCount >= 3) STATE.achievements["halfway"].unlocked = true;
    if (completedCount === 6) STATE.achievements["expert"].unlocked = true;
    
    saveState();
    syncUI();
    
    // Open Dialog
    showQuizResultModal(activeQuizState.score, totalQ, finalScorePercent);
  }
}

function showQuizResultModal(score, total, percent) {
  const modal = document.getElementById("quiz-result-modal");
  document.getElementById("modal-result-percent").textContent = `${percent}%`;
  document.getElementById("modal-result-fraction").textContent = `${score}/${total} Correct`;
  
  const feedback = document.getElementById("modal-result-feedback");
  if (percent >= 100) {
    feedback.textContent = "Outstanding! Perfect Score. You've mastered this system design topic.";
  } else if (percent >= 66) {
    feedback.textContent = "Well done! You've passed the module check. Keep scaling your knowledge.";
  } else {
    feedback.textContent = "Good try, but review the Study Notes and try the quiz again to secure module completion.";
  }
  
  modal.classList.remove("hidden");
}

// --- DYNAMIC INTERACTIVE SIMULATORS ---
let simAnimationId = null;

function renderActiveSimulator() {
  // Cancel active animation frames
  if (simAnimationId) cancelAnimationFrame(simAnimationId);
  
  const viewport = document.getElementById("sim-viewport");
  viewport.innerHTML = "";
  
  const statusMsg = document.getElementById("sim-status-message");
  
  if (STATE.activeModule === "load-balancer") {
    statusMsg.textContent = "Select routing algorithm, then click 'Send Request'.";
    renderLoadBalancerSim(viewport);
  } else if (STATE.activeModule === "caching") {
    statusMsg.textContent = "Enter query key ID (1-5) and click 'Send Request' to query the caching layer.";
    renderCachingSim(viewport);
  } else if (STATE.activeModule === "databases") {
    statusMsg.textContent = "Enter a User ID and click 'Send Request' to test hashing shard routers.";
    renderDatabasesSim(viewport);
  } else if (STATE.activeModule === "cdn") {
    statusMsg.textContent = "Select location and click 'Send Request' to test geographic Edge latency routing.";
    renderCdnSim(viewport);
  } else if (STATE.activeModule === "message-queue") {
    statusMsg.textContent = "Choose Task type and click 'Send Request' to buffer asynchronous background workloads.";
    renderMessageQueueSim(viewport);
  } else if (STATE.activeModule === "microservices") {
    statusMsg.textContent = "Choose API route path to watch the API gateway route to targeted decoupled nodes.";
    renderMicroservicesSim(viewport);
  }
}

// 1. Load Balancer Sim
let lbServerLoads = [0, 0, 0];
let lbRoundRobinCounter = 0;

function renderLoadBalancerSim(parent) {
  parent.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 700 350">
      <!-- Connection paths -->
      <path class="line-path" id="path-lb-s0" d="M 100 175 C 200 175, 250 175, 300 175 C 320 175, 380 175, 460 70" />
      <path class="line-path" id="path-lb-s1" d="M 100 175 C 200 175, 250 175, 300 175 C 320 175, 380 175, 465 175" />
      <path class="line-path" id="path-lb-s2" d="M 100 175 C 200 175, 250 175, 300 175 C 320 175, 380 175, 460 280" />
      
      <!-- Nodes -->
      <g class="node-box" transform="translate(40, 140)">
        <rect width="80" height="70" rx="10" fill="var(--color-accent-cyan)" />
        <text x="40" y="40" font-family="var(--font-display)" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">CLIENT</text>
      </g>
      
      <g class="node-box" transform="translate(260, 130)">
        <rect width="90" height="90" rx="16" fill="var(--bg-card-inner)" stroke="var(--color-accent-cyan)" stroke-width="2" />
        <text x="45" y="45" font-family="var(--font-display)" font-size="10" font-weight="900" fill="var(--text-main)" text-anchor="middle">LOAD</text>
        <text x="45" y="60" font-family="var(--font-display)" font-size="10" font-weight="900" fill="var(--text-main)" text-anchor="middle">BALANCER</text>
      </g>

      <!-- Servers -->
      <g class="node-box" transform="translate(480, 35)" id="lb-srv-0">
        <rect width="160" height="70" rx="10" fill="var(--bg-card-inner)" stroke="var(--color-accent-purple)" stroke-width="2" />
        <text x="80" y="30" font-family="var(--font-display)" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle">SERVER A</text>
        <text x="80" y="50" font-size="9" fill="var(--text-sub)" text-anchor="middle" id="srv-load-text-0">Active Connections: 0</text>
      </g>
      
      <g class="node-box" transform="translate(480, 140)" id="lb-srv-1">
        <rect width="160" height="70" rx="10" fill="var(--bg-card-inner)" stroke="var(--color-accent-purple)" stroke-width="2" />
        <text x="80" y="30" font-family="var(--font-display)" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle">SERVER B</text>
        <text x="80" y="50" font-size="9" fill="var(--text-sub)" text-anchor="middle" id="srv-load-text-1">Active Connections: 0</text>
      </g>
      
      <g class="node-box" transform="translate(480, 245)" id="lb-srv-2">
        <rect width="160" height="70" rx="10" fill="var(--bg-card-inner)" stroke="var(--color-accent-purple)" stroke-width="2" />
        <text x="80" y="30" font-family="var(--font-display)" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle">SERVER C</text>
        <text x="80" y="50" font-size="9" fill="var(--text-sub)" text-anchor="middle" id="srv-load-text-2">Active Connections: 0</text>
      </g>
      
      <!-- Packet Dot -->
      <circle id="lb-packet" r="6" class="packet-dot hidden" />
    </svg>
  `;
  
  // Sync load labels
  lbServerLoads.forEach((load, i) => {
    document.getElementById(`srv-load-text-${i}`).textContent = `Active Connections: ${load}`;
  });
}

function runLoadBalancerSim() {
  const algo = document.getElementById("lb-algo").value;
  let targetServerIdx = 0;
  
  if (algo === "round-robin") {
    targetServerIdx = lbRoundRobinCounter;
    lbRoundRobinCounter = (lbRoundRobinCounter + 1) % 3;
  } else if (algo === "random") {
    targetServerIdx = Math.floor(Math.random() * 3);
  } else if (algo === "least-conn") {
    // Find server index with minimum connections
    let minLoad = Math.min(...lbServerLoads);
    targetServerIdx = lbServerLoads.indexOf(minLoad);
  }
  
  // Increment load
  lbServerLoads[targetServerIdx] += 1;
  document.getElementById(`srv-load-text-${targetServerIdx}`).textContent = `Active Connections: ${lbServerLoads[targetServerIdx]}`;
  
  // Animate packet sliding
  const packet = document.getElementById("lb-packet");
  packet.classList.remove("hidden");
  
  const path = document.getElementById(`path-lb-s${targetServerIdx}`);
  const pathLen = path.getTotalLength();
  
  let start = null;
  const duration = 1200; // ms
  
  document.getElementById("sim-status-message").textContent = `Request routed using ${algo} to Server ${String.fromCharCode(65 + targetServerIdx)}.`;
  
  function anim(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const ratio = Math.min(progress / duration, 1);
    
    const pt = path.getPointAtLength(ratio * pathLen);
    packet.setAttribute("cx", pt.x);
    packet.setAttribute("cy", pt.y);
    
    if (ratio < 1) {
      simAnimationId = requestAnimationFrame(anim);
    } else {
      packet.classList.add("hidden");
      
      // Decrease connection loads after delay
      setTimeout(() => {
        if (lbServerLoads[targetServerIdx] > 0) {
          lbServerLoads[targetServerIdx] -= 1;
          const label = document.getElementById(`srv-load-text-${targetServerIdx}`);
          if (label) label.textContent = `Active Connections: ${lbServerLoads[targetServerIdx]}`;
        }
      }, 2000);
    }
  }
  
  simAnimationId = requestAnimationFrame(anim);
}

// 2. Cache Sim
let cacheStore = []; // FIFO/LRU list: [key]

function renderCachingSim(parent) {
  parent.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 700 350">
      <!-- Pathways -->
      <path class="line-path" id="path-client-cache" d="M 80 175 L 250 175" />
      <path class="line-path" id="path-cache-db" d="M 370 175 L 530 175" />
      
      <!-- Nodes -->
      <g class="node-box" transform="translate(20, 140)">
        <rect width="80" height="70" rx="10" fill="var(--color-accent-cyan)" />
        <text x="40" y="40" font-family="var(--font-display)" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">CLIENT</text>
      </g>
      
      <g class="node-box" transform="translate(240, 95)" id="cache-box-node">
        <rect width="140" height="160" rx="16" fill="var(--bg-card-inner)" stroke="var(--color-accent-purple)" stroke-width="2" />
        <text x="70" y="30" font-family="var(--font-display)" font-size="11" font-weight="900" fill="var(--text-main)" text-anchor="middle">IN-MEMORY CACHE</text>
        
        <!-- Cache Keys visual grids -->
        <g id="cache-keys-display" transform="translate(15, 45)">
          <!-- Render dynamically -->
        </g>
      </g>

      <g class="node-box" transform="translate(520, 115)">
        <rect width="130" height="120" rx="12" fill="var(--bg-card-inner)" stroke="var(--text-mute)" stroke-width="2" />
        <text x="65" y="45" font-family="var(--font-display)" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle">DATABASE</text>
        <text x="65" y="65" font-size="9" fill="var(--text-mute)" text-anchor="middle">(Disk Read: 350ms)</text>
        <rect x="25" y="80" width="80" height="20" rx="4" fill="rgba(255,255,255,0.03)" stroke="var(--border-color)" />
        <text x="65" y="93" font-size="9" fill="var(--text-sub)" text-anchor="middle">Users: ID 1-5</text>
      </g>
      
      <circle id="cache-packet" r="6" class="packet-dot hidden" />
    </svg>
  `;
  syncCacheStoreUI();
}

function syncCacheStoreUI() {
  const g = document.getElementById("cache-keys-display");
  if (!g) return;
  g.innerHTML = "";
  
  if (cacheStore.length === 0) {
    g.innerHTML = `<text x="55" y="45" font-size="10" fill="var(--text-mute)" text-anchor="middle">[ Empty ]</text>`;
    return;
  }
  
  cacheStore.forEach((key, idx) => {
    g.innerHTML += `
      <g transform="translate(0, ${idx * 30})">
        <rect width="110" height="24" rx="4" fill="rgba(168, 85, 247, 0.1)" stroke="var(--color-accent-purple)" stroke-dasharray="3 3" />
        <text x="55" y="15" font-size="10" fill="var(--text-main)" font-weight="600" text-anchor="middle">Key: user:${key}</text>
      </g>
    `;
  });
}

function runCachingSim() {
  const targetKey = parseInt(document.getElementById("cache-key").value) || 1;
  const isHit = cacheStore.includes(targetKey);
  
  const packet = document.getElementById("cache-packet");
  packet.classList.remove("hidden");
  
  const pathClientCache = document.getElementById("path-client-cache");
  const pathCacheDb = document.getElementById("path-cache-db");
  const statusMsg = document.getElementById("sim-status-message");
  
  let start = null;
  
  // LRU Update: move key to top or push
  if (isHit) {
    // Cache Hit!
    const idx = cacheStore.indexOf(targetKey);
    cacheStore.splice(idx, 1);
    cacheStore.unshift(targetKey); // put at front
    
    statusMsg.textContent = `Query user:${targetKey}... Cache Hit! Data loaded in 10ms.`;
    
    // Animate Client to Cache only
    function animHit(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const ratio = Math.min(progress / 500, 1);
      
      const pt = pathClientCache.getPointAtLength(ratio * pathClientCache.getTotalLength());
      packet.setAttribute("cx", pt.x);
      packet.setAttribute("cy", pt.y);
      
      if (ratio < 1) {
        simAnimationId = requestAnimationFrame(animHit);
      } else {
        packet.classList.add("hidden");
        syncCacheStoreUI();
        triggerNodeFlash("cache-box-node", "rgba(16, 185, 129, 0.4)");
      }
    }
    simAnimationId = requestAnimationFrame(animHit);
    
  } else {
    // Cache Miss! Fetch from Database and load into cache (LRU eviction if limit > 3)
    statusMsg.textContent = `Query user:${targetKey}... Cache Miss! Fetching from slow Database (350ms)...`;
    
    cacheStore.unshift(targetKey);
    if (cacheStore.length > 3) {
      cacheStore.pop(); // LRU eviction
    }
    
    // Animate Client -> Cache -> DB, then DB -> Cache -> Client
    const len1 = pathClientCache.getTotalLength();
    const len2 = pathCacheDb.getTotalLength();
    
    function animMiss(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const totalDuration = 1800;
      const ratio = Math.min(progress / totalDuration, 1);
      
      if (ratio < 0.25) {
        // Client to Cache
        const pt = pathClientCache.getPointAtLength((ratio / 0.25) * len1);
        packet.setAttribute("cx", pt.x);
        packet.setAttribute("cy", pt.y);
      } else if (ratio < 0.5) {
        // Cache to DB
        const pt = pathCacheDb.getPointAtLength(((ratio - 0.25) / 0.25) * len2);
        packet.setAttribute("cx", pt.x);
        packet.setAttribute("cy", pt.y);
      } else if (ratio < 0.75) {
        // DB back to Cache
        const pt = pathCacheDb.getPointAtLength((1 - (ratio - 0.5) / 0.25) * len2);
        packet.setAttribute("cx", pt.x);
        packet.setAttribute("cy", pt.y);
      } else {
        // Cache back to Client
        const pt = pathClientCache.getPointAtLength((1 - (ratio - 0.75) / 0.25) * len1);
        packet.setAttribute("cx", pt.x);
        packet.setAttribute("cy", pt.y);
      }
      
      if (ratio < 1) {
        simAnimationId = requestAnimationFrame(animMiss);
      } else {
        packet.classList.add("hidden");
        syncCacheStoreUI();
        triggerNodeFlash("cache-box-node", "rgba(244, 63, 94, 0.4)");
      }
    }
    simAnimationId = requestAnimationFrame(animMiss);
  }
}

// 3. Database & Sharding Sim
function renderDatabasesSim(parent) {
  parent.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 700 350">
      <!-- Routing Paths -->
      <path class="line-path" id="path-db-router" d="M 80 175 L 220 175" />
      <path class="line-path" id="path-router-s0" d="M 320 175 C 360 175, 400 175, 480 80" />
      <path class="line-path" id="path-router-s1" d="M 320 175 C 360 175, 400 175, 480 270" />
      
      <!-- Nodes -->
      <g class="node-box" transform="translate(10, 140)">
        <rect width="80" height="70" rx="10" fill="var(--color-accent-cyan)" />
        <text x="40" y="40" font-family="var(--font-display)" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">CLIENT</text>
      </g>
      
      <g class="node-box" transform="translate(210, 125)" id="shard-router-node">
        <rect width="110" height="100" rx="16" fill="var(--bg-card-inner)" stroke="var(--color-accent-cyan)" stroke-width="2" />
        <text x="55" y="45" font-family="var(--font-display)" font-size="10" font-weight="900" fill="var(--text-main)" text-anchor="middle">SHARD ROUTER</text>
        <text x="55" y="65" font-size="8" fill="var(--text-sub)" text-anchor="middle">Hash: (ID % 2)</text>
      </g>

      <!-- Database Shards -->
      <g class="node-box" transform="translate(500, 30)" id="db-shard-0">
        <rect width="170" height="90" rx="12" fill="var(--bg-card-inner)" stroke="var(--color-accent-purple)" stroke-width="2" />
        <text x="85" y="35" font-family="var(--font-display)" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle">SHARD A (Even IDs)</text>
        <text x="85" y="55" font-size="9" fill="var(--text-mute)" text-anchor="middle">Stores user data nodes</text>
        <rect x="25" y="65" width="120" height="16" rx="4" fill="rgba(255,255,255,0.03)" stroke="var(--border-color)" />
        <text x="85" y="76" font-size="8" fill="var(--text-sub)" text-anchor="middle" id="shard-a-last-val">Last Read: None</text>
      </g>
      
      <g class="node-box" transform="translate(500, 220)" id="db-shard-1">
        <rect width="170" height="90" rx="12" fill="var(--bg-card-inner)" stroke="var(--color-accent-purple)" stroke-width="2" />
        <text x="85" y="35" font-family="var(--font-display)" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle">SHARD B (Odd IDs)</text>
        <text x="85" y="55" font-size="9" fill="var(--text-mute)" text-anchor="middle">Stores user data nodes</text>
        <rect x="25" y="65" width="120" height="16" rx="4" fill="rgba(255,255,255,0.03)" stroke="var(--border-color)" />
        <text x="85" y="76" font-size="8" fill="var(--text-sub)" text-anchor="middle" id="shard-b-last-val">Last Read: None</text>
      </g>
      
      <circle id="db-packet" r="6" class="packet-dot hidden" />
    </svg>
  `;
}

function runDatabasesSim() {
  const userId = parseInt(document.getElementById("db-user-id").value) || 1;
  const shardIdx = userId % 2; // Even goes to 0 (Shard A), Odd to 1 (Shard B)
  
  const packet = document.getElementById("db-packet");
  packet.classList.remove("hidden");
  
  const path1 = document.getElementById("path-db-router");
  const path2 = document.getElementById(`path-router-s${shardIdx}`);
  const statusMsg = document.getElementById("sim-status-message");
  
  let start = null;
  const d1 = 500;
  const d2 = 800;
  
  statusMsg.textContent = `Hashed user ID: ${userId} (${userId} % 2 = ${shardIdx}). Routing request to Shard ${shardIdx === 0 ? 'A' : 'B'}...`;
  
  function anim(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    
    if (progress < d1) {
      const pt = path1.getPointAtLength((progress / d1) * path1.getTotalLength());
      packet.setAttribute("cx", pt.x);
      packet.setAttribute("cy", pt.y);
      simAnimationId = requestAnimationFrame(anim);
    } else if (progress < d1 + d2) {
      const pt = path2.getPointAtLength(((progress - d1) / d2) * path2.getTotalLength());
      packet.setAttribute("cx", pt.x);
      packet.setAttribute("cy", pt.y);
      simAnimationId = requestAnimationFrame(anim);
    } else {
      packet.classList.add("hidden");
      const targetShard = shardIdx === 0 ? 'a' : 'b';
      document.getElementById(`shard-${targetShard}-last-val`).textContent = `Last Read User ID: ${userId}`;
      triggerNodeFlash(`db-shard-${shardIdx}`, "rgba(16, 185, 129, 0.3)");
    }
  }
  
  simAnimationId = requestAnimationFrame(anim);
}

// 4. CDN Sim
function renderCdnSim(parent) {
  parent.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 700 350">
      <!-- Geographic CDN Edge paths vs Central Origin -->
      <path class="line-path" id="path-cdn-edge" stroke-dasharray="3 3" d="M 120 175 C 220 100, 320 80, 480 80" />
      <path class="line-path" id="path-cdn-origin" d="M 120 175 C 220 220, 320 280, 480 270" />
      
      <!-- Requester Client -->
      <g class="node-box" transform="translate(10, 140)">
        <rect width="110" height="70" rx="10" fill="var(--color-accent-cyan)" />
        <text x="55" y="35" font-family="var(--font-display)" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">CLIENT</text>
        <text x="55" y="52" font-size="8" fill="rgba(255,255,255,0.8)" text-anchor="middle" id="cdn-loc-label">Loc: USA</text>
      </g>
      
      <!-- CDN Local Edge Server (Fast Cache) -->
      <g class="node-box" transform="translate(500, 35)" id="cdn-edge-node">
        <rect width="160" height="90" rx="12" fill="var(--bg-card-inner)" stroke="var(--color-accent-green)" stroke-width="2.5" />
        <text x="80" y="35" font-family="var(--font-display)" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle">LOCAL CDN EDGE</text>
        <text x="80" y="55" font-size="9" fill="var(--color-accent-green)" text-anchor="middle" font-weight="700">Latency: ~15ms</text>
        <text x="80" y="72" font-size="8" fill="var(--text-mute)" text-anchor="middle">Served from close Cache</text>
      </g>
      
      <!-- Primary Central Origin Server (Slow) -->
      <g class="node-box" transform="translate(500, 220)" id="cdn-origin-node">
        <rect width="160" height="90" rx="12" fill="var(--bg-card-inner)" stroke="var(--color-accent-red)" stroke-width="1.5" />
        <text x="80" y="35" font-family="var(--font-display)" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle">ORIGIN SERVER</text>
        <text x="80" y="55" font-size="9" fill="var(--color-accent-red)" text-anchor="middle" font-weight="700">Latency: ~280ms</text>
        <text x="80" y="72" font-size="8" fill="var(--text-mute)" text-anchor="middle">Central deployment base</text>
      </g>
      
      <circle id="cdn-packet" r="6" class="packet-dot hidden" />
    </svg>
  `;
}

function runCdnSim() {
  const region = document.getElementById("cdn-region").value;
  const mapRegionLabels = { us: "Loc: United States", eu: "Loc: United Kingdom", as: "Loc: Japan" };
  document.getElementById("cdn-loc-label").textContent = mapRegionLabels[region];
  
  // Decide: Simulate Cache Hit on Edge (fast path) vs Origin Query (when cache is cold or bypassed)
  // Let's alternate or simulate a random 20% bypass to show both routes!
  const isCacheBypass = Math.random() < 0.25;
  const packet = document.getElementById("cdn-packet");
  packet.classList.remove("hidden");
  
  const statusMsg = document.getElementById("sim-status-message");
  let start = null;
  
  if (!isCacheBypass) {
    statusMsg.textContent = `Static assets queried from ${region.toUpperCase()}... Routing to Local CDN Edge server (15ms latency).`;
    const path = document.getElementById("path-cdn-edge");
    
    function animEdge(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const ratio = Math.min(progress / 700, 1);
      
      const pt = path.getPointAtLength(ratio * path.getTotalLength());
      packet.setAttribute("cx", pt.x);
      packet.setAttribute("cy", pt.y);
      
      if (ratio < 1) {
        simAnimationId = requestAnimationFrame(animEdge);
      } else {
        packet.classList.add("hidden");
        triggerNodeFlash("cdn-edge-node", "rgba(16, 185, 129, 0.4)");
      }
    }
    simAnimationId = requestAnimationFrame(animEdge);
  } else {
    statusMsg.textContent = `Cache expired! Routing requests back to Central Origin Server (280ms round-trip latency).`;
    const path = document.getElementById("path-cdn-origin");
    
    function animOrigin(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const ratio = Math.min(progress / 1500, 1);
      
      const pt = path.getPointAtLength(ratio * path.getTotalLength());
      packet.setAttribute("cx", pt.x);
      packet.setAttribute("cy", pt.y);
      
      if (ratio < 1) {
        simAnimationId = requestAnimationFrame(animOrigin);
      } else {
        packet.classList.add("hidden");
        triggerNodeFlash("cdn-origin-node", "rgba(244, 63, 94, 0.4)");
      }
    }
    simAnimationId = requestAnimationFrame(animOrigin);
  }
}

// 5. Message Queue Sim
let mqBuffer = [];

function renderMessageQueueSim(parent) {
  parent.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 700 350">
      <!-- Paths -->
      <path class="line-path" id="path-producer-mq" d="M 80 175 L 220 175" />
      <path class="line-path" id="path-mq-consumer" d="M 440 175 L 580 175" />
      
      <!-- Nodes -->
      <g class="node-box" transform="translate(10, 140)">
        <rect width="80" height="70" rx="10" fill="var(--color-accent-cyan)" />
        <text x="40" y="40" font-family="var(--font-display)" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">PRODUCER</text>
      </g>
      
      <!-- Message Queue Box -->
      <g class="node-box" transform="translate(220, 95)" id="mq-box-node">
        <rect width="220" height="160" rx="16" fill="var(--bg-card-inner)" stroke="var(--color-accent-purple)" stroke-width="2" />
        <text x="110" y="30" font-family="var(--font-display)" font-size="11" font-weight="900" fill="var(--text-main)" text-anchor="middle">MESSAGE QUEUE</text>
        
        <!-- Queue blocks display -->
        <g id="mq-blocks-display" transform="translate(20, 50)">
          <!-- Render dynamically -->
        </g>
      </g>

      <g class="node-box" transform="translate(580, 140)" id="consumer-node">
        <rect width="90" height="70" rx="10" fill="var(--color-accent-purple)" />
        <text x="45" y="40" font-family="var(--font-display)" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">CONSUMER</text>
      </g>
      
      <circle id="mq-packet" r="6" class="packet-dot hidden" />
    </svg>
  `;
  syncMqBlocksUI();
}

function syncMqBlocksUI() {
  const g = document.getElementById("mq-blocks-display");
  if (!g) return;
  g.innerHTML = "";
  
  if (mqBuffer.length === 0) {
    g.innerHTML = `<text x="90" y="50" font-size="10" fill="var(--text-mute)" text-anchor="middle">[ Empty Queue ]</text>`;
    return;
  }
  
  mqBuffer.slice(0, 4).forEach((job, idx) => {
    g.innerHTML += `
      <g transform="translate(${idx * 45}, 20)">
        <rect width="40" height="40" rx="6" fill="rgba(168, 85, 247, 0.1)" stroke="var(--color-accent-purple)" stroke-width="1.5" />
        <text x="20" y="24" font-size="9" fill="var(--text-main)" font-weight="700" text-anchor="middle">${job.charAt(0).toUpperCase()}</text>
      </g>
    `;
  });
  
  if (mqBuffer.length > 4) {
    g.innerHTML += `
      <g transform="translate(180, 30)">
        <text x="0" y="0" font-size="12" fill="var(--color-accent-cyan)" font-weight="900">...</text>
      </g>
    `;
  }
}

function runMessageQueueSim() {
  const job = document.getElementById("mq-job-type").value;
  mqBuffer.push(job);
  
  const packet = document.getElementById("mq-packet");
  packet.classList.remove("hidden");
  
  const path = document.getElementById("path-producer-mq");
  const statusMsg = document.getElementById("sim-status-message");
  
  let start = null;
  statusMsg.textContent = `Producer dispatched a '${job}' job onto the queue.`;
  
  function animProduce(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const ratio = Math.min(progress / 500, 1);
    
    const pt = path.getPointAtLength(ratio * path.getTotalLength());
    packet.setAttribute("cx", pt.x);
    packet.setAttribute("cy", pt.y);
    
    if (ratio < 1) {
      simAnimationId = requestAnimationFrame(animProduce);
    } else {
      packet.classList.add("hidden");
      syncMqBlocksUI();
      triggerNodeFlash("mq-box-node", "rgba(168, 85, 247, 0.3)");
      
      // Auto consume after a delay
      setTimeout(consumeMqJob, 1000);
    }
  }
  simAnimationId = requestAnimationFrame(animProduce);
}

function consumeMqJob() {
  if (mqBuffer.length === 0) return;
  
  const job = mqBuffer.shift();
  const packet = document.getElementById("mq-packet");
  packet.classList.remove("hidden");
  
  const path = document.getElementById("path-mq-consumer");
  const statusMsg = document.getElementById("sim-status-message");
  let start = null;
  
  statusMsg.textContent = `Consumer pulling '${job}' job from queue to process...`;
  
  function animConsume(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const ratio = Math.min(progress / 500, 1);
    
    const pt = path.getPointAtLength(ratio * path.getTotalLength());
    packet.setAttribute("cx", pt.x);
    packet.setAttribute("cy", pt.y);
    
    if (ratio < 1) {
      simAnimationId = requestAnimationFrame(animConsume);
    } else {
      packet.classList.add("hidden");
      syncMqBlocksUI();
      triggerNodeFlash("consumer-node", "rgba(16, 185, 129, 0.4)");
      statusMsg.textContent = `Consumer finished executing task: '${job}'.`;
    }
  }
  simAnimationId = requestAnimationFrame(animConsume);
}

// 6. Microservices Sim
function renderMicroservicesSim(parent) {
  parent.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 700 350">
      <!-- Routing Paths -->
      <path class="line-path" id="path-client-gateway" d="M 80 175 L 200 175" />
      <path class="line-path" id="path-gw-auth" d="M 280 175 C 320 175, 360 175, 460 70" />
      <path class="line-path" id="path-gw-orders" d="M 280 175 C 320 175, 360 175, 460 175" />
      <path class="line-path" id="path-gw-inventory" d="M 280 175 C 320 175, 360 175, 460 280" />
      
      <!-- Nodes -->
      <g class="node-box" transform="translate(10, 140)">
        <rect width="80" height="70" rx="10" fill="var(--color-accent-cyan)" />
        <text x="40" y="40" font-family="var(--font-display)" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">CLIENT</text>
      </g>
      
      <g class="node-box" transform="translate(180, 125)" id="api-gateway-node">
        <rect width="110" height="100" rx="16" fill="var(--bg-card-inner)" stroke="var(--color-accent-cyan)" stroke-width="2.5" />
        <text x="55" y="45" font-family="var(--font-display)" font-size="10" font-weight="900" fill="var(--text-main)" text-anchor="middle">API GATEWAY</text>
        <text x="55" y="65" font-size="8" fill="var(--text-sub)" text-anchor="middle">(Entry Router)</text>
      </g>

      <!-- Microservice Nodes -->
      <g class="node-box" transform="translate(480, 30)" id="srv-auth">
        <rect width="180" height="70" rx="10" fill="var(--bg-card-inner)" stroke="var(--color-accent-purple)" stroke-width="2" />
        <text x="90" y="30" font-family="var(--font-display)" font-size="10" font-weight="800" fill="var(--text-main)" text-anchor="middle">AUTH SERVICE</text>
        <text x="90" y="50" font-size="8" fill="var(--text-mute)" text-anchor="middle">Db: Auth MongoDB</text>
      </g>
      
      <g class="node-box" transform="translate(480, 140)" id="srv-orders">
        <rect width="180" height="70" rx="10" fill="var(--bg-card-inner)" stroke="var(--color-accent-purple)" stroke-width="2" />
        <text x="90" y="30" font-family="var(--font-display)" font-size="10" font-weight="800" fill="var(--text-main)" text-anchor="middle">ORDERS SERVICE</text>
        <text x="90" y="50" font-size="8" fill="var(--text-mute)" text-anchor="middle">Db: Orders PostgreSQL</text>
      </g>
      
      <g class="node-box" transform="translate(480, 245)" id="srv-inventory">
        <rect width="180" height="70" rx="10" fill="var(--bg-card-inner)" stroke="var(--color-accent-purple)" stroke-width="2" />
        <text x="90" y="30" font-family="var(--font-display)" font-size="10" font-weight="800" fill="var(--text-main)" text-anchor="middle">INVENTORY SERVICE</text>
        <text x="90" y="50" font-size="8" fill="var(--text-mute)" text-anchor="middle">Db: Inventory Redis</text>
      </g>
      
      <circle id="micro-packet" r="6" class="packet-dot hidden" />
    </svg>
  `;
}

function runMicroservicesSim() {
  const route = document.getElementById("service-route").value;
  const nodeMap = { auth: "srv-auth", orders: "srv-orders", inventory: "srv-inventory" };
  const pathMap = { auth: "gw-auth", orders: "gw-orders", inventory: "gw-inventory" };
  
  const packet = document.getElementById("micro-packet");
  packet.classList.remove("hidden");
  
  const path1 = document.getElementById("path-client-gateway");
  const path2 = document.getElementById(`path-gw-${pathMap[route]}`);
  const statusMsg = document.getElementById("sim-status-message");
  
  let start = null;
  const d1 = 400;
  const d2 = 700;
  
  statusMsg.textContent = `API Gateway authenticated request. Routing to independent target: '${nodeMap[route].toUpperCase()}'...`;
  
  function anim(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    
    if (progress < d1) {
      const pt = path1.getPointAtLength((progress / d1) * path1.getTotalLength());
      packet.setAttribute("cx", pt.x);
      packet.setAttribute("cy", pt.y);
      simAnimationId = requestAnimationFrame(anim);
    } else if (progress < d1 + d2) {
      const pt = path2.getPointAtLength(((progress - d1) / d2) * path2.getTotalLength());
      packet.setAttribute("cx", pt.x);
      packet.setAttribute("cy", pt.y);
      simAnimationId = requestAnimationFrame(anim);
    } else {
      packet.classList.add("hidden");
      triggerNodeFlash(nodeMap[route], "rgba(168, 85, 247, 0.4)");
      statusMsg.textContent = `Response returned successfully from decentralized database.`;
    }
  }
  
  simAnimationId = requestAnimationFrame(anim);
}

// Utility simulator node flash indicator helper
function triggerNodeFlash(nodeId, shadowColor) {
  const node = document.getElementById(nodeId);
  if (!node) return;
  
  node.style.transition = "filter 0.2s ease";
  node.style.filter = `drop-shadow(0 0 15px ${shadowColor})`;
  
  setTimeout(() => {
    node.style.filter = "none";
  }, 800);
}

// --- ANALYTICS & STATS ---
function syncUI() {
  updateProgressIndicators();
  syncBookmarksUI();
  syncAchievementsUI();
}

function updateProgressIndicators() {
  const total = 6;
  const completed = Object.values(STATE.completed).filter(Boolean).length;
  const percent = Math.round((completed / total) * 100);
  
  document.getElementById("master-progress-bar").style.width = `${percent}%`;
  document.getElementById("master-progress-text").textContent = `${percent}%`;
  document.getElementById("stats-completed-count").textContent = `${completed}/${total}`;
  
  // Calculate average quiz score
  const scores = Object.values(STATE.quizScores);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  document.getElementById("stats-avg-score").textContent = `${avg}%`;
  
  // Update status dots on sidebar module navigator
  Object.keys(STATE.completed).forEach(key => {
    const dot = document.getElementById(`status-dot-${key}`);
    if (dot) {
      dot.classList.toggle("completed", STATE.completed[key]);
    }
  });
}

function syncBookmarksUI() {
  const ul = document.getElementById("bookmarks-ul");
  ul.innerHTML = "";
  
  if (STATE.bookmarks.length === 0) {
    ul.innerHTML = `<li class="empty-bookmark-msg">No bookmarked topics yet.</li>`;
    return;
  }
  
  STATE.bookmarks.forEach(key => {
    const title = MODULES_DATA[key].title;
    const li = document.createElement("li");
    li.className = "bookmark-item";
    li.innerHTML = `
      <span>${title}</span>
      <button class="remove-btn" onclick="removeBookmark('${key}', event)">✕</button>
    `;
    li.addEventListener("click", () => switchModule(key));
    ul.appendChild(li);
  });
}

window.removeBookmark = function(key, event) {
  if (event) event.stopPropagation(); // prevent triggering switchModule
  const idx = STATE.bookmarks.indexOf(key);
  if (idx > -1) {
    STATE.bookmarks.splice(idx, 1);
  }
  saveState();
  syncBookmarksUI();
  if (STATE.activeModule === key) renderActiveNotes();
};

function syncAchievementsUI() {
  const container = document.getElementById("badges-container");
  container.innerHTML = "";
  
  Object.keys(STATE.achievements).forEach(id => {
    const badge = STATE.achievements[id];
    const div = document.createElement("div");
    div.className = `badge-item ${badge.unlocked ? 'unlocked' : ''}`;
    div.title = `${badge.name}: ${badge.desc} (${badge.unlocked ? 'Unlocked' : 'Locked'})`;
    div.innerHTML = badge.icon;
    container.appendChild(div);
  });
  
  // Update streak display
  document.getElementById("streak-val").textContent = `${STATE.streak} Day${STATE.streak > 1 ? 's' : ''}`;
}

// --- INIT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  
  // Sidebar module selectors
  document.querySelectorAll("#module-nav-list .nav-item").forEach(item => {
    item.addEventListener("click", () => {
      switchModule(item.dataset.module);
    });
  });
  
  // Tab Triggers
  document.querySelectorAll(".tab-triggers .tab-trigger").forEach(trigger => {
    trigger.addEventListener("click", () => {
      switchTab(trigger.dataset.tab);
    });
  });
  
  // Simulator triggers
  document.getElementById("trigger-sim-btn").addEventListener("click", () => {
    if (STATE.activeModule === "load-balancer") runLoadBalancerSim();
    if (STATE.activeModule === "caching") runCachingSim();
    if (STATE.activeModule === "databases") runDatabasesSim();
    if (STATE.activeModule === "cdn") runCdnSim();
    if (STATE.activeModule === "message-queue") runMessageQueueSim();
    if (STATE.activeModule === "microservices") runMicroservicesSim();
  });
  
  document.getElementById("reset-sim-btn").addEventListener("click", () => {
    // Reset specific simulator caches/states
    if (STATE.activeModule === "caching") cacheStore = [];
    if (STATE.activeModule === "load-balancer") lbServerLoads = [0, 0, 0];
    if (STATE.activeModule === "message-queue") mqBuffer = [];
    renderActiveSimulator();
  });
  
  // Bookmark button binding
  document.getElementById("bookmark-topic-btn").addEventListener("click", toggleBookmark);
  
  // Download notes binding
  document.getElementById("download-notes-btn").addEventListener("click", downloadStudyNotes);
  
  // Quiz navigate next
  document.getElementById("quiz-next-btn").addEventListener("click", handleQuizNextButton);
  
  // Modal close trigger
  document.getElementById("modal-close-btn").addEventListener("click", () => {
    document.getElementById("quiz-result-modal").classList.add("hidden");
  });
  
  // Theme Toggle Button
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const sun = document.querySelector(".sun-icon");
    const moon = document.querySelector(".moon-icon");
    
    if (STATE.theme === "dark") {
      STATE.theme = "light";
      sun.classList.add("hidden");
      moon.classList.remove("hidden");
    } else {
      STATE.theme = "dark";
      sun.classList.remove("hidden");
      moon.classList.add("hidden");
    }
    
    document.documentElement.setAttribute('data-theme', STATE.theme);
    saveState();
  });
  
  // Initial Simulator Render
  renderActiveSimulator();
});
