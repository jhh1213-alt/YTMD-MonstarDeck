![Thumbnail](assets/thumbnail/ytmdc-thumbnail.png)

# YTMD Monstar Daeck Plugin

Control [Pear Desktop](https://github.com/pear-devs/pear-desktop) from Monstar Daeck (Stream Deck SDK compatible).

This repository is a **fork** of [XeroxDev/YTMD-StreamDeck](https://github.com/XeroxDev/YTMD-StreamDeck) (see also the original [issues](https://github.com/XeroxDev/YTMD-StreamDeck/issues)). It was modified so the plugin talks to the **API Server** in [Pear Desktop](https://github.com/pear-devs/pear-desktop) **v3.6.0 or later**, instead of the official YouTube Music Desktop Companion Server.

| | Original plugin | This fork |
| --- | --- | --- |
| Music app | YouTube Music Desktop App | [Pear Desktop](https://github.com/pear-devs/pear-desktop) **v3.6.0+** |
| Integration | Companion Server | **API Server** (REST + JWT) |
| Default port | `9863` | `26538` |
| Protocol | Socket.IO | HTTP REST |
| Auth | Companion request code | `POST /auth/fun-shiro-ytmd`, then a Bearer token |

Do **not** enable or use Companion Server port `9863` with this plugin. The plugin port must match the Pear Desktop **API Server** port.

## Download

The installable plugin is attached to each [GitHub Release](https://github.com/jhh1213-alt/YTMD-MonstarDeck/releases) as:

**[`fun.hlabs.ytmd.sdPlugin.zip`](https://github.com/jhh1213-alt/YTMD-MonstarDeck/releases/latest)**

## Requirements

1. **Pear Desktop v3.6.0 or later**  
   Download: [pear-devs/pear-desktop](https://github.com/pear-devs/pear-desktop)  
   The API Server plugin must be available (v3.6.0+).
2. **Monstar Daeck** (or another Stream Deck SDK 2 host, minimum software version 6.4).
3. Windows 10+ or macOS 10.11+.
4. Pear Desktop and Monstar Daeck running on the **same computer**, unless you set Host to another machine that can reach the API Server.

## Install the plugin

### 1. Download the release zip

1. Open [Releases](https://github.com/jhh1213-alt/YTMD-MonstarDeck/releases).
2. Download **`fun.hlabs.ytmd.sdPlugin.zip`**.
3. Unblock the file on Windows if needed: right-click the zip → Properties → check **Unblock** → OK.

### 2. Extract the plugin folder

Extract the zip. You should get a folder named:

```text
fun.hlabs.ytmd.sdPlugin
```

Inside it you must see at least:

- `manifest.json`
- `action.html`
- `property-inspector.html`
- `bundle.js`
- `bundle-pi.js`
- `icons/`

Do not copy `src/`, `node_modules/`, or this Git repository into Monstar Daeck. Only the `.sdPlugin` folder is the plugin.

### 3. Copy it into the Monstar Daeck plugins folder

1. Quit Monstar Daeck completely (not just the window — exit the app / tray icon).
2. Copy `fun.hlabs.ytmd.sdPlugin` into the host app **Plugins** directory.

Typical locations:

| App | Windows | macOS |
| --- | --- | --- |
| Monstar Daeck | The `Plugins` folder next to (or inside) the Monstar Daeck data/app directory. In Monstar Daeck, open settings and look for **Plugins** / **Open plugins folder**. | Same idea: the app’s Plugins folder. |
| Elgato Stream Deck | `%appdata%\Elgato\StreamDeck\Plugins\` | `~/Library/Application Support/com.elgato.StreamDeck/Plugins/` |

The folder name must stay `fun.hlabs.ytmd.sdPlugin` (including the `.sdPlugin` suffix).

3. Start Monstar Daeck again (or use **Reload plugins** if the app provides it).
4. In the action catalog, look for the **YTMD Connector** category.

If the category does not appear, confirm the folder is directly inside Plugins (not nested like `Plugins\fun.hlabs.ytmd.sdPlugin.zip\fun.hlabs.ytmd.sdPlugin`) and that `manifest.json` is at the top of that folder.

## Set up Pear Desktop (API Server)

Do this **before** authorizing the plugin.

1. Install and open [Pear Desktop](https://github.com/pear-devs/pear-desktop) **v3.6.0 or newer**.
2. Sign in to YouTube Music in the app and start playing something (the API has nothing to control if no player is ready).
3. Open **Plugins** (or Options → Plugins).
4. Find **API Server** and **enable** it.
5. Open the API Server settings:
   - **Hostname:** `127.0.0.1` if Monstar Daeck is on the same PC (use `0.0.0.0` only if you know you need LAN access).
   - **Port:** `26538` (default). If you change this, you must set the **same port** in the plugin.
   - **Authorization strategy:** **Authorize at first request** (sometimes labeled “auth-at-first”). Do not leave it on “none” if you want a token-based connection like this plugin.
6. **Restart Pear Desktop** after changing hostname, port, or auth strategy. Those settings often apply only after a restart.
7. Confirm the API is up: in a browser on the same PC, open `http://127.0.0.1:26538/swagger` or `http://127.0.0.1:26538/doc`. If the page does not load, the API Server is not running or the port is wrong.

## Connect and authorize the plugin

1. In Monstar Daeck, drag **Play-Pause** (or any YTMD Connector action) onto a key.
2. Select that key so the Property Inspector opens on the right.
3. Set **Host** and **Port** to the same values as Pear Desktop.  
   Defaults: `127.0.0.1` and `26538`.  
   If you changed the API Server port in Pear Desktop, change it here too. The plugin saves on **Save** or when the field loses focus, then reconnects.
4. Click **Authorize**.
5. Switch to Pear Desktop. An **API Authorization Request** popup should appear (Allow / Deny).  
   If you do not see it, look behind other windows or on another monitor.
6. Click **Allow**.
7. Back in the Property Inspector:
   - **Auth Status** should become **Authenticated**.
   - **Connection Status** should become **Connected**.
8. Press Play-Pause on the deck. Pear Desktop should play or pause.

Authorization is stored as a token in the plugin’s global settings. You usually do this only once, unless you deny access, reset Pear Desktop, or switch port/host.

If Connection Status stays **Disconnected** after a successful Allow, click Authorize again, or disable and re-enable the API Server plugin in Pear Desktop, then retry.

## Match a custom API port

1. In Pear Desktop, set API Server **Port** to your value (for example `30000`).
2. Restart Pear Desktop.
3. In the plugin Property Inspector, set **Port** to the same number.
4. Save (or click outside the field).
5. If you were already authenticated, the plugin reuses the token against the new port. If connection fails, click **Authorize** again and Allow the popup.

## Actions

Add any of these from the **YTMD Connector** category:

| Action | What it does |
| --- | --- |
| Play-Pause | Toggle / play / pause. Optional title format (`{current}`, `{remaining}`, `{duration}`). |
| Next / Prev | Skip tracks. |
| Like / Dislike | Toggle like or dislike on the current song. |
| Mute | Mute or unmute. |
| Volume Up / Down | Change volume by the step value in Property Inspector. |
| Track Info | Shows title, artist, album, and artwork. |
| Shuffle | Toggle shuffle. |
| Repeat | Cycle None → All → One. |
| Play Playlist | Start a playlist from a YouTube Music URL that contains `list=`. |

### Play Playlist

Pear Desktop’s API Server does not list your library playlists. Paste a playlist URL that includes a `list` query parameter.

Example:

```text
https://music.youtube.com/playlist?list=PLxxxxxxxx
```

Invalid URLs (no `list=`) will not play.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Category missing in Monstar Daeck | Plugin folder name, location, and `manifest.json`. Reload or restart Monstar Daeck. |
| Connection Status: Disconnected | Pear Desktop is running, API Server is enabled, Host/Port match, firewall is not blocking localhost. |
| No authorization popup | API Server auth strategy is “Authorize at first request”. Restart Pear Desktop. Click Authorize again. |
| Auth Status: failed / 401 | Click Authorize again and Allow. After changing port, re-authorize. |
| Keys do nothing | Connection must be Connected, not only Authenticated. Play a track in Pear Desktop first. |
| Works then stops after changing port | Set the plugin Port to the new API Server port and Save. Re-authorize if needed. |
| Using official YTM Desktop Companion | This fork does **not** support Companion Server (`9863`). Use Pear Desktop API Server (`26538`). |

## Build from source

You need Node.js and npm.

```bash
git clone https://github.com/jhh1213-alt/YTMD-MonstarDeck.git
cd YTMD-MonstarDeck
npm install
npm run build
```

The plugin is written to `build/fun.hlabs.ytmd.sdPlugin/`. Users should install the ready-made **`fun.hlabs.ytmd.sdPlugin.zip`** from [Releases](https://github.com/jhh1213-alt/YTMD-MonstarDeck/releases), not this source tree.

## Credits

- Original Stream Deck plugin: [XeroxDev/YTMD-StreamDeck](https://github.com/XeroxDev/YTMD-StreamDeck) ([issues](https://github.com/XeroxDev/YTMD-StreamDeck/issues))
- Music app / API Server: [pear-devs/pear-desktop](https://github.com/pear-devs/pear-desktop) v3.6.0+

This project is not affiliated with Google, YouTube, Elgato, or the Pear Desktop maintainers.

## License

This project is released under the [MIT License](LICENSE), the same license as the original XeroxDev plugin.

- Original copyright: Dominic "XeroxDev" Ris (2021)
- This fork: YTMD-MonstarDeck contributors (2026)

You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, provided the copyright notice and permission notice in [LICENSE](LICENSE) are included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
