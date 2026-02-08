# LearnSphere

A comprehensive, modern learning management system (LMS) built with Next.js 14+ and PostgreSQL, featuring real-time video sessions, AI-powered content generation, and a complete course management ecosystem.

## Introduction

LearnSphere is a full-stack educational platform designed to bridge the gap between instructors and learners through innovative technology. The platform combines traditional course management with cutting-edge features like daily one-on-one video sessions, AI-powered quiz generation, and multimodal content analysis to create an engaging, personalized learning experience.

Built with performance and scalability in mind, LearnSphere leverages Next.js App Router for server-side rendering, PostgreSQL for robust data management, and integrates with third-party services (Daily.co for WebRTC, S3-compatible storage for media) to deliver a production-ready educational platform.

## Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router, Server Components, Server Actions)
- **Language**: TypeScript
- **Database**: PostgreSQL (with connection pooling via `pg`)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Credentials + Google OAuth)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Custom component library with Radix UI primitives
- **Video Conferencing**: [Daily.co](https://www.daily.co/) WebRTC SDK
- **File Storage**: S3-compatible storage (AWS S3)
- **Email**: Nodemailer with SMTP
- **FastAPI Server**: External multimodal AI service for content analysis and quiz generation
- **Animations**: Framer Motion

## Database Design

LearnSphere uses a well-normalized PostgreSQL schema designed for scalability, data integrity, and performance. The design choices reflect real-world educational platform requirements.

### Core Design Principles

1. **Soft Deletion**: Most entities use `deleted_at` timestamps instead of hard deletes, enabling audit trails and data recovery. See [`scripts/schema.sql`](scripts/schema.sql#L45-L46) for the `users` table pattern.

2. **Array Types for Flexibility**: PostgreSQL arrays are used for `user.roles` (allowing multiple roles per user) and `course.tags` (enabling efficient tag queries without joins). Indexed with GIN for fast lookups: [`scripts/schema.sql`](scripts/schema.sql#L49-L50).

3. **Denormalized Aggregates**: Course statistics (`total_lessons_count`, `total_duration_minutes`, `average_rating`) are stored on the `courses` table and updated via triggers to avoid expensive joins. See [`scripts/schema.sql`](scripts/schema.sql#L647-L672) for the trigger implementation.

4. **Check Constraints for Data Integrity**: Business rules are enforced at the database level:
   - `check_video_fields`: Video lessons must have `video_url` and `video_duration_minutes` ([`scripts/schema.sql`](scripts/schema.sql#L170-L173))
   - `check_website_when_published`: Published courses require a `website_url` ([`scripts/schema.sql`](scripts/schema.sql#L103-L106))
   - `check_price_when_payment`: Paid courses must have a price > 0 ([`scripts/schema.sql`](scripts/schema.sql#L99-L102))

5. **Audit Trail**: The `activity_logs` table tracks all user actions with metadata, IP addresses, and user agents for compliance and debugging ([`scripts/schema.sql`](scripts/schema.sql#L498-L515)).

6. **Points & Badge System**: Points are tracked in `user_points_history` with running totals, and badges are automatically calculated via triggers based on thresholds. The badge calculation function is defined at [`scripts/schema.sql`](scripts/schema.sql#L610-L621).

### Key Tables

- **`users`**: OAuth-compatible user accounts with role arrays, points, and badges ([`scripts/schema.sql`](scripts/schema.sql#L26-L46))
- **`courses`**: Course metadata with visibility rules, access control, and denormalized stats ([`scripts/schema.sql`](scripts/schema.sql#L74-L108))
- **`lessons`**: Polymorphic content (video, document, image, quiz) with type-specific constraints ([`scripts/schema.sql`](scripts/schema.sql#L147-L186))
- **`quizzes` & `quiz_questions`**: Multi-attempt quizzes with configurable point rewards ([`scripts/schema.sql`](scripts/schema.sql#L122-L243))
- **`course_enrollments`**: Tracks learner progress, completion status, and payment info ([`scripts/schema.sql`](scripts/schema.sql#L248-L279))
- **`lesson_progress`**: Granular progress tracking per lesson with video progress percentages ([`scripts/schema.sql`](scripts/schema.sql#L291-L307))
- **`meeting_rooms`**: Daily.co room management for instructor-learner sessions ([`lib/migrations/001_meetings.sql`](lib/migrations/001_meetings.sql#L9-L20))

### Performance Optimizations

- **GIN Indexes**: Used for array columns (`roles`, `tags`) and JSONB fields (`options` in quiz questions) for fast containment queries
- **Partial Indexes**: Many indexes include `WHERE deleted_at IS NULL` to exclude soft-deleted rows, reducing index size
- **Materialized Views**: Reporting dashboard uses a view (`vw_reporting_dashboard`) for efficient aggregation ([`scripts/schema.sql`](scripts/schema.sql#L820-L845))
- **Trigger-Based Updates**: Course stats and enrollment progress are updated automatically via triggers, avoiding N+1 queries

## Open Innovations We Are Proud of

### Daily-SDK Based One-on-One Video Mentoring Sessions

LearnSphere integrates [Daily.co](https://www.daily.co/) to enable real-time, one-on-one video sessions between instructors and learners. This feature provides a seamless, in-app video conferencing experience **without requiring external tools**, enabling personalized mentorship and real-time Q&A sessions.

#### Architecture Overview

The video session system consists of three main components:

1. **Instructor Status Management**: Instructors can toggle their online/offline status, which is displayed to learners in real-time. The status is stored in the `instructor_status` table and exposed via [`app/api/instructor/status/route.ts`](app/api/instructor/status/route.ts).

2. **Meeting Room Creation & Management**: When a learner initiates a meeting, the system orchestrates room creation, conflict resolution, and metadata tracking.

3. **Client-Side Video Interface**: A full-featured video conferencing UI built with Daily.co's React SDK.

#### 1. Instructor Status Management

**Database Schema**: [`lib/migrations/001_meetings.sql`](lib/migrations/001_meetings.sql#L3-L7)

The `instructor_status` table tracks whether instructors are available for meetings:
- `user_id`: Foreign key to the users table
- `is_active`: Boolean flag indicating online/offline status
- `updated_at`: Timestamp for tracking status changes

**API Endpoints**:
- **GET `/api/instructor/status`**: Retrieves all instructors with their current online/offline status
- **POST `/api/instructor/status`**: Allows instructors to update their availability status

**Real-Time Updates**: The status is checked when learners view their course dashboard, showing a green/red indicator next to the instructor's name ([`app/(website)/my-courses/my-courses-client.tsx`](app/(website)/my-courses/my-courses-client.tsx#L168-L176]).

#### 2. Meeting Room Creation & Management

**Implementation**: [`app/api/meetings/route.ts`](app/api/meetings/route.ts#L13-L86)

When a learner clicks "Start Meeting", the following process occurs:

1. **Conflict Resolution**: The system first ends any existing active or waiting meetings for the instructor to prevent conflicts ([`app/api/meetings/route.ts`](app/api/meetings/route.ts#L31-L35]):
   ```sql
   UPDATE meeting_rooms SET status = 'ended', ended_at = NOW()
   WHERE instructor_id = $1 AND status IN ('waiting', 'active')
   ```

2. **Student Information Retrieval**: The system fetches the learner's name from the database to personalize the meeting room ([`app/api/meetings/route.ts`](app/api/meetings/route.ts#L37-L41]).

3. **Daily.co Room Creation**: A room is created via Daily.co's REST API with specific properties:
   - **Expiry Time**: 30 minutes from creation (`exp: Math.round(Date.now() / 1000) + 60 * 30`) ([`app/api/meetings/route.ts`](app/api/meetings/route.ts#L44])
   - **Chat Enabled**: Allows text chat during the session ([`app/api/meetings/route.ts`](app/api/meetings/route.ts#L54])
   - **Screen Sharing Enabled**: Instructors and learners can share their screens ([`app/api/meetings/route.ts`](app/api/meetings/route.ts#L55])
   - **Max Participants**: Limited to 2 (instructor + learner) for focused sessions ([`app/api/meetings/route.ts`](app/api/meetings/route.ts#L56])

4. **Database Record Creation**: Meeting metadata is stored in `meeting_rooms` table for tracking and analytics.

5. **Response**: The room URL is returned to the client, which redirects to the meeting page.

**Meeting End Handling**: When a participant leaves, the meeting status is updated to 'ended' with an `ended_at` timestamp for analytics and cleanup.

#### 3. Client-Side Video Interface

**Implementation**: [`app/meeting/meeting-client.tsx`](app/meeting/meeting-client.tsx)

The meeting interface is built using Daily.co's React hooks (`@daily-co/daily-react`) and provides a professional video conferencing experience.

**State Machine**: The component uses a state machine to manage the meeting lifecycle ([`app/meeting/meeting-client.tsx`](app/meeting/meeting-client.tsx#L26]):
- `idle`: Initial state, waiting for room URL
- `haircheck`: Pre-join device selection and preview
- `joining`: Transitioning to joined state
- `joined`: Active meeting
- `leaving`: Exiting the meeting
- `error`: Error state for handling failures

**Hair Check Component**: [`app/meeting/meeting-client.tsx`](app/meeting/meeting-client.tsx#L188-L288)

Before joining, users go through a "hair check" phase where they can:
- **Preview Video**: See themselves in a video preview with mirroring enabled
- **Set Username**: Enter their display name for the meeting
- **Select Camera**: Choose from available camera devices
- **Select Microphone**: Choose from available microphone devices

**Call View Component**: [`app/meeting/meeting-client.tsx`](app/meeting/meeting-client.tsx#L290-L329)

Once joined, the call view displays:
- **Remote Participants**: Large video tiles for the other participant
- **Screen Shares**: Detects and displays shared screens
- **Local Video**: Small self-view in the bottom-right corner
- **Waiting State**: Shows a message when alone in the room

**Controls Tray Component**: [`app/meeting/meeting-client.tsx`](app/meeting/meeting-client.tsx#L379-L450]

The bottom control bar provides:
- **Microphone Toggle**: Mute/unmute audio
- **Camera Toggle**: Enable/disable video
- **Screen Share**: Start/stop screen sharing
- **Leave Call**: Exit the meeting and return to course dashboard

#### Learner Integration

**Implementation**: [`app/(website)/my-courses/my-courses-client.tsx`](app/(website)/my-courses/my-courses-client.tsx#L73-L92)

Learners can start meetings directly from their course dashboard:
- **Status Display**: Each course card shows the instructor's online/offline status with a real-time indicator
- **Start Meeting Button**: A prominent button appears only when the instructor is online
- **Meeting Creation Flow**: Single-click meeting creation with loading states and error handling

### AI Agent Server Integration

LearnSphere integrates with a custom FastAPI-based AI agent service powered by Google's Gemini 2.5 Flash model. This multimodal AI service provides three major advantages that enhance both the learning and teaching experience. The agent service is implemented as a separate microservice (located in the [`agent/`](agent/) directory) that can be deployed independently.

#### Architecture Overview

The AI agent is a FastAPI application that serves as a bridge between LearnSphere and Google's Gemini 2.5 Flash multimodal AI model. It handles three primary endpoints:

1. **`/generate-quiz`**: Generates quiz questions from course materials (multimodal)
2. **`/assist`**: Answers learner queries about course content
3. **`/evaluate`**: Explains quiz answers after completion

**Core Technology Stack**:
- **Framework**: FastAPI for high-performance async API endpoints ([`agent/main.py`](agent/main.py#L22-L26))
- **AI Model**: Google Gemini 2.5 Flash - a multimodal model capable of understanding text, images, PDFs, and videos ([`agent/main.py`](agent/main.py#L36-L37))
- **File Processing**: Handles multiple file types with intelligent processing based on MIME type and file size ([`agent/main.py`](agent/main.py#L81-L134))

**Configuration**: The service requires a `GEMINI_API_KEY` environment variable for authentication with Google's API ([`agent/main.py`](agent/main.py#L30-L34)). The API key is loaded from a `.env` file in the agent directory ([`agent/main.py`](agent/main.py#L18-L19)).

#### 1. Multimodal Course Content Analysis for Learner Queries

The AI service can analyze all course materials (documents, images, videos) to answer learner questions contextually. This enables learners to get instant, accurate answers without waiting for instructor responses.

**Backend Implementation**: [`agent/main.py`](agent/main.py#L249-L295)

The `/assist` endpoint receives a simple query string and uses Gemini 2.5 Flash to generate an educational response:

```python
@app.post("/assist", response_model=AssistResponse)
async def assist_with_course(body: AssistRequest):
```

**Key Implementation Details**:

1. **Query Processing**: The endpoint validates that the query is not empty ([`agent/main.py`](agent/main.py#L255-L256)) and escapes special characters to prevent JSON injection ([`agent/main.py`](agent/main.py#L259]).

2. **Prompt Engineering**: A carefully crafted prompt instructs the AI to act as a knowledgeable tutor, providing clear, accurate, and educational responses ([`agent/main.py`](agent/main.py#L260-L271)). The prompt emphasizes:
   - Conciseness with thoroughness
   - Subject-appropriate explanations
   - Structured JSON response format

3. **Model Configuration**: The AI uses conservative generation settings for accuracy:
   - `temperature: 0.4` - Lower temperature for more focused, factual responses ([`agent/main.py`](agent/main.py#L276])
   - `max_output_tokens: 4096` - Sufficient for detailed explanations ([`agent/main.py`](agent/main.py#L279])

4. **Response Parsing**: The service handles markdown code blocks that Gemini sometimes wraps around JSON responses, stripping them before parsing ([`agent/main.py`](agent/main.py#L283-L289]).

**Frontend Integration**: [`app/api/ai/assist/route.ts`](app/api/ai/assist/route.ts)

The Next.js API route acts as a proxy to avoid CORS issues and centralize AI service configuration. It:
- Validates the query parameter
- Forwards the request to the AI service
- Handles errors gracefully
- Returns the structured response to the client

**Technical Flow**:
1. Learner submits a query from the lesson player
2. Frontend calls `/api/ai/assist` with `{ query: "..." }`
3. Next.js API route validates and forwards to `AI_API_URL/assist`
4. FastAPI service processes query through Gemini 2.5 Flash
5. AI returns structured JSON: `{ query: "...", answer: "..." }`
6. Response is proxied back to the learner

#### 2. Quiz Answer Explanation After Completion

After a learner completes a quiz, the AI service provides detailed explanations for each question, explaining why the correct answer is correct and why incorrect options are wrong. This transforms quizzes from assessment tools into learning opportunities.

**Backend Implementation**: [`agent/main.py`](agent/main.py#L298-L359)

The `/evaluate` endpoint takes a question, its options, and the correct answer, then generates an educational explanation:

```python
@app.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_answer(body: EvaluateRequest):
```

**Key Implementation Details**:

1. **Input Validation**: Comprehensive validation ensures data integrity:
   - Question cannot be empty ([`agent/main.py`](agent/main.py#L304-L305])
   - Must have at least 2 options ([`agent/main.py`](agent/main.py#L306-L307])
   - Correct answer must match one of the provided options (after normalization) ([`agent/main.py`](agent/main.py#L308-L314])

2. **Answer Normalization**: Options and correct answers are trimmed and normalized to handle whitespace inconsistencies ([`agent/main.py`](agent/main.py#L308-L309]).

3. **Educational Prompt**: The prompt instructs the AI to act as an educational expert, providing:
   - Clear explanation of why the correct answer is right
   - Brief mention of why other options are wrong (if helpful)
   - Concise but thorough explanations ([`agent/main.py`](agent/main.py#L320-L334])

4. **Strict JSON Response**: The prompt enforces a strict JSON format to ensure consistent parsing ([`agent/main.py`](agent/main.py#L329-L334]).

5. **Lower Temperature**: Uses `temperature: 0.3` for more deterministic, factual explanations ([`agent/main.py`](agent/main.py#L340]).

**Frontend Integration**: [`app/api/ai/evaluate/route.ts`](app/api/ai/evaluate/route.ts)

The Next.js proxy validates input before forwarding:
- Ensures question is provided
- Validates options array has at least 2 items
- Verifies correct_answer is present
- Forwards to AI service and returns explanation

**Technical Flow**:
1. Learner completes a quiz in the lesson player
2. Frontend collects all questions with user's selected answers
3. For each question, `/api/ai/evaluate` is called with:
   ```json
   {
     "question": "...",
     "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
     "correct_answer": "A) ..."
   }
   ```
4. AI service generates explanation via Gemini
5. Returns: `{ question: "...", correct_answer: "...", explanation: "..." }`
6. Explanations are displayed alongside quiz results in the UI

#### 3. AI-Powered Quiz Generation (Multimodal)

Instructors can generate entire quizzes automatically by providing course materials (documents, images, videos), number of questions, and difficulty level. The AI service analyzes all materials using Gemini's multimodal capabilities and generates contextually relevant questions.

**Backend Implementation**: [`agent/main.py`](agent/main.py#L146-L246)

This is the most sophisticated endpoint, handling multimodal file processing:

```python
@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(
    files: List[UploadFile] = File(...),
    num_questions: int = Form(5),
    difficulty: str = Form("medium")
):
```

**Multimodal File Processing Pipeline**: [`agent/main.py`](agent/main.py#L81-L134)

The `process_uploaded_files` function intelligently handles different file types:

1. **Temporary File Storage**: Each uploaded file is written to a temporary location for processing ([`agent/main.py`](agent/main.py#L91-L98]).

2. **MIME Type Detection**: Uses both the uploaded file's content type and Python's `mimetypes` module for accurate type detection ([`agent/main.py`](agent/main.py#L103]).

3. **Intelligent File Handling**:
   - **Videos or Large Files (>20MB)**: Uploaded to Gemini File API for processing ([`agent/main.py`](agent/main.py#L106-L108]). This is necessary because Gemini requires large files to be uploaded separately before use. The `upload_to_gemini` function handles this ([`agent/main.py`](agent/main.py#L69-L78]).
   - **Images**: Loaded using PIL (Pillow) and passed directly to Gemini ([`agent/main.py`](agent/main.py#L114-L118])
   - **PDFs**: Read as binary and passed with MIME type metadata ([`agent/main.py`](agent/main.py#L119-L123])
   - **Text Files**: Decoded as UTF-8 and passed as strings ([`agent/main.py`](agent/main.py#L126-L128])
   - **Unknown Types**: Fallback to Gemini File API upload ([`agent/main.py`](agent/main.py#L130-L132])

4. **Cleanup**: Temporary files are cleaned up after processing to prevent disk space issues ([`agent/main.py`](agent/main.py#L137-L143]). The cleanup function is called in a `finally` block to ensure it runs even if errors occur ([`agent/main.py`](agent/main.py#L245-L246]).

**Quiz Generation Process**:

1. **File Processing**: All uploaded course materials are processed into a format Gemini can understand ([`agent/main.py`](agent/main.py#L169]).

2. **Prompt Engineering**: A detailed prompt instructs Gemini to:
   - Act as an expert educational content creator
   - Analyze all provided materials (text, images, videos)
   - Generate questions at the specified difficulty level
   - Create 4 multiple choice options per question
   - Include explanations for correct answers
   - Return structured JSON ([`agent/main.py`](agent/main.py#L172-L198])

3. **Content Assembly**: Files are combined with the prompt into a single content array for Gemini ([`agent/main.py`](agent/main.py#L204]).

4. **Generation Configuration**: Optimized settings for quiz generation:
   - `temperature: 0.7` - Balanced creativity and accuracy ([`agent/main.py`](agent/main.py#L210])
   - `max_output_tokens: 8192` - Sufficient for multiple questions with explanations ([`agent/main.py`](agent/main.py#L213])

5. **Response Parsing**: Handles markdown code blocks and parses JSON response ([`agent/main.py`](agent/main.py#L218-L231]). The service strips common markdown wrappers (` ```json `, ` ``` `) that Gemini sometimes adds ([`agent/main.py`](agent/main.py#L221-L227]).

**Frontend Integration**: [`app/api/ai/generate-quiz/route.ts`](app/api/ai/generate-quiz/route.ts)

The Next.js endpoint orchestrates the quiz generation:

1. **Course Material Collection**: Fetches all lessons for the course and collects document/image URLs from the database ([`app/api/ai/generate-quiz/route.ts`](app/api/ai/generate-quiz/route.ts#L24-L42]).

2. **File Download**: Downloads each course material file from S3 storage ([`app/api/ai/generate-quiz/route.ts`](app/api/ai/generate-quiz/route.ts#L54-L63]).

3. **Multipart Form Data**: Creates a FormData object with:
   - All course material files
   - `num_questions` parameter
   - `difficulty` parameter ([`app/api/ai/generate-quiz/route.ts`](app/api/ai/generate-quiz/route.ts#L52-L76])

4. **Error Handling**: Gracefully handles missing or inaccessible files, continuing with available materials ([`app/api/ai/generate-quiz/route.ts`](app/api/ai/generate-quiz/route.ts#L54-L63]).

5. **Response Mapping**: The AI service returns questions in format:
   ```json
   {
     "topic": "Course Topic",
     "total_questions": 5,
     "questions": [
       {
         "question": "...?",
         "options": ["A) Option 1", "B) Option 2", ...],
         "correct_answer": "A) Option 1",
         "explanation": "..."
       }
     ]
   }
   ```

   This is mapped to LearnSphere's internal format in the quiz builder ([`app/admin/courses/[id]/quiz-builder/[quizId]/quiz-builder-client.tsx`](app/admin/courses/[id]/quiz-builder/[quizId]/quiz-builder-client.tsx#L204-L226]).

**UI Integration**: [`app/admin/courses/[id]/quiz-builder/[quizId]/quiz-builder-client.tsx`](app/admin/courses/[id]/quiz-builder/[quizId]/quiz-builder-client.tsx#L181-L242)

The quiz builder includes an "AI Generate" button that:
- Opens a modal for configuring generation parameters
- Allows selection of number of questions (default: 5)
- Allows selection of difficulty level (easy, medium, hard)
- Shows loading state during generation
- Displays errors if generation fails
- Automatically populates the quiz with generated questions
- Sets the quiz title from the AI's `topic` field if provided

**Technical Advantages**:

1. **True Multimodality**: Unlike text-only quiz generators, this system can:
   - Extract information from PDF documents
   - Analyze images and diagrams
   - Process video content (when uploaded to Gemini File API)
   - Combine insights from multiple media types

2. **Contextual Relevance**: Questions are generated based on actual course content, ensuring they test understanding of the specific materials provided.

3. **Difficulty Adaptation**: The AI adjusts question complexity based on the difficulty parameter, making it suitable for different learning levels.

4. **Automatic Explanation Generation**: Each question includes an explanation, reducing instructor workload.

#### AI Service Configuration & Deployment

**Environment Variables**:
- `GEMINI_API_KEY`: Google Gemini API key for authentication ([`agent/main.py`](agent/main.py#L30-L32])

**Model Selection**: Uses `gemini-2.5-flash` - Google's latest multimodal model optimized for speed and cost-effectiveness while maintaining high quality ([`agent/main.py`](agent/main.py#L36-L37]).

**Health Check**: The service includes a `/health` endpoint for monitoring and deployment verification ([`agent/main.py`](agent/main.py#L362-L373]). It returns the service status, model name, and API version.

**Dependencies**: See [`agent/requirements.txt`](agent/requirements.txt) for the complete Python dependency list:
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `python-multipart` - File upload support
- `google-generativeai` - Gemini API client
- `Pillow` - Image processing
- `pydantic` - Data validation
- `python-dotenv` - Environment variable management

**Deployment**: The service can be deployed as a standalone FastAPI application using uvicorn ([`agent/main.py`](agent/main.py#L392-L394]) or containerized and deployed to cloud platforms like Google Cloud Run, AWS ECS, or Railway.

## Features of the Application

### Role-Based Authentication

LearnSphere uses [NextAuth.js](https://next-auth.js.org/) for authentication with support for both credentials (email/password) and Google OAuth.

**Implementation**: [`app/api/auth/[...nextauth]/route.ts`](app/api/auth/[...nextauth]/route.ts)

**Key Features**:
- **Multiple Roles per User**: Users can have multiple roles (`admin`, `instructor`, `learner`) stored as a PostgreSQL array. The JWT callback parses roles from the database and includes them in the session ([`app/api/auth/[...nextauth]/route.ts`](app/api/auth/[...nextauth]/route.ts#L80-L95)).
- **OAuth Integration**: Google OAuth is configured with automatic user creation for new users. New OAuth users are flagged with `needsOnboarding: true` to prompt role selection ([`app/api/auth/[...nextauth]/route.ts`](app/api/auth/[...nextauth]/route.ts#L40-L78)).
- **Role Selection Flow**: New Google OAuth users are redirected to `/choose-role` to select their initial role (Learner or Instructor) before accessing the platform ([`app/(auth)/choose-role/page.tsx`](app/(auth)/choose-role/page.tsx)).
- **Session Management**: Custom session callbacks enrich the session with user data (points, badge, avatar) for client-side access ([`app/api/auth/[...nextauth]/route.ts`](app/api/auth/[...nextauth]/route.ts#L97-L110)).

**Server-Side Authorization**: The `requireRole` helper function checks user roles server-side before allowing access to admin/instructor routes ([`lib/auth.ts`](lib/auth.ts)).

### Admin & Instructor Course Management

#### Course Creation & Management

- **Course CRUD**: Full create, read, update, delete operations for courses with server actions ([`lib/actions.ts`](lib/actions.ts#L12-L43)).
- **Kanban & List Views**: Admin dashboard supports both Kanban (grouped by status: Draft, Published, Archived) and list views for course management ([`app/admin/courses/courses-client.tsx`](app/admin/courses/courses-client.tsx#L207-L240)).
- **Role-Based Access**: Admins see all courses; instructors only see courses where they are the `course_admin_id` ([`app/admin/courses/page.tsx`](app/admin/courses/page.tsx)).

#### Content Types & Media Upload

Courses support multiple content types:

1. **Video Lessons**:
   - Direct video file uploads (MP4, WebM, MOV up to 500 MB)
   - YouTube/Vimeo URL embedding
   - Direct S3 video URLs
   - Automatic video duration detection on upload
   - Video preview in the lesson editor

   Implementation: [`app/admin/courses/[id]/course-form-client.tsx`](app/admin/courses/[id]/course-form-client.tsx#L732-L826)

2. **Document Lessons**:
   - PDF, DOCX, PPTX, XLSX, TXT uploads (up to 100 MB)
   - Download permission toggle
   - In-browser PDF viewer for learners

3. **Image Lessons**:
   - Image file uploads (PNG, JPG, GIF, WebP up to 10 MB)
   - Download permission toggle
   - Full-screen image viewer

4. **Quiz Lessons**:
   - Linked to quiz entities
   - Automatic lesson creation when a quiz is created

**S3 Storage Integration**: All media files are uploaded to S3-compatible storage (AWS S3, Cloudflare R2, DigitalOcean Spaces) via a public bucket configuration. The upload flow:

1. Client uploads file to `/api/upload` ([`app/api/upload/route.ts`](app/api/upload/route.ts))
2. Server generates a unique S3 key using `buildStorageKey` ([`lib/storage.ts`](lib/storage.ts#L76-L79))
3. File is uploaded directly to S3 using `PutObjectCommand` ([`lib/storage.ts`](lib/storage.ts#L41-L58))
4. Public URL is returned to the client (no presigning needed for public buckets)

**File Upload Component**: A reusable `FileUpload` component handles drag-and-drop, progress tracking, preview generation, and video duration detection ([`components/ui/file-upload.tsx`](components/ui/file-upload.tsx)).

#### Quiz Creation & Management

- **Quiz Builder**: Full-featured quiz editor with:
  - Question management (add, edit, delete, reorder)
  - Multiple choice questions with configurable correct answers
  - Points per attempt (first: 10, second: 7, third: 5, fourth+: 2)
  - Passing percentage configuration
  - AI-powered quiz generation (see AI Integration section)

  Implementation: [`app/admin/courses/[id]/quiz-builder/[quizId]/quiz-builder-client.tsx`](app/admin/courses/[id]/quiz-builder/[quizId]/quiz-builder-client.tsx)

- **Question Format**: Questions use JSONB for flexible option storage with `{id, text}` pairs and `correct_answer_ids` array for multiple correct answers support ([`scripts/schema.sql`](scripts/schema.sql#L224-L239)).

#### Course Settings & Configuration

- **Visibility Rules**: `everyone` (public) or `signed_in` (requires login) ([`scripts/schema.sql`](scripts/schema.sql#L14])
- **Access Rules**:
  - `open`: Anyone can enroll
  - `on_invitation`: Enrollment requires an invitation
  - `on_payment`: Course requires payment (price must be set)

- **Course Status**: `draft`, `published`, `archived` with automatic `published_at` timestamp on publish
- **Role Assignment**: Admins can assign course administrators (instructors) to courses; instructors see read-only admin info
- **Tags System**: Courses support multiple tags for categorization and filtering
- **Website URL**: Required for published courses (enforced via database constraint)

#### Email Services (Nodemailer)

- **Course Invitations**: Instructors/admins can invite learners via email. The system:
  - Generates unique invitation tokens
  - Sets 14-day expiration
  - Sends HTML emails with course links
  - Tracks invitation status (`pending`, `accepted`, `declined`, `expired`)

  Implementation: [`lib/actions.ts`](lib/actions.ts#L566-L617), [`lib/email.ts`](lib/email.ts#L83-L134)

- **Bulk Messaging**: Instructors can send messages to all enrolled learners in a course via the "Mail Participants" feature. Emails are sent in parallel using `Promise.allSettled` for resilience ([`lib/actions.ts`](lib/actions.ts#L618-L677), [`lib/email.ts`](lib/email.ts#L136-L177)).

**SMTP Configuration**: Nodemailer is configured via environment variables (`SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`) with support for STARTTLS ([`lib/email.ts`](lib/email.ts#L3-L11)).

#### Additional Features

- **Course Preview**: Instructors can preview courses as learners would see them
- **Reporting Dashboard**: Comprehensive analytics showing learner progress, completion rates, time spent, and enrollment status ([`app/admin/reporting/reporting-client.tsx`](app/admin/reporting/reporting-client.tsx))
- **Unsaved Changes Protection**: Course form tracks changes and warns users before leaving with unsaved data ([`app/admin/courses/[id]/course-form-client.tsx`](app/admin/courses/[id]/course-form-client.tsx#L54-L142))

### Learner Features

#### Course Discovery & Enrollment

- **Public Course Catalog**: Browse all published courses with filtering by tags, search by title, and sorting options ([`app/(website)/courses/courses-client.tsx`](app/(website)/courses/courses-client.tsx))
- **Course Detail Pages**: Rich course pages showing:
  - Full description, cover image, tags
  - Instructor information
  - Enrollment count and ratings
  - Course curriculum (lessons list)
  - Reviews from other learners

  Implementation: [`app/(website)/courses/[slug]/course-detail-client.tsx`](app/(website)/courses/[slug]/course-detail-client.tsx)

- **Enrollment Flow**: One-click enrollment for open courses, invitation acceptance for restricted courses, and payment flow for paid courses ([`lib/actions.ts`](lib/actions.ts#L322-L369))

#### My Courses Dashboard

Learners have a personalized dashboard showing all enrolled courses with:

- **Progress Tracking**: Visual progress bars showing completion percentage ([`app/(website)/my-courses/my-courses-client.tsx`](app/(website)/my-courses/my-courses-client.tsx#L209-L213))
- **Status Indicators**: `yet_to_start`, `in_progress`, `completed` with appropriate action buttons
- **Instructor Status**: Real-time online/offline status for course instructors with "Start Meeting" button when online ([`app/(website)/my-courses/my-courses-client.tsx`](app/(website)/my-courses/my-courses-client.tsx#L159-L206))
- **Course Cards**: Beautiful card layout with cover images, tags, progress, and quick actions

#### Lesson Player

The full-screen lesson player provides an immersive learning experience:

- **Video Lessons**:
  - YouTube/Vimeo iframe embedding
  - Direct S3 video playback with HTML5 `<video>` player
  - Video progress tracking (percentage watched)
  - Automatic lesson completion when video is fully watched

- **Document Lessons**:
  - In-browser PDF viewer (iframe)
  - Download links for other document types
  - Download permission enforcement

- **Image Lessons**:
  - Full-screen image viewer with zoom
  - Download option (if permitted)

- **Quiz Lessons**:
  - Interactive quiz interface with question navigation
  - Multiple choice questions with visual feedback
  - Score calculation and passing percentage check
  - Detailed results showing correct/incorrect answers
  - AI-powered explanations for each question (see AI Integration)
  - Multiple attempts support with decreasing point rewards

  Implementation: [`app/(website)/learn/[courseSlug]/[lessonId]/lesson-player-client.tsx`](app/(website)/learn/[courseSlug]/[lessonId]/lesson-player-client.tsx)

- **Lesson Navigation**: Sidebar showing all course lessons with completion indicators and next/previous navigation

#### Points & Badge System

LearnSphere gamifies learning with a comprehensive points and badge system:

- **Points Earning**: Learners earn points by completing quizzes:
  - First attempt: 10 points (configurable per quiz)
  - Second attempt: 7 points
  - Third attempt: 5 points
  - Fourth+ attempts: 2 points

  Points are automatically calculated and awarded on quiz completion ([`lib/actions.ts`](lib/actions.ts#L468-L477)).

- **Points History**: All point changes are tracked in `user_points_history` with running totals, source type, and descriptions ([`scripts/schema.sql`](scripts/schema.sql#L424-L441)).

- **Badge Levels**: Six badge levels with increasing point thresholds:
  - Newbie: 0 points
  - Explorer: 40 points
  - Achiever: 60 points
  - Specialist: 80 points
  - Expert: 100 points
  - Master: 120 points

  Badges are automatically calculated and updated via database triggers ([`scripts/schema.sql`](scripts/schema.sql#L610-L644)).

- **Badge Display**: Learners can see their current badge and progress toward the next badge on their profile page and dashboard ([`app/(website)/my-courses/my-courses-client.tsx`](app/(website)/my-courses/my-courses-client.tsx#L282-L324)).

#### Course Completion Tracking

- **Automatic Progress Updates**: Lesson completion automatically updates enrollment progress via database triggers:
  - `completed_lessons` count
  - `completion_percentage` calculation
  - `status` updates (`yet_to_start` → `in_progress` → `completed`)
  - `started_at` and `completed_at` timestamps

  Implementation: [`scripts/schema.sql`](scripts/schema.sql#L708-L766)

- **Time Tracking**: Total time spent per lesson and per course is tracked in `lesson_progress.time_spent_minutes` and aggregated in `course_enrollments.total_time_spent_minutes`

- **Last Accessed**: System tracks `last_accessed_at` and `last_lesson_id` for resuming courses

#### Course Reviews

Learners can submit reviews (1-5 stars) with optional text feedback after enrolling in a course. Reviews:
- Are linked to enrollments (one review per enrollment)
- Update course `average_rating` and `total_reviews_count` automatically via triggers
- Support approval/featured flags for moderation

Implementation: [`lib/actions.ts`](lib/actions.ts#L551-L562), [`scripts/schema.sql`](scripts/schema.sql#L674-L705)

#### Profile Management

Learners can manage their profile:
- Edit first name and last name
- Upload profile picture (stored in S3 `avatars/` folder)
- View total points and current badge
- See badge progression with visual indicators

Implementation: [`app/(website)/profile/profile-client.tsx`](app/(website)/profile/profile-client.tsx)

#### Additional Learner Features

- **Course Search**: Full-text search across course titles and descriptions
- **Tag Filtering**: Filter courses by tags with visual tag badges
- **Responsive Design**: Fully responsive UI that works on mobile, tablet, and desktop
- **Accessibility**: Semantic HTML, keyboard navigation, and ARIA labels throughout

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL 14+
- S3-compatible storage account (AWS S3, Cloudflare R2, or DigitalOcean Spaces)
- Daily.co account (for video sessions)
- SMTP email account (Gmail, SendGrid, etc.)
- AI service endpoint (optional, for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd LearnSphere-odoo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (create `.env.local`):
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/learnsphere

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# S3 Storage
S3_REGION=us-east-1
S3_ENDPOINT=https://your-endpoint.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=learnsphere
S3_PUBLIC_URL=https://your-public-cdn.com

# Daily.co
DAILY_API_KEY=your-daily-api-key

# SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@learnsphere.com

# AI Service (optional)
AI_API_URL=https://your-ai-service.com
```

4. Run database migrations:
```bash
psql $DATABASE_URL < scripts/schema.sql
psql $DATABASE_URL < scripts/seed.sql
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Default Admin Account

After seeding, you can log in with:
- Email: `admin@learnsphere.com`
- Password: `Admin123!`

---

## License

[Your License Here]

## Contributing

[Contributing Guidelines Here]
