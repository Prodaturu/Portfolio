// Function to set up Locomotive Scroll and GSAP's ScrollTrigger
function locomotive() {
    // Register the ScrollTrigger plugin with GSAP
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Locomotive Scroll on the element with ID "main"
    const locoScroll = new LocomotiveScroll({
        el: document.querySelector("#main"),
        smooth: true,
    });

    // expose for other scripts (used for nav scrolling)
    window.locoScroll = locoScroll;

    // Update ScrollTrigger whenever Locomotive Scroll updates
    locoScroll.on("scroll", ScrollTrigger.update);

    // Proxy methods to sync ScrollTrigger with Locomotive Scroll
    ScrollTrigger.scrollerProxy("#main", {
        // Custom scrollTop function
        scrollTop(value) {
            return arguments.length
                ? locoScroll.scrollTo(value, 0, 0)  // If argument provided, scroll to that position
                : locoScroll.scroll.instance.scroll.y;  // Otherwise, return current scroll position
        },

        // Custom method to get bounding client rect
        getBoundingClientRect() {
            return {
                top: 0,
                left: 0,
                width: window.innerWidth,
                height: window.innerHeight,
            };
        },

        // Determine the type of pinning based on whether transform is applied
        pinType: document.querySelector("#main").style.transform
            ? "transform"
            : "fixed",
    });

    // Refresh Locomotive Scroll when ScrollTrigger refreshes
    ScrollTrigger.addEventListener("refresh", () => locoScroll.update());

    // Refresh ScrollTrigger
    ScrollTrigger.refresh();
}

// Call the locomotive function to initialize everything
locomotive();

// Smooth scroll for nav links using Locomotive when available
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        const target = document.querySelector(href);
        if (!target) return;
        const offsetTop = target.getBoundingClientRect().top + (window.locoScroll ? window.locoScroll.scroll.instance.scroll.y : window.scrollY);
        if (window.locoScroll) {
            window.locoScroll.scrollTo(target);
        } else {
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
    });
});

// Simple reveal for project cards using GSAP + ScrollTrigger
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.utils.toArray('.project-card').forEach(card => {
        gsap.from(card, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: card,
                scroller: '#main',
                start: 'top 85%',
            }
        });
    });
}

// Get the canvas element from the DOM
const canvas = document.querySelector("canvas");

// Get the 2D rendering context from the canvas
const context = canvas.getContext("2d");

// Set the canvas width and height to match the window's inner dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Add an event listener for window resize events
window.addEventListener("resize", function () {
    // Update the canvas width and height to match the new window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Call the render function to redraw the canvas
    render();
});

function files(index) {
    // Generate a zero-padded filename like ./male0001.png
    const num = index + 1; // original frames are 1-based
    const padded = String(num).padStart(4, '0');
    return `./male${padded}.png`;
}

const frameCount = 300; //- No of images to loop through 

const images = [];
const imageSeq = { frame: 0 };

// Preload images with basic progress handling
let loadedCount = 0;
for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = files(i);
    // ensure crossOrigin if images are served from a different origin
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        loadedCount++;
        // once the first image is ready, render an initial frame
        if (loadedCount === 1) render();
    };
    img.onerror = () => {
        // count error as loaded to avoid blocking, and log for debugging
        loadedCount++;
        console.warn('Failed to load frame:', img.src);
    };
    images.push(img);
}

gsap.to(imageSeq, {
    frame: frameCount - 1,
    snap: "frame",
    ease: `none`,
    scrollTrigger: {
        scrub: 0.15,
        trigger: `#hero>canvas`,
        start: `top top`,
        end: `600% top`,
        scroller: `#main`,
    },
    onUpdate: render,
});

// Robust render: if the requested frame isn't loaded yet, draw the first available loaded frame.
function render() {
    const img = images[imageSeq.frame];
    if (!img || !img.complete) {
        // find a fallback loaded image to display
        const fallback = images.find(i => i && i.complete);
        if (fallback) {
            scaleImage(fallback, context);
        }
        return;
    }
    scaleImage(img, context);
}

function scaleImage(img, ctx) {
    var canvas = ctx.canvas;
    var hRatio = canvas.width / img.width;
    var vRatio = canvas.height / img.height;
    var ratio = Math.max(hRatio, vRatio);
    var centerShift_x = (canvas.width - img.width * ratio) / 2;
    var centerShift_y = (canvas.height - img.height * ratio) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    centerShift_x,
    centerShift_y,
    img.width * ratio,
    img.height * ratio
    );
}

// ScrollTrigger for pinning canvas
ScrollTrigger.create({
    trigger: "#hero>canvas",
    pin: true,
    scroller: `#main`,
    start: `top top`,
    end: `600% top`,
});

// ScrollTrigger for pinning each page
["#page1", "#page2", "#page3"].forEach((page) => {
    gsap.to(page, {
        scrollTrigger:{
            trigger: page,
            start: `top top`,
            end: `bottom top`,
            // markers: true,
            pin: true,
            scroller: `#main`
        }
    });
});
