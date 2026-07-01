# WorrkFree Agile 🚀

WorrkFree is an AI-powered, open-source Agile Project Management tool designed to streamline your workflows, automate task creation, and provide intelligent sprint planning insights using Google's Gemini AI.

![Dashboard Placeholder](https://via.placeholder.com/1000x500.png?text=WorrkFree+Dashboard+Screenshot)

## 🌟 Live Demo
**[Insert Live URL Here]** (e.g., https://worrkfree.onrender.com)

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion (for micro-animations), Lucide React (Icons)
- **Backend**: Node.js, Express
- **Database**: Local JSON storage (easily swappable to PostgreSQL)
- **Authentication**: JWT, bcryptjs, HTTP-Only Cookies
- **AI Integration**: Google Gemini 3.5 Flash (`@google/genai`)
- **Deployment**: Docker, Docker Compose, GitHub Actions CI/CD

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- A Google Gemini API Key

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/worrkfree-agile.git
   cd worrkfree-agile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Copy `.env.example` to `.env` and fill in your Gemini API key and a custom JWT secret:
   ```bash
   cp .env.example .env
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

### Running with Docker

1. **Build and start the containers**
   ```bash
   docker-compose up --build
   ```
   The app will be available at `http://localhost:80`.

## 🤝 Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.