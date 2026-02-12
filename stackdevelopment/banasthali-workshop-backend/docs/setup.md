# 🚀 Getting Started: Complete Setup Guide

Welcome! This guide will help you set up your Node.js development environment and get your project running in just a few minutes.

---

## ✅ Before You Begin

Make sure you have:
- A terminal or command prompt ready to use
- An internet connection to download Node.js
- About 10 minutes to complete the setup

---

## 1️⃣ Install Node.js

**What is Node.js?** It's a JavaScript runtime that lets you run JavaScript on your computer (not just in browsers).

### How to Install

1. Go to https://nodejs.org/en/download
2. Download the **LTS (Long Term Support)** version - it's the most stable
3. Run the installer and follow the on-screen instructions
4. When asked, keep the default installation path

### Verify Installation

Open your terminal and run these commands:

```bash
node --version
npm --version
```

You should see version numbers for both. If you see errors, restart your terminal or computer and try again.

---

## 2️⃣ Set Up Your Project

### Create a New Project Directory

```bash
npm init -y
```

This creates a `package.json` file that tracks your project settings and dependencies.

### Enable Modern JavaScript (ES Modules)

Open `package.json` and add this line:

```json
"type": "module"
```

This allows you to use modern `import` and `export` syntax instead of older `require()` statements.

---

## 3️⃣ Install Essential Tools

Install the tools you'll need to build your web server:

```bash
npm install express nodemon
```

**What are these?**
- **Express** → A lightweight web framework for building server APIs
- **Nodemon** → Automatically restarts your server whenever you save file changes (saves you manual restarts!)

---

## 4️⃣ Create Your Entry File

Create a file called `index.js` in your project's root directory. This is where your server code will live and your routes will be defined.

---

## 5️⃣ Start Your Server

Ready to launch? Run this command:

```bash
nodemon index.js
```

Your server is now running! Nodemon will watch for changes and automatically restart when you make updates.

---

## 🎉 You're All Set!

Your development environment is ready. Start writing your server code in `index.js` and happy coding!