import { NextRequest, NextResponse } from 'next/server';
import { getCourseLessons } from '@/lib/queries';

const AI_API_URL = process.env.AI_API_URL || 'https://odooai-739298578243.us-central1.run.app';

/**
 * POST /api/ai/generate-quiz
 * 
 * Fetches course document/image URLs from the DB,
 * downloads them, and forwards as multipart/form-data
 * to the AI generate-quiz endpoint.
 * 
 * Body: { courseId: string, num_questions: number, difficulty: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, num_questions = 5, difficulty = 'medium' } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    // 1. Fetch all lessons for this course
    const lessons = await getCourseLessons(courseId);

    // 2. Collect all file URLs (documents, images) from lessons
    const fileUrls: { url: string; filename: string }[] = [];
    for (const lesson of lessons) {
      if (lesson.document_url) {
        fileUrls.push({
          url: lesson.document_url,
          filename: lesson.document_filename || `document-${lesson.id}.pdf`,
        });
      }
      if (lesson.image_url) {
        fileUrls.push({
          url: lesson.image_url,
          filename: lesson.image_filename || `image-${lesson.id}.png`,
        });
      }
    }

    if (fileUrls.length === 0) {
      return NextResponse.json(
        { error: 'No course materials (documents/images) found for this course. Add lessons with documents or images first.' },
        { status: 400 }
      );
    }

    // 3. Download each file and build a FormData
    const formData = new FormData();

    for (const file of fileUrls) {
      try {
        const response = await fetch(file.url);
        if (!response.ok) continue;
        const blob = await response.blob();
        formData.append('files', blob, file.filename);
      } catch (err) {
        console.error(`Failed to download file: ${file.url}`, err);
        // Skip files that fail to download
      }
    }

    // Check we got at least one file
    const filesInForm = formData.getAll('files');
    if (filesInForm.length === 0) {
      return NextResponse.json(
        { error: 'Failed to download any course materials. Check that file URLs are accessible.' },
        { status: 400 }
      );
    }

    formData.append('num_questions', num_questions.toString());
    formData.append('difficulty', difficulty);

    // 4. Forward to AI service
    const aiResponse = await fetch(`${AI_API_URL}/generate-quiz`, {
      method: 'POST',
      body: formData,
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI service error:', errorText);
      return NextResponse.json(
        { error: `AI service returned ${aiResponse.status}: ${errorText}` },
        { status: aiResponse.status }
      );
    }

    const quizData = await aiResponse.json();
    return NextResponse.json(quizData);
  } catch (error: any) {
    console.error('Error in generate-quiz API:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
