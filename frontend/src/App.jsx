import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = "http://127.0.0.1:8000";
const NAME_KEY = "genai_app_username";
const CHATS_KEY = "genai_app_chats";

const SUGGESTIONS = [
  { label: "Analyze an image", prompt: "", icon: "image", needsImage: true },
  { label: "Explain a concept", prompt: "Explain this concept in simple terms: ", icon: null },
  { label: "Summarize text", prompt: "Summarize the following text: ", icon: null },
  { label: "Debug code", prompt: "Help me debug this code: ", icon: null },
  { label: "Draft an email", prompt: "Write a professional email about: ", icon: null },
  { label: "Brainstorm ideas", prompt: "Brainstorm ideas for: ", icon: null },
];

const Icon = ({ name, size = 18 }) => {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "sidebar":
      return (
        <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="9" y1="4" x2="9" y2="20" /></svg>
      );
    case "edit":
      return (
        <svg {...common}><path d="M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3z" /><path d="M13.5 6.5l3 3" /></svg>
      );
    case "library":
      return (
        <svg {...common}><path d="M4 4h6v16H4z" /><path d="M14 4h6v16h-6z" /></svg>
      );
    case "tasks":
      return (
        <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 12l2.5 2.5L16 9" /></svg>
      );
    case "projects":
      return (
        <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /></svg>
      );
    case "discover":
      return (
        <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M15 9l-2 6-6 2 2-6z" /></svg>
      );
    case "imagine":
      return (
        <svg {...common}><path d="M21 12a8 8 0 0 1-12.2 6.8L3 20l1.2-5.8A8 8 0 1 1 21 12z" /></svg>
      );
    case "experiments":
      return (
        <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
      );
    case "plus":
      return (
        <svg {...common}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      );
    case "chevron":
      return (
        <svg {...common}><polyline points="6 9 12 15 18 9" /></svg>
      );
    case "image":
      return (
        <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-9 9" /></svg>
      );
    case "voice":
      return (
        <svg {...common}><line x1="6" y1="10" x2="6" y2="14" /><line x1="10" y1="6" x2="10" y2="18" /><line x1="14" y1="8" x2="14" y2="16" /><line x1="18" y1="11" x2="18" y2="13" /></svg>
      );
    case "arrow-up":
      return (
        <svg {...common}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="6 11 12 5 18 11" /></svg>
      );
    case "temporary":
      return (
        <svg {...common}><circle cx="12" cy="12" r="9" strokeDasharray="3 3" /></svg>
      );
    default:
      return null;
  }
};

function NamePrompt({ onSubmit }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <div className="name-overlay">
      <form className="name-card" onSubmit={handleSubmit}>
        <div className="logo-mark large">G</div>
        <h2>Welcome to GenAI App</h2>
        <p>What should we call you?</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
        />
        <button type="submit" disabled={!name.trim()}>
          Continue
        </button>
      </form>
    </div>
  );
}

