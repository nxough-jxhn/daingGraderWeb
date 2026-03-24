# DaingGrader Web User Manual

## Table of Contents
- [1. Scope and Audience](#1-scope-and-audience)
- [2. System Overview](#2-system-overview)
- [3. Access Requirements](#3-access-requirements)
- [4. Getting Started](#4-getting-started)
- [5. Navigation Guide](#5-navigation-guide)
- [6. Core User Workflows](#6-core-user-workflows)
- [7. Seller Workflows](#7-seller-workflows)
- [8. Admin Workflows](#8-admin-workflows)
- [9. Feature Reference](#9-feature-reference)
- [10. Error Messages and Troubleshooting](#10-error-messages-and-troubleshooting)
- [11. Frequently Asked Questions (FAQ)](#11-frequently-asked-questions-faq)
- [12. Support and Contact](#12-support-and-contact)
- [13. Glossary](#13-glossary)
- [14. Appendix](#14-appendix)

---

## 1. Scope and Audience

### 1.1 Scope
This user manual covers the DaingGrader web platform only. It explains how to use website features for general users, sellers, and administrators.

This manual does not include:
- Mobile application usage
- AI model training procedures
- Backend developer setup instructions

### 1.2 Intended Audience
This document is intended for:
- Guest users browsing the platform
- Registered users who scan, shop, and join discussions
- Sellers who manage products and orders
- Administrators who monitor and manage platform operations

### 1.3 Purpose
The purpose of this manual is to help users perform common tasks correctly and efficiently, including:
- Account access and profile setup
- Fish image scanning and result interpretation
- Marketplace and order workflows
- Community interaction
- Role-based operational tasks for sellers and admins

> [!NOTE]
> This manual is focused on practical use of the website interface and workflows.

---

## 2. System Overview

### 2.1 What the Web System Does
DaingGrader is a web-based platform for dried fish quality assessment and marketplace operations. It combines:
- Image-based scanning and grading
- Scan result history and analytics views
- E-commerce features (catalog, cart, checkout, orders)
- Community discussion forum
- Role-based management tools for sellers and admins

### 2.2 Core Modules
The web platform is organized into the following modules:
- Authentication and profile management
- Fish scanning and grading
- Scan history and reporting
- Product catalog and store pages
- Cart, checkout, payment, and order tracking
- Community forum and moderation
- Seller management dashboard and analytics
- Admin management and audit monitoring

### 2.3 Role Access Summary
| Role | Main Capabilities |
|---|---|
| Guest | Browse public pages and informational content |
| User | Scan fish, view history, shop, track orders, use forum |
| Seller | Manage products, process orders, monitor seller analytics |
| Admin | Manage users, scans, posts, orders, payouts, audit and analytics |

### 2.4 High-Level User Flow
1. User logs in to the platform.
2. User chooses an activity: scan fish, browse products, or access community.
3. System processes actions and displays results.
4. Results and transactions are saved for tracking and reporting.
5. Role-specific dashboards provide additional controls for sellers/admins.

---

## 3. Access Requirements

### 3.1 Device and Browser Requirements
To use the web system properly, users should have:
- A desktop or laptop computer (recommended)
- A modern browser (latest Chrome, Edge, Firefox, or Safari)
- Stable internet connection

### 3.2 Account Requirements
Some features are public, but major actions require login.

Without login:
- View selected public pages and content

With login:
- Scan and save history
- Use cart and checkout
- Post/interact in community
- Access role-specific dashboards (seller/admin)

### 3.3 Network and Performance Notes
For best performance:
- Use reliable internet, especially for image upload and checkout
- Avoid uploading very large files beyond allowed limits
- Refresh and retry when temporary network errors occur

### 3.4 Security and User Responsibility
Users should:
- Keep account credentials private
- Use strong passwords
- Log out from shared/public devices
- Avoid sharing sensitive personal information in public community posts

> [!IMPORTANT]
> Use only your own account. Shared accounts can cause audit and access issues.

---

## 4. Getting Started

### 4.1 Create an Account
1. Open the web platform in your browser.
2. Go to the login/register page.
3. Choose **Register**.
4. Enter required account details.
5. Submit registration form.
6. Check email if verification is required.

### 4.2 Log In
1. Open the login page.
2. Enter email and password.
3. Submit credentials.
4. On success, you are redirected to the main web interface.

### 4.3 Set Up Profile
After first login:
1. Open **Profile** page.
2. Review and update personal details.
3. Upload profile image if desired.
4. Save changes.

### 4.4 Basic First Actions
Recommended first actions for new users:
1. Open the **Grade/Scan** page and test one scan.
2. Visit **History** page to confirm saved result.
3. Browse **Catalog** to understand product listings.
4. Open **Forum** page to view community discussions.

### 4.5 Log Out
1. Open account menu.
2. Select **Logout**.
3. Confirm that session is cleared before closing browser on shared devices.

---

## 5. Navigation Guide

### 5.1 Main Navigation Areas
1. Top navigation: access to major pages and account actions.
2. Role-based navigation: seller and admin links appear only for authorized accounts.
3. Content area: page-specific tools, forms, and data tables.

### 5.2 Public and General Pages
1. Home: system introduction and entry points.
2. About and Publications: informational content.
3. Contact: submit inquiries to support.

### 5.3 User Feature Pages
1. Grade: upload or capture fish image for analysis.
2. History: review previous scan results and details.
3. Catalog: browse available products.
4. Product Detail: view product information and reviews.
5. Cart and Checkout: place orders and complete payment.
6. Orders: track order status and receipt access.
7. Forum: create and interact with community posts.
8. Profile: update account details.

### 5.4 Seller Feature Pages
1. Seller Dashboard: sales overview and KPIs.
2. Seller Products: create, edit, disable, and manage listings.
3. Seller Orders: monitor and process incoming orders.
4. Seller Reviews: view product feedback.
5. Seller Discounts and Earnings: pricing campaigns and revenue tracking.

### 5.5 Admin Feature Pages
1. Admin Dashboard: platform-level monitoring.
2. Admin Users: account status and role management.
3. Admin Scans: scan moderation and scan analytics.
4. Admin Posts and Audit Logs: moderation and action traceability.
5. Admin Orders, Discounts, and Payouts: transaction governance.

---

## 6. Core User Workflows

### 6.1 Workflow: Scan Dried Fish
1. Log in to the web platform.
2. Open the **Grade** page.
3. Upload a dried fish image.
4. Submit the image for processing.
5. Wait for the result panel to load.
6. Review fish type, confidence, mold indicators, and final grade.
7. Save or reference the generated result image and details from history.

**Expected result:**
System returns detected fish information and grade output as **Export**, **Local**, or **Reject**.

### 6.2 Workflow: View Scan History
1. Open the **History** page.
2. Browse latest scans.
3. Use filters or chart options if needed.
4. Open a scan item to inspect detailed fish-level outputs.

**Expected result:**
User can review prior scans with timestamp, grade, and analysis details.

### 6.3 Workflow: Browse and Buy Products
1. Open **Catalog** page.
2. Filter or search products.
3. Open **Product Detail** page.
4. Add selected item to cart.
5. Open **Cart** and confirm quantities.
6. Proceed to **Checkout Address**.
7. Continue to **Checkout Payment**.
8. Place order and wait for confirmation page.

**Expected result:**
Order is created and visible in **Orders** page.

### 6.4 Workflow: Track Orders
1. Open **Orders** page.
2. Select a specific order.
3. Review order status and items.
4. Download receipt where available.

**Expected result:**
User sees current order progress and transaction details.

### 6.5 Workflow: Community Participation
1. Open **Forum** page.
2. Create a post with title/content/category.
3. Publish post.
4. Add comments or likes on other posts.
5. Edit or remove own post if needed.

**Expected result:**
Content appears in community feed subject to moderation policies.

### 6.6 Workflow: Contact Support
1. Open **Contact** page.
2. Fill in name, email, subject, and message.
3. Submit contact form.

**Expected result:**
System confirms message submission for support follow-up.

> [!TIP]
> For scan consistency, use clear fish photos with good lighting and minimal background clutter.

---

## 7. Seller Workflows

### 7.1 Workflow: Access Seller Dashboard
1. Log in using a seller account.
2. Open **Seller Dashboard**.
3. Review KPIs, recent orders, and product performance.

**Expected result:**
Seller sees store metrics and operational summaries.

### 7.2 Workflow: Add New Product
1. Open **Seller Products** page.
2. Select add product action.
3. Enter name, description, category, price, and stock.
4. Upload product images.
5. Save listing.

**Expected result:**
New product appears in seller inventory and catalog visibility rules apply.

### 7.3 Workflow: Update Product
1. Open existing product entry.
2. Modify details such as price, stock, description, or images.
3. Save changes.

**Expected result:**
Listing updates are reflected in catalog and orderable stock.

### 7.4 Workflow: Disable or Delete Product
1. Open **Seller Products**.
2. Choose disable or delete action for an item.
3. Confirm operation.

**Expected result:**
Disabled items are hidden from active purchase flow; deleted items are removed.

### 7.5 Workflow: Process Seller Orders
1. Open **Seller Orders**.
2. Select order.
3. Update status according to fulfillment stage.
4. Mark delivered when completed.

**Expected result:**
Order status updates are visible to customer and admin views.

### 7.6 Workflow: Use Seller Analytics
1. Open seller analytics sections.
2. Review sales overview, category performance, top products, and recent reviews.
3. Use insights to adjust pricing and inventory.

**Expected result:**
Seller can make data-informed listing and sales decisions.

---

## 8. Admin Workflows

### 8.1 Workflow: Access Admin Dashboard
1. Log in using admin account.
2. Open **Admin Dashboard**.
3. Review global KPIs and system activity indicators.

**Expected result:**
Admin gets high-level platform health and usage insight.

### 8.2 Workflow: Manage Users
1. Open **Admin Users** page.
2. Search or filter accounts.
3. Open user details.
4. Toggle account status when policy action is needed.

**Expected result:**
User account states are updated and reflected in authorization behavior.

### 8.3 Workflow: Moderate Community Content
1. Open **Admin Posts** page.
2. Review posts and comments.
3. Disable or re-enable content as needed.
4. Record moderation reason where applicable.

**Expected result:**
Inappropriate content is controlled while preserving moderation traceability.

### 8.4 Workflow: Manage Scan Records
1. Open **Admin Scans** page.
2. Review scan data and analytics summaries.
3. Disable or delete problematic scan entries if required.

**Expected result:**
Scan data quality and compliance are maintained.

### 8.5 Workflow: Manage Orders and Payouts
1. Open **Admin Orders** page.
2. Inspect order details and update statuses when authorized.
3. Open **Admin Payouts** section.
4. Approve or update payout status.

**Expected result:**
Transaction lifecycle and settlement flow remain controlled.

### 8.6 Workflow: Review Audit and Analytics
1. Open **Admin Audit Logs**.
2. Filter by actor, category, status, or date.
3. Open analytics pages for users, market, scans, and activity.

**Expected result:**
Admin actions and platform behavior are observable for governance and reporting.

> [!WARNING]
> Admin actions can affect live user access, product visibility, and transaction state. Review details before applying changes.

---

## 9. Feature Reference

### 9.1 Fish Scanning and Grading
**Purpose:**
Assess dried fish quality from uploaded image.

**Roles allowed:**
- User
- Seller
- Admin

**Inputs:**
- Image file (supported image format)

**Outputs:**
- Fish type detection
- Confidence score
- Color analysis
- Mold analysis
- Final grade (Export, Local, Reject)

### 9.2 History and Chart Analytics
**Purpose:**
Store and review previous scan outputs.

**Roles allowed:**
- User (own scope)
- Admin (full scope)

**Outputs:**
- Timeline list of scans
- Grade distribution summary
- Detailed per-scan report

### 9.3 Marketplace Module
**Purpose:**
Enable product browsing and purchase flow.

**Roles allowed:**
- Guest (browse only)
- User (full purchase flow)
- Seller/Admin (management)

**Outputs:**
- Product catalog and detail views
- Cart and checkout states
- Order confirmation and receipt

### 9.4 Community Forum Module
**Purpose:**
Allow users to post and discuss dried fish topics.

**Roles allowed:**
- Logged-in users (create/interact)
- Admin (moderate)

**Outputs:**
- Posts, comments, likes
- Moderation status for flagged content

### 9.5 Seller Dashboard and Tools
**Purpose:**
Provide seller operations and performance tracking.

**Roles allowed:**
- Seller

**Outputs:**
- Product management
- Order processing view
- Sales and review analytics

### 9.6 Admin Governance Tools
**Purpose:**
Control platform safety, quality, and operational monitoring.

**Roles allowed:**
- Admin

**Outputs:**
- User/account controls
- Scan/post moderation
- Audit logs and platform analytics

---

## 10. Error Messages and Troubleshooting

### 10.1 Authentication Errors
**Common message:**
- Unauthorized or invalid credentials

**Possible causes:**
- Wrong email/password
- Expired session token
- Role-restricted page access

**Resolution:**
1. Log out and log in again.
2. Verify account credentials.
3. Use the correct role account for restricted pages.

### 10.2 Scan Upload or Analysis Errors
**Common message:**
- Upload failed or scan processing failed

**Possible causes:**
- Unsupported file or oversized image
- Temporary server/network issue

**Resolution:**
1. Retry with clear JPG/PNG image.
2. Check internet connection.
3. Refresh page and resubmit.

### 10.3 Checkout or Payment Errors
**Common message:**
- Payment intent failed or order not completed

**Possible causes:**
- Payment provider interruption
- Incomplete checkout fields

**Resolution:**
1. Recheck shipping and payment details.
2. Retry payment method.
3. Confirm order status in Orders page.

### 10.4 Access Denied (Role Restriction)
**Common message:**
- Access denied

**Possible causes:**
- User is not authorized for seller/admin page

**Resolution:**
1. Confirm account role.
2. Return to allowed pages.
3. Contact admin if role update is needed.

---

## 11. Frequently Asked Questions (FAQ)

**Q1: Why did my scan result change between images of the same fish?**
A: Lighting, angle, and image clarity can affect detection confidence and grading outcomes.

**Q2: Why can I not open admin or seller pages?**
A: These pages are restricted by role. Only authorized accounts can access them.

**Q3: Why is my order still pending?**
A: Payment and status updates can take time depending on fulfillment and payment processing.

**Q4: Can I edit or remove my forum posts?**
A: Yes, users can manage their own posts, subject to moderation rules.

**Q5: Where can I view my previous scans?**
A: Open the History page to review saved scan entries and details.

---

## 12. Support and Contact

If you encounter issues that cannot be resolved through this manual, use the Contact page in the web app.

When reporting a problem, include:
1. Your account role (User/Seller/Admin)
2. Page name where issue occurred
3. Date and time of issue
4. Screenshot of the error (if available)
5. Short description of what you were doing before the issue

---

## 13. Glossary

**Grade:**
Final quality output category (Export, Local, Reject).

**Mold Severity:**
Estimated contamination intensity level from analysis module.

**Color Consistency:**
Surface uniformity score derived from color analysis.

**Scan History:**
Stored list of previous image analysis records.

**Voucher:**
Discount code applied during checkout when valid.

**Audit Log:**
Admin activity record for traceability and governance.

---

## 14. Appendix

### 14.1 Quick Start Checklist
1. Register and verify account.
2. Log in and update profile.
3. Run one scan on Grade page.
4. Confirm result in History page.
5. Try one catalog-to-checkout flow.

### 14.2 Known Limitations
- Manual covers web only.
- Final results depend on image quality and capture conditions.
- Some pages/features are role-restricted.

### 14.3 Document End
End of DaingGrader Web User Manual (MD version).
