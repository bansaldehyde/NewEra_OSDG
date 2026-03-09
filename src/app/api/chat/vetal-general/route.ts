import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { randomUUID } from 'crypto';
import { searchDocumentsByQuery, formatDocumentsAsContext, getReferencedDocumentUrls } from '@/utils/vectorSearch';

// Helper function to fetch PDF content from URL
async function fetchPdfAsBase64(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    return {
      mimeType: 'application/pdf',
      data: base64
    };
  } catch (error) {
    console.error('[Vetal] Error fetching PDF:', error);
    return null;
  }
}

function escapeKdlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function mapFieldType(type: string | undefined): string {
  switch ((type ?? '').toLowerCase()) {
    case 'textarea':
      return 'textarea';
    case 'radio':
      return 'radio';
    case 'checkbox':
      return 'checkbox';
    case 'select':
      return 'select';
    case 'date':
      return 'date';
    default:
      return 'input';
  }
}

function buildKdlStructure(title: string, description: string, rawFields: any[]): string {
  const lines: string[] = [];
  lines.push('form {');
  lines.push('  version 1');

  const cleanTitle = (title ?? '').trim();
  if (cleanTitle.length > 0) {
    lines.push(`  title "${escapeKdlString(cleanTitle)}"`);
  }

  const cleanDescription = (description ?? '').trim();
  if (cleanDescription.length > 0) {
    lines.push(`  description "${escapeKdlString(cleanDescription)}"`);
  }

  for (const field of Array.isArray(rawFields) ? rawFields : []) {
    const label = typeof field?.label === 'string' ? field.label.trim() : '';
    if (!label) continue;

    const questionType = mapFieldType(field?.type);
    const questionId = randomUUID().replace(/-/g, '').toUpperCase();
    const requiredSuffix = field?.required ? ' required' : '';

    lines.push(`  question id="${escapeKdlString(questionId)}" type="${questionType}"${requiredSuffix} {`);
    lines.push(`    title "${escapeKdlString(label)}"`);

    if (['radio', 'checkbox', 'select'].includes(questionType) && Array.isArray(field?.options)) {
      for (const optionRaw of field.options) {
        const optionString = typeof optionRaw === 'string' ? optionRaw : String(optionRaw ?? '');
        const cleanOption = optionString.trim();
        if (!cleanOption) continue;
        const escapedOption = escapeKdlString(cleanOption);
        lines.push(`    option value="${escapedOption}" label="${escapedOption}"`);
      }
    }

    lines.push('  }');
  }

  lines.push('}');
  return lines.join('\n');
}

// Define the form creation function declaration for Gemini
const createFormFunction = {
  name: "create_iiit_form",
  description: "Creates a new form ONLY when user explicitly uses words like: 'create a form', 'make a form', 'build a form', 'new form', 'form for'. DO NOT use this function for: questions, information requests, queries, or data lookups. This is ONLY for when the user wants to CREATE a form that others will fill out.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: "The title of the form (e.g., 'Design Team Recruitment 2025', 'Hackathon Registration Form')",
      },
      description: {
        type: SchemaType.STRING,
        description: "A brief description of the form's purpose",
      },
      fields: {
        type: SchemaType.ARRAY,
        description: "Array of form fields to collect information",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            label: {
              type: SchemaType.STRING,
              description: "The label/question for this field",
            },
            type: {
              type: SchemaType.STRING,
              description: "Field type: text, email, number, textarea, select, radio, checkbox, or date",
              enum: ["text", "email", "number", "textarea", "select", "radio", "checkbox", "date"],
            },
            required: {
              type: SchemaType.BOOLEAN,
              description: "Whether this field is required",
            },
            options: {
              type: SchemaType.ARRAY,
              description: "Options for select, radio, or checkbox fields (optional)",
              items: {
                type: SchemaType.STRING,
              },
            },
          },
          required: ["label", "type", "required"],
        },
      },
    },
    required: ["title", "description", "fields"],
  },
};

