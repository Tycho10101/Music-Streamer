var jsmediatags = window.jsmediatags;

document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('audioPlayer');
    const playlist = document.getElementById('playlist');
    const nextButton = document.getElementById('nextButton');
    const shuffleButton = document.getElementById('shuffleButton');
    const loopButton = document.getElementById('loopButton');
    const nowPlayingImage = document.getElementById('now-playing-image');
    const nowPlayingTitle = document.getElementById('now-playing-title');
	const nowPlayingSubTitle = document.getElementById('now-playing-sub-title');
    let currentSongIndex = 0;
    let shuffle = false;
    let loop = false;
    let musicFiles = [];
	
    function fetchPlaylist() {
        console.log("Fetching playlist...");
        fetch('/get_playlist')
            .then(response => response.json())
            .then(data => {
                musicFiles = data;
                console.log("Playlist data:", musicFiles);
                populatePlaylist(musicFiles);
                loadSong(musicFiles[0]['file']);
            })
            .catch(error => console.error('Error fetching playlist:', error));
    }

    function populatePlaylist(songs) {
        const playlistUl = document.querySelector('#playlist');

        if (!playlistUl) {
            console.error("Playlist UL element not found!");
            return;
        }

        playlistUl.innerHTML = '';
        songs.forEach(song => {
            const li = document.createElement('li');
			const icon = document.createElement('i')
            const a = document.createElement('a');
			icon.className = 'fas fa-music'
            a.href = '#';
			txt = document.createTextNode(" " + song['name'] + ' - ' + song['artist']);
            a.dataset.song = song['file'];
			a.appendChild(icon);
			a.appendChild(txt);
            li.appendChild(a);
            playlistUl.appendChild(li);

            a.addEventListener('click', function(event) {
                event.preventDefault();
                const song = event.target.dataset.song;
                console.log("Playlist item clicked:", song);
				console.dir(song);
                loadSong(song);
            });
        });
    }

    fetchPlaylist();

    function loadSong(song) {
        audioPlayer.src = '/music/' + song;
        audioPlayer.load();
		
		nowPlayingImage.src = '/static/default-icon.png';
		nowPlayingTitle.textContent = 'Loading...';
		nowPlayingSubTitle.textContent = 'Loading...';

        currentSongIndex = musicFiles.findIndex(item => item.file === song);
        jsmediatags.read(audioPlayer.src, {
            onSuccess: function(tag) {
                if (tag.tags.picture) {
                    const data = tag.tags.picture.data;
                    const format = tag.tags.picture.format;
                    let base64String = "";
                    for (let i = 0; i < data.length; i++) {
                        base64String += String.fromCharCode(data[i]);
                    }
                    const imageUrl = `data:${format};base64,${btoa(base64String)}`;
                    nowPlayingImage.src = imageUrl;
                } else {
                    nowPlayingImage.src = '/static/default-icon.png';
                }
				let title = tag.tags.title || song;
                let artist = tag.tags.artist || "(no info)";
				nowPlayingTitle.textContent = title;
				nowPlayingSubTitle.textContent = artist;
            },
            onError: function(error) {
                console.log(error);
                nowPlayingImage.src = '/static/default-icon.png';
				nowPlayingTitle.textContent = song;
				nowPlayingSubTitle.textContent = '(no info)';
            }
        });
		audioPlayer.play();
    }

    function playNextSong() {
        if (loop) {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else {
            const currentSong = musicFiles[currentSongIndex]['file'];
            fetch(`/next_song?current_song=${currentSong}&shuffle=${shuffle}`)
                .then(response => response.json())
                .then(data => {
                    if (data.file) {
						loadSong(data['file']);
                    } else {
                        console.log("No more songs in playlist");
                    }
                })
                .catch(error => console.error('Error getting next song:', error));
        }
    }

    nextButton.addEventListener('click', playNextSong);

    audioPlayer.addEventListener('ended', playNextSong);

    shuffleButton.addEventListener('click', function() {
        shuffle = !shuffle;
        shuffleButton.classList.toggle('active', shuffle);
        shuffleButton.innerHTML = shuffle ? '<i class="fas fa-random"></i>' : '<i class="fas fa-random"></i>';
    });

    loopButton.addEventListener('click', function() {
        loop = !loop;
        loopButton.classList.toggle('active', loop);
        loopButton.innerHTML = loop ? '<i class="fas fa-sync-alt"></i>' : '<i class="fas fa-sync-alt"></i>';
    });
});
