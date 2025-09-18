// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const scoreEl = document.getElementById('score');
    const loader = document.getElementById('loader');
    const emailContent = document.querySelector('.email-content');
    const senderEl = document.getElementById('email-sender');
    const subjectEl = document.getElementById('email-subject');
    const bodyEl = document.getElementById('email-body');
    const actionButtons = document.getElementById('action-buttons');
    const safeBtn = document.getElementById('safe-btn');
    const phishBtn = document.getElementById('phish-btn');
    const feedbackView = document.getElementById('feedback-view');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackText = document.getElementById('feedback-text');
    const nextBtn = document.getElementById('next-btn');
    const attackCategoryEl = document.getElementById('attack-category');

    // --- State ---
    let currentEmail = null;
    let score = 0;

    // --- Functions ---
    const fetchNewEmail = async () => {
        showLoader(true);
        feedbackView.style.display = 'none';
        actionButtons.style.display = 'none';

        try {
            const response = await fetch('/api/generate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score: score }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            
            currentEmail = await response.json();
            displayEmail(currentEmail);
            actionButtons.style.display = 'flex';

        } catch (error) {
            console.error('Error fetching email:', error);
            bodyEl.textContent = 'Failed to load email. Please try again.';
        } finally {
            showLoader(false);
        }
    };

    const displayEmail = (email) => {
        senderEl.textContent = email.sender;
        subjectEl.textContent = email.subject;
        bodyEl.textContent = email.body;
    };

    const showLoader = (isLoading) => {
        loader.style.display = isLoading ? 'block' : 'none';
        emailContent.classList.toggle('hidden', isLoading);
    };

    const handleChoice = async (choice) => {
        if (!currentEmail) return;
        actionButtons.style.display = 'none';
        
        try {
            const response = await fetch('/api/analyze-choice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail, choice: choice }),
            });
            if (!response.ok) throw new Error('Analysis request failed');

            const analysis = await response.json();
            updateScore(analysis.is_correct);
            displayFeedback(analysis);

        } catch (error) {
            console.error('Error analyzing choice:', error);
            displayFeedback({ is_correct: false, explanation: 'Could not analyze the choice.' });
        }
    };
    
    const updateScore = (isCorrect) => {
        if (isCorrect) {
            score += 10;
        } else {
            score = Math.max(0, score - 5);
        }
        scoreEl.textContent = score;
    };

    const displayFeedback = (analysis) => {
        feedbackView.style.display = 'block';
        feedbackView.className = 'feedback-view';
        
        if (analysis.is_correct) {
            feedbackTitle.textContent = 'Correct!';
            feedbackView.classList.add('correct');
        } else {
            feedbackTitle.textContent = 'Incorrect!';
            feedbackView.classList.add('incorrect');
        }

        attackCategoryEl.textContent = `Category: ${currentEmail.category}`;
        attackCategoryEl.style.display = 'inline-block';
        
        feedbackText.textContent = analysis.explanation;
    };

    // --- Event Listeners ---
    safeBtn.addEventListener('click', () => handleChoice('safe'));
    phishBtn.addEventListener('click', () => handleChoice('phishing'));
    nextBtn.addEventListener('click', fetchNewEmail);

    // --- Initial Load ---
    fetchNewEmail();
});