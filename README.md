# SpeakEasyAI ✨

SpeakEasyAI converts your video or audio files into well-structured, SEO-friendly blog posts in seconds using the power of AI. Upload your content, and let SpeakEasyAI handle the transcription and creative writing!

![Project Image](https://www.speakeasyai.dev/og-image.png)

## 🚀 Description

This application leverages the latest web technologies to provide a seamless experience for content creators. Users can upload audio or video files, which are then transcribed using OpenAI's Whisper API. Subsequently, OpenAI's GPT model generates a blog post based on the transcription, mimicking the user's previous writing style for consistency. The platform includes user authentication, subscription plans managed via Stripe, a dashboard for managing posts, and an integrated Markdown editor for refining the generated content.

## ✨ Features

- **AI-Powered Content Generation:**
  - Transcribes audio/video using OpenAI Whisper.
  - Generates blog posts using OpenAI GPT-4o-mini based on transcription and user's past writing style.
- **File Uploads:** Supports audio and video files (up to 32MB) via UploadThing.
- **Authentication:** Secure user sign-up/sign-in using Clerk (Email/Password, Google, GitHub, Passkeys).
- **Subscription Plans:** Tiered plans (Basic, Pro) managed with Stripe checkout and webhooks.
- **User Dashboard:** Central place for users to upload files and manage generated posts.
- **Post Management:** View a list of generated posts and navigate to individual posts.
- **Markdown Editor:** Edit and refine generated blog posts using an integrated MDX-based editor.
- **Content Export:** Download edited blog posts as Markdown files.
- **Protected Routes:** Secure access to dashboard and user-specific content.
- **Responsive Design:** Optimized for both desktop and mobile devices.
- **Modern Tech:** Built with Next.js 14 App Router, Server Actions, and TypeScript.
- **UI:** Clean interface using Tailwind CSS and ShadCN UI components.
- **Notifications:** User feedback via toast notifications.

## 💻 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, PostCSS
- **UI Library:** ShadCN UI, Radix UI
- **Authentication:** Clerk
- **Database:** NeonDb (Serverless Postgres)
- **File Uploads:** UploadThing
- **AI:** OpenAI API (Whisper, GPT-4o-mini)
- **Payments:** Stripe (Checkout, Subscriptions, Webhooks)
- **Markdown Editor:** `@mdxeditor/editor`
- **Utilities:** `zod` (validation), `clsx`, `tailwind-merge`
- **Development Environment:** Node.js, npm (optional: Nix)

## ⚙️ Setup Instructions

To set up the project locally, follow these steps:

1.  **Fork the Repository:**
    Click the "Fork" button on the top right of the GitHub repository page.

2.  **Clone Your Fork:**

    ```bash
    git clone https://github.com/<Your-Username>/speakeasyai.git
    cd speakeasyai
    ```

3.  **Install Dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

4.  **Set Up Environment Variables:**

    - Copy the example environment file:
      ```bash
      cp .env.example .env.local
      ```
    - Fill in the required API keys and secrets in `.env.local`. You'll need credentials for:
      - Clerk (Authentication)
      - Stripe (Payments)
      - NeonDb (Database URL)
      - UploadThing (File Uploads)
      - OpenAI (AI Services)
      - _(Refer to the respective services' documentation for obtaining these keys)_

5.  **Run the Development Server:**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

6.  **Open the Application:**
    Navigate to `http://localhost:3000` in your browser.

## 🛠️ Usage

1.  **Sign Up / Sign In:** Create an account or log in using one of the available methods (Email, Google, GitHub).
2.  **Choose a Plan:** Select a subscription plan (Basic or Pro) during onboarding or via the Pricing section (handled by Stripe).
3.  **Go to Dashboard:** Navigate to the Dashboard (/dashboard).
4.  **Upload File:** Use the upload form to select an audio or video file (max 32MB).
5.  **Transcription & Generation:** The file will be uploaded, transcribed, and a blog post will be generated automatically. You'll receive toast notifications about the progress.
6.  **View/Edit Post:** Once generated, you'll be redirected to the post editor page (`/posts/[id]`). You can also find your posts listed on the `/posts` page.
7.  **Edit & Export:** Use the Markdown editor to refine the post. You can export the final version as a `.md` file.