function App() {
  const [userName, setUserName] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(NAME_KEY);
    if (stored) setUserName(stored);
    try {
      const storedChats = JSON.parse(localStorage.getItem(CHATS_KEY) || "[]");
      if (Array.isArray(storedChats)) setChats(storedChats);
    } catch {
      // ignore malformed history
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  }, [chats]);

  const handleNameSubmit = (name) => {
    localStorage.setItem(NAME_KEY, name);
    setUserName(name);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.needsImage) {
      fileInputRef.current?.click();
    } else {
      setPrompt(suggestion.prompt);
    }
  };

  const persistCurrent = () => {
    if (messages.length === 0) return;
    const firstUser = messages.find((m) => m.role === "user");
    const title = (firstUser?.text || "New chat").trim().slice(0, 60);
    setChats((prev) => {
      if (activeChatId) {
        return prev.map((c) => (c.id === activeChatId ? { ...c, title, messages } : c));
      }
      return [{ id: Date.now().toString(), title, messages }, ...prev];
    });
  };

  const handleNewChat = () => {
    persistCurrent();
    setMessages([]);
    setActiveChatId(null);
    setPrompt("");
    clearImage();
  };

  const handleLoadChat = (chat) => {
    if (chat.id === activeChatId) return;
    persistCurrent();
    setMessages(chat.messages || []);
    setActiveChatId(chat.id);
    setPrompt("");
    clearImage();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = { role: "user", text: prompt, image: imagePreview };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const currentPrompt = prompt;
    const currentImage = image;
    setPrompt("");
    clearImage();

    try {
      let res;
      if (currentImage) {
        const formData = new FormData();
        formData.append("prompt", currentPrompt);
        formData.append("image", currentImage);
        res = await axios.post(`${BACKEND_URL}/chat-with-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axios.post(`${BACKEND_URL}/chat`, { prompt: currentPrompt });
      }

      setMessages((prev) => [...prev, { role: "assistant", text: res.data.response }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Check the backend terminal.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const Composer = ({ hero }) => (
    <form className={`composer ${hero ? "hero-composer" : ""}`} onSubmit={handleSubmit}>
      {imagePreview && (
        <div className="attachment-preview">
          <img src={imagePreview} alt="preview" />
          <button type="button" className="remove-attachment" onClick={clearImage}>
            ×
          </button>
        </div>
      )}
      <div className="composer-box">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message GenAI App"
          rows={1}
          autoFocus={hero}
        />
        <div className="composer-toolbar">
          <button
            type="button"
            className="tool-btn round"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            <Icon name="plus" size={18} />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          <button type="button" className="tool-btn text">
            Smart <Icon name="chevron" size={14} />
          </button>
          <div className="toolbar-spacer" />
          {prompt.trim() ? (
            <button type="submit" className="send-button" disabled={loading}>
              <Icon name="arrow-up" size={18} />
            </button>
          ) : (
            <button type="button" className="tool-btn round voice" title="Voice">
              <Icon name="voice" size={18} />
            </button>
          )}
        </div>
      </div>
    </form>
  );

  if (!userName) {
    return <NamePrompt onSubmit={handleNameSubmit} />;
  }

  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-brand">
            <span className="brand-dot" />
            GenAI
          </span>
          <button className="ghost-icon" title="Collapse sidebar">
            <Icon name="sidebar" size={18} />
          </button>
        </div>

        <nav className="sidebar-section">
          <button className="nav-item" onClick={handleNewChat}>
            <Icon name="edit" size={18} />
            <span>New chat</span>
          </button>
        </nav>

        <div className="recent-list">
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`recent-item ${chat.id === activeChatId ? "active" : ""}`}
              onClick={() => handleLoadChat(chat)}
            >
              {chat.title}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div className="user-meta">
              <span className="user-name">{userName}</span>
              <span className="user-plan">Free Plan</span>
            </div>
          </div>
          <button className="upgrade-btn">Upgrade</button>
        </div>
      </aside>

      <main className="main">
        <div className="top-bar">
          <button className="temp-pill">
            <Icon name="temporary" size={14} />
            <span>Temporary</span>
          </button>
        </div>

        {messages.length === 0 ? (
          <div className="hero">
            <h1>Hi {userName}, what should we dive into today?</h1>

            <Composer hero />

            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s.icon && <Icon name={s.icon} size={16} />}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <p className="disclaimer">
              GenAI App is an AI and may make mistakes. Using GenAI App means you agree to the{" "}
              <a href="#">Terms of Use</a>. See our <a href="#">Privacy Statement</a>.
            </p>
          </div>
        ) : (
          <>
            <div className="chat-area">
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.role}`}>
                  <div className={`bubble ${msg.role} ${msg.error ? "error" : ""}`}>
                    {msg.image && <img src={msg.image} alt="uploaded" className="bubble-image" />}
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-row assistant">
                  <div className="bubble assistant thinking">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}
            </div>

            <Composer />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
