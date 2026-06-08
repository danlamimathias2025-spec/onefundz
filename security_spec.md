# Firestore Security Spec - OneFundz

## 1. Data Invariants
- Each user owns exactly one document in the `/users/{userId}` collection.
- The `userId` in the document path MUST match `request.auth.uid`.
- Sensitive data (`email`, `phoneNumber`, `userName`) must be accessible only by the document owner.
- `createdAt` is immutable after creation.
- All write operations must be performed by an authenticated and email-verified user.

## 2. "Dirty Dozen" Payloads (Examples)
1. `POST /users/evilId` where auth.uid is `goodId`.
2. `PUT /users/authId` attempting to set `createdAt` to a random date.
3. `POST /users/authId` with missing `fullName`.
4. `POST /users/authId` with an extra field `isAdmin: true`.
5. `PATCH /users/authId` when `request.auth.token.email_verified == false`.
6. `GET /users/otherUserId` (attempting PII read).
7. `POST /users/authId` with `email: "not-an-email"`.
8. `POST /users/authId` where `createdAt` != `request.time`.
9. `PATCH /users/authId` where `email` or `phoneNumber` is changed to an already existing value (not directly enforceable in rules but related).
10. `POST /users/authId` with `phoneNumber` longer than 20 chars.
11. `POST /users/authId` with `fullName` as a massive 1MB string.
12. Attempt to delete a user document.

## 3. Test Files
Will be generated as `firestore.rules.test.ts`.
