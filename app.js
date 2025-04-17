const apiKeys = [
  'AIzaSyAHIb4D8GqBy94f1VA2TZEh26qkeEM0Z_8',
  'AIzaSyC3i3luHWU-RdPoaztR5Do4A0Uk2SDNSHE',
];
let currentApiKeyIndex = 0;
let currentApiKey = apiKeys[currentApiKeyIndex];
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const videoContainer = document.getElementById('video-container');
const songTitle = document.getElementById('song-title');
const albumArt = document.getElementById('album-art');
const playPauseBtn = document.getElementById('play-pause-btn');
const forwardBtn = document.getElementById('next-btn');
const backwardBtn = document.getElementById('prev-btn');
const progressBar = document.getElementById('progress-bar');
const progress = document.getElementById('progress');
const volumeSlider = document.getElementById('volume-slider');
const unavailableMessageElement = document.getElementById('unavailable-message');
const themeToggle = document.getElementById('theme-toggle');
let player;
let videoTitle = 'Take a chill pill!';
let isPlaying = false;
let isFirstSearch = true;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('video-container', {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      loop: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: (event) => {
        console.error('YouTube Player Error:', event.data);
        showUnavailableMessage();
      }
    }
  });
}

function onPlayerReady(event) {
  updateSongTitle(videoTitle);
  volumeSlider.addEventListener('input', () => {
    player.setVolume(volumeSlider.value);
  });
  setInterval(updateProgressBar, 1000);
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekPercentage = clickX / width;
    const duration = player.getDuration();
    const seekTime = seekPercentage * duration;
    player.seekTo(seekTime, true);
  });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    videoTitle = player.getVideoData().title || 'Unknown Title';
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

function updateProgressBar() {
  if (player && player.getCurrentTime && player.getDuration) {
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
  }
}

function performSearch() {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    if (player && isPlaying) {
      pauseVideo();
    }
    searchVideo(searchTerm);
  }
}

searchBtn.addEventListener('click', performSearch);

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});

function getNextApiKey() {
  currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
  currentApiKey = apiKeys[currentApiKeyIndex];
}

function isQuotaExceeded(response) {
  return response.status === 403;
}

function searchVideo(searchTerm) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    searchTerm
  )}&key=${currentApiKey}&maxResults=15&type=video`;
  fetch(url)
    .then((response) => {
      if (isQuotaExceeded(response)) {
        getNextApiKey();
        return searchVideo(searchTerm);
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.items && data.items.length > 0) {
        let videoId;
        let thumbnailUrl;
        for (let i = 0; i < data.items.length; i++) {
          if (data.items[i].id && data.items[i].id.videoId) {
            videoId = data.items[i].id.videoId;
            videoTitle = data.items[i].snippet.title;
            thumbnailUrl = data.items[i].snippet.thumbnails.high.url;
            break;
          }
        }
        if (videoId) {
          playVideoById(videoId);
          albumArt.src = thumbnailUrl;
          videoTitle = data.items[0].snippet.title;
          updateSongTitle(videoTitle);
          hideUnavailableMessage();
          if (isFirstSearch) {
            albumArt.style.zIndex = '1';
            videoContainer.style.opacity = '1';
            videoContainer.style.zIndex = '2';
            isFirstSearch = false;
          } else {
            albumArt.style.zIndex = '2';
            videoContainer.style.opacity = '0';
            videoContainer.style.zIndex = '1';
          }
        } else {
          showUnavailableMessage();
        }
      } else {
        showUnavailableMessage();
      }
    })
    .catch((error) => {
      console.error('Error fetching data:', error);
      showUnavailableMessage();
    });
}

function playVideoById(videoId) {
  if (player) {
    player.loadVideoById({
      videoId: videoId,
      startSeconds: 0,
      suggestedQuality: 'highres'
    });
    videoContainer.style.display = 'block';
    player.playVideo();
    isPlaying = true;
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  }
}

function pauseVideo() {
  if (player) {
    player.pauseVideo();
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
}

function updateSongTitle(title) {
  songTitle.textContent = title;
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

function seekForward() {
  if (player && player.getCurrentTime) {
    const currentTime = player.getCurrentTime();
    const newTime = currentTime + 10;
    player.seekTo(newTime, true);
  }
}

function seekBackward() {
  if (player && player.getCurrentTime) {
    const currentTime = player.getCurrentTime();
    const newTime = currentTime - 10;
    player.seekTo(newTime, true);
  }
}

forwardBtn.addEventListener('click', seekForward);
backwardBtn.addEventListener('click', seekBackward);

themeToggle.addEventListener('click', () => {
  const musicPlayer = document.getElementById('music-player');
  musicPlayer.classList.toggle('dark-mode');
  musicPlayer.classList.toggle('light-mode');
  themeToggle.innerHTML = musicPlayer.classList.contains('dark-mode')
    ? '<i class="fas fa-moon"></i>'
    : '<i class="fas fa-sun"></i>';
});