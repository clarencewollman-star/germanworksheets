# German Worksheets

Browser-based German handwriting, flashcards, crossword, word search, sound blending, text conversion, and packet generators.

The maintained website is in `outputs/`. The individual generators and Packet Builder share `outputs/assets/`; update that source once. Downloaded PDFs and historical scratch work are excluded from Git and Docker.

The interface uses AdminLTE 4.10.0, with its CSS, JavaScript, and MIT license bundled in `outputs/assets/` for offline use. Shared navigation and styling live in `app-shell.js` and `app-theme.css`. Source: https://adminlte.io/ and https://www.npmjs.com/package/admin-lte/v/4.10.0.

## Run with Docker

After the GitHub Actions build succeeds:

```sh
docker run -d --name germanworksheets --restart unless-stopped -p 8080:80 ghcr.io/clarencewollman-star/germanworksheets:latest
```

Open http://localhost:8080 on the Docker host. From another computer, use the host's address and port 8080.

GitHub may initially make the container package private. To allow pulls without signing in, change the package visibility to public in the package settings. Otherwise authenticate to ghcr.io with an account that can read the package.

## Build locally

```sh
docker compose up -d --build
```

## Update a server

From a checkout of this repository:

```sh
docker compose pull
docker compose up -d --no-build
```

## Update the website

After editing JS/CSS or changing the version, run `node scripts/stamp-version.cjs` to refresh local previews. Maintain only the source files in `outputs/assets/`; `assets/generated/` is generated and ignored by Git. Docker builds regenerate these files automatically. HTML must revalidate on refresh, hashed assets may be cached for a year, and open pages check for a new release every five minutes or when brought back into view. Reloading is always the user's choice.

Edit the existing files in `outputs/`, then commit and push to `main`. The Docker workflow checks JavaScript, builds the image, verifies every served HTML/JS/CSS file, and publishes `latest` and a commit-specific tag to GitHub Container Registry. A server needs to pull and restart to use a new image.

The site can also be opened locally using `outputs/index.html`. No server stores worksheet text; generation happens in the browser.

## Fonts

The embedded handwriting and Fraktur fonts retain their original ownership and licensing; the repository's software license does not relicense third-party fonts.
