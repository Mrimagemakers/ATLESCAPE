# ATL Nightclub Mogul

Extract the ZIP, open a terminal in the extracted folder, and run `node server.mjs` with Node.js 18 or later. No package installation is required. Open `http://localhost:8080` to play. For two devices on the same network, open the host computer's LAN address on port 8080. For remote play, both players open the same URL on a host that runs the Node server. The server honors the `PORT` environment variable.

1. Enter the Empire hub and open **Multiplayer**.
2. Create a room and share the eight-character code with one friend. Your friend selects **Join room** and enters the code.
3. The host chooses a gig both players have unlocked. Both browsers load the same route and start together once ready. Your teammate appears in turquoise.
4. Both players must escape for a joint escape. Each player controls their own first-person combat, pursuers, pickups, and career progress.

The multiplayer room server keeps rooms in memory. GitHub Pages can serve the solo game. Room creation and joining require the Node server on the same origin.

## Peach City Quest

Open `/peach.html` or select **Peach City Quest** in the Empire hub. Use **Atlanta Heritage Hunt → Enter VR scavenger hunt** in a WebXR-capable headset browser. Select a landmark portal with a controller trigger. Point at the floor and press the trigger to teleport. Aim at a relic and press the trigger to collect it. The eight scenes are stylized interpretations of Atlanta locations.

The **BeltLine Map** plots eight GPS pins and requests trail lines from the public Atlanta BeltLine ArcGIS service. The provided ArcGIS item and the official trail map are linked in the game. Landmark pins still work if the GIS service is unavailable. Use the official map for current access and route planning.

The 3D map displays USDA / USGS National Map aerial imagery beneath the BeltLine trail data. All eight landmarks have OpenArt illustrations and an **Explore in VR** button that opens their own playable scene. Drag with a mouse or use the rotation buttons to change the view, or switch to **Flat view**. The landmark and trail overlays use the same projection as the imagery.

**Things to Do** links to Discover Atlanta, operated by the Atlanta Convention & Visitors Bureau, and to Eventbrite's Atlanta listings. The **Turn Up Radio** panel also links to five Atlanta broadcasters.

For real-world AR, open the game over HTTPS in a browser that supports WebXR immersive AR and hit testing. Select a pin, stop in a public pedestrian area, check GPS, and open the marker. The location check requires a reliable fix within a 100-meter geofence. Place the relic on a detected surface, then select it to claim the location stamp. This uses GPS to unlock a marker and local surface tracking for placement. Phone coordinates stay on the device.

Create a **Team hunt** room and share its code with up to three friends. VR, map, and AR players contribute to one collection. VR teammates in the same landmark appear as turquoise avatars at their last teleport positions. Room progress is temporary, and personally earned relics and AR stamps are saved in the browser. Use a single HTTPS Node host for remote play, GPS, and XR.

The **Virtual Tours** tab includes free third-party Atlanta tours and project resources. Relevant experiences also appear on landmark pages. Cards credit each creator or presenting organization and link to the original host. Viewing modes vary by host and device.

**Videos** contains five credited Atlanta films. Playback loads the original Vimeo player after a selection, and each film links to its source. **Turn Up Radio** is available in the ATL Escape hub and pause menu, and across Peach City Quest. It plays a six-station selection from the Turn Up Music catalog. Close the radio panel to keep listening while playing, or reopen it and select **Stop**. Streams are served by Radio France and SomaFM. OpenArt created the four environment plates, which load from its CDN.

## Venue rebuild: crowd and screens

The nine original venues (The Atlantic, The Pinnacle, The Volt, Needle & Groove, BeltLine Loft, Peachtree Terrace, Auburn Listening Room, Westside Soundstage and Peters Street Social) are rebuilt from reference photos in `nightlife-sets.js`, using shared parts from `nightlife-kit.js`. Each reference panorama lights its room, and the window skylines come from the same photos (`assets/venues/`). Aquarium Night, Penthouse Loft and The Escape Room still use `nightlife-reference-worlds.js`.

