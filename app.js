// DOM Elements
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.querySelector('.play-pause');
const prevBtn = document.querySelector('.previous');
const nextBtn = document.querySelector('.next');
const shuffleBtn = document.querySelector('.shuffle');
const repeatBtn = document.querySelector('.repeat');
const tracks = document.querySelectorAll('.track');
const progressBar = document.querySelector('.progress');
const progressContainer = document.querySelector('.progress-bar');
const currentTimeSpan = document.querySelector('.current-time');
const durationSpan = document.querySelector('.duration');
const volumeSlider = document.querySelector('.volume-slider');
const artwork = document.getElementById('currentArtwork');
const nextArtwork = document.getElementById('nextArtwork');

// State
let isPlaying = false;
let currentTrackIndex = 0;
let isShuffling = false;
let isRepeating = false;
let isLoadingTrack = false;

// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// Animation functions
function initAnimations() {
    // Reset any existing animations
    gsap.set('.track', { clearProps: 'all' });
    
    // Animate tracks in with a stagger effect
    gsap.from('.track', {
        opacity: 0,
        x: 50,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
    });

    // Add hover animation to tracks
    tracks.forEach(track => {
        track.addEventListener('mouseenter', () => {
            gsap.to(track, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        track.addEventListener('mouseleave', () => {
            gsap.to(track, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
    
    // Burger Menu Animation
    const navSlide = () => {
        const burger = document.querySelector('.burger');
        const nav = document.querySelector('.mobile-nav');
        const navLinks = document.querySelectorAll('.mobile-nav .nav-link');
        
        burger.addEventListener('click', () => {
            // Toggle Navigation
            nav.classList.toggle('nav-active');
            
            // Burger Animation
            burger.classList.toggle('toggle');
            
            // Animate Links
            navLinks.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });
        });
    };

    navSlide();

    // Add this to your existing GSAP animations
    gsap.from(".mobile-nav .nav-link", {
        opacity: 0,
        y: -20,
        duration: 1,
        stagger: 0.1,
        ease: "power2.out"
    });
}

// Function to animate track selection
function animateTrackSelection(track) {
    // First, reset all tracks
    tracks.forEach(t => {
        gsap.to(t, {
            x: 0,
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
        });
    });

    // Then animate the selected track
    gsap.to(track, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out'
    });
}

// Debug function
function debugLog(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
        console.log('Data:', data);
    }
}

// Play/Pause functionality
function togglePlay() {
    debugLog('Toggle play called, current state:', { isPlaying, paused: audioPlayer.paused });
    
    if (audioPlayer.paused) {
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    isPlaying = true;
                    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    rotateArtwork(true);
                    debugLog('Audio playback started successfully');
                })
                .catch(error => {
                    debugLog('Error playing audio:', error);
                    alert('Error playing audio. Check console for details.');
                });
        }
    } else {
        audioPlayer.pause();
        isPlaying = false;
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        rotateArtwork(false);
        debugLog('Audio paused');
    }
}

// Rotate artwork
function rotateArtwork(shouldRotate, target = artwork) {
    const artworkContainer = target.parentElement.parentElement;
    
    if (shouldRotate) {
        // Start from 0 degrees and rotate continuously
        gsap.fromTo(target, 
            { rotation: 0 },
            {
                rotation: "+=360",
                duration: 20,
                ease: "none",
                repeat: -1,
                transformOrigin: "center center"
            }
        );
        
        // Add playing class for vinyl effect
        artworkContainer.classList.add('playing');
    } else {
        // Smoothly stop rotation at the nearest complete rotation
        gsap.to(target, {
            rotation: Math.round(gsap.getProperty(target, "rotation") / 360) * 360,
            duration: 1,
            ease: "power2.out",
            onComplete: () => gsap.set(target, { rotation: 0 })
        });
        
        // Remove playing class
        artworkContainer.classList.remove('playing');
    }
}

// Check if file exists
async function checkFileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        debugLog('Error checking file existence:', error);
        return false;
    }
}

