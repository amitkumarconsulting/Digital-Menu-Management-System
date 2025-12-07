# Digital Menu Management System


## Live Deployment

**Deployment Link:** https://digital-menu-management-system-psi.vercel.app/auth/login

**Note:** The application is deployed on Vercel and is not behind Vercel Authentication.

## Features

### User Management
- Email-based authentication with verification codes
- User profiles with full name and country
- Session management using cookies

### Restaurant Management
- Create and manage multiple restaurants
- Restaurant name and location management
- Full CRUD operations for restaurants

### Menu Management
- Category management (e.g., Starters, Main Course, Desserts)
- Dish management with:
  - Name, description, and image
  - spice level (0-3)
  - price
  - Multi-category assignment (dishes can belong to multiple categories)
- Image URL support for dishes

### Customer Access
- **Public menu view** - No authentication required
- Accessible via QR code or shared link
- Customers can scan QR code or open link directly without logging in
- Fixed category header while scrolling
- Floating menu button for quick category navigation
- Responsive design matching the provided UI mockups

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **ORM:** Prisma
- **Database:** PostgreSQL (hosted on Neon.com)
- **API:** tRPC
- **UI Components:** shadcn/ui
- **Authentication:** Custom email verification system
- **Deployment:** Vercel
- **QR Code Generation:** qrcode library

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon.com recommended)
- Resend API key for email service

### Installation

1. Clone the repository:
```bash
git clone https://github.com/amitkumarconsulting/Digital-Menu-Management-System.git
cd Digital-Menu-Management-System
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

I've shared actual Environment variables for easy setup. Environment will be deleted post review.

Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_usAJaF6y3WQg@ep-sweet-cloud-a11ur92k-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Email service (Resend)
RESEND_API_KEY="re_NCBX4oB7_NVvfCdKKdW2NtDNwke3Lzh9w"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"


MASTER_CODE="123456" (use master opt/code to by pass login, Resend Email needs domain Configuration or if need to use personal gmail then additional configuration is required)
```


4. Set up the database:
```bash
npx prisma db push
```

```bash
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000] in your browser.

## Project Structure

```
/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── auth/          # Authentication pages
│   │   ├── (admin)/
│   │   │   └── admin/         # Admin panel pages
│   │   ├── menu/              # Public menu pages
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── admin/             # Admin-specific components
│   │   └── menu/              # Menu-specific components
│   ├── server/
│   │   ├── api/
│   │   │   └── routers/       # tRPC routers
│   │   ├── auth.ts            # Authentication utilities
│   │   └── db.ts              # Prisma client
│   └── lib/
│       └── utils.ts           # Utility functions
└── public/                    # Static assets
```

## Approach and Implementation

### Architecture
The application follows the T3 Stack architecture with:
- **Next.js App Router** for routing and server components
- **tRPC** for type-safe API communication
- **Prisma** for database operations
- **Custom authentication** using email verification codes stored in the database
- **Session management** via HTTP-only cookies

### Key Design Decisions

1. **Email Verification System**: Implemented a custom email verification flow using Resend for sending codes, with codes stored in the database and expiring after 10 minutes.

2. **Session Management**: Custom session management using cookies instead of NextAuth to have more control and avoid additional dependencies.

3. **Menu Display**: The customer-facing menu page uses intersection observers and scroll listeners to update the active category header, providing a smooth user experience.

4. **Multi-category Dishes**: Implemented a many-to-many relationship between dishes and categories using a junction table, allowing dishes to appear in multiple categories.

5. **QR Code Generation**: QR codes are generated client-side using the qrcode library, allowing for easy download and sharing.

### Edge Cases and Error Handling

1. **Authentication**:
   - Expired verification codes are automatically rejected
   - Rate limiting considerations for code requests
   - Session expiration handling
   - Invalid email format validation

2. **Data Validation**:
   - Required field validation on all forms
   - Image URL validation
   - Spice level range validation (0-3)
   - Price validation (positive numbers)
   - Country name validation

3. **Menu Display**:
   - Empty categories are handled gracefully
   - Missing images show fallback or no image
   - Long descriptions are truncated with "read more" option
   - Invalid restaurant ID shows appropriate error message
   - Loading states for async operations

4. **Image Handling**:
   - Image URL validation
   - Support for external image URLs
   - Graceful handling of broken image links

5. **Error States**:
   - Network errors are caught and displayed
   - Database errors are logged and user-friendly messages shown
   - 404 handling for non-existent resources

### Known Limitations and Future Improvements

1. **Image Upload**: Currently supports image URLs only. Future implementation could include direct image upload to a storage service (e.g., Vercel Blob, AWS S3).

2. **Vegetarian Indicators**: The UI mockups show vegetarian/non-vegetarian indicators.

3. **Rate Limiting**: Email verification code requests don't have strict rate limiting. In production, this should be implemented to prevent abuse.

4. **Email Service**: Currently uses Resend's default "from" email. In production, should use a verified domain.

5. **Password Reset**: No password reset functionality as authentication is code-based. Could add account recovery options.

6. **Menu Sharing**: Could add social sharing options beyond QR codes.

7. **Analytics**: No analytics tracking for menu views, which could be valuable for restaurants.

## Development Tools

**IDE:** VS Code-based

**AI Tools Used:**
- ChatGPT-4 - Code Completition and debugging assistance

**Prompts Used:**
- "Optimize email-based authentication with verification codes"
- "Create a customer-facing menu page with fixed category headers and floating navigation"
- "optimize CRUD operations routes/api"
- "Improve error handling and validation in the Login/Register & Menu/Dish addition"

**AI Tool Effectiveness:**
The AI tools were very helpful for:
- Generating boilerplate code for tRPC routers and React components
- Suggesting UI component structures
- Providing TypeScript type definitions
- Identifying potential bugs and edge cases
-Generating Readme Documentation

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables:
   - `DATABASE_URL`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `MASTER_CODE`

4. Deploy

### Environment Variables Required

- `DATABASE_URL`: PostgreSQL connection string from Neon.com
- `RESEND_API_KEY`: API key from Resend for sending emails
- `NEXT_PUBLIC_APP_URL`: Public URL of the deployed application

## Database Schema

- **User**: Stores user accounts with email, name, country
- **EmailVerificationCode**: Stores temporary verification codes
- **Session**: Manages user sessions
- **Restaurant**: Restaurant information
- **Category**: Menu categories
- **Dish**: Menu items/dishes
- **DishCategory**: Junction table for many-to-many relationship between dishes and categories


This project is created as part of an assignment.
Contact-amitskumar.edu@gmail.com
Mob- +91 7309955817
