// JavaScript (script.js)

const apiKeys = [
  'AIzaSyAHIb4D8GqBy94f1VA2TZEh26qkeEM0Z_8', // Replace 'API_KEY_1', 'API_KEY_2', etc. with your actual YouTube API keys
  'API_KEY_2',
  'API_KEY_3',
  // Add more API keys as needed
];

let currentApiKeyIndex = 0; // Index of the currently active API key
let currentApiKey = apiKeys[currentApiKeyIndex];

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const playerContainer = document.getElementById('player-container');
const videoContainer = document.getElementById('video-container');
const songTitle = document.getElementById('song-title');
const playPauseBtn = document.getElementById('play-pause-btn');
const forwardBtn = document.getElementById('next-btn');
const backwardBtn = document.getElementById('prev-btn');
const unavailableMessageElement = document.getElementById('unavailable-message');

let player;
let videoTitle = 'Take a chill pill!';
let isPlaying = false;

window.addEventListener('DOMContentLoaded', () => {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

function onYouTubeIframeAPIReady() {
  player = new YT.Player('video-container', {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      loop: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  updateSongTitle(videoTitle);
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    videoTitle = player.getVideoData().title;
    updateSongTitle(videoTitle);
    isPlaying = true;
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    videoTitle = 'Take a chill pill!';
    updateSongTitle(videoTitle);
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
}

searchBtn.addEventListener('click', () => {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    if (player && isPlaying) {
      pauseVideo();
    }
    searchVideo(searchTerm);
  }
});

// Function to get the next API key in the rotation
function getNextApiKey() {
  currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
  currentApiKey = apiKeys[currentApiKeyIndex];
}

// Function to check if the API key quota has been reached
function isQuotaExceeded(response) {
  return response && response.error && response.error.errors.some((error) => {
    return error.reason === 'quotaExceeded' || error.reason === 'dailyLimitExceeded';
  });
}

function searchVideo(searchTerm) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    searchTerm
  )}&key=${currentApiKey}&maxResults=15&type=video`;

  fetch(url)
    .then((response) => {
      if (isQuotaExceeded(response)) {
        // If quota is exceeded, switch to the next API key and retry the search
        getNextApiKey();
        return searchVideo(searchTerm);
      } else {
        return response.json();
      }
    })
    .then((data) => {
      console.log(JSON.stringify(data)); // Output the data to the console for debugging
      if (data.items && data.items.length > 0) {
        let videoId;
        let videoTitle;
        for (let i = 0; i < data.items.length; i++) {
          if (data.items[i].id && data.items[i].id.videoId) {
            // Check if the video is embeddable (check if it is playable on external websites)
            if (data.items[i].id.videoId && data.items[i].snippet && data.items[i].snippet.title) {
              videoId = data.items[i].id.videoId;
              videoTitle = data.items[i].snippet.title;
              break; // If an embeddable video is found, break the loop
            }
          }
        }

        if (videoId) {
          playVideoById(videoId);
          videoTitle = data.items[0].snippet.title;
          updateSongTitle(videoTitle);
          hideUnavailableMessage();
        } else {
          showUnavailableMessage();
          console.error('No embeddable videos found.');
        }
      } else {
        showUnavailableMessage();
        console.error('No search results found.');
      }
    })
    .catch((error) => {
      showUnavailableMessage();
      console.error('Error fetching data:', error);
    });
}

function playVideoById(videoId) {
  player.loadVideoById(videoId);
  playerContainer.style.display = 'block';
  videoContainer.style.display = 'block';
  player.playVideo();
  isPlaying = true;
  playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
}

function pauseVideo() {
  player.pauseVideo();
  isPlaying = false;
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
}

function updateSongTitle(title) {
  const titleElement = document.getElementById('song-title');
  titleElement.textContent = title;

  if (title === 'Take a chill pill!') {
    unavailableMessageElement.style.display = 'block';
  } else {
    unavailableMessageElement.style.display = 'none';
  }
}

function showUnavailableMessage() {
  unavailableMessageElement.style.display = 'block';
}

function hideUnavailableMessage() {
  unavailableMessageElement.style.display = 'none';
}

playPauseBtn.addEventListener('click', () => {
  if (player) {
    if (isPlaying) {
      pauseVideo();
    } else {
      player.playVideo();
      isPlaying = true;
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
  }
});

// Function to seek forward by 10 seconds
function seekForward() {
  if (player && player.getCurrentTime) {
    const currentTime = player.getCurrentTime();
    const newTime = currentTime + 10;
    player.seekTo(newTime, true);
  }
}

// Function to seek backward by 10 seconds
function seekBackward() {
  if (player && player.getCurrentTime) {
    const currentTime = player.getCurrentTime();
    const newTime = currentTime - 10;
    player.seekTo(newTime, true);
  }
}

forwardBtn.addEventListener('click', seekForward);
backwardBtn.addEventListener('click', seekBackward);