// Load and play track
async function loadTrack(track) {
    if (isLoadingTrack) {
        debugLog('Track is currently loading, ignoring request');
        return;
    }

    isLoadingTrack = true;
    const songName = track.getAttribute('data-song');
    const audioPath = `Music/${songName}.mp3`;
    // Use .png for TASH SULTANA, .jpg for others
    const artworkPath = songName.includes('TASH SULTANA') 
        ? `songs images/${songName}.png`
        : `songs images/${songName}.jpg`;

    try {
        const exists = await checkFileExists(audioPath);
        if (!exists) {
            console.error('Audio file not found:', audioPath);
            isLoadingTrack = false;
            return;
        }

        const currentArtwork = document.getElementById('currentArtwork');
        const artworkWrapper = currentArtwork.parentElement;
        const artworkMask = document.querySelector('.artwork-mask');
        const artworkContainer = artworkWrapper.parentElement;

        // Create new image element for transition
        const newArtwork = document.createElement('img');
        newArtwork.src = artworkPath;
        newArtwork.className = 'new-artwork';
        artworkWrapper.appendChild(newArtwork);

        // Get current rotation
        const currentRotation = gsap.getProperty(currentArtwork, "rotation") || 0;

        // Stop current rotation
        gsap.killTweensOf(currentArtwork);

        // Create rewind effect
        await gsap.to(currentArtwork, {
            rotation: Math.floor(currentRotation / 360) * 360,
            duration: 1,
            ease: "power2.inOut"
        });

        // Create timeline for transition
        const tl = gsap.timeline({
            onComplete: () => {
                // Update the current artwork source and position
                currentArtwork.src = artworkPath;
                gsap.set(currentArtwork, { 
                    x: 0,
                    rotation: 0
                });
                
                // Start rotating the current artwork
                if (isPlaying) {
                    rotateArtwork(true);
                }
                
                isLoadingTrack = false;
            }
        });

        // Execute transition
        tl.set(newArtwork, { 
            rotation: 0,
            transformOrigin: "center center"
        })
        .to(artworkMask, { 
            opacity: 1,
            duration: 0.3
        })
        .to(currentArtwork, { 
            x: "-100%",
            duration: 0.6,
            ease: "power2.inOut"
        }, 0)
        .to(newArtwork, { 
            x: "0%",
            duration: 0.6,
            ease: "power2.inOut",
            onComplete: () => {
                // After new artwork is in position, update current artwork
                currentArtwork.src = artworkPath;
                gsap.set(currentArtwork, { x: 0 });
                
                // Remove the temporary artwork only after ensuring current is updated
                setTimeout(() => {
                    if (newArtwork.parentElement) {
                        newArtwork.remove();
                    }
                }, 100);
            }
        }, 0)
        .to(artworkMask, { 
            opacity: 0,
            duration: 0.3
        });

        // Update audio source and play
        audioPlayer.src = audioPath;
        
        // Remove active class from all tracks and add to current
        tracks.forEach(t => t.classList.remove('active'));
        track.classList.add('active');

        if (isPlaying) {
            try {
                await audioPlayer.play();
                artworkContainer.classList.add('playing');
            } catch (error) {
                console.error('Error playing track:', error);
                isPlaying = false;
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        }
    } catch (error) {
        console.error('Error loading track:', error);
        isLoadingTrack = false;
    }
}

// Update active track styling
function updateActiveTrack() {
    tracks.forEach((track, index) => {
        if (index === currentTrackIndex) {
            track.classList.add('active');
            gsap.to(track, {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                duration: 0.3
            });
        } else {
            track.classList.remove('active');
            gsap.to(track, {
                backgroundColor: 'transparent',
                duration: 0.3
            });
        }
    });
}

// Initialize tracks with click handlers
function initializeTracks() {
    tracks.forEach((track, index) => {
        track.addEventListener('click', () => {
            currentTrackIndex = index;
            loadTrack(track);
            isPlaying = true;
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            audioPlayer.play();
            updateActiveTrack();
        });
    });
}

// Next track
async function playNextTrack() {
    debugLog('Playing next track');
    const tracksList = Array.from(tracks);
    const currentIndex = tracksList.findIndex(track => track.classList.contains('active'));
    let nextIndex;
    
    if (isShuffling) {
        // Ensure we don't play the same song in shuffle mode
        do {
            nextIndex = Math.floor(Math.random() * tracksList.length);
        } while (nextIndex === currentIndex && tracksList.length > 1);
        debugLog('Shuffle mode, next index:', nextIndex);
    } else {
        nextIndex = (currentIndex + 1) % tracksList.length;
        debugLog('Sequential mode, next index:', nextIndex);
    }
    
    // Force playing state when changing tracks
    isPlaying = true;
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    
    await loadTrack(tracksList[nextIndex]);
}

// Previous track
function playPreviousTrack() {
    debugLog('Playing previous track');
    const tracksList = Array.from(tracks);
    const currentIndex = tracksList.findIndex(track => track.classList.contains('active'));
    const prevIndex = currentIndex <= 0 ? tracksList.length - 1 : currentIndex - 1;
    debugLog('Previous index:', prevIndex);
    loadTrack(tracksList[prevIndex]);
}

// Update progress bar
function updateProgress() {
    const { duration, currentTime } = audioPlayer;
    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        currentTimeSpan.textContent = formatTime(currentTime);
        durationSpan.textContent = formatTime(duration);
    }
}

