# WorkQuora Admin & Super Admin API Specification

All Admin API routes are mounted under `/api/admin` (configured with a separate, stricter rate-limiter: max 60 requests per 15 minutes).

---

## 🔐 1. Admin Authentication Module
* **Base Path:** `/api/admin/auth`
* **Rate Limit:** Stricter (60 requests / 15 minutes)

### `POST /login`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "admin@skillsync.com",
    "password": "Password123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "admin_jwt_token_here",
    "refreshToken": "refresh_token_here",
    "admin": {
      "id": "admin_uuid",
      "name": "Super Admin",
      "email": "superadmin@skillsync.com",
      "role": "ADMIN",
      "isSuperAdmin": true,
      "permissions": ["*"]
    }
  }
  ```

### `POST /refresh-token`
* **Access:** Public
* **Request Body:** `{ "refreshToken": "token" }`

### `GET /me`
* **Access:** Admin/SuperAdmin (`protectAdmin`)
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):** Returns current logged-in admin payload.

### `POST /request-change-password-otp`
* **Access:** Admin (`protectAdmin`)
* **Description:** Requests an OTP to change the password (logged in console for dev, sent via SMS for prod).

---

## 👑 2. Super Admin Module (Access Level: Super Admin Only)
* **Base Path:** `/api/admin/super`
* **Middlewares:** `protectAdmin`, `requireSuperAdmin`

### `POST /create-admin`
* **Description:** Create a new administrative user with specific permissions.
* **Request Body:**
  ```json
  {
    "name": "Moderator Name",
    "email": "moderator@skillsync.com",
    "password": "SecurePassword123",
    "mobileNumber": "+919999999999",
    "permissions": ["view_users", "suspend_user", "view_payments"]
  }
  ```

### `GET /admins`
* **Description:** Fetch the list of all admin accounts in the database.

### `PUT /admins/:adminId/suspend`
* **Description:** Suspend an admin account to block their access.
* **Request Body:** `{ "reason": "Policy violation" }`

### `PUT /admins/:adminId/activate`
* **Description:** Activate a suspended admin account.

### `DELETE /admins/:adminId`
* **Description:** Permanently delete an admin account (cannot delete the main Super Admin).

### `GET /admins/:adminId/activity`
* **Description:** Retrieve the detailed audit trail log of a specific administrator (last 50 events).

---

## 👥 3. Admin User Management Module
* **Base Path:** `/api/admin/users`
* **Middlewares:** `protectAdmin`, `requirePermission(required_action)`

### `GET /`
* **Permission Required:** `view_users`
* **Description:** Get all users with query parameters for pagination, role filtering, etc.

### `GET /search`
* **Permission Required:** `view_users`
* **Query Params:** `?q=query_string`
* **Description:** Search users by name, username, or email.

### `GET /:userId`
* **Permission Required:** `view_users`
* **Description:** Retrieve details of a single user.

### `GET /:userId/history`
* **Permission Required:** `view_users`
* **Description:** Retrieve user history (jobs posted, bids submitted, completed works).

### `PUT /:userId/suspend`
* **Permission Required:** `suspend_user`
* **Description:** Suspend a freelancer or client account.

### `PUT /:userId/activate`
* **Permission Required:** `suspend_user`
* **Description:** Reactivate a suspended account.

### `PUT /:userId/block`
* **Permission Required:** `block_user`
* **Description:** Hard block a user from using the application.

### `PUT /:userId/unblock`
* **Permission Required:** `block_user`
* **Description:** Unblock a blocked user.

---

## 📂 4. Admin KYC Verification Module
* **Base Path:** `/api/admin/kyc`
* **Middlewares:** `protectAdmin`

### `GET /pending`
* **Description:** Returns a list of all users with pending KYC submissions waiting for manual review.

### `PATCH /:userId/review`
* **Description:** Approve or reject user's Identity verification steps.
* **Request Body:**
  ```json
  {
    "step": "aadhar", // OR "pan", "bank", "selfie", "all"
    "status": "verified", // OR "rejected"
    "reason": "Documents are clear and match the profile name." // Optional reason
  }
  ```

---

## 💰 5. Admin Payments & Escrow Ledger
* **Base Path:** `/api/admin/payments`
* **Middlewares:** `protectAdmin`, `requirePermission(required_action)`

### `GET /`
* **Permission Required:** `view_payments`
* **Description:** Fetch the entire system ledger (all transaction history records).

### `GET /wallets`
* **Permission Required:** `view_payments`
* **Description:** Fetch the balances and configuration states of all user wallets.

### `GET /earnings`
* **Permission Required:** `view_payments`
* **Description:** Retrieve platform fee earnings overview.

### `GET /withdrawals`
* **Permission Required:** `view_payments`
* **Description:** Get all pending bank payout withdrawal requests.

### `PATCH /withdrawals/:id/process`
* **Permission Required:** `process_refund`
* **Description:** Approve or reject a payout withdrawal request.
* **Request Body:** `{ "status": "completed" }` // OR "failed"

### `POST /:transactionId/refund`
* **Permission Required:** `process_refund`
* **Description:** Initiate a refund process for a transaction.

---

## 📈 6. Admin Analytics Module
* **Base Path:** `/api/admin/analytics`
* **Middlewares:** `protectAdmin`, `requirePermission('view_analytics')`

* `GET /overview` — Get overall user, transaction, and project stats.
* `GET /users` — Get user growth metrics.
* `GET /revenue` — Get revenue statistics.
* `GET /tasks` — Get task creation and completion metrics.
* `GET /recent-activity` — Fetch log actions happening across the database.

---

## 📜 7. Admin Audit Trails & Ad Campaigns
* **Base Paths:** `/api/admin/audit` & `/api/admin/ads`
* **Middlewares:** `protectAdmin`

* `GET /api/admin/audit` — Get all admin logs.
* `POST /api/admin/ads` — Create an advertising campaign (file upload: `media`).
* `PUT /api/admin/ads/:id` — Edit an active ad details.
* `DELETE /api/admin/ads/:id` — Delete an ad banner.