The crowd uses Turn Up Music's Rocketbox partygoers (MIT, Microsoft) with motion-captured dances, cheers and conversations (`assets/crowd/`, `nightlife-crowd.js`). Five regulars, Imani, Keisha, Tasha, Brielle and Jada, have their own figures and club outfits.

**Screens:** in a venue, select **📺 Screens** to show an image or video on every venue screen. You can use a direct .jpg, .png, .mp4 or .webm link, or upload a file. The choice is saved on the device.

**Dancing:** everyone in the venues dances, including the crowd, bar staff, musicians and the named staff you talk to. `nightlife-mocap.js` retargets Turn Up Music's motion-capture dances onto the Mixamo staff rigs and the simple Meshy guest rigs. Each model is baked once and cached. Dancers switch moves now and then and sometimes throw their hands up.

## ATL Nightclub Mogul

`nightlife.html` is **ATL Nightclub Mogul**, the Nightclub Mogul game from Turn Up Music brought to Atlanta.

- **Jobs:** bartender (real recipes, measured pours, ID checks), bouncer (IDs, dress code, guest list, capacity), DJ (beatmatching, phrasing, reading the crowd), barback, bottle service, promoter, celebrity and birthday guest. Each has a training run, then real shifts that pay, level up and post to a daily online leaderboard.
- **Wellness and play:** meditation, exercise, dance class, music trivia, the dance-off, the bar brawl and Trivia Live. The Escape tile opens ATL's playable Escape Room, which pays into the same wallet.
- **Club Mogul (Downtown):** the club where the jobs are worked. Its bar, DJ riser, VIP booth and door sit exactly where the Turn Up Music games expect them.
- **The empire:** buy any of 12 Atlanta venues (from Needle & Groove to The Volt), hire staff, buy upgrades, open each club for the night and grow from Rookie to Nightlife Tycoon. "Visit this club" walks you into it.
- **Live events:** weekly featured nights, host your own, RSVP, add it to your calendar, share a link that opens straight to the event, and make a flyer. A LIVE banner appears when a night starts. Events and leaderboards travel on public Nostr relays, tagged `atlnightclubmogul`.

While the Mogul panel is open, the venue fills the screen like the Turn Up Music stage. In VR the panel floats in front of you and the controller trigger presses its buttons. A career from before the move (ATL Hustle shifts) carries over its cash and shifts.

Files: `atl-mogul.js` (the game, ported from `Mrimagemakers/Turnupmusic` `app/index.html`), `atl-lounge.js` (the bridge to the ATL venue engine), `atl-mogul-shim.js` (saves, toasts, the 18+ check, sharing, panel drawing), `atl-events.js` (live events), `atl-mogul.css`, and `vendor/` (the Trystero and nostr-tools bundle, and the cast portraits).

### On a smart TV

Open `nightlife.html` in the TV's web browser. TV mode turns on by itself for Samsung (Tizen), LG (webOS), Fire TV, Android and Google TV and other TV browsers; anywhere else, add `?tv=1` to the link or press **📺 TV mode**. A TV home screen with big tiles replaces the long page. Everything works from the remote:

- **Home screen:** the arrows move, **OK** chooses. Pick a job, your empire, live events, the dance-off, the brawl, Trivia Live, or any venue.
- **In a venue:** **↑↓** walk, **←→** turn, **OK** uses whatever is in the middle of the screen (the dot) or opens a menu (Nightclub Mogul, talk to staff, events, screens, the Escape Room panel, TV home). **Back** returns to the TV home.
- **The Mogul panel:** the arrows move the highlight, **OK** presses, hold **OK** to pour. **Back** closes it, or during a job shrinks it so you can look around.
- **Dance-off:** arrows and OK are the moves. **Brawl:** ←→ dodge, ↑ punch, ↓ block (hold), OK kick.

### VR bartending

In a headset, the bartender job is hands-on, as in Turn Up Music: grab a bottle with the trigger or grip, tip it over the glass on the mat to pour, drop a garnish into the glass, toss a bottle and catch it for tips (drop it and it smashes). Either hand can press the floating Mogul panel.
