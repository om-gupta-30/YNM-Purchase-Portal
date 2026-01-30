import { NextRequest } from 'next/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';
import { extractPdfData } from '@/lib/pdf-parser';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return Response.json(
        { success: false, error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract PDF data
    const result = await extractPdfData(buffer);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error('PDF extraction error:', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Error processing PDF' },
      { status: 500 }
    );
  }
}
