# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: Every unmatched path in `/databases/{database}/documents` is strictly denied (`allow read, write: if false`).
2. **Verified Admin-Only Writes**: All writes (`create`, `update`, `delete`) to `cms_meta`, `cms_lessons`, `cms_topics`, `cms_videos`, `cms_catalog_docs`, `cms_resources`, `cms_questions`, `cms_quizzes`, and `admins` MUST require:
   - Authenticated Firebase user (`request.auth != null`)
   - Verified email (`request.auth.token.email_verified == true`)
   - Admin authorization via bootstrapped verified email (`hoang08shh@gmail.com`) OR existence in `/admins/{request.auth.uid}`.
3. **Public Read Without PII**: Students (including under-13 THCS students without accounts) can read ONLY explicitly public curriculum records (`existing().isPublic == true`). Draft lessons (`isPublic == false`) and `/admins/{userId}` records are strictly hidden from non-admins.
4. **Strict ID & Field Validation (Anti-Update-Gap & Denial-of-Wallet Guard)**:
   - Every document ID path variable on `get`, `create`, `update`, `delete` MUST satisfy `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, `size() <= 128`).
   - Every `create` and `update` MUST call a standalone `isValid[Entity](incoming())` helper enforcing strict `hasAll`, `hasOnly`, type checks, enum checks, string `.size()` bounds, array `.size()` bounds, and `incoming().ownerUid == request.auth.uid`.
   - Every `update` MUST enforce immutable fields (`ownerUid`, `id`, `createdAt`), `incoming().updatedAt == request.time`, and explicit `affectedKeys().hasOnly([...])`.
   - Every `create` MUST enforce `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
5. **No Blanket List Queries**: Every `allow list` rule explicitly evaluates `existing().isPublic == true || isAdmin()`, forcing client queries to include `where('isPublic', '==', true)` for non-admin reads. `/cms_meta` and `/admins` forbid `list` for non-admins.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Shadow Field Injection on Lesson Create**: Valid lesson payload plus ghost field `{"isSystemAdmin": true}` -> Rejected by `hasOnly(...)`.
2. **Email Spoofing (Unverified Admin Email)**: Request with `token.email == 'hoang08shh@gmail.com'` and `token.email_verified == false` -> Rejected by `isAdmin()`.
3. **Non-Admin Student Write**: Authenticated non-admin user attempting `create` on `/cms_lessons/bai-99` -> Rejected by `isAdmin()`.
4. **Unauthenticated Write**: Anonymous request attempting `update` on `/cms_meta/live` -> Rejected by `isSignedIn()`.
5. **Identity Spoofing (`ownerUid` Mismatch)**: Admin writing `/cms_lessons/bai-10` with `ownerUid: 'other_uid'` != `request.auth.uid` -> Rejected by `isValidCmsLesson()`.
6. **Immutable `createdAt` Tampering on Update**: Update payload changing `createdAt` or `id` -> Rejected by `incoming().createdAt == existing().createdAt && incoming().id == existing().id`.
7. **Client-Forged Timestamp**: Create or update sending client-chosen timestamp instead of `request.time` -> Rejected by `incoming().updatedAt == request.time`.
8. **ID Poisoning (Resource Exhaustion)**: Document ID containing spaces, slashes, dots, or 200-char string -> Rejected by `isValidId(id)`.
9. **Value Poisoning on Allowed Update Key**: Updating `cms_lessons` setting `grade: 99` or `title` > 300 chars -> Rejected by `isValidCmsLesson()`.
10. **PII / Admin Registry Blanket Read**: Non-admin attempting `get` or `list` on `/admins/{otherUid}` -> Rejected by `isOwner(userId) || isAdmin()`.
11. **Draft Lesson Leak via List/Get**: Unauthenticated student attempting `get` on draft lesson (`isPublic == false`) or unscoped `list` without `where('isPublic', '==', true)` -> Rejected by `existing().isPublic == true`.
12. **Unbounded Array / Oversized Content Attack**: Creating lesson with `assets.size() > 50` or `content.size() > 120000` -> Rejected by size caps in `isValidCmsLesson()`.
