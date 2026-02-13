# WeCare Application Blueprint

## 1. Overview

The WeCare application is a B2B2NGO marketplace designed to facilitate the redistribution of surplus corporate assets. It provides a streamlined platform for corporate donors to list surplus goods and for NGOs (Non-Governmental Organizations) to discover and claim them. The primary goal is to transform corporate surplus into meaningful social impact, helping companies meet their ESG (Environmental, Social, and Governance) goals while supporting communities.

The application is built as a responsive single-page application (SPA) using vanilla HTML, CSS, and JavaScript, with the Google Maps API for geolocation features.

## 2. Project Outline & Features

This section details the design, style, and functional components implemented in the application.

### 2.1. Branding & Styling

- **Logo:** WeCare
- **Tagline:** Turn Surplus Into Social Impact
- **Color Palette:**
    - `Primary Action`: Light Green (`#2A8C4A`) - Used for buttons, active links, and key highlights.
    - `Secondary Action`: Orange Accent (`#E87722`) - Used for the surplus estimation button.
    - `Headings & Logo`: Dark Green (`#1E4D2B`).
    - `Background`: A very light, premium-feeling off-white (`#F9FBFB`) with a subtle noise texture overlay.
- **Typography:**
    - `Headings`: 'Poppins', for a modern and clean look.
    - `Body Text`: 'Inter', for excellent readability.
- **Visual Design:**
    - **Cards:** Feature a multi-layered drop shadow to create a "lifted," three-dimensional appearance.
    - **Icons:** Utilizes Material Design Icons to provide clear, intuitive visual cues for actions and information.
    - **Responsiveness:** The layout adapts to smaller screen sizes, with a focus on mobile-first principles.

### 2.2. Application Structure

The application is a single HTML file (`index.html`) divided into three primary sections, managed by JavaScript (`app.js`).

- **Header:** A sticky header contains the WeCare logo, tagline, and the main navigation.
- **Navigation:** Allows users to toggle between the three main sections:
    - For Donors
    - For NGOs
    - Reporting
- **Page Sections:** JavaScript controls the visibility of each section, showing only the active one.

### 2.3. Core Features

- **Donor Portal (`#donor-section`):
    - **Surplus Estimation Tool:** An interactive tool for donors to estimate potential surplus based on planned versus actual event attendance.
    - **Surplus Listing Form:** A comprehensive form allowing donors to list surplus goods. Key fields include:
        - Goods Description
        - Quantity
        - Expiry Date
        - Pickup Address (this is geocoded into latitude/longitude coordinates upon submission).
        - Donor Name

- **NGO Marketplace (`#ngo-section`):
    - **Geo-Location Map:** An interactive Google Map that displays all "Available" surplus items as clickable markers. This allows NGOs to easily find nearby donations.
        - The map is correctly initialized and resized when the section becomes visible to ensure it renders properly.
    - **Donation Listings:** A grid of all surplus items, showing essential details. Each item is clickable, opening a detailed modal view.

- **Impact Reporting (`#reporting-section`):
    - **CSV Report Generation:** A feature that allows users to download a CSV report of all donations. The report includes calculated metrics for waste diverted (in kg) and carbon savings (in kgCO2e).

- **Donation Details Modal:
    - When an NGO clicks on a marketplace item, a modal appears displaying complete details for the donation.
    - If the item is "Available," the modal includes an "Accept Donation" button, allowing the NGO to claim the item. Claiming an item updates its status to "Claimed."

- **Data Persistence:
    - All surplus item data, including status changes, is persisted in the browser's `localStorage`. This ensures that all information is retained between user sessions.

## 3. Plan for Last Change: Navigation Bug Fix

This section outlines the plan and steps taken for the most recent bug fix.

- **User Request:** The user reported that clicking on the "For NGOs" and "Reporting" navigation links did not switch to the correct pages.

- **Analysis:** The root cause was identified as a JavaScript error in the click event handler for the navigation links. The code was using `event.target.getAttribute('href')`. When a user clicked the *text* inside the link, `event.target` would be the text node, which does not have an `getAttribute` method, causing the script to crash.

- **Action Taken:**
    1.  The `app.js` file was modified.
    2.  The line `const sectionId = e.target.getAttribute('href').substring(1);` was changed to `const sectionId = e.currentTarget.getAttribute('href').substring(1);`.
    3.  The use of `event.currentTarget` ensures that the `href` attribute is always read from the link element (`<a>`) to which the event listener was attached, resolving the bug.
    4.  The fix was committed with the message: `fix: Correct navigation bug in header`.
