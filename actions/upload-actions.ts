"use server";
import getDbConnection from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Groq from "groq-sdk"; 

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is not set");
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribeUploadedFile(
  resp: {
    serverData: { userId: string; file: any };
  }[]
) {
  if (!resp) {
    return {
      success: false,
      message: "File upload failed",
      data: null,
    };
  }

  const {
    serverData: {
      userId,
      file: { url: fileUrl, name: fileName },
    },
  } = resp[0];

  if (!fileUrl || !fileName) {
    return {
      success: false,
      message: "File upload failed",
      data: null,
    };
  }

  const response = await fetch(fileUrl);

  try {
    const transcriptionResult = await groq.audio.transcriptions.create({
      model: "whisper-large-v3",
      file: response,
    });

    console.log({ transcriptionResult });

    if (!transcriptionResult || typeof transcriptionResult.text !== 'string') {
      throw new Error("Groq transcription failed or returned invalid format");
    }

    return {
      success: true,
      message: "File uploaded successfully!",
      data: { transcriptionText: transcriptionResult.text, userId },
    };
  } catch (error) {
    console.error("Error processing file with Groq", error);

    if (error instanceof Error && (error.message.includes("too large") || error.message.includes("exceeds"))) {
      return {
        success: false,
        message: "File size exceeds the max limit (likely 25MB).",
        data: null,
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Error processing file",
      data: null,
    };
  }
}

async function saveBlogPost(userId: string, title: string, content: string) {
  try {
    const sql = await getDbConnection();
    const [insertedPost] = await sql`
    INSERT INTO posts (user_id, title, content)
    VALUES (${userId}, ${title}, ${content})
    RETURNING id
    `;
    return insertedPost.id;
  } catch (error) {
    console.error("Error saving blog post", error);
    throw error;
  }
}

async function getUserBlogPosts(userId: string) {
  try {
    const sql = await getDbConnection();
    const posts = await sql`
    SELECT content FROM posts 
    WHERE user_id = ${userId} 
    ORDER BY created_at DESC 
    LIMIT 3
  `;
    return posts.map((post) => post.content).join("\n\n");
  } catch (error) {
    console.error("Error getting user blog posts", error);
    throw error;
  }
}

async function generateBlogPost({
  transcriptionText,
  userPosts,
}: {
  transcriptionText: string;
  userPosts: string;
}) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a skilled content writer that converts audio transcriptions into well-structured, engaging blog posts in Markdown format. Create a comprehensive blog post with a catchy title, introduction, main body with multiple sections, and a conclusion. Analyze the user's writing style from their previous posts and emulate their tone and style in the new post. Keep the tone casual and professional.",
      },
      {
        role: "user",
        // Update the user prompt content
        content: `Here are some of my previous blog posts for reference:\n\n${userPosts || "No previous posts available."}\n\nPlease convert the following transcription into a well-structured blog post using Markdown formatting. Follow this structure:\n\n1. Start with a SEO friendly catchy title on the first line.\n2. Add two newlines after the title.\n3. Write an engaging introduction paragraph.\n4. Create multiple sections for the main content, using appropriate headings (##, ###).\n5. Include relevant subheadings within sections if needed.\n6. Use bullet points or numbered lists where appropriate.\n7. Add a conclusion paragraph at the end.\n8. Ensure the content is informative, well-organized, and easy to read.\n9. Emulate my writing style, tone, and any recurring patterns you notice from my previous posts (if available).\n\nHere's the transcription to convert: ${transcriptionText}`, // Use the correct variable name here
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 4096,
  });

  return chatCompletion.choices[0]?.message?.content || null;
}
export async function generateBlogPostAction({
  transcriptionText,
  userId,
}: {
  transcriptionText: string;
  userId: string;
}) {
  const userPosts = await getUserBlogPosts(userId);

  let postId = null;

  if (transcriptionText) {
    const blogPost = await generateBlogPost({
      transcriptionText: transcriptionText,
      userPosts,
    });

    if (!blogPost) {
      return {
        success: false,
        message: "Blog post generation failed, please try again...",
      };
    }

      // Extract title from the generated markdown
  const [titleLine, ...contentParts] = blogPost?.split('\n\n') || [];
  // Basic title extraction (assuming H1 format: '# Title')
  const title = titleLine?.startsWith('# ') ? titleLine.substring(2).trim() : "Untitled Blog Post";

  // Save the blog post to the database
  try {
     postId = await saveBlogPost(userId, title, blogPost);
  } catch(error) {
      console.error("Failed to save blog post to DB.", error);
      return {
          success: false,
          message: "Failed to save the generated blog post.",
      };
  }
} else { // Add handling if transcriptionText is missing
    console.error("No transcription text provided to generate blog post.");
    return {
        success: false,
        message: "Cannot generate blog post without transcription.",
    };
}

// Add check for postId before redirecting
if (!postId) {
   console.error("Post ID is null after generation/saving attempt.");
   return {
       success: false,
       message: "Failed to create or save the blog post.",
   };
}

// Keep revalidatePath and redirect, add try/catch
   revalidatePath(`/posts/${postId}`);
   redirect(`/posts/${postId}`);

  }
