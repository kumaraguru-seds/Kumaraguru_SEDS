# Kumaraguru SEDS Webpage
# Created By Manikandan N 

## Project Description

This repository hosts the webpage for Kumaraguru SEDS (Students for the Exploration and Development of Space), a student-led organization at Kumaraguru Institutions. The webpage provides information about the organization's vision, mission, teams, events, and contact details. It also includes forms for applications, feedback, and birthday submissions.  This webpage was developed by Manikandan N.

## Features and Functionality

*   **Informational Pages:**
    *   Home page with organization overview.
    *   Vision and Mission statements.
    *   Staff coordinator details.
    *   Team information (Events, PR, Admin, IM & PM, Media and Finance) with team member listings.
    *   Events page with details and galleries.
    *   Kosmorena event pages (2025, 2024 and 2021).
    *   Links to Event registrations.

*   **Forms:**
    *   Application form (`Application_Form.html`) to join the organization.  Includes personal information, educational background, team preferences, and payment QR code upload.
    *   Admin login page (`Admin_Page.html`) to access privileged features.
    *   Feedback form (`feedback.html`) for users to provide feedback.
    *   Birthday Form (`birthday_form.html`) for collecting birthdays of current and alumni members.

*   **Admin Functionality (Protected):**
    *   Search Query page (`Search_query.html`) for accessing event registrations, contact details, birthday submissions and feedback data by using Google Apps Script.
    *   `current_birthday.html` displays current member's birthday details fetched from Google Sheets.
    *   `alumni_birthday.html` displays alumni birthday details fetched from Google Sheets.

*   **Dynamic Content:**
    *   Event galleries with image and video display.
    *   Team member listings with photos and roles.

*   **Interactive Elements:**
    *   Sidebar navigation for easy access to different sections.
    *   Animations and transitions for enhanced user experience.
    *   Contact forms to send messages to the organization.

*   **Ideathon Page:**
    *   Registration form (`Ideathon.html`) for the Ideathon event including Registration amount , Rules and Regulations to be followed.

*  **Kosmorena’25 Registration Links:**
    *  Link to Register for various events in `kosmorena25_registration_links.html`.

## Technology Stack

*   HTML5
*   CSS3
*   JavaScript
*   Google Fonts (Poppins)
*   Google Apps Script (for form submissions, data retrieval, and image uploads)

## Prerequisites

To run or modify this webpage, you will need:

*   A web browser (e.g., Chrome, Firefox, Safari).
*   A text editor or IDE (e.g., VS Code, Sublime Text) for editing the HTML, CSS, and JavaScript files.
*   A Google account (if you plan to use or modify the Google Apps Script functionality).
*   Basic understanding of HTML, CSS, and JavaScript.

## Installation Instructions

Since this is a static webpage, no installation is required. Simply clone or download the repository files to your local machine.

```bash
git clone https://github.com/kumaraguru-seds/Kumaraguru_SEDS.git
```

## Usage Guide

1.  **Open HTML Files:** Open any of the HTML files (e.g., `index.html`, `Events.html`, `Application_Form.html`) in your web browser to view the corresponding page.

2.  **Navigate the Website:** Use the sidebar navigation to access different sections of the website.

3.  **Fill out Forms:** If you want to submit an application or provide feedback, fill out the required fields in the respective forms and click the "Submit" button.

4.  **Admin Access:** To access the admin page (`Admin_Page.html`), enter the correct username (`manilunar07@gmail.com`) and password (`mani@123`).  Navigate to `Search_query.html`.

## API Documentation (Google Apps Script)

Several forms on this webpage rely on Google Apps Script for handling data submissions and image uploads.  The following outlines the GAS endpoints used:

*   **Application Form (`Application_Form.html`):**

    *   `APPLICATION_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwU6sMfuWMHKGMVuewFqUBsaPpV-Vt5HgadS45aXkKfRLM2HRi6n6zB1VdBQkXQbV9SFw/exec"`:  This endpoint receives applicant data (name, email, etc.) and stores it in a Google Sheet.  It expects data in JSON format.
    *   `QR_UPLOAD_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxT0mlN_mHVZ7V08F6j7_lu58t8aOQRJWeBZ4aMg-5k5w0kuq6oqIpNkGurdzSOV5BQ/exec"`:  This endpoint handles the QR code image upload. It receives base64 encoded image data, uploads it to Google Drive, and returns the public URL. It expects data in JSON format.

*   **Ideathon Registration Form (`Ideathon.html`):**

    *   `APPLICATION_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyHQ6X-aTogNBdMEa7Ia_omfsC2-EvZalRKhhAhAM5mbcPUO10EYF6KMWqjQwcp6fL6/exec"`: Accepts Ideathon registration data.
    *   `QR_UPLOAD_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwCTpc7zqmQ0FDRCM-6mfbGicVLlMSkPOdJvHuvr08yzSAzi0LlLMXfWToStBol0OjD/exec"`: Accepts uploaded QR code image data.
    *   `CONTACT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxnJbcuyoVymlnFwOmTddbKLERKSkTFF5LHmPVjEvpj0HLiOx6npHtroiJlljVcFHaf/exec"` - Accepts contact us form data.

*   **Birthday Form (`birthday_form.html`):**

    *   `MEMBERSHIP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyYptzXmRQ2FJ21poY1sehd9jvgTEgN2FgaQl1GzhDSOi_t_earcfuGJFGrgclXCVTE/exec"`: Accepts birthday data and the URL of uploaded photo.
    *   `PHOTO_UPLOAD_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwh4M-GxFZk7DiqcLT7FVvSqso5gEe7oWGeOHAVNrjuCAQf4F086O-gTJrXacBaEvBe_w/exec"` - Accepts profile pictures and uploads it to Google Drive.

*  **Events, Kosmorena and Contact Us Form:**

    * The `Contact_form` URL for each form mentioned are for demo purpose and do not work.  They need to be updated with the URL associated to the corresponding project.

*   **Search Query (`Search_query.html`):**

    *   `scriptURL = "https://script.google.com/macros/s/AKfycbzlPq3Uc3quEVJdT7Bvx3syyReYU8hCGJGLJbLgo7z6a6zbadCAZw1dTSUdB3g9QXnAjQ/exec"`: Used to fetch information from Google Sheets.
    *   Sheet IDs passed as query parameters, to retrieve data from different sheets.

**Important:** These URLs are specific to the original developer's Google Apps Script deployment.  If you intend to use these functionalities, you **must** create your own Google Apps Script projects, deploy them as web apps, and update these URLs in the HTML files accordingly.  Ensure your script has the necessary permissions to access Google Sheets and Google Drive.

## Contributing Guidelines

Contributions to this project are welcome! To contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with descriptive commit messages.
4.  Submit a pull request to the `main` branch.

Please ensure that your code follows the existing style and conventions, and that you include appropriate documentation.

## License Information

This project has no specified license. All rights are reserved.

## Contact/Support Information

For questions or support, please contact:

*   Manikandan N: manilunar07@gmail.com
*   Kumaraguru SEDS: seds@kct.ac.in
