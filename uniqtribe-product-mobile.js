
let startX = 0;
let currentIndex = 0;
document.querySelector('#image-gallery').style.display = 'none';

const slider = document.querySelector('.theme-product-detail-image');
slider.addEventListener('touchstart', handleTouchStart, false);
slider.addEventListener('touchmove', handleTouchMove, false);
slider.addEventListener('touchend', handleTouchEnd, false);

function handleTouchStart(e) {
  isTouching = true;
  const touchStart = e.touches[0];  // Get the touch start position
  startX = touchStart.clientX;
}

// Function to handle the touch move (tracking the swipe)
function handleTouchMove(e) {
  if (!isTouching) return; // Ignore if not currently touching
  const touchMove = e.touches[0];
  const moveX = touchMove.clientX;

  // You can use moveX here to see the dragging progress (optional)
}

// Function to handle the end of the touch (when swipe is finished)
function handleTouchEnd(e) {
  if (!isTouching) return; // Ignore if not currently touching
  const touchEnd = e.changedTouches[0];
  const endX = touchEnd.clientX;

  // Detect swipe direction (left or right)
  if (startX > endX + 50) {
    // Swipe left
   // swipeDirectionText.textContent = "Swipe detected: Left";
    triggerSlide('left');
  } else if (startX < endX - 50) {
    // Swipe right
   // swipeDirectionText.textContent = "Swipe detected: Right";
    triggerSlide('right');
  }

  isTouching = false;  // Reset touch tracking
}

// Function to trigger the slide based on swipe direction
function triggerSlide(direction) {
  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;

  if (direction === 'left') {
moveSelection(1);
 } else if (direction === 'right') {
moveSelection(-1);

  }

  // Apply the slide transition by changing the transform property
 // slider.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function moveSelection(direction) {
console.log("totalImages1");

const images =document.querySelector('#image-gallery').querySelectorAll('img');
const totalImages = images.length;
console.log("totalImages", totalImages);

  let newIndex = currentIndex + direction;

  // Prevent going out of bounds
  if (newIndex < 0 || newIndex >= totalImages) return;

  // Remove previous selection
  images[currentIndex].classList.remove('selected');

  // Update index
  currentIndex = newIndex;

  // Simulate click on the new image
  images[currentIndex].click();

  // Add selection highlight
  images[currentIndex].classList.add('selected');
}

