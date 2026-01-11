admin user:
    admin@kiranregmi.com
    Admin@123
Other user:
    user@kiranregmi.com
    User@123


End	Pages	details
FrontEnd	index.html	Home
    projects.html	list of projects
    skills.html	list of projects
    certifications.html	list of certificates
    contact.html	form for contacts
    login.html	login page, entry point for dashboard.html
    dashboard.html	tracks questions and answers, projects
    dashboard.js	work as bridge between dashboard.html and questions.js, users.json, 
        
Backend	server.js	
    questions.json	
    users.json	
    projects.json	
    package.json	
    config.js	
    generate-hash.js	
     
Version 1	Auth + Session	
    Question Rendering	
    Show / Hide Answers	
    Search (Questions + answers)	
    Category Filter	
    Shuffle	
    Pagination - 12/page		

Version 1.1 
    Auth + session 
    questions card
    serach (questions/answers)
    category filter
    shuffle
    pagination -12/page
    ++++++
    Study mode
    mark reviewed / unreviewed
    progress summary in header
    Local storage persistence
    

# Cyber Portal (Work in Progress)

This project is a role-based cybersecurity learning portal built with vanilla HTML, CSS, and JavaScript.

## Current Features
- Secure login with JWT-based authentication
- Client-side access control using localStorage
- Protected routes for authenticated users
- Learning module structure (Foundations)
- Welcome / onboarding page
- Modular CSS architecture

## Current Flow
1. User logs in via `login.html`
2. Successful login redirects to `dashboard.html`
3. From the dashboard, users can access:
   - Welcome page
   - Foundations learning module

## Planned Enhancements
- Redirect login → welcome page
- Role-based navigation (Admin vs User)
- Progress tracking & scoring (70% gating)
- Secure document and video access
- Admin assignment of learning paths

## Tech Stack
- HTML5
- CSS3 (scoped architecture)
- Vanilla JavaScript
- JWT authentication (backend)

> This project is under active development and is being used as a learning and portfolio project.

