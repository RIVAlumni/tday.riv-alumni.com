# Instructions for tday.riv-alumni.com

--

## Project Overview

This repository contains the RIVAlumni Teachers' Day reception system used for checking in and out former students visiting their alma mater.

It is primarily a SvelteKit application designed to be integrated with Firebase services and deployed via GCP Cloud Run.

The system supports Google sign-in, role-based routing, check-in and conflict resolution workflows, and basic event statistics for projection on a monitoring screen.

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, sveltekit-adapter, mdsvex, paraglide, mcp, experimental

## Technology Stack

- NodeJS 22
- SvelteKit NEXT
- Svelte 5
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- Firebase Firestore Database
- Firebase Functions 2nd Generation
- Firebase Admin SDK

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
