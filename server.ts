import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { createUser, verifyUser, getUsers } from "./src/db/authDb";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing with reasonable size limits
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Health check endpoint for Docker & CI/CD
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: "Too many authentication attempts, please try again later." }
});

const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Missing required fields" });
    const user = await createUser(email, password, name);
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await verifyUser(email, password);
    if (!user) return res.status(400).json({ error: "Invalid email or password" });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: "Server error during login" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

app.get("/api/auth/me", authenticateToken, (req: any, res: any) => {
  const users = getUsers();
  const user = users.find((u: any) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
});

// Initialize the Gemini AI Client on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper: safe AI request executor
async function getGeminiResponse(prompt: string, systemInstruction?: string, jsonSchema?: any) {
  if (!process.env.GEMINI_API_KEY) {
    const error: any = new Error("AI features are unavailable because the GEMINI_API_KEY is missing. Please configure it in your environment settings.");
    error.status = 503;
    throw error;
  }

  const config: any = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }
  if (jsonSchema) {
    config.responseMimeType = "application/json";
    config.responseSchema = jsonSchema;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config,
  });

  return response.text;
}

// 1. AI Endpoint: Suggest issue description & acceptance criteria
app.post("/api/ai/suggest-description", authenticateToken, async (req, res) => {
  try {
    const { title, issueType } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title/summary is required." });
    }

    const prompt = `Create a professional WorrkFree description for a ${issueType || "Story"} with the summary/title: "${title}". 
Include:
1. **Goal / Context**: What are we building and why?
2. **User Story**: Format as "As a... I want to... So that..." (if applicable).
3. **Acceptance Criteria**: 3-5 clear bulleted criteria (e.g., Given/When/Then or checklist style).
4. **Technical Notes / Scope**: A few bullet points on technical implementation details or constraints.

Format the output strictly as clear, standard Markdown.`;

    const systemInstruction = "You are an expert product manager and agile lead. Write highly polished, clear, structured, and developer-friendly WorrkFree issue descriptions.";
    const markdownResult = await getGeminiResponse(prompt, systemInstruction);
    
    res.json({ description: markdownResult });
  } catch (error: any) {
    console.error("AI Description Error:", error.message);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Failed to generate issue description" });
  }
});

// 2. AI Endpoint: Estimate story points with a rationale
app.post("/api/ai/estimate-points", authenticateToken, async (req, res) => {
  try {
    const { title, description, issueType } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required for estimation." });
    }

    const prompt = `Estimate story points for the following ${issueType || "task"}:
Title: ${title}
Description: ${description || "No description provided."}

Suggest a standard Fibonacci sequence story point: 1, 2, 3, 5, 8, or 13.
Provide a clear rationale explaining the complexity, effort, and uncertainty behind the estimate.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        points: {
          type: Type.NUMBER,
          description: "The estimated story points (standard Fibonacci: 1, 2, 3, 5, 8, 13)."
        },
        rationale: {
          type: Type.STRING,
          description: "A concise 2-3 sentence explanation of the estimate based on complexity, effort, and uncertainty."
        }
      },
      required: ["points", "rationale"]
    };

    const systemInstruction = "You are an expert technical lead estimating tasks in Fibonacci numbers (1, 2, 3, 5, 8, 13).";
    const jsonStr = await getGeminiResponse(prompt, systemInstruction, responseSchema);
    
    if (jsonStr) {
      res.json(JSON.parse(jsonStr));
    } else {
      res.status(500).json({ error: "Failed to parse estimate response." });
    }
  } catch (error: any) {
    console.error("AI Estimation Error:", error.message);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Failed to generate estimation" });
  }
});

// 3. AI Endpoint: Break down an issue into sub-tasks
app.post("/api/ai/break-down", authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Parent title is required." });
    }

    const prompt = `Analyze this WorrkFree task and break it down into 3 to 6 logical, implementation-level sub-tasks.
Parent Task Title: ${title}
Parent Task Description: ${description || "No description provided."}

For each sub-task, provide a short, actionable title and a 1-sentence instruction.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        subtasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Sub-task summary, e.g., 'Setup DB model schema'."
              },
              description: {
                type: Type.STRING,
                description: "Short 1-sentence objective."
              }
            },
            required: ["title", "description"]
          }
        }
      },
      required: ["subtasks"]
    };

    const systemInstruction = "You are a software architect breaking down technical stories into small, bite-sized engineering sub-tasks.";
    const jsonStr = await getGeminiResponse(prompt, systemInstruction, responseSchema);
    
    if (jsonStr) {
      res.json(JSON.parse(jsonStr));
    } else {
      res.status(500).json({ error: "Failed to parse subtasks." });
    }
  } catch (error: any) {
    console.error("AI Break Down Error:", error.message);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Failed to break down task" });
  }
});

// 4. AI Endpoint: Autocomplete sprint planner (Generates a full batch of items from a project goal)
app.post("/api/ai/generate-sprint", authenticateToken, async (req, res) => {
  try {
    const { goal } = req.body;
    if (!goal) {
      return res.status(400).json({ error: "Goal or theme is required." });
    }

    const prompt = `We want to plan a mini-sprint / backlog of issues to achieve this goal: "${goal}".
Generate a structured set of 4 to 7 realistic agile issues (including Epic, Story, Task, or Bug) needed to execute this goal from start to finish.
For each issue, provide:
- summary (short title)
- issueType ("Epic", "Story", "Task", "Bug")
- priority ("Highest", "High", "Medium", "Low")
- storyPoints (1, 2, 3, 5, 8, 13)
- description (brief PM-style details)
- initialStatus ("To Do" or "In Progress" or "Backlog")`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        issues: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              issueType: { 
                type: Type.STRING, 
                enum: ["Epic", "Story", "Task", "Bug"] 
              },
              priority: { 
                type: Type.STRING, 
                enum: ["Highest", "High", "Medium", "Low"] 
              },
              storyPoints: { type: Type.INTEGER },
              description: { type: Type.STRING },
              initialStatus: { 
                type: Type.STRING, 
                enum: ["Backlog", "To Do", "In Progress"] 
              }
            },
            required: ["summary", "issueType", "priority", "storyPoints", "description", "initialStatus"]
          }
        }
      },
      required: ["issues"]
    };

    const systemInstruction = "You are an experienced Agile Lead & Product Owner. You can spin up an entire mini-sprint roadmap based on a high-level goal.";
    const jsonStr = await getGeminiResponse(prompt, systemInstruction, responseSchema);
    
    if (jsonStr) {
      res.json(JSON.parse(jsonStr));
    } else {
      res.status(500).json({ error: "Failed to generate sprint." });
    }
  } catch (error: any) {
    console.error("AI Sprint Generation Error:", error.message);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Failed to generate sprint plan" });
  }
});

// Express serving + Vite compilation
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
