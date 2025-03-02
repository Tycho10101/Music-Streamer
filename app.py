import os
import json
import random
from flask import Flask, render_template, send_from_directory, request, jsonify
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3

app = Flask(__name__)

MUSIC_FOLDER = 'music'
INDEX_FILE = 'index.json'

def get_mp3_metadata(file_path):
    try:
        audio = MP3(file_path, ID3=EasyID3)
        title = audio.get("title", ["Unknown Title"])[0]
        artist = audio.get("artist", ["Unknown Artist"])[0]
        return {"file": file_path, "name": title, "artist": artist}
    except Exception as e:
        return None

def get_music_files():
    music_files = [f for f in os.listdir(MUSIC_FOLDER) if
                   f.endswith(('.mp3'))]
    return music_files
    
def load_playlist():
    playlist = []

    files = get_music_files()

    for file_path in files:
        metadata = get_mp3_metadata(os.path.join(MUSIC_FOLDER, file_path))
        metadata['file'] = metadata['file'].lstrip('music\\')
        if metadata:
            playlist.append(metadata)
        if metadata["name"] == "Unknown Title" and metadata["artist"] == "Unknown Artist":
            metadata["name"] = metadata['file']
            
    playlist.sort(key=lambda x: x['name'])
    return playlist

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/music/<filename>')
def get_music(filename):
    return send_from_directory(MUSIC_FOLDER, filename)

@app.route('/get_playlist')
def get_playlist():
    playlist = load_playlist()
                
    return jsonify(playlist)
    
@app.route('/next_song')
def next_song():
    current_song = request.args.get('current_song')
    shuffle = request.args.get('shuffle') == 'true'
    loop = request.args.get('loop') == 'true'
    music_files = load_playlist()

    if not music_files:
        return jsonify({'file': None})
        
    current_index = next((i for i, item in enumerate(music_files) if item['file'] == current_song), None)

    if current_index == None:
        next_index = 0
    else:
        next_index = (current_index + 1) % len(music_files)

    if shuffle:
        if len(music_files) > 1:
            next_song_file = current_song
            while next_song_file == current_song:
                next_song_file = random.choice(music_files)
        else:
            next_song_file = random.choice(music_files)
    else:
        next_song_file = music_files[next_index]

    print(next_song_file)
    return jsonify(next_song_file)

if __name__ == '__main__':
    app.run(debug=True)
