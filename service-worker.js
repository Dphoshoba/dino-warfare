const CACHE_NAME = "dinowarfare-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/game.js",
  "/assets/sprites/sprites_player.png",
  "/assets/sprites/sprites_raptor.png",
  "/assets/sprites/sprites_trex.png",
  "/assets/sprites/sprites_motherdino.png",
  "/assets/sounds/sounds_shoot.mp3",
  "/assets/sounds/sounds_hit.mp3",
  "/assets/sounds/sounds_gameover.wav",
  "/assets/sounds/sounds_regen.wav",
  "/assets/sounds/sounds_shield.mp3",
  "/assets/sounds/sounds_background.wav",
  "/assets/sounds/sounds_boss_intro.wav"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
