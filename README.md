# ATL Escape Multiplayer

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