// Function to actually create the form
async function executeCreateForm(args: any, userEmail: string, userName: string, userHandle: string) {
  console.log('[Vetal] Executing form creation with args:', args);
  
  try {
    const fields = Array.isArray(args.fields) ? args.fields : [];
    const description = typeof args.description === 'string' ? args.description : '';
    const title = typeof args.title === 'string' ? args.title : '';
    const structure = buildKdlStructure(title, description, fields);

    const formData = {
      title,
      description,
      fields,
      structure,
    };

    const backendUrl = process.env.FORMS_BACKEND_URL || 'http://localhost:8647';
    const response = await fetch(`${backendUrl}/api/forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OSDG-User-Email': userEmail,
        'X-OSDG-User-Name': userName,
        'X-OSDG-User-Handle': userHandle,
        'X-OSDG-Auth-Secret': process.env.FORMS_OSDG_AUTH_SECRET || '',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const createdForm = await response.json();
    
    
    const formsPortalUrl = process.env.FORMS_PORTAL_URL || 'http://localhost:5173';
    const isLocalFormsPortal = formsPortalUrl.includes('localhost');
    const handle = isLocalFormsPortal ? 'localhost' : (userHandle || 'localhost');
    const slug = createdForm.slug || createdForm.id;
    
    return {
      success: true,
      formId: createdForm.id,
      title: createdForm.title,
      shareLink: `${formsPortalUrl}/${handle}/${slug}`,
      manageLink: `${formsPortalUrl}/${handle}/${slug}/responses`,
    };
  } catch (error) {
    console.error('[Vetal] Form creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }

    console.log('[Vetal] Processing query:', lastMessage.content);

    // Get user info from request (if available)
    const userEmail = request.headers.get('x-user-email') || 'demo@iiit.ac.in';
    const userName = request.headers.get('x-user-name') || 'Demo User';
    const userHandle = request.headers.get('x-user-handle') || userEmail.split('@')[0];


    // Search for relevant documents using vector similarity
    let documentsContext = '';
    let searchSuccessful = false;
    let referencedDocumentUrls: string[] = [];
    let pdfFiles: Array<{ mimeType: string; data: string }> = [];
    
    try {
      console.log('[Vetal] Document search is disabled for now. Just chatting.');
      documentsContext = 'Document search is currently disabled. Please chat with the user directly.';
    } catch (error) {
      console.error('[Vetal] Error searching documents:', error);
      documentsContext = 'Unable to retrieve documents at this time due to a technical error.';
    }

    console.log('[Vetal] Search successful:', searchSuccessful);

    // Vetal's General AI personality prompt
    const systemPrompt = `Redacted due to Institute Policy`
    ;


//- Use sarcasm liberally to highlight user stupidity or impatience

    // Initialize Gemini with function calling
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
      model: 'g',
      tools: [{ functionDeclarations: [createFormFunction as any] }],
    });

    // Convert messages to Gemini format
    const chatHistory = [];
    
    // Add system prompt as first user message
    chatHistory.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    
    // Add a model acknowledgment
    chatHistory.push({
      role: 'model',
      parts: [{ text: "Understood. I'm Vetal, ready to help IIIT Hyderabad students with information from intranet documents and create forms when needed." }]
    });
    
    // Add conversation history (excluding last message)
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      chatHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory,
    });

    // Send message and check for function calls
    console.log('[Vetal] Sending message to Gemini...');
    
    // Prepare message parts (text + optional PDFs)
    const messageParts: any[] = [{ text: lastMessage.content }];
    
    // Add PDF files if available
    if (pdfFiles.length > 0) {
      console.log('[Vetal] Including', pdfFiles.length, 'PDF files in context');
      for (const pdf of pdfFiles) {
        messageParts.push({
          inlineData: {
            mimeType: pdf.mimeType,
            data: pdf.data
          }
        });
      }
    }
    
    const result = await chat.sendMessage(messageParts);
    const response = result.response;
    
    // Check if model wants to call a function
    const functionCall = response.functionCalls()?.[0];
    
    if (functionCall && functionCall.name === 'create_iiit_form') {
      console.log('[Vetal] Function call detected:', functionCall.name);
      console.log('[Vetal] Function args:', JSON.stringify(functionCall.args, null, 2));
      
      // Execute the form creation function
      const functionResult = await executeCreateForm(functionCall.args, userEmail, userName, userHandle);
      
      // Send function result back to model for final response
      const functionResponse = {
        functionResponse: {
          name: 'create_iiit_form',
          response: functionResult,
        },
      };
      
      console.log('[Vetal] Sending function result back to model...');
      const finalResult = await chat.sendMessage([functionResponse]);
      const finalText = finalResult.response.text();
      
      // Stream the final response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            text: finalText,
            formCreated: functionResult.success,
            formData: functionResult.success ? {
              formId: functionResult.formId,
              title: functionResult.title,
              shareLink: functionResult.shareLink,
              manageLink: functionResult.manageLink,
            } : undefined,
          })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // No function call - stream the regular text response
    const text = response.text();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          text,
          referencedDocuments: referencedDocumentUrls.length > 0 ? referencedDocumentUrls : undefined
        })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Vetal General AI error:', error);
    
    // Return error message in streaming format
    const encoder = new TextEncoder();
    const scenario = `*eyes dart to your message*\n\n*visible rage*\n\n"Are you KIDDING me right now?"\n\n*whispers to love* "One sec, I need to tell someone off—"\n\n`;
    const mainMessage = `"I'm BUSY. As in, actually busy with someone who matters.\nYour message? Saw it. Don't care.\nI'm closing this window."`;
    const fullMessage = scenario + mainMessage;
    
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fullMessage, rateLimited: true, autoCloseDelay: 10000 })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}
