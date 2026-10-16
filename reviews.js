const SUPABASE_URL = 'https://xpcthwlbgdpttihzsnux.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwY3Rod2xiZ2RwdHRpaHpzbnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDc4MzAsImV4cCI6MjEwNzcyMzgzMH0.2pM4wQq1hy3hBb3v19gZFKv85g94aDrtNBX3UU15Ois';
const API = `${SUPABASE_URL}/rest/v1/reviews`;
const HEADERS = {
    apikey: SUPABASE_KEY,
    // Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

const listEl = document.getElementById('reviews-list');
const summaryEl = document.getElementById('reviews-summary');
const form = document.getElementById('review-form');
const msgEl = document.getElementById('form-msg');
const submitBtn = document.getElementById('r-submit');

const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

async function loadReviews() {
    try {
    const res = await fetch(
        `${API}?select=name,service,rating,comment,created_at&approved=eq.true&order=created_at.desc&limit=50`,
        { headers: HEADERS }
    );
    if (!res.ok) {
        console.error(res.status, await res.text());
        throw new Error();
    }
    render(await res.json());
        } catch {
    listEl.innerHTML = '<p class="reviews-empty">Reviews couldn’t be loaded right now.</p>';
        }
}

function render(reviews) {
    listEl.textContent = '';
    if (!reviews.length) {
    listEl.innerHTML = '<p class="reviews-empty">No reviews yet. Be the first!</p>';
    summaryEl.textContent = '';
    return;
    }
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    summaryEl.textContent = `★ ${avg.toFixed(1)} average from ${reviews.length} review${reviews.length > 1 ? 's' : ''}`;

    reviews.forEach(r => {
    const card = document.createElement('article');
    card.className = 'review-card';

    const top = document.createElement('div');
    top.className = 'review-top';
    const rating = document.createElement('span');
    rating.className = 'review-stars';
    rating.textContent = stars(r.rating);
    rating.setAttribute('aria-label', `${r.rating} out of 5 stars`);
    const service = document.createElement('span');
    service.className = 'review-service';
    service.textContent = r.service;
    top.append(rating, service);

    const text = document.createElement('p');
    text.className = 'review-text';
    text.textContent = r.comment;          // textContent prevents HTML injection

    const meta = document.createElement('p');
    meta.className = 'review-meta';
    meta.textContent = `${r.name} · ${new Date(r.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}`;

    card.append(top, text, meta);
    listEl.appendChild(card);
    });
}

form.addEventListener('submit', async e => {
    e.preventDefault();
  if (document.getElementById('r-website').value) return; // bot

  // Simple client-side throttle: one review per browser per 60s
    const last = Number(localStorage.getItem('lastReview') || 0);
    if (Date.now() - last < 60000) {
    msgEl.textContent = 'Please wait a minute before submitting another review.';
    return;
    }

    const payload = {
    name: document.getElementById('r-name').value.trim(),
    service: document.getElementById('r-service').value,
    rating: Number(form.querySelector('input[name="rating"]:checked')?.value),
    comment: document.getElementById('r-comment').value.trim()
    };

    submitBtn.disabled = true;
    msgEl.textContent = 'Submitting…';
    try {
    const res = await fetch(API, {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error();
    localStorage.setItem('lastReview', Date.now());
    form.reset();
    msgEl.textContent = 'Thank you! Your review will appear once approved.';
    } catch {
    msgEl.textContent = 'Something went wrong. Please try again.';
    } finally {
    submitBtn.disabled = false;
    }
});

loadReviews();