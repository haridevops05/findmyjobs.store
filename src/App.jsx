import { useEffect, useState, useMemo, useCallback, useRef } from "react";

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("jobFavorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [darkMode, setDarkMode] = useState(true);
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [locationFilter, setLocationFilter] = useState("");
  const [activeTab, setActiveTab] = useState("jobs"); // jobs, resume, interview
  const [resume, setResume] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [interviewActive, setInterviewActive] = useState(false);
  const [interviewMessages, setInterviewMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const jobsPerPage = 10;

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const KEYWORDS = [
    "devops", "aws", "kubernetes", "senior devops", "finops", "cloud", 
    "sre", "terraform", "docker", "ci/cd", "azure", "gcp", "jenkins", 
    "ansible", "prometheus", "grafana", "linux", "python", "automation"
  ];

  // Mock job data for when APIs fail
  const mockJobs = [
    {
      id: "mock-1",
      title: "Senior DevOps Engineer",
      company: "TechCorp Inc.",
      url: "#",
      location: "Remote, US",
      type: "Full-time",
      salary: "$140,000 - $180,000",
      source: "Mock Data",
      postedAt: new Date().toISOString(),
      tags: ["kubernetes", "aws", "terraform", "ci/cd", "docker"],
    },
    {
      id: "mock-2",
      title: "Cloud Infrastructure Engineer",
      company: "CloudNative Solutions",
      url: "#",
      location: "New York, NY",
      type: "Full-time",
      salary: "$130,000 - $160,000",
      source: "Mock Data",
      postedAt: new Date(Date.now() - 86400000).toISOString(),
      tags: ["aws", "azure", "cloud", "terraform", "linux"],
    },
    {
      id: "mock-3",
      title: "SRE Lead",
      company: "ReliabilityFirst",
      url: "#",
      location: "Remote, Europe",
      type: "Full-time",
      salary: "€90,000 - €120,000",
      source: "Mock Data",
      postedAt: new Date(Date.now() - 172800000).toISOString(),
      tags: ["sre", "kubernetes", "prometheus", "grafana", "python"],
    },
    {
      id: "mock-4",
      title: "DevOps Platform Engineer",
      company: "DeployPro",
      url: "#",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$150,000 - $200,000",
      source: "Mock Data",
      postedAt: new Date(Date.now() - 259200000).toISOString(),
      tags: ["devops", "kubernetes", "docker", "jenkins", "ansible"],
    },
    {
      id: "mock-5",
      title: "AWS Cloud Architect",
      company: "DataStream Inc",
      url: "#",
      location: "Remote, Worldwide",
      type: "Contract",
      salary: "$80 - $120/hour",
      source: "Mock Data",
      postedAt: new Date(Date.now() - 432000000).toISOString(),
      tags: ["aws", "cloud", "finops", "automation"],
    },
    {
      id: "mock-6",
      title: "Junior DevOps Engineer",
      company: "StartupHub",
      url: "#",
      location: "Berlin, Germany",
      type: "Full-time",
      salary: "€50,000 - €65,000",
      source: "Mock Data",
      postedAt: new Date(Date.now() - 604800000).toISOString(),
      tags: ["devops", "linux", "docker", "ci/cd"],
    },
    {
      id: "mock-7",
      title: "GCP DevOps Specialist",
      company: "Google Cloud Partner",
      url: "#",
      location: "Remote, India",
      type: "Full-time",
      salary: "₹20L - ₹35L",
      source: "Mock Data",
      postedAt: new Date(Date.now() - 777600000).toISOString(),
      tags: ["gcp", "kubernetes", "devops", "terraform"],
    },
    {
      id: "mock-8",
      title: "FinOps Engineer",
      company: "CloudCost Corp",
      url: "#",
      location: "Remote, US",
      type: "Full-time",
      salary: "$120,000 - $150,000",
      source: "Mock Data",
      postedAt: new Date(Date.now() - 1209600000).toISOString(),
      tags: ["finops", "aws", "azure", "cloud"],
    },
  ];

  const interviewQuestions = [
    "Tell me about your experience with Kubernetes.",
    "How do you handle a production outage?",
    "Explain CI/CD pipeline you've built.",
    "What's your experience with infrastructure as code?",
    "How do you ensure system security?",
    "Describe a challenging deployment you managed.",
    "What monitoring tools have you used?",
    "How do you approach cost optimization in cloud?",
  ];

  const isRelevant = useCallback(
    (title) => {
      if (selectedKeywords.length === 0) {
        return KEYWORDS.some((k) => title.toLowerCase().includes(k));
      }
      return selectedKeywords.some((k) => title.toLowerCase().includes(k));
    },
    [selectedKeywords]
  );

  const toggleFavorite = useCallback((job) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.url === job.url);
      if (exists) {
        return prev.filter((f) => f.url !== job.url);
      }
      return [...prev, { ...job, favoritedAt: new Date().toISOString() }];
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("jobFavorites", JSON.stringify(favorites));
  }, [favorites]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    let combined = [];

    try {
      // Try Remotive API
      try {
        const res1 = await fetch("https://remotive.com/api/remote-jobs?category=devops");
        if (res1.ok) {
          const data1 = await res1.json();
          const remotiveJobs = data1.jobs
            .filter((j) => isRelevant(j.title))
            .map((j) => ({
              id: `remotive-${j.id}`,
              title: j.title,
              company: j.company_name,
              url: j.url,
              location: j.candidate_required_location || "Remote",
              type: j.job_type || "Full-time",
              salary: j.salary || "Not specified",
              source: "Remotive",
              postedAt: j.publication_date,
              tags: extractTags(j.title, j.description || ""),
            }));
          combined = [...combined, ...remotiveJobs];
        }
      } catch (e) {
        console.log("Remotive API failed:", e);
      }

      // Try Arbeitnow API
      try {
        const res2 = await fetch("https://www.arbeitnow.com/api/job-board-api?search=devops");
        if (res2.ok) {
          const data2 = await res2.json();
          const arbeitJobs = data2.data
            .filter((j) => isRelevant(j.title))
            .map((j) => ({
              id: `arbeitnow-${j.slug}`,
              title: j.title,
              company: j.company_name,
              url: j.url,
              location: j.location || "Remote",
              type: j.job_type || "Full-time",
              salary: "Not specified",
              source: "Arbeitnow",
              postedAt: j.created_at,
              tags: extractTags(j.title, j.description || ""),
            }));
          combined = [...combined, ...arbeitJobs];
        }
      } catch (e) {
        console.log("Arbeitnow API failed:", e);
      }

      // If no jobs from APIs, use mock data
      if (combined.length === 0) {
        console.log("Using mock data as fallback");
        combined = mockJobs;
      }

      setJobs(combined);
    } catch (err) {
      console.log("Error fetching jobs:", err);
      // Fallback to mock data
      setJobs(mockJobs);
    } finally {
      setLoading(false);
    }
  }, [isRelevant]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 300000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const extractTags = (title, description = "") => {
    const text = `${title} ${description}`.toLowerCase();
    return KEYWORDS.filter((k) => text.includes(k)).slice(0, 5);
  };

  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          job.tags.some((tag) => tag.includes(term)) ||
          job.location.toLowerCase().includes(term)
      );
    }

    if (locationFilter) {
      result = result.filter((job) =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    switch (sortBy) {
      case "recent":
        result.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        break;
      case "company":
        result.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        result.sort(
          (a, b) =>
            b.tags.length - a.tags.length ||
            new Date(b.postedAt) - new Date(a.postedAt)
        );
    }

    return result;
  }, [jobs, searchTerm, locationFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedJobs.length / jobsPerPage);
  const paginatedJobs = filteredAndSortedJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  // Resume handling
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResume(file);
      // Simulate resume analysis
      setTimeout(() => {
        setResumeAnalysis({
          score: 85,
          skills: ["Kubernetes", "AWS", "Terraform", "Python", "Docker"],
          improvements: [
            "Add more quantifiable achievements",
            "Include CI/CD pipeline examples",
            "Mention cloud cost optimization experience",
          ],
          matchingJobs: mockJobs.slice(0, 3),
        });
      }, 1500);
    }
  };

  // Interview handling
  const startInterview = () => {
    setInterviewActive(true);
    setInterviewMessages([
      { 
        role: "ai", 
        text: "Welcome to your mock DevOps interview! I'll ask you some questions. Click the microphone to respond with your voice. Ready? Let's begin!\n\n" + interviewQuestions[0],
        timestamp: new Date().toISOString()
      },
    ]);
    speakText("Welcome to your mock DevOps interview! Let's begin. " + interviewQuestions[0]);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          addMessage("user", transcript);
          generateAIResponse(transcript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };
      } else {
        alert("Speech recognition not supported in this browser");
        return;
      }
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const addMessage = (role, text) => {
    setInterviewMessages(prev => [...prev, { role, text, timestamp: new Date().toISOString() }]);
  };

  const generateAIResponse = (userResponse) => {
    const aiResponse = generateInterviewResponse(userResponse);
    setTimeout(() => {
      addMessage("ai", aiResponse);
      speakText(aiResponse);
    }, 1000);
  };

  const generateInterviewResponse = (userInput) => {
    const responses = [
      "That's interesting! Can you tell me more about your experience with that?",
      "Great answer! How would you handle a critical production issue at 3 AM?",
      "Good point. What monitoring tools did you use in that scenario?",
      "Excellent! Let me ask you another question. " + interviewQuestions[Math.floor(Math.random() * interviewQuestions.length)],
      "I see. What would you do differently if you faced that situation again?",
      "Thanks for sharing. Can you give me a specific example with metrics?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const speakText = (text) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    }
  };

  const theme = {
    background: darkMode ? "#0a0a1a" : "#f0f4f8",
    color: darkMode ? "#e2e8f0" : "#1a202c",
    card: darkMode ? "#1a1a2e" : "#ffffff",
    cardBorder: darkMode ? "#2d2d4a" : "#e2e8f0",
    input: darkMode ? "#16213e" : "#f7fafc",
    inputColor: darkMode ? "#e2e8f0" : "#1a202c",
  };

  const stats = {
    total: jobs.length,
    filtered: filteredAndSortedJobs.length,
    favorites: favorites.length,
    remote: jobs.filter((j) => j.location?.toLowerCase().includes("remote")).length,
  };

  return (
    <div style={{ ...styles.container, background: theme.background, color: theme.color }}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🚀 Mercury Round AI</h1>
          <p style={styles.subtitle}>DevOps Career Platform</p>
        </div>
        <div style={styles.headerButtons}>
          <button onClick={() => setDarkMode(!darkMode)} style={styles.iconButton}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={fetchJobs} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={styles.nav}>
        {["jobs", "resume", "interview"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.navButton,
              background: activeTab === tab ? "#6366f1" : "transparent",
              color: activeTab === tab ? "white" : theme.color,
            }}
          >
            {tab === "jobs" && "💼 Job Board"}
            {tab === "resume" && "📄 Resume Analyzer"}
            {tab === "interview" && "🎙️ Mock Interview"}
          </button>
        ))}
      </nav>

      {/* Job Board Tab */}
      {activeTab === "jobs" && (
        <>
          <div style={styles.statsBar}>
            <StatCard label="Total Jobs" value={stats.total} icon="📊" color="#6366f1" />
            <StatCard label="Matching" value={stats.filtered} icon="🎯" color="#22c55e" />
            <StatCard label="Favorites" value={stats.favorites} icon="⭐" color="#f59e0b" />
            <StatCard label="Remote" value={stats.remote} icon="🏠" color="#06b6d4" />
          </div>

          {/* Search Bar */}
          <div style={styles.searchBar}>
            <div style={styles.searchInputWrapper}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search jobs by title, company, skill, or location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyPress={(e) => e.key === 'Enter' && setCurrentPage(1)}
                style={{ ...styles.searchInput, background: theme.input, color: theme.inputColor }}
              />
              {searchTerm && (
                <span 
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }} 
                  style={styles.clearIcon}
                >
                  ✕
                </span>
              )}
            </div>
            <div style={styles.searchInputWrapper}>
              <span style={styles.searchIcon}>📍</span>
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ ...styles.searchInput, background: theme.input, color: theme.inputColor }}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ ...styles.select, background: theme.input, color: theme.inputColor }}
            >
              <option value="relevance">📊 Most Relevant</option>
              <option value="recent">🕒 Most Recent</option>
              <option value="company">🏢 By Company</option>
              <option value="title">📝 By Title</option>
            </select>
            <button onClick={() => { setSearchTerm(''); setLocationFilter(''); setSelectedKeywords([]); setCurrentPage(1); }} style={styles.clearButton}>
              Clear All 🔄
            </button>
          </div>

          {/* Keywords */}
          <div style={styles.keywordsContainer}>
            {KEYWORDS.map((keyword) => (
              <button
                key={keyword}
                onClick={() =>
                  setSelectedKeywords((prev) =>
                    prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
                  )
                }
                style={{
                  ...styles.keywordChip,
                  background: selectedKeywords.includes(keyword) ? "#6366f1" : theme.input,
                  color: selectedKeywords.includes(keyword) ? "white" : theme.color,
                }}
              >
                {keyword} {selectedKeywords.includes(keyword) && "✓"}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p>Fetching latest DevOps jobs...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={styles.errorBanner}>
              ⚠️ {error} - Showing sample data
            </div>
          )}

          {/* Job Listings */}
          {!loading && (
            <>
              {paginatedJobs.length === 0 ? (
                <div style={styles.emptyState}>
                  <p style={{ fontSize: "1.2rem", marginBottom: "10px" }}>😕 No jobs found matching your criteria</p>
                  <p style={{ color: "#94a3b8" }}>Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  <p style={styles.resultCount}>
                    Showing {paginatedJobs.length} of {filteredAndSortedJobs.length} jobs
                  </p>
                  {paginatedJobs.map((job) => (
                    <div key={job.id} style={{ ...styles.jobCard, background: theme.card, borderColor: theme.cardBorder }}>
                      <div style={styles.jobHeader}>
                        <div>
                          <h3 style={styles.jobTitle}>{job.title}</h3>
                          <p style={styles.companyName}>{job.company} • {job.location}</p>
                        </div>
                        <div style={styles.jobMeta}>
                          <span style={styles.sourceBadge}>{job.source}</span>
                          <button onClick={() => toggleFavorite(job)} style={styles.favoriteButton}>
                            {favorites.find((f) => f.url === job.url) ? "⭐" : "☆"}
                          </button>
                        </div>
                      </div>
                      <div style={styles.tagsContainer}>
                        {job.tags.map((tag) => (
                          <span key={tag} style={{ ...styles.tag, background: theme.input, color: "#6366f1" }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div style={styles.jobFooter}>
                        <span style={styles.salary}>💰 {job.salary}</span>
                        <span style={styles.posted}>📅 {new Date(job.postedAt).toLocaleDateString()}</span>
                        <a href={job.url} target="_blank" rel="noopener noreferrer" style={styles.applyLink}>
                          <button style={styles.applyButton}>Apply Now →</button>
                        </a>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={styles.pagination}>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={styles.pageButton}
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          style={{
                            ...styles.pageButton,
                            background: currentPage === i + 1 ? "#6366f1" : theme.card,
                            color: currentPage === i + 1 ? "white" : theme.color,
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={styles.pageButton}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Favorites Section */}
          {favorites.length > 0 && (
            <div style={styles.favoritesSection}>
              <h3>⭐ Favorite Jobs ({favorites.length})</h3>
              <div style={styles.favoritesGrid}>
                {favorites.map((job) => (
                  <a key={job.url} href={job.url} target="_blank" style={styles.favoriteLink}>
                    <div style={{ ...styles.favoriteCard, background: theme.card }}>
                      <strong>{job.title}</strong>
                      <p>{job.company}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Resume Analyzer Tab */}
      {activeTab === "resume" && (
        <div style={styles.resumeTab}>
          <h2>📄 AI Resume Analyzer</h2>
          <p>Upload your resume and get AI-powered feedback and job matches</p>
          
          <div style={styles.uploadArea}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleResumeUpload}
              style={styles.fileInput}
              id="resume-upload"
            />
            <label htmlFor="resume-upload" style={styles.uploadLabel}>
              {resume ? `📎 ${resume.name}` : "📁 Click to upload resume"}
            </label>
            <p style={styles.uploadHint}>Supports PDF, DOC, DOCX, TXT</p>
          </div>

          {resumeAnalysis && (
            <div style={styles.analysisContainer}>
              <div style={{ ...styles.analysisCard, background: theme.card }}>
                <h3>📊 Resume Score</h3>
                <div style={styles.scoreCircle}>
                  <svg width="120" height="120">
                    <circle cx="60" cy="60" r="54" stroke="#2d2d4a" strokeWidth="8" fill="none" />
                    <circle
                      cx="60" cy="60" r="54"
                      stroke="#6366f1" strokeWidth="8" fill="none"
                      strokeDasharray={`${(resumeAnalysis.score / 100) * 339.292} 339.292`}
                      transform="rotate(-90 60 60)"
                      strokeLinecap="round"
                    />
                    <text x="60" y="60" textAnchor="middle" dy="7" fontSize="24" fontWeight="bold" fill={theme.color}>
                      {resumeAnalysis.score}%
                    </text>
                  </svg>
                </div>
              </div>

              <div style={{ ...styles.analysisCard, background: theme.card }}>
                <h3>🛠️ Detected Skills</h3>
                <div style={styles.tagsContainer}>
                  {resumeAnalysis.skills.map((skill) => (
                    <span key={skill} style={{ ...styles.tag, background: "#6366f120", color: "#6366f1" }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.analysisCard, background: theme.card }}>
                <h3>💡 Improvement Suggestions</h3>
                <ul style={styles.suggestionsList}>
                  {resumeAnalysis.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>

              <div style={{ ...styles.analysisCard, background: theme.card }}>
                <h3>🎯 Matching Jobs</h3>
                {resumeAnalysis.matchingJobs.map((job) => (
                  <div key={job.id} style={styles.matchJob}>
                    <strong>{job.title}</strong> - {job.company}
                    <span style={styles.matchScore}>Match: 92%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mock Interview Tab */}
      {activeTab === "interview" && (
        <div style={styles.interviewTab}>
          <h2>🎙️ AI Voice Interview Practice</h2>
          <p>Practice your DevOps interview skills with voice-to-voice AI</p>

          {!interviewActive ? (
            <div style={styles.interviewStart}>
              <div style={styles.interviewFeatures}>
                <div>✅ Voice recognition</div>
                <div>✅ AI-powered questions</div>
                <div>✅ Real-time feedback</div>
                <div>✅ DevOps-specific questions</div>
              </div>
              <button onClick={startInterview} style={styles.startInterviewButton}>
                Start Mock Interview 🎤
              </button>
            </div>
          ) : (
            <div style={styles.interviewRoom}>
              <div style={styles.interviewStatus}>
                <div style={{ ...styles.statusDot, background: isListening ? "#22c55e" : "#ef4444" }}></div>
                <span>{isListening ? "Listening..." : isSpeaking ? "AI Speaking..." : "Waiting..."}</span>
              </div>

              <div style={styles.chatContainer}>
                {interviewMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.chatMessage,
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      background: msg.role === "user" ? "#6366f1" : theme.card,
                    }}
                  >
                    <div style={styles.messageRole}>
                      {msg.role === "ai" ? "🤖 AI Interviewer" : "👤 You"}
                    </div>
                    <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
                  </div>
                ))}
              </div>

              <div style={styles.interviewControls}>
                <button
                  onClick={toggleListening}
                  style={{
                    ...styles.micButton,
                    background: isListening ? "#ef4444" : "#22c55e",
                  }}
                >
                  {isListening ? "🔴 Stop" : "🎤 Speak"}
                </button>
                <button
                  onClick={() => {
                    setInterviewActive(false);
                    setInterviewMessages([]);
                    synthRef.current.cancel();
                  }}
                  style={styles.endInterviewButton}
                >
                  End Interview
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value, icon, color }) => (
  <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
    <div style={styles.statIcon}>{icon}</div>
    <div>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  </div>
);

const styles = {
  container: {
    padding: "20px",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "2rem",
    margin: 0,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    margin: "5px 0 0 0",
    opacity: 0.7,
  },
  headerButtons: {
    display: "flex",
    gap: "10px",
  },
  iconButton: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1.2rem",
    background: "rgba(99, 102, 241, 0.1)",
  },
  refreshButton: {
    padding: "10px 20px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  nav: {
    display: "flex",
    gap: "10px",
    marginBottom: "30px",
    background: "rgba(99, 102, 241, 0.1)",
    padding: "5px",
    borderRadius: "12px",
  },
  navButton: {
    flex: 1,
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "1rem",
    transition: "all 0.3s",
  },
  statsBar: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },
  statCard: {
    padding: "15px",
    borderRadius: "12px",
    background: "rgba(99, 102, 241, 0.05)",
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  statIcon: {
    fontSize: "2rem",
  },
  statLabel: {
    fontSize: "0.8rem",
    opacity: 0.7,
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  searchBar: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 150px auto",
    gap: "10px",
    marginBottom: "20px",
  },
  searchInputWrapper: {
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "12px 12px 12px 40px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  clearIcon: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    opacity: 0.5,
  },
  select: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
  },
  clearButton: {
    padding: "12px",
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  keywordsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
  },
  keywordChip: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  jobCard: {
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "15px",
    border: "1px solid",
    transition: "transform 0.2s",
  },
  jobHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "10px",
  },
  jobTitle: {
    margin: "0 0 5px 0",
    fontSize: "1.2rem",
  },
  companyName: {
    margin: 0,
    opacity: 0.7,
    fontSize: "0.9rem",
  },
  jobMeta: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sourceBadge: {
    padding: "4px 12px",
    background: "rgba(99, 102, 241, 0.1)",
    borderRadius: "12px",
    fontSize: "0.75rem",
    color: "#6366f1",
  },
  favoriteButton: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0 5px",
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    margin: "10px 0",
  },
  tag: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "500",
  },
  jobFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
    gap: "15px",
  },
  salary: {
    fontSize: "0.9rem",
  },
  posted: {
    fontSize: "0.85rem",
    opacity: 0.7,
  },
  applyLink: {
    textDecoration: "none",
  },
  applyButton: {
    padding: "10px 24px",
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "transform 0.2s",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "40px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(99, 102, 241, 0.1)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  errorBanner: {
    padding: "12px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#ef4444",
    marginBottom: "15px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },
  resultCount: {
    margin: "10px 0",
    opacity: 0.7,
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    margin: "30px 0",
  },
  pageButton: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  favoritesSection: {
    marginTop: "30px",
    padding: "20px",
    background: "rgba(245, 158, 11, 0.1)",
    borderRadius: "12px",
  },
  favoritesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "10px",
    marginTop: "15px",
  },
  favoriteLink: {
    textDecoration: "none",
    color: "inherit",
  },
  favoriteCard: {
    padding: "15px",
    borderRadius: "8px",
    transition: "transform 0.2s",
  },
  resumeTab: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  uploadArea: {
    textAlign: "center",
    padding: "40px",
    border: "2px dashed #6366f1",
    borderRadius: "12px",
    marginTop: "20px",
  },
  fileInput: {
    display: "none",
  },
  uploadLabel: {
    padding: "15px 30px",
    background: "#6366f1",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    display: "inline-block",
  },
  uploadHint: {
    marginTop: "10px",
    opacity: 0.6,
    fontSize: "0.9rem",
  },
  analysisContainer: {
    marginTop: "30px",
    display: "grid",
    gap: "20px",
  },
  analysisCard: {
    padding: "20px",
    borderRadius: "12px",
  },
  scoreCircle: {
    display: "flex",
    justifyContent: "center",
    marginTop: "15px",
  },
  suggestionsList: {
    paddingLeft: "20px",
    lineHeight: "1.8",
  },
  matchJob: {
    padding: "10px",
    borderRadius: "8px",
    background: "rgba(99, 102, 241, 0.05)",
    marginTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchScore: {
    color: "#22c55e",
    fontWeight: "600",
    fontSize: "0.9rem",
  },
  interviewTab: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  interviewStart: {
    textAlign: "center",
    marginTop: "40px",
  },
  interviewFeatures: {
    display: "inline-block",
    textAlign: "left",
    margin: "20px 0",
    lineHeight: "2",
  },
  startInterviewButton: {
    padding: "15px 40px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: "600",
    marginTop: "20px",
  },
  interviewRoom: {
    marginTop: "20px",
  },
  interviewStatus: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 20px",
    background: "rgba(99, 102, 241, 0.1)",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  chatContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    maxHeight: "400px",
    overflowY: "auto",
    padding: "20px",
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  chatMessage: {
    maxWidth: "70%",
    padding: "15px",
    borderRadius: "12px",
  },
  messageRole: {
    fontSize: "0.8rem",
    opacity: 0.7,
    marginBottom: "5px",
  },
  interviewControls: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
  },
  micButton: {
    padding: "15px 30px",
    color: "white",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
  endInterviewButton: {
    padding: "15px 30px",
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

// Add animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);