// Format time
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Set progress when clicking progress bar
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
}

// Event Listeners
playPauseBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', playPreviousTrack);
nextBtn.addEventListener('click', playNextTrack);

// Artist Section Interaction
function initializeArtistSection() {
    const artistCards = document.querySelectorAll('.artist-card');
    
    artistCards.forEach(card => {
        const playBtn = card.querySelector('.play-artist-btn');
        
        playBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const artistName = card.dataset.artist;
            
            // Find the first song by this artist in the playlist
            const artistTrack = document.querySelector(`.track[data-song*="${artistName}"]`);
            if (artistTrack) {
                // Stop current playback
                audioPlayer.pause();
                isPlaying = false;
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                rotateArtwork(false);
                
                // Play the selected artist's track
                artistTrack.click();
                
                // Smooth scroll to the track
                artistTrack.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Highlight effect
                gsap.fromTo(artistTrack,
                    { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
                    { backgroundColor: 'transparent', duration: 1.5, ease: 'power2.out' }
                );
            }
        });
        
        // Add hover animation
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                y: -8,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
}

shuffleBtn.addEventListener('click', () => {
    isShuffling = !isShuffling;
    shuffleBtn.classList.toggle('active');
    debugLog('Shuffle mode toggled:', isShuffling);
});

repeatBtn.addEventListener('click', () => {
    isRepeating = !isRepeating;
    repeatBtn.classList.toggle('active');
    debugLog('Repeat mode toggled:', isRepeating);
});

// Track ended event
audioPlayer.addEventListener('ended', () => {
    if (isRepeating) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else {
        playNextTrack();
    }
});

// Audio error handling
audioPlayer.addEventListener('error', (e) => {
    console.error('Audio player error:', e);
    isLoadingTrack = false;
});

// Progress and volume events
audioPlayer.addEventListener('timeupdate', updateProgress);
progressContainer.addEventListener('click', setProgress);

volumeSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    audioPlayer.volume = value / 100;
    debugLog('Volume changed:', value);
    
    // Update volume icon
    const volumeIcon = document.querySelector('.volume-control i');
    if (value == 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (value < 50) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
});

// Smooth Scrolling Setup
let lenis;

function initSmoothScrolling() {
    // Initialize Lenis with slower, smoother settings
    lenis = new Lenis({
        duration: 2.2,  // Increased duration for slower scroll
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.8,  // Reduced multiplier for slower scroll
        smooth: true,
        smoothTouch: false,  // Disable on touch devices for better performance
        touchMultiplier: 1.5
    });

    // GSAP ScrollTrigger integration
    lenis.on('scroll', ScrollTrigger.update);

    // Connect GSAP ScrollTrigger with Lenis
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // Remove default GSAP ticker
    gsap.ticker.lagSmoothing(0);

    // Handle smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                lenis.scrollTo(target, {
                    offset: 0,
                    duration: 2,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            }
        });
    });
}

