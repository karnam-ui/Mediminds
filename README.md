# MediMinds
**AI-Powered Caregiver Support Portal**

MediMinds is a specialized health management platform designed to assist caregivers in monitoring elderly patients. It bridges the gap between complex medical data and actionable care.

## Core Features
- **AI Prescription OCR:** Scan handwritten or printed prescriptions using **Gemini 3 Flash** to automatically populate medication schedules.
- **Smart Health Summaries:** Instant AI-generated analysis of BP and Blood Sugar trends to assess patient stability.
- **Real-Time Med Vault:** A live dashboard for tracking daily medication adherence, powered by **Firebase Firestore**.
- **Secure Data Isolation:** Multi-user support ensuring caregivers only access their assigned patient profiles.

## Technical Architecture
- **Frontend:** React.js + Tailwind CSS + Vite
- **AI Engine:** Google Gemini 3 Flash API (Generative AI)
- **Backend/Database:** Firebase Firestore (NoSQL)
- **Deployment:** Firebase Hosting / Git
