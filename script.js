document.addEventListener("DOMContentLoaded", () => {
    // === Scroll Lock and Video 1 Logic ===
    const body = document.body;
    const v1 = document.getElementById("main1-video");
    const v2 = document.getElementById("main2-video");
    const tapToPlay = document.getElementById("tap-to-play");
    const blinkOverlay = document.getElementById("blink-overlay");
    const section2 = document.getElementById("section-2");
    
    // Lock scroll initially
    body.classList.add("no-scroll");

    // Scroll top on load just in case
    window.scrollTo(0, 0);

    tapToPlay.addEventListener("click", () => {
        tapToPlay.style.opacity = "0";
        v1.play().catch(e => console.error("Video play failed", e));
        
        // This silently triggers video 2 with the user interaction, unlocking mobile autoplay blocks
        if (v2) v2.play().catch(e => console.log('v2 force play blocked securely', e));
        
        setTimeout(() => {
            tapToPlay.style.display = "none";
        }, 500);
    });

    v1.addEventListener("ended", () => {
        const section1 = document.getElementById("section-1");
        if (!section1) return;
        
        // Lock Section 1 in place as a fixed overlay atop the screen
        section1.style.position = 'fixed';
        section1.style.top = '0';
        section1.style.left = '0';
        section1.style.zIndex = '50';
        section1.style.width = '100%';
        section1.style.height = '100vh';
        
        // Immediately scroll to Section 2 underneath
        document.getElementById("section-2").scrollIntoView({ behavior: 'auto' });
        
        // Apply crossfade dissolve
        section1.style.transition = "opacity 1.5s ease-in-out";
        
        // Allow DOM to register the fixed position before fading
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                section1.style.opacity = '0';
            });
        });
        
        // Remove from DOM safely after transition
        setTimeout(() => {
            if(section1) section1.remove();
            body.classList.remove("no-scroll");
        }, 1600);
    });

    // === Intersection Observer for Section Animations ===
    const scrollPopup = document.getElementById("scroll-popup");
    const finalItems = document.querySelectorAll(".hidden-anim");
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.id === 'section-2') {
                    setTimeout(() => {
                        if(scrollPopup) scrollPopup.classList.remove("hidden");
                    }, 3000);
                }
                if (entry.target.id === 'section-6') {
                    finalItems.forEach(item => item.classList.add("revealed"));
                }
            }
        });
    }, { threshold: 0.3 });
    
    const sec2 = document.getElementById("section-2");
    if (sec2) observer.observe(sec2);
    
    const sec6 = document.getElementById("section-6");
    if (sec6) observer.observe(sec6);

    // === Scratch Card Logic ===
    const canvas = document.getElementById('scratch-pad');
    const ctx = canvas.getContext('2d');
    const section4 = document.getElementById('section-4');
    
    // Setup canvas size to match container
    function setupCanvas() {
        // We use offsetWidth and offsetHeight of the parent relative container
        const rect = canvas.parentElement.getBoundingClientRect();
        // Fallback dimensions if rect is 0 (display none or not rendered)
        canvas.width = rect.width || 300;
        canvas.height = rect.height || 100;
        
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = 40; // Scratch size
        
        drawGoldCircles();
    }

    function drawGoldCircles() {
        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        
        // draw 3 circles
        const r = Math.min(canvas.height / 2, (canvas.width / 3) / 2) * 0.85;
        const centers = [
            canvas.width * (1/6), 
            canvas.width * (3/6), 
            canvas.width * (5/6)
        ];

        centers.forEach(cx => {
            ctx.save();
            ctx.translate(cx, canvas.height / 2);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            
            let grad;
            if (ctx.createConicGradient) {
                grad = ctx.createConicGradient(0, 0, 0);
                grad.addColorStop(0, '#eacda3');
                grad.addColorStop(0.12, '#fdf0b0');
                grad.addColorStop(0.25, '#cda766');
                grad.addColorStop(0.37, '#8f682d');
                grad.addColorStop(0.5, '#eacda3');
                grad.addColorStop(0.62, '#fdf0b0');
                grad.addColorStop(0.75, '#cda766');
                grad.addColorStop(0.87, '#8f682d');
                grad.addColorStop(1, '#eacda3');
            } else {
                grad = ctx.createRadialGradient(0, 0, r/4, 0, 0, r);
                grad.addColorStop(0, '#fbf0c8');
                grad.addColorStop(0.5, '#d4af37');
                grad.addColorStop(1, '#b5952f');
            }
            
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        });
    }
    
    // Call setup once section dimensions are known
    // Since images might change layout, we observe its appearance
    // or just call on window load
    window.addEventListener('load', setupCanvas);
    window.addEventListener('resize', setupCanvas);
    
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;
        
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function scratchStart(e) {
        isDrawing = true;
        const pos = getMousePos(e);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault(); // Prevent scrolling while scratching
    }

    function scratchMove(e) {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        checkScratchCompletion();
        e.preventDefault();
    }

    function scratchEnd() {
        isDrawing = false;
    }

    canvas.addEventListener('mousedown', scratchStart);
    canvas.addEventListener('mousemove', scratchMove);
    canvas.addEventListener('mouseup', scratchEnd);
    
    canvas.addEventListener('touchstart', scratchStart, {passive: false});
    canvas.addEventListener('touchmove', scratchMove, {passive: false});
    canvas.addEventListener('touchend', scratchEnd);

    let regions = [
        { id: 0, cleared: false },
        { id: 1, cleared: false },
        { id: 2, cleared: false }
    ];
    let allCleared = false;

    function checkScratchCompletion() {
        if(allCleared) return;
        
        let third = canvas.width / 3;
        let anyNotCleared = false;
        
        // Find radius used for drawing circles
        const r = Math.min(canvas.height / 2, (canvas.width / 3) / 2) * 0.85;
        
        regions.forEach(region => {
            if (region.cleared) return;
            
            // Sample a square completely inside the circle
            let cx = region.id * third + third / 2;
            let cy = canvas.height / 2;
            
            // Inner square radius is r / sqrt(2), using 0.65 for safety margin
            let innerR = r * 0.65; 
            let xStart = Math.max(0, Math.floor(cx - innerR));
            let yStart = Math.max(0, Math.floor(cy - innerR));
            let w = Math.floor(innerR * 2);
            let h = Math.floor(innerR * 2);
            
            try {
                const imageData = ctx.getImageData(xStart, yStart, w, h).data;
                let scratchedArea = 0;
                let totalArea = w * h;
                
                let step = 16 * 4; // Check every 16th pixel roughly
                for(let i = 0; i < imageData.length; i += step) {
                    if(imageData[i + 3] === 0) {
                        scratchedArea++;
                    }
                }
                
                let percent = (scratchedArea * 16) / totalArea;
                
                if (percent > 0.40) { // 40% threshold per circle
                    region.cleared = true;
                    // Snap clear just this entire region section cleanly
                    ctx.clearRect(region.id * third, 0, third, canvas.height);
                } else {
                    anyNotCleared = true;
                }
            } catch(e) {
                // Ignore errs
                anyNotCleared = true;
            }
        });
        
        if (!anyNotCleared && !allCleared) {
            allCleared = true;
            canvas.style.transition = "opacity 0.5s ease";
            canvas.style.opacity = "0";
            setTimeout(() => {
                canvas.style.display = 'none';
                fireConfetti();
                startCountdown();
            }, 500);
        }
    }

    let countdownInterval;
    function startCountdown() {
        // Target date for countdown
        const targetDate = new Date("2026-12-25T18:00:00").getTime();
        
        const container = document.getElementById('countdown-container');
        if (container) container.classList.add('visible');
        
        const rsvpContainer = document.getElementById('rsvp-section');
        if (rsvpContainer) rsvpContainer.classList.add('visible');

        countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(countdownInterval);
                return;
            }

            const totalDays = Math.floor(distance / (1000 * 60 * 60 * 24));
            const months = Math.floor(totalDays / 30);
            const days = totalDays % 30; // visually approx 30 days per mo
            
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            const mEl = document.getElementById("cd-months");
            const dEl = document.getElementById("cd-days");
            const hEl = document.getElementById("cd-hours");
            const minEl = document.getElementById("cd-mins");

            if (mEl) mEl.innerText = months.toString().padStart(2, '0');
            if (dEl) dEl.innerText = days.toString().padStart(2, '0');
            if (hEl) hEl.innerText = hours.toString().padStart(2, '0');
            if (minEl) minEl.innerText = mins.toString().padStart(2, '0');
        }, 1000);
    }

    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');
    const rsvpMsg = document.getElementById('rsvp-response');

    if (btnYes && btnNo) {
        btnYes.addEventListener('click', () => {
            rsvpMsg.innerHTML = "We can't wait to see you! 😊🎉";
            rsvpMsg.className = "rsvp-msg success flash-anim";
            
            // Re-trigger animation
            rsvpMsg.style.animation = 'none';
            setTimeout(() => rsvpMsg.style.animation = '', 10);
        });
        btnNo.addEventListener('click', () => {
            rsvpMsg.innerHTML = "You will be missed! 😔🤍";
            rsvpMsg.className = "rsvp-msg sad flash-anim";
            
            // Re-trigger animation
            rsvpMsg.style.animation = 'none';
            setTimeout(() => rsvpMsg.style.animation = '', 10);
        });
    }

    function fireConfetti() {
        if (typeof confetti === "function") {
            var duration = 3000;
            var end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    zIndex: 1000
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    zIndex: 1000
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    }
});
