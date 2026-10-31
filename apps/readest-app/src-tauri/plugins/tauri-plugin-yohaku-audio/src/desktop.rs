//! The desktop side of the music library: finds the audio files in what the
//! user picked (folders are searched recursively), reads their tags and cover
//! with lofty, and lets the WebView stream them.

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};

use lofty::picture::MimeType;
use lofty::prelude::*;
use serde::Serialize;
use tauri::{AppHandle, Manager, Runtime};

const AUDIO_EXTENSIONS: &[&str] = &[
    "flac", "mp3", "m4a", "aac", "alac", "ogg", "oga", "opus", "wav", "aif", "aiff", "wv", "ape",
];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackInfo {
    uri: String,
    title: String,
    artist: String,
    album: String,
    track_no: u32,
    disc_no: u32,
    duration_ms: u64,
    cover: Option<String>,
}

fn is_audio(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            AUDIO_EXTENSIONS.contains(&extension.to_ascii_lowercase().as_str())
        })
}

fn collect(path: &Path, files: &mut Vec<PathBuf>) {
    if path.is_dir() {
        let Ok(entries) = std::fs::read_dir(path) else {
            return;
        };
        let mut children: Vec<PathBuf> = entries.flatten().map(|entry| entry.path()).collect();
        children.sort();
        for child in children {
            // Hidden files are not music (".DS_Store", "._Song.flac", ".Trash").
            let hidden = child
                .file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| name.starts_with('.'));
            if !hidden {
                collect(&child, files);
            }
        }
    } else if is_audio(path) {
        files.push(path.to_owned());
    }
}

fn hash_of(value: impl Hash) -> u64 {
    let mut hasher = DefaultHasher::new();
    value.hash(&mut hasher);
    hasher.finish()
}

fn read_track(path: &Path, covers: &Path) -> TrackInfo {
    let mut info = TrackInfo {
        uri: path.to_string_lossy().into_owned(),
        title: path
            .file_stem()
            .and_then(|stem| stem.to_str())
            .unwrap_or_default()
            .to_owned(),
        artist: String::new(),
        album: String::new(),
        track_no: 0,
        disc_no: 0,
        duration_ms: 0,
        cover: None,
    };
    let Ok(tagged) = lofty::read_from_path(path) else {
        return info;
    };
    info.duration_ms = tagged.properties().duration().as_millis() as u64;
    let Some(tag) = tagged.primary_tag().or_else(|| tagged.first_tag()) else {
        return info;
    };
    if let Some(title) = tag.title() {
        info.title = title.into_owned();
    }
    info.artist = tag
        .artist()
        .map(|artist| artist.into_owned())
        .unwrap_or_default();
    info.album = tag
        .album()
        .map(|album| album.into_owned())
        .unwrap_or_default();
    info.track_no = tag.track().unwrap_or(0);
    info.disc_no = tag.disk().unwrap_or(0);
    if let Some(picture) = tag.pictures().first() {
        // One file per album cover; a track without an album has its own.
        let key = if info.album.is_empty() {
            hash_of(&info.uri)
        } else {
            hash_of((&info.artist, &info.album))
        };
        let extension = match picture.mime_type() {
            Some(MimeType::Png) => "png",
            _ => "jpg",
        };
        let file = covers.join(format!("{key:016x}.{extension}"));
        if file.exists() || std::fs::write(&file, picture.data()).is_ok() {
            info.cover = Some(file.to_string_lossy().into_owned());
        }
    }
    info
}

/// The audio files under `paths` (files, or folders searched recursively)
/// with their tags; their covers are cached in the app's cache folder.
#[tauri::command]
pub async fn scan_music<R: Runtime>(
    app: AppHandle<R>,
    paths: Vec<String>,
) -> Result<Vec<TrackInfo>, String> {
    let covers = app
        .path()
        .app_cache_dir()
        .map_err(|error| error.to_string())?
        .join("yohaku-covers");
    std::fs::create_dir_all(&covers).map_err(|error| error.to_string())?;
    let mut files = Vec::new();
    for path in &paths {
        collect(Path::new(path), &mut files);
    }
    let scope = app.asset_protocol_scope();
    Ok(files
        .iter()
        .map(|file| {
            // The WebView streams the file through the asset protocol.
            let _ = scope.allow_file(file);
            read_track(file, &covers)
        })
        .collect())
}

/// Lets the WebView stream files picked in an earlier session.
#[tauri::command]
pub fn allow_files<R: Runtime>(app: AppHandle<R>, paths: Vec<String>) -> Result<(), String> {
    let scope = app.asset_protocol_scope();
    for path in paths {
        scope.allow_file(&path).map_err(|error| error.to_string())?;
    }
    Ok(())
}