// Artist Cards Animation with Lenis
function initArtistCardsAnimation() {
    gsap.set('.grid-item', { opacity: 0, y: 30 });
    
    ScrollTrigger.batch('.grid-item', {
        onEnter: batch => gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 1.1,  // Slower animation
            stagger: 0.3,   // More spacing between animations
            ease: 'power2.out'
        }),
        start: 'top 85%',
        once: true
    });

    // Hover animations
    const cards = document.querySelectorAll('.grid-item');
    cards.forEach(card => {
        const image = card.querySelector('.artist-image');
        const playBtn = card.querySelector('.play-btn');
        const info = card.querySelector('.artist-info');

        card.addEventListener('mouseenter', () => {
            gsap.to(image, {
                scale: 1.05,
                duration: 0.6,  // Slower animation
                ease: 'power2.out'
            });
            gsap.to(playBtn, {
                scale: 1,
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: 'back.out(1.7)'
            });
            gsap.to(info, {
                y: -5,
                duration: 0.4,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(image, {
                scale: 1,
                duration: 0.6,
                ease: 'power2.out'
            });
            gsap.to(playBtn, {
                scale: 0.8,
                y: 20,
                opacity: 0,
                duration: 0.4,
                ease: 'power2.in'
            });
            gsap.to(info, {
                y: 0,
                duration: 0.4,
                ease: 'power2.out'
            });
        });
    });
}

// Story Section Animations
function initStoryAnimations() {
    const animatedElements = document.querySelectorAll('.fade-up, .fade-left, .fade-right');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Unobserve after animation
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '-50px'
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM loaded, initializing player');
    
    // Initialize animations
    initAnimations();
    initArtistCardsAnimation();
    initSmoothScrolling();
    initStoryAnimations();
    
    // Initialize tracks
    initializeTracks();
    
    // Initialize artist section
    initializeArtistSection();
    
    // Update active track
    updateActiveTrack();
    
    // Check audio element
    if (!audioPlayer) {
        debugLog('Error: Audio player element not found');
        return;
    }

    // Check if we have tracks
    if (tracks.length === 0) {
        debugLog('Error: No tracks found');
        return;
    }

    const tracks = document.querySelectorAll('.track');
    const firstTrack = document.querySelector('[data-song="Nate Curry - Tight Knit"]');
    
    // Remove active class from all tracks
    tracks.forEach(track => track.classList.remove('active'));
    
    // Add active class to Nate Curry track
    firstTrack.classList.add('active');
    
    // Load Nate Curry track
    loadTrack(firstTrack);
});

// Weekly Discoveries Carousel
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.discovery-card');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');

    let currentIndex = 0;

    const updateCarousel = () => {
        cards.forEach((card, index) => {
            if (index === currentIndex) {
                card.classList.add('active');
                card.classList.remove('prev', 'next');
            } else if (index === getPrevIndex()) {
                card.classList.add('prev');
                card.classList.remove('active', 'next');
            } else if (index === getNextIndex()) {
                card.classList.add('next');
                card.classList.remove('active', 'prev');
            } else {
                card.classList.remove('active', 'prev', 'next');
            }
        });
    };

    const getNextIndex = () => {
        const cards = document.querySelectorAll('.discovery-card');
        return (currentIndex + 1) % cards.length;
    };

    const getPrevIndex = () => {
        const cards = document.querySelectorAll('.discovery-card');
        return (currentIndex - 1 + cards.length) % cards.length;
    };

    const goToNext = () => {
        const cards = document.querySelectorAll('.discovery-card');
        currentIndex = (currentIndex + 1) % cards.length;
        updateCarousel();
    };

    const goToPrev = () => {
        const cards = document.querySelectorAll('.discovery-card');
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        updateCarousel();
    };

    let carouselInterval;
    const CAROUSEL_INTERVAL_TIME = 4000; // 3 seconds

    function startCarouselAutoRotation() {
        // Clear any existing interval
        if (carouselInterval) {
            clearInterval(carouselInterval);
        }
        
        // Start new interval
        carouselInterval = setInterval(goToNext, CAROUSEL_INTERVAL_TIME);
    }

    function stopCarouselAutoRotation() {
        if (carouselInterval) {
            clearInterval(carouselInterval);
        }
    }

    if (prevButton && nextButton) {
        // Add event listeners for manual navigation
        prevButton.addEventListener('click', () => {
            goToPrev();
            // Restart the auto-rotation timer
            stopCarouselAutoRotation();
            startCarouselAutoRotation();
        });

        nextButton.addEventListener('click', () => {
            goToNext();
            // Restart the auto-rotation timer
            stopCarouselAutoRotation();
            startCarouselAutoRotation();
        });

        // Pause auto-rotation on hover
        const carouselContainer = document.querySelector('.carousel-container');
        carouselContainer.addEventListener('mouseenter', () => {
            stopCarouselAutoRotation();
        });

        // Resume auto-rotation when mouse leaves
        carouselContainer.addEventListener('mouseleave', () => {
            startCarouselAutoRotation();
        });

        // Initial setup
        updateCarousel();
        startCarouselAutoRotation();
    }
});

// Handle smooth scrolling on route changes
window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
});

window.addEventListener('load', () => {
    ScrollTrigger.refresh();
});

// Add CSS for artwork rotation
const style = document.createElement('style');
style.textContent = `
    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    #currentArtwork {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);